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
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_pelanggan", label: "Nama Pelanggan", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "kota", label: "Kota", align: "center", width: "10rem", maxWidth: "10rem" },
        { key: "telepon_hp", label: "Telepon/HP", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "contact_person", label: "Contact Person", align: "left", minWidth: "12rem", maxWidth: "15rem" },
      ]}
    />
  );
}
