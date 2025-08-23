import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gradeBarangService } from "@/services/gradeBarangService";

export default function BentukBarangPage() {
  return (
    <MasterDataLayout
      title="Grade Barang"
      subtitle="Master Data"
      service={gradeBarangService}
      fields={[
        { namename: "kode", label: "Kode", maxLength: 8 },
        { name: "nama", label: "Nama", maxLength: 32 },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "kode", label: "Kode" },
        { key: "nama", label: "Nama" },
      ]}
    />
  );
}
  