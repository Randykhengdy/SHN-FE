import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { pelaksanaService } from "@/services/pelaksanaService";

export default function PelaksanaPage() {
  return (
    <MasterDataLayout
      title="Pelaksana"
      subtitle="Master Data"
      service={pelaksanaService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8 },
        { name: "nama_pelaksana", label: "Nama Pelaksana", maxLength: 64 },
        { name: "level", label: "Level", maxLength: 16 },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "kode", label: "Kode" },
        { key: "nama_pelaksana", label: "Nama Pelaksana" },
        { key: "level", label: "Level" },
      ]}
    />
  );
}
