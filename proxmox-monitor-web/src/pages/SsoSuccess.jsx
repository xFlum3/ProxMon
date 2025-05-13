import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SsoSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);

      // הוספת דיליי קטן (100ms) לניווט חלק
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div
      style={{
        color: "white",
        fontFamily: "Almoni Tzar",
        textAlign: "center",
        paddingTop: "20vh"
      }}
    >
      ...SSO מתחברים דרך ⏳
    </div>
  );
}

export default SsoSuccess;