# השתמש בדימוי קל משקל של פייתון
FROM python:3.11-slim

# הגדרת תיקיית העבודה בתוך הקונטיינר
WORKDIR /app

# העתקת דרישות ההתקנה
COPY app/requirements.txt .

# התקנת ספריות פייתון מהדרישות
RUN pip install --no-cache-dir -r requirements.txt

# העתקת כל קבצי האפליקציה
COPY app ./app

# פתיחת פורט 8000 (כפי ש־FastAPI משתמש בו)
EXPOSE 8000

# פקודת ההרצה של FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]