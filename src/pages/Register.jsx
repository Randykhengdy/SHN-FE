import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import wallpaper from "@/assets/loginwallpaper.jpg";
import LoginBackground from "@/components/LoginBackground";
import LoginFooter from "@/components/LoginFooter";
import LoginInput from "@/components/LoginInput";
import { authService } from "@/services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_id: 1, // Default role_id
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const result = await authService.register(form);
      
      if (!result.success) {
        throw new Error(result.message || "Registrasi gagal");
      }
  
      // Registrasi berhasil, langsung login
      localStorage.setItem("token", result.token);
      localStorage.setItem("token_type", result.token_type);
      localStorage.setItem("isLoggedIn", "1");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat register");
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
          
          <form
            className="login-form"
            autoComplete="off"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <LoginInput
              id="name"
              label="Name"
              type="text"
              value={form.name}
              onChange={handleChange}
              name="name"
              placeholder="Enter your full name"
              autoFocus
            />
            <LoginInput
              id="username"
              label="Username"
              type="text"
              value={form.username}
              onChange={handleChange}
              name="username"
              placeholder="Enter your username"
            />
            <LoginInput
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              name="email"
              placeholder="Enter your email"
            />
            <LoginInput
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              name="password"
              placeholder="Enter your password"
            />
            
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, rgba(44,44,44,0.8) 0%, rgba(26,26,26,0.8) 100%)",
                color: "#fff", border: "none", borderRadius: 8, padding: "10px 0",
                fontSize: "0.95em", fontWeight: 600, cursor: "pointer",
                marginTop: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                borderColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
                transition: "all 0.3s ease"
              }}
            >
              {loading ? "Registering..." : "Register"}
            </button>
            <div className="login-error" style={{
              color: "#ff8a80", fontSize: "0.8em", marginTop: 2, textAlign: "center",
              minHeight: 14, fontWeight: 500, textShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }}>
              {error}
            </div>
            <div style={{ color: "#fff", fontSize: "0.8em", marginTop: 2, textAlign: "center" }}>
              Sudah punya akun?{" "}
              <Link to="/" style={{ color: "#90caf9", textDecoration: "none" }}>
                Login
              </Link>
            </div>
          </form>
          
          <LoginFooter />
        </div>
      </div>
    </div>
  );
}
