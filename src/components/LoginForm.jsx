import LoginInput from "./LoginInput";
import { Link } from "react-router-dom";

export default function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  error,
  loading,
  handleLogin
}) {
  return (
    <form
      className="login-form"
      autoComplete="off"
      onSubmit={handleLogin}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <LoginInput
        id="username"
        label="Username"
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        autoFocus
        placeholder="Enter your username"
      />
      <LoginInput
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
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
        {loading ? "Logging in..." : "Login"}
      </button>
      <div className="login-error" style={{
        color: "#ff8a80", fontSize: "0.8em", marginTop: 2, textAlign: "center",
        minHeight: 14, fontWeight: 500, textShadow: "0 1px 2px rgba(0,0,0,0.2)"
      }}>
        {error}
      </div>
      <div style={{ color: "#fff", fontSize: "0.8em", marginTop: 2, textAlign: "center" }}>
        Belum punya akun?{" "}
        <Link to="/register" style={{ color: "#90caf9", textDecoration: "none" }}>
          Register
        </Link>
      </div>
    </form>
  );
} 