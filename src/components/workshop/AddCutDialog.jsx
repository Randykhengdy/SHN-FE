import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AddCutDialog({ selectedPO, onSave }) {
  const [open, setOpen] = useState(false);
  const [ukuran, setUkuran] = useState("");
  const [qty, setQty] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const handleSave = () => {
    if (!ukuran || !qty) return alert("Ukuran dan Qty wajib diisi!");

    const newReport = {
      noPO: selectedPO.noPO,
      ukuran,
      qty: parseInt(qty),
      keterangan,
    };

    const existing = JSON.parse(localStorage.getItem("cuttingReports")) || [];
    existing.push(newReport);
    localStorage.setItem("cuttingReports", JSON.stringify(existing));

    setUkuran("");
    setQty("");
    setKeterangan("");
    setOpen(false);

    if (onSave) onSave(); // trigger refresh
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" disabled={!selectedPO}>
          Tambah Hasil Potong
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Hasil Potong</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Ukuran</Label>
            <Input
              value={ukuran}
              onChange={(e) => setUkuran(e.target.value)}
              placeholder="Contoh: M, L, 30x40"
            />
          </div>
          <div>
            <Label>Qty</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Jumlah potongan"
            />
          </div>
          <div>
            <Label>Keterangan</Label>
            <Textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
