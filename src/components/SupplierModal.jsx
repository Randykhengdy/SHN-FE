import React, { useEffect, useState } from "react";

export default function SupplierModal({ isOpen, editData, onClose, onSave }) {
  const [form, setForm] = useState({
    kode: "",
    nama_supplier: "",
    kota: "",
    telepon_hp: "",
    contact_person: "",
  });

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm({ kode: "", nama_supplier: "", kota: "", telepon_hp: "", contact_person: "" });
  }, [editData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-[400px] rounded">
        <h3 className="mb-4 text-lg font-semibold">{editData ? "Edit" : "Tambah"} Supplier</h3>
        <div className="space-y-3">
          {["kode","nama_supplier","kota","telepon_hp","contact_person"].map((f) => (
            <div key={f}>
              <label className="text-sm capitalize block">{f.replace("_"," ")}</label>
              <input name={f} value={form[f]} onChange={handleChange} className="border rounded p-2 w-full"/>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded">Batal</button>
          <button onClick={() => onSave(form)} className="px-3 py-1 bg-gray-800 text-white rounded">{editData ? "Update" : "Simpan"}</button>
        </div>
      </div>
    </div>
  );
}
