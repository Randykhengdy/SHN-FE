import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisMutasiStockService } from "@/services/jenisMutasiStockService";

export default function JenisMutasiStockPage() {
  return (
    <MasterDataLayout
      title="Jenis Mutasi Stock"
      subtitle="Master Data"
      service={jenisMutasiStockService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 16 },
        { name: "mutasi_stock", label: "Mutasi Stock", maxLength: 64 },
        {
          name: "jenis",
          label: "Jenis",
          type: "select",
          options: [
            { label: "MASUK", value: "MASUK" },
            { label: "KELUAR", value: "KELUAR" },
          ],
        },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "mutasi_stock", label: "Mutasi Stock", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "jenis", label: "Jenis", align: "center", width: "8rem", maxWidth: "8rem" },
      ]}
    />
  );
}
