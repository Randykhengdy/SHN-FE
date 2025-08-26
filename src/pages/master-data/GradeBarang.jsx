import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gradeBarangService } from "@/services/master-data";

export default function GradeBarangPage() {
  return (
    <MasterDataLayout
      title="Grade Barang"
      subtitle="Master Data"
      service={gradeBarangService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8, required: true },
        { name: "nama", label: "Nama", maxLength: 32, required: true },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama", label: "Nama", align: "left", minWidth: "15rem", maxWidth: "25rem" },
      ]}
    />
  );
}
  