import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import { Plus, Trash2 } from "lucide-react";
import { beratJenisService } from "@/services/master-data/beratJenisService";

const PelaksanaModal = ({
  open,
  onOpenChange,
  title = "Kelola Pelaksana",
  pelaksanaOptions = [],
  value = [],
  onSave,
  loadingOptions = false,
  workOrderItem = null, // Item data untuk perhitungan berat
}) => {
  const [rows, setRows] = useState([]);
  const [qtyError, setQtyError] = useState('');
  // Store debounce timeouts for each row
  const debounceTimeouts = useRef({});
  
  // Get work order item qty
  const workOrderItemQty = workOrderItem ? (parseInt(workOrderItem.qty) || 0) : 0;
  
  // Calculate total qty from all rows
  const totalQty = useMemo(() => {
    return rows.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0);
  }, [rows]);

  // Memoize the initial value to prevent unnecessary re-renders
  const initialValue = useMemo(() => {
    return Array.isArray(value) ? value.map(r => ({ ...r })) : [];
  }, [value]);

  // Function to calculate berat for a row
  const calculateBeratForRow = useCallback(async (rowId, qty) => {
    const qtyNum = parseInt(qty) || 0;
    if (!workOrderItem || !qtyNum || qtyNum <= 0) {
      setRows(prev => prev.map(r => 
        r.id === rowId ? { ...r, berat: 0 } : r
      ));
      return;
    }

    try {
      const panjang = parseFloat(workOrderItem.panjang) || 0;
      const lebar = parseFloat(workOrderItem.lebar) || 0;
      const tebal = parseFloat(workOrderItem.tebal) || 0;
      const jenisBarangId = workOrderItem.jenis_barang_id;
      const bentukBarangId = workOrderItem.bentuk_barang_id;
      const gradeBarangId = workOrderItem.grade_barang_id;

      // Check if required fields are available
      if (!jenisBarangId || !bentukBarangId || !gradeBarangId || !panjang || !tebal) {
        setRows(prev => prev.map(r => 
          r.id === rowId ? { ...r, berat: 0 } : r
        ));
        return;
      }

      // Convert mm to cm for API
      const panjangCm = panjang / 10;
      // For 1D shapes (shaft), lebar should be null
      // Check if lebar is 0 or null, or if it's a 1D shape
      const lebarCm = (lebar && lebar > 0) ? (lebar / 10) : null;
      const tebalCm = tebal / 10;

      const requestData = {
        jenis_barang_id: parseInt(jenisBarangId),
        bentuk_barang_id: parseInt(bentukBarangId),
        grade_barang_id: parseInt(gradeBarangId),
        panjang: panjangCm,
        lebar: lebarCm,
        tebal: tebalCm
      };

      const response = await beratJenisService.calculateWeight(requestData);
      
      if (response.success && response.data && response.data.berat_kg) {
        const beratKg = parseFloat(response.data.berat_kg) || 0;
        // Calculate total weight: qty × berat_kg
        const totalWeight = qtyNum * beratKg;
        
        setRows(prev => prev.map(r => 
          r.id === rowId ? { ...r, berat: totalWeight } : r
        ));
      } else {
        setRows(prev => prev.map(r => 
          r.id === rowId ? { ...r, berat: 0 } : r
        ));
      }
    } catch (error) {
      console.error('Error calculating weight:', error);
      setRows(prev => prev.map(r => 
        r.id === rowId ? { ...r, berat: 0 } : r
      ));
    }
  }, [workOrderItem]);

  useEffect(() => {
    if (open) {
      setRows(initialValue);
      setQtyError('');
      // Calculate berat for existing rows when modal opens
      if (workOrderItem && initialValue.length > 0) {
        initialValue.forEach(row => {
          if (row.qty && row.qty > 0) {
            setTimeout(() => {
              calculateBeratForRow(row.id, row.qty);
            }, 100);
          }
        });
      }
    } else {
      // Clean up all debounce timeouts when modal closes
      Object.values(debounceTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      debounceTimeouts.current = {};
      setQtyError('');
    }
  }, [open, initialValue, workOrderItem, calculateBeratForRow]);
  
  // Validate total qty whenever rows change
  useEffect(() => {
    if (workOrderItemQty > 0 && totalQty > workOrderItemQty) {
      setQtyError(`Total qty pelaksana (${totalQty}) tidak boleh melebihi qty order (${workOrderItemQty})`);
    } else {
      setQtyError('');
    }
  }, [totalQty, workOrderItemQty]);

  const addRow = useCallback(() => {
    const newRowId = Date.now();
    const newRow = {
      id: newRowId,
      pelaksana_id: "",
      qty: 1,
      berat: 0,
      catatan: "",
    };
    setRows(prev => [...prev, newRow]);
    // Calculate berat for new row
    if (workOrderItem) {
      setTimeout(() => {
        calculateBeratForRow(newRowId, 1);
      }, 100);
    }
  }, [workOrderItem, calculateBeratForRow]);

  const removeRow = useCallback((rowId) => {
    // Clear debounce timeout when row is removed
    if (debounceTimeouts.current[rowId]) {
      clearTimeout(debounceTimeouts.current[rowId]);
      delete debounceTimeouts.current[rowId];
    }
    setRows(prev => {
      const filtered = prev.filter(r => r.id !== rowId);
      // Re-validate total qty after removal
      const newTotal = filtered.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0);
      if (workOrderItemQty > 0 && newTotal > workOrderItemQty) {
        setQtyError(`Total qty pelaksana (${newTotal}) tidak boleh melebihi qty order (${workOrderItemQty})`);
      } else {
        setQtyError('');
      }
      return filtered;
    });
  }, [workOrderItemQty]);

  const updateRow = useCallback((rowId, field, val) => {
    setRows(prev => {
      const updatedRows = prev.map(r => {
        if (r.id === rowId) {
          const updatedRow = { ...r, [field]: val };
          
          // Validate qty when qty changes
          if (field === "qty" && workOrderItem) {
            const qtyValue = parseInt(val) || 0;
            
            // Calculate total qty with the new value
            const currentTotal = prev.reduce((sum, row) => {
              if (row.id === rowId) {
                return sum + qtyValue;
              }
              return sum + (parseInt(row.qty) || 0);
            }, 0);
            
            // Validate total qty doesn't exceed work order item qty
            if (currentTotal > workOrderItemQty) {
              setQtyError(`Total qty pelaksana (${currentTotal}) tidak boleh melebihi qty order (${workOrderItemQty})`);
            } else {
              setQtyError('');
            }
            
            // Auto-calculate berat when qty changes with debounce
            // Clear existing timeout for this row
            if (debounceTimeouts.current[rowId]) {
              clearTimeout(debounceTimeouts.current[rowId]);
            }
            
            // Set new timeout with 500ms debounce
            debounceTimeouts.current[rowId] = setTimeout(() => {
              calculateBeratForRow(rowId, qtyValue);
              // Clean up timeout reference
              delete debounceTimeouts.current[rowId];
            }, 500);
          }
          
          return updatedRow;
        }
        return r;
      });
      return updatedRows;
    });
  }, [workOrderItem, workOrderItemQty, calculateBeratForRow]);

  const handleSave = useCallback(() => {
    // Basic validation: if any row exists, ensure pelaksana_id filled
    for (const r of rows) {
      if (!r.pelaksana_id) {
        return; // simple guard; parent form will handle alerting if needed
      }
    }
    
    // Validate total qty doesn't exceed work order item qty
    if (workOrderItemQty > 0 && totalQty > workOrderItemQty) {
      setQtyError(`Total qty pelaksana (${totalQty}) tidak boleh melebihi qty order (${workOrderItemQty})`);
      return;
    }
    
    onSave?.(rows);
    onOpenChange(false);
  }, [rows, totalQty, workOrderItemQty, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="h-[85vh] flex flex-col"
        style={{ 
          width: '85vw', 
          maxWidth: '85vw',
          minWidth: '85vw'
        }}
      >
        {/* Header */}
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Total pelaksana: <span className="font-bold text-blue-600">{rows.length}</span></span>
              </div>
              {workOrderItemQty > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Total Qty: <span className={`font-bold ${totalQty > workOrderItemQty ? 'text-red-600' : 'text-gray-700'}`}>{totalQty}</span> / Qty Order: <span className="font-bold text-gray-700">{workOrderItemQty}</span></span>
                </div>
              )}
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
          {qtyError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {qtyError}
            </div>
          )}
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
                    <div className="col-span-5">
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
                        className={`h-8 text-center ${qtyError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>

                    {/* Berat */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Berat
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.00001"
                        value={row.berat ? parseFloat(row.berat).toFixed(5) : '0.00000'}
                        disabled
                        className="h-8 text-center bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Catatan */}
                    <div className="col-span-2">
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
              disabled={!!qtyError}
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


