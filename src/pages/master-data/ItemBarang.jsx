import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import {
  itemBarangService,
  jenisBarangService,
  bentukBarangService,
  gradeBarangService,
  gudangService,
  rakService
} from "@/services/master-data";

// Module-level variable untuk menyimpan mapping dimensi bentuk barang
let bentukBarangDimensiMap = {};
// Module-level cache untuk rak options per gudang
let rakOptionsCache = {};

export default function ItemBarangPage() {
  return (
    <MasterDataLayout
      title="Item Barang"
      subtitle="Master Data"
      service={itemBarangService}
      customActions={[
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
        }
      ]}
      fields={[
        {
          name: "jenis_barang_id",
          label: "Jenis Barang",
          type: "asyncSelect",
          fetchOptions: async (q, page) => {
            const res = await jenisBarangService.getPaginated(page, 50, q || "", "nama_jenis", "asc");
            const list = res?.data || [];
            return list.map(it => ({ value: String(it.id), label: it.nama_jenis || it.nama || it.kode || String(it.id) }));
          },
          displayKey: "label",
          valueKey: "value",
          required: true
        },
        {
          name: "bentuk_barang_id",
          label: "Bentuk Barang",
          type: "asyncSelect",
          fetchOptions: async (q, page) => {
            const res = await bentukBarangService.getPaginated(page, 50, q || "", "nama_bentuk", "asc");
            const options = (res.data || []).map(item => ({
              value: String(item.id),
              label: (item.nama_bentuk || item.nama || 'Unknown') + ` (${item.dimensi || 'N/A'})`,
              dimensi: item.dimensi
            }));
            bentukBarangDimensiMap = {};
            options.forEach(opt => { if (opt.value && opt.dimensi) bentukBarangDimensiMap[opt.value] = opt.dimensi; });
            return options;
          },
          displayKey: "label",
          valueKey: "value",
          required: true,
          onChangeForm: (form, val) => {
            const dimensi = bentukBarangDimensiMap[val] || null;
            const updatedForm = { ...form, _bentuk_barang_dimensi: dimensi };
            if (dimensi === "1D") { updatedForm.lebar = null; }
            return updatedForm;
          },
          prefetchById: async (id) => bentukBarangService.getById(id)
        },
        {
          name: "grade_barang_id",
          label: "Grade Barang",
          type: "asyncSelect",
          fetchOptions: async (q, page) => {
            const res = await gradeBarangService.getPaginated(page, 50, q || "", "nama", "asc");
            const list = res?.data || [];
            return list.map(it => ({ value: String(it.id), label: it.nama || it.kode || String(it.id) }));
          },
          displayKey: "label",
          valueKey: "value",
          required: true
        },
        { name: "panjang", label: "Panjang (mm)", type: "number", step: 0.01, required: true },
        {
          name: "lebar",
          label: "Lebar (mm)",
          type: "number",
          step: 0.01,
          required: (form) => form._bentuk_barang_dimensi === "2D",
          hidden: (form) => {
            // Sembunyikan jika dimensi adalah "1D" (tapi tetap render untuk tidak menggeser kolom)
            return form._bentuk_barang_dimensi === "1D";
          }
        },
        { name: "tebal", label: "Tebal/Diameter/dll (mm)", type: "number", step: 0.01, required: true },
        { name: "quantity", label: "Quantity", type: "number", step: 0.01, required: true },
        {
          name: "jenis_potongan",
          label: "Jenis Potongan",
          type: "asyncSelect",
          fetchOptions: async (q) => {
            const base = [
              { value: "utuh", label: "Utuh" },
              { value: "potongan", label: "Potongan" }
            ];
            const term = String(q || "").toLowerCase();
            return term ? base.filter(x => x.label.toLowerCase().includes(term) || x.value.includes(term)) : base;
          },
          displayKey: "label",
          valueKey: "value",
          required: true
        },
        {
          name: "gudang_id",
          label: "Gudang",
          type: "asyncSelect",
          fetchOptions: async (q, page) => {
            const res = await gudangService.getPaginated(page, 50, q || "", "nama_gudang", "asc");
            const list = res?.data || [];
            return list.map(it => ({ value: String(it.id), label: it.nama_gudang || it.nama || String(it.id) }));
          },
          displayKey: "label",
          valueKey: "value",
          required: true,
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
        },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode_barang", label: "Kode Barang", align: "center", width: "10rem", maxWidth: "10rem" },
        { key: "nama_item_barang", label: "Nama Item Barang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "panjang", label: "Panjang", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
        { key: "lebar", label: "Lebar", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
        { key: "tebal", label: "Tebal", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
        { key: "quantity", label: "Qty", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
        { key: "sisa_luas", label: "Sisa Luas", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
        { key: "jenis_potongan", label: "Jenis Potongan", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "gudang.nama_gudang", label: "Gudang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "rak.nama_rak", label: "Rak", align: "center", width: "12rem", maxWidth: "12rem" },
        // { key: "is_edit", label: "Is Edit", align: "center", width: "8rem", maxWidth: "8rem", format: "boolean" },
        { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "grade_barang.nama", label: "Grade Barang", align: "center", width: "12rem", maxWidth: "12rem" },
      ]}
    />
  );
}
