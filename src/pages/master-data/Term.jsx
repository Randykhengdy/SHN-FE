import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import termService from "@/services/master-data/termService";

export default function Term() {
  return (
    <MasterDataLayout
      title="Term of Payment"
      service={termService}
      fields={[
        { name: "nama_term", label: "Nama Term", type: "text", required: true },
        { name: "deskripsi", label: "Deskripsi", type: "textarea" }
      ]}
    />
  );
}
