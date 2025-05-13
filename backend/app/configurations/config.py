from fastapi.security import OAuth2PasswordBearer

MACHINE_INTERNAL_IP = "<YOUR-IP>"

#Backend Configurations
Host_IP = MACHINE_INTERNAL_IP
Host_Port = 8000

#Frontend Configurations
Frontend_IP = MACHINE_INTERNAL_IP
Frontend_Port = 5173
FULL_FRONEND_URL = f"http://{Frontend_IP}:{Frontend_Port}"

#Default Admin User Credentials
admin_email = "admin"
admin_password = "admin"

#JWT Secret Key
SECRET_KEY = "hvmWZy7FMh!@#XX"  # כדאי להחליף לסוד אמיתי!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

#Alerts
ALERTS_CHECK_TIME = 600  # in seconds