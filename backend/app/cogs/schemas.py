from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserInfo(BaseModel):
    email: str
    role: str
    is_superadmin: bool  # ← שדה שחסר אצלך!
    created_at: datetime
    last_login: Optional[datetime] = None

class UserAdminView(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool  # ← לוודא שזה קיים
    is_superadmin: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True  # ← נדרש ב־Pydantic v2 במקום orm_mode

class ResetPasswordRequest(BaseModel):
    new_password: str

class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "user"

class AuditLogEntry(BaseModel):
    timestamp: datetime
    action: str
    performed_by: str
    details: str | None = None

    class Config:
        from_attributes = True