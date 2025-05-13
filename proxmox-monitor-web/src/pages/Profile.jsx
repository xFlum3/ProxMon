import Layout from "../components/Layout";
import {
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useState, useEffect } from "react";
import config from "../config";
import { jwtDecode } from "jwt-decode";

function Profile() {
  const [selectedAction, setSelectedAction] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role?.toUpperCase() || "USER");

      fetch(`${config.apiBaseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          setUserInfo(data);
        });
    } catch (error) {
      console.error("שגיאה בקריאת הטוקן:", error);
    }
  }, []);

  const handleBack = () => {
    setSelectedAction(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${config.apiBaseUrl}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "שגיאה בשינוי הסיסמה");
      } else {
        setSuccess("הסיסמה שונתה בהצלחה");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      setError("שגיאה בחיבור לשרת");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${config.apiBaseUrl}/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        const data = await response.json();
        alert(data.detail || "שגיאה במחיקת החשבון");
      }
    } catch (error) {
      alert("שגיאה בחיבור לשרת");
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Card style={{
          backgroundColor: "#2f3136",
          color: "#dcddde",
          width: "420px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          borderRadius: "12px",
          padding: "20px"
        }}>
          <CardContent>
            {!selectedAction && (
              <>
                <Typography
                  variant="h5"
                  style={{
                    fontFamily: "Almoni Tzar",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "10px"
                  }}
                >
                  :הגדרות משתמש ⚙️
                </Typography>

                {/* ✨ הוספה של שורה לסוג המשתמש */}
                <Typography
                  variant="body1"
                  style={{
                    fontFamily: "Almoni Tzar",
                    textAlign: "center",
                    marginBottom: "20px",
                    color: "#b9bbbe"
                  }}
                >
                  {/* סוג משתמש: {userRole === "ADMIN" ? "מנהל 👨🏻‍💼" : "משתמש רגיל 🙍🏻‍♂️"} */}
                  סוג משתמש: {userInfo?.is_superadmin
  ? "סופר אדמין 👑"
  : userRole === "ADMIN"
  ? "מנהל 👨🏻‍💼"
  : "משתמש רגיל 🙍🏻‍♂️"}
                </Typography>
                {/* ✨ הצגת פרטי משתמש נוספים */}
                {userInfo && (
                  <div style={{ marginBottom: "20px", marginTop: "-15px" }}>
                    <Typography
                      variant="body1"
                      style={{ fontFamily: "Almoni Tzar", color: "#b9bbbe", textAlign: "center" }}
                    >
                      המשתמש נוצר בתאריך: {new Date(userInfo.created_at).toLocaleString("he-IL")} 📅
                    </Typography>
                    <Typography
                      variant="body1"
                      style={{ fontFamily: "Almoni Tzar", color: "#b9bbbe", textAlign: "center" }}
                    >
                      התחברות אחרונה: {userInfo.last_login ? new Date(userInfo.last_login).toLocaleString("he-IL") : "—"} ⌛
                    </Typography>
                  </div>
                )}
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    onClick={() => setSelectedAction("change-password")}
                    style={{ fontFamily: "Almoni Tzar", backgroundColor: "#5865f2", fontWeight: "bold" }}
                  >
                    שנה סיסמה 🔐
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenDeleteDialog(true)}
                    style={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", fontWeight: "bold" }}
                  >
                    מחיקת חשבון 🗑️
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => { localStorage.removeItem("token"); window.location.href = "/" }}
                    style={{ fontFamily: "Almoni Tzar", color: "#ed4245", borderColor: "#ed4245", fontWeight: "bold" }}
                  >
                    התנתק מהחשבון ⏻
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => window.location.href = "/dashboard"}
                    style={{
                      fontFamily: "Almoni Tzar",
                      color: "#43b581",
                      borderColor: "#43b581",
                      fontWeight: "bold"
                    }}
                  >
                    חזור לעמוד הראשי 🏠︎
                  </Button>
                </Stack>
              </>
            )}

            {/* שינוי סיסמה */}
            {selectedAction === "change-password" && (
              <>
                <Typography
                  variant="h6"
                  style={{
                    fontFamily: "Almoni Tzar",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "20px"
                  }}
                >
                  :שינוי סיסמה 🗝️
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="סיסמה נוכחית"
                    type="password"
                    variant="outlined"
                    fullWidth
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    InputProps={{ style: { color: "#dcddde" } }}
                    InputLabelProps={{ style: { color: "#dcddde" } }}
                  />
                  <TextField
                    label="סיסמה חדשה"
                    type="password"
                    variant="outlined"
                    fullWidth
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    InputProps={{ style: { color: "#dcddde" } }}
                    InputLabelProps={{ style: { color: "#dcddde" } }}
                  />
                  <TextField
                    label="אימות סיסמה חדשה"
                    type="password"
                    variant="outlined"
                    fullWidth
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    InputProps={{ style: { color: "#dcddde" } }}
                    InputLabelProps={{ style: { color: "#dcddde" } }}
                  />
                  {error && <Typography style={{ color: "red", fontFamily: "Almoni Tzar", textAlign: "center" }}>{error}</Typography>}
                  {success && <Typography style={{ color: "lightgreen", fontFamily: "Almoni Tzar", textAlign: "center" }}>{success}</Typography>}

                  <Button
                    variant="contained"
                    onClick={handlePasswordChange}
                    style={{ fontFamily: "Almoni Tzar", backgroundColor: "#5865f2", fontWeight: "bold" }}
                  >
                    שנה סיסמה 🗝️
                  </Button>
                  <Button
                    onClick={handleBack}
                    style={{ fontFamily: "Almoni Tzar", textTransform: "none", color: "#dcddde" }}
                  >
                    חזור להגדרות ➜
                  </Button>
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🔥 Dialog למחיקת חשבון */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle
          style={{
            fontFamily: "Almoni Tzar",
            backgroundColor: "#23272a",
            color: "#dcddde",
            textAlign: "center"
          }}
        >
          ?האם אתה בטוח שברצונך למחוק את החשבון 🗑️
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#2f3136" }}>
          <Typography
            style={{
              fontFamily: "Almoni Tzar",
              color: "#dcddde",
              textAlign: "center"
            }}
          >
            .שים לב שמחיקת החשבון היא פעולה בלתי הפיכה, כל המידע הקשור לחשבון שלך יימחק לצמיתות
          </Typography>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            style={{
              fontFamily: "Almoni Tzar",
              backgroundColor: "#ed4245",
              color: "white",
              fontWeight: "bold",
              marginRight: "10px"
            }}
          >
            לא ✖
          </Button>
          <Button
            onClick={handleDeleteAccount}
            style={{
              fontFamily: "Almoni Tzar",
              backgroundColor: "#57f287",
              color: "white",
              fontWeight: "bold"
            }}
          >
            כן ✅
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Profile;