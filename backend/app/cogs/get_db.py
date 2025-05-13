from app.cogs import database

# דפנדנסי שמחזיר Session לכל בקשה
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()