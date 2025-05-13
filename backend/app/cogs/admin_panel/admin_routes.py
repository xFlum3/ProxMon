from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.cogs import models, schemas, auth
from app.cogs.get_db import get_db
from app.cogs.admin_panel.admin_guard import require_admin
from app.cogs.schemas import ResetPasswordRequest
from typing import List
import csv
from io import StringIO

router = APIRouter(prefix="/admin", tags=["Admin"])

def validate_action(current_user: models.User, target_user: models.User):
    if target_user.is_superadmin:
        raise HTTPException(status_code=403, detail="אין אפשרות לבצע פעולה על סופר אדמין")

    if target_user.role == "admin" and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="רק סופר אדמין יכול לבצע פעולה על מנהלים אחרים")

def log_action(db: Session, performed_by: str, action: str, details: str = None):
    log = models.AuditLog(performed_by=performed_by, action=action, details=details)
    db.add(log)
    db.commit()

@router.post("/users", response_model=schemas.UserAdminView)
def create_user(
    user_data: schemas.CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    if db.query(models.User).filter_by(email=user_data.email).first():
        raise HTTPException(status_code=400, detail="המשתמש כבר קיים")

    if user_data.role == "admin" and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="רק סופר אדמין יכול ליצור משתמש אדמין")

    new_user = models.User(
        email=user_data.email,
        password_hash=auth.get_password_hash(user_data.password),
        role=user_data.role if user_data.role in ["user", "admin"] else "user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, current_user.email, "יצירת משתמש", f"{new_user.role} נוצר משתמש: {new_user.email} עם הרשאה")

    return new_user

@router.put("/users/{user_id}/change-role")
def change_user_role(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")

    validate_action(current_user, user)

    old_role = user.role
    user.role = "user" if user.role == "admin" else "admin"
    db.commit()

    role_display = {
    "user": "משתמש רגיל",
    "admin": "מנהל"
    }
    old_role_he = role_display.get(old_role, old_role)
    new_role_he = role_display.get(user.role, user.role)
    log_action(db, current_user.email, "שינוי הרשאה", f"{user.email} מ-{old_role_he} ל-{new_role_he} בוצע על המשתמש")

    return {"detail": "הרשאה שונתה בהצלחה", "new_role": user.role}

@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")

    validate_action(current_user, user)

    user.is_active = not user.is_active
    db.commit()

    log_action(db, current_user.email, "שינוי סטטוס", f"{user.email} -> {'פעיל' if user.is_active else 'לא פעיל'}")

    return {"detail": "סטטוס עודכן", "is_active": user.is_active}

@router.put("/users/{user_id}/reset-password")
def reset_password(
    user_id: int,
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")

    validate_action(current_user, user)

    user.password_hash = auth.get_password_hash(data.new_password)
    db.commit()

    log_action(db, current_user.email, "איפוס סיסמה", f"בוצע איפוס עבור {user.email}")

    return {"detail": "סיסמה אופסה בהצלחה"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")

    validate_action(current_user, user)

    db.delete(user)
    db.commit()

    log_action(db, current_user.email, "מחיקת משתמש", f"{user.email}")

    return {"detail": "המשתמש נמחק בהצלחה"}

@router.get("/audit-log", response_model=List[schemas.AuditLogEntry])
def get_audit_log(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

@router.delete("/audit-log/clear")
def clear_audit_log(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    if not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="רק סופר אדמין יכול לאפס את הלוגים")
    
    db.query(models.AuditLog).delete()
    db.commit()
    return {"detail": "הלוגים אופסו בהצלחה"}

@router.get("/audit-log/export")
def export_audit_log_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

    output = StringIO()
    # כתיבת BOM עבור תמיכה בעברית ב-Excel
    output.write('\ufeff')

    writer = csv.writer(output)
    writer.writerow(["timestamp", "action", "performed_by", "details"])

    for log in logs:
        writer.writerow([
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            log.action,
            log.performed_by,
            log.details or ""
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=audit_logs.csv"
    })