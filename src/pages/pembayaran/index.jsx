import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, FileText, Eye, RefreshCw, Printer, CheckCircle, XCircle, AlertCircle, DollarSign, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pembayaranService } from "@/services/pembayaranService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";
import { generatePaymentReceiptPrintContent, openPrintDialog } from "@/lib/printUtils";

const paymentStatusFilterOptions = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Sudah Dibayar" },
  { value: "partial", label: "Sebagian" }
];

// Format tanggal helper: tanggal/bulan/tahun, jam:menit:detik
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Format tanggal saja: tanggal/bulan/tahun
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

export default function PembayaranPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("purchase-order");
  
  // Invoice payment states
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  
  // Purchase Order payment states
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState("");
  const [poPaymentStatusFilter, setPoPaymentStatusFilter] = useState("all");
  
  // Pagination state (shared for invoice)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [pagination, setPagination] = useState(null);
  
  // PO Pagination state
  const [poCurrentPage, setPoCurrentPage] = useState(1);
  const [poItemsPerPage, setPoItemsPerPage] = useState(10);
  const [poTotalItems, setPoTotalItems] = useState(0);
  const [poPagination, setPoPagination] = useState(null);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState({});
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    tanggal_payment: new Date().toISOString().split('T')[0],
    jumlah_payment: '',
    catatan: ''
  });
  const [paymentFormErrors, setPaymentFormErrors] = useState({});
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState({
    noSo: true,
    noSuratJalan: true,
    sisaBayar: true
  });
  
  // Summary state
  const [summary, setSummary] = useState({
    total_invoice: 0,
    sudah_dibayar: 0,
    pending: 0,
    sebagian: 0,
    total_dibayar: 0
  });
  
  // Payment detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // PO Payment modal state
  const [poPaymentModalOpen, setPoPaymentModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poPaymentForm, setPoPaymentForm] = useState({
    tanggal_payment: new Date().toISOString().split('T')[0],
    jumlah_payment: '',
    catatan: ''
  });
  const [poPaymentFormErrors, setPoPaymentFormErrors] = useState({});
  const [submittingPoPayment, setSubmittingPoPayment] = useState(false);
  
  // PO Payment detail modal state
  const [poDetailModalOpen, setPoDetailModalOpen] = useState(false);
  const [poPaymentDetail, setPoPaymentDetail] = useState(null);
  const [loadingPoDetail, setLoadingPoDetail] = useState(false);

  // Load invoices from API
  const loadInvoices = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filter parameters
      const params = {
        page: currentPage,
        per_page: itemsPerPage
      };
      if (paymentStatusFilter !== "all") {
        params.status_bayar = paymentStatusFilter;
      }
      
      const result = await pembayaranService.getPayments(params);
      
      // Transform API data to match our UI structure
      const transformedData = result.data?.map(inv => ({
        id: inv.id,
        nomorInvoice: inv.nomor_invoice,
        nomorSo: inv.nomor_so,
        nomorPod: inv.nomor_pod,
        namaCustomer: inv.nama_customer,
        grandTotal: parseFloat(inv.grand_total || 0),
        uangMuka: parseFloat(inv.uang_muka || 0),
        sisaBayar: parseFloat(inv.sisa_bayar || 0),
        statusBayar: inv.status_bayar,
        tanggalCetakInvoice: inv.tanggal_cetak_invoice,
        tanggalCetakPod: inv.tanggal_cetak_pod,
        handoverMethod: inv.handover_method
      })) || [];
      
      // Apply search filter (client-side for now)
      let filteredData = transformedData;
      if (searchTerm) {
        filteredData = filteredData.filter(inv => 
          inv.nomorInvoice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.nomorSo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.nomorPod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.namaCustomer?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setInvoices(filteredData);
      setTotalItems(result.pagination?.total || filteredData.length);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showAlert("Error", "Gagal memuat data Invoice", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, paymentStatusFilter]);

  // Load payment summary
  const loadSummary = React.useCallback(async () => {
    try {
      const result = await pembayaranService.getPaymentSummary();
      if (result.success && result.data) {
        setSummary({
          total_invoice: result.data.total_invoice || 0,
          sudah_dibayar: result.data.sudah_dibayar || 0,
          pending: result.data.pending || 0,
          sebagian: result.data.sebagian || 0,
          total_dibayar: parseFloat(result.data.total_dibayar || 0)
        });
      }
    } catch (error) {
      console.error('Error loading payment summary:', error);
      // Don't show alert for summary error, just log it
    }
  }, []);

  // Handle open payment modal
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      tanggal_payment: new Date().toISOString().split('T')[0],
      jumlah_payment: '',
      catatan: ''
    });
    setPaymentFormErrors({});
    setPaymentModalOpen(true);
  };

  // Handle close payment modal
  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedInvoice(null);
    setPaymentForm({
      tanggal_payment: new Date().toISOString().split('T')[0],
      jumlah_payment: '',
      catatan: ''
    });
    setPaymentFormErrors({});
  };

  // Handle submit payment
  const handleSubmitPayment = async () => {
    // Reset errors
    setPaymentFormErrors({});
    
    // Validation
    const errors = {};
    if (!paymentForm.tanggal_payment) {
      errors.tanggal_payment = 'Tanggal pembayaran wajib diisi';
    }
    if (!paymentForm.jumlah_payment || parseFloat(paymentForm.jumlah_payment) <= 0) {
      errors.jumlah_payment = 'Jumlah pembayaran wajib diisi dan minimal 0.01';
    } else if (selectedInvoice && parseFloat(paymentForm.jumlah_payment) > selectedInvoice.sisaBayar) {
      errors.jumlah_payment = `Jumlah pembayaran melebihi sisa bayar. Sisa bayar: Rp ${selectedInvoice.sisaBayar.toLocaleString('id-ID')}`;
    }
    
    if (Object.keys(errors).length > 0) {
      setPaymentFormErrors(errors);
      return;
    }

    try {
      setSubmittingPayment(true);
      
      const paymentData = {
        jumlah_payment: parseFloat(paymentForm.jumlah_payment),
        tanggal_payment: paymentForm.tanggal_payment,
      };
      
      if (paymentForm.catatan && paymentForm.catatan.trim()) {
        paymentData.catatan = paymentForm.catatan.trim();
      }
      
      const result = await pembayaranService.processPayment(selectedInvoice.nomorInvoice, paymentData);
      
      if (result.success) {
        showAlert("Sukses", result.message || "Pembayaran berhasil diproses!", "success", () => {
          handleClosePaymentModal();
          loadInvoices();
          loadSummary();
        });
      } else {
        showAlert("Error", result.message || "Gagal memproses pembayaran", "error");
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error.message || "Gagal memproses pembayaran";
      
      // Check if error message contains field-specific validation errors
      if (errorMessage.includes('tanggal_payment')) {
        setPaymentFormErrors({ tanggal_payment: errorMessage });
      } else if (errorMessage.includes('jumlah_payment') || errorMessage.includes('Jumlah pembayaran')) {
        setPaymentFormErrors({ jumlah_payment: errorMessage });
      } else {
        showAlert("Error", errorMessage, "error");
      }
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle view payment details
  const handleViewPayment = async (nomorInvoice) => {
    try {
      setActionLoading(prev => ({ ...prev, [`view_${nomorInvoice}`]: true }));
      setLoadingDetail(true);
      setDetailModalOpen(true);
      
      const result = await pembayaranService.getPaymentDetail(nomorInvoice);
      
      if (result.success && result.data) {
        setPaymentDetail(result.data);
      } else {
        showAlert("Error", result.message || "Gagal memuat detail pembayaran", "error");
        setDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Error viewing payment:', error);
      const errorMessage = error.message || "Gagal memuat detail pembayaran";
      showAlert("Error", errorMessage, "error");
      setDetailModalOpen(false);
    } finally {
      setActionLoading(prev => ({ ...prev, [`view_${nomorInvoice}`]: false }));
      setLoadingDetail(false);
    }
  };
  
  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setPaymentDetail(null);
  };

  // Handle print payment receipt by payment_id
  const handlePrintReceipt = async (paymentId, nomorInvoice = null) => {
    try {
      const loadingKey = nomorInvoice ? `print_${nomorInvoice}` : `print_payment_${paymentId}`;
      setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
      
      // Generate receipt and get receipt data using payment_id
      const result = await pembayaranService.generatePaymentReceipt(paymentId);
      
      if (result.success && result.data) {
        console.log('Receipt data:', result.data);
        
        // Create print content from receipt data
        const printContent = generatePaymentReceiptPrintContent(result.data);
        
        // Open print dialog
        openPrintDialog(printContent);
        
        showAlert("Sukses", "Kwitansi pembayaran berhasil di-print!", "success");
      } else {
        showAlert("Error", result.message || "Gagal generate kwitansi pembayaran", "error");
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      const errorMessage = error.message || "Gagal print kwitansi pembayaran";
      showAlert("Error", errorMessage, "error");
    } finally {
      const loadingKey = nomorInvoice ? `print_${nomorInvoice}` : `print_payment_${paymentId}`;
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle print receipt from invoice (uses latest payment)
  const handlePrintReceiptFromInvoice = async (nomorInvoice) => {
    try {
      setActionLoading(prev => ({ ...prev, [`print_${nomorInvoice}`]: true }));
      
      // Get payment detail to find latest payment
      const result = await pembayaranService.getPaymentDetail(nomorInvoice);
      
      if (result.success && result.data) {
        const payments = result.data.payments || [];
        if (payments.length === 0) {
          showAlert("Error", "Tidak ada payment untuk invoice ini", "error");
          return;
        }
        
        // Use the latest payment (first in array, as API returns sorted by date DESC)
        const latestPayment = payments[0];
        if (!latestPayment || !latestPayment.id) {
          showAlert("Error", "Payment ID tidak ditemukan", "error");
          return;
        }
        
        // Generate receipt using payment_id
        await handlePrintReceipt(latestPayment.id, nomorInvoice);
      } else {
        showAlert("Error", result.message || "Gagal memuat detail pembayaran", "error");
      }
    } catch (error) {
      console.error('Error printing receipt from invoice:', error);
      const errorMessage = error.message || "Gagal print kwitansi pembayaran";
      showAlert("Error", errorMessage, "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [`print_${nomorInvoice}`]: false }));
    }
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setPaymentStatusFilter("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting payment data...");
  };

  // ========== Purchase Order Payment Functions ==========
  
  // Load purchase orders from API
  const loadPurchaseOrders = React.useCallback(async () => {
    try {
      setPoLoading(true);
      
      // Build filter parameters
      const params = {
        page: poCurrentPage,
        per_page: poItemsPerPage,
        search: poSearchTerm || undefined
      };
      if (poPaymentStatusFilter !== "all") {
        params.status_bayar = poPaymentStatusFilter;
      }
      
      const result = await pembayaranService.getPurchaseOrderPayments(params);
      
      // Transform API data to match our UI structure
      const transformedData = result.data?.map(po => {
        const totalAmount = parseFloat(po.total_amount || 0);
        // Use jumlah_dibayar from API if available, otherwise calculate from payments
        const jumlahDibayar = po.jumlah_dibayar !== undefined 
          ? parseFloat(po.jumlah_dibayar || 0)
          : (po.payments && Array.isArray(po.payments) && po.payments.length > 0
            ? po.payments.reduce((sum, p) => sum + parseFloat(p.jumlah_payment || 0), 0)
            : 0);
        
        // Use sisa_bayar from API if available, otherwise calculate
        const sisaBayar = po.sisa_bayar !== undefined
          ? parseFloat(po.sisa_bayar || 0)
          : totalAmount - jumlahDibayar;
        
        // Use status_bayar from API
        const statusBayar = po.status_bayar || 'pending';
        
        return {
          id: po.id,
          nomorPo: po.nomor_po,
          namaSupplier: po.supplier?.nama_supplier || 'N/A',
          totalAmount: totalAmount,
          jumlahDibayar: jumlahDibayar,
          sisaBayar: sisaBayar,
          statusBayar: statusBayar,
          tanggalPo: po.tanggal_po,
          tanggalPenerimaan: po.tanggal_penerimaan,
          tanggalJatuhTempo: po.tanggal_jatuh_tempo,
          status: po.status
        };
      }) || [];
      
      setPurchaseOrders(transformedData);
      setPoTotalItems(result.pagination?.total || transformedData.length);
      setPoPagination(result.pagination);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      showAlert("Error", "Gagal memuat data Purchase Order", "error");
    } finally {
      setPoLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poCurrentPage, poItemsPerPage, poSearchTerm, poPaymentStatusFilter]);

  // Load purchase orders when dependencies change
  useEffect(() => {
    if (activeTab === "purchase-order") {
      loadPurchaseOrders();
    }
  }, [activeTab, loadPurchaseOrders]);

  // Load invoices when dependencies change
  useEffect(() => {
    if (activeTab === "invoice") {
      loadInvoices();
      loadSummary();
    }
  }, [activeTab, loadInvoices, loadSummary]);

  // Handle open PO payment modal
  const handleOpenPoPaymentModal = (po) => {
    setSelectedPO(po);
    setPoPaymentForm({
      tanggal_payment: new Date().toISOString().split('T')[0],
      jumlah_payment: '',
      catatan: ''
    });
    setPoPaymentFormErrors({});
    setPoPaymentModalOpen(true);
  };

  // Handle close PO payment modal
  const handleClosePoPaymentModal = () => {
    setPoPaymentModalOpen(false);
    setSelectedPO(null);
    setPoPaymentForm({
      tanggal_payment: new Date().toISOString().split('T')[0],
      jumlah_payment: '',
      catatan: ''
    });
    setPoPaymentFormErrors({});
  };

  // Handle submit PO payment
  const handleSubmitPoPayment = async () => {
    // Reset errors
    setPoPaymentFormErrors({});
    
    // Validation
    const errors = {};
    if (!poPaymentForm.tanggal_payment) {
      errors.tanggal_payment = 'Tanggal pembayaran wajib diisi';
    }
    if (!poPaymentForm.jumlah_payment || parseFloat(poPaymentForm.jumlah_payment) <= 0) {
      errors.jumlah_payment = 'Jumlah pembayaran wajib diisi dan minimal 0.01';
    } else if (selectedPO && parseFloat(poPaymentForm.jumlah_payment) > selectedPO.sisaBayar) {
      errors.jumlah_payment = `Jumlah pembayaran melebihi sisa bayar. Sisa bayar: Rp ${selectedPO.sisaBayar.toLocaleString('id-ID')}`;
    }
    
    if (Object.keys(errors).length > 0) {
      setPoPaymentFormErrors(errors);
      return;
    }

    try {
      setSubmittingPoPayment(true);
      
      const paymentData = {
        jumlah_payment: parseFloat(poPaymentForm.jumlah_payment),
        tanggal_payment: poPaymentForm.tanggal_payment,
      };
      
      if (poPaymentForm.catatan && poPaymentForm.catatan.trim()) {
        paymentData.catatan = poPaymentForm.catatan.trim();
      }
      
      const result = await pembayaranService.processPurchaseOrderPayment(selectedPO.nomorPo, paymentData);
      
      if (result.success) {
        // Update the PO in the list with the response data if available
        if (result.data) {
          setPurchaseOrders(prev => prev.map(po => {
            if (po.nomorPo === result.data.nomor_po) {
              return {
                ...po,
                jumlahDibayar: parseFloat(result.data.jumlah_dibayar || 0),
                sisaBayar: parseFloat(result.data.sisa_bayar || 0),
                statusBayar: result.data.status_bayar || po.statusBayar
              };
            }
            return po;
          }));
        }
        
        showAlert("Sukses", result.message || "Pembayaran purchase order berhasil diproses!", "success", () => {
          handleClosePoPaymentModal();
          loadPurchaseOrders();
        });
      } else {
        showAlert("Error", result.message || "Gagal memproses pembayaran purchase order", "error");
      }
    } catch (error) {
      console.error('Error processing PO payment:', error);
      const errorMessage = error.message || "Gagal memproses pembayaran purchase order";
      
      // Check if error message contains field-specific validation errors
      if (errorMessage.includes('tanggal_payment')) {
        setPoPaymentFormErrors({ tanggal_payment: errorMessage });
      } else if (errorMessage.includes('jumlah_payment') || errorMessage.includes('Jumlah pembayaran')) {
        setPoPaymentFormErrors({ jumlah_payment: errorMessage });
      } else {
        showAlert("Error", errorMessage, "error");
      }
    } finally {
      setSubmittingPoPayment(false);
    }
  };

  // Handle view PO payment details
  const handleViewPoPayment = async (nomorPo, poId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`view_po_${nomorPo}`]: true }));
      setLoadingPoDetail(true);
      setPoDetailModalOpen(true);
      
      const result = await pembayaranService.getPurchaseOrderPaymentDetail({
        nomor_po: nomorPo,
        purchase_order_id: poId
      });
      
      if (result.success && result.data) {
        setPoPaymentDetail(result.data);
      } else {
        showAlert("Error", result.message || "Gagal memuat detail pembayaran purchase order", "error");
        setPoDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Error viewing PO payment:', error);
      const errorMessage = error.message || "Gagal memuat detail pembayaran purchase order";
      showAlert("Error", errorMessage, "error");
      setPoDetailModalOpen(false);
    } finally {
      setActionLoading(prev => ({ ...prev, [`view_po_${nomorPo}`]: false }));
      setLoadingPoDetail(false);
    }
  };
  
  // Handle close PO detail modal
  const handleClosePoDetailModal = () => {
    setPoDetailModalOpen(false);
    setPoPaymentDetail(null);
  };

  const handleClearPoFilter = () => {
    setPoSearchTerm("");
    setPoPaymentStatusFilter("all");
    setPoCurrentPage(1);
  };

  // Summary statistics from API
  const totalInvoices = summary.total_invoice;
  const paidCount = summary.sudah_dibayar;
  const pendingCount = summary.pending;
  const partialCount = summary.sebagian;
  const paidAmount = summary.total_dibayar;

  const getStatusBadge = (statusBayar, sisaBayar) => {
    if (statusBayar === 'paid' || (sisaBayar !== undefined && parseFloat(sisaBayar) <= 0)) {
      return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
    }
    if (statusBayar === 'partial') {
      return <Badge className="bg-yellow-100 text-yellow-800">Sebagian</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
  };

  // Pagination calculations
  const totalPages = pagination?.last_page || Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // PO Pagination calculations
  const poTotalPages = poPagination?.last_page || Math.ceil(poTotalItems / poItemsPerPage);
  const poStartItem = (poCurrentPage - 1) * poItemsPerPage + 1;
  const poEndItem = Math.min(poCurrentPage * poItemsPerPage, poTotalItems);
  
  // Calculate visible columns count
  const visibleColumnsCount = 10 - (hiddenColumns.noSo ? 1 : 0) - (hiddenColumns.noSuratJalan ? 1 : 0) - (hiddenColumns.sisaBayar ? 1 : 0);

  return (
    <PageLayout title="Pembayaran dan Penerimaan" category="FINANCE">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Pembayaran dan Penerimaan</h2>
        </div>
        <Button onClick={() => {
          if (activeTab === "purchase-order") {
            loadPurchaseOrders();
          } else {
            loadInvoices();
            loadSummary();
          }
        }} disabled={activeTab === "purchase-order" ? poLoading : loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${(activeTab === "purchase-order" ? poLoading : loading) ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6">
          <TabsTrigger 
            value="purchase-order" 
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            Pembayaran PO
          </TabsTrigger>
          <TabsTrigger 
            value="invoice" 
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Penerimaan Kas
          </TabsTrigger>
        </TabsList>

        {/* Purchase Order Payment Tab */}
        <TabsContent value="purchase-order" className="space-y-6">
          {/* Filter and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cari Purchase Order:
                  </label>
                  <Input
                    placeholder="Cari berdasarkan No PO, nama supplier..."
                    value={poSearchTerm}
                    onChange={(e) => {
                      setPoSearchTerm(e.target.value);
                      setPoCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Pembayaran:
                  </label>
                  <Select value={poPaymentStatusFilter} onValueChange={(value) => {
                    setPoPaymentStatusFilter(value);
                    setPoCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatusFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleClearPoFilter}>
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Order Table */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">No. PO</TableHead>
                      <TableHead className="font-semibold">Nama Supplier</TableHead>
                      <TableHead className="font-semibold">Total Amount</TableHead>
                      <TableHead className="font-semibold">Dibayar</TableHead>
                      <TableHead className="font-semibold">Sisa Bayar</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2">Loading data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : purchaseOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data Purchase Order
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseOrders.map((po) => (
                        <TableRow key={po.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{po.nomorPo}</TableCell>
                          <TableCell>{po.namaSupplier}</TableCell>
                          <TableCell>Rp {po.totalAmount.toLocaleString('id-ID')}</TableCell>
                          <TableCell>Rp {po.jumlahDibayar.toLocaleString('id-ID')}</TableCell>
                          <TableCell>Rp {po.sisaBayar.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            {getStatusBadge(po.statusBayar, po.sisaBayar)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              {po.statusBayar !== 'paid' && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700" 
                                  onClick={() => handleOpenPoPaymentModal(po)}
                                  disabled={actionLoading[po.nomorPo]}
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">Bayar</span>
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewPoPayment(po.nomorPo, po.id)}
                                disabled={actionLoading[`view_po_${po.nomorPo}`]}
                              >
                                {actionLoading[`view_po_${po.nomorPo}`] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                ) : (
                                  <Eye className="w-4 h-4 mr-1" />
                                )}
                                <span className="hidden sm:inline">Detail</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {purchaseOrders.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Menampilkan {poStartItem}-{poEndItem} dari {poTotalItems} data
                    </span>
                    <select
                      value={poItemsPerPage}
                      onChange={(e) => {
                        setPoItemsPerPage(Number(e.target.value));
                        setPoCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5 per halaman</option>
                      <option value={10}>10 per halaman</option>
                      <option value={25}>25 per halaman</option>
                      <option value={50}>50 per halaman</option>
                    </select>
                  </div>
                  
                  {poTotalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPoCurrentPage(poCurrentPage - 1)}
                        disabled={poCurrentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Sebelumnya
                      </button>
                      
                      {Array.from({ length: Math.min(5, poTotalPages) }, (_, i) => {
                        let pageNum;
                        if (poTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (poCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (poCurrentPage >= poTotalPages - 2) {
                          pageNum = poTotalPages - 4 + i;
                        } else {
                          pageNum = poCurrentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPoCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded ${
                              poCurrentPage === pageNum
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setPoCurrentPage(poCurrentPage + 1)}
                        disabled={poCurrentPage === poTotalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Payment Tab (Penerimaan Kas) */}
        <TabsContent value="invoice" className="space-y-6">

      {/* Filter and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari Invoice:
              </label>
              <Input
                placeholder="Cari berdasarkan No Invoice, No SO, No POD, nama customer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Pembayaran:
              </label>
              <Select value={paymentStatusFilter} onValueChange={(value) => {
                setPaymentStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleClearFilter}>
              Clear Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Column Visibility Toggle */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Sembunyikan Kolom:</span>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-no-so"
                checked={hiddenColumns.noSo}
                onCheckedChange={(checked) => 
                  setHiddenColumns({ ...hiddenColumns, noSo: checked })
                }
              />
              <Label htmlFor="hide-no-so" className="text-sm font-normal cursor-pointer">
                No. SO
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-no-surat-jalan"
                checked={hiddenColumns.noSuratJalan}
                onCheckedChange={(checked) => 
                  setHiddenColumns({ ...hiddenColumns, noSuratJalan: checked })
                }
              />
              <Label htmlFor="hide-no-surat-jalan" className="text-sm font-normal cursor-pointer">
                No. Surat Jalan
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-sisa-bayar"
                checked={hiddenColumns.sisaBayar}
                onCheckedChange={(checked) => 
                  setHiddenColumns({ ...hiddenColumns, sisaBayar: checked })
                }
              />
              <Label htmlFor="hide-sisa-bayar" className="text-sm font-normal cursor-pointer">
                Sisa Bayar
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">No. Invoice</TableHead>
                  {!hiddenColumns.noSo && <TableHead className="font-semibold">No. SO</TableHead>}
                  {!hiddenColumns.noSuratJalan && <TableHead className="font-semibold">No. Surat Jalan</TableHead>}
                  <TableHead className="font-semibold">Nama Customer</TableHead>
                  <TableHead className="font-semibold">Grand Total</TableHead>
                  <TableHead className="font-semibold">Uang Muka</TableHead>
                  <TableHead className="font-semibold">Dibayar</TableHead>
                  {!hiddenColumns.sisaBayar && <TableHead className="font-semibold">Sisa Bayar</TableHead>}
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnsCount} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnsCount} className="text-center py-8 text-gray-500">
                      Tidak ada data Invoice
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{inv.nomorInvoice}</TableCell>
                      {!hiddenColumns.noSo && <TableCell>{inv.nomorSo}</TableCell>}
                      {!hiddenColumns.noSuratJalan && <TableCell>{inv.nomorPod || '-'}</TableCell>}
                      <TableCell>{inv.namaCustomer}</TableCell>
                      <TableCell>Rp {inv.grandTotal.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {inv.uangMuka.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {(inv.grandTotal - inv.sisaBayar).toLocaleString('id-ID')}</TableCell>
                      {!hiddenColumns.sisaBayar && <TableCell>Rp {inv.sisaBayar.toLocaleString('id-ID')}</TableCell>}
                      <TableCell>
                        {getStatusBadge(inv.statusBayar, inv.sisaBayar)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          {inv.statusBayar !== 'paid' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700" 
                              onClick={() => handleOpenPaymentModal(inv)}
                              disabled={actionLoading[inv.nomorInvoice]}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Terima Pembayaran</span>
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewPayment(inv.nomorInvoice)}
                            disabled={actionLoading[`view_${inv.nomorInvoice}`]}
                          >
                            {actionLoading[`view_${inv.nomorInvoice}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            ) : (
                              <Eye className="w-4 h-4 mr-1" />
                            )}
                            <span className="hidden sm:inline">Detail</span>
                          </Button>
                          {inv.statusBayar === 'paid' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handlePrintReceiptFromInvoice(inv.nomorInvoice)}
                              disabled={actionLoading[`print_${inv.nomorInvoice}`]}
                            >
                              {actionLoading[`print_${inv.nomorInvoice}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              ) : (
                                <Printer className="w-4 h-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Print Kwitansi</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {invoices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Menampilkan {startItem}-{endItem} dari {totalItems} data
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 per halaman</option>
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                </select>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card className="bg-white border-green-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Invoice</p>
                  <p className="text-2xl font-semibold text-blue-900">{totalInvoices}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Sudah Dibayar</p>
                  <p className="text-2xl font-semibold text-green-900">{paidCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">Pending</p>
                  <p className="text-2xl font-semibold text-orange-900">{pendingCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Sebagian</p>
                  <p className="text-2xl font-semibold text-yellow-900">{partialCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Total Dibayar</p>
                  <p className="text-2xl font-semibold text-purple-900">
                    Rp {paidAmount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleClosePaymentModal();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Form Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <div className="mt-2 text-sm">
                  <p><strong>Invoice:</strong> {selectedInvoice.nomorInvoice}</p>
                  <p><strong>Customer:</strong> {selectedInvoice.namaCustomer}</p>
                  <p><strong>Sisa Bayar:</strong> Rp {selectedInvoice.sisaBayar.toLocaleString('id-ID')}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tanggal_payment">
                Tanggal Pembayaran <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tanggal_payment"
                type="date"
                value={paymentForm.tanggal_payment}
                onChange={(e) => setPaymentForm({ ...paymentForm, tanggal_payment: e.target.value })}
                className={paymentFormErrors.tanggal_payment ? "border-red-500" : ""}
              />
              {paymentFormErrors.tanggal_payment && (
                <p className="text-sm text-red-500">{paymentFormErrors.tanggal_payment}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="jumlah_payment">
                Jumlah Pembayaran <span className="text-red-500">*</span>
              </Label>
              <Input
                id="jumlah_payment"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Masukkan jumlah pembayaran"
                value={paymentForm.jumlah_payment}
                onChange={(e) => setPaymentForm({ ...paymentForm, jumlah_payment: e.target.value })}
                className={paymentFormErrors.jumlah_payment ? "border-red-500" : ""}
              />
              {paymentFormErrors.jumlah_payment && (
                <p className="text-sm text-red-500">{paymentFormErrors.jumlah_payment}</p>
              )}
              {selectedInvoice && (
                <p className="text-xs text-gray-500">
                  Maksimal: Rp {selectedInvoice.sisaBayar.toLocaleString('id-ID')}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan (Opsional)</Label>
              <Textarea
                id="catatan"
                placeholder="Masukkan catatan pembayaran (opsional)"
                value={paymentForm.catatan}
                onChange={(e) => setPaymentForm({ ...paymentForm, catatan: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClosePaymentModal}
              disabled={submittingPayment}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={submittingPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              {submittingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Submit Pembayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDetailModal();
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
            <DialogDescription>
              Informasi lengkap invoice dan historikal pembayaran
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : paymentDetail ? (
            <div className="space-y-6">
              {/* Invoice Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nomor Invoice</p>
                      <p className="font-semibold">{paymentDetail.invoice?.nomor_invoice || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nomor POD</p>
                      <p className="font-semibold">{paymentDetail.invoice?.nomor_pod || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Cetak Invoice</p>
                      <p className="font-semibold">
                        {formatDateTime(paymentDetail.invoice?.tanggal_cetak_invoice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Cetak POD</p>
                      <p className="font-semibold">
                        {formatDateTime(paymentDetail.invoice?.tanggal_cetak_pod)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Grand Total</p>
                      <p className="font-semibold text-lg">
                        Rp {parseFloat(paymentDetail.invoice?.grand_total || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Uang Muka</p>
                      <p className="font-semibold">
                        Rp {parseFloat(paymentDetail.invoice?.uang_muka || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sisa Bayar</p>
                      <p className="font-semibold">
                        Rp {parseFloat(paymentDetail.invoice?.sisa_bayar || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold">
                        {getStatusBadge(
                          paymentDetail.invoice?.status_bayar,
                          paymentDetail.invoice?.sisa_bayar
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Handover Method</p>
                      <p className="font-semibold">{paymentDetail.invoice?.handover_method || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Pelanggan</p>
                      <p className="font-semibold">{paymentDetail.customer?.nama_pelanggan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nomor SO</p>
                      <p className="font-semibold">{paymentDetail.customer?.nomor_so || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histori Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentDetail.payments && paymentDetail.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">No</TableHead>
                            <TableHead className="font-semibold">Tanggal Pembayaran</TableHead>
                            <TableHead className="font-semibold">Jumlah Pembayaran</TableHead>
                            <TableHead className="font-semibold">Catatan</TableHead>
                            <TableHead className="font-semibold">Waktu Input</TableHead>
                            <TableHead className="font-semibold text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentDetail.payments.map((payment, index) => (
                            <TableRow key={payment.id} className="hover:bg-gray-50">
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {formatDate(payment.tanggal_payment)}
                              </TableCell>
                              <TableCell className="font-medium">
                                Rp {parseFloat(payment.jumlah_payment || 0).toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell>{payment.catatan || '-'}</TableCell>
                              <TableCell>
                                {formatDateTime(payment.created_at)}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handlePrintReceipt(payment.id)}
                                  disabled={actionLoading[`print_payment_${payment.id}`]}
                                >
                                  {actionLoading[`print_payment_${payment.id}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                  ) : (
                                    <Printer className="w-4 h-4 mr-1" />
                                  )}
                                  <span className="hidden sm:inline">Print</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada pembayaran
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Pembayaran</p>
                      <p className="font-semibold text-lg">
                        Rp {parseFloat(paymentDetail.summary?.total_payment || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jumlah Transaksi</p>
                      <p className="font-semibold text-lg">
                        {paymentDetail.summary?.total_payment_count || 0} kali
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetailModal}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* PO Payment Modal */}
      <Dialog open={poPaymentModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleClosePoPaymentModal();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Form Pembayaran Purchase Order</DialogTitle>
            <DialogDescription>
              {selectedPO && (
                <div className="mt-2 text-sm">
                  <p><strong>PO:</strong> {selectedPO.nomorPo}</p>
                  <p><strong>Supplier:</strong> {selectedPO.namaSupplier}</p>
                  <p><strong>Sisa Bayar:</strong> Rp {selectedPO.sisaBayar.toLocaleString('id-ID')}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="po_tanggal_payment">
                Tanggal Pembayaran <span className="text-red-500">*</span>
              </Label>
              <Input
                id="po_tanggal_payment"
                type="date"
                value={poPaymentForm.tanggal_payment}
                onChange={(e) => setPoPaymentForm({ ...poPaymentForm, tanggal_payment: e.target.value })}
                className={poPaymentFormErrors.tanggal_payment ? "border-red-500" : ""}
              />
              {poPaymentFormErrors.tanggal_payment && (
                <p className="text-sm text-red-500">{poPaymentFormErrors.tanggal_payment}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="po_jumlah_payment">
                Jumlah Pembayaran <span className="text-red-500">*</span>
              </Label>
              <Input
                id="po_jumlah_payment"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Masukkan jumlah pembayaran"
                value={poPaymentForm.jumlah_payment}
                onChange={(e) => setPoPaymentForm({ ...poPaymentForm, jumlah_payment: e.target.value })}
                className={poPaymentFormErrors.jumlah_payment ? "border-red-500" : ""}
              />
              {poPaymentFormErrors.jumlah_payment && (
                <p className="text-sm text-red-500">{poPaymentFormErrors.jumlah_payment}</p>
              )}
              {selectedPO && (
                <p className="text-xs text-gray-500">
                  Maksimal: Rp {selectedPO.sisaBayar.toLocaleString('id-ID')}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="po_catatan">Catatan (Opsional)</Label>
              <Textarea
                id="po_catatan"
                placeholder="Masukkan catatan pembayaran (opsional)"
                value={poPaymentForm.catatan}
                onChange={(e) => setPoPaymentForm({ ...poPaymentForm, catatan: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClosePoPaymentModal}
              disabled={submittingPoPayment}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitPoPayment}
              disabled={submittingPoPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              {submittingPoPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Submit Pembayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* PO Payment Detail Modal */}
      <Dialog open={poDetailModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleClosePoDetailModal();
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran Purchase Order</DialogTitle>
            <DialogDescription>
              Informasi lengkap purchase order dan historikal pembayaran
            </DialogDescription>
          </DialogHeader>
          
          {loadingPoDetail ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : poPaymentDetail ? (
            <div className="space-y-6">
              {/* Purchase Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Purchase Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nomor PO</p>
                      <p className="font-semibold">{poPaymentDetail.purchase_order?.nomor_po || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal PO</p>
                      <p className="font-semibold">
                        {formatDateTime(poPaymentDetail.purchase_order?.tanggal_po)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Penerimaan</p>
                      <p className="font-semibold">
                        {formatDateTime(poPaymentDetail.purchase_order?.tanggal_penerimaan)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Jatuh Tempo</p>
                      <p className="font-semibold">
                        {formatDateTime(poPaymentDetail.purchase_order?.tanggal_jatuh_tempo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-lg">
                        Rp {parseFloat(poPaymentDetail.purchase_order?.total_amount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jumlah Dibayar</p>
                      <p className="font-semibold">
                        Rp {parseFloat(poPaymentDetail.purchase_order?.jumlah_dibayar || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sisa Bayar</p>
                      <p className="font-semibold">
                        Rp {parseFloat(poPaymentDetail.summary?.sisa_bayar || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold">
                        {getStatusBadge(
                          poPaymentDetail.purchase_order?.status_bayar,
                          poPaymentDetail.summary?.sisa_bayar
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status PO</p>
                      <p className="font-semibold">{poPaymentDetail.purchase_order?.status || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Supplier</p>
                      <p className="font-semibold">{poPaymentDetail.supplier?.nama_supplier || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histori Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  {poPaymentDetail.payments && poPaymentDetail.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">No</TableHead>
                            <TableHead className="font-semibold">Tanggal Pembayaran</TableHead>
                            <TableHead className="font-semibold">Jumlah Pembayaran</TableHead>
                            <TableHead className="font-semibold">Catatan</TableHead>
                            <TableHead className="font-semibold">Waktu Input</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {poPaymentDetail.payments.map((payment, index) => (
                            <TableRow key={payment.id} className="hover:bg-gray-50">
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {formatDate(payment.tanggal_payment)}
                              </TableCell>
                              <TableCell className="font-medium">
                                Rp {parseFloat(payment.jumlah_payment || 0).toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell>{payment.catatan || '-'}</TableCell>
                              <TableCell>
                                {formatDateTime(payment.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada pembayaran
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Pembayaran</p>
                      <p className="font-semibold text-lg">
                        Rp {parseFloat(poPaymentDetail.summary?.total_payment || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jumlah Transaksi</p>
                      <p className="font-semibold text-lg">
                        {poPaymentDetail.summary?.total_payment_count || 0} kali
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sisa Bayar</p>
                      <p className="font-semibold text-lg">
                        Rp {parseFloat(poPaymentDetail.summary?.sisa_bayar || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePoDetailModal}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert Modal Component */}
      <AlertComponent />
    </PageLayout>
  );
}

