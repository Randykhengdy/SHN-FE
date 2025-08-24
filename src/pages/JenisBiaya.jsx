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
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "jenis_biaya", label: "Jenis Biaya", align: "left", minWidth: "15rem", maxWidth: "25rem" },
      ]}
    />
  );
}
