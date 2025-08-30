import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import unitService from "@/services/master-data/unitService";

export default function Unit() {
  return (
    <MasterDataLayout
      title="Satuan"
      service={unitService}
      fields={[
        { name: "nama_unit", label: "Nama Satuan", type: "text", required: true },
        { name: "deskripsi", label: "Deskripsi", type: "textarea" }
      ]}
    />
  );
}
