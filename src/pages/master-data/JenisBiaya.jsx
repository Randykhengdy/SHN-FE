import React, { useRef } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisBiayaService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function JenisBiayaPage() {
  const fileInputRef = useRef(null);
  const { showAlert, AlertComponent } = useAlert();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await jenisBiayaService.importData(formData);
      const data = result.data || result;

      const hasErrors = data.errors && data.errors.length > 0;
      const message = data.message || result.message || "Import selesai.";

      if (hasErrors) {
        const errorList = data.errors.slice(0, 10).join("\n");
        const suffix = data.errors.length > 10 ? `\n...dan ${data.errors.length - 10} baris lainnya.` : "";
        showAlert(
          "Import Selesai dengan Peringatan",
          `${message}\n\nBaris bermasalah:\n${errorList}${suffix}`,
          "warning"
        );
      } else {
        showAlert("Import Berhasil", message, "success");
      }
    } catch (error) {
      const errMsg = error?.data?.message || error?.message || "Terjadi kesalahan saat import.";
      showAlert("Import Gagal", errMsg, "error");
    }
  };

  return (
    <>
      <AlertComponent />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleImport}
      />
      <MasterDataLayout
        title="Jenis Biaya"
        subtitle="Master Data"
        service={jenisBiayaService}
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await jenisBiayaService.downloadTemplate();
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
          },
        ]}
        fields={[
          { name: "kode", label: "Kode", maxLength: 16 },
          { name: "jenis_biaya", label: "Jenis Biaya", maxLength: 64 },
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
          { key: "jenis_biaya", label: "Jenis Biaya", align: "left", minWidth: "15rem", maxWidth: "25rem" },
        ]}
      />
    </>
  );
}
