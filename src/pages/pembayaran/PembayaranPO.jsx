import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, RefreshCw, Eye, DollarSign, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pembayaranService } from "@/services/pembayaranService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";

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

export default function PembayaranPOPage() {
    const { showAlert, AlertComponent } = useAlert();

    // Purchase Order payment states
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [poLoading, setPoLoading] = useState(false);
    const [poSearchTerm, setPoSearchTerm] = useState("");
    const [poPaymentStatusFilter, setPoPaymentStatusFilter] = useState("all");

    // PO Pagination state
    const [poCurrentPage, setPoCurrentPage] = useState(1);
    const [poItemsPerPage, setPoItemsPerPage] = useState(10);
    const [poTotalItems, setPoTotalItems] = useState(0);
    const [poPagination, setPoPagination] = useState(null);

    // Action loading states
    const [actionLoading, setActionLoading] = useState({});

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

    // Load purchase orders from API
    const loadPurchaseOrders = useCallback(async () => {
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
                const jumlahDibayar = po.jumlah_dibayar !== undefined
                    ? parseFloat(po.jumlah_dibayar || 0)
                    : (po.payments && Array.isArray(po.payments) && po.payments.length > 0
                        ? po.payments.reduce((sum, p) => sum + parseFloat(p.jumlah_payment || 0), 0)
                        : 0);
                const sisaBayar = po.sisa_bayar !== undefined
                    ? parseFloat(po.sisa_bayar || 0)
                    : totalAmount - jumlahDibayar;
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
    }, [poCurrentPage, poItemsPerPage, poSearchTerm, poPaymentStatusFilter, showAlert]);

    // Load purchase orders on mount or when filters change
    useEffect(() => {
        loadPurchaseOrders();
    }, [loadPurchaseOrders]);

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
            
            // Show popup if the error is specifically about exceeding sisa bayar
            if (errors.jumlah_payment && selectedPO && parseFloat(poPaymentForm.jumlah_payment) > selectedPO.sisaBayar) {
                showAlert("Peringatan", errors.jumlah_payment, "warning");
            }
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
            showAlert("Error", error.message || "Gagal memuat detail pembayaran purchase order", "error");
            setPoDetailModalOpen(false);
        } finally {
            setActionLoading(prev => ({ ...prev, [`view_po_${nomorPo}`]: false }));
            setLoadingPoDetail(false);
        }
    };

    const handleClosePoDetailModal = () => {
        setPoDetailModalOpen(false);
        setPoPaymentDetail(null);
    };

    const handleClearPoFilter = () => {
        setPoSearchTerm("");
        setPoPaymentStatusFilter("all");
        setPoCurrentPage(1);
    };

    const getStatusBadge = (statusBayar, sisaBayar) => {
        if (statusBayar === 'paid' || (sisaBayar !== undefined && parseFloat(sisaBayar) <= 0)) {
            return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
        }
        if (statusBayar === 'partial') {
            return <Badge className="bg-yellow-100 text-yellow-800">Sebagian</Badge>;
        }
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    };

    // PO Pagination calculations
    const poTotalPages = poPagination?.last_page || Math.ceil(poTotalItems / poItemsPerPage);
    const poStartItem = (poCurrentPage - 1) * poItemsPerPage + 1;
    const poEndItem = Math.min(poCurrentPage * poItemsPerPage, poTotalItems);

    return (
        <PageLayout title="Pembayaran PO" category="FINANCE">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Pembayaran PO</h2>
                </div>
                <Button onClick={loadPurchaseOrders} disabled={poLoading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <RefreshCw className={`w-4 h-4 mr-2 ${poLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cari Purchase Order:</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran:</label>
                                <Select value={poPaymentStatusFilter} onValueChange={(value) => {
                                    setPoPaymentStatusFilter(value);
                                    setPoCurrentPage(1);
                                }}>
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
                            <Button variant="outline" onClick={handleClearPoFilter}>Clear Filter</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
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
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">Tidak ada data Purchase Order</TableCell>
                                        </TableRow>
                                    ) : (
                                        purchaseOrders.map((po) => (
                                            <TableRow key={po.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">{po.nomorPo}</TableCell>
                                                <TableCell>{po.namaSupplier}</TableCell>
                                                <TableCell>Rp {po.totalAmount.toLocaleString('id-ID')}</TableCell>
                                                <TableCell>Rp {po.jumlahDibayar.toLocaleString('id-ID')}</TableCell>
                                                <TableCell>Rp {po.sisaBayar.toLocaleString('id-ID')}</TableCell>
                                                <TableCell>{getStatusBadge(po.statusBayar, po.sisaBayar)}</TableCell>
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
                        {purchaseOrders.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-700">Menampilkan {poStartItem}-{poEndItem} dari {poTotalItems} data</span>
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
                                        >Sebelumnya</button>
                                        {Array.from({ length: Math.min(5, poTotalPages) }, (_, i) => {
                                            let pageNum;
                                            if (poTotalPages <= 5) pageNum = i + 1;
                                            else if (poCurrentPage <= 3) pageNum = i + 1;
                                            else if (poCurrentPage >= poTotalPages - 2) pageNum = poTotalPages - 4 + i;
                                            else pageNum = poCurrentPage - 2 + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPoCurrentPage(pageNum)}
                                                    className={`px-3 py-1 text-sm border rounded ${poCurrentPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}
                                                >{pageNum}</button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setPoCurrentPage(poCurrentPage + 1)}
                                            disabled={poCurrentPage === poTotalPages}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >Selanjutnya</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={poPaymentModalOpen} onOpenChange={(open) => !open && handleClosePoPaymentModal()}>
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
                            <Label htmlFor="po_tanggal_payment">Tanggal Pembayaran <span className="text-red-500">*</span></Label>
                            <Input
                                id="po_tanggal_payment"
                                type="date"
                                value={poPaymentForm.tanggal_payment}
                                onChange={(e) => setPoPaymentForm({ ...poPaymentForm, tanggal_payment: e.target.value })}
                                className={poPaymentFormErrors.tanggal_payment ? "border-red-500" : ""}
                            />
                            {poPaymentFormErrors.tanggal_payment && <p className="text-sm text-red-500">{poPaymentFormErrors.tanggal_payment}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="po_jumlah_payment">Jumlah Pembayaran <span className="text-red-500">*</span></Label>
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
                            {poPaymentFormErrors.jumlah_payment && <p className="text-sm text-red-500">{poPaymentFormErrors.jumlah_payment}</p>}
                            {selectedPO && <p className="text-xs text-gray-500">Maksimal: Rp {selectedPO.sisaBayar.toLocaleString('id-ID')}</p>}
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
                        <Button variant="outline" onClick={handleClosePoPaymentModal} disabled={submittingPoPayment}>Batal</Button>
                        <Button onClick={handleSubmitPoPayment} disabled={submittingPoPayment} className="bg-green-600 hover:bg-green-700">
                            {submittingPoPayment ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : <><DollarSign className="w-4 h-4 mr-2" />Submit Pembayaran</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={poDetailModalOpen} onOpenChange={(open) => !open && handleClosePoDetailModal()}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Pembayaran Purchase Order</DialogTitle>
                        <DialogDescription>Informasi lengkap purchase order dan historikal pembayaran</DialogDescription>
                    </DialogHeader>
                    {loadingPoDetail ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" /><span className="ml-2">Memuat data...</span>
                        </div>
                    ) : poPaymentDetail ? (
                        <div className="space-y-6">
                            <Card><CardHeader><CardTitle className="text-lg">Informasi Purchase Order</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><p className="text-sm text-gray-600">Nomor PO</p><p className="font-semibold">{poPaymentDetail.purchase_order?.nomor_po || '-'}</p></div>
                                        <div><p className="text-sm text-gray-600">Tanggal PO</p><p className="font-semibold">{formatDateTime(poPaymentDetail.purchase_order?.tanggal_po)}</p></div>
                                        <div><p className="text-sm text-gray-600">Total Amount</p><p className="font-semibold text-lg">Rp {parseFloat(poPaymentDetail.purchase_order?.total_amount || 0).toLocaleString('id-ID')}</p></div>
                                        <div><p className="text-sm text-gray-600">Sisa Bayar</p><p className="font-semibold">Rp {parseFloat(poPaymentDetail.summary?.sisa_bayar || 0).toLocaleString('id-ID')}</p></div>
                                        <div><p className="text-sm text-gray-600">Status</p><p className="font-semibold">{getStatusBadge(poPaymentDetail.purchase_order?.status_bayar, poPaymentDetail.summary?.sisa_bayar)}</p></div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card><CardHeader><CardTitle className="text-lg">Informasi Supplier</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-gray-600">Nama Supplier</p><p className="font-semibold">{poPaymentDetail.supplier?.nama_supplier || '-'}</p></CardContent>
                            </Card>
                            <Card><CardHeader><CardTitle className="text-lg">Histori Pembayaran</CardTitle></CardHeader>
                                <CardContent>
                                    {poPaymentDetail.payments && poPaymentDetail.payments.length > 0 ? (
                                        <Table>
                                            <TableHeader><TableRow className="bg-gray-50"><TableHead>No</TableHead><TableHead>Tanggal</TableHead><TableHead>Jumlah</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {poPaymentDetail.payments.map((p, i) => (
                                                    <TableRow key={p.id}><TableCell>{i + 1}</TableCell><TableCell>{formatDate(p.tanggal_payment)}</TableCell><TableCell>Rp {parseFloat(p.jumlah_payment || 0).toLocaleString('id-ID')}</TableCell><TableCell>{p.catatan || '-'}</TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <div className="text-center py-8 text-gray-500">Belum ada pembayaran</div>}
                                </CardContent>
                            </Card>
                        </div>
                    ) : <div className="text-center py-8 text-gray-500">Tidak ada data</div>}
                    <DialogFooter><Button variant="outline" onClick={handleClosePoDetailModal}>Tutup</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertComponent />
        </PageLayout>
    );
}
