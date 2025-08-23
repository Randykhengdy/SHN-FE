import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { bentukBarangService } from "@/services/bentukBarangService";

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
        { key: "id", label: "ID" },
        { key: "kode", label: "Kode" },
        { key: "nama_bentuk", label: "Nama Bentuk" },
      ]}
    />
  );
}
  