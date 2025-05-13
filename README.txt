
# Proxmox Monitor – Docker Version 🐳

מערכת לניטור שרתי Proxmox עם ממשק Web מבוסס React + FastAPI, כולל תמיכה ב־SSO (Authentik).

---

## הגדרות חובה לפני הפעלה

### 1. הגדרת כתובת ה-IP של המכונה בקוד ה־Backend

ערוך את הקובץ הבא:

```
backend/app/configurations/config.py
```

ושנה את השורה הבאה לכתובת ה-IP הפנימית של השרת:

```python
MACHINE_INTERNAL_IP = "YOUR-IP"
```

---

### 2. הגדרת כתובת ה-IP של המכונה בקוד ה־Frontend

ערוך את הקובץ הבא:

```
proxmox-monitor-web/src/config.js
```

ושנה את השדות הבאים:

```js
apiBaseUrl: "http://YOUR-IP:8000", // כתובת ה-Backend
frontendBaseUrl: "http://YOUR-IP:3000", // כתובת ה-Frontend
```

---

## הרצת הפרויקט

להרצת הפרויקט:

```bash
docker compose up --build
```

לאחר ההפעלה:
- ממשק המשתמש יהיה זמין בכתובת: `http://<your-ip>:5173`
- ה-Backend (FastAPI) זמין בכתובת: `http://<your-ip>:8000/docs`

---

## הערה למשתמשי SSO (Authentik)

אם אתה משתמש ב־SSO דרך Authentik, יש לוודא כי כתובת ה־Redirect URI מוגדרת בדיוק כך:

```
http://<your-ip>:5173/sso/callback
```

כולל פרוטוקול (`http` או `https`) – אחרת תופיע שגיאת redirect_uri.

---
