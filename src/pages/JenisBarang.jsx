import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisBarangService } from "@/services/jenisBarangService";

export default function JenisBarangPage() {
  return (
    <MasterDataLayout
      title="Jenis Barang"
      subtitle="Master Data"
      service={jenisBarangService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8 },
        { name: "nama_jenis", label: "Nama Jenis", maxLength: 32 },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_jenis", label: "Nama Jenis", align: "left", minWidth: "15rem", maxWidth: "25rem" },
      ]}
    />
  );
}
