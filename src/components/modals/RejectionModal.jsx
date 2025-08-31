import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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

export default function RejectionModal({ 
  open, 
  onOpenChange, 
  salesOrder, 
  onConfirm, 
  onCancel 
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason.trim() || "Ditolak oleh admin");
      setReason("");
    } catch (error) {
      console.error("Error in rejection:", error);
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
            ❌ Tolak Permintaan Hapus
          </DialogTitle>
          <DialogDescription>
            Anda akan menolak permintaan hapus untuk Sales Order{" "}
            <span className="font-semibold">{salesOrder?.no_so}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Alasan Penolakan <span className="text-gray-500">(opsional)</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Masukkan alasan penolakan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Konfirmasi Penolakan
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Permintaan hapus akan ditolak</li>
                    <li>User akan diberitahu tentang penolakan</li>
                    <li>Sales Order akan tetap aktif</li>
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
            variant="destructive"
          >
            {loading ? "Menolak..." : "Tolak Permintaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
