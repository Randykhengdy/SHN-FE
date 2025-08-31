import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import wallpaper from "@/assets/loginwallpaper.jpg";
import LoginBackground from "@/components/LoginBackground";
import LoginForm from "@/components/LoginForm";
import LoginFooter from "@/components/LoginFooter";
import { setToken, setTokenType, setIsLoggedIn, setRefreshToken, setUser } from "@/lib/tokenStorage";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log("Login component loaded");
  console.log("Current localStorage:", {
    isLoggedIn: localStorage.getItem("shn_app_isLoggedIn"),
    token: localStorage.getItem("shn_app_token")
  });

  // Auto-redirect if already logged in
  useEffect(() => {
    console.log("Login useEffect triggered");
    const isLoggedIn = localStorage.getItem("shn_app_isLoggedIn");
    console.log("isLoggedIn value:", isLoggedIn);
    
    if (isLoggedIn === "true" || isLoggedIn === "1") {
      console.log("User already logged in, redirecting to dashboard");
      navigate("/dashboard");
    } else {
      console.log("User not logged in, showing login form");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
  
      const result = await response.json();
  
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login gagal");
      }
  
      // Simpan token menggunakan sistem storage baru
      setToken(result.token);
      setTokenType(result.token_type); // biasanya "Bearer"
      setIsLoggedIn("true");
      
      // Simpan refresh token jika ada
      if (result.refresh_token) {
        setRefreshToken(result.refresh_token);
        console.log("✅ Refresh token saved");
      }
      
      // Simpan user info jika ada
      if (result.user) {
        setUser(result.user);
        console.log("✅ User data saved:", result.user);
      } else {
        console.log("⚠️ No user data in response");
      }
  
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="login-page-container" style={{ minHeight: "100vh", background: "#fff", position: "relative" }}>
      <LoginBackground wallpaper={wallpaper} />

      {/* Right form */}
      <div
        className="login-right"
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 15, background: "transparent", zIndex: 2
        }}
      >
        <div
          className="login-container"
          style={{
            width: "100%", maxWidth: 280, textAlign: "center",
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)",
            borderRadius: 16, padding: "25px 20px",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            transition: "all 0.4s ease", position: "relative", overflow: "hidden"
          }}
        >
          <img src={logo} alt="Logo" className="login-logo" style={{
            width: 40, height: 40, borderRadius: 8, margin: "0 auto 10px",
            objectFit: "contain", boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }} />
          <div className="login-title" style={{
            fontSize: "1.4em", fontWeight: 700, color: "#fff", marginBottom: 2,
            letterSpacing: 1, textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)",
            position: "relative", zIndex: 1
          }}>
            SURYA LOGAM JAYA
          </div>
          <div className="login-subtitle" style={{
            fontSize: "0.8em", color: "#fff", marginBottom: 15, fontWeight: 600,
            textShadow: "0 2px 6px rgba(0,0,0,0.8), 0 3px 8px rgba(0,0,0,0.6)",
            position: "relative", zIndex: 1
          }}>
            PT. SURYA HARSA NAGARA
          </div>
          <LoginForm
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            error={error}
            loading={loading}
            handleLogin={handleLogin}
          />
          <LoginFooter />
        </div>
      </div>
    </div>
  );
}
