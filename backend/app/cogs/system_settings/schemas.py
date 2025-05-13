from pydantic import BaseModel
from typing import Optional

class SystemSettingsBase(BaseModel):
    # Telegram
    telegram_bot_token: Optional[str] = None
    telegram_api_id: Optional[str] = None
    telegram_api_hash: Optional[str] = None
    telegram_chat_id: Optional[str] = None

    # Discord
    discord_bot_token: Optional[str] = None
    discord_guild_id: Optional[str] = None
    discord_channel_id: Optional[str] = None

    # Enable/Disable Notifications
    telegram_enabled: bool = False
    discord_enabled: bool = False

    # Proxmox
    proxmox_host: Optional[str] = None
    proxmox_token_id: Optional[str] = None
    proxmox_token_secret: Optional[str] = None

    # SSO
    oidc_name: Optional[str] = None
    oidc_client_id: Optional[str] = None
    oidc_client_secret: Optional[str] = None
    oidc_discovery_url: Optional[str] = None
    oidc_redirect_uri: Optional[str] = None
    oidc_scopes: Optional[str] = None
    oidc_response_type: Optional[str] = None

    # Thresholds
    cpu_threshold: Optional[int] = 90
    ram_threshold: Optional[int] = 90
    disk_threshold: Optional[int] = 85

class SystemSettingsCreate(SystemSettingsBase):
    pass

class SystemSettingsResponse(SystemSettingsBase):
    id: int

    class Config:
        from_attributes = True  # ← שימוש ב־Pydantic v2 במקום orm_mode

class TelegramSettingsTest(BaseModel):
    bot_token: str
    api_id: str
    api_hash: str
    chat_id: str

class DiscordSettingsTest(BaseModel):
    bot_token: str
    guild_id: str
    channel_id: str

class SystemSettingsFullResponse(SystemSettingsResponse):
    cpu_alert: bool = False
    ram_alert: bool = False
    disk_alert: bool = False