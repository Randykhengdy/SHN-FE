import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAlert } from "../ui/modal";

const unitOptions = [
    { value: "bulk", label: "Bulk" },
    { value: "single", label: "Single" }
];

const KonversiModal = ({
    open,
    item,
    onOpenChange,
    onSave
}) => {
    const { showAlert, AlertComponent } = useAlert();

    const handleSave = () => {

        const result = {
            item_barang_id: selectedItemStock,
            unit: unit,
            quantity: unit === 'bulk' ? parseInt(quantity) : 1
        }

        onSave?.(result);
        onOpenChange(false);
    };

    return <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] !max-w-3xl flex flex-col">
                {/* Header */}
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Konversi Barang</DialogTitle>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1">



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
};

export default KonversiModal;