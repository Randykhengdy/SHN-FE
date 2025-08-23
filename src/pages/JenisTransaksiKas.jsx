import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisTransaksiKasService } from "@/services/jenisTransaksiKasService";
import { jenisBiayaService } from "@/services/jenisBiayaService";

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
        { key: "id", label: "ID" },
        {
          key: "jenis_biaya.jenis_biaya",
          label: "Jenis Biaya",
        },
        { key: "keterangan", label: "Keterangan" },
        { key: "jumlah", label: "Jumlah" },
      ]}
    />
  );
}
