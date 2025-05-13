from sqlalchemy import Column, Boolean, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class AlertSettings(Base):
    __tablename__ = "alert_settings"

    id = Column(Integer, primary_key=True, index=True)
    cpu_alert = Column(Boolean, default=False)
    ram_alert = Column(Boolean, default=False)
    disk_alert = Column(Boolean, default=False)
