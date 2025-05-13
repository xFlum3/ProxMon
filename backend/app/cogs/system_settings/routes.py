import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.cogs.get_db import get_db
from app.cogs.system_settings import models as sys_models
from app.cogs.system_settings import schemas as sys_schemas
from app.cogs.dashboard import schemas as dashboard_schemas
from app.cogs import models  # בשביל AuditLog ו־User
from app.cogs.admin_panel.admin_guard import require_admin
from app.cogs.admin_panel import audit_logger  # זה הקובץ שמכיל את log_action
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

router = APIRouter(prefix="/settings", tags=["System Settings"])

@router.get("/", response_model=sys_schemas.SystemSettingsFullResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        settings = sys_models.SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    alert_settings = db.query(dashboard_schemas.AlertSettings).first()
    if not alert_settings:
        cpu_alert = False
        ram_alert = False
        disk_alert = False
    else:
        cpu_alert = alert_settings.cpu_alert
        ram_alert = alert_settings.ram_alert
        disk_alert = alert_settings.disk_alert

    return {
        **settings.__dict__,
        "cpu_alert": cpu_alert,
        "ram_alert": ram_alert,
        "disk_alert": disk_alert
    }

@router.put("/", response_model=sys_schemas.SystemSettingsResponse)
def update_settings(
    data: sys_schemas.SystemSettingsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        settings = sys_models.SystemSettings()
        db.add(settings)

    # עדכון רק של שדות התראות – שדות PROXMOX נשארים כמו שהם
    settings.telegram_bot_token = data.telegram_bot_token
    settings.telegram_api_id = data.telegram_api_id
    settings.telegram_api_hash = data.telegram_api_hash
    settings.telegram_chat_id = data.telegram_chat_id
    settings.telegram_enabled = data.telegram_enabled

    settings.discord_bot_token = data.discord_bot_token
    settings.discord_guild_id = data.discord_guild_id
    settings.discord_channel_id = data.discord_channel_id
    settings.discord_enabled = data.discord_enabled

    settings.cpu_threshold = data.cpu_threshold
    settings.ram_threshold = data.ram_threshold
    settings.disk_threshold = data.disk_threshold

    db.commit()
    db.refresh(settings)

    audit_logger.log_action(
        db=db,
        action="עדכון הגדרות מערכת",
        performed_by=current_user.email,
        details="בלבד Telegram/Discord עודכנו שדות"
    )

    return settings

@router.delete("/")
def reset_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="הגדרות לא קיימות למחיקה")

    # איפוס שדות של התראות (טלגרם + דיסקורד)
    settings.telegram_bot_token = None
    settings.telegram_api_id = None
    settings.telegram_api_hash = None
    settings.telegram_chat_id = None
    settings.telegram_enabled = False

    settings.discord_bot_token = None
    settings.discord_guild_id = None
    settings.discord_channel_id = None
    settings.discord_enabled = False

    db.commit()

    # 🔒 תיעוד בלוג
    audit_logger.log_action(
        db=db,
        action="איפוס הגדרות מערכת",
        performed_by=current_user.email,
        details="אופסו (Telegram/Discord) שדות ההתראות"
    )

    return {"message": "הגדרות ההתראות אופסו בהצלחה"}

@router.put("/proxmox", response_model=sys_schemas.SystemSettingsResponse)
def update_proxmox_settings(
    data: sys_schemas.SystemSettingsBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="הגדרות מערכת לא קיימות")

    settings.proxmox_host = data.proxmox_host
    settings.proxmox_token_id = data.proxmox_token_id
    settings.proxmox_token_secret = data.proxmox_token_secret

    db.commit()
    db.refresh(settings)

    audit_logger.log_action(
        db=db,
        action="Proxmox עדכון הגדרות",
        performed_by=current_user.email,
        details="Proxmox-הוגדרו ערכים חדשים ל"
    )

    return settings

@router.delete("/proxmox")
def reset_proxmox_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="הגדרות מערכת לא קיימות")

    settings.proxmox_host = None
    settings.proxmox_token_id = None
    settings.proxmox_token_secret = None

    db.commit()

    audit_logger.log_action(
        db=db,
        action="איפוס הגדרות Proxmox",
        performed_by=current_user.email,
        details="אופסו Proxmox-כל הגדרות ה"
    )

    return {"message": "ההגדרות של Proxmox אופסו בהצלחה"}

