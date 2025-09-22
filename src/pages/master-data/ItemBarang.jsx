import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { 
  itemBarangService, 
  jenisBarangService, 
  bentukBarangService, 
  gradeBarangService 
} from "@/services/master-data";

export default function ItemBarangPage() {
  return (
    <MasterDataLayout
      title="Item Barang"
      subtitle="Master Data"
      service={itemBarangService}
      fields={[
        { name: "kode_barang", label: "Kode Barang", maxLength: 16, required: true },
        { name: "nama_item_barang", label: "Nama Item Barang", maxLength: 64, required: true, colSpan: 2 },
        { name: "sisa_luas", label: "Sisa Luas", type: "number", step: 0.01, required: true },
        { name: "panjang", label: "Panjang", type: "number", step: 0.01, required: true },
        { name: "lebar", label: "Lebar", type: "number", step: 0.01, required: true },
        { name: "tebal", label: "Tebal", type: "number", step: 0.01, required: true },
        { name: "quantity", label: "Quantity", type: "number", step: 0.01, required: true },
        { name: "quantity_tebal_sama", label: "Quantity Tebal Sama", type: "number", step: 0.01 },
        { name: "jenis_potongan", label: "Jenis Potongan", maxLength: 50 },
        { name: "is_edit", label: "Is Edit", type: "checkbox" },
        { name: "is_edit_by", label: "Is Edit By", maxLength: 100, hideOnEdit: true },
        { name: "jenis_barang_id", label: "Jenis Barang", type: "select", optionsService: jenisBarangService, optionLabel: "nama_jenis_barang", required: true },
        { name: "bentuk_barang_id", label: "Bentuk Barang", type: "select", optionsService: bentukBarangService, optionLabel: "nama_bentuk_barang", required: true },
        { name: "grade_barang_id", label: "Grade Barang", type: "select", optionsService: gradeBarangService, optionLabel: "nama", required: true },
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
        { key: "is_edit", label: "Is Edit", align: "center", width: "8rem", maxWidth: "8rem", format: "boolean" },
        { key: "jenis_barang.nama_jenis_barang", label: "Jenis Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "bentuk_barang.nama_bentuk_barang", label: "Bentuk Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "grade_barang.nama", label: "Grade Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "panjang", label: "Panjang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "lebar", label: "Lebar", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "tebal", label: "Tebal", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "sisa_luas", label: "Panjang/Luas", align: "center", width: "12rem", maxWidth: "12rem" },
      ]}
    />
  );
}
