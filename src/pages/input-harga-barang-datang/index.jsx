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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, DollarSign, Weight, Package, RefreshCw, Printer } from "lucide-react";
import { penerimaanBarangService } from "@/services/penerimaanBarangService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";
import { openItemQRPDFPreview, openItemQRPDFBatch } from "@/lib/pdfUtils";

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

    // Tab state
    const [activeTab, setActiveTab] = useState("belum-diinput");

    // Processed data state
    const [processedItems, setProcessedItems] = useState([]);
    const [loadingProcessed, setLoadingProcessed] = useState(false);
    const [searchProcessed, setSearchProcessed] = useState("");
    const [currentProcessedPage, setCurrentProcessedPage] = useState(1);
    const [processedItemsPerPage, setProcessedItemsPerPage] = useState(10);
    const [totalProcessedItems, setTotalProcessedItems] = useState(0);

    // Multiselect state
    const [selectedProcessedIds, setSelectedProcessedIds] = useState([]);

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

    const loadProcessedItems = useCallback(
        async () => {
            try {
                setLoadingProcessed(true);
                const result = await penerimaanBarangService.getProcessedNonPoItems({
                    search: searchProcessed,
                    per_page: processedItemsPerPage,
                    page: currentProcessedPage,
                });

                setProcessedItems(result.data || []);
                setTotalProcessedItems(result.pagination?.total || 0);
            } catch (error) {
                console.error("❌ Error loading processed items:", error);
                showAlert(
                    "Error",
                    "Gagal memuat data item processed: " + (error.message || ""),
                    "error"
                );
                setProcessedItems([]);
            } finally {
                setLoadingProcessed(false);
            }
        },
        [searchProcessed, processedItemsPerPage, currentProcessedPage]
    );

    useEffect(() => {
        if (activeTab === "belum-diinput") {
            loadPendingItems();
        } else {
            loadProcessedItems();
        }
    }, [activeTab, loadPendingItems, loadProcessedItems]);

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
                () => {
                    loadPendingItems();
                    if (activeTab === "sudah-diinput") loadProcessedItems();
                }
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

    // --- QR Functions ---
    const handlePrintSingle = async (detail) => {
        if (!detail.item_barang) {
            showAlert("Error", "Data item barang tidak ditemukan untuk detail ini.", "error");
            return;
        }
        try {
            await openItemQRPDFPreview(detail.item_barang);
        } catch (err) {
            console.error("Print single err", err);
            showAlert("Error", "Gagal print batch: " + err.message, "error");
        }
    };

    const handlePrintBatch = async () => {
        if (selectedProcessedIds.length === 0) return;

        const selectedMdl = processedItems
            .filter((p) => selectedProcessedIds.includes(p.id) && p.item_barang)
            .map(p => p.item_barang);

        if (selectedMdl.length === 0) {
            showAlert("Error", "Item terpilih tidak memiliki data Item Barang", "error");
            return;
        }

        try {
            await openItemQRPDFBatch(selectedMdl);
            setSelectedProcessedIds([]);
        } catch (err) {
            console.error("Print batch err", err);
            showAlert("Error", "Gagal print batch: " + err.message, "error");
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = processedItems.map((p) => p.id);
            setSelectedProcessedIds(allIds);
        } else {
            setSelectedProcessedIds([]);
        }
    };

    const handleSelectItem = (id, checked) => {
        if (checked) {
            setSelectedProcessedIds((prev) => [...prev, id]);
        } else {
            setSelectedProcessedIds((prev) => prev.filter((itemId) => itemId !== id));
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white border">
                    <TabsTrigger value="belum-diinput" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        Belum Diinput
                        {totalItems > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                                {totalItems}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="sudah-diinput" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        Sudah Diinput
                        {totalProcessedItems > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                                {totalProcessedItems}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="belum-diinput">
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
                </TabsContent>

                <TabsContent value="sudah-diinput">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg">
                                Daftar Item Barang Sudah Diproses
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedProcessedIds.length > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={handlePrintBatch}
                                        className="bg-green-600 hover:bg-green-700 font-medium"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print QR Batch ({selectedProcessedIds.length})
                                    </Button>
                                )}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Cari kode/nama barang..."
                                        className="pl-8 w-[280px]"
                                        value={searchProcessed}
                                        onChange={(e) => {
                                            setSearchProcessed(e.target.value);
                                            setCurrentProcessedPage(1);
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadProcessedItems()}
                                    disabled={loadingProcessed}
                                >
                                    <RefreshCw
                                        className={`w-4 h-4 mr-1 ${loadingProcessed ? "animate-spin" : ""}`}
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
                                            <TableHead className="w-[50px] text-center">
                                                <Checkbox
                                                    checked={
                                                        processedItems.length > 0 &&
                                                        selectedProcessedIds.length === processedItems.length
                                                    }
                                                    onCheckedChange={handleSelectAll}
                                                    aria-label="Select all"
                                                />
                                            </TableHead>
                                            <TableHead className="font-semibold w-[40px]">No</TableHead>
                                            <TableHead className="font-semibold">Kode Barang / Penerimaan</TableHead>
                                            <TableHead className="font-semibold">Nama Group / Dimensi</TableHead>
                                            <TableHead className="font-semibold text-center">Qty / Berat</TableHead>
                                            <TableHead className="font-semibold text-right">Harga Modal</TableHead>
                                            <TableHead className="font-semibold">Gudang / Rak</TableHead>
                                            <TableHead className="font-semibold text-center">QR</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingProcessed ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                                        <span className="ml-2 text-gray-500">Loading data...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : processedItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                    <p className="text-lg font-medium">Tidak ada item Non-PO yang sudah diproses</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            processedItems.map((detail, idx) => {
                                                const group = detail.item_barang_group;
                                                const gudang = detail.penerimaan_barang?.gudang;
                                                const itemBarang = detail.item_barang;
                                                const isSelected = selectedProcessedIds.includes(detail.id);

                                                return (
                                                    <TableRow key={detail.id} className="hover:bg-gray-50">
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => handleSelectItem(detail.id, checked)}
                                                                aria-label="Select row"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-gray-500">
                                                            {(currentProcessedPage - 1) * processedItemsPerPage + idx + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-sm font-medium text-blue-700">
                                                                    {itemBarang?.kode_item_barang || "-"}
                                                                </span>
                                                                <span className="text-xs text-gray-500 mt-1">
                                                                    {detail.penerimaan_barang?.kode_penerimaan || (detail.penerimaan_barang?.id ? `RCV-${detail.penerimaan_barang.id}` : "-")}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                <span>{group?.nama_group_barang || "-"}</span>
                                                                <span className="text-xs text-gray-500">{buildDimensi(detail)}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Badge variant="secondary">{detail.qty || 0} Pcs</Badge>
                                                                <span className="text-xs text-gray-600">
                                                                    {itemBarang?.berat ? `${itemBarang.berat} kg` : "-"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            {itemBarang?.harga_modal ? `Rp ${formatRupiah(itemBarang.harga_modal)}` : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm">
                                                                    {gudang?.nama_gudang || gudang?.nama || "-"}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {detail.rak?.kode || "-"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePrintSingle(detail);
                                                                }}
                                                            >
                                                                <Printer className="w-3.5 h-3.5 mr-1" />
                                                                QR
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Processed */}
                            {processedItems.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-700">
                                            Menampilkan {totalProcessedItems > 0 ? (currentProcessedPage - 1) * processedItemsPerPage + 1 : 0}-{Math.min(currentProcessedPage * processedItemsPerPage, totalProcessedItems)} dari {totalProcessedItems} data
                                        </span>
                                        <select
                                            value={processedItemsPerPage}
                                            onChange={(e) => {
                                                setProcessedItemsPerPage(Number(e.target.value));
                                                setCurrentProcessedPage(1);
                                            }}
                                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                            <option value={5}>5 per halaman</option>
                                            <option value={10}>10 per halaman</option>
                                            <option value={25}>25 per halaman</option>
                                            <option value={50}>50 per halaman</option>
                                        </select>
                                    </div>

                                    {Math.ceil(totalProcessedItems / processedItemsPerPage) > 1 && (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentProcessedPage(currentProcessedPage - 1)}
                                                disabled={currentProcessedPage === 1}
                                                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Sebelumnya
                                            </button>

                                            {Array.from({ length: Math.min(5, Math.ceil(totalProcessedItems / processedItemsPerPage)) }, (_, i) => {
                                                const totPages = Math.ceil(totalProcessedItems / processedItemsPerPage);
                                                let pageNum;
                                                if (totPages <= 5) pageNum = i + 1;
                                                else if (currentProcessedPage <= 3) pageNum = i + 1;
                                                else if (currentProcessedPage >= totPages - 2) pageNum = totPages - 4 + i;
                                                else pageNum = currentProcessedPage - 2 + i;

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentProcessedPage(pageNum)}
                                                        className={`px-3 py-1 text-sm border rounded ${currentProcessedPage === pageNum ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => setCurrentProcessedPage(currentProcessedPage + 1)}
                                                disabled={currentProcessedPage === Math.ceil(totalProcessedItems / processedItemsPerPage)}
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
            </Tabs>

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
