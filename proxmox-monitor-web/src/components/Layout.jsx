import {
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  IconButton
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountCircle from "@mui/icons-material/AccountCircle";
import config from "../config";

function Layout({ children }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuRef = useRef(null);

  const [userName, setUserName] = useState("משתמש");
  const [userRole, setUserRole] = useState("USER");

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${config.apiBaseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        alert("החשבון שלך הושבת. אנא פנה למנהל המערכת.");
        localStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!res.ok) {
        throw new Error("בעיה בטעינת מידע המשתמש");
      }

      const data = await res.json();

      setUserName(data.email || "משתמש");
      setUserRole(data.role?.toUpperCase() || "USER");

    } catch (err) {
      console.error("שגיאה בקבלת פרטי משתמש:", err);
    }
  };

  useEffect(() => {
    fetchUserData(); // טוען בהתחלה

    const interval = setInterval(fetchUserData, 30000); // בדיקה כל 30 שניות

    return () => clearInterval(interval); // מנקה אינטרוול כשעוזבים
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    handleMenuClose();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (anchorEl && menuRef.current && !menuRef.current.contains(event.target)) {
        handleMenuClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [anchorEl]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#2f3136",
        margin: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <AppBar position="static" style={{ backgroundColor: "#23272a", boxShadow: "none" }}>
        <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            onClick={() => navigate("/dashboard")}
            style={{
              color: "#dcddde",
              fontWeight: "bold",
              fontFamily: "Almoni Tzar",
              cursor: "pointer"
            }}
          >
            ProxMon 👀
          </Typography>
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={handleMenuOpen}>
            <IconButton sx={{ color: "#dcddde" }} disableRipple disableFocusRipple>
              <AccountCircle />
            </IconButton>
            <Typography
              variant="subtitle1"
              style={{
                fontFamily: "Almoni Tzar",
                color: "#dcddde",
                fontWeight: "bold",
                marginRight: "8px",
              }}
            >
              {userName}
            </Typography>
          </div>

          {/* USER MENU */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              style: { backgroundColor: "#2f3136", color: "#dcddde" },
            }}
            ref={menuRef}
          >
            <MenuItem onClick={() => handleNavigate("/profile")} sx={{ fontFamily: "Almoni Tzar" }}>
              ⚙️ הגדרות משתמש
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{ fontFamily: "Almoni Tzar", color: "#ed4245" }}
            >
              ⏻ התנתק
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row-reverse" }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: "150px",
            backgroundColor: "#202225",
            color: "#dcddde",
            display: "flex",
            flexDirection: "column",
            paddingTop: "20px",
          }}
        >
          <List>
            <ListItem button onClick={() => handleNavigate("/dashboard")}>
              <ListItemText
                primary="עמוד ראשי"
                primaryTypographyProps={{
                  style: {
                    fontFamily: "Almoni Tzar",
                    color: "#dcddde",
                    fontWeight: "bold",
                    textAlign: "right",
                  },
                }}
              />
            </ListItem>

            {/* רק למשתמשי אדמין */}
            {userRole === "ADMIN" && (
              <>
                <ListItem button onClick={() => handleNavigate("/dashboard/settings")}>
                  <ListItemText
                    primary="הגדרות מערכת"
                    primaryTypographyProps={{
                      style: {
                        fontFamily: "Almoni Tzar",
                        color: "#dcddde",
                        fontWeight: "bold",
                        textAlign: "right",
                      },
                    }}
                  />
                </ListItem>

                <ListItem button onClick={() => handleNavigate("/dashboard/admin")}>
                  <ListItemText
                    primary="פאנל אדמין"
                    primaryTypographyProps={{
                      style: {
                        fontFamily: "Almoni Tzar",
                        color: "#dcddde",
                        fontWeight: "bold",
                        textAlign: "right",
                      },
                    }}
                  />
                </ListItem>
              </>
            )}
          </List>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, backgroundColor: "#2f3136", padding: "20px" }}>{children}</div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          backgroundColor: "#23272a",
          color: "#dcddde",
          padding: "10px 0",
          textAlign: "center",
          fontFamily: "Almoni Tzar",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        Powered By ProxMon © 2025
      </div>
    </div>
  );
}

export default Layout;