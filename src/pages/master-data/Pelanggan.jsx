import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { pelangganService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function PelangganPage() {
  const fileInputRef = React.useRef(null);
  const { showAlert, AlertComponent } = useAlert();

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await pelangganService.importData(file);
      showAlert("Import Berhasil", result.message, "success");
      window.location.reload();
    } catch (error) {
      showAlert("Import Gagal", error.message || "Terjadi kesalahan saat mengimport data", "error");
    } finally {
      event.target.value = ""; // Reset input
    }
  };

  return (
    <>
      <AlertComponent />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleImport}
      />
      <MasterDataLayout
        title="Pelanggan"
        subtitle="Master Data"
        service={pelangganService}
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await pelangganService.downloadTemplate();
              } catch (error) {
                console.error("Download template failed:", error);
              }
            },
            className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          },
          {
            label: "Import Data",
            icon: <Upload className="h-4 w-4" />,
            onClick: () => fileInputRef.current?.click(),
            className: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          }
        ]}
        fields={[
          { name: "kode", label: "Kode", maxLength: 8, disabledOnEdit: true },
          { name: "nama_pelanggan", label: "Nama Pelanggan", maxLength: 64 },
          { name: "kota", label: "Kota", maxLength: 32 },
          { name: "telepon_hp", label: "Telepon/HP", maxLength: 16 },
          { name: "contact_person", label: "Contact Person", maxLength: 64 },
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
          { key: "nama_pelanggan", label: "Nama Pelanggan", align: "left", minWidth: "15rem", maxWidth: "20rem" },
          { key: "kota", label: "Kota", align: "center", width: "10rem", maxWidth: "10rem" },
          { key: "telepon_hp", label: "Telepon/HP", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "contact_person", label: "Contact Person", align: "left", minWidth: "12rem", maxWidth: "15rem" },
        ]}
      />
    </>
  );
}
