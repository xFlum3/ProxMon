from sqlalchemy import Column, Integer, String, Boolean
from app.cogs.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Telegram
    telegram_bot_token = Column(String, nullable=True)
    telegram_api_id = Column(String, nullable=True)
    telegram_api_hash = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)

    # Discord
    discord_bot_token = Column(String, nullable=True)
    discord_guild_id = Column(String, nullable=True)
    discord_channel_id = Column(String, nullable=True)

    # Enable/Disable Notifications
    telegram_enabled = Column(Boolean, default=False)
    discord_enabled = Column(Boolean, default=False)

    # Proxmox
    proxmox_host = Column(String, nullable=True)
    proxmox_token_id = Column(String, nullable=True)
    proxmox_token_secret = Column(String, nullable=True)

    # SSO
    oidc_name = Column(String, nullable=True)
    oidc_client_id = Column(String, nullable=True)
    oidc_client_secret = Column(String, nullable=True)
    oidc_discovery_url = Column(String, nullable=True)
    oidc_redirect_uri = Column(String, nullable=True)
    oidc_scopes = Column(String, nullable=True)
    oidc_response_type = Column(String, nullable=True)

    # Thresholds
    cpu_threshold = Column(Integer, default=90)
    ram_threshold = Column(Integer, default=90)
    disk_threshold = Column(Integer, default=85)