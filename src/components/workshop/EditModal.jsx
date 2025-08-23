import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditModal({ isOpen, onClose, selectedObject, onSave }) {
  const [form, setForm] = useState({
    width: 0,
    height: 0,
    color: "#000000",
  });

  useEffect(() => {
    if (selectedObject) {
      setForm({
        width: selectedObject.width || 0,
        height: selectedObject.height || 0,
        color: selectedObject.color || "#000000",
      });
    }
  }, [selectedObject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Objek</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Lebar
            </Label>
            <Input
              id="width"
              name="width"
              type="number"
              value={form.width}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Tinggi
            </Label>
            <Input
              id="height"
              name="height"
              type="number"
              value={form.height}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Warna
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="color"
                name="color"
                type="color"
                value={form.color}
                onChange={handleChange}
                className="w-16"
              />
              <Input
                type="text"
                value={form.color}
                onChange={handleChange}
                name="color"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}