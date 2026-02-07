import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { bentukBarangService, tipeBarangService } from "@/services/master-data";

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
  return (
    <MasterDataLayout
      title="Bentuk Barang"
      subtitle="Master Data"
      service={bentukBarangService}
      preprocess={preprocessBentukBarang}
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
  );
}

