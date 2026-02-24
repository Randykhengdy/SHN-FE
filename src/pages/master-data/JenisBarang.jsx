import React, { useRef, useState, useMemo } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisBarangService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

export default function JenisBarangPage() {
  const fileInputRef = useRef(null);
  const [importLoading, setImportLoading] = useState(false);
  const { showAlert, AlertComponent } = useAlert();

  const handleDownloadTemplate = async () => {
    try {
      await jenisBarangService.downloadTemplate();
    } catch (error) {
      console.error("Download template error:", error);
      showAlert("Gagal", "Gagal mendownload template: " + error.message, "error");
    }
  };

  const handleImportClick = (e, fetchData) => {
    // Store fetchData for use after import
    fileInputRef.current._fetchData = fetchData;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showAlert("Error", "File harus berformat CSV", "error");
      return;
    }

    setImportLoading(true);
    try {
      const result = await jenisBarangService.importData(file);
      const data = result.data;

      let message = result.message || "Import selesai";
      let type = "success";

      if (data?.errors?.length > 0) {
        message += "\n\nDetail:\n" + data.errors.join("\n");
        // If there are errors but some were imported, maybe use warning
        if (data.imported === 0) {
          type = "error";
        } else {
          type = "warning";
        }
      }

      showAlert("Hasil Import", message, type);

      // Refresh table data
      if (fileInputRef.current?._fetchData) {
        fileInputRef.current._fetchData();
      }
    } catch (error) {
      console.error("Import error:", error);
      showAlert("Error", "Gagal import data: " + error.message, "error");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <>
      <AlertComponent />
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
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
          {
            label: importLoading ? "Importing..." : "Import Data",
            onClick: handleImportClick,
            disabled: importLoading,
            icon: <Upload size={16} />,
            className: "bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
          },
        ]}
      />
    </>
  );
}
