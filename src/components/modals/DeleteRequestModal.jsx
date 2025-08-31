import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteRequestModal({ 
  open, 
  onOpenChange, 
  salesOrder, 
  onConfirm, 
  onCancel 
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setReason("Requested by user"); // Default reason if empty
    }
    
    setLoading(true);
    try {
      await onConfirm(reason.trim() || "Requested by user");
      setReason("");
    } catch (error) {
      console.error("Error in delete request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            🗑️ Ajukan Permintaan Hapus
          </DialogTitle>
          <DialogDescription>
            Anda akan mengajukan permintaan hapus untuk Sales Order{" "}
            <span className="font-semibold">{salesOrder?.noSo}</span>.
            <br />
            Admin akan meninjau permintaan Anda.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Alasan Penghapusan <span className="text-gray-500">(opsional)</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Masukkan alasan penghapusan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Informasi Penting
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Permintaan akan ditinjau oleh admin</li>
                    <li>Anda dapat membatalkan permintaan sebelum disetujui</li>
                    <li>Status akan berubah menjadi "Delete Requested"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Mengajukan..." : "Ajukan Permintaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
