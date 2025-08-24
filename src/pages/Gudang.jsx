import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gudangService } from "@/services/gudangService";

export default function GudangPage() {
  return (
    <MasterDataLayout
      title="Gudang"
      subtitle="Master Data"
      service={gudangService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8 },
        { name: "nama_gudang", label: "Nama Gudang", maxLength: 64 },
        { name: "telepon_hp", label: "Telepon/HP", maxLength: 20 },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_gudang", label: "Nama Gudang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "telepon_hp", label: "Telepon/HP", align: "center", width: "12rem", maxWidth: "12rem" },
      ]}
    />
  );
}
