import { useEffect, useState } from "react";
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
import { reportFinanceService } from "@/services/reportFinanceService";
import { printPemakaianKasJenisBiayaReport } from "@/lib/pemakaianKasJenisBiayaReportPrint";
import { printSalesBarangGlobalReport } from "@/lib/salesBarangGlobalReportPrint";
import { reportStockService } from "@/services/reportStockService";
import { printStockGudangBarangReport } from "@/lib/stockGudangBarangReportPrint";
import { printStockBarangGudangReport } from "@/lib/stockBarangGudangReportPrint";
import { printStockGlobalReport } from "@/lib/stockGlobalReportPrint";
import { reportSalesOrderTrackingService } from "@/services/reportSalesOrderTrackingService";
import { printTrackingSOWOReport } from "@/lib/trackingSOWOReportPrint";
import { reportMutasiService } from "@/services/reportMutasiService";
import { printMutasiAntarGudangReport } from "@/lib/mutasiAntarGudangReportPrint";
import { printRubahStatusBarangReport } from "@/lib/rubahStatusBarangReportPrint";
import { printBarangRongsokReport } from "@/lib/barangRongsokReportPrint";
import { printBarangHabisReport } from "@/lib/barangHabisReportPrint";
import { printSplitBarangReport } from "@/lib/splitBarangReportPrint";
import { printStockOpnameReport } from "@/lib/stockOpnameReportPrint";
import { printKegiatanPelaksanaReport } from "@/lib/kegiatanPelaksanaReportPrint";
import { printRekapKegiatanPelaksanaReport } from "@/lib/rekapKegiatanPelaksanaReportPrint";
import { reportKasService } from "@/services/reportKasService";
import { printRincianKeuanganReport } from "@/lib/rincianKeuanganReportPrint";
import { printRekapLabaOperasionalReport } from "@/lib/rekapLabaOperasionalReportPrint";
import TabLayout from "@/components/layout/TabLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function App() {
  // Navigation dari Electron sekarang ditangani oleh TabLayout
  // (yang berada di dalam AppProvider dan punya akses ke addTab)
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
  const [isReportPemakaianKasJenisBiayaOpen, setIsReportPemakaianKasJenisBiayaOpen] = useState(false);
  const [isReportStockGudangBarangOpen, setIsReportStockGudangBarangOpen] = useState(false);
  const [isReportStockBarangGudangOpen, setIsReportStockBarangGudangOpen] = useState(false);
  const [isReportStockGlobalOpen, setIsReportStockGlobalOpen] = useState(false);
  const [isReportTrackingSOWOOpen, setIsReportTrackingSOWOOpen] = useState(false);
  const [isReportMutasiAntarGudangOpen, setIsReportMutasiAntarGudangOpen] = useState(false);
  const [isReportRubahStatusBarangOpen, setIsReportRubahStatusBarangOpen] = useState(false);
  const [isReportBarangRongsokOpen, setIsReportBarangRongsokOpen] = useState(false);
  const [isReportBarangHabisOpen, setIsReportBarangHabisOpen] = useState(false);
  const [isReportSplitBarangOpen, setIsReportSplitBarangOpen] = useState(false);
  const [isReportStockOpnameOpen, setIsReportStockOpnameOpen] = useState(false);
  const [isReportKegiatanPelaksanaOpen, setIsReportKegiatanPelaksanaOpen] = useState(false);
  const [isReportRekapKegiatanPelaksanaOpen, setIsReportRekapKegiatanPelaksanaOpen] = useState(false);
  const [isReportRincianKeuanganOpen, setIsReportRincianKeuanganOpen] = useState(false);
  const [isReportRekapLabaOperasionalOpen, setIsReportRekapLabaOperasionalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);

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

    // Listen for Close Application Request
    if (window.electronAPI.onCloseRequest) {
      window.electronAPI.onCloseRequest(() => {
        setIsCloseConfirmationOpen(true);
      });
    }

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

    // Listen for Pemakaian Kas / Jenis Biaya Report event
    if (window.electronAPI.onReportPemakaianKasJenisBiaya) {
      window.electronAPI.onReportPemakaianKasJenisBiaya(() => {
        setIsReportPemakaianKasJenisBiayaOpen(true);
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

    // Listen for Tracking SO/WO Report event
    if (window.electronAPI.onReportTrackingSOWO) {
      window.electronAPI.onReportTrackingSOWO(() => {
        setIsReportTrackingSOWOOpen(true);
      });
    }

    // Listen for Mutasi Antar Gudang Report event
    if (window.electronAPI.onReportMutasiAntarGudang) {
      window.electronAPI.onReportMutasiAntarGudang(() => {
        setIsReportMutasiAntarGudangOpen(true);
      });
    }

    // Listen for Rubah Status Barang Report event
    if (window.electronAPI.onReportRubahStatusBarang) {
      window.electronAPI.onReportRubahStatusBarang(() => {
        setIsReportRubahStatusBarangOpen(true);
      });
    }

    // Listen for Report Barang Rongsok event
    if (window.electronAPI.onReportBarangRongsok) {
      window.electronAPI.onReportBarangRongsok(() => {
        setIsReportBarangRongsokOpen(true);
      });
    }

    // Listen for Report Barang Habis event
    if (window.electronAPI.onReportBarangHabis) {
      window.electronAPI.onReportBarangHabis(() => {
        setIsReportBarangHabisOpen(true);
      });
    }

    // Listen for Report Split Barang event
    if (window.electronAPI.onReportSplitBarang) {
      window.electronAPI.onReportSplitBarang(() => {
        setIsReportSplitBarangOpen(true);
      });
    }

    // Listen for Stock Opname Report event
    if (window.electronAPI.onReportStockOpname) {
      window.electronAPI.onReportStockOpname(() => {
        setIsReportStockOpnameOpen(true);
      });
    }

    // Listen for Kegiatan Pelaksana Report event
    if (window.electronAPI.onReportKegiatanPelaksana) {
      window.electronAPI.onReportKegiatanPelaksana(() => {
        setIsReportKegiatanPelaksanaOpen(true);
      });
    }

    // Listen for Rekap Kegiatan Pelaksana Report event
    if (window.electronAPI.onReportRekapKegiatanPelaksana) {
      window.electronAPI.onReportRekapKegiatanPelaksana(() => {
        setIsReportRekapKegiatanPelaksanaOpen(true);
      });
    }

    // Listen for Rincian Keuangan Kas Report event
    if (window.electronAPI.onReportRincianKeuangan) {
      window.electronAPI.onReportRincianKeuangan(() => {
        setIsReportRincianKeuanganOpen(true);
      });
    }

    // Listen for Rekap Laba Operasional Report event
    if (window.electronAPI.onReportRekapLabaOperasional) {
      window.electronAPI.onReportRekapLabaOperasional(() => {
        setIsReportRekapLabaOperasionalOpen(true);
      });
    }

    return () => {

      // Note: IPC listeners are automatically cleaned up when component unmounts
    };
  }, [showAlert]);

  const handleGenerateRincianKeuangan = async (startDate, endDate) => {
    try {
      setReportLoading(true);
      const res = await reportKasService.getRincianKeuangan({ start_date: startDate, end_date: endDate });
      if (!res.success) throw new Error(res.message);
      
      const { data } = res;
      printRincianKeuanganReport(data, startDate, endDate);
      setIsReportRincianKeuanganOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      showAlert("Error", "Gagal menghasilkan laporan: " + (error.message || "Unknown error"), "error");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="h-screen w-screen overflow-hidden">
          {/* Exit Confirmation Modal */}
          <AlertDialog open={isCloseConfirmationOpen} onOpenChange={setIsCloseConfirmationOpen}>
            <AlertDialogContent className="sm:max-w-md p-0 overflow-hidden border-border/40 shadow-2xl bg-card">
              <AlertDialogHeader className="p-6 pb-4">
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </div>
                  Konfirmasi Tutup Aplikasi
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base text-muted-foreground pt-2">
                  Apakah Anda yakin ingin menutup aplikasi? Semua pekerjaan yang belum disimpan mungkin akan hilang.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="bg-muted/30 p-4 border-t border-border/40">
                <AlertDialogCancel className="w-full sm:w-auto h-10 px-6 font-medium bg-background hover:bg-muted transition-colors">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    if (window.electronAPI?.confirmClose) {
                      window.electronAPI.confirmClose();
                    }
                  }}
                  className="w-full sm:w-auto h-10 px-6 font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Ya, Tutup
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
            showToggleBarang={true}
            onGenerate={async (from, to, tampilkanBarang) => {
              try {
                setReportLoading(true);
                const result = await salesOrderService.getReport({
                  tanggal_mulai: from,
                  tanggal_akhir: to,
                  per_page: 9999,
                  sort: 'tanggal_so,asc;nomor_so,asc'
                });
                
                if (result.success && result.data) {
                  printSalesOrderTanggalReport(result.data, from, to, tampilkanBarang);
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
            showToggleBarang={true}
            onGenerate={async (from, to, tampilkanBarang) => {
              try {
                setReportLoading(true);
                const result = await financeInvoicePodService.getReportInvoicePenjualanTanggal({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to,
                  per_page: 9999,
                  sort: 'tanggal_cetak_invoice,asc;nomor_invoice,asc'
                });
                
                if (result.success && result.data) {
                  printInvoicePenjualanTanggalReport(result.data, from, to, tampilkanBarang);
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
                  printSalesGudangTanggalReport(result.data, result.data_rongsok, from, to);
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
                  printSalesGudangBarangReport(result.data, result.data_rongsok, from, to);
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
                  printSalesBarangGlobalReport(result.data, result.data_rongsok, from, to);
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
            open={isReportPemakaianKasJenisBiayaOpen}
            onOpenChange={setIsReportPemakaianKasJenisBiayaOpen}
            title="Report Pemakaian Kas / Tanggal / Jenis Biaya"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportFinanceService.getReportPemakaianKasTanggalJenisBiaya({
                  tanggal_invoice_start: from,
                  tanggal_invoice_end: to
                });
                
                if (result.success && result.data) {
                  printPemakaianKasJenisBiayaReport(result.data, from, to);
                  setIsReportPemakaianKasJenisBiayaOpen(false);
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

          <ReportDateRangeModal
            open={isReportTrackingSOWOOpen}
            onOpenChange={setIsReportTrackingSOWOOpen}
            title="Report Waktu Proses SO / WO / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportSalesOrderTrackingService.getTrackingSOWO({
                  start_date: from,
                  end_date: to,
                });
                if (result.success && result.data) {
                  printTrackingSOWOReport(result.data, from, to);
                  setIsReportTrackingSOWOOpen(false);
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
            open={isReportMutasiAntarGudangOpen}
            onOpenChange={setIsReportMutasiAntarGudangOpen}
            title="Report Mutasi Antar Gudang / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportMutasiService.getMutasiAntarGudang({
                  start_date: from,
                  end_date: to,
                });
                if (result.success && result.data) {
                  printMutasiAntarGudangReport(result.data, from, to);
                  setIsReportMutasiAntarGudangOpen(false);
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
            open={isReportRubahStatusBarangOpen}
            onOpenChange={setIsReportRubahStatusBarangOpen}
            title="Report Rubah Status Barang (Utuh ke Potongan) / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportMutasiService.getRubahStatusBarang({
                  start_date: from,
                  end_date: to,
                });
                
                if (result.success && result.data) {
                  printRubahStatusBarangReport(result.data, from, to);
                  setIsReportRubahStatusBarangOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report rubah status barang", "error");
                }
              } catch (error) {
                console.error("Error generating report rubah status barang:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportBarangRongsokOpen}
            onOpenChange={setIsReportBarangRongsokOpen}
            title="Report Barang Rongsok / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const params = { start_date: from, end_date: to };
                
                const result = await reportMutasiService.getReportBarangRongsok(params);
                
                if (result.success && result.data) {
                  printBarangRongsokReport(result.data, from, to);
                  setIsReportBarangRongsokOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report barang rongsok", "error");
                }
              } catch (error) {
                console.error("Error generating report barang rongsok:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportBarangHabisOpen}
            onOpenChange={setIsReportBarangHabisOpen}
            title="Report Barang Habis / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const params = { start_date: from, end_date: to };
                
                const result = await reportMutasiService.getReportBarangHabis(params);
                
                if (result.success && result.data) {
                  printBarangHabisReport(result.data, from, to);
                  setIsReportBarangHabisOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report barang habis", "error");
                }
              } catch (error) {
                console.error("Error generating report barang habis:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportSplitBarangOpen}
            onOpenChange={setIsReportSplitBarangOpen}
            title="Report Split Barang / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const params = { start_date: from, end_date: to };
                
                const result = await reportMutasiService.getReportSplitBarang(params);
                
                if (result.success && result.data) {
                  printSplitBarangReport(result.data, from, to);
                  setIsReportSplitBarangOpen(false);
                } else {
                  showAlert("Error", result.message || "Gagal mengambil data report split barang", "error");
                }
              } catch (error) {
                console.error("Error generating report split barang:", error);
                showAlert("Error", error.message || "Terjadi kesalahan saat generate report", "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          <ReportDateRangeModal
            open={isReportStockOpnameOpen}
            onOpenChange={setIsReportStockOpnameOpen}
            title="Report Stock Opname / Gudang / Barang"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportStockService.getStockOpname({
                  start_date: from,
                  end_date: to,
                });
                if (result.success && result.data) {
                  printStockOpnameReport(result.data, from, to);
                  setIsReportStockOpnameOpen(false);
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
            open={isReportKegiatanPelaksanaOpen}
            onOpenChange={setIsReportKegiatanPelaksanaOpen}
            title="Report Kegiatan Pelaksana / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportSalesOrderTrackingService.getKegiatanPelaksana({
                  start_date: from,
                  end_date: to,
                });
                if (result.success && result.data) {
                  printKegiatanPelaksanaReport(result.data, from, to);
                  setIsReportKegiatanPelaksanaOpen(false);
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
            open={isReportRekapKegiatanPelaksanaOpen}
            onOpenChange={setIsReportRekapKegiatanPelaksanaOpen}
            title="Report Rekap Kegiatan Pelaksana / Tanggal"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const result = await reportSalesOrderTrackingService.getRekapKegiatanPelaksana({
                  start_date: from,
                  end_date: to,
                });
                if (result.success && result.data) {
                  printRekapKegiatanPelaksanaReport(result.data, result.grand_total, from, to);
                  setIsReportRekapKegiatanPelaksanaOpen(false);
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
            open={isReportRincianKeuanganOpen}
            onOpenChange={setIsReportRincianKeuanganOpen}
            title="Report Rincian Keuangan dan Laba Operasional / Tanggal"
            loading={reportLoading}
            onGenerate={handleGenerateRincianKeuangan}
          />

          <ReportDateRangeModal
            open={isReportRekapLabaOperasionalOpen}
            onOpenChange={setIsReportRekapLabaOperasionalOpen}
            title="Rekap Laba Operasional & Keuangan"
            loading={reportLoading}
            onGenerate={async (from, to) => {
              try {
                setReportLoading(true);
                const res = await reportKasService.getRekapLabaOperasional({ start_date: from, end_date: to });
                if (!res.success) throw new Error(res.message);
                printRekapLabaOperasionalReport(res.data, from, to);
                setIsReportRekapLabaOperasionalOpen(false);
              } catch (error) {
                console.error("Error generating report:", error);
                showAlert("Error", "Gagal menghasilkan laporan: " + (error.message || "Unknown error"), "error");
              } finally {
                setReportLoading(false);
              }
            }}
          />

          {/* Main content - TabLayout mengelola Router dan Tabs sendiri */}
          <main className="w-full h-full overflow-auto">
            <TabLayout />
          </main>
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
