import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { 
  itemBarangService, 
  jenisBarangService, 
  bentukBarangService, 
  gradeBarangService,
  gudangService
} from "@/services/master-data";

// Module-level variable untuk menyimpan mapping dimensi bentuk barang
let bentukBarangDimensiMap = {};

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
        { name: "jenis_barang_id", label: "Jenis Barang", type: "select", optionsService: jenisBarangService, optionLabel: "nama_jenis", required: true },
        { 
          name: "bentuk_barang_id", 
          label: "Bentuk Barang", 
          type: "select", 
          optionsLoader: async () => {
            const response = await bentukBarangService.getAll();
            const options = (response.data || []).map(item => ({
              id: item.id,
              label: item.nama_bentuk ? `${item.nama_bentuk} (${item.dimensi || 'N/A'})` : item.nama || 'Unknown',
              value: item.id?.toString(),
              dimensi: item.dimensi,
              nama: item.nama_bentuk || item.nama
            }));
            // Simpan mapping dimensi di module-level variable untuk akses di showIf
            bentukBarangDimensiMap = {};
            options.forEach(opt => {
              if (opt.id && opt.dimensi) {
                bentukBarangDimensiMap[opt.id] = opt.dimensi;
                bentukBarangDimensiMap[opt.value] = opt.dimensi;
              }
            });
            return options;
          },
          optionLabel: "nama_bentuk", 
          required: true,
          onChangeForm: (form, val) => {
            // Simpan dimensi di form state untuk digunakan oleh hidden
            const dimensi = bentukBarangDimensiMap[val] || null;
            const updatedForm = {
              ...form,
              _bentuk_barang_dimensi: dimensi
            };
            // Set lebar menjadi 0 jika dimensi adalah "1D"
            if (dimensi === "1D") {
              updatedForm.lebar = null;
            }
            return updatedForm;
          }
        },
        { name: "grade_barang_id", label: "Grade Barang", type: "select", optionsService: gradeBarangService, optionLabel: "nama", required: true },
        { name: "panjang", label: "Panjang", type: "number", step: 0.01, required: true },
        { 
          name: "lebar", 
          label: "Lebar", 
          type: "number", 
          step: 0.01, 
          required: true,
          hidden: (form) => {
            // Sembunyikan jika dimensi adalah "1D" (tapi tetap render untuk tidak menggeser kolom)
            return form._bentuk_barang_dimensi === "1D";
          }
        },
        { name: "tebal", label: "Tebal", type: "number", step: 0.01, required: true },
        { name: "quantity", label: "Quantity", type: "number", step: 0.01, required: true },
        { name: "jenis_potongan", label: "Jenis Potongan", type: "select", options: [
          { value: "utuh", label: "Utuh" },
          { value: "potongan", label: "Potongan" }
        ], required: true },
        { name: "gudang_id", label: "Gudang", type: "select", optionsService: gudangService, optionLabel: "nama_gudang", required: true },
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
        // { key: "is_edit", label: "Is Edit", align: "center", width: "8rem", maxWidth: "8rem", format: "boolean" },
        { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "grade_barang.nama", label: "Grade Barang", align: "center", width: "12rem", maxWidth: "12rem" },
      ]}
    />
  );
}
