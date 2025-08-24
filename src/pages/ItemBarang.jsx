import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { itemBarangService } from "@/services/itemBarangService";
import { jenisBarangService } from "@/services/jenisBarangService";
import { bentukBarangService } from "@/services/bentukBarangService";
import { gradeBarangService } from "@/services/gradeBarangService";

export default function ItemBarangPage() {
  return (
    <MasterDataLayout
      title="Item Barang"
      subtitle="Master Data"
      service={itemBarangService}
      fields={[
        { name: "kode_barang", label: "Kode Barang", maxLength: 16 },
        { name: "nama_item_barang", label: "Nama Item Barang", maxLength: 64 },
        { name: "jenis_barang_id", label: "Jenis Barang", type: "select", optionsService: jenisBarangService, optionLabel: "nama_jenis" },
        { name: "bentuk_barang_id", label: "Bentuk Barang", type: "select", optionsService: bentukBarangService, optionLabel: "nama_bentuk" },
        { name: "grade_barang_id", label: "Grade Barang", type: "select", optionsService: gradeBarangService, optionLabel: "nama" },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode_barang", label: "Kode Barang", align: "center", width: "10rem", maxWidth: "10rem" },
        { key: "nama_item_barang", label: "Nama Item Barang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "grade_barang.nama", label: "Grade Barang", align: "center", width: "12rem", maxWidth: "12rem" },
      ]}
    />
  );
}
