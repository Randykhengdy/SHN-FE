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
import { printSalesGudangTanggalReport } from "@/lib/salesGudangReportPrint";
import { printSalesGudangBarangReport } from "@/lib/salesGudangBarangReportPrint";
import { printSalesPelangganBarangReport } from "@/lib/salesPelangganBarangReportPrint";
import { printSalesPelangganTanggalReport } from "@/lib/salesPelangganTanggalReportPrint";
import { printInvoicePiutangPelangganReport } from "@/lib/invoicePiutangPelangganReportPrint";
import { printPembayaranUMPiutangReport } from "@/lib/pembayaranUMPiutangReportPrint";
import { reportPurchaseService } from "@/services/reportPurchaseService";
import { printFakturPembelianTanggalReport } from "@/lib/fakturPembelianTanggalReportPrint";
import { printPembelianGudangTanggalReport } from "@/lib/pembelianGudangTanggalReportPrint";
import { printPembelianGudangBarangReport } from "@/lib/pembelianGudangBarangReportPrint";
import { printPembelianBarangGlobalReport } from "@/lib/pembelianBarangGlobalReportPrint";
import { printInvoiceHutangSupplierReport } from "@/lib/invoiceHutangSupplierReportPrint";
import { printSalesBarangGlobalReport } from "@/lib/salesBarangGlobalReportPrint";
import { reportStockService } from "@/services/reportStockService";
import { printStockGudangBarangReport } from "@/lib/stockGudangBarangReportPrint";
import { printStockBarangGudangReport } from "@/lib/stockBarangGudangReportPrint";
import { printStockGlobalReport } from "@/lib/stockGlobalReportPrint";

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
  const [isReportPenjualanBarangGlobalOpen, setIsReportPenjualanBarangGlobalOpen] = useState(false);
  const [isReportPenjualanPelangganBarangOpen, setIsReportPenjualanPelangganBarangOpen] = useState(false);
  const [isReportPenjualanPelangganTanggalOpen, setIsReportPenjualanPelangganTanggalOpen] = useState(false);
  const [isReportInvoicePiutangPelangganOpen, setIsReportInvoicePiutangPelangganOpen] = useState(false);
  const [isReportPembayaranUMPiutangOpen, setIsReportPembayaranUMPiutangOpen] = useState(false);
  const [isReportFakturPembelianTanggalOpen, setIsReportFakturPembelianTanggalOpen] = useState(false);
  const [isReportPembelianGudangTanggalOpen, setIsReportPembelianGudangTanggalOpen] = useState(false);
  const [isReportPembelianGudangBarangOpen, setIsReportPembelianGudangBarangOpen] = useState(false);
  const [isReportPembelianBarangGlobalOpen, setIsReportPembelianBarangGlobalOpen] = useState(false);
  const [isReportInvoiceHutangSupplierOpen, setIsReportInvoiceHutangSupplierOpen] = useState(false);
  const [isReportStockGudangBarangOpen, setIsReportStockGudangBarangOpen] = useState(false);
  const [isReportStockBarangGudangOpen, setIsReportStockBarangGudangOpen] = useState(false);
  const [isReportStockGlobalOpen, setIsReportStockGlobalOpen] = useState(false);
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

    // Listen for Penjualan / Barang - Global Report event
    if (window.electronAPI.onReportPenjualanBarangGlobal) {
      window.electronAPI.onReportPenjualanBarangGlobal(() => {
        setIsReportPenjualanBarangGlobalOpen(true);
      });
    }

    // Listen for Penjualan / Pelanggan / Barang Report event
    if (window.electronAPI.onReportPenjualanPelangganBarang) {
      window.electronAPI.onReportPenjualanPelangganBarang(() => {
        setIsReportPenjualanPelangganBarangOpen(true);
      });
    }

    // Listen for Penjualan / Pelanggan / Tanggal Report event
    if (window.electronAPI.onReportPenjualanPelangganTanggal) {
      window.electronAPI.onReportPenjualanPelangganTanggal(() => {
        setIsReportPenjualanPelangganTanggalOpen(true);
      });
    }

    // Listen for Invoice Piutang / Pelanggan Report event
    if (window.electronAPI.onReportInvoicePiutangPelanggan) {
      window.electronAPI.onReportInvoicePiutangPelanggan(() => {
        setIsReportInvoicePiutangPelangganOpen(true);
      });
    }

    // Listen for Pembayaran Penjualan Uang Muka & Piutang Report event
    if (window.electronAPI.onReportPembayaranUMPiutang) {
      window.electronAPI.onReportPembayaranUMPiutang(() => {
        setIsReportPembayaranUMPiutangOpen(true);
      });
    }

    // Listen for Faktur Pembelian / Tanggal Report event
    if (window.electronAPI.onReportFakturPembelianTanggal) {
      window.electronAPI.onReportFakturPembelianTanggal(() => {
        setIsReportFakturPembelianTanggalOpen(true);
      });
    }

    // Listen for Pembelian / Gudang / Tanggal Report event
    if (window.electronAPI.onReportPembelianGudangTanggal) {
      window.electronAPI.onReportPembelianGudangTanggal(() => {
        setIsReportPembelianGudangTanggalOpen(true);
      });
    }

    // Listen for Pembelian / Gudang / Barang Report event
    if (window.electronAPI.onReportPembelianGudangBarang) {
      window.electronAPI.onReportPembelianGudangBarang(() => {
        setIsReportPembelianGudangBarangOpen(true);
      });
    }

    // Listen for Pembelian Barang Global Report event
    if (window.electronAPI.onReportPembelianBarangGlobal) {
      window.electronAPI.onReportPembelianBarangGlobal(() => {
        setIsReportPembelianBarangGlobalOpen(true);
      });
    }

    // Listen for Invoice Hutang / Supplier Report event
    if (window.electronAPI.onReportInvoiceHutangSupplier) {
      window.electronAPI.onReportInvoiceHutangSupplier(() => {
        setIsReportInvoiceHutangSupplierOpen(true);
      });
    }

    // Listen for Stock / Gudang / Barang Report event
    if (window.electronAPI.onReportStockGudangBarang) {
      window.electronAPI.onReportStockGudangBarang(() => {
        setIsReportStockGudangBarangOpen(true);
      });
    }

    // Listen for Stock / Barang / Gudang Report event
    if (window.electronAPI.onReportStockBarangGudang) {
      window.electronAPI.onReportStockBarangGudang(() => {
        setIsReportStockBarangGudangOpen(true);
      });
    }

    // Listen for Stock Global / Semua Gudang Report event
    if (window.electronAPI.onReportStockGlobal) {
      window.electronAPI.onReportStockGlobal(() => {
        setIsReportStockGlobalOpen(true);
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
            open={isReportPenjualanPelangganTanggalOpen}
            onOpenChange={setIsReportPenjualanPelangganTanggalOpen}
            title="Report Penjualan / Pelanggan / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportPenjualanPelangganTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printSalesPelangganTanggalReport(result.data, from, to);
                  setIsReportPenjualanPelangganTanggalOpen(false);
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
            open={isReportInvoicePiutangPelangganOpen}
            onOpenChange={setIsReportInvoicePiutangPelangganOpen}
            title="Report Invoice Piutang / Pelanggan"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportInvoicePiutangPelanggan({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printInvoicePiutangPelangganReport(result.data);
                  setIsReportInvoicePiutangPelangganOpen(false);
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
            open={isReportPembayaranUMPiutangOpen}
            onOpenChange={setIsReportPembayaranUMPiutangOpen}
            title="Report Pembayaran Penjualan Uang Muka & Piutang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportPembayaranPenjualanUMPiutang({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printPembayaranUMPiutangReport(result.data, from, to);
                  setIsReportPembayaranUMPiutangOpen(false);
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
            open={isReportFakturPembelianTanggalOpen}
            onOpenChange={setIsReportFakturPembelianTanggalOpen}
            title="Report Faktur Pembelian / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportPurchaseService.getReportFakturPembelianTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printFakturPembelianTanggalReport(result.data, from, to);
                  setIsReportFakturPembelianTanggalOpen(false);
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
            open={isReportPembelianGudangTanggalOpen}
            onOpenChange={setIsReportPembelianGudangTanggalOpen}
            title="Report Pembelian / Gudang / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportPurchaseService.getReportPembelianGudangTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printPembelianGudangTanggalReport(result.data, from, to);
                  setIsReportPembelianGudangTanggalOpen(false);
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
            open={isReportPembelianGudangBarangOpen}
            onOpenChange={setIsReportPembelianGudangBarangOpen}
            title="Report Pembelian / Gudang / Barang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportPurchaseService.getReportPembelianGudangBarang({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printPembelianGudangBarangReport(result.data, from, to);
                  setIsReportPembelianGudangBarangOpen(false);
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
            open={isReportPembelianBarangGlobalOpen}
            onOpenChange={setIsReportPembelianBarangGlobalOpen}
            title="Report Pembelian Barang Global"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportPurchaseService.getReportPembelianBarangGlobal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printPembelianBarangGlobalReport(result.data, from, to);
                  setIsReportPembelianBarangGlobalOpen(false);
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
            open={isReportInvoiceHutangSupplierOpen}
            onOpenChange={setIsReportInvoiceHutangSupplierOpen}
            title="Report Invoice Hutang / Supplier"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportPurchaseService.getReportInvoiceHutangSupplier({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printInvoiceHutangSupplierReport(result.data);
                  setIsReportInvoiceHutangSupplierOpen(false);
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
            open={isReportStockGudangBarangOpen}
            onOpenChange={setIsReportStockGudangBarangOpen}
            title="Report Stock / Gudang / Barang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportStockService.getStockGudangBarang({
                  start_date: from,
                  end_date: to,
                });

                if (result.status === 'success' && result.data) {
                  printStockGudangBarangReport(result.data, from, to);
                  setIsReportStockGudangBarangOpen(false);
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
            open={isReportStockBarangGudangOpen}
            onOpenChange={setIsReportStockBarangGudangOpen}
            title="Report Stock / Barang / Gudang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportStockService.getStockBarangGudang({
                  start_date: from,
                  end_date: to,
                });
                if (result.status === 'success' && result.data) {
                  printStockBarangGudangReport(result.data, from, to);
                  setIsReportStockBarangGudangOpen(false);
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
            open={isReportStockGlobalOpen}
            onOpenChange={setIsReportStockGlobalOpen}
            title="Report Stock Barang Global / Semua Gudang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportStockService.getStockGlobal({
                  start_date: from,
                  end_date: to,
                });
                if (result.status === 'success' && result.data) {
                  printStockGlobalReport(result.data, from, to);
                  setIsReportStockGlobalOpen(false);
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
