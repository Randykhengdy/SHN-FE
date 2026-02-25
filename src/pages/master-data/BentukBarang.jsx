import React, { useRef } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { bentukBarangService, tipeBarangService } from "@/services/master-data";
import { Download, Upload } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

// Preprocess to convert tipe_barang_id from string to number
const preprocessBentukBarang = (formData) => {
  const processed = { ...formData };

  // Convert tipe_barang_id to number if it exists and is not empty
  if (processed.tipe_barang_id) {
    processed.tipe_barang_id = parseInt(processed.tipe_barang_id, 10);
  } else {
    // If empty string, convert to null
    processed.tipe_barang_id = null;
  }

  return processed;
};

export default function BentukBarangPage() {
  const fileInputRef = useRef(null);
  const { showAlert, AlertComponent } = useAlert();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    try {
      const result = await bentukBarangService.importData(file);
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
        title="Bentuk Barang"
        subtitle="Master Data"
        service={bentukBarangService}
        preprocess={preprocessBentukBarang}
        customHeaderButtons={[
          {
            label: "Download Template",
            icon: <Download className="h-4 w-4" />,
            onClick: async () => {
              try {
                await bentukBarangService.downloadTemplate();
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
          { name: "kode", label: "Kode", maxLength: 8, disabledOnEdit: true },
          { name: "nama_bentuk", label: "Nama Bentuk", maxLength: 32 },
          {
            name: "tipe_barang_id",
            label: "Tipe Barang",
            type: "select",
            optionsLoader: async () => {
              const response = await tipeBarangService.getAll();
              const data = response.data || response;
              // Transform to add custom label
              return data.map(item => ({
                ...item,
                label: `${item.name} - ${item.desc}`
              }));
            },
            mapFromEdit: (data) => data.tipe_barang_id || "",
            required: true
          },
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
          { key: "nama_bentuk", label: "Nama Bentuk", align: "left", minWidth: "15rem", maxWidth: "25rem" },
          {
            key: "tipe_barang_id",
            label: "Tipe Barang",
            align: "left",
            minWidth: "20rem",
            getValue: (item) => item.tipe_barang ? `${item.tipe_barang.name} - ${item.tipe_barang.desc}` : "-"
          },
        ]}
      />
    </>
  );
}
