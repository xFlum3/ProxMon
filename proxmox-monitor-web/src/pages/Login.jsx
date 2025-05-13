import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography
} from "@mui/material";
import { login } from "../services/api";
import config from "../config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      if (err.status === 403) {
        setError("המשתמש הזה הושבת על ידי מנהל המערכת");
      } else {
        setError("אימייל או סיסמה שגויים");
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");

    if (err === "sso_not_configured") {
      setError(".אינה זמינה - אנא צור קשר עם מנהל המערכת SSO ההתחברות עם ⚠️");
    }
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#2f3136",
        margin: 0,
        padding: "40px 20px",
        fontFamily: "Almoni Tzar" // ✅ הגדרה גלובלית לפונט
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          textAlign: "center"
        }}
      >
        <Card
          style={{
            backgroundColor: "#23272a",
            padding: "20px"
          }}
        >
          <CardContent
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <Typography
              variant="h4"
              style={{
                color: "#dcddde",
                textAlign: "center",
                fontWeight: "bold",
                fontFamily: "Almoni Tzar"
              }}
            >
              ProxMon 👀
            </Typography>

            <TextField
              label="מייל"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                style: { color: "white", fontFamily: "Almoni Tzar" }
              }}
              InputLabelProps={{
                style: { color: "white", fontFamily: "Almoni Tzar" }
              }}
            />

            <TextField
              label="סיסמה"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                style: { color: "white", fontFamily: "Almoni Tzar" }
              }}
              InputLabelProps={{
                style: { color: "white", fontFamily: "Almoni Tzar" }
              }}
            />

            {error && (
              <Typography
                color="error"
                align="center"
                style={{ fontFamily: "Almoni Tzar" }}
              >
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              style={{
                backgroundColor: "#5865f2",
                color: "white",
                fontWeight: "bold",
                textTransform: "none",
                fontFamily: "Almoni Tzar"
              }}
            >
              התחברות
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => window.location.href = `${config.apiBaseUrl}/sso/login`}
              style={{
                borderColor: "#5865f2",
                color: "#5865f2",
                fontWeight: "bold",
                textTransform: "none",
                fontFamily: "Almoni Tzar"
              }}
            >
              SSO התחברות עם 🔐
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;