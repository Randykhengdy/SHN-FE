import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import AsyncSearchSelect from "@/components/ui/async-search-select";
import { getItemBarangOptionsFiltered } from "@/services/masterDataService";
import { request } from "@/lib/request";
import { useAlert } from "../ui/modal";
import { itemBarangService } from "@/services/master-data";
import { Label } from "../ui/label";
import CustomAlert from "./CustomAlert";

const MergeBarangModal = ({
    open,
    onOpenChange,
    onSave
}) => {
    const { showAlert, AlertComponent } = useAlert();

    const [itemStock1, setItemStock1] = useState(null);
    const [itemStock2, setItemStock2] = useState(null);

    useEffect(() => {
        setItemStock1(null);
        setItemStock2(null);
    }, [open]);

    //Loading state
    const [loadingItemStock, setLoadingItemStock] = useState(false);
    const [loadingItemStockPair, setLoadingItemStockPair] = useState(false);

    // Master Data
    const [itemStockOptions, setItemStockOptions] = useState([]);
    const [itemStockPairOptions, setItemStockPairOptions] = useState([]);
    const [itemStock1Quantity, setItemStock1Quantity] = useState(0);
    const [itemStock2Quantity, setItemStock2Quantity] = useState(0);
    const [total, setTotal] = useState(0);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isMerging, setMerging] = useState(false);
    const [pairResetKey, setPairResetKey] = useState(0);

    useEffect(() => {
        setItemStockOptions([]);
        setItemStockPairOptions([]);
    }, []);

    const getItemQuantity = async (id, setQuantity) => {
        try {
            const result = await itemBarangService.getById(id);
            if (result?.data?.quantity) {
                setQuantity(parseInt(result.data.quantity));
            }
        } catch (error) {
            console.log(error);
        }

    }

    useEffect(() => {
        setItemStock2(null);
        setItemStock2Quantity(0);
        setItemStockPairOptions([]);
        setPairResetKey((k) => k + 1);
        if (itemStock1) getItemQuantity(itemStock1, setItemStock1Quantity);
        
    }, [itemStock1]);
    useEffect(() => {
        if (itemStock2) getItemQuantity(itemStock2, setItemStock2Quantity);
    }, [itemStock2]);

    useEffect(() => {
        if (itemStock1 && itemStock2) {
            setTotal(itemStock1Quantity + itemStock2Quantity);
        }
    }, [itemStock1Quantity, itemStock2Quantity]);

    const validateMerge = () => {
        let isValid = true;
        let messages = '';
        if (itemStock1 == null) {
            messages += 'Mohon pilih item barang';
            isValid = false;
        }
        if (itemStock2 == null) {
            messages += (messages.length != 0) ? '\n' : '';
            messages += 'Mohon pilih item barang';
            isValid = false;
        }
        if (String(itemStock1 || '') === String(itemStock2 || '')) {
            messages += (messages.length != 0) ? '\n' : '';
            messages += 'Tidak bisa merge item yang sama';
            isValid = false;
        }

        if (!isValid) {
            showAlert('Error', messages, 'error');
            return;
        }
        setShowMergeModal(true);
    };

    const handleSave = () => {
        setMerging(true);
        const result = {
            id_1: itemStock1,
            id_2: itemStock2
        }
        onSave?.(result);
        setMerging(false);
        onOpenChange(false);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[90vw] !max-w-3xl flex flex-col">
                    {/* Header */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Merge barang</DialogTitle>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Pilih Item Mutasi */}
                        <div className="flex">
                            <div className="flex-1 m-lg !mt-0 w-[60%]">
                                <div className="col-span-2">
                                    <AsyncSearchSelect
                                        label="Item Barang"
                                        placeholder="Pilih Item Barang"
                                        searchPlaceholder="Cari barang..."
                                        value={itemStock1 || ""}
                                        onValueChange={(value) => {
                                            setItemStock1(value);
                                            setItemStock2(null);
                                            setItemStock2Quantity(0);
                                            setItemStockPairOptions([]);
                                            setPairResetKey((k) => k + 1);
                                        }}
                                        fetchOptions={async (q, page) => {
                                            const params = new URLSearchParams();
                                            params.append('page', String(page || 1));
                                            params.append('per_page', '10');
                                            if (q) params.append('search', q);
                                            const resp = await request(`/item-barang/mergeable?${params.toString()}`, { method: 'GET' });
                                            const rows = Array.isArray(resp?.data) ? resp.data : [];
                                            return rows.map(item => ({
                                                value: String(item.id),
                                                label: `${item.kode_barang || ''} - ${item.nama_item_barang || 'Unknown'}`.trim(),
                                                quantity: Number(item.quantity || 0)
                                            }));
                                        }}
                                        displayKey="label"
                                        valueKey="value"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="m-lg !ml-0 !mt-0  space-y-2">
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Quantity</Label>
                                <div className="relative">
                                    <Input value={itemStock1Quantity} disabled />
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="flex-1 m-lg !mt-0 w-[60%]">
                                <div className="col-span-2">
                                    <AsyncSearchSelect
                                        key={`pair-${pairResetKey}`}
                                        label="Item Barang"
                                        placeholder="Pilih Item Barang"
                                        searchPlaceholder="Cari barang..."
                                        value={itemStock2 || ""}
                                        onValueChange={async (value) => {
                                            setItemStock2(value);
                                            if (value) getItemQuantity(value, setItemStock2Quantity);
                                        }}
                                        fetchOptions={async (q, page) => {
                                            if (!itemStock1) return [];
                                            let rows = [];
                                            try {
                                                const qs = q ? `?search=${encodeURIComponent(q)}` : '';
                                                const resp = await request(`/api/item-barang/similar-type/${itemStock1}${qs}`, { method: 'GET' });
                                                rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
                                            } catch (_) { rows = []; }
                                            const term = String(q || '').toLowerCase();
                                            const base = (Array.isArray(rows) ? rows : [])
                                                .filter(r => String(r.id) !== String(itemStock1 || ''))
                                                .filter(r => {
                                                    if (!term) return true;
                                                    const text = `${r.kode_barang || ''} ${r.nama_item_barang || r.nama || ''}`.toLowerCase();
                                                    return text.includes(term);
                                                });
                                            const PAGE_SIZE = 10;
                                            const p = Math.max(1, page || 1);
                                            const start = (p - 1) * PAGE_SIZE;
                                            const slice = base.slice(start, start + PAGE_SIZE);
                                            return slice.map(item => ({
                                                value: String(item.id),
                                                label: `${item.kode_barang || ''} - ${item.nama_item_barang || item.nama || 'Unknown'}`.trim(),
                                                searchKey: `${item.kode_barang || ''} ${item.nama_item_barang || item.nama || ''}`.trim(),
                                                quantity: Number(item.quantity || 0)
                                            }));
                                        }}
                                        displayKey="label"
                                        valueKey="value"
                                        disabled={!itemStock1}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="m-lg !ml-0 !mt-0 space-y-2">
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Quantity</Label>
                                <div className="relative">
                                    <Input value={itemStock2Quantity} disabled />
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="flex-1" />
                            <div className="m-lg !ml-0 !mt-0 space-y-2">
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Total</Label>
                                <div className="relative">
                                    <Input value={total} disabled />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="flex-shrink-0 pt-4 border-t">
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Tutup
                            </Button>
                            <Button
                                onClick={validateMerge}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Simpan Perubahan
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Merge Confirmation Modal */}
            <CustomAlert
                open={showMergeModal}
                onOpenChange={setShowMergeModal}
                title="Konfirmasi Merge"
                message={`Yakin ingin Merge Barang "${itemStock1}" dan "${itemStock2}"?`}
                type="warning"
                showCancel={true}
                confirmText={isMerging ? "Merging..." : "Ya, Gabungkan"}
                cancelText="Tidak"
                onConfirm={handleSave}
            />
            {/* Alert Modal Component */}
            <AlertComponent />
        </>
    );
};

export default MergeBarangModal;
