import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { supplierService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function SupplierPage() {
  const fileInputRef = React.useRef(null);
  const { showAlert, AlertComponent } = useAlert();

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await supplierService.importData(file);
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
        title="Supplier"
        subtitle="Master Data"
        service={supplierService}
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await supplierService.downloadTemplate();
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
          { name: "kode", label: "Kode", maxLength: 16, disabledOnEdit: true },
          { name: "nama_supplier", label: "Nama Supplier", maxLength: 64 },
          { name: "kota", label: "Kota", maxLength: 32 },
          { name: "telepon_hp", label: "Telepon/HP", maxLength: 32 },
          { name: "contact_person", label: "Contact Person", maxLength: 32 },
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
          { key: "nama_supplier", label: "Nama Supplier", align: "left", minWidth: "15rem", maxWidth: "20rem" },
          { key: "kota", label: "Kota", align: "center", width: "10rem", maxWidth: "10rem" },
          { key: "telepon_hp", label: "Telepon/HP", align: "center", width: "12rem", maxWidth: "12rem" },
          { key: "contact_person", label: "Contact Person", align: "left", minWidth: "12rem", maxWidth: "15rem" },
        ]}
      />
    </>
  );
}
