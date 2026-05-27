import { useEffect, useState } from "react";
import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import TokenInterceptor from "@/components/TokenInterceptor";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAlert } from "@/hooks/useAlert";
import "@/lib/tokenDebug"; // Import debug utilities
import "@/lib/debugUtils"; // Import debug utilities
import { AppProvider } from "@/context/AppContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import ReportDateRangeModal from "@/components/modals/ReportDateRangeModal";
import { salesOrderService } from "@/services/salesOrderService";
import { woActualService } from "@/services/woActualService";
import { printSalesOrderTanggalReport } from "@/lib/soReportPrint";
import { printRealisasiWOTanggalReport } from "@/lib/realisasiWOTanggalReportPrint";
import { financeInvoicePodService } from "@/services/financeInvoicePodService";
import { printInvoicePenjualanTanggalReport } from "@/lib/invoiceReportPrint";
import { printSalesGudangTanggalReport } from "@/lib/salesGudangReportPrint";
import { printSalesGudangBarangReport } from "@/lib/salesGudangBarangReportPrint";
import { printSalesBarangGlobalReport } from "@/lib/salesBarangGlobalReportPrint";
import { printSalesPelangganBarangReport } from "@/lib/salesPelangganBarangReportPrint";
import { printPiutangPelangganReport } from "@/lib/piutangPelangganReportPrint";
import { printPembayaranUangMukaPiutangReport } from "@/lib/pembayaranUangMukaPiutangReportPrint";
import { reportSalesService } from "@/services/reportSalesService";

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();
  const { showAlert, AlertComponent } = useAlert();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isReportSOTanggalOpen, setIsReportSOTanggalOpen] = useState(false);
  const [isReportRealisasiWOTanggalOpen, setIsReportRealisasiWOTanggalOpen] = useState(false);
  const [isReportInvoicePenjualanTanggalOpen, setIsReportInvoicePenjualanTanggalOpen] = useState(false);
  const [isReportPenjualanGudangTanggalOpen, setIsReportPenjualanGudangTanggalOpen] = useState(false);
  const [isReportPenjualanGudangBarangOpen, setIsReportPenjualanGudangBarangOpen] = useState(false);
  const [isReportPenjualanPelangganBarangOpen, setIsReportPenjualanPelangganBarangOpen] = useState(false);
  const [isReportPenjualanBarangGlobalOpen, setIsReportPenjualanBarangGlobalOpen] = useState(false);
  const [isReportPiutangPelangganOpen, setIsReportPiutangPelangganOpen] = useState(false);
  const [isReportPembayaranUmPiutangOpen, setIsReportPembayaranUmPiutangOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Listen for global alert events from utility functions (like tokenUtils)
  useEffect(() => {
    const handleShowAlert = (event) => {
      const { title, message, type } = event.detail;
      showAlert(title, message, type);
    };

    window.addEventListener('showAlert', handleShowAlert);

    return () => {
      window.removeEventListener('showAlert', handleShowAlert);
    };
  }, [showAlert]);

  // Listen for alert events from Electron main process
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleElectronAlert = (data) => {
      const { title, message, type } = data;
      showAlert(title, message, type);
    };

    window.electronAPI.onShowAlert(handleElectronAlert);

    // Listen for Change Password Modal event
    if (window.electronAPI.onChangePassword) {
      window.electronAPI.onChangePassword(() => {
        setIsChangePasswordOpen(true);
      });
    }

    // Listen for SO / Tanggal Report event
    if (window.electronAPI.onReportSOTanggal) {
      window.electronAPI.onReportSOTanggal(() => {
        setIsReportSOTanggalOpen(true);
      });
    }

    // Listen for Realisasi WO / Tanggal Report event
    if (window.electronAPI.onReportRealisasiWOTanggal) {
      window.electronAPI.onReportRealisasiWOTanggal(() => {
        setIsReportRealisasiWOTanggalOpen(true);
      });
    }

    // Listen for Invoice Penjualan / Tanggal Report event
    if (window.electronAPI.onReportInvoicePenjualanTanggal) {
      window.electronAPI.onReportInvoicePenjualanTanggal(() => {
        setIsReportInvoicePenjualanTanggalOpen(true);
      });
    }

    // Listen for Penjualan / Gudang / Tanggal Report event
    if (window.electronAPI.onReportPenjualanGudangTanggal) {
      window.electronAPI.onReportPenjualanGudangTanggal(() => {
        setIsReportPenjualanGudangTanggalOpen(true);
      });
    }

    // Listen for Penjualan / Gudang / Barang Report event
    if (window.electronAPI.onReportPenjualanGudangBarang) {
      window.electronAPI.onReportPenjualanGudangBarang(() => {
        setIsReportPenjualanGudangBarangOpen(true);
      });
    }

    // Listen for Penjualan / Pelanggan / Barang Report event
    if (window.electronAPI.onReportPenjualanPelangganBarang) {
      window.electronAPI.onReportPenjualanPelangganBarang(() => {
        setIsReportPenjualanPelangganBarangOpen(true);
      });
    }

    // Listen for Penjualan / Barang - Global Report event
    if (window.electronAPI.onReportPenjualanBarangGlobal) {
      window.electronAPI.onReportPenjualanBarangGlobal(() => {
        setIsReportPenjualanBarangGlobalOpen(true);
      });
    }

    // Listen for Invoice Piutang / Pelanggan Report event
    if (window.electronAPI.onReportPiutangPelanggan) {
      window.electronAPI.onReportPiutangPelanggan(() => {
        setIsReportPiutangPelangganOpen(true);
      });
    }

    // Listen for Pembayaran Uang Muka & Piutang Report event
    if (window.electronAPI.onReportPembayaranUmPiutang) {
      window.electronAPI.onReportPembayaranUmPiutang(() => {
        setIsReportPembayaranUmPiutangOpen(true);
      });
    }

    return () => {

      // Note: IPC listeners are automatically cleaned up when component unmounts
    };
  }, [showAlert]);

  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="h-screen w-screen overflow-hidden">
          {/* Token Interceptor - Check token expiration */}
          <TokenInterceptor />
          
          {/* Global Alert Component */}
          <AlertComponent />
          
          {/* Global Change Password Modal */}
          <ChangePasswordModal 
            isOpen={isChangePasswordOpen} 
            onClose={() => setIsChangePasswordOpen(false)} 
          />

          <ReportDateRangeModal
            open={isReportSOTanggalOpen}
            onOpenChange={setIsReportSOTanggalOpen}
            title="Report Sales Order / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await salesOrderService.getReport({
                  tanggal_mulai: from,
                  tanggal_akhir: to,
                  per_page: 9999,
                  sort: 'tanggal_so,asc;nomor_so,asc'
                });
                
                if (result.success && result.data) {
                  printSalesOrderTanggalReport(result.data, from, to);
                  setIsReportSOTanggalOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportRealisasiWOTanggalOpen}
            onOpenChange={setIsReportRealisasiWOTanggalOpen}
            title="Report Realisasi WO / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportSalesService.getRealisasiWO({
                  tanggal_start: from,
                  tanggal_end: to,
                });

                if (result.success && result.data) {
                  printRealisasiWOTanggalReport(result.data, from, to);
                  setIsReportRealisasiWOTanggalOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportInvoicePenjualanTanggalOpen}
            onOpenChange={setIsReportInvoicePenjualanTanggalOpen}
            title="Report Invoice Penjualan / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportInvoicePenjualanTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to,
                  per_page: 9999,
                  sort: 'tanggal_cetak_invoice,asc;nomor_invoice,asc'
                });
                
                if (result.success && result.data) {
                  printInvoicePenjualanTanggalReport(result.data, from, to);
                  setIsReportInvoicePenjualanTanggalOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportPenjualanGudangTanggalOpen}
            onOpenChange={setIsReportPenjualanGudangTanggalOpen}
            title="Report Penjualan / Gudang / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportPenjualanGudangTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printSalesGudangTanggalReport(result.data, from, to);
                  setIsReportPenjualanGudangTanggalOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportPenjualanGudangBarangOpen}
            onOpenChange={setIsReportPenjualanGudangBarangOpen}
            title="Report Penjualan / Gudang / Barang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportPenjualanGudangBarangTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printSalesGudangBarangReport(result.data, from, to);
                  setIsReportPenjualanGudangBarangOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportPenjualanPelangganBarangOpen}
            onOpenChange={setIsReportPenjualanPelangganBarangOpen}
            title="Report Penjualan / Pelanggan / Barang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportPenjualanPelangganBarangTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printSalesPelangganBarangReport(result.data, from, to);
                  setIsReportPenjualanPelangganBarangOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportPenjualanBarangGlobalOpen}
            onOpenChange={setIsReportPenjualanBarangGlobalOpen}
            title="Report Penjualan / Barang - Global"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportPenjualanBarangGlobalTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printSalesBarangGlobalReport(result.data, from, to);
                  setIsReportPenjualanBarangGlobalOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportPiutangPelangganOpen}
            onOpenChange={setIsReportPiutangPelangganOpen}
            title="Invoice Piutang / Pelanggan"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportSalesService.getPiutangPelanggan({
                  start_date: from,
                  end_date: to,
                });

                if (result.success && result.data) {
                  printPiutangPelangganReport(result.data, from, to);
                  setIsReportPiutangPelangganOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating piutang report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportPembayaranUmPiutangOpen}
            onOpenChange={setIsReportPembayaranUmPiutangOpen}
            title="Pembayaran Penjualan Uang Muka & Piutang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportSalesService.getPembayaranUangMukaPiutang({
                  start_date: from,
                  end_date: to,
                });

                if (result.success && result.data) {
                  printPembayaranUangMukaPiutangReport(result.data, from, to);
                  setIsReportPembayaranUmPiutangOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report", "error");
                }
              } catch (error) {
                console.error("Error generating pembayaran um piutang report:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          {/* Main content - Full width without sidebar */}
          <main className="w-full h-full overflow-auto">
            <AppRouter />
          </main>
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
