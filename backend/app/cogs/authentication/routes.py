from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from app.cogs.get_db import get_db
from app.cogs import models, auth
from app.cogs.system_settings import models as settings_models
from app.cogs.admin_panel import audit_logger  # זה הקובץ שמכיל את log_action
from app.cogs.admin_panel.admin_guard import require_admin
from datetime import datetime
from app.configurations.config import FULL_FRONEND_URL
import requests
import uuid

router = APIRouter(tags=["SSO Login"])

@router.get("/sso/login")
def sso_login(db: Session = Depends(get_db)):
    settings = db.query(settings_models.SystemSettings).first()

    if not settings or not settings.oidc_discovery_url:
        return RedirectResponse(url=f"{FULL_FRONEND_URL}/login?error=sso_not_configured")

    try:
        discovery = requests.get(settings.oidc_discovery_url, timeout=5)
        discovery.raise_for_status()
        data = discovery.json()
        auth_url = data["authorization_endpoint"]
    except Exception:
        return RedirectResponse(url=f"{FULL_FRONEND_URL}/login?error=sso_not_configured")

    state = str(uuid.uuid4())
    redirect_url = (
        f"{auth_url}"
        f"?client_id={settings.oidc_client_id}"
        f"&response_type={settings.oidc_response_type}"
        f"&scope={settings.oidc_scopes}"
        f"&redirect_uri={settings.oidc_redirect_uri}"
        f"&state={state}"
    )
    return RedirectResponse(url=redirect_url)

@router.get("/auth/callback")
def sso_callback(code: str, state: str, db: Session = Depends(get_db)):
    settings = db.query(settings_models.SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=500, detail="SSO settings not configured")

    # Fetch OIDC endpoints
    try:
        discovery = requests.get(settings.oidc_discovery_url, timeout=5).json()
        token_url = discovery["token_endpoint"]
        userinfo_url = discovery["userinfo_endpoint"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch discovery document: {e}")

    # Exchange code for token
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.oidc_redirect_uri,
        "client_id": settings.oidc_client_id,
        "client_secret": settings.oidc_client_secret,
    }

    try:
        token_resp = requests.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=5)
        token_resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("❌ Token request failed")
        if e.response is not None:
            print("🔍 Response content:", e.response.text)
        raise HTTPException(status_code=400, detail="Token exchange failed")

    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access_token returned")

    # Get user info
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        userinfo = requests.get(userinfo_url, headers=headers, timeout=5).json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch userinfo: {e}")

    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="User info missing email")

    # Check or create user
    user = db.query(models.User).filter(models.User.email == email).first()
    is_new_user = False

    if not user:
        user = models.User(
            email=email,
            password_hash="sso_authenticated",
            role="user",
            is_superadmin=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    user.last_login = datetime.utcnow()
    db.commit()

    # Log new user creation (with 'system' as the actor)
    if is_new_user:
        audit_logger.log_action(
            db=db,
            action="SSO משתמש חדש נוצר באמצעות",
            performed_by=settings.oidc_name,
            details=user.email + " :המשתמש שנוצר הוא",
        )

    local_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    frontend_redirect = f"{FULL_FRONEND_URL}/sso-success?token={local_token}"
    return RedirectResponse(frontend_redirect)