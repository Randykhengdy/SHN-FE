import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisBiayaService } from "@/services/jenisBiayaService";

export default function JenisBiayaPage() {
  return (
    <MasterDataLayout
      title="Jenis Biaya"
      subtitle="Master Data"
      service={jenisBiayaService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 16 },
        { name: "jenis_biaya", label: "Jenis Biaya", maxLength: 64 },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "kode", label: "Kode" },
        { key: "jenis_biaya", label: "Jenis Biaya" },
      ]}
    />
  );
}
