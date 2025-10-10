import PageLayout from "@/components/PageLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/hooks/useAlert";
import { useCallback, useEffect, useState } from "react";
import { mergeBarangService } from "@/services/mergeBarangService";
import { isAdmin } from "@/lib/utils";
import { Download, Plus, RefreshCw, TableColumnsSplit } from "lucide-react";
import CustomAlert from "@/components/modals/CustomAlert";
import { Input } from "@/components/ui/input";
import MergeBarangModal from "@/components/modals/MergeBarangModal";

export default function MergeBarangPage() {

    const { showAlert, AlertComponent } = useAlert();

    const [loading, setLoading] = useState(false);

    const [itemBarang, setItemBarang] = useState([]);

    const [search, setSearch] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isMerging, setMerging] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const loadItemBarang = useCallback(async () => {
        try {
            setLoading(true);
            const result = await mergeBarangService.getAll({ page: currentPage, per_page: itemsPerPage, search: search });

            // Transform API data to match our UI structure
            const transformedData = result.data.map(kb => ({
                id: kb.id,
                mergeDate: formatDate(kb.merge_date),
                item_barang: kb.nama_item_barang,
                quantity: kb.quantity,
            }));

            setItemBarang(transformedData);
            setTotalItems(result.pagination.total);
        } catch (error) {
            console.error('Error loading item barang:', error);
            showAlert("Error", "Gagal memuat data item barang", "error");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, search]);

    useEffect(() => {
        loadItemBarang();
    }, [loadItemBarang]);

    const handleMergeBarang = () => {
        setShowMergeModal(true);
    }

    const handleMergeBarangConfirm = async (mergedItem) => {
        if (isMerging) {
            console.log('⏭️ Already processing merge operation');
            return;
        }

        try {
            setMerging(true);

            const response = await mergeBarangService.mergeBarang(mergedItem);

            console.log('✅ Stock barang merged:', response);

            // Close modal first
            setShowConfirmationModal(false);

            // Show success message and reload data after alert closes
            showAlert("Sukses", "Stock Barang berhasil dimerge!", "success", () => {
                loadItemBarang();
            });

        } catch (error) {
            console.error('❌ Error memotong barang:', error);
            showAlert("Error", `Gagal memotong barang. ${error.message}`, "error");
        } finally {
            setMerging(false);
        }
    }


    const handleClearFilter = () => {
        setSearch("");
        setCurrentPage(1);
    };


    const handleExport = () => {
        // TODO: Implement export functionality
        console.log("Exporting stock mutations...");
    };

    return <PageLayout title="Merge Barang" category="TRANSAKSI">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Daftar Merge Barang</h2>
            </div>
            <Button onClick={handleMergeBarang} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Merge Barang
            </Button>
        </div>
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
        {/* Merge Barang Table */}
        <Card className="mb-6">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Waktu Merge</TableHead>
                                <TableHead className="font-semibold">Item</TableHead>
                                <TableHead className="font-semibold">Quantity</TableHead>
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
                                        <TableCell className="font-medium">{ib.MergeDate}</TableCell>
                                        <TableCell>{ib.item_barang}</TableCell>
                                        <TableCell>{ib.quantity}</TableCell>
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
        {/* Merge Confirmation Modal */}
        <MergeBarangModal
            open={showMergeModal}
            onOpenChange={setShowMergeModal}
            onSave={handleMergeBarangConfirm}
        />
        {/* <CustomAlert
            open={showConfirmationModal}
            onOpenChange={setShowConfirmationModal}
            title="Konfirmasi Merge Barang"
            message={`Apakah yakin untuk ubah status "${selectedItem?.item_barang}" menjadi lempengan siap potong?`}
            type="warning"
            showCancel={true}
            confirmText={isMerging ? "Memotong..." : "Ya, Ubah"}
            cancelText="Tidak"
            onConfirm={handleMergeBarangConfirm}
        /> */}
        {/* Alert Modal Component */}
        <AlertComponent />
    </PageLayout>
}