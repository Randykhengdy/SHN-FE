import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import { getItemBarangUtuhOptions } from "@/services/masterDataService";
import { useAlert } from "../ui/modal";
import { itemBarangService } from "@/services/master-data";
import { Label } from "../ui/label";
import { Description } from "@radix-ui/react-dialog";
import CustomAlert from "./CustomAlert";

const SplitBarangModal = ({
    open,
    onOpenChange,
    onSave
}) => {
    const { showAlert, AlertComponent } = useAlert();

    const [itemStock, setItemStock] = useState(null);
    const [quantity, setQuantity] = useState(0);
    const [newSplitQuantity, setNewSplitQuantity] = useState(0);
    const [finalQuantity, setFinalQuantity] = useState(0);

    useEffect(() => {
        setItemStock(null);
        setNewSplitQuantity(0);
        setQuantity(0);
        setFinalQuantity(0);
    }, [open]);

    //Loading state
    const [loadingItemStock, setLoadingItemStock] = useState(false);

    // Master Data
    const [itemStockOptions, setItemStockOptions] = useState([]);

    const [showSplitModal, setShowSplitModal] = useState(false);
    const [isSplitting, setSplitting] = useState(false);
    // Load master data on component mount
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                setLoadingItemStock(true);
                const [
                    itemStocks,
                ] = await Promise.all([
                    getItemBarangUtuhOptions(),
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
        if (itemStock) getItemQuantity(itemStock, setQuantity);
    }, [itemStock]);
    useEffect(() => {
        if (newSplitQuantity > quantity) setNewSplitQuantity(quantity);
        setFinalQuantity(quantity - newSplitQuantity);
    }, [newSplitQuantity, quantity]);

    const validateSplit = () => {
        let isValid = true;
        let messages = '';
        if (itemStock == null) {
            messages += 'Mohon pilih item barang';
            isValid = false;
        }
        if (newSplitQuantity == 0) {
            messages += (messages.length != 0) ? '\n' : '';
            messages += 'Mohon tentukan jumlah split';
            isValid = false;
        }

        if (!isValid) {
            showAlert('Error', messages, 'error');
            return;
        }

        setShowSplitModal(true);
    };
    const handleSave = () => {
        setSplitting(true);
        const result = {
            id: itemStock,
            quantity: newSplitQuantity
        }
        onSave?.(result);
        setSplitting(false);
        onOpenChange(false);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[90vw] !max-w-3xl flex flex-col">
                    {/* Header */}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Split barang</DialogTitle>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                            </div>
                        </div>
                        <Description />
                    </DialogHeader>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Pilih Item Mutasi */}
                        <div className="flex">
                            <div className="flex-1 m-lg !mt-0 w-[60%]">
                                <div className="col-span-2">
                                    <SearchSelect
                                        label="Item Barang"
                                        placeholder="Pilih Item Barang"
                                        searchPlaceholder="Cari barang..."
                                        value={itemStock}
                                        onValueChange={(value) => {
                                            setItemStock(value);
                                        }}
                                        options={itemStockOptions}
                                        loading={loadingItemStock}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="m-lg !ml-0 !mt-0 space-y-2">
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Quantity Awal</Label>
                                <div className="relative">
                                    <Input value={quantity} disabled />
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="flex-1 m-lg !mt-0 space-y-2  w-[60%]">
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Quantity Split</Label>
                                <div className="relative">
                                    <Input
                                        value={newSplitQuantity}
                                        type="number"
                                        onChange={e => setNewSplitQuantity(parseInt(e.target.value))}
                                        min="0"
                                        max={quantity.toString()} />
                                </div>
                            </div>
                            <div className="m-lg !ml-0 !mt-0 space-y-2">
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Quantity Sisa</Label>
                                <div className="relative">
                                    <Input value={finalQuantity} disabled />
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
                                onClick={validateSplit}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Simpan Perubahan
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Split Confirmation Modal */}
            <CustomAlert
                open={showSplitModal}
                onOpenChange={setShowSplitModal}
                title="Konfirmasi Split"
                message={`Yakin ingin Split Barang "${itemStock}" sebanyak ${newSplitQuantity}?`}
                type="warning"
                showCancel={true}
                confirmText={isSplitting ? "Splitting..." : "Ya, Pisahkan"}
                cancelText="Tidak"
                onConfirm={handleSave}
            />
            {/* Alert Modal Component */}
            <AlertComponent />
        </>
    );
};

export default SplitBarangModal;