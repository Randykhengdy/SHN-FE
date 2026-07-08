import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { salesPersonService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function SalesPersonPage() {
  const fileInputRef = React.useRef(null);
  const { showAlert, AlertComponent } = useAlert();

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await salesPersonService.importData(file);
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
        title="Sales Person"
        subtitle="Master Data"
        service={salesPersonService}
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await salesPersonService.downloadTemplate();
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
          { name: "kode", label: "Kode", maxLength: 8, disabledOnEdit: true, required: true },
          { name: "nama_sales", label: "Nama Sales", maxLength: 64, required: true },
          { name: "no_telp", label: "No Telp", maxLength: 16 },
          { name: "alamat", label: "Alamat" },
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
          { key: "nama_sales", label: "Nama Sales", align: "left", minWidth: "15rem", maxWidth: "20rem" },
          { key: "no_telp", label: "No Telp", align: "center", width: "10rem", maxWidth: "10rem" },
          { key: "alamat", label: "Alamat", align: "left", minWidth: "20rem" },
        ]}
      />
    </>
  );
}
