import React, { useEffect, useState } from "react";
import { workshopDashboardService } from "@/services/dashboards/workshopDashboardService";

const DashboardWorkshopPage = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(13); // Default font size

  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workshopDashboardService.getDashboardData();
      setWorkOrders(response.work_orders || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleRefresh = () => {
    fetchWorkOrders();
  };

  const handleEnlargeText = () => {
    setFontSize(prev => Math.min(prev + 2, 20)); // Max 20px
  };

  const handleEnsmallText = () => {
    setFontSize(prev => Math.max(prev - 2, 10)); // Min 10px
  };

  return (
    <div style={{ 
      padding: "0 0 32px 0", 
      backgroundColor: "#1a1a1a", 
      minHeight: "100vh",
      color: "#ffffff"
    }}>
      {loading && <p style={{ color: "#a0a0a0", fontSize: "16px" }}>Memuat data...</p>}
      {error && <p style={{ color: "#ff6b6b", fontSize: "16px" }}>{error}</p>}
      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          {/* Control buttons row */}
          <div style={{
            display: "flex",
            gap: "8px",
            marginBottom: "4px"
          }}>
            <button
              onClick={handleRefresh}
              style={{
                background: "#3a3a3a",
                border: "1px solid #4a4a4a",
                color: "#ffffff",
                padding: "6px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => e.target.style.background = "#4a4a4a"}
              onMouseOut={(e) => e.target.style.background = "#3a3a3a"}
            >
              🔄
            </button>
            <button
              onClick={handleEnlargeText}
              style={{
                background: "#3a3a3a",
                border: "1px solid #4a4a4a",
                color: "#ffffff",
                padding: "6px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => e.target.style.background = "#4a4a4a"}
              onMouseOut={(e) => e.target.style.background = "#3a3a3a"}
            >
              🔍+
            </button>
            <button
              onClick={handleEnsmallText}
              style={{
                background: "#3a3a3a",
                border: "1px solid #4a4a4a",
                color: "#ffffff",
                padding: "6px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s ease"
              }}
              onMouseOver={(e) => e.target.style.background = "#4a4a4a"}
              onMouseOut={(e) => e.target.style.background = "#3a3a3a"}
            >
              🔍-
            </button>
          </div>
           <table
             style={{
               width: "100%",
               borderCollapse: "collapse",
               background: "#2d2d2d",
               boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
               borderRadius: "0",
               overflow: "hidden"
             }}
          >
            <thead>
              <tr style={{ background: "#3a3a3a" }}>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>No. SO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>Buat SO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>No. WO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>Buat WO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>Estimasi Selesai</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>Close WO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "6px 8px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: `${fontSize + 1}px`
                }}>No. Invoice</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ 
                    textAlign: "center", 
                    padding: "24px",
                    color: "#a0a0a0",
                    backgroundColor: "#2d2d2d"
                  }}>
                    Tidak ada data work order.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo, idx) => {
                  // Logika warna teks berdasarkan kondisi
                  let textColor = "#ffffff"; // default putih
                  
                  if (wo.close_wo_at && wo.nomor_inv) {
                    // Jika close_wo_at dan nomor_inv sudah terisi -> hijau
                    textColor = "#10b981";
                  } else if (!wo.close_wo_at) {
                    // Jika close_wo_at belum terisi -> kuning
                    textColor = "#fff700"; // kuning sangat terang
                  } else if (wo.close_wo_at && !wo.nomor_inv) {
                    // Jika close_wo_at sudah terisi tapi nomor_inv belum -> putih
                    textColor = "#ffffff";
                  }

                  return (
                    <tr key={wo.nomor_so || idx} style={{
                      backgroundColor: idx % 2 === 0 ? "#2d2d2d" : "#333333",
                      transition: "background-color 0.2s ease"
                    }}>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "4px 6px",
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.2"
                    }}>{wo.nomor_so || "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "4px 6px",
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.2"
                    }}>{wo.waktu_so ? new Date(wo.waktu_so).toLocaleDateString("id-ID", { 
                      day: "2-digit", 
                      month: "2-digit", 
                      year: "2-digit" 
                    }) + " " + new Date(wo.waktu_so).toLocaleTimeString("id-ID", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    }) : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "4px 6px",
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.2"
                    }}>{wo.nomor_wo || "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "4px 6px",
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.2"
                    }}>{wo.waktu_wo ? new Date(wo.waktu_wo).toLocaleTimeString("id-ID", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    }) : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "4px 6px",
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.2"
                    }}>{wo.estimate_selesai ? new Date(wo.estimate_selesai).toLocaleTimeString("id-ID", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    }) : "-"}</td>
                     <td style={{ 
                       border: "1px solid #4a4a4a", 
                       padding: "4px 6px",
                       color: textColor,
                       fontSize: `${fontSize}px`,
                       lineHeight: "1.2"
                     }}>{wo.close_wo_at ? new Date(wo.close_wo_at).toLocaleTimeString("id-ID", { 
                       hour: "2-digit", 
                       minute: "2-digit" 
                     }) : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "4px 6px",
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.2"
                    }}>{wo.nomor_inv || "-"}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardWorkshopPage;
