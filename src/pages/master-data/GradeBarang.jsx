import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gradeBarangService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function GradeBarangPage() {
  const fileInputRef = React.useRef(null);
  const { showAlert, AlertComponent } = useAlert();

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await gradeBarangService.importData(file);
      showAlert("Import Berhasil", result.message, "success");
      // Refresh data table is handled by MasterDataLayout via service prop if it triggers a re-render
      // or we might need to trigger it manually if Layout doesn't watch for external changes.
      // MasterDataLayout usually re-fetches when its internal state changes or when the service produces new data.
      // In this case, we might need a way to trigger refresh.
      // Looking at MasterDataLayout, it usually has a ref or re-fetches on mount.
      window.location.reload(); // Simple way to refresh for now if needed, but better if Layout supports it.
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
          },
          {
            label: "Import Data",
            icon: <Upload className="h-4 w-4" />,
            onClick: () => fileInputRef.current?.click(),
            className: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
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
    </>
  );
}

