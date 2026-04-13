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
import { printRealisasiWOTanggalReport } from "@/lib/woActualReportPrint";
import { financeInvoicePodService } from "@/services/financeInvoicePodService";
import { printInvoicePenjualanTanggalReport } from "@/lib/invoiceReportPrint";

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();
  const { showAlert, AlertComponent } = useAlert();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isReportSOTanggalOpen, setIsReportSOTanggalOpen] = useState(false);
  const [isReportRealisasiWOTanggalOpen, setIsReportRealisasiWOTanggalOpen] = useState(false);
  const [isReportInvoicePenjualanTanggalOpen, setIsReportInvoicePenjualanTanggalOpen] = useState(false);
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
                const result = await woActualService.getReport({
                  tanggal_actual_start: from,
                  tanggal_actual_end: to,
                  per_page: 9999,
                  sort: 'tanggal_actual,asc;nomor_wo,asc'
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
