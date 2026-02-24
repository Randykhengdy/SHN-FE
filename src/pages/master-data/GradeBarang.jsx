import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gradeBarangService } from "@/services/master-data";
import { Download } from "lucide-react";

export default function GradeBarangPage() {
  return (
    <MasterDataLayout
      title="Grade Barang"
      subtitle="Master Data"
      service={gradeBarangService}
      customHeaderButtons={[
        {
          label: "Download Template",
          icon: <Download className="h-4 w-4" />,
          onClick: async () => {
            try {
              await gradeBarangService.downloadTemplate();
            } catch (error) {
              console.error("Download template failed:", error);
            }
          },
          className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
        }
      ]}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8, required: true, disabledOnEdit: true },
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

