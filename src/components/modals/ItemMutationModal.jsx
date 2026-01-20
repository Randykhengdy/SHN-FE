import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import AsyncSearchSelect from "@/components/ui/async-search-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getItemBarangOptions } from "@/services/masterDataService";
import { itemBarangService } from "@/services/master-data/itemBarangService";
import { request } from "@/lib/request";
import { useAlert } from "../ui/modal";

const unitOptions = [
    { value: "bulk", label: "Bulk" },
    { value: "single", label: "Single" }
];

const MutationModal = ({
    open,
    item,
    onOpenChange,
    onSave,
    gudangId
}) => {
    const { showAlert, AlertComponent } = useAlert();

    const [selectedItemStock, setSelectedItemStock] = useState(null);
    const [unit, setUnit] = useState(null);
    const [quantity, setQuantity] = useState(0);
    const [availableQuantity, setAvailableQuantity] = useState(0);
    const [selectedItemLabel, setSelectedItemLabel] = useState("");
    const [rakAsal, setRakAsal] = useState("-");

    useEffect(() => {
        if (!open) return; // hanya jalan ketika modal dibuka

        if (item) {
            // edit mode
            setSelectedItemStock(item.item_barang_id);
            setUnit(item.unit);
            setQuantity(item.quantity);
            setAvailableQuantity(item.available_quantity || 0);
            setSelectedItemLabel(item.barang || "");
            setRakAsal(item.rak_asal || "-");
        } else {
            // add mode
            setSelectedItemStock(null);
            setUnit(null);
            setQuantity(0);
            setAvailableQuantity(0);
            setSelectedItemLabel("");
            setRakAsal("-");
        }
    }, [open, item]); // depend ke open & item

    //Loading state
    const [loadingItemStock, setLoadingItemStock] = useState(false);

    // Master Data
    const [itemStockOptions, setItemStockOptions] = useState([]);

    // Load master data on component mount
    useEffect(() => {
        if (open) {
            // keep existing helper available for potential reuse; async select will fetch on demand
            setItemStockOptions([]);
        }
    }, [open, gudangId]);

    const handleSave = () => {
        let isValid = true;
        let messages = '';
        if (selectedItemStock == null) {
            messages += 'Mohon pilih item barang';
            isValid = false;
        }
        if (unit == null) {
            messages += (messages.length != 0) ? '\n' : '';
            messages += 'Mohon pilih satuan';
            isValid = false;
        }
        if (unit === 'bulk' && quantity == 0) {
            messages += (messages.length != 0) ? '\n' : '';
            messages += 'Quantity harus lebih dari 0 ';
            isValid = false;
        }

        if (!isValid) {
            showAlert('Error', messages, 'error');
            return;
        }

        const result = {
            item_barang_id: selectedItemStock,
            unit: unit,
            quantity: unit === 'bulk' ? parseInt(quantity) : 1,
            available_quantity: availableQuantity,
            barang: selectedItemLabel,
            rak_asal: rakAsal
        }

        onSave?.(result);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[90vw] !max-w-3xl flex flex-col">
                    {/* Header */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{item ? 'Edit item mutasi' : 'Tambah item mutasi'}</DialogTitle>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Pilih Item Mutasi */}
                        <div className="grid-form m-lg !mt-0">
                            <div className="col-span-2">
                                <AsyncSearchSelect
                                    label="Item Barang"
                                    placeholder="Pilih Item Barang"
                                    searchPlaceholder="Cari barang..."
                                    value={selectedItemStock || ""}
                                    onValueChange={async (value) => {
                                        setSelectedItemStock(value);
                                        try {
                                            const resp = await itemBarangService.getById(value);
                                            const data = resp?.data || resp;
                                            setAvailableQuantity(Number(data?.quantity || 0));
                                            const lbl = `${data?.kode_barang || ''} - ${data?.nama_item_barang || 'Unknown'}`.trim();
                                            setSelectedItemLabel(lbl);
                                            setRakAsal(data?.rak?.nama_rak || data?.rak?.nama || "-");
                                        } catch (_) {
                                            setAvailableQuantity(0);
                                            setSelectedItemLabel("");
                                            setRakAsal("-");
                                        }
                                    }}
                                    fetchOptions={async (q, page) => {
                                        const params = new URLSearchParams();
                                        params.append('page', String(page || 1));
                                        params.append('per_page', '50');
                                        if (gudangId) params.append('gudang_id', String(gudangId));
                                        if (q) params.append('search', q);
                                        const resp = await request(`/item-barang?${params.toString()}`, { method: 'GET' });
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
                        <div className="grid-form m-lg !mt-0">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rak Asal:
                                </label>
                                <Input
                                    value={rakAsal}
                                    disabled
                                    className="bg-gray-100"
                                />
                            </div>
                        </div>
                        <div className="grid-form m-lg !mt-0">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity Tersedia:
                                </label>
                                <Input
                                    value={Math.round(availableQuantity)}
                                    disabled
                                    className="bg-gray-100"
                                />
                            </div>
                        </div>
                        <div className="grid-form m-lg !mt-0">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Satuan:
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Select value={unit} onValueChange={(value) => {
                                    setUnit(value);
                                }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {unit === 'bulk' && (
                            <div className="grid-form m-lg !mt-0">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity
                                    </label>
                                    <Input
                                        placeholder="Quantity"
                                        value={quantity}
                                        onChange={e => setQuantity(parseInt(e.target.value))}
                                        type="number"
                                        min="0"
                                    />
                                </div>
                            </div>
                        )}
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
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Simpan Perubahan
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Alert Modal Component */}
            <AlertComponent />
        </>
    );
};

export default MutationModal;
