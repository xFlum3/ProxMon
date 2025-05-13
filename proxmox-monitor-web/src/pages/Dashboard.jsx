import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Layout from "../components/Layout";
import config from "../config";

function Dashboard() {
  const [proxmoxData, setProxmoxData] = useState(null);
  const [alertSettings, setAlertSettings] = useState({ cpu: false, ram: false, disk: false });
  const [loading, setLoading] = useState(true);
  const [globalCollapsed, setGlobalCollapsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [proxmoxResp, alertsResp] = await Promise.all([
        fetch(`${config.apiBaseUrl}/dashboard/proxmox-status`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${config.apiBaseUrl}/dashboard/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!proxmoxResp.ok || !alertsResp.ok) throw new Error("Failed to fetch data");

      const proxmoxData = await proxmoxResp.json();
      const alertData = await alertsResp.json();

      setProxmoxData(proxmoxData);
      setAlertSettings(alertData);
    } catch (err) {
      console.error("שגיאה בטעינת נתונים:", err);
      setErrorMsg("שגיאה בטעינת הנתונים, נסה שוב בעוד רגע");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // קריאה ראשונית
    const interval = setInterval(fetchData, 60000); // כל דקה
    return () => clearInterval(interval); // ניקוי בעת unmount
  }, []);

  const toggleAlert = async (key) => {
    const updated = { ...alertSettings, [key]: !alertSettings[key] };
    setAlertSettings(updated);
    try {
      await fetch(`${config.apiBaseUrl}/dashboard/alerts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("שגיאה בעדכון הגדרות התראה", err);
    }
  };

  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const sortVmsByStatus = (vms) => {
    return [...vms].sort((a, b) => {
      if (a.status === "running" && b.status !== "running") return -1;
      if (a.status !== "running" && b.status === "running") return 1;
      return 0;
    });
  };

  const formatStorage = (valueInGb) => {
    if (valueInGb >= 1000) {
      return `${(valueInGb / 1024).toFixed(1)} TB`;
    }
    return `${valueInGb} GB`;
  };

  return (
    <>
      <Layout>
        <Box sx={{ padding: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontFamily: "Almoni Tzar", color: "#dcddde", mr: 2 }}
            >
              Proxmox סטטיסטיקות מערכת 🔍
            </Typography>
            <IconButton
              onClick={() => setGlobalCollapsed(prev => !prev)}
              sx={{ color: "#dcddde" }}
            >
              {globalCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Box>

          {loading ? (
            <CircularProgress sx={{ color: "#dcddde", display: "block", margin: "0 auto" }} />
          ) : (
            !globalCollapsed && (
              <Box sx={{ display: "flex", justifyContent: "center", px: 4 }}>
                <Grid container spacing={4} sx={{ maxWidth: "1600px" }}>
                  {proxmoxData?.map(node => (
                    <Grid item xs={12} key={node.node}>
                      <Card
                        sx={{
                          backgroundColor: "#2f3136",
                          color: "#dcddde",
                          display: "flex",
                          flexDirection: "column",
                          px: 2,
                          py: 1,
                          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                          borderRadius: 3
                        }}
                      >
                        <CardHeader
                          title={
                            <Box sx={{ textAlign: "center" }}>
                              <Box
                                sx={{
                                  display: "inline-block",
                                  backgroundColor: "#36393f",
                                  padding: "8px 16px",
                                  borderRadius: 2,
                                  boxShadow: "inset 0 0 5px rgba(0,0,0,0.2)",
                                  mb: 2
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{ fontFamily: "Almoni Tzar", fontWeight: "bold", color: "#dcddde" }}
                                >
                                  {`🗄️ ${node.node} :שרת מארח`}
                                </Typography>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontFamily: "Almoni Tzar", color: "#b9bbbe", mt: 1 }}
                                >
                                  🧮 {node.vms?.length || 0} :מכונות בסך הכול
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  gap: 4,
                                  backgroundColor: "#40444b",
                                  borderRadius: 2,
                                  padding: "5px 24px",
                                  mt: 2,
                                  boxShadow: "inset 0 0 6px rgba(0,0,0,0.3)",
                                  border: "1px solid #4f545c"
                                }}
                              >
                                <Typography sx={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>
                                  🧠 {`${(node?.stats?.cpu || 0).toFixed(1)}%`} :כולל CPU
                                </Typography>
                                <Typography sx={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>
                                  💾 {`${formatStorage(node?.stats?.ram?.used || 0)} / ${formatStorage(node?.stats?.ram?.total || 0)}`} :כולל RAM
                                </Typography>
                                <Typography sx={{ fontFamily: "Almoni Tzar", color: "#dcddde" }}>
                                  💽 {`${formatStorage(node?.stats?.disk?.used || 0)} / ${formatStorage(node?.stats?.disk?.total || 0)}`} :דיסק כולל
                                </Typography>
                              </Box>
                            </Box>
                          }
                          sx={{ pb: 2, borderBottom: "1px solid #4f545c", mb: 2 }}
                        />

                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 2, mb: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: "Almoni Tzar",
                              mb: 2,
                              color: "#dcddde",
                              fontSize: "1.1rem",
                              borderBottom: "2px solid #dcddde",
                              display: "inline-block"
                            }}
                          >
                            🚨 הפעל / כבה התראות לבחירתך
                          </Typography>
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 4 }}>
                            <FormControlLabel
                              control={<Switch checked={alertSettings.cpu} onChange={() => toggleAlert("cpu")} color="primary" />}
                              label={<Typography sx={{ fontFamily: "Almoni Tzar" }}>CPU גבוה</Typography>}
                              sx={{ color: "#dcddde" }}
                            />
                            <FormControlLabel
                              control={<Switch checked={alertSettings.ram} onChange={() => toggleAlert("ram")} color="primary" />}
                              label={<Typography sx={{ fontFamily: "Almoni Tzar" }}>RAM גבוה</Typography>}
                              sx={{ color: "#dcddde" }}
                            />
                            <FormControlLabel
                              control={<Switch checked={alertSettings.disk} onChange={() => toggleAlert("disk")} color="primary" />}
                              label={<Typography sx={{ fontFamily: "Almoni Tzar" }}>דיסק מלא</Typography>}
                              sx={{ color: "#dcddde" }}
                            />
                          </Box>
                        </Box>

                        <CardContent>
                          {chunkArray(sortVmsByStatus(node.vms || []), 4).map((vmChunk, chunkIdx) => (
                            <Grid container spacing={3} key={chunkIdx} sx={{ mb: 3 }}>
                              {vmChunk.map((vm, idx) => (
                                <Grid item xs={12} sm={6} md={3} key={`${chunkIdx}-${idx}`}>
                                  <Box
                                    sx={{
                                      backgroundColor: vm.status === "running" ? "#3ba55d22" : "#ed424522",
                                      border: "1px solid #4f545c",
                                      borderRadius: 2,
                                      padding: 1,
                                      fontSize: "0.9rem",
                                      textAlign: "right",
                                      height: "100%"
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontFamily: "Almoni Tzar",
                                        fontWeight: "bold",
                                        mb: 1,
                                        borderBottom: "1px solid #4f545c",
                                        paddingBottom: 1
                                      }}
                                    >
                                      🖥️ {vm.name} :מכונה
                                    </Typography>
                                    <Typography sx={{ fontFamily: "Almoni Tzar", mb: 0.5 }}>
                                      סטטוס: {vm.status === "running" ? "✅ פעילה" : "🛑 כבויה"}
                                    </Typography>
                                    <Typography sx={{ fontFamily: "Almoni Tzar", mb: 0.5 }}>
                                      {vm.type?.toUpperCase() === "LXC" ? "CT" : "VM"} :סוג
                                    </Typography>
                                    {vm.status === "running" ? (
                                      <Box sx={{ mt: "auto", pt: 1 }}>
                                        <Typography sx={{ fontFamily: "Almoni Tzar", mb: 0.5 }}>
                                          🧠 %{(vm.cpu * 100).toFixed(1)} :CPU
                                        </Typography>
                                        <Typography sx={{ fontFamily: "Almoni Tzar", mb: 0.5 }}>
                                          💾 {vm.ram.used} GB / {vm.ram.total} GB :RAM
                                        </Typography>
                                        <Typography sx={{ fontFamily: "Almoni Tzar" }}>
                                          💽 {formatStorage(vm.disk.used)} / {formatStorage(vm.disk.total)} :דיסק
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Box sx={{ mt: "auto", pt: 1, opacity: 0.7, fontStyle: "italic" }}>
                                        <Typography sx={{ fontFamily: "Almoni Tzar" }}>
                                          .המכונה כבויה כרגע, אין נתוני שימוש
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )
          )}
        </Box>
      </Layout>

      {/* Snackbar Notification */}
      <Snackbar
  open={openSnackbar}
  autoHideDuration={4000}
  onClose={() => setOpenSnackbar(false)}
  message={errorMsg}
  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
  ContentProps={{
    sx: {
      fontFamily: "Almoni Tzar",
      backgroundColor: "#ed4245",
      color: "#fff",
      fontWeight: "bold",
      textAlign: "center",
      borderRadius: 2
    }
  }}
/>
    </>
  );
}

export default Dashboard;