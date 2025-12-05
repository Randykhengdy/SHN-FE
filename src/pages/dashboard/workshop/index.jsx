import React, { useEffect, useState, useCallback } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { workshopDashboardService } from "@/services/dashboards/workshopDashboardService";

// Register Indonesian locale
registerLocale("id", id);

const DashboardWorkshopPage = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(13); // Default font size
  const [showCustomerName, setShowCustomerName] = useState(true); // Toggle untuk kolom nama pelanggan
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.date_from = format(dateFrom, "yyyy-MM-dd");
      if (dateTo) params.date_to = format(dateTo, "yyyy-MM-dd");
      
      const response = await workshopDashboardService.getDashboardData(params);
      setWorkOrders(response.work_orders || []);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

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
      <style>{`
        .date-picker-wrapper {
          display: inline-block;
        }
        .date-picker-input {
          background: #2d2d2d !important;
          border: 1px solid #4a4a4a !important;
          color: #ffffff !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 13px !important;
          cursor: pointer !important;
          width: 140px !important;
        }
        .date-picker-input::placeholder {
          color: #a0a0a0 !important;
        }
        .date-picker-input:focus {
          outline: none !important;
          border-color: #6a6a6a !important;
        }
        .date-picker-popper {
          z-index: 9999 !important;
        }
        .react-datepicker {
          background-color: #2d2d2d !important;
          border: 1px solid #4a4a4a !important;
          font-family: inherit !important;
        }
        .react-datepicker__header {
          background-color: #3a3a3a !important;
          border-bottom: 1px solid #4a4a4a !important;
        }
        .react-datepicker__current-month {
          color: #ffffff !important;
        }
        .react-datepicker__day-name {
          color: #ffffff !important;
        }
        .react-datepicker__day {
          color: #ffffff !important;
        }
        .react-datepicker__day:hover {
          background-color: #4a4a4a !important;
        }
        .react-datepicker__day--selected {
          background-color: #6a6a6a !important;
          color: #ffffff !important;
        }
        .react-datepicker__day--selected:hover {
          background-color: #7a7a7a !important;
        }
        .react-datepicker__day--in-range {
          background-color: #4a4a4a !important;
          color: #ffffff !important;
        }
        .react-datepicker__day--in-selecting-range {
          background-color: #4a4a4a !important;
          color: #ffffff !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #5a5a5a !important;
          color: #ffffff !important;
        }
        .react-datepicker__day--today {
          font-weight: bold !important;
          color: #39FF14 !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #ffffff !important;
        }
        .react-datepicker__triangle {
          border-bottom-color: #2d2d2d !important;
        }
        .react-datepicker__triangle::before {
          border-bottom-color: #4a4a4a !important;
        }
        .react-datepicker__close-icon::after {
          background-color: #ffffff !important;
          color: #2d2d2d !important;
        }
      `}</style>
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
            {/* Date Range Filter */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "16px"
            }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#ffffff",
                fontSize: "14px"
              }}>
                Dari:
                <DatePicker
                  selected={dateFrom}
                  onChange={(date) => setDateFrom(date)}
                  selectsStart
                  startDate={dateFrom}
                  endDate={dateTo}
                  dateFormat="dd/MM/yyyy"
                  locale="id"
                  placeholderText="Pilih tanggal"
                  isClearable
                  className="date-picker-input"
                  wrapperClassName="date-picker-wrapper"
                  popperClassName="date-picker-popper"
                />
              </label>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#ffffff",
                fontSize: "14px"
              }}>
                Sampai:
                <DatePicker
                  selected={dateTo}
                  onChange={(date) => setDateTo(date)}
                  selectsEnd
                  startDate={dateFrom}
                  endDate={dateTo}
                  minDate={dateFrom}
                  dateFormat="dd/MM/yyyy"
                  locale="id"
                  placeholderText="Pilih tanggal"
                  isClearable
                  className="date-picker-input"
                  wrapperClassName="date-picker-wrapper"
                  popperClassName="date-picker-popper"
                />
              </label>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom(null);
                    setDateTo(null);
                    // fetchWorkOrders will be called automatically via useEffect
                  }}
                  style={{
                    background: "#3a3a3a",
                    border: "1px solid #4a4a4a",
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#4a4a4a"}
                  onMouseOut={(e) => e.target.style.background = "#3a3a3a"}
                >
                  Clear
                </button>
              )}
            </div>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#ffffff",
              fontSize: "14px",
              cursor: "pointer",
              marginLeft: "16px"
            }}>
              <input
                type="checkbox"
                checked={showCustomerName}
                onChange={(e) => setShowCustomerName(e.target.checked)}
                style={{
                  cursor: "pointer",
                  transform: "scale(1.2)"
                }}
              />
              Tampilkan Nama Pelanggan
            </label>
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
                {showCustomerName && (
                  <th style={{ 
                    border: "1px solid #4a4a4a", 
                    padding: "6px 8px",
                    color: "#000000",
                    fontWeight: "600",
                    textAlign: "left",
                    fontSize: `${fontSize + 1}px`
                  }}>Nama Pelanggan</th>
                )}
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
                  <td colSpan={showCustomerName ? 8 : 7} style={{ 
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
                    // Jika close_wo_at dan nomor_inv sudah terisi -> hijau neon (terang)
                    textColor = "#39FF14";
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
                    {showCustomerName && (
                      <td style={{ 
                        border: "1px solid #4a4a4a", 
                        padding: "4px 6px",
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        lineHeight: "1.2"
                      }}>{wo.nama_customer || "-"}</td>
                    )}
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
