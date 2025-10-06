import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getItemBarangOptions } from "@/services/masterDataService";
import { useAlert } from "../ui/modal";

const unitOptions = [
    { value: "bulk", label: "Bulk" },
    { value: "single", label: "Single" }
];

const MutationModal = ({
    open,
    item,
    onOpenChange,
    onSave
}) => {
    const { showAlert, AlertComponent } = useAlert();

    const [selectedItemStock, setSelectedItemStock] = useState(null);
    const [unit, setUnit] = useState(null);
    const [quantity, setQuantity] = useState(0);

    useEffect(() => {
        if (!open) return; // hanya jalan ketika modal dibuka

        if (item) {
            // edit mode
            setSelectedItemStock(item.item_barang_id);
            setUnit(item.unit);
            setQuantity(item.quantity);
        } else {
            // add mode
            setSelectedItemStock(null);
            setUnit(null);
            setQuantity(0);
        }
    }, [open, item]); // depend ke open & item

    //Loading state
    const [loadingItemStock, setLoadingItemStock] = useState(false);

    // Master Data
    const [itemStockOptions, setItemStockOptions] = useState([]);

    // Load master data on component mount
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                setLoadingItemStock(true);

                const [
                    itemStocks,
                ] = await Promise.all([
                    getItemBarangOptions(),
                ]);
                setItemStockOptions(itemStocks);
            } catch (error) {
                console.error('Error loading master data:', error);
            } finally {
                setLoadingItemStock(false);
            }
        };

        loadMasterData();
    }, []);

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
            quantity: unit === 'bulk' ? parseInt(quantity) : 1
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
                                <SearchSelect
                                    label="Item Barang"
                                    placeholder="Pilih Item Barang"
                                    searchPlaceholder="Cari barang..."
                                    value={selectedItemStock}
                                    onValueChange={(value) => {
                                        setSelectedItemStock(value);
                                    }}
                                    options={itemStockOptions}
                                    loading={loadingItemStock}
                                    required
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