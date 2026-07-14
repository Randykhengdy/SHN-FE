import PageLayout from "@/components/PageLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/hooks/useAlert";
import { useCallback, useEffect, useState } from "react";
import { konversiBarangService } from "@/services/konversiBarangService";
import { Badge } from "@/components/ui/badge";
import { isAdmin } from "@/lib/utils";
import { Download, RefreshCw, TableColumnsSplit } from "lucide-react";
import CustomAlert from "@/components/modals/CustomAlert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { salesOrderService } from "@/services/salesOrderService";

const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "utuh", label: "Utuh" },
    { value: "potongan", label: "Potongan" },
];

export default function KonversiBarangPage() {

    const { showAlert, AlertComponent } = useAlert();

    const [loading, setLoading] = useState(false);

    const [itemBarang, setItemBarang] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isConverting, setConverting] = useState(false);

    // Sales Order selection states
    const [showSoModal, setShowSoModal] = useState(false);
    const [salesOrders, setSalesOrders] = useState([]);
    const [selectedSo, setSelectedSo] = useState(null);
    const [soSearch, setSoSearch] = useState("");
    const [soLoading, setSoLoading] = useState(false);
    const [soPage, setSoPage] = useState(1);
    const [soTotal, setSoTotal] = useState(0);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "potongan": return "bg-blue-100 text-blue-800";
            case "utuh": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const loadSalesOrders = useCallback(async () => {
        try {
            setSoLoading(true);
            const response = await salesOrderService.getAll({
                page: soPage,
                per_page: 5,
                search: soSearch,
                process_status: ["submit", "partial_wo"]
            });
            if (response && response.data) {
                setSalesOrders(response.data);
                setSoTotal(response.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Error loading Sales Orders:", error);
        } finally {
            setSoLoading(false);
        }
    }, [soPage, soSearch]);

    useEffect(() => {
        if (showSoModal) {
            loadSalesOrders();
        }
    }, [showSoModal, loadSalesOrders]);

    const loadItemBarang = useCallback(async () => {
        try {
            setLoading(true);
            const result = await konversiBarangService.getAll({ page: currentPage, per_page: itemsPerPage, search: search, status: statusFilter });

            // Transform API data to match our UI structure
            const transformedData = result.data.map(kb => ({
                id: kb.id,
                convertDate: formatDate(kb.convert_date),
                item_barang: kb.nama_item_barang,
                quantity: kb.quantity,
                status: kb.jenis_potongan || "N/A",
                nomor_so: kb.sales_order?.nomor_so || "-",
            }));

            setItemBarang(transformedData);
            setTotalItems(result.pagination.total);
        } catch (error) {
            console.error('Error loading item barang:', error);
            showAlert("Error", "Gagal memuat data item barang", "error");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, statusFilter, search]);

    useEffect(() => {
        loadItemBarang();
    }, [loadItemBarang]);

    const handleConvertBarang = (item) => {
        setSelectedItem(item);
        setSelectedSo(null);
        setSoSearch("");
        setSoPage(1);
        setShowSoModal(true);
    }

    const handleSelectSo = (so) => {
        setSelectedSo(so);
    }

    const handleConfirmSoSelection = () => {
        if (!selectedSo) {
            showAlert("Error", "Silakan pilih Sales Order terlebih dahulu", "error");
            return;
        }
        setShowSoModal(false);
        setShowConfirmationModal(true);
    }

    const handleConvertBarangConfirm = async () => {
        if (isConverting) {
            console.log('⏭️ Already processing convert operation');
            return;
        }

        try {
            setConverting(true);

            const response = await konversiBarangService.changeStatusToPotongan(selectedItem.id, selectedSo.id);

            console.log('✅ Stock barang converted:', response);

            // Close modal first
            setShowConfirmationModal(false);

            // Show success message and reload data after alert closes
            showAlert("Sukses", "Stock Barang berhasil dikonversi!", "success", () => {
                loadItemBarang();
            });

        } catch (error) {
            console.error('❌ Error memotong barang:', error);
            showAlert("Error", error.message || "Gagal memotong barang", "error");
        } finally {
            setConverting(false);
        }
    }


    const handleClearFilter = () => {
        setSearch("");
        setStatusFilter("all");
        setCurrentPage(1);
    };


    const handleExport = () => {
        // TODO: Implement export functionality
        console.log("Exporting stock mutations...");
    };

    return <PageLayout title="Konversi Barang" category="TRANSAKSI">
        {/* Filter and Search */}
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cari:
                        </label>
                        <Input
                            placeholder="Cari"
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }} className="w-full box-border pr-8 relative"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status:
                        </label>
                        <Select value={statusFilter} onValueChange={(value) => {
                            setStatusFilter(value);
                            setCurrentPage(1);
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            onClick={loadItemBarang}
                            disabled={loading}
                            className="w-full"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
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
        {/* Konversi Barang Table */}
        <Card className="mb-6">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Waktu Konversi</TableHead>
                                <TableHead className="font-semibold">Item</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Sales Order</TableHead>
                                <TableHead className="font-semibold">Quantity</TableHead>
                                <TableHead className="font-semibold">Total KG</TableHead>
                                <TableHead className="font-semibold text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-2">Loading data...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : itemBarang.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                        Tidak ada data Barang
                                    </TableCell>
                                </TableRow>
                            ) : (
                                itemBarang.map((ib) => (
                                    <TableRow key={ib.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">{ib.convertDate}</TableCell>
                                        <TableCell>{ib.item_barang}</TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(ib.status)} capitalize`}>
                                                {ib.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-blue-600">{ib.nomor_so}</TableCell>
                                        <TableCell>{ib.quantity}</TableCell>
                                        <TableCell>{ib.totalKG}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleConvertBarang(ib)}
                                                    title="Konversi"
                                                    disabled={ib.status.toLowerCase() !== 'utuh'}
                                                >
                                                    <TableColumnsSplit className="w-4 h-4" />
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
                {itemBarang.length > 0 && (
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
                                            className={`px-3 py-1 text-sm border rounded ${currentPage === pageNum
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
        {/* Convert Confirmation Modal */}
        <CustomAlert
            open={showConfirmationModal}
            onOpenChange={setShowConfirmationModal}
            title="Konfirmasi Konversi Barang"
            message={`Apakah yakin untuk ubah status "${selectedItem?.item_barang}" menjadi lempengan siap potong untuk Sales Order ${selectedSo?.nomor_so}?`}
            type="warning"
            showCancel={true}
            confirmText={isConverting ? "Memotong..." : "Ya, Ubah"}
            cancelText="Tidak"
            onConfirm={handleConvertBarangConfirm}
        />

        {/* Sales Order Selection Modal */}
        <Dialog open={showSoModal} onOpenChange={setShowSoModal}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold">Pilih Sales Order</DialogTitle>
                </DialogHeader>
                
                <div className="p-6 pt-0 flex-1 overflow-y-auto space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Cari nomor SO..."
                            value={soSearch}
                            onChange={(e) => {
                                setSoSearch(e.target.value);
                                setSoPage(1);
                            }}
                            className="flex-1"
                        />
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Pilih</TableHead>
                                    <TableHead>Nomor SO</TableHead>
                                    <TableHead>Tanggal SO</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {soLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                <span>Memuat Sales Order...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : salesOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                                            Tidak ada Sales Order aktif ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    salesOrders.map((so) => (
                                        <TableRow 
                                            key={so.id} 
                                            className={`cursor-pointer hover:bg-gray-50 ${selectedSo?.id === so.id ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleSelectSo(so)}
                                        >
                                            <TableCell className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="radio"
                                                    name="selected_so"
                                                    checked={selectedSo?.id === so.id}
                                                    onChange={() => handleSelectSo(so)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                />
                                            </TableCell>
                                            <TableCell className="font-semibold">{so.nomor_so}</TableCell>
                                            <TableCell>
                                                {so.tanggal_so ? new Date(so.tanggal_so).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                                            </TableCell>
                                            <TableCell>{so.pelanggan?.nama_pelanggan || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination for SO */}
                    {salesOrders.length > 0 && (
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-gray-600">Total: {soTotal} data</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={soPage === 1}
                                    onClick={() => setSoPage(prev => Math.max(1, prev - 1))}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm self-center">Hal {soPage} dari {Math.ceil(soTotal / 5)}</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={soPage >= Math.ceil(soTotal / 5)}
                                    onClick={() => setSoPage(prev => prev + 1)}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-gray-50 flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowSoModal(false)}>
                        Batal
                    </Button>
                    <Button 
                        disabled={!selectedSo} 
                        onClick={handleConfirmSoSelection}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Lanjutkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Alert Modal Component */}
        <AlertComponent />
    </PageLayout>
}
