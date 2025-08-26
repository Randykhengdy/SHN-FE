import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { pelaksanaService } from "@/services/master-data";

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
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_pelaksana", label: "Nama Pelaksana", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "level", label: "Level", align: "center", width: "8rem", maxWidth: "8rem" },
      ]}
    />
  );
}
