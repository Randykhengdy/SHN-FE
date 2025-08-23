export default function LoginBackground({ wallpaper }) {
  return (
    <div
      className="login-left"
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: `url(${wallpaper}) center center/cover no-repeat`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", zIndex: 1
      }}
    >
      <div
        style={{
          content: "''",
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 1
        }}
      />
    </div>
  );
} 