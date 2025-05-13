from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.cogs.get_db import get_db
from app.cogs.system_settings import models as settings_models
from app.cogs.dashboard import schemas as dashboard_schemas
import requests

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/proxmox-status")
def get_proxmox_status(db: Session = Depends(get_db)):
    settings = db.query(settings_models.SystemSettings).first()
    if not settings or not settings.proxmox_host:
        raise HTTPException(status_code=400, detail="Proxmox settings not configured")

    host = settings.proxmox_host.strip().replace("https://", "").replace("http://", "")
    base_url = f"https://{host}/api2/json"
    token = f"PVEAPIToken={settings.proxmox_token_id}={settings.proxmox_token_secret}"
    headers = {"Authorization": token}

    try:
        nodes_resp = requests.get(f"{base_url}/nodes", headers=headers, verify=False, timeout=5)
        nodes_resp.raise_for_status()
        nodes = nodes_resp.json()["data"]

        result = []

        for node in nodes:
            node_name = node["node"]

            cpu_percent = round(node.get("cpu", 0) * 100, 1)
            mem_used = round(node.get("mem", 0) / 1024**3, 1)
            mem_total = round(node.get("maxmem", 0) / 1024**3, 1)

            # איסוף סטטיסטיקות דיסק מכל ה־storages
            disk_used_total = 0
            disk_total_total = 0
            try:
                storages_resp = requests.get(f"{base_url}/nodes/{node_name}/storage", headers=headers, verify=False, timeout=5)
                storages_resp.raise_for_status()
                storages = storages_resp.json()["data"]

                for storage in storages:
                    storage_id = storage["storage"]
                    try:
                        status_resp = requests.get(
                            f"{base_url}/nodes/{node_name}/storage/{storage_id}/status",
                            headers=headers,
                            verify=False,
                            timeout=5
                        )
                        status_resp.raise_for_status()
                        status_data = status_resp.json()["data"]
                        disk_used_total += status_data.get("used", 0)
                        disk_total_total += status_data.get("total", 0)
                    except:
                        continue  # יתכן ש־storage לא מחזיר סטטיסטיקות

            except:
                pass  # fallback יהיה למידע בסיסי מה־node

            disk_used = round(disk_used_total / 1024**3, 1)
            disk_total = round(disk_total_total / 1024**3, 1)

            # משיכת VM ו־CT
            vms_resp = requests.get(f"{base_url}/nodes/{node_name}/qemu", headers=headers, verify=False, timeout=5)
            vms_resp.raise_for_status()
            vms = vms_resp.json()["data"]
            for vm in vms:
                vm["type"] = "qemu"

            cts_resp = requests.get(f"{base_url}/nodes/{node_name}/lxc", headers=headers, verify=False, timeout=5)
            cts_resp.raise_for_status()
            cts = cts_resp.json()["data"]
            for ct in cts:
                ct["type"] = "lxc"

            all_guests = vms + cts

            vms_info = []
            for guest in all_guests:
                vm_id = guest["vmid"]
                vm_name = guest.get("name", f"VM-{vm_id}")
                status = guest["status"]
                guest_type = guest["type"]

                if status == "running":
                    stats_resp = requests.get(
                        f"{base_url}/nodes/{node_name}/{guest_type}/{vm_id}/status/current",
                        headers=headers,
                        verify=False,
                        timeout=5
                    )
                    stats_resp.raise_for_status()
                    stats = stats_resp.json()["data"]

                    cpu = stats.get("cpu", 0)
                    mem_used_vm = round(stats.get("mem", 0) / 1024**3, 1)
                    mem_total_vm = round(stats.get("maxmem", 0) / 1024**3, 1)
                    disk_used_vm = round(stats.get("disk", 0) / 1024**3, 1)
                    disk_total_vm = round(stats.get("maxdisk", 0) / 1024**3, 1)

                    vms_info.append({
                        "name": vm_name,
                        "status": status,
                        "type": guest_type,
                        "cpu": cpu,
                        "ram": {"used": mem_used_vm, "total": mem_total_vm},
                        "disk": {"used": disk_used_vm, "total": disk_total_vm}
                    })
                else:
                    vms_info.append({
                        "name": vm_name,
                        "status": status,
                        "type": guest_type
                    })

            result.append({
                "node": node_name,
                "stats": {
                    "cpu": cpu_percent,
                    "ram": {"used": mem_used, "total": mem_total},
                    "disk": {"used": disk_used, "total": disk_total},
                },
                "vms": vms_info
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/alerts")
def get_alert_settings(db: Session = Depends(get_db)):
    settings = db.query(dashboard_schemas.AlertSettings).first()
    if not settings:
        settings = dashboard_schemas.AlertSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "cpu": settings.cpu_alert,
        "ram": settings.ram_alert,
        "disk": settings.disk_alert
    }

@router.put("/alerts")
def update_alert_settings(payload: dict, db: Session = Depends(get_db)):
    settings = db.query(dashboard_schemas.AlertSettings).first()
    if not settings:
        settings = dashboard_schemas.AlertSettings()
        db.add(settings)
    settings.cpu_alert = payload.get("cpu", settings.cpu_alert)
    settings.ram_alert = payload.get("ram", settings.ram_alert)
    settings.disk_alert = payload.get("disk", settings.disk_alert)
    db.commit()
    return {"status": "updated"}