import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { pelangganService } from "@/services/pelangganService";

export default function PelangganPage() {
  return (
    <MasterDataLayout
      title="Pelanggan"
      subtitle="Master Data"
      service={pelangganService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8 },
        { name: "nama_pelanggan", label: "Nama Pelanggan", maxLength: 64 },
        { name: "kota", label: "Kota", maxLength: 32 },
        { name: "telepon_hp", label: "Telepon/HP", maxLength: 16 },
        { name: "contact_person", label: "Contact Person", maxLength: 64 },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "kode", label: "Kode" },
        { key: "nama_pelanggan", label: "Nama Pelanggan" },
        { key: "kota", label: "Kota" },
        { key: "telepon_hp", label: "Telepon/HP" },
        { key: "contact_person", label: "Contact Person" },
      ]}
    />
  );
}
