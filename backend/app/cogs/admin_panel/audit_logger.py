from sqlalchemy.orm import Session
from app.cogs.models import AuditLog

def log_action(db: Session, action: str, performed_by: str, details: str = None):
    log_entry = AuditLog(action=action, performed_by=performed_by, details=details)
    db.add(log_entry)
    db.commit()