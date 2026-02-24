import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisBarangService } from "@/services/master-data";
import { Download } from "lucide-react";

export default function JenisBarangPage() {
  const handleDownloadTemplate = async () => {
    try {
      await jenisBarangService.downloadTemplate();
    } catch (error) {
      console.error("Download template error:", error);
      alert("Gagal mendownload template: " + error.message);
    }
  };

  return (
    <MasterDataLayout
      title="Jenis Barang"
      subtitle="Master Data"
      service={jenisBarangService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8, disabledOnEdit: true },
        { name: "nama_jenis", label: "Nama Jenis", maxLength: 32 },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_jenis", label: "Nama Jenis", align: "left", minWidth: "15rem", maxWidth: "25rem" },
      ]}
      customHeaderButtons={[
        {
          label: "Download Template",
          onClick: handleDownloadTemplate,
          icon: <Download size={16} />,
          className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
        },
      ]}
    />
  );
}
