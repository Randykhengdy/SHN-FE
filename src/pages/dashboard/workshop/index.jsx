import React, { useEffect, useState } from "react";
import { workshopDashboardService } from "@/services/dashboards/workshopDashboardService";

const DashboardWorkshopPage = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchWorkOrders();
  }, []);

  return (
    <div style={{ 
      padding: "32px", 
      backgroundColor: "#1a1a1a", 
      minHeight: "100vh",
      color: "#ffffff"
    }}>
      <h1 style={{ 
        color: "#ffffff", 
        marginBottom: "24px",
        fontSize: "28px",
        fontWeight: "600"
      }}>
        PROGRESS SO - WO - INVOICE
      </h1>
      {loading && <p style={{ color: "#a0a0a0", fontSize: "16px" }}>Memuat data...</p>}
      {error && <p style={{ color: "#ff6b6b", fontSize: "16px" }}>{error}</p>}
      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#2d2d2d",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <thead>
              <tr style={{ background: "#3a3a3a" }}>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
                }}>No. SO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
                }}>Waktu SO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
                }}>No. WO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
                }}>Waktu WO</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
                }}>Estimasi Selesai</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
                }}>Real Selesai</th>
                <th style={{ 
                  border: "1px solid #4a4a4a", 
                  padding: "12px 16px",
                  color: "#000000",
                  fontWeight: "600",
                  textAlign: "left"
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
                  
                  if (wo.real_selesai && wo.nomor_inv) {
                    // Jika real_selesai dan nomor_inv sudah terisi -> hijau
                    textColor = "#10b981";
                  } else if (!wo.real_selesai) {
                    // Jika real_selesai belum terisi -> kuning
                    textColor = "#fff700"; // kuning sangat terang
                  } else if (wo.real_selesai && !wo.nomor_inv) {
                    // Jika real_selesai sudah terisi tapi nomor_inv belum -> putih
                    textColor = "#ffffff";
                  }

                  return (
                    <tr key={wo.nomor_so || idx} style={{
                      backgroundColor: idx % 2 === 0 ? "#2d2d2d" : "#333333",
                      transition: "background-color 0.2s ease"
                    }}>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
                    }}>{wo.nomor_so || "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
                    }}>{wo.waktu_so ? new Date(wo.waktu_so).toLocaleString("id-ID") : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
                    }}>{wo.nomor_wo || "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
                    }}>{wo.waktu_wo ? new Date(wo.waktu_wo).toLocaleString("id-ID") : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
                    }}>{wo.estimate_selesai ? new Date(wo.estimate_selesai).toLocaleString("id-ID") : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
                    }}>{wo.real_selesai ? new Date(wo.real_selesai).toLocaleString("id-ID") : "-"}</td>
                    <td style={{ 
                      border: "1px solid #4a4a4a", 
                      padding: "12px 16px",
                      color: textColor
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
