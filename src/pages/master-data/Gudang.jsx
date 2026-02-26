import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import MasterFormModal from "@/components/MasterFormModal";
import { gudangService, rakService } from "@/services/master-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function GudangPage() {
  const fileInputRef = React.useRef(null);
  const { showAlert, showConfirm, AlertComponent } = useAlert();

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await gudangService.importData(file);
      showAlert("Import Berhasil", result.message, "success");
      window.location.reload();
    } catch (error) {
      showAlert("Import Gagal", error.message || "Terjadi kesalahan saat mengimport data", "error");
    } finally {
      event.target.value = ""; // Reset input
    }
  };

  const [rakDialogOpen, setRakDialogOpen] = useState(false);
  const [rakList, setRakList] = useState([]);
  const [rakLoading, setRakLoading] = useState(false);
  const [rakError, setRakError] = useState("");
  const [activeGudang, setActiveGudang] = useState(null);
  const [selectedRaks, setSelectedRaks] = useState([]);

  // Modal edit rak
  const [rakEditModalOpen, setRakEditModalOpen] = useState(false);
  const [rakEditData, setRakEditData] = useState(null);
  const [rakSaveLoading, setRakSaveLoading] = useState(false);

  const rakFields = [
    { name: "kode", label: "Kode", maxLength: 16, required: true, disabledOnEdit: true },
    { name: "nama_rak", label: "Nama Rak", maxLength: 64, required: true },
    { name: "kapasitas", label: "Kapasitas", type: "number", step: 0.01 }
  ];

  const handleViewRak = async (gudang) => {
    setActiveGudang(gudang);
    setSelectedRaks([]);
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

  const handleEditRak = (rak) => {
    setRakEditData(rak);
    setRakEditModalOpen(true);
  };

  const handleAddRak = () => {
    setRakEditData(null);
    setRakEditModalOpen(true);
  };

  const handleSaveRak = async (formData) => {
    setRakSaveLoading(true);
    try {
      // Pastikan gudang_id tetap ikut sesuai parent
      const payload = { ...formData, gudang_id: activeGudang.id };
      if (rakEditData && rakEditData.id) {
        await rakService.update(rakEditData.id, payload);
        showAlert("Berhasil", "Data rak berhasil diupdate", "success");
      } else {
        await rakService.create(payload);
        showAlert("Berhasil", "Data rak berhasil ditambahkan", "success");
      }
      setRakEditModalOpen(false);
      handleViewRak(activeGudang); // Refresh data setelah simpan
    } catch (error) {
      showAlert("Gagal", error.message || "Terjadi kesalahan saat menyimpan data rak", "error");
    } finally {
      setRakSaveLoading(false);
    }
  };

  const handleDeleteRak = (rak) => {
    showConfirm("Konfirmasi Hapus", "Yakin ingin menghapus rak ini?", async () => {
      try {
        await rakService.softDelete(rak.id);
        showAlert("Berhasil", "Rak berhasil dihapus", "success");
        setSelectedRaks(prev => prev.filter(r => r.id !== rak.id));
        handleViewRak(activeGudang); // Refresh data setelah hapus
      } catch (error) {
        showAlert("Gagal Menghapus", error.message || "Terjadi kesalahan saat menghapus rak.", "error");
      }
    });
  };

  const toggleSelectRak = (rak) => {
    setSelectedRaks(prev => {
      if (prev.find(r => r.id === rak.id)) {
        return prev.filter(r => r.id !== rak.id);
      }
      return [...prev, rak];
    });
  };

  const toggleSelectAllRak = () => {
    if (selectedRaks.length === rakList.length && rakList.length > 0) {
      setSelectedRaks([]);
    } else {
      setSelectedRaks([...rakList]);
    }
  };

  const handlePrintBatchRak = async () => {
    if (selectedRaks.length === 0) return;
    const { openRackQRPDFBatch } = await import("@/lib/pdfUtils");
    const raksWithGudang = selectedRaks.map(r => ({ ...r, gudang: activeGudang }));
    await openRackQRPDFBatch(raksWithGudang);
  };

  const handlePrintSingleRak = async (item) => {
    const { openRackQRPDFPreview } = await import("@/lib/pdfUtils");
    const itemWithGudang = { ...item, gudang: activeGudang };
    await openRackQRPDFPreview(itemWithGudang, activeGudang);
  };

  return (
    <>
      <AlertComponent />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleImport}
      />
      <MasterDataLayout
        title="Gudang"
        subtitle="Master Data"
        service={gudangService}
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await gudangService.downloadTemplate();
              } catch (error) {
                console.error("Download template failed:", error);
              }
            },
            className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          },
          {
            label: "Import Data",
            icon: <Upload className="h-4 w-4" />,
            onClick: () => fileInputRef.current?.click(),
            className: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          }
        ]}
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
        <DialogContent className="sm:max-w-2xl lg:max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {activeGudang ? `Rak di ${activeGudang.nama_gudang || activeGudang.nama || activeGudang.kode}` : "Rak"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedRaks.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrintBatchRak} className="text-blue-600 border-blue-300 hover:bg-blue-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Cetak QR Batch ({selectedRaks.length})
                  </Button>
                )}
              </div>
              <Button onClick={handleAddRak} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Tambah Rak
              </Button>
            </div>
            {rakLoading ? (
              <div className="text-sm text-gray-600 py-4 text-center">Memuat data rak...</div>
            ) : rakError ? (
              <div className="text-sm text-red-600 py-4 text-center">{rakError}</div>
            ) : rakList.length === 0 ? (
              <div className="text-sm text-gray-600 py-8 text-center bg-gray-50 rounded-md border border-dashed">Belum ada rak untuk gudang ini.</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b">
                    <tr>
                      <th className="border px-3 py-2 text-center text-xs font-semibold text-gray-600 w-10">
                        <input
                          type="checkbox"
                          checked={selectedRaks.length === rakList.length && rakList.length > 0}
                          onChange={toggleSelectAllRak}
                          className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                        />
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600 min-w-[100px]">Kode</th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold text-gray-600 min-w-[150px]">Nama Rak</th>
                      <th className="border px-3 py-2 text-right text-xs font-semibold text-gray-600 min-w-[100px]">Kapasitas</th>
                      <th className="border px-3 py-2 text-center text-xs font-semibold text-gray-600 min-w-[200px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rakList.map((rak) => (
                      <tr key={rak.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50/50 transition-colors">
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!selectedRaks.find(r => r.id === rak.id)}
                            onChange={() => toggleSelectRak(rak)}
                            className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
                          />
                        </td>
                        <td className="border px-3 py-2 text-sm text-gray-700 font-medium">{rak.kode}</td>
                        <td className="border px-3 py-2 text-sm text-gray-700">{rak.nama_rak}</td>
                        <td className="border px-3 py-2 text-sm text-gray-700 text-right">
                          {rak.kapasitas != null ? rak.kapasitas : "-"}
                        </td>
                        <td className="border px-3 py-2 text-sm text-center">
                          <div className="flex justify-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintSingleRak(rak)}
                              className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 transition-all duration-200 hover:shadow-md h-7 px-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 4h3v3h-3v-3zM14 14h7v7h-7v-7z" />
                              </svg>
                              QR
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRak(rak)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400 transition-all duration-200 hover:shadow-md h-7 px-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRak(rak)}
                              className="bg-red-500 hover:bg-red-600 text-white border-red-500 transition-all duration-200 hover:shadow-md h-7 px-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="pt-4 border-t flex justify-end shrink-0">
            <Button variant="outline" onClick={() => setRakDialogOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Edit/Add Rak form */}
      <MasterFormModal
        isOpen={rakEditModalOpen}
        onClose={() => {
          setRakEditModalOpen(false);
          setRakEditData(null);
        }}
        onSave={handleSaveRak}
        editData={rakEditData}
        fields={rakFields}
        title={rakEditData ? "Edit Rak" : "Tambah Rak"}
        saveLoading={rakSaveLoading}
      />
    </>
  );
}

