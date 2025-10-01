import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Minus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchSelect from "@/components/ui/search-select";
import { useAlert } from "@/hooks/useAlert";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import PageLayout from "@/components/PageLayout";
import MutationModal from "@/components/modals/ItemMutationModal";
import { getGudangOptions, getItemBarangOptions } from "@/services/masterDataService";

export default function AddMutasiStockPage() {
    const { showAlert, AlertComponent } = useAlert();

    // Master data state
    const [warehouseOptions, setWarehouseOptions] = useState([]);

    // Loading state
    const [loadingWarehouse, setLoadingWarehouse] = useState(false);
    const [loadingStockItem, setLoadingStockItem] = useState(false);
    const [itemStockOptions, setItemStockOptions] = useState([]);


    // Modal state
    const [itemMutationModalOpen, setItemMutationModalOpen] = useState(false);
    
    const [editingItem, setEditingItem] = useState(null);

    // Mutation stock data
    const [mutasiStockData, setMutasiStockData] = useState({
        gudang_tujuan_id: null,
        gudang_asal_id: null,
        stockMutation: []
    });

    // Load master data on component mount
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                setLoadingStockItem(true);
                setLoadingWarehouse(true);

                const [
                    gudang,
                    itemBarang
                ] = await Promise.all([
                    getGudangOptions(),
                    getItemBarangOptions(),
                ]);

                setWarehouseOptions(gudang);
                setItemStockOptions(itemBarang);
            } catch (error) {
                console.error('Error loading master data:', error);
            } finally {
                setLoadingWarehouse(false);
            }
        };

        loadMasterData();
    }, []);


    const handleEditItem = (item) => {
        setEditingItem(item);
        setItemMutationModalOpen(true);
    };

    const handleRemoveItem = (id) => {
        setMutasiStockData(prev => ({ ...prev, stockMutation: prev.stockMutation.filter(item => item.id !== id) }));
    };


    const handleBackToList = () => {
        window.history.back();
    };

    const saveStockForMutation = (rows) => {
        const data = { ...rows, barang: itemStockOptions.find(opt => opt.value === rows.barang_id)?.label };
        setMutasiStockData(prev => {
            const exists = prev.stockMutation.some(item => item.barang_id === rows.barang_id && item.satuan === rows.satuan);

            return {
                ...prev,
                stockMutation: exists
                    ? prev.stockMutation.map(item =>
                        (item.barang_id === rows.barang_id && item.satuan === rows.satuan) ? {...item, qty: item.qty + rows.qty} : item,
                    )
                    : [...prev.stockMutation, data]
            };
        });
    };

    const handleAddMutationItem = () => {
        setEditingItem(null);
        setItemMutationModalOpen(true);
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
                        {/* Pilih Gudang Tujuan */}
                        <div className="grid-form m-lg">
                            <div className="col-span-2">
                                <SearchSelect
                                    label="Gudang Tujuan"
                                    placeholder="Pilih Gudang"
                                    searchPlaceholder="Cari gudang..."
                                    options={warehouseOptions}
                                    value={mutasiStockData.gudang_tujuan_id ? mutasiStockData.gudang_tujuan_id.toString() : ''}
                                    onValueChange={(value) => {
                                        setMutasiStockData({ ...mutasiStockData, gudang_tujuan_id: parseInt(value) });
                                    }}
                                    loading={loadingWarehouse}
                                    disabled
                                />
                            </div>
                        </div>
                        {/* Pilih Gudang Asal */}
                        <div className="grid-form m-lg">
                            <div className="col-span-2">
                                <SearchSelect
                                    label="Gudang Asal"
                                    placeholder="Pilih Gudang"
                                    searchPlaceholder="Cari gudang..."
                                    options={warehouseOptions}
                                    value={mutasiStockData.gudang_asal_id ? mutasiStockData.gudang_asal_id.toString() : ''}
                                    onValueChange={(value) => {
                                        setMutasiStockData({ ...mutasiStockData, gudang_asal_id: parseInt(value) });
                                    }}
                                    loading={loadingWarehouse}
                                    disabled
                                />
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
                                <TableHead className="table-header-cell-standard">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mutasiStockData.stockMutation.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="table-cell-standard">{index + 1}</TableCell>
                                    <TableCell className="table-cell-standard">{item.barang}</TableCell>
                                    <TableCell className="table-cell-standard">{item.satuan}</TableCell>
                                    <TableCell className="table-cell-standard">{item.qty}</TableCell>
                                    <TableCell className="table-cell-standard">
                                        <div className="flex w-0 flex-0 gap-2">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleEditItem(item)}
                                                className="btn-primary"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="btn-danger"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {mutasiStockData.stockMutation.length === 0 && (
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