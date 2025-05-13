from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text  # הוספת Boolean
from datetime import datetime
from app.cogs.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")

    is_active = Column(Boolean, default=True)  # 🔥 הוספה נדרשת
    is_superadmin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)
    performed_by = Column(String, nullable=False)  # או Email או User ID
    details = Column(Text, nullable=True)