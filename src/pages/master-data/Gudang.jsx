import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gudangService, rakService } from "@/services/master-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GudangPage() {
  const [rakDialogOpen, setRakDialogOpen] = useState(false);
  const [rakList, setRakList] = useState([]);
  const [rakLoading, setRakLoading] = useState(false);
  const [rakError, setRakError] = useState("");
  const [activeGudang, setActiveGudang] = useState(null);

  const handleViewRak = async (gudang) => {
    setActiveGudang(gudang);
    setRakDialogOpen(true);
    setRakLoading(true);
    setRakError("");
    try {
      const res = await rakService.getAll({ gudang_id: gudang.id, per_page: 1000 });
      let rows = [];
      if (Array.isArray(res?.data?.data)) {
        rows = res.data.data;
      } else if (Array.isArray(res?.data)) {
        rows = res.data;
      } else if (Array.isArray(res)) {
        rows = res;
      }
      setRakList(rows);
    } catch (error) {
      console.error("Error loading rak list:", error);
      setRakError(error.message || "Gagal memuat data rak");
      setRakList([]);
    } finally {
      setRakLoading(false);
    }
  };

  return (
    <>
      <MasterDataLayout
        title="Gudang"
        subtitle="Master Data"
        service={gudangService}
        validate={(form) => {
          const errs = [];
          if (errs.length) return `Field wajib: ${errs.join(", ")}`;
          return null;
        }}
        preprocess={(form) => {
          const t = form.tipe_gudang || "gudang";
          form.tipe_gudang = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
          form.parent_id = "";
          delete form.gudang_id;
          delete form.rak_id;
          return form;
        }}
        fields={[
          { name: "kode", label: "Kode", maxLength: 8, required: true, disabledOnEdit: true },
          { name: "nama_gudang", label: "Nama Gudang", maxLength: 64, required: true },
          { name: "telepon_hp", label: "Telepon/HP", maxLength: 20 }
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", headerAlign: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode", label: "Kode", align: "center", headerAlign: "center", width: "8rem", maxWidth: "8rem" },
          { key: "nama_gudang", label: "Nama Gudang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
          { key: "telepon_hp", label: "Telepon/HP", align: "center", headerAlign: "center", width: "12rem", maxWidth: "12rem" }
        ]}
        customActions={[
          {
            label: "List Rak",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            ),
            onClick: handleViewRak
          }
        ]}
      />
      <Dialog open={rakDialogOpen} onOpenChange={setRakDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeGudang ? `Rak di ${activeGudang.nama_gudang || activeGudang.nama || activeGudang.kode}` : "Rak"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {rakLoading ? (
              <div className="text-sm text-gray-600">Memuat data rak...</div>
            ) : rakError ? (
              <div className="text-sm text-red-600">{rakError}</div>
            ) : rakList.length === 0 ? (
              <div className="text-sm text-gray-600">Belum ada rak untuk gudang ini.</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Kode</th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Nama Rak</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Kapasitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rakList.map((rak) => (
                      <tr key={rak.id} className="odd:bg-white even:bg-gray-50">
                        <td className="border px-3 py-2 text-sm text-gray-700">{rak.kode}</td>
                        <td className="border px-3 py-2 text-sm text-gray-700">{rak.nama_rak}</td>
                        <td className="border px-3 py-2 text-sm text-gray-700 text-right">
                          {rak.kapasitas != null ? rak.kapasitas : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setRakDialogOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
