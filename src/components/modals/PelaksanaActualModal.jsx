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

const PelaksanaActualModal = ({
  open,
  onOpenChange,
  title = "Pelaksana Planning & Input Actual",
  pelaksanaOptions = [],
  planningPelaksana = [],
  value = [],
  onSave,
  loadingOptions = false,
  readOnly = false,
}) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Bangun baris dari pelaksana planning; prefill dari value actual jika ada
    const byId = new Map((Array.isArray(value) ? value : []).map(r => [r.pelaksana_id, r]));
    const computed = (Array.isArray(planningPelaksana) ? planningPelaksana : []).map(p => {
      const id = p?.pelaksana_info?.id || p?.pelaksana?.id || p?.id || null;
      const nama = p?.pelaksana_info?.nama_pelaksana || p?.pelaksana?.nama || p?.nama || p?.name || "-";
      const prev = byId.get(id) || {};
      return {
        pelaksana_id: prev.pelaksana_id ?? id,
        nama,
        qty: prev.qty ?? 0,
        berat: prev.berat ?? prev.weight ?? 0,
        catatan: prev.catatan || (p?.catatan || ""),
      };
    });
    setRows(computed);
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
          {/* Planning summary */}
          <Card>
            <CardContent className="py-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Pelaksana (Planning)</div>
              {Array.isArray(planningPelaksana) && planningPelaksana.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-center">Berat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planningPelaksana.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{p?.pelaksana_info?.nama_pelaksana || "N/A"}</TableCell>
                        <TableCell className="text-center">{p?.qty ?? 0}</TableCell>
                        <TableCell className="text-center">{p?.weight ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-xs text-gray-500">Tidak ada pelaksana di planning untuk item ini.</div>
              )}
            </CardContent>
          </Card>

  {/* Actual editor: qty & berat editable, pelaksana mengikuti planning */}
  <div className="text-sm font-medium">
    {readOnly ? 'Qty & Berat per Pelaksana (tampilan saja)' : 'Input Qty & Berat per Pelaksana (mengikuti WO Planning)'}
  </div>
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
              value={row.berat ?? 0}
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