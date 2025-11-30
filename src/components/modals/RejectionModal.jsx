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
            ❌ Tolak Request
          </DialogTitle>
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
          
          {/* Penjelasan tambahan dihapus */}
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
