import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisTransaksiKasService, jenisBiayaService } from "@/services/master-data";

export default function JenisTransaksiKasPage() {
  return (
    <MasterDataLayout
      title="Jenis Transaksi Kas"
      subtitle="Master Data"
      service={jenisTransaksiKasService}
      fields={[
        { name: "jenis_biaya_id", label: "Jenis Biaya", type: "select",
          optionsService: jenisBiayaService,
          optionLabel: "jenis_biaya",
        },
        { name: "keterangan", label: "Keterangan" },
        { name: "jumlah", label: "Jumlah", type: "number" },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        {
          key: "jenis_biaya.jenis_biaya",
          label: "Jenis Biaya",
          align: "left",
          minWidth: "15rem",
          maxWidth: "20rem"
        },
        { key: "keterangan", label: "Keterangan", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "jumlah", label: "Jumlah", align: "right", width: "10rem", maxWidth: "10rem" },
      ]}
    />
  );
}