@router.post("/proxmox/test")
def test_proxmox_connection(
    data: sys_schemas.SystemSettingsBase,
    current_user: models.User = Depends(require_admin)
):
    import requests

    # ודא שה-Host לא כולל https://
    host = data.proxmox_host.strip().replace("https://", "").replace("http://", "")
    url = f"https://{host}/api2/json/nodes"

    headers = {
        "Authorization": f"PVEAPIToken={data.proxmox_token_id}={data.proxmox_token_secret}"
    }

    try:
        response = requests.get(url, headers=headers, verify=False, timeout=5)
        response.raise_for_status()
        return {"message": "✔️ החיבור הצליח"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/telegram/test")
def test_telegram_connection(
    data: sys_schemas.TelegramSettingsTest,
    current_user: models.User = Depends(require_admin)
):

    url = f"https://api.telegram.org/bot{data.bot_token}/sendMessage"
    payload = {
        "chat_id": data.chat_id,
        "text": "🛠️ בדיקת חיבור מהמערכת הצליחה!"
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        return {"message": "החיבור לטלגרם תקין"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/discord/test")
def test_discord_connection(
    data: sys_schemas.DiscordSettingsTest,
    current_user: models.User = Depends(require_admin)
):
    import requests

    headers = {
        "Authorization": f"Bot {data.bot_token}",
        "Content-Type": "application/json"
    }

    # 1. בדיקת הטוקן
    try:
        user_resp = requests.get("https://discord.com/api/v10/users/@me", headers=headers, timeout=5)
        user_resp.raise_for_status()
    except Exception:
        raise HTTPException(status_code=400, detail="טוקן הדיסקורד שגוי או לא תקף")

    # 2. בדיקת שהבוט נמצא ב־Guild
    try:
        guild_resp = requests.get(f"https://discord.com/api/v10/guilds/{data.guild_id}", headers=headers, timeout=5)
        if guild_resp.status_code == 403:
            raise HTTPException(status_code=400, detail="⚠️ הבוט לא נמצא בשרת או אין לו הרשאה לגשת אליו")
        guild_resp.raise_for_status()
    except Exception:
        raise HTTPException(status_code=400, detail="שגיאה בגישה לשרת הדיסקורד")

    # 3. ניסיון לשלוח הודעה לבדיקה ל־Channel
    test_message = {
        "content": "🛠️ בדיקת חיבור מהמערכת הצליחה!"
    }

    try:
        send_resp = requests.post(
            f"https://discord.com/api/v10/channels/{data.channel_id}/messages",
            headers=headers,
            json=test_message,
            timeout=5
        )
        if send_resp.status_code == 403:
            raise HTTPException(status_code=400, detail="🚫 אין לבוט הרשאה לשלוח הודעות בערוץ הזה")
        send_resp.raise_for_status()
    except Exception:
        raise HTTPException(status_code=400, detail="ודא שהאיידי של הערוץ נכון ולבוט יש הרשאות לשלוח הודעות")

    return {"message": "החיבור לדיסקורד תקין, וההודעה נשלחה בהצלחה לערוץ"}

@router.put("/sso", response_model=sys_schemas.SystemSettingsResponse)
def update_sso_settings(
    data: sys_schemas.SystemSettingsBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        settings = sys_models.SystemSettings()
        db.add(settings)

    settings.oidc_name = data.oidc_name
    settings.oidc_client_id = data.oidc_client_id
    settings.oidc_client_secret = data.oidc_client_secret
    settings.oidc_discovery_url = data.oidc_discovery_url
    settings.oidc_redirect_uri = data.oidc_redirect_uri
    settings.oidc_scopes = data.oidc_scopes
    settings.oidc_response_type = data.oidc_response_type

    db.commit()
    db.refresh(settings)

    audit_logger.log_action(
        db=db,
        action="SSO עדכון הגדרות",
        performed_by=current_user.email,
        details="SSOעודכנו פרטי התחברות ל־"
    )

    return settings

@router.delete("/sso", status_code=204)
def reset_sso_settings(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    settings = db.query(sys_models.SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    # אפס רק את שדות ה־SSO
    settings.oidc_name = None
    settings.oidc_client_id = None
    settings.oidc_client_secret = None
    settings.oidc_discovery_url = None
    settings.oidc_redirect_uri = None
    settings.oidc_scopes = None
    settings.oidc_response_type = None

    db.commit()

    audit_logger.log_action(
        db=db,
        action="SSO איפוס הגדרות",
        performed_by=current_user.email,
        details="SSOאופסו פרטי התחברות ל־"
    )

    return

@router.post("/sso/test")
def test_sso_connection(
    data: sys_schemas.SystemSettingsBase,
    current_user: models.User = Depends(require_admin)
):
    import requests

    try:
        response = requests.get(data.oidc_discovery_url, timeout=5)
        response.raise_for_status()
        discovery_data = response.json()

        required_fields = ["authorization_endpoint", "token_endpoint", "userinfo_endpoint"]
        missing = [field for field in required_fields if field not in discovery_data]

        if missing:
            raise HTTPException(status_code=400, detail=f"שדות חסרים ב־discovery: {', '.join(missing)}")

        return {"message": "נשלף בהצלחה Discovery-תקין וה OIDC-החיבור ל ✔️"}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"{str(e)}")
    except ValueError:
        raise HTTPException(status_code=400, detail="התשובה מה־discovery URL אינה JSON תקף")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה כללית: {str(e)}")