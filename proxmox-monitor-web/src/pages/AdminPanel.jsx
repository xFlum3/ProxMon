import Layout from "../components/Layout";
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from "@mui/material";
import { useEffect, useState } from "react";
import config from "../config";
import { jwtDecode } from "jwt-decode";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [openClearLogDialog, setOpenClearLogDialog] = useState(false);

  const fetchUsers = () => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(setUsers)
      .catch((err) => console.error("שגיאה בשליפת משתמשים:", err));
  };

  const fetchAuditLogs = () => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/audit-log`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(setAuditLogs)
      .catch((err) => console.error("שגיאה בטעינת לוג השינויים:", err));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode(token);
    setCurrentUserEmail(decoded.sub);
    setCurrentUserRole(decoded.role?.toLowerCase() || "user");
    fetch(`${config.apiBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((userInfo) => setIsSuperadmin(userInfo.is_superadmin));
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: newUserEmail,
        password: newUserPassword,
        role: isSuperadmin ? newUserRole : "user"  // רק סופר אדמין יכול לקבוע role
      })
    })
      .then((res) => res.json())
      .then(() => {
        fetchUsers();
        setOpenCreateDialog(false);
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
      })
      .catch(() => alert("שגיאה ביצירת משתמש"));
  };

  const handleResetPassword = () => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/users/${userToResetPassword}/reset-password`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ new_password: resetPasswordValue })
    })
      .then((res) => res.json())
      .then(() => {
        setOpenResetDialog(false);
        setUserToResetPassword(null);
        setResetPasswordValue("");
        alert("סיסמה אופסה בהצלחה");
      })
      .catch(() => alert("שגיאה באיפוס הסיסמה"));
  };

  const handleChangeRole = (userId) => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/users/${userId}/change-role`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchUsers());
  };

  const handleToggleActive = (userId) => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/users/${userId}/toggle-active`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchUsers());
  };

  const confirmDeleteUser = (userId) => {
    setUserToDelete(userId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteUserConfirmed = () => {
    const token = localStorage.getItem("token");
    fetch(`${config.apiBaseUrl}/admin/users/${userToDelete}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchUsers();
        setOpenDeleteDialog(false);
      })
      .catch(() => alert("שגיאה במחיקת המשתמש"));
  };

  return (
    <Layout>
      <Typography
        variant="h4"
        align="center"
        style={{ fontFamily: "Almoni Tzar", color: "#dcddde", marginBottom: "10px" }}
      >
        פאנל ניהול משתמשים 👑
      </Typography>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
        <Button
          variant="contained"
          sx={{
            fontFamily: "Almoni Tzar",
            backgroundColor: "#5865f2",
            fontWeight: "bold",
            color: "white",
            "&:hover": { backgroundColor: "#4752c4" }
          }}
          onClick={() => setOpenCreateDialog(true)}
        >
          יצירת משתמש חדש ✚
        </Button>

        {isSuperadmin && (
          <Button
            variant="outlined"
            sx={{
              fontFamily: "Almoni Tzar",
              fontWeight: "bold",
              color: "white",
              borderColor: "#7289da",
              "&:hover": {
                backgroundColor: "#7289da",
                color: "white"
              }
            }}
            onClick={() => {
              fetchAuditLogs();
              setShowAuditLog(true);
            }}
          >
            לוג שינויים 📜
          </Button>
        )}
      </div>

      <TableContainer component={Paper} style={{ backgroundColor: "#2f3136" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={styles.header}>אימייל</TableCell>
              <TableCell style={styles.header}>הרשאות</TableCell>
              <TableCell style={styles.header}>נוצר בתאריך</TableCell>
              <TableCell style={styles.header}>כניסה אחרונה</TableCell>
              <TableCell style={styles.header}>פעיל</TableCell>
              <TableCell style={styles.header}>פעולות שינוי</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.email === currentUserEmail;
              const isAdmin = user.role?.toLowerCase() === "admin";
              const disableActions = isSelf || (isAdmin && !isSuperadmin) || user.is_superadmin;

              return (
                <TableRow key={user.id}>
                  <TableCell style={styles.cell}>{user.email}</TableCell>
                  <TableCell style={styles.cell}>{user.is_superadmin ? "סופר אדמין 👑" : user.role === "admin" ? "מנהל" : "משתמש רגיל"}</TableCell>
                  <TableCell style={styles.cell}>{new Date(user.created_at).toLocaleString("he-IL")}</TableCell>
                  <TableCell style={styles.cell}>{user.last_login ? new Date(user.last_login).toLocaleString("he-IL") : "—"}</TableCell>
                  <TableCell style={styles.cell}>
                    <Switch color="success" checked={user.is_active} onChange={() => handleToggleActive(user.id)} disabled={disableActions} />
                  </TableCell>
                  <TableCell style={styles.cell}>
                    <Stack spacing={1} direction="row">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ fontFamily: "Almoni Tzar" }}
                        disabled={disableActions}
                        onClick={() => { setUserToResetPassword(user.id); setOpenResetDialog(true); }}
                      >
                        שנה סיסמה
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={disableActions}
                        sx={{ backgroundColor: "#5865f2", color: "white", fontWeight: "bold", fontFamily: "Almoni Tzar", "&:hover": { backgroundColor: "#4752c4" } }}
                        onClick={() => handleChangeRole(user.id)}
                      >
                        שינוי הרשאה
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ fontFamily: "Almoni Tzar" }}
                        disabled={disableActions}
                        onClick={() => confirmDeleteUser(user.id)}
                      >
                        מחק
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* דיאלוגים */}
      {/* דיאלוג יצירת משתמש */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle
          style={{
            fontFamily: "Almoni Tzar",
            backgroundColor: "#23272a",
            color: "#dcddde",
            textAlign: "center"
          }}
        >
          יצירת משתמש חדש ✚
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#2f3136" }}>
          <TextField
            fullWidth
            label="מייל או שם משתמש"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            margin="dense"
            InputLabelProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
            InputProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
          />
          <TextField
            fullWidth
            label="סיסמה"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            margin="dense"
            InputLabelProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
            InputProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
          />

          {/* שדה הרשאה - רק אם סופר אדמין */}
          {isSuperadmin && (
            <TextField
              select
              fullWidth
              label="הרשאה"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              margin="dense"
              InputLabelProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
              InputProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
            >
              <MenuItem value="user">משתמש רגיל</MenuItem>
              <MenuItem value="admin">מנהל</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button
            onClick={() => setOpenCreateDialog(false)}
            style={{
              fontFamily: "Almoni Tzar",
              backgroundColor: "#ed4245",
              color: "white",
              fontWeight: "bold"
            }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleCreateUser}
            style={{
              fontFamily: "Almoni Tzar",
              backgroundColor: "#57f287",
              color: "white",
              fontWeight: "bold"
            }}
          >
            צור ✅
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג שינוי סיסמה */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle style={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          שינוי סיסמה 🔐
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#2f3136" }}>
          <TextField
            fullWidth
            label="סיסמה חדשה"
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            margin="dense"
            InputLabelProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
            InputProps={{ style: { color: "white", fontFamily: "Almoni Tzar" } }}
          />
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button onClick={() => setOpenResetDialog(false)} style={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold" }}>ביטול</Button>
          <Button onClick={handleResetPassword} style={{ fontFamily: "Almoni Tzar", backgroundColor: "#57f287", color: "white", fontWeight: "bold" }}>שמור ✅</Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג מחיקת משתמש */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle style={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          ?האם אתה בטוח שברצונך למחוק את המשתמש 🗑️
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#2f3136" }}>
          <Typography style={{ fontFamily: "Almoni Tzar", color: "#dcddde", textAlign: "center" }}>
            .פעולה זו תמחק את המשתמש לצמיתות, אין אפשרות לשחזור
          </Typography>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button onClick={() => setOpenDeleteDialog(false)} style={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold", marginRight: "10px" }}>לא ✖</Button>
          <Button onClick={handleDeleteUserConfirmed} style={{ fontFamily: "Almoni Tzar", backgroundColor: "#57f287", color: "white", fontWeight: "bold" }}>כן ✅</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showAuditLog} onClose={() => setShowAuditLog(false)} maxWidth="md" fullWidth>
        <DialogTitle style={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          לוג שינויים 📜
        </DialogTitle>
        <div style={{ height: "1px", backgroundColor: "#23272a" }} />
        <DialogContent style={{ backgroundColor: "#2f3136" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={styles.header}>תאריך</TableCell>
                <TableCell style={styles.header}>פעולה</TableCell>
                <TableCell style={styles.header}>בוצע על ידי</TableCell>
                <TableCell style={styles.header}>מידע נוסף</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell style={styles.cell}>{new Date(log.timestamp).toLocaleString("he-IL")}</TableCell>
                  <TableCell style={styles.cell}>{log.action}</TableCell>
                  <TableCell style={styles.cell}>{log.performed_by}</TableCell>
                  <TableCell style={styles.cell}>{log.details || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#2f3136", justifyContent: "center", gap: "10px" }}>
          <Button
            onClick={() => setShowAuditLog(false)}
            style={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold" }}
          >
            סגור ✖
          </Button>
          <Button
            onClick={() => setOpenClearLogDialog(true)}
            style={{ fontFamily: "Almoni Tzar", backgroundColor: "#5865f2", color: "white", fontWeight: "bold" }}
          >
            איפוס לוגים ♻️
          </Button>
          <Button
            onClick={async () => {
              const token = localStorage.getItem("token");

              try {
                const response = await fetch(`${config.apiBaseUrl}/admin/audit-log/export`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });

                if (!response.ok) {
                  throw new Error("שגיאה בקבלת הקובץ");
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "audit_logs.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert("שגיאה בהורדת הקובץ ❌");
                console.error(err);
              }
            }}
            style={{
              fontFamily: "Almoni Tzar",
              backgroundColor: "#43b581",
              color: "white",
              fontWeight: "bold"
            }}
          >
            CSVייצוא לוגים ל־ 📤
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openClearLogDialog} onClose={() => setOpenClearLogDialog(false)}>
        <DialogTitle style={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          ?האם אתה בטוח שברצונך לאפס את הלוגים ♻️
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#2f3136" }}>
          <Typography style={{ fontFamily: "Almoni Tzar", color: "#dcddde", textAlign: "center" }}>
            פעולה זו תמחק את כל לוג השינויים לצמיתות. לא ניתן לשחזר!
          </Typography>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button
            onClick={() => setOpenClearLogDialog(false)}
            style={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold" }}
          >
            לא ✖
          </Button>
          <Button
            onClick={() => {
              const token = localStorage.getItem("token");
              fetch(`${config.apiBaseUrl}/admin/audit-log/clear`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`
                }
              })
                .then((res) => {
                  if (!res.ok) throw new Error();
                  return res.json();
                })
                .then(() => {
                  setAuditLogs([]);
                  setOpenClearLogDialog(false);
                  alert("הלוגים אופסו בהצלחה ✅");
                })
                .catch(() => alert("שגיאה באיפוס הלוגים ❌"));
            }}
            style={{ fontFamily: "Almoni Tzar", backgroundColor: "#57f287", color: "white", fontWeight: "bold" }}
          >
            כן ✅
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

const styles = {
  header: {
    fontFamily: "Almoni Tzar",
    fontWeight: "bold",
    color: "#dcddde",
    backgroundColor: "#202225"
  },
  cell: {
    fontFamily: "Almoni Tzar",
    color: "#dcddde",
    backgroundColor: "#2f3136"
  }
};

export default AdminPanel;