import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { bentukBarangService } from "@/services/master-data";

export default function BentukBarangPage() {
  return (
    <MasterDataLayout
      title="Bentuk Barang"
      subtitle="Master Data"
      service={bentukBarangService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8 },
        { name: "nama_bentuk", label: "Nama Bentuk", maxLength: 32 },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_bentuk", label: "Nama Bentuk", align: "left", minWidth: "15rem", maxWidth: "25rem" },
      ]}
    />
  );
}
  