import time
import threading
import requests
import logging
from sqlalchemy.orm import Session
from app.cogs.system_settings import models as settings_models
from app.cogs.dashboard import schemas as dashboard_schemas
from app.cogs.database import SessionLocal
from app.configurations.config import ALERTS_CHECK_TIME
from colorama import Fore, Style

logging.basicConfig(level=logging.INFO)

def send_telegram(message: str, token: str, chat_id: str):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": message}
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        logging.info("📩 Alert Sent To Telegram")
    except Exception as e:
        logging.error("❌ Error Sending Alert To Telegram: %s", e)

def send_discord(message: str, bot_token: str, channel_id: str):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {
        "Authorization": f"Bot {bot_token}",
        "Content-Type": "application/json"
    }
    payload = {"content": message}
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        logging.info("📩 Alert Sent To Discord")
    except Exception as e:
        logging.error("❌ Error Sending Alert To Discord: %s", e)

def monitor_loop():
    while True:
        logging.info(f"{Fore.YELLOW} 🔄 Searching For Alerts... {Style.RESET_ALL}")
        db: Session = SessionLocal()
        try:
            settings = db.query(settings_models.SystemSettings).first()
            alert_settings = db.query(dashboard_schemas.AlertSettings).first()

            if not settings or not settings.proxmox_host:
                logging.warning("⚠️ Proxmox settings do not exist. Skip.")
                time.sleep(ALERTS_CHECK_TIME)
                continue

            host = settings.proxmox_host.strip().replace("https://", "").replace("http://", "")
            base_url = f"https://{host}/api2/json"
            token = f"PVEAPIToken={settings.proxmox_token_id}={settings.proxmox_token_secret}"
            headers = {"Authorization": token}

            nodes_resp = requests.get(f"{base_url}/nodes", headers=headers, verify=False, timeout=5)
            nodes_resp.raise_for_status()
            nodes = nodes_resp.json().get("data", [])

            for node in nodes:
                node_name = node["node"]
                cpu = node.get("cpu", 0)
                mem = node.get("mem", 0)
                maxmem = node.get("maxmem", 0)

                disk_used_total = 0
                disk_total_total = 0
                try:
                    storages_resp = requests.get(f"{base_url}/nodes/{node_name}/storage", headers=headers, verify=False, timeout=5)
                    storages_resp.raise_for_status()
                    storages = storages_resp.json().get("data", [])

                    for storage in storages:
                        storage_id = storage["storage"]
                        try:
                            status_resp = requests.get(
                                f"{base_url}/nodes/{node_name}/storage/{storage_id}/status",
                                headers=headers, verify=False, timeout=5
                            )
                            status_resp.raise_for_status()
                            status_data = status_resp.json().get("data", {})
                            disk_used_total += status_data.get("used", 0)
                            disk_total_total += status_data.get("total", 0)
                        except:
                            continue
                except:
                    pass

                logging.info(f"📊 Node {node_name} stats: CPU={cpu}, MEM={mem}/{maxmem}, DISK={disk_used_total}/{disk_total_total}")

                alerts_to_send = []
                cpu_threshold = (settings.cpu_threshold or 90) / 100.0
                ram_threshold = (settings.ram_threshold or 90) / 100.0
                disk_threshold = (settings.disk_threshold or 85) / 100.0

                if alert_settings.cpu_alert and cpu > cpu_threshold:
                    alerts_to_send.append(f"⚠️ {cpu*100:.1f}% :אחוזים ,{node_name} :בשרת CPU-שימוש גבוה ב")

                if alert_settings.ram_alert and maxmem > 0 and (mem / maxmem) > ram_threshold:
                    alerts_to_send.append(f"⚠️ {(mem / maxmem)*100:.1f}% :אחוזים ,{node_name} :בשרת RAM-שימוש גבוה ב")

                if alert_settings.disk_alert and disk_total_total > 0 and (disk_used_total / disk_total_total) > disk_threshold:
                    alerts_to_send.append(f"⚠️ {(disk_used_total / disk_total_total)*100:.1f}% :אחוזים ,{node_name} :שטח דיסק כמעט מלא בשרת")

                for alert in alerts_to_send:
                    logging.info(f"{Fore.RED} 🚨 Alert: {alert}{Style.RESET_ALL}")
                    if settings.discord_enabled and settings.discord_bot_token and settings.discord_channel_id:
                        send_discord(alert, settings.discord_bot_token, settings.discord_channel_id)
                    if settings.telegram_enabled and settings.telegram_bot_token and settings.telegram_chat_id:
                        send_telegram(alert, settings.telegram_bot_token, settings.telegram_chat_id)

            logging.info(f"{Fore.GREEN} ✅ Alerts Checked. Wait for the next 10 minutes. {Style.RESET_ALL}")
        except Exception as e:
            logging.error(f"{Fore.RED} [ERROR] While testing: {e}{Style.RESET_ALL}")
        finally:
            db.close()

        time.sleep(ALERTS_CHECK_TIME)  # Check every ALERTS_CHECK_TIME seconds

def start_monitoring():
    threading.Thread(target=monitor_loop, daemon=True).start()