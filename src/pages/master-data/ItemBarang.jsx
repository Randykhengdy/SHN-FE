import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { Button } from "@/components/ui/button";
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

  const handleOpenCanvas = (item) => {
    setSelectedItem(item);
    setIsCanvasOpen(true);
  };

  const handleOpenHistory = (item) => {
    setSelectedItem(item);
    setIsHistoryOpen(true);
  };

  const handleDestroyItem = async (item) => {
    if (!window.confirm(`Apakah Anda yakin ingin mengubah status item "${item.nama_item_barang}" menjadi Destroy?`)) {
      return;
    }

    try {
      const response = await request(`/item-barang/${item.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "destroy" })
      });

      if (response.success) {
        // MasterDataLayout akan otomatis me-refresh data jika service.getAll dipanggil lagi
        // Namun kita bisa memicu refresh manual jika MasterDataLayout mendukungnya, 
        // atau biarkan user me-refresh sendiri. 
        // Karena MasterDataLayout biasanya punya internal state untuk refresh.
        window.location.reload(); // Cara cepat untuk refresh data di MasterDataLayout
      }
    } catch (error) {
      console.error("Error updating item status:", error);
    }
  };

  return (
    <>
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

      <MasterDataLayout
        title="Item Barang"
        subtitle="Master Data"
        service={itemBarangService}
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
        customActions={[
          {
            label: "History",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
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
            label: "QR Code",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 4h3v3h-3v-3zM14 14h7v7h-7v-7z" />
              </svg>
            ),
            onClick: async (item) => {
              const { openItemQRPDFPreview } = await import("@/lib/pdfUtils");
              await openItemQRPDFPreview(item);
            }
          },
          {
            label: "Destroy",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            ),
            onClick: (item) => handleDestroyItem(item),
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
          { key: "jenis_potongan", label: "Jenis Potongan", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "gudang.nama_gudang", label: "Gudang", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "rak.nama_rak", label: "Rak", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "status", label: "Status", align: "center", width: "10rem", maxWidth: "10rem" },
          { key: "created_at", label: "Dibuat Pada", align: "center", width: "12rem", maxWidth: "12rem", format: "datetime" },
          // { key: "is_edit", label: "Is Edit", align: "center", width: "8rem", maxWidth: "8rem", format: "boolean" },
          { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "grade_barang.nama", label: "Grade Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        ]}
      />
    </>
  );
}
