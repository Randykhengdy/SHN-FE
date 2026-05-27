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
import { useAlert } from "@/hooks/useAlert";

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
  qtyPlanning = 0,
}) => {
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const [rows, setRows] = useState([]);
  const [containerRef, setContainerRef] = useState(null);

  useEffect(() => {
    // Jika ada data planning, bangun baris dari planning dan prefill dari actual
    const actualArr = Array.isArray(value) ? value : [];
    const planningArr = Array.isArray(planningPelaksana) ? planningPelaksana : [];
    if (planningArr.length > 0) {
      // Mapping berdasarkan index baris, bukan ID pelaksana
      // Ini memastikan jika user mengubah pelaksana di baris ke-N, perubahannya tetap tersimpan di baris ke-N
      const computed = planningArr.map((p, idx) => {
        const pId = p?.pelaksana_info?.id || p?.pelaksana?.id || p?.id || null;
        const pNama = p?.pelaksana_info?.nama_pelaksana || p?.pelaksana?.nama || p?.nama || p?.name || "-";

        // Ambil data actual yang sesuai index-nya (jika ada)
        const actualRow = actualArr[idx];

        // Tentukan ID dan Nama final
        // Prioritaskan data dari actualRow jika ada (karena itu hasil edit user)
        // Jika tidak ada actualRow, gunakan default dari planning
        const finalId = actualRow?.pelaksana_id ?? pId;
        const finalNama = actualRow?.pelaksana?.nama_pelaksana ?? actualRow?.nama ?? pNama;

        return {
          pelaksana_id: finalId,
          nama: finalNama,
          planning_nama: pNama, // Nama asli dari planning (tidak berubah)
          planning_berat: p?.weight ?? p?.berat ?? 0, // Berat dari planning
          qty: actualRow?.qty ?? 0,
          berat: (actualRow?.berat ?? actualRow?.weight ?? ''),
          catatan: actualRow?.catatan ?? (p?.catatan || ""),
        };
      });
      setRows(computed);
      return;
    }
    // Fallback: tampilkan dari actual jika planning tidak tersedia
    const computedFromActual = actualArr.map(r => ({
      pelaksana_id: r.pelaksana_id ?? r.pelaksana?.id ?? null,
      nama: r.pelaksana?.nama_pelaksana || r.pelaksana?.nama || r.nama || "-",
      planning_nama: "-", // Tidak ada planning
      planning_berat: 0,
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

  const qtyPlanningNum = useMemo(() => parseFloat(qtyPlanning) || 0, [qtyPlanning]);
  const isOverLimit = useMemo(() => qtyPlanningNum > 0 && totalQty > qtyPlanningNum, [totalQty, qtyPlanningNum]);

  // Tanpa opsi pelaksana: kolom nama ditampilkan dari planning

  const handleSave = () => {
    if (readOnly) {
      onOpenChange?.(false);
      return;
    }

    // Validasi: Qty dan Berat harus diisi (> 0) untuk setiap baris
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const qty = parseFloat(r.qty || 0);
      const berat = parseFloat(r.berat || 0);

      if (qty <= 0 || berat <= 0) {
        showAlert('Validasi Gagal', `Baris ke-${i + 1} (${r.nama}): Qty dan Berat harus lebih dari 0`, 'error');
        return;
      }
    }

    // Validasi: Total Qty Actual tidak boleh lebih dari Planning
    if (isOverLimit) {
      showAlert('Validasi Gagal', `Total Qty Actual (${totalQty}) tidak boleh melebihi Qty Planning (${qtyPlanningNum})`, 'error');
      return;
    }

    // Check for 10% weight difference
    const isSignificantDiff = rows.some(r => {
      const parseNum = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(String(val).replace(',', '.')) || 0;
      };

      const pBerat = parseNum(r.planning_berat);
      const aBerat = parseNum(r.berat);

      // Use a small epsilon to avoid strict floating point issues
      // and ensure it triggers if it's even slightly over 110%
      return aBerat > (pBerat * 1.10001);
    });

    const completeSave = () => {
      const cleaned = rows.map(r => ({
        pelaksana_id: r.pelaksana_id,
        pelaksana: r.nama,
        qty: parseFloat(r.qty || 0),
        berat: parseFloat(r.berat || 0),
        catatan: r.catatan || "",
      }));
      onSave?.(cleaned);
      onOpenChange?.(false);
    };

    if (isSignificantDiff) {
      showConfirm(
        'Konfirmasi Selisih Berat',
        'Selisih berat planning dan actual lebih dari 10%, apakah lanjut?',
        completeSave
      );
    } else {
      completeSave();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-7xl" onInteractOutside={(e) => e.preventDefault()}>
          <div id="pelaksana-modal-container" ref={setContainerRef} className="relative w-full h-full">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium">Qty & Berat per Pelaksana</div>
              <div className="w-full relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!readOnly && <TableHead className="w-[25%] text-left">Pelaksana (Planning)</TableHead>}
                      <TableHead className={`${readOnly ? 'w-[30%]' : 'w-[25%]'} text-left`}>
                        {readOnly ? 'Pelaksana' : 'Pelaksana (Actual)'}
                      </TableHead>
                      <TableHead className="text-center w-[15%]">Qty Actual</TableHead>
                      <TableHead className="text-center w-[15%]">Berat Planning</TableHead>
                      <TableHead className="text-center w-[20%]">Berat Actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {!readOnly && (
                          <TableCell className="text-left">
                            <div className="text-sm text-gray-600">{row.planning_nama || '-'}</div>
                          </TableCell>
                        )}
                        <TableCell className="text-left">
                          {readOnly ? (
                            <div className="text-sm font-medium text-gray-900 px-3 py-2 border rounded-md bg-gray-50">
                              {row.nama || '-'}
                            </div>
                          ) : (
                            <SearchSelect
                              options={pelaksanaOptions}
                              value={row.pelaksana_id ? String(row.pelaksana_id) : ""}
                              onValueChange={(val) => {
                                const selectedId = parseInt(val);
                                const selectedOption = pelaksanaOptions.find(opt => String(opt.value) === String(selectedId));
                                setRows(prev => prev.map((r, i) => {
                                  if (i === idx) {
                                    return {
                                      ...r,
                                      pelaksana_id: selectedId,
                                      nama: selectedOption ? selectedOption.label : r.nama
                                    };
                                  }
                                  return r;
                                }));
                              }}
                              placeholder={row.nama || "Pilih pelaksana"}
                              searchPlaceholder="Cari pelaksana..."
                              loading={loadingOptions}
                              usePortal={true}
                              portalContainer={containerRef}
                              dropdownMaxHeight={200}
                              className="w-full"
                              disabled={readOnly}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={row.qty ?? 0}
                            onChange={(e) => updateRow(idx, "qty", e.target.value)}
                            className={`w-full max-w-[120px] mx-auto text-center ${readOnly ? 'bg-gray-50' : ''}`}
                            min={0}
                            disabled={readOnly}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm font-medium text-gray-900 px-3 py-2 border rounded-md bg-gray-50 w-full max-w-[120px] mx-auto">
                            {row.planning_berat || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={(row.berat === undefined || row.berat === null) ? '' : row.berat}
                            onChange={(e) => updateRow(idx, "berat", e.target.value)}
                            className={`w-full max-w-[150px] mx-auto text-center ${readOnly ? 'bg-gray-50' : ''}`}
                            min={0}
                            disabled={readOnly}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-gray-600">
                Total Qty Actual: <span className={isOverLimit ? "text-red-600 font-bold" : "font-medium"}>{totalQty}</span>
                {qtyPlanningNum > 0 && <span> / {qtyPlanningNum} (Planning)</span>}
              </div>
            </div>

            <DialogFooter>
              {readOnly ? (
                <Button variant="outline" onClick={() => onOpenChange?.(false)}>Tutup</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => onOpenChange?.(false)}>Batal</Button>
                  <Button
                    onClick={handleSave}
                    disabled={isOverLimit}
                  >
                    Simpan
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <AlertComponent />
    </>
  );
};

export default PelaksanaActualModal;
