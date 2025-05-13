import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import SsoSuccess from "./pages/SsoSuccess";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard/admin" element={<AdminPanel />} />
        <Route path="/sso-success" element={<SsoSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;
