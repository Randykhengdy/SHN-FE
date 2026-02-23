import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, DollarSign, Weight, Package, RefreshCw } from "lucide-react";
import { penerimaanBarangService } from "@/services/penerimaanBarangService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";

export default function InputHargaBarangDatangPage() {
    // Hooks
    const { showAlert, AlertComponent } = useAlert();

    // Data state
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Process modal state
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [hargaModal, setHargaModal] = useState("");
    const [beratItem, setBeratItem] = useState("");
    const [processingId, setProcessingId] = useState(null);

    // Load data
    const loadPendingItems = useCallback(
        async () => {
            try {
                setLoading(true);
                const result = await penerimaanBarangService.getPendingNonPoItems({
                    search: searchQuery,
                    per_page: itemsPerPage,
                    page: currentPage,
                });

                setItems(result.data || []);
                setTotalItems(result.pagination?.total || 0);
            } catch (error) {
                console.error("❌ Error loading pending items:", error);
                showAlert(
                    "Error",
                    "Gagal memuat data item pending: " + (error.message || ""),
                    "error"
                );
                setItems([]);
            } finally {
                setLoading(false);
            }
        },
        [searchQuery, itemsPerPage, currentPage]
    );

    useEffect(() => {
        loadPendingItems();
    }, [loadPendingItems]);

    // Open process modal
    const handleOpenProcess = (item) => {
        setSelectedItem(item);
        setHargaModal("");
        setBeratItem("");
        setShowProcessModal(true);
    };

    // Submit process
    const handleProcess = async () => {
        if (!hargaModal || !beratItem) {
            showAlert("Peringatan", "Harga Modal dan Berat wajib diisi", "error");
            return;
        }

        const harga = parseFloat(hargaModal);
        const berat = parseFloat(beratItem);
        if (isNaN(harga) || harga <= 0) {
            showAlert("Peringatan", "Harga Modal harus berupa angka positif", "error");
            return;
        }
        if (isNaN(berat) || berat <= 0) {
            showAlert("Peringatan", "Berat harus berupa angka positif", "error");
            return;
        }

        try {
            setProcessingId(selectedItem.id);
            await penerimaanBarangService.processNonPoItem(selectedItem.id, {
                harga_modal: harga,
                berat: berat,
            });
            setShowProcessModal(false);
            const group = selectedItem.item_barang_group;
            const groupLabel = group
                ? `${group.jenis_barang?.kode || ''}-${group.bentuk_barang?.kode || ''}-${group.grade_barang?.kode || ''}`
                : `Detail #${selectedItem.id}`;
            showAlert(
                "Sukses",
                `Item ${groupLabel} berhasil diproses!`,
                "success",
                () => loadPendingItems()
            );
        } catch (error) {
            console.error("❌ Error processing item:", error);
            showAlert(
                "Error",
                error.message || "Gagal memproses item",
                "error"
            );
        } finally {
            setProcessingId(null);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Build dimension string from item_barang_group (matches backend logic)
    const buildDimensi = (detail) => {
        const group = detail?.item_barang_group;
        if (!group) return "-";

        const dimensions = [];
        if (group.diameter_luar) dimensions.push(parseFloat(group.diameter_luar));
        if (group.diameter_dalam) dimensions.push(parseFloat(group.diameter_dalam));
        if (group.diameter) dimensions.push(parseFloat(group.diameter));
        if (group.sisi1) dimensions.push(parseFloat(group.sisi1));
        if (group.sisi2) dimensions.push(parseFloat(group.sisi2));
        if (group.tebal) dimensions.push(parseFloat(group.tebal));
        if (group.lebar) dimensions.push(parseFloat(group.lebar));
        if (group.panjang) dimensions.push(parseFloat(group.panjang));

        return dimensions.length > 0 ? dimensions.join("x") : "-";
    };

    // Format number as Rupiah
    const formatRupiah = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return "";
        return num.toLocaleString("id-ID");
    };

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <PageLayout
            title="Input Harga Barang Datang"
            category="TRANSAKSI"
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg">
                        Daftar Item Barang Pending (Non-PO)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari kode/nama barang..."
                                className="pl-8 w-[280px]"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPendingItems()}
                            disabled={loading}
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold w-[40px]">
                                        No
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Kode Penerimaan
                                    </TableHead>
                                    <TableHead className="font-semibold">Nama Group</TableHead>
                                    <TableHead className="font-semibold">Dimensi</TableHead>
                                    <TableHead className="font-semibold text-center">
                                        Qty
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Gudang / Rak
                                    </TableHead>
                                    <TableHead className="font-semibold">Tanggal</TableHead>
                                    <TableHead className="font-semibold text-center">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-500">Loading data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-lg font-medium">Tidak ada item Non-PO pending</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((detail, idx) => {
                                        const group = detail.item_barang_group;
                                        const gudang = detail.penerimaan_barang?.gudang;
                                        return (
                                            <TableRow key={detail.id} className="hover:bg-gray-50">
                                                <TableCell className="text-gray-500">
                                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm font-medium">
                                                    {detail.penerimaan_barang?.kode_penerimaan || (detail.penerimaan_barang?.id ? `RCV-${detail.penerimaan_barang.id}` : "-")}
                                                </TableCell>
                                                <TableCell>
                                                    {group?.nama_group_barang || "-"}
                                                </TableCell>

                                                <TableCell className="text-sm">
                                                    {buildDimensi(detail)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{detail.qty || 0}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {gudang?.nama_gudang ||
                                                                gudang?.nama ||
                                                                "-"}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {detail.rak?.kode || "-"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(detail.created_at)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => handleOpenProcess(detail)}
                                                        disabled={processingId === detail.id}
                                                    >
                                                        {processingId === detail.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <>
                                                                <DollarSign className="w-4 h-4 mr-1" />
                                                                Process
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {items.length > 0 && (
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

            {/* Process Modal */}
            <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Item Non-PO</DialogTitle>
                        <p className="text-sm text-gray-500">
                            Isi harga modal dan berat untuk mengaktifkan item ini
                        </p>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-4">
                            {/* Item Info */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Penerimaan</span>
                                    <span className="font-mono font-medium">
                                        {selectedItem.penerimaan_barang?.kode_penerimaan || (selectedItem.penerimaan_barang?.id ? `RCV-${selectedItem.penerimaan_barang.id}` : "-")}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Dimensi</span>
                                    <span>{buildDimensi(selectedItem)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Qty</span>
                                    <span>{selectedItem.qty || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Gudang / Rak</span>
                                    <span>
                                        {selectedItem.penerimaan_barang?.gudang?.nama_gudang ||
                                            selectedItem.penerimaan_barang?.gudang?.nama || "-"}
                                        {" / "}
                                        {selectedItem.rak?.kode || "-"}
                                    </span>
                                </div>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-3">
                                <div>
                                    <Label
                                        htmlFor="harga_modal"
                                        className="flex items-center gap-1 mb-1"
                                    >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Harga Modal (Rp) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="harga_modal"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Contoh: 150000"
                                        value={hargaModal}
                                        onChange={(e) => setHargaModal(e.target.value)}
                                        autoFocus
                                    />
                                    {hargaModal && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Rp {formatRupiah(hargaModal)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label
                                        htmlFor="berat"
                                        className="flex items-center gap-1 mb-1"
                                    >
                                        <Weight className="w-3.5 h-3.5" />
                                        Berat (kg) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="berat"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Contoh: 25.50"
                                        value={beratItem}
                                        onChange={(e) => setBeratItem(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowProcessModal(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleProcess}
                            disabled={processingId !== null}
                        >
                            {processingId !== null ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : null}
                            Simpan & Aktifkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertComponent />
        </PageLayout>
    );
}
