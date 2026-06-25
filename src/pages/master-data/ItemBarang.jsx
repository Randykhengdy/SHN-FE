import React, { useState, useRef } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ItemBarangCanvasPage from "./ItemBarangCanvasPage";
import ItemBarangHistoryModal from "./ItemBarangHistoryModal";
import {
  itemBarangService,
  jenisBarangService,
  bentukBarangService,
  gradeBarangService,
  gudangService,
  rakService
} from "@/services/master-data";
import { request } from "@/lib/request";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";
import { useAppContext } from "@/context/AppContext";

// Module-level variable untuk menyimpan mapping dimensi bentuk barang
let bentukBarangDimensiMap = {};
// Module-level variable untuk menyimpan mapping tipe barang
let bentukBarangTipeMap = {};
// Module-level cache untuk rak options per gudang
let rakOptionsCache = {};

export default function ItemBarangPage() {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const { user, hasPermission } = useAppContext();

  // Rongsok reason dialog state
  const [rongsokDialogOpen, setRongsokDialogOpen] = useState(false);
  const [rongsokReason, setRongsokReason] = useState("");
  const [rongsokTargetItem, setRongsokTargetItem] = useState(null);
  const [rongsokLoading, setRongsokLoading] = useState(false);
  const [rongsokRefetch, setRongsokRefetch] = useState(null);

  // Custom canDelete logic for ItemBarang based on user attribute or fallback to standard role permission
  const canDelete = (user?.is_can_delete_item_barang == 1) || (hasPermission && hasPermission('ITEM_BARANG', 'Delete')) || (hasPermission && hasPermission('MASTER_DATA', 'Delete'));

  const handleImportClick = (e, fetchData) => {
    fileInputRef.current._fetchData = fetchData;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showAlert("Error", "File harus berformat CSV", "error");
      return;
    }

    setImportLoading(true);
    try {
      const result = await itemBarangService.importData(file);
      const data = result.data;

      let message = result.message || "Import selesai";
      let type = "success";

      if (data?.error_details?.length > 0) {
        message += "\n\nDetail:\n" + data.error_details.join("\n");
        if (data.imported === 0) {
          type = "error";
        } else {
          type = "warning";
        }
      }

      showAlert("Hasil Import", message, type);

      if (fileInputRef.current?._fetchData) {
        fileInputRef.current._fetchData();
      }
    } catch (error) {
      console.error("Import error:", error);
      showAlert("Error", "Gagal import data: " + error.message, "error");
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenCanvas = (item) => {
    setSelectedItem(item);
    setIsCanvasOpen(true);
  };

  const handleOpenHistory = (item) => {
    setSelectedItem(item);
    setIsHistoryOpen(true);
  };

  const handleUpdateStatusItem = (item, status, refetch) => {
    const statusLabel = status.toUpperCase();

    showConfirm(
      "Konfirmasi Status",
      `Apakah Anda yakin ingin mengubah status item "${item.nama_item_barang}" menjadi ${statusLabel}?`,
      async () => {
        try {
          const response = await request(`/item-barang/${item.id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status })
          });

          if (response.success) {
            if (typeof refetch === 'function') {
              refetch();
            } else if (fileInputRef.current?._fetchData) {
              fileInputRef.current._fetchData();
            }
          }
        } catch (error) {
          console.error("Error updating item status:", error);
        }
      }
    );
  };

  // Rongsok with approval flow
  const handleRongsokRequest = (item, refetch) => {
    setRongsokTargetItem(item);
    setRongsokReason("");
    setRongsokRefetch(() => refetch);
    setRongsokDialogOpen(true);
  };

  const handleRongsokSubmit = async () => {
    if (!rongsokTargetItem) return;
    setRongsokLoading(true);
    try {
      const response = await itemBarangService.requestRongsok(rongsokTargetItem.id, rongsokReason);
      console.log("Rongsok response:", response);
      setRongsokDialogOpen(false);
      const itemName = rongsokTargetItem.nama_item_barang;
      setRongsokTargetItem(null);
      setRongsokReason("");

      // Backend returns needs_approval: true when sisa berat >= 10%
      const needsApproval = response?.data?.needs_approval;
      const persentase = response?.data?.persentase_sisa ?? response?.data?.rongsok_request?.persentase_sisa;

      if (needsApproval) {
        const pctText = persentase != null ? ` (sisa berat ${Number(persentase).toFixed(1)}%)` : "";
        showAlert(
          "Request Rongsok Diajukan",
          `Request rongsok untuk item "${itemName}" berhasil diajukan${pctText}. Menunggu persetujuan admin di menu Approval.`,
          "warning"
        );
        if (typeof rongsokRefetch === 'function') rongsokRefetch();
        else if (fileInputRef.current?._fetchData) fileInputRef.current._fetchData();
      } else {
        showAlert(
          "Sukses",
          response.message || `Item "${itemName}" berhasil di-rongsok.`,
          "success",
          () => {
            if (typeof rongsokRefetch === 'function') rongsokRefetch();
            else if (fileInputRef.current?._fetchData) fileInputRef.current._fetchData();
          }
        );
      }
    } catch (error) {
      console.error("Error requesting rongsok:", error);
      showAlert("Error", error.message || "Gagal melakukan request rongsok.", "error");
    } finally {
      setRongsokLoading(false);
    }
  };

  return (
    <>
      <AlertComponent />
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {isCanvasOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] bg-white w-screen h-screen">
          <ItemBarangCanvasPage
            item={selectedItem}
            onClose={() => {
              setIsCanvasOpen(false);
              setSelectedItem(null);
            }}
          />
        </div>
      )}

      {isHistoryOpen && selectedItem && (
        <ItemBarangHistoryModal
          onClose={() => {
            setIsHistoryOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}

      {/* Rongsok Reason Dialog */}
      <Dialog open={rongsokDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRongsokDialogOpen(false);
          setRongsokTargetItem(null);
          setRongsokReason("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
              Request Rongsok
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {rongsokTargetItem && (
              <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
                <div><span className="font-medium text-gray-600">Kode:</span> {rongsokTargetItem.kode_barang}</div>
                <div><span className="font-medium text-gray-600">Nama:</span> {rongsokTargetItem.nama_item_barang}</div>
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="rongsok-reason" className="text-sm font-medium">
                Alasan Rongsok <span className="text-gray-500">(opsional)</span>
              </label>
              <textarea
                id="rongsok-reason"
                placeholder="Masukkan alasan rongsok..."
                value={rongsokReason}
                onChange={(e) => setRongsokReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                maxLength={500}
              />
            </div>
            <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-2">
              ⚠️ Jika sisa berat item masih ≥ 10%, request rongsok akan masuk ke antrian approval admin.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRongsokDialogOpen(false);
                setRongsokTargetItem(null);
                setRongsokReason("");
              }}
              disabled={rongsokLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleRongsokSubmit}
              disabled={rongsokLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rongsokLoading ? "Memproses..." : "Request Rongsok"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MasterDataLayout
        title="Item Barang"
        subtitle="Master Data"
        service={itemBarangService}
        canDelete={canDelete}
        customHeaderContent={
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDimensions"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showDimensions" className="text-sm font-medium text-gray-700 cursor-pointer">
              Tampilkan dimensi
            </label>
          </div>
        }
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await itemBarangService.downloadTemplate();
              } catch (error) {
                console.error("Download template failed:", error);
                showAlert("Gagal", "Gagal mendownload template: " + error.message, "error");
              }
            },
            className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          },
          {
            label: importLoading ? "Importing..." : "Import Data",
            onClick: handleImportClick,
            disabled: importLoading,
            icon: <Upload size={16} />,
            className: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          }
        ]}
        customActions={[
          {
            label: "History",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
            ),
            onClick: (item) => handleOpenHistory(item),
            className: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
          },
          {
            label: "Edit Canvas",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
            ),
            onClick: (item) => handleOpenCanvas(item),
            visible: (item) => item.jenis_potongan !== "utuh",
            className: "bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500"
          },
          {
            label: (item) => item.is_qrcode_printed ? "QR Printed" : "QR Code",
            icon: (item) => item.is_qrcode_printed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 4h3v3h-3v-3zM14 14h7v7h-7v-7z" />
              </svg>
            ),
            className: (item) => item.is_qrcode_printed
              ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
              : "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
            onClick: async (item, refetch) => {
              const { openItemQRPDFPreview } = await import("@/lib/pdfUtils");

              try {
                // Update status in background (don't await PDF to update UI)
                await itemBarangService.updateQrCodeStatus(item.id, true);

                // Open PDF
                await openItemQRPDFPreview(item);

                // Refresh list if refetch is available
                if (typeof refetch === "function") {
                  refetch();
                }
              } catch (error) {
                console.error("Error updating QR status:", error);
                // Still try to open PDF if status update fails
                await openItemQRPDFPreview(item);
              }
            }
          },
          {
            label: "Habis",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package-x"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" /><path d="m7.5 4.27 9 5.15" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /><path d="m17 13 5 5m-5 0 5-5" /></svg>
            ),
            onClick: (item, refetch) => handleUpdateStatusItem(item, "habis", refetch),
            visible: () => canDelete,
            className: "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
          },
          {
            label: "Rongsok",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
            ),
            onClick: (item, refetch) => handleRongsokRequest(item, refetch),
            className: "bg-red-500 hover:bg-red-600 text-white border-red-500"
          }
        ]}
        fields={[
          {
            name: "jenis_barang_id",
            label: "Jenis Barang",
            type: "select",
            required: true,
            optionLabel: "label",
            optionsLoader: async () => {
              const res = await jenisBarangService.getAll();
              const list = res?.data || [];
              return list.map(it => ({
                id: it.id,
                value: String(it.id),
                label: it.nama_jenis || it.nama || it.kode || String(it.id)
              }));
            }
          },
          {
            name: "bentuk_barang_id",
            label: "Bentuk Barang",
            type: "select",
            required: true,
            optionLabel: "label",
            optionsLoader: async () => {
              const res = await bentukBarangService.getAll();
              const options = (res?.data || []).map(item => ({
                id: item.id,
                value: String(item.id),
                label: (item.nama_bentuk || item.nama || 'Unknown') + ` (${item.dimensi || 'N/A'})`,
                dimensi: item.dimensi,
                tipe_barang: item.tipe_barang
              }));

              // Build maps
              bentukBarangDimensiMap = {};
              bentukBarangTipeMap = {};
              options.forEach(opt => {
                if (opt.value) {
                  bentukBarangDimensiMap[opt.value] = opt.dimensi;
                  bentukBarangTipeMap[opt.value] = opt.tipe_barang;
                }
              });

              return options;
            },
            onChangeForm: (form, val) => {
              const dimensi = bentukBarangDimensiMap[val] || null;
              const tipeBarang = bentukBarangTipeMap[val] || null;

              const updatedForm = {
                ...form,
                _bentuk_barang_dimensi: dimensi,
                _tipe_barang: tipeBarang
              };

              if (dimensi === "1D") {
                updatedForm.lebar = null;
              }

              return updatedForm;
            }
          },
          {
            name: "grade_barang_id",
            label: "Grade Barang",
            type: "select",
            required: true,
            optionLabel: "label",
            optionsLoader: async () => {
              const res = await gradeBarangService.getAll();
              const list = res?.data || [];
              return list.map(it => ({
                id: it.id,
                value: String(it.id),
                label: it.nama || it.kode || String(it.id)
              }));
            }
          },
          // Dynamic dimension fields based on tipe_barang
          {
            name: "diameter_luar",
            label: "Diameter Luar (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.diameter_luar === true,
            hidden: (form) => form._tipe_barang?.diameter_luar !== true
          },
          {
            name: "diameter_dalam",
            label: "Diameter Dalam (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.diameter_dalam === true,
            hidden: (form) => form._tipe_barang?.diameter_dalam !== true
          },
          {
            name: "diameter",
            label: "Diameter (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.diameter === true,
            hidden: (form) => form._tipe_barang?.diameter !== true
          },
          {
            name: "sisi1",
            label: "Sisi 1 (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.sisi1 === true,
            hidden: (form) => form._tipe_barang?.sisi1 !== true
          },
          {
            name: "sisi2",
            label: "Sisi 2 (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.sisi2 === true,
            hidden: (form) => form._tipe_barang?.sisi2 !== true
          },
          {
            name: "tebal",
            label: "Tebal (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.tebal === true,
            hidden: (form) => form._tipe_barang?.tebal !== true
          },
          {
            name: "lebar",
            label: "Lebar (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.lebar === true,
            hidden: (form) => form._tipe_barang?.lebar !== true
          },
          {
            name: "panjang",
            label: "Panjang (mm)",
            type: "number",
            step: 0.01,
            required: (form) => form._tipe_barang?.panjang === true,
            hidden: (form) => form._tipe_barang?.panjang !== true
          },
          { name: "quantity", label: "Quantity", type: "number", step: 0.01, required: true },
          { name: "sisa_luas", label: "Sisa Luas", type: "number", step: 0.01 },
          { name: "berat", label: "Berat (kg)", type: "number", step: 0.01 },
          { name: "saldo_berat", label: "Saldo Berat (kg)", type: "number", step: 0.01 },
          {
            name: "jenis_potongan",
            label: "Jenis Potongan",
            type: "select",
            required: true,
            optionLabel: "label",
            optionsLoader: async () => [
              { id: "utuh", value: "utuh", label: "Utuh" },
              { id: "potongan", value: "potongan", label: "Potongan" }
            ]
          },
          {
            name: "gudang_id",
            label: "Gudang",
            type: "select",
            required: true,
            optionLabel: "label",
            optionsLoader: async () => {
              const res = await gudangService.getAll();
              const list = res?.data || [];
              return list.map(it => ({
                id: it.id,
                value: String(it.id),
                label: it.nama_gudang || it.nama || String(it.id)
              }));
            },
            onChangeForm: (form, val) => {
              // Reset rak when gudang changes and pre-fetch rak options
              if (val && !rakOptionsCache[val]) {
                // Fetch and cache rak options for this gudang
                const params = { gudang_id: val };
                rakService.getAll(params)
                  .then(res => {
                    const rakList = res?.data || [];
                    rakOptionsCache[val] = rakList.map(it => ({
                      value: String(it.id),
                      label: `${it.kode_rak || ''} - ${it.nama_rak || it.nama || String(it.id)}`
                    }));
                  })
                  .catch(error => {
                    console.error('Error fetching rak options:', error);
                    rakOptionsCache[val] = [];
                  });
              }
              return { ...form, id_rak: null };
            }
          },
          {
            name: "id_rak",
            label: "Rak (Opsional)",
            type: "asyncSelect",
            fetchOptions: async (q, page, form) => {
              const gudangId = form?.gudang_id;

              // If no warehouse selected, return empty
              if (!gudangId) {
                return [];
              }

              // Check if we have cached options
              if (!rakOptionsCache[gudangId]) {
                // Fetch from API
                try {
                  const params = { gudang_id: gudangId };
                  const res = await rakService.getAll(params);
                  const rakList = res?.data || [];
                  rakOptionsCache[gudangId] = rakList.map(it => ({
                    value: String(it.id),
                    label: `${it.kode_rak || ''} - ${it.nama_rak || it.nama || String(it.id)}`
                  }));
                } catch (error) {
                  console.error('Error fetching rak options:', error);
                  rakOptionsCache[gudangId] = [];
                }
              }

              const options = rakOptionsCache[gudangId] || [];

              // Filter by search query if provided
              if (q && q.trim()) {
                const searchTerm = q.toLowerCase();
                return options.filter(opt =>
                  opt.label.toLowerCase().includes(searchTerm) ||
                  opt.value.includes(searchTerm)
                );
              }

              return options;
            },
            displayKey: "label",
            valueKey: "value",
            required: false,
            disabled: (form) => !form?.gudang_id,
            helperText: (form) => !form?.gudang_id ? "Pilih gudang terlebih dahulu" : "Pilih rak untuk item ini"
          }
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode_barang", label: "Kode Barang", align: "center", width: "10rem", maxWidth: "10rem" },
          { key: "nama_item_barang", label: "Nama Item Barang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
          { key: "item_barang_group.nama_group_barang", label: "Group Barang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
          // Dimension columns - conditionally shown
          ...(showDimensions ? [
            { key: "diameter_luar", label: "DL", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "diameter_dalam", label: "DD", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "diameter", label: "D", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "sisi1", label: "S1", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "sisi2", label: "S2", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "tebal", label: "T", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "lebar", label: "L", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
            { key: "panjang", label: "P", align: "center", width: "6rem", maxWidth: "6rem", format: "number" },
          ] : []),
          { key: "quantity", label: "Qty", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
          { key: "sisa_luas", label: "Sisa Luas", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
          { key: "berat", label: "Berat (kg)", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
          { key: "saldo_berat", label: "Saldo Berat (kg)", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
          {
            key: "persentase_sisa_berat",
            label: "% Sisa",
            align: "center",
            width: "8rem",
            maxWidth: "8rem",
            render: (val) => {
              if (val == null) return <span className="text-gray-400 text-xs">-</span>;
              const pct = Number(val);
              const color = pct < 10
                ? "bg-red-100 text-red-700"
                : pct < 20
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700";
              return (
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
                  {pct.toFixed(1)}%
                </span>
              );
            }
          },
          { key: "jenis_potongan", label: "Jenis Potongan", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "gudang.nama_gudang", label: "Gudang", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "rak.nama_rak", label: "Rak", align: "center", width: "12rem", maxWidth: "12rem" },
          {
            key: "status",
            label: "Status",
            align: "center",
            width: "10rem",
            maxWidth: "10rem",
            render: (val) => {
              if (!val) return "-";
              const formatted = val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

              let badgeClass = "bg-blue-100 text-blue-800"; // default
              if (val === 'active') badgeClass = "bg-green-100 text-green-800";
              else if (val === 'request_rongsok') badgeClass = "bg-orange-100 text-orange-800";
              else if (val === 'rongsok') badgeClass = "bg-red-100 text-red-800";
              else if (val === 'habis') badgeClass = "bg-gray-100 text-gray-800";

              return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${badgeClass}`}>
                  {formatted}
                </span>
              );
            }
          },
          { key: "created_at", label: "Dibuat Pada", align: "center", width: "12rem", maxWidth: "12rem", format: "datetime" },
          {
            key: "habis_at",
            label: "Terhitung Habis Pada",
            align: "center",
            width: "12rem",
            maxWidth: "12rem",
            render: (val) => {
              if (!val) return "-";
              const date = new Date(val);
              if (isNaN(date.getTime())) return "-";
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
            }
          },
          // { key: "is_edit", label: "Is Edit", align: "center", width: "8rem", maxWidth: "8rem", format: "boolean" },
          { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "grade_barang.nama", label: "Grade Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        ]}
      />
    </>
  );
}
