import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, FileText, Eye, RefreshCw, Printer, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
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

export default function PenerimaanKasPage() {
    const { showAlert, AlertComponent } = useAlert();

    // Invoice payment states
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

    // Pagination state (shared for invoice)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [pagination, setPagination] = useState(null);

    // Action loading states
    const [actionLoading, setActionLoading] = useState({});

    // Payment modal state
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        tanggal_payment: new Date().toISOString().split('T')[0],
        jumlah_payment: '',
        metode_pembayaran: '',
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

    // Load invoices from API
    const loadInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                per_page: itemsPerPage
            };
            if (paymentStatusFilter !== "all") {
                params.status_bayar = paymentStatusFilter;
            }

            const result = await pembayaranService.getPayments(params);

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
    }, [currentPage, itemsPerPage, searchTerm, paymentStatusFilter, showAlert]);

    // Load payment summary
    const loadSummary = useCallback(async () => {
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
        }
    }, []);

    useEffect(() => {
        loadInvoices();
        loadSummary();
    }, [loadInvoices, loadSummary]);

    // Handle open payment modal
    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentForm({
            tanggal_payment: new Date().toISOString().split('T')[0],
            jumlah_payment: '',
            metode_pembayaran: '',
            catatan: ''
        });
        setPaymentFormErrors({});
        setPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setPaymentModalOpen(false);
        setSelectedInvoice(null);
        setPaymentForm({
            tanggal_payment: new Date().toISOString().split('T')[0],
            jumlah_payment: '',
            metode_pembayaran: '',
            catatan: ''
        });
        setPaymentFormErrors({});
    };

    const handleSubmitPayment = async () => {
        setPaymentFormErrors({});
        const errors = {};
        if (!paymentForm.tanggal_payment) errors.tanggal_payment = 'Tanggal pembayaran wajib diisi';
        if (!paymentForm.jumlah_payment || parseFloat(paymentForm.jumlah_payment) <= 0) {
            errors.jumlah_payment = 'Jumlah pembayaran wajib diisi dan minimal 0.01';
        } else if (selectedInvoice && parseFloat(paymentForm.jumlah_payment) > selectedInvoice.sisaBayar) {
            errors.jumlah_payment = `Jumlah pembayaran melebihi sisa bayar. Sisa bayar: Rp ${selectedInvoice.sisaBayar.toLocaleString('id-ID')}`;
        }
        if (!paymentForm.metode_pembayaran) errors.metode_pembayaran = 'Metode pembayaran wajib diisi';

        if (Object.keys(errors).length > 0) {
            setPaymentFormErrors(errors);
            
            // Show popup if the error is specifically about exceeding sisa bayar
            if (errors.jumlah_payment && selectedInvoice && parseFloat(paymentForm.jumlah_payment) > selectedInvoice.sisaBayar) {
                showAlert("Peringatan", errors.jumlah_payment, "warning");
            }
            return;
        }

        try {
            setSubmittingPayment(true);
            const paymentData = {
                jumlah_payment: parseFloat(paymentForm.jumlah_payment),
                tanggal_payment: paymentForm.tanggal_payment,
                metode_pembayaran: paymentForm.metode_pembayaran
            };
            if (paymentForm.catatan && paymentForm.catatan.trim()) paymentData.catatan = paymentForm.catatan.trim();

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

    const handleViewPayment = async (nomorInvoice) => {
        try {
            setActionLoading(prev => ({ ...prev, [`view_${nomorInvoice}`]: true }));
            setLoadingDetail(true);
            setDetailModalOpen(true);
            const result = await pembayaranService.getPaymentDetail(nomorInvoice);
            if (result.success && result.data) setPaymentDetail(result.data);
            else {
                showAlert("Error", result.message || "Gagal memuat detail pembayaran", "error");
                setDetailModalOpen(false);
            }
        } catch (error) {
            console.error('Error viewing payment:', error);
            showAlert("Error", error.message || "Gagal memuat detail pembayaran", "error");
            setDetailModalOpen(false);
        } finally {
            setActionLoading(prev => ({ ...prev, [`view_${nomorInvoice}`]: false }));
            setLoadingDetail(false);
        }
    };

    const handleCloseDetailModal = () => {
        setDetailModalOpen(false);
        setPaymentDetail(null);
    };

    const handlePrintReceipt = async (paymentId, nomorInvoice = null) => {
        try {
            const loadingKey = nomorInvoice ? `print_${nomorInvoice}` : `print_payment_${paymentId}`;
            setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
            const result = await pembayaranService.generatePaymentReceipt(paymentId);
            if (result.success && result.data) {
                const printContent = generatePaymentReceiptPrintContent(result.data);
                openPrintDialog(printContent);
                showAlert("Sukses", "Kwitansi pembayaran berhasil di-print!", "success");
            } else showAlert("Error", result.message || "Gagal generate kwitansi pembayaran", "error");
        } catch (error) {
            console.error('Error printing receipt:', error);
            showAlert("Error", error.message || "Gagal print kwitansi pembayaran", "error");
        } finally {
            const loadingKey = nomorInvoice ? `print_${nomorInvoice}` : `print_payment_${paymentId}`;
            setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const handlePrintReceiptFromInvoice = async (nomorInvoice) => {
        try {
            setActionLoading(prev => ({ ...prev, [`print_${nomorInvoice}`]: true }));
            const result = await pembayaranService.getPaymentDetail(nomorInvoice);
            if (result.success && result.data) {
                const payments = result.data.payments || [];
                if (payments.length === 0) {
                    showAlert("Error", "Tidak ada payment untuk invoice ini", "error");
                    return;
                }
                const latestPayment = payments[0];
                if (!latestPayment || !latestPayment.id) {
                    showAlert("Error", "Payment ID tidak ditemukan", "error");
                    return;
                }
                await handlePrintReceipt(latestPayment.id, nomorInvoice);
            } else showAlert("Error", result.message || "Gagal memuat detail pembayaran", "error");
        } catch (error) {
            console.error('Error printing receipt from invoice:', error);
            showAlert("Error", error.message || "Gagal print kwitansi pembayaran", "error");
        } finally {
            setActionLoading(prev => ({ ...prev, [`print_${nomorInvoice}`]: false }));
        }
    };

    const handleClearFilter = () => {
        setSearchTerm("");
        setPaymentStatusFilter("all");
        setCurrentPage(1);
    };

    const handleExport = () => console.log("Exporting payment data...");

    const getStatusBadge = (statusBayar, sisaBayar) => {
        if (statusBayar === 'paid' || (sisaBayar !== undefined && parseFloat(sisaBayar) <= 0)) {
            return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
        }
        if (statusBayar === 'partial') {
            return <Badge className="bg-yellow-100 text-yellow-800">Sebagian</Badge>;
        }
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    };

    const totalPages = pagination?.last_page || Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const visibleColumnsCount = 10 - (hiddenColumns.noSo ? 1 : 0) - (hiddenColumns.noSuratJalan ? 1 : 0) - (hiddenColumns.sisaBayar ? 1 : 0);

    return (
        <PageLayout title="Penerimaan Kas" category="FINANCE">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Penerimaan Kas</h2>
                </div>
                <Button onClick={() => { loadInvoices(); loadSummary(); }} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            <div className="space-y-6">
                {/* Filter and Search */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">Filter dan Pencarian</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cari Invoice:</label>
                                <Input
                                    placeholder="Cari berdasarkan No Invoice, No SO, No POD, nama customer..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran:</label>
                                <Select value={paymentStatusFilter} onValueChange={(value) => { setPaymentStatusFilter(value); setCurrentPage(1); }}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {paymentStatusFilterOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={handleClearFilter}>Clear Filter</Button>
                            <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Column Visibility */}
                <Card><CardContent className="py-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Sembunyikan Kolom:</span>
                        <div className="flex items-center space-x-2"><Checkbox id="hide-no-so" checked={hiddenColumns.noSo} onCheckedChange={(c) => setHiddenColumns({ ...hiddenColumns, noSo: c })} /><Label htmlFor="hide-no-so">No. SO</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id="hide-no-surat-jalan" checked={hiddenColumns.noSuratJalan} onCheckedChange={(c) => setHiddenColumns({ ...hiddenColumns, noSuratJalan: c })} /><Label htmlFor="hide-no-surat-jalan">No. Surat Jalan</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id="hide-sisa-bayar" checked={hiddenColumns.sisaBayar} onCheckedChange={(c) => setHiddenColumns({ ...hiddenColumns, sisaBayar: c })} /><Label htmlFor="hide-sisa-bayar">Sisa Bayar</Label></div>
                    </div>
                </CardContent></Card>

                {/* Invoice Table */}
                <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow className="bg-gray-50">
                                <TableHead>No. Invoice</TableHead>
                                {!hiddenColumns.noSo && <TableHead>No. SO</TableHead>}
                                {!hiddenColumns.noSuratJalan && <TableHead>No. Surat Jalan</TableHead>}
                                <TableHead>Nama Customer</TableHead>
                                <TableHead>Grand Total</TableHead>
                                <TableHead>Dibayar</TableHead>
                                {!hiddenColumns.sisaBayar && <TableHead>Sisa Bayar</TableHead>}
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={visibleColumnsCount} className="text-center py-8"><RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" /></TableCell></TableRow> :
                                    invoices.length === 0 ? <TableRow><TableCell colSpan={visibleColumnsCount} className="text-center py-8">Tidak ada data Invoice</TableCell></TableRow> :
                                        invoices.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium">{inv.nomorInvoice}</TableCell>
                                                {!hiddenColumns.noSo && <TableCell>{inv.nomorSo}</TableCell>}
                                                {!hiddenColumns.noSuratJalan && <TableCell>{inv.nomorPod || '-'}</TableCell>}
                                                <TableCell>{inv.namaCustomer}</TableCell>
                                                <TableCell>Rp {inv.grandTotal.toLocaleString('id-ID')}</TableCell>
                                                <TableCell>Rp {(inv.grandTotal - inv.sisaBayar).toLocaleString('id-ID')}</TableCell>
                                                {!hiddenColumns.sisaBayar && <TableCell>Rp {inv.sisaBayar.toLocaleString('id-ID')}</TableCell>}
                                                <TableCell>{getStatusBadge(inv.statusBayar, inv.sisaBayar)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                        {inv.statusBayar !== 'paid' && (
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleOpenPaymentModal(inv)} disabled={actionLoading[inv.nomorInvoice]}>
                                                                <DollarSign className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Terima Pembayaran</span>
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline" onClick={() => handleViewPayment(inv.nomorInvoice)} disabled={actionLoading[`view_${inv.nomorInvoice}`]}>
                                                            {actionLoading[`view_${inv.nomorInvoice}`] ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                                                            <span className="hidden sm:inline">Detail</span>
                                                        </Button>
                                                        {inv.statusBayar === 'paid' && (
                                                            <Button size="sm" variant="outline" onClick={() => handlePrintReceiptFromInvoice(inv.nomorInvoice)} disabled={actionLoading[`print_${inv.nomorInvoice}`]}>
                                                                {actionLoading[`print_${inv.nomorInvoice}`] ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="w-4 h-4 mr-1" />}
                                                                <span className="hidden sm:inline">Print</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                            </TableBody>
                        </Table>
                    </div>
                    {invoices.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
                            <div className="flex items-center space-x-2"><span className="text-sm">Menampilkan {startItem}-{endItem} dari {totalItems} data</span></div>
                            {totalPages > 1 && (
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Sebelumnya</button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;
                                        return (
                                            <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1 text-sm border rounded ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}>{pageNum}</button>
                                        );
                                    })}
                                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Selanjutnya</button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent></Card>

                {/* Summary */}
                <Card><CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Ringkasan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600">Total Invoice</p><p className="text-2xl font-semibold">{summary.total_invoice}</p></div>
                        <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600">Terbayar</p><p className="text-2xl font-semibold">{summary.sudah_dibayar}</p></div>
                        <div className="bg-orange-50 p-4 rounded-lg"><p className="text-sm text-orange-600">Pending</p><p className="text-2xl font-semibold">{summary.pending}</p></div>
                        <div className="bg-yellow-50 p-4 rounded-lg"><p className="text-sm text-yellow-600">Sebagian</p><p className="text-2xl font-semibold">{summary.sebagian}</p></div>
                        <div className="bg-purple-50 p-4 rounded-lg"><p className="text-sm text-purple-600">Total Nilai</p><p className="text-2xl font-semibold">Rp {summary.total_dibayar.toLocaleString('id-ID')}</p></div>
                    </div>
                </CardContent></Card>
            </div>

            <Dialog open={paymentModalOpen} onOpenChange={(o) => !o && handleClosePaymentModal()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>Form Penerimaan Pembayaran</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label>Tanggal <span className="text-red-500">*</span></Label><Input type="date" value={paymentForm.tanggal_payment} onChange={(e) => setPaymentForm({ ...paymentForm, tanggal_payment: e.target.value })} /></div>
                        <div className="grid gap-2">
                            <Label>Metode Pembayaran <span className="text-red-500">*</span></Label>
                            <Select value={paymentForm.metode_pembayaran} onValueChange={(val) => setPaymentForm({ ...paymentForm, metode_pembayaran: val })}>
                                <SelectTrigger className={paymentFormErrors.metode_pembayaran ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Pilih Metode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Debit">Debit</SelectItem>
                                    <SelectItem value="Transfer">Transfer</SelectItem>
                                    <SelectItem value="Piutang">Piutang</SelectItem>
                                </SelectContent>
                            </Select>
                            {paymentFormErrors.metode_pembayaran && <p className="text-xs text-red-500">{paymentFormErrors.metode_pembayaran}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="jumlah_payment">Jumlah <span className="text-red-500">*</span></Label>
                            <Input
                                id="jumlah_payment"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={paymentForm.jumlah_payment}
                                onChange={(e) => setPaymentForm({ ...paymentForm, jumlah_payment: e.target.value })}
                                className={paymentFormErrors.jumlah_payment ? "border-red-500" : ""}
                            />
                            {paymentFormErrors.jumlah_payment && <p className="text-xs text-red-500">{paymentFormErrors.jumlah_payment}</p>}
                        </div>
                        <div className="grid gap-2"><Label>Catatan</Label><Textarea value={paymentForm.catatan} onChange={(e) => setPaymentForm({ ...paymentForm, catatan: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClosePaymentModal}>Batal</Button>
                        <Button onClick={handleSubmitPayment} disabled={submittingPayment} className="bg-green-600 hover:bg-green-700">{submittingPayment ? <RefreshCw className="animate-spin" /> : 'Simpan'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailModalOpen} onOpenChange={(o) => !o && handleCloseDetailModal()}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Detail Pembayaran</DialogTitle></DialogHeader>
                    {loadingDetail ? <div className="text-center py-8"><RefreshCw className="h-8 w-8 animate-spin mx-auto" /></div> : paymentDetail && (
                        <div className="space-y-6">
                            <Card><CardHeader><CardTitle>Informasi Invoice</CardTitle></CardHeader>
                                <CardContent><div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-sm text-gray-600">No Invoice</p><p className="font-semibold">{paymentDetail.invoice?.nomor_invoice}</p></div>
                                    <div><p className="text-sm text-gray-600">Sisa Bayar</p><p className="font-semibold">Rp {parseFloat(paymentDetail.invoice?.sisa_bayar || 0).toLocaleString('id-ID')}</p></div>
                                </div></CardContent>
                            </Card>
                            <Card><CardHeader><CardTitle>Histori Pembayaran</CardTitle></CardHeader>
                                <CardContent>
                                    <Table><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Jumlah</TableHead><TableHead>Metode</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                                        <TableBody>{paymentDetail.payments?.map(p => (
                                            <TableRow key={p.id}><TableCell>{formatDate(p.tanggal_payment)}</TableCell><TableCell>Rp {parseFloat(p.jumlah_payment || 0).toLocaleString('id-ID')}</TableCell><TableCell>{p.metode_pembayaran || '-'}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => handlePrintReceipt(p.id)}>Print</Button></TableCell></TableRow>
                                        ))}</TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter><Button variant="outline" onClick={handleCloseDetailModal}>Tutup</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertComponent />
        </PageLayout>
    );
}
