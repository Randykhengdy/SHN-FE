export default function LoginInput({
  id,
  label,
  type,
  value,
  onChange,
  autoFocus,
  placeholder
}) {
  return (
    <div className="form-group" style={{ position: "relative" }}>
      <label htmlFor={id} style={{
        display: "block", textAlign: "left", marginBottom: 4, color: "#fff",
        fontWeight: 700, fontSize: "0.9em", textShadow: "0 2px 4px rgba(0,0,0,0.8)"
      }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        required
        style={{
          width: "100%", padding: "10px 12px", fontSize: "0.9em",
          border: "2px solid rgba(255,255,255,0.3)", borderRadius: 8,
          outline: "none", background: "rgba(255,255,255,0.2)", color: "#000",
          fontWeight: 500, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          backdropFilter: "blur(10px)", boxSizing: "border-box"
        }}
      />
    </div>
  );
} 