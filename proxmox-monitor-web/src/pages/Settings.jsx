import { useState, useEffect } from "react";
import {
  Typography,
  Switch,
  TextField,
  FormGroup,
  FormControlLabel,
  Paper,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Layout from "../components/Layout";
import config from "../config";

function SystemSettings() {
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [showAlertsSettings, setShowAlertsSettings] = useState(false);
  const [showProxmoxSettings, setShowProxmoxSettings] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingProxmox, setLoadingProxmox] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [openResetProxmoxDialog, setOpenResetProxmoxDialog] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "success" or "error"
  const [showSsoSettings, setShowSsoSettings] = useState(false);
  const [openResetSsoDialog, setOpenResetSsoDialog] = useState(false);
  const [cpuThreshold, setCpuThreshold] = useState(90);
  const [ramThreshold, setRamThreshold] = useState(90);
  const [diskThreshold, setDiskThreshold] = useState(85);

  const [ssoSettings, setSsoSettings] = useState({
    name: "",
    clientId: "",
    clientSecret: "",
    discoveryUrl: "",
    redirectUri: "",
    scopes: "",
    responseType: ""
  });

  const handleSsoChange = (e) => {
    setSsoSettings({ ...ssoSettings, [e.target.name]: e.target.value });
  };

  const [telegramSettings, setTelegramSettings] = useState({
    botToken: "",
    apiId: "",
    apiHash: "",
    chatId: ""
  });

  const [discordSettings, setDiscordSettings] = useState({
    botToken: "",
    guildId: "",
    channelId: ""
  });

  const [proxmoxSettings, setProxmoxSettings] = useState({
    host: "",
    tokenId: "",
    tokenSecret: ""
  });

  const token = localStorage.getItem("token");

  const handleTelegramChange = (e) => {
    setTelegramSettings({ ...telegramSettings, [e.target.name]: e.target.value });
  };

  const handleDiscordChange = (e) => {
    setDiscordSettings({ ...discordSettings, [e.target.name]: e.target.value });
  };

  const handleProxmoxChange = (e) => {
    setProxmoxSettings({ ...proxmoxSettings, [e.target.name]: e.target.value });
  };

  const handleSaveSsoSettings = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/sso`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          oidc_name: ssoSettings.name,
          oidc_client_id: ssoSettings.clientId,
          oidc_client_secret: ssoSettings.clientSecret,
          oidc_discovery_url: ssoSettings.discoveryUrl,
          oidc_redirect_uri: ssoSettings.redirectUri,
          oidc_scopes: ssoSettings.scopes,
          oidc_response_type: ssoSettings.responseType
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || "שמירת ההגדרות נכשלה");
      }

      setSnackbarMessage("✅ נשמרו בהצלחה SSO ההגדרות");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("❌ שמירת SSO נכשלה: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSaveAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          telegram_enabled: telegramEnabled,
          discord_enabled: discordEnabled,
          telegram_bot_token: telegramSettings.botToken,
          telegram_api_id: telegramSettings.apiId,
          telegram_api_hash: telegramSettings.apiHash,
          telegram_chat_id: telegramSettings.chatId,
          discord_bot_token: discordSettings.botToken,
          discord_guild_id: discordSettings.guildId,
          discord_channel_id: discordSettings.channelId,
          cpu_threshold: cpuThreshold,
          ram_threshold: ramThreshold,
          disk_threshold: diskThreshold
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || "שמירת ההתראות נכשלה");
      }

      setSnackbarMessage("✅ הפעולה בוצעה בהצלחה");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("❌ " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleResetAlerts = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Reset failed");
      setTelegramEnabled(false);
      setDiscordEnabled(false);
      setTelegramSettings({ botToken: "", apiId: "", apiHash: "", chatId: "" });
      setDiscordSettings({ botToken: "", guildId: "" });
      setSnackbarOpen(true);
    } catch (err) {
      alert(err.message + " :❌ איפוס נכשלה");
    } finally {
      setOpenResetDialog(false);
    }
  };

  const handleSaveProxmox = async () => {
    setLoadingProxmox(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/proxmox`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          proxmox_host: proxmoxSettings.host,
          proxmox_token_id: proxmoxSettings.tokenId,
          proxmox_token_secret: proxmoxSettings.tokenSecret
        })
      });
      if (!response.ok) throw new Error("Save failed");
      setSnackbarMessage("✅ ההגדרות נשמרו בהצלחה");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error.message + " :❌ שמירת ההגדרות נכשלה");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingProxmox(false);
    }
  };

  const handleResetProxmox = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/proxmox`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Reset failed");
      setProxmoxSettings({ host: "", tokenId: "", tokenSecret: "" });
      setSnackbarMessage("✅ ההגדרות אופסו בהצלחה");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(err.message + " :❌ איפוס ההגדרות נכשל");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setOpenResetProxmoxDialog(false);
    }
  };

  const handleTestProxmox = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/proxmox/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          proxmox_host: proxmoxSettings.host,
          proxmox_token_id: proxmoxSettings.tokenId,
          proxmox_token_secret: proxmoxSettings.tokenSecret
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "בדיקה נכשלה");

      setSnackbarMessage("✅ Proxmox Status:" + result.message);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(" בדיקה נכשלה ❌: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleTestTelegram = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/telegram/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_token: telegramSettings.botToken,
          api_id: telegramSettings.apiId,
          api_hash: telegramSettings.apiHash,
          chat_id: telegramSettings.chatId
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "בדיקה נכשלה");

      setSnackbarMessage("✅ Telegram Status: " + result.message);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("❌Telegram Status: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleTestDiscord = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/discord/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_token: discordSettings.botToken,
          guild_id: discordSettings.guildId,
          channel_id: discordSettings.channelId
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "בדיקה נכשלה");

      setSnackbarMessage("✅ Discord Status: " + result.message);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("❌ Discord Status: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleResetSsoSettings = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/sso`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("איפוס נכשל");

      setSsoSettings({
        name: "",
        clientId: "",
        clientSecret: "",
        discoveryUrl: "",
        redirectUri: "",
        scopes: "",
        responseType: ""
      });

      setSnackbarMessage("✅ הגדרות אופסו בהצלחה");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("❌ SSO Error: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleTestSso = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/settings/sso/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          oidc_name: ssoSettings.name,
          oidc_client_id: ssoSettings.clientId,
          oidc_client_secret: ssoSettings.clientSecret,
          oidc_discovery_url: ssoSettings.discoveryUrl,
          oidc_redirect_uri: ssoSettings.redirectUri,
          oidc_scopes: ssoSettings.scopes,
          oidc_response_type: ssoSettings.responseType
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "בדיקה נכשלה");

      setSnackbarMessage("✅ SSO Status: " + result.message);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("❌ SSO Status: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/settings`);
        if (!response.ok) throw new Error("Failed to fetch settings");
        const data = await response.json();
        setTelegramEnabled(data.telegram_enabled);
        setDiscordEnabled(data.discord_enabled);
        setTelegramSettings({
          botToken: data.telegram_bot_token || "",
          apiId: data.telegram_api_id || "",
          apiHash: data.telegram_api_hash || "",
          chatId: data.telegram_chat_id || ""
        });
        setDiscordSettings({
          botToken: data.discord_bot_token || "",
          guildId: data.discord_guild_id || "",
          channelId: data.discord_channel_id || "" // חדש
        });
        setProxmoxSettings({
          host: data.proxmox_host || "",
          tokenId: data.proxmox_token_id || "",
          tokenSecret: data.proxmox_token_secret || ""
        });
        setSsoSettings({
          name: data.oidc_name || "",
          clientId: data.oidc_client_id || "",
          clientSecret: data.oidc_client_secret || "",
          discoveryUrl: data.oidc_discovery_url || "",
          redirectUri: data.oidc_redirect_uri || "",
          scopes: data.oidc_scopes || "",
          responseType: data.oidc_response_type || ""
        });
        setCpuThreshold(data.cpu_threshold || 90);
        setRamThreshold(data.ram_threshold || 90);
        setDiskThreshold(data.disk_threshold || 85);
      } catch (err) {
        console.error("❌ Failed to load settings:", err.message);
      }
    };
    fetchSettings();
  }, []);

  const commonTextProps = {
    InputLabelProps: { style: { color: "white", fontFamily: "Almoni Tzar" } },
    InputProps: { style: { color: "white", fontFamily: "Almoni Tzar" } }
  };

  return (
    <Layout>
      <Typography variant="h4" align="center" sx={{ fontFamily: "Almoni Tzar", color: "#dcddde", mb: 4 }}>
        הגדרות מערכת ⚙️
      </Typography>

      <Paper sx={{ backgroundColor: "#2f3136", padding: 4, maxWidth: "800px", margin: "0 auto", borderRadius: "12px", fontFamily: "Almoni Tzar" }}>
        {/* Telegram & Discord Settings */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexDirection: "row-reverse" }}>
          <Typography variant="h6" sx={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>
            הגדרת התראות 📢
          </Typography>
          <IconButton onClick={() => setShowAlertsSettings(!showAlertsSettings)} sx={{ color: "#dcddde" }}>
            {showAlertsSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </div>

        {showAlertsSettings && (
          <>
            {/* 🧠 Threshold Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <TextField
                label="CPU סף התראה (%)"
                type="number"
                value={cpuThreshold}
                onChange={(e) => setCpuThreshold(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
                fullWidth
                {...commonTextProps}
              />
              <TextField
                label="RAM סף התראה (%)"
                type="number"
                value={ramThreshold}
                onChange={(e) => setRamThreshold(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
                fullWidth
                {...commonTextProps}
              />
              <TextField
                label="דיסק סף התראה (%)"
                type="number"
                value={diskThreshold}
                onChange={(e) => setDiskThreshold(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
                fullWidth
                {...commonTextProps}
              />
            </div>

            <FormGroup>
              <FormControlLabel sx={{ flexDirection: "row-reverse", justifyContent: "flex-start", gap: 1, mb: 1 }} control={<Switch checked={telegramEnabled} onChange={() => setTelegramEnabled(!telegramEnabled)} color="success" />} label={<span style={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>התראות בטלגרם</span>} />
            </FormGroup>
            {telegramEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <TextField label="Bot Token" name="botToken" value={telegramSettings.botToken} onChange={handleTelegramChange} fullWidth {...commonTextProps} />
                <TextField label="API ID" name="apiId" value={telegramSettings.apiId} onChange={handleTelegramChange} fullWidth {...commonTextProps} />
                <TextField label="API Hash" name="apiHash" value={telegramSettings.apiHash} onChange={handleTelegramChange} fullWidth {...commonTextProps} />
                <TextField label="Chat ID" name="chatId" value={telegramSettings.chatId} onChange={handleTelegramChange} fullWidth {...commonTextProps} />
                <Button
                  variant="outlined"
                  color="info"
                  onClick={handleTestTelegram}
                  sx={{ fontFamily: "Almoni Tzar", marginTop: 1 }}
                >
                  🔍 בדיקת טלגרם
                </Button>
              </div>
            )}
            <FormGroup>
              <FormControlLabel sx={{ flexDirection: "row-reverse", justifyContent: "flex-start", gap: 1, mt: 2 }} control={<Switch checked={discordEnabled} onChange={() => setDiscordEnabled(!discordEnabled)} color="success" />} label={<span style={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>התראות בדיסקורד</span>} />
            </FormGroup>
            {discordEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <TextField label="Bot Token" name="botToken" value={discordSettings.botToken} onChange={handleDiscordChange} fullWidth {...commonTextProps} />
                <TextField label="Guild ID" name="guildId" value={discordSettings.guildId} onChange={handleDiscordChange} fullWidth {...commonTextProps} />
                <TextField
                  label="Channel ID"
                  name="channelId"
                  value={discordSettings.channelId}
                  onChange={handleDiscordChange}
                  fullWidth
                  {...commonTextProps}
                />
                <Button
                  variant="outlined"
                  color="info"
                  onClick={handleTestDiscord}
                  sx={{ fontFamily: "Almoni Tzar", marginTop: 1 }}
                >
                  🔍 בדיקת דיסקורד
                </Button>
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <Button variant="contained" color="success" onClick={handleSaveAlerts} disabled={loadingAlerts} sx={{ fontFamily: "Almoni Tzar" }}>📂 שמור הגדרות</Button>
              <Button variant="outlined" color="error" onClick={() => setOpenResetDialog(true)} sx={{ fontFamily: "Almoni Tzar" }}>🗑️ איפוס ההגדרות</Button>
            </div>
          </>
        )}

        {/* PROXMOX */}
        <Divider sx={{ my: 4, backgroundColor: "#40444b" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexDirection: "row-reverse" }}>
          <Typography variant="h6" sx={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>
            Proxmox API הגדרת 🚀
          </Typography>
          <IconButton onClick={() => setShowProxmoxSettings(!showProxmoxSettings)} sx={{ color: "#dcddde" }}>
            {showProxmoxSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </div>

        {showProxmoxSettings && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <TextField label="Proxmox Host\URL" name="host" value={proxmoxSettings.host} onChange={handleProxmoxChange} fullWidth {...commonTextProps} />
              <TextField label="Token ID" name="tokenId" value={proxmoxSettings.tokenId} onChange={handleProxmoxChange} fullWidth {...commonTextProps} />
              <TextField label="Token Secret" name="tokenSecret" value={proxmoxSettings.tokenSecret} onChange={handleProxmoxChange} fullWidth {...commonTextProps} />
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <Button variant="contained" color="success" onClick={handleSaveProxmox} disabled={loadingProxmox} sx={{ fontFamily: "Almoni Tzar" }}>📂 שמור הגדרות</Button>
              <Button variant="outlined" color="error" onClick={() => setOpenResetProxmoxDialog(true)} sx={{ fontFamily: "Almoni Tzar" }}>🗑️ איפוס ההגדרות</Button>
              <Button
                variant="outlined"
                color="info"
                onClick={handleTestProxmox}
                sx={{ fontFamily: "Almoni Tzar" }}
              >
                🔍 בדיקת חיבור
              </Button>
            </div>
          </>
        )}

        {/* SSO Settings */}
        <Divider sx={{ my: 4, backgroundColor: "#40444b" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexDirection: "row-reverse" }}>
          <Typography variant="h6" sx={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>
            (Authentik) SSO הגדרת התחברות 🔑
          </Typography>
          <IconButton onClick={() => setShowSsoSettings(!showSsoSettings)} sx={{ color: "#dcddde" }}>
            {showSsoSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </div>

        {showSsoSettings && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <TextField label="OIDC Name" name="name" value={ssoSettings.name} onChange={handleSsoChange} fullWidth {...commonTextProps} />
              <TextField label="Client ID" name="clientId" value={ssoSettings.clientId} onChange={handleSsoChange} fullWidth {...commonTextProps} />
              <TextField label="Client Secret" name="clientSecret" value={ssoSettings.clientSecret} onChange={handleSsoChange} fullWidth {...commonTextProps} />
              <TextField label="Discovery URL" name="discoveryUrl" value={ssoSettings.discoveryUrl} onChange={handleSsoChange} fullWidth {...commonTextProps} />
              <TextField label="Redirect URI" name="redirectUri" value={ssoSettings.redirectUri} onChange={handleSsoChange} fullWidth {...commonTextProps} />
              <TextField label="Scopes" name="scopes" value={ssoSettings.scopes} onChange={handleSsoChange} fullWidth {...commonTextProps} />
              <TextField label="Response Type" name="responseType" value={ssoSettings.responseType} onChange={handleSsoChange} fullWidth {...commonTextProps} />
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <Button variant="contained" color="success" onClick={handleSaveSsoSettings} sx={{ fontFamily: "Almoni Tzar" }}>📂 שמור הגדרות</Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setOpenResetSsoDialog(true)}
                sx={{ fontFamily: "Almoni Tzar" }}
              >
                🗑️ איפוס הגדרות
              </Button>
              <Button
                variant="outlined"
                color="info"
                onClick={handleTestSso}
                sx={{ fontFamily: "Almoni Tzar" }}
              >
                🔍 בדיקת חיבור
              </Button>
            </div>
          </>
        )}
      </Paper>

      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          ?האם אתה בטוח שברצונך לאפס את הגדרת ההתראות 🗑️
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#2f3136" }}>
          <Typography sx={{ fontFamily: "Almoni Tzar", color: "#dcddde", textAlign: "center" }}>
            !פעולה זו תמחק את כל ההגדרות הקיימות. לא ניתן לשחזר
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button onClick={() => setOpenResetDialog(false)} sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold" }}>לא ✖</Button>
          <Button onClick={handleResetAlerts} sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#57f287", color: "white", fontWeight: "bold" }}>כן ✅</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openResetProxmoxDialog} onClose={() => setOpenResetProxmoxDialog(false)}>
        <DialogTitle sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          ?Proxmox -האם אתה בטוח שברצונך לאפס את הגדרות ה 🗑️
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#2f3136" }}>
          <Typography sx={{ fontFamily: "Almoni Tzar", color: "#dcddde", textAlign: "center" }}>
            ⚠️ !לא ניתן לשחזר ,Proxmox -פעולה זו תמחק את כל ההגדרות של ה ⚠️
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button onClick={() => setOpenResetProxmoxDialog(false)} sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold" }}>לא ✖</Button>
          <Button onClick={handleResetProxmox} sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#57f287", color: "white", fontWeight: "bold" }}>כן ✅</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openResetSsoDialog} onClose={() => setOpenResetSsoDialog(false)}>
        <DialogTitle sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#23272a", color: "#dcddde", textAlign: "center" }}>
          ?SSO-האם אתה בטוח שברצונך לאפס את הגדרות ה 🗑️
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#2f3136" }}>
          <Typography sx={{ fontFamily: "Almoni Tzar", color: "#dcddde", textAlign: "center" }}>
            !ניתן להגדיר מחדש לאחר מכן ,SSO -פעולה זו תאפס את כל ההגדרות של ה
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#2f3136", justifyContent: "center" }}>
          <Button onClick={() => setOpenResetSsoDialog(false)} sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#ed4245", color: "white", fontWeight: "bold" }}>לא ✖</Button>
          <Button onClick={async () => {
            await handleResetSsoSettings();
            setOpenResetSsoDialog(false);
          }} sx={{ fontFamily: "Almoni Tzar", backgroundColor: "#57f287", color: "white", fontWeight: "bold" }}>כן ✅</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        ContentProps={{
          sx: {
            fontFamily: "Almoni Tzar"
          }
        }}
      />
    </Layout>
  );
}

export default SystemSettings;