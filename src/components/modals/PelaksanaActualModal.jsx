import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import SearchSelect from "@/components/ui/search-select";

const DEFAULT_ARRAY = [];

const PelaksanaActualModal = ({
  open,
  onOpenChange,
  title = "Pelaksana Planning & Input Actual",
  pelaksanaOptions = DEFAULT_ARRAY,
  planningPelaksana = DEFAULT_ARRAY,
  value = DEFAULT_ARRAY,
  onSave,
  loadingOptions = false,
  readOnly = false,
}) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Jika ada data planning, bangun baris dari planning dan prefill dari actual
    const actualArr = Array.isArray(value) ? value : [];
    const planningArr = Array.isArray(planningPelaksana) ? planningPelaksana : [];
    if (planningArr.length > 0) {
      const byId = new Map(actualArr.map(r => [r.pelaksana_id, r]));
      const computed = planningArr.map(p => {
        const id = p?.pelaksana_info?.id || p?.pelaksana?.id || p?.id || null;
        const nama = p?.pelaksana_info?.nama_pelaksana || p?.pelaksana?.nama || p?.nama || p?.name || "-";
        const prev = byId.get(id) || {};
        return {
          pelaksana_id: prev.pelaksana_id ?? id,
          nama,
          qty: prev.qty ?? 0,
          berat: (prev.berat ?? prev.weight ?? ''),
          catatan: prev.catatan || (p?.catatan || ""),
        };
      });
      setRows(computed);
      return;
    }
    // Fallback: tampilkan dari actual jika planning tidak tersedia
    const computedFromActual = actualArr.map(r => ({
      pelaksana_id: r.pelaksana_id ?? r.pelaksana?.id ?? null,
      nama: r.pelaksana?.nama_pelaksana || r.pelaksana?.nama || r.nama || "-",
      qty: r.qty ?? 0,
      berat: (r.berat ?? r.weight ?? ''),
      catatan: r.catatan || "",
    }));
    setRows(computedFromActual);
  }, [value, planningPelaksana, open]);

  // Tidak ada tambah/hapus baris: actual hanya untuk pelaksana planning

  const updateRow = (idx, field, val) => {
    if (readOnly) return;
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const totalQty = useMemo(() => rows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0), [rows]);

  // Tanpa opsi pelaksana: kolom nama ditampilkan dari planning

  const handleSave = () => {
    if (readOnly) {
      onOpenChange?.(false);
      return;
    }
    const cleaned = rows.map(r => ({
      pelaksana_id: r.pelaksana_id,
      qty: parseFloat(r.qty || 0),
      berat: parseFloat(r.berat || 0),
      catatan: r.catatan || "",
    }));
    onSave?.(cleaned);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Qty & Berat per Pelaksana</div>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Pelaksana</TableHead>
        <TableHead className="text-center">Qty Actual</TableHead>
        <TableHead className="text-center">Berat Actual</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row, idx) => (
        <TableRow key={idx}>
          <TableCell>
            <div className="text-sm">{row.nama || 'Pelaksana'}</div>
          </TableCell>
          <TableCell className="text-center">
            <Input
              type="number"
              value={row.qty ?? 0}
              onChange={(e) => updateRow(idx, "qty", e.target.value)}
              className={`w-24 mx-auto text-center ${readOnly ? 'bg-gray-50' : ''}`}
              min={0}
              disabled={readOnly}
            />
          </TableCell>
          <TableCell className="text-center">
            <Input
              type="number"
              step="0.01"
              value={(row.berat === undefined || row.berat === null) ? '' : row.berat}
              onChange={(e) => updateRow(idx, "berat", e.target.value)}
              className={`w-28 mx-auto text-center ${readOnly ? 'bg-gray-50' : ''}`}
              min={0}
              disabled={readOnly}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

          <div className="text-sm text-gray-600">Total Qty Actual: {totalQty}</div>
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>Tutup</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PelaksanaActualModal;
