import os
import sys
import platform
import subprocess
import logging
from datetime import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from colorama import Fore, Style

# פתרון לבעיה של 'No module named app'
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# COGS
from app.configurations.config import admin_email, admin_password, Host_IP, Host_Port
from app.cogs import models, database, schemas, auth
from app.cogs.get_db import get_db
from app.cogs.get_current_user import get_current_user
from app.cogs.schemas import UserAdminView
from app.cogs.admin_panel.admin_guard import require_admin
from app.cogs.admin_panel import admin_routes
from app.cogs.system_settings import routes as system_settings_routes
from app.cogs.system_settings import models as system_models
from app.cogs.authentication import routes as sso_routes
from app.cogs.dashboard import routes as dashboard_routes
from app.cogs.dashboard import schemas as dashboard_schemas
from app.cogs.dashboard.monitor_alerts import start_monitoring

logging.basicConfig(level=logging.INFO)

# FASTAPI lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # יצירת הטבלאות
    models.Base.metadata.create_all(bind=database.engine)
    system_models.Base.metadata.create_all(bind=database.engine)
    dashboard_schemas.Base.metadata.create_all(bind=database.engine)
    start_monitoring()

    # יצירת משתמש אדמין ברירת מחדל
    db = database.SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_user:
            new_admin = models.User(
                email=admin_email,
                password_hash=auth.get_password_hash(admin_password),
                role="admin",
                is_superadmin=True
            )
            db.add(new_admin)
            db.commit()
            logging.info(f"{Fore.GREEN}✅ Admin user created successfully!{Style.RESET_ALL}")
        else:
            logging.info(f"{Fore.YELLOW}ℹ️ Admin user already exists.{Style.RESET_ALL}")
    finally:
        db.close()
    
    yield

    # הפעלת React
    # try:
    #     # תיקון הנתיב כדי להגיע לתיקיית React שנמצאת מחוץ ל־backend
    #     frontend_path = os.path.abspath(os.path.join(project_root, "..", "proxmox-monitor-web"))
    #     if not os.path.isdir(frontend_path):
    #         raise FileNotFoundError(f"React folder not found at: {frontend_path}")

    #     npm_command = "npm.cmd" if platform.system() == "Windows" else "npm"
    #     subprocess.Popen([npm_command, "start"], cwd=frontend_path, shell=True)
    #     logging.info("🚀 React frontend started successfully.")
    # except Exception as e:
    #     logging.error(f"❌ Failed to start React frontend: {e}")

    # yield

# יצירת FastAPI App
app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(admin_routes.router)
app.include_router(system_settings_routes.router)
app.include_router(sso_routes.router)
app.include_router(dashboard_routes.router)

@app.post("/login", response_model=schemas.TokenResponse)
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_login.email).first()
    if not db_user or not auth.verify_password(user_login.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="אימייל או סיסמה שגויים")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="המשתמש הזה אינו פעיל יותר")
    db_user.last_login = datetime.utcnow()
    db.commit()
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token}

@app.get("/me", response_model=schemas.UserInfo)
def get_my_info(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="המשתמש לא פעיל")
    return {
        "email": current_user.email,
        "role": current_user.role,
        "is_superadmin": current_user.is_superadmin,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@app.post("/change-password")
def change_password(
    data: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="הסיסמה הנוכחית שגויה")
    current_user.password_hash = auth.get_password_hash(data.new_password)
    db.commit()
    return {"detail": "הסיסמה שונתה בהצלחה"}

@app.delete("/delete-account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return

@app.get("/admin/users", response_model=List[UserAdminView])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    return db.query(models.User).all()

# הרצה ידנית (כדי לעבוד עם `py main.py`)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=Host_IP, port=Host_Port, reload=True)