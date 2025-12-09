import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Minus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import SearchSelect from "@/components/ui/search-select";
import { useAlert } from "@/hooks/useAlert";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import PageLayout from "@/components/PageLayout";
import MutationModal from "@/components/modals/ItemMutationModal";
// import { getGudangOptions } from "@/services/masterDataService";
import { gudangService } from "@/services/master-data/gudangService";
import { useParams } from "react-router-dom";
import { stockMutationService } from "@/services/mutationStockService";

export default function ViewMutasiStockPage() {
    const { id } = useParams();
    const { showAlert, AlertComponent } = useAlert();

    // Master data state (removed full gudang list prefetch)

    // Loading state
    const [loadingStockItem, setLoadingStockItem] = useState(false);
    const [loading, setLoading] = useState(true);

    // const [itemStockOptions, setItemStockOptions] = useState([]);
    const [gudangAsalName, setGudangAsalName] = useState("");
    const [gudangTujuanName, setGudangTujuanName] = useState("");


    // Modal state
    const [itemMutationModalOpen, setItemMutationModalOpen] = useState(false);

    const [editingItem, setEditingItem] = useState(null);

    // Mutation stock data
    const [mutasiStockData, setMutasiStockData] = useState({
        gudang_tujuan_id: null,
        gudang_asal_id: null,
        stock_mutation_items: []
    });

    // Load master data on component mount
    // Removed: do not prefetch gudang list on view page

    useEffect(() => {
        loadStockMutation();
    }, [id]);

    const loadStockMutation = async () => {
        try {
            setLoading(true);
            const result = await stockMutationService.getById(id);
            setMutasiStockData(result.data);
            try {
                const asalId = result?.data?.gudang_asal_id;
                const tujuanId = result?.data?.gudang_tujuan_id;
                if (asalId) {
                    const resA = await gudangService.getById(asalId);
                    setGudangAsalName(resA?.data?.nama_gudang || resA?.data?.nama || "");
                }
                if (tujuanId) {
                    const resT = await gudangService.getById(tujuanId);
                    setGudangTujuanName(resT?.data?.nama_gudang || resT?.data?.nama || "");
                }
            } catch (_) {}
        } catch (error) {
            console.error('Error loading stock mutation:', error);
            showAlert("Error", "Gagal memuat data Mutasi Stock", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setItemMutationModalOpen(true);
    };

    const handleRemoveItem = (indexToRemove) => {
        setMutasiStockData(prev => ({
            ...prev,
            stock_mutation: prev.stock_mutation.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleBackToList = () => {
        window.history.back();
    };

    const saveStockForMutation = (rows) => {
        const data = { ...rows, barang: rows.barang || undefined };
        setMutasiStockData(prev => {
            const exists = prev.stock_mutation.some(item => item.item_barang_id === rows.item_barang_id && item.unit === rows.unit);

            return {
                ...prev,
                stock_mutation: exists
                    ? prev.stock_mutation.map(item =>
                        (item.item_barang_id === rows.item_barang_id && item.unit === rows.unit) ? { ...item, quantity: item.quantity + rows.quantity } : item,
                    )
                    : [...prev.stock_mutation, data]
            };
        });
    };

    const handleAddMutationItem = () => {
        setEditingItem(null);
        setItemMutationModalOpen(true);
    }
    if (loading) {
        return (
            <PageLayout title="Mutasi Stock" category="TRANSAKSI">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                </div>
            </PageLayout>
        );
    }

    if (!mutasiStockData) {
        return (
            <PageLayout title="Stock Mutation" category="TRANSAKSI">
                <div className="text-center py-8">
                    <p className="text-gray-500">Mutasi Stock tidak ditemukan</p>
                    <Button onClick={handleBackToList} className="mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke List
                    </Button>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Mutasi Stock" subtitle="TRANSAKSI">
            {/* Main Content Card */}
            <Card className="section-card">
                <CardHeader className="section-header">
                    <div className="flex justify-between items-center">
                        <CardTitle className="page-title">View Mutasi Stock</CardTitle>
                        <div className="flex space-sm">
                            <Button variant="secondary" size="sm" onClick={handleBackToList} className="btn-secondary">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali ke List
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="section-content space-md">


                    <div className="border-t pt-6">
                        {/* Gudang Tujuan */}
                        <div className="grid-form m-lg">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gudang Tujuan</label>
                                <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 bg-gray-50 text-gray-600 cursor-default">
                                    <span>{gudangTujuanName || 'Belum dipilih'}</span>
                                </div>
                            </div>
                        </div>
                        {/* Gudang Asal */}
                        <div className="grid-form m-lg">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gudang Asal</label>
                                <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 bg-gray-50 text-gray-600 cursor-default">
                                    <span>{gudangAsalName || 'Belum dipilih'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Item List Table */}
            <Card className="section-card">
                <CardHeader className="section-header">
                    <div className="flex justify-between items-center">
                        <CardTitle className="page-title">Daftar Item dalam Stock Mutation</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="section-content">
                    <Table className="table-standard">
                        <TableHeader className="table-header-standard">
                            <TableRow>
                                <TableHead className="table-header-cell-standard">#</TableHead>
                                <TableHead className="table-header-cell-standard">Item Barang</TableHead>
                                <TableHead className="table-header-cell-standard">Satuan</TableHead>
                                <TableHead className="table-header-cell-standard">Qty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mutasiStockData.stock_mutation_items.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="table-cell-standard">{index + 1}</TableCell>
                                    <TableCell className="table-cell-standard">{item.item_barang.kode_barang + ' - ' + item.item_barang.nama_item_barang}</TableCell>
                                    <TableCell className="table-cell-standard">{item.unit}</TableCell>
                                    <TableCell className="table-cell-standard">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                            {mutasiStockData.stock_mutation_items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={12} className="table-cell-standard text-center text-gray-500 py-8">
                                        Belum ada item yang ditambahkan
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <MutationModal
                // open={itemMutationModalOpen}
                // onOpenChange={setItemMutationModalOpen}
                item={editingItem}
                title="Form Item Mutasi"
            // onSave={saveStockForMutation}
            // loadingOptions={loadingStockItem}
            />
            {/* Alert Modal Component */}
            <AlertComponent />
        </PageLayout>
    )
}
