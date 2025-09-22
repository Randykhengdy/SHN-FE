import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import { Plus, Trash2 } from "lucide-react";

const PelaksanaModal = ({
  open,
  onOpenChange,
  title = "Kelola Pelaksana",
  pelaksanaOptions = [],
  value = [],
  onSave,
  loadingOptions = false,
}) => {
  const [rows, setRows] = useState([]);

  // Memoize the initial value to prevent unnecessary re-renders
  const initialValue = useMemo(() => {
    return Array.isArray(value) ? value.map(r => ({ ...r })) : [];
  }, [value]);

  useEffect(() => {
    if (open) {
      setRows(initialValue);
    }
  }, [open, initialValue]);

  const addRow = useCallback(() => {
    setRows(prev => ([
      ...prev,
      {
        id: Date.now(),
        pelaksana_id: "",
        qty: 1,
        catatan: "",
      }
    ]));
  }, []);

  const removeRow = useCallback((rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  }, []);

  const updateRow = useCallback((rowId, field, val) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r));
  }, []);

  const handleSave = useCallback(() => {
    // Basic validation: if any row exists, ensure pelaksana_id filled
    for (const r of rows) {
      if (!r.pelaksana_id) {
        return; // simple guard; parent form will handle alerting if needed
      }
    }
    onSave?.(rows);
    onOpenChange(false);
  }, [rows, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Total pelaksana: <span className="font-bold text-blue-600">{rows.length}</span></span>
            </div>
            <Button 
              onClick={addRow}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Pelaksana
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-1">Belum ada pelaksana</h3>
              <p className="text-sm text-center">Klik tombol "Tambah Pelaksana" untuk menambahkan pelaksana</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto h-full">
              {rows.map((row, index) => (
                <div key={row.id} className="bg-white border rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Pelaksana */}
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pelaksana
                      </label>
                      <SearchSelect
                        options={pelaksanaOptions}
                        value={row.pelaksana_id ? row.pelaksana_id.toString() : ""}
                        onValueChange={(val) => updateRow(row.id, "pelaksana_id", parseInt(val))}
                        placeholder="Pilih pelaksana"
                        searchPlaceholder="Cari pelaksana..."
                        loading={loadingOptions}
                        usePortal={false}
                        dropdownMaxHeight={200}
                        className="w-full"
                      />
                    </div>

                    {/* Qty */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, "qty", parseInt(e.target.value) || 1)}
                        className="h-8 text-center"
                      />
                    </div>

                    {/* Catatan */}
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catatan
                      </label>
                      <Input
                        placeholder="Masukkan catatan..."
                        value={row.catatan}
                        onChange={(e) => updateRow(row.id, "catatan", e.target.value)}
                        className="h-8"
                      />
                    </div>

                    {/* Aksi */}
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="h-8 w-8"
                        title="Hapus pelaksana"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
  );
};

export default PelaksanaModal;


