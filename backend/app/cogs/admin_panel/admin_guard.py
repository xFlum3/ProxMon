from fastapi import Depends, HTTPException, status
from app.cogs.get_current_user import get_current_user
from app.cogs.models import User

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not (current_user.role.lower() == "admin" or current_user.is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="אין לך הרשאות גישה לאזור זה",
        )
    return current_user