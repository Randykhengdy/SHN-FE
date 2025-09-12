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
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-visible w-[90vw]">
        <DialogHeader className="pb-6 pt-2">
          <DialogTitle className="text-2xl font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-hidden">
          {/* Header Section */}
          <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Total pelaksana: <span className="text-blue-600 font-semibold">{rows.length}</span>
              </span>
            </div>
            <Button 
              type="button" 
              size="md" 
              onClick={addRow}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-4 py-2"
            >
              <Plus className="w-5 h-5 mr-2" /> 
              Tambah Pelaksana
            </Button>
          </div>

          {/* Table Section */}
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto px-2">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow className="border-b">
                    <TableHead className="text-left font-semibold text-gray-700 py-3 px-4">Pelaksana</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 py-3 px-4 w-24">Qty</TableHead>
                    <TableHead className="text-left font-semibold text-gray-700 py-3 px-4">Catatan</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 py-3 px-4 w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, index) => (
                    <TableRow key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                      <TableCell className="text-left py-3 px-4">
                        <div className="relative w-full">
                          <SearchSelect
                            label=""
                            options={pelaksanaOptions}
                            value={r.pelaksana_id ? r.pelaksana_id.toString() : ""}
                            onValueChange={(val) => updateRow(r.id, "pelaksana_id", parseInt(val))}
                            placeholder="Pilih pelaksana"
                            searchPlaceholder="Cari pelaksana..."
                            loading={loadingOptions}
                            usePortal={true}
                            dropdownMaxHeight={350}
                            className="w-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-left py-3 px-4">
                        <Input
                          type="number"
                          min="1"
                          value={r.qty}
                          onChange={(e) => updateRow(r.id, "qty", parseInt(e.target.value))}
                          className="h-9 w-full text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </TableCell>
                      <TableCell className="text-left py-3 px-4">
                        <Input
                          placeholder="Masukkan catatan..."
                          value={r.catatan}
                          onChange={(e) => updateRow(r.id, "catatan", e.target.value)}
                          className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </TableCell>
                      <TableCell className="text-center py-3 px-4">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => removeRow(r.id)} 
                          className="h-8 w-8 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Plus className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="text-gray-500">
                            <p className="font-medium">Belum ada pelaksana</p>
                            <p className="text-sm">Klik "Tambah Pelaksana" untuk menambahkan</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 text-base"
            >
              Tutup
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium"
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


