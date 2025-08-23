import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ShapeTypeModal({ isOpen, onSelect, onClose }) {
  const handleSelect = (type) => {
    onSelect(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Pilih Jenis Bentuk</DialogTitle>
          <DialogDescription>
            Pilih jenis bentuk yang akan Anda kerjakan
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 justify-center py-4">
          <div
            onClick={() => handleSelect("1D")}
            className="flex-1 max-w-[180px] p-6 border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-1 text-center"
          >
            <div className="text-4xl mb-2">📏</div>
            <div className="text-lg font-semibold mb-1">1D - Shaft</div>
            <div className="text-sm text-gray-500">
              Bentuk 1 dimensi<br />Hanya panjang
            </div>
          </div>

          <div
            onClick={() => handleSelect("2D")}
            className="flex-1 max-w-[180px] p-6 border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-1 text-center"
          >
            <div className="text-4xl mb-2">📐</div>
            <div className="text-lg font-semibold mb-1">2D - Plate</div>
            <div className="text-sm text-gray-500">
              Bentuk 2 dimensi<br />Panjang & lebar
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 italic text-center">
          Pilihan ini akan menentukan konfigurasi workshop yang tersedia
        </div>
      </DialogContent>
    </Dialog>
  );
}
