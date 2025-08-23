import React, { useEffect, useState } from "react";

export default function PelaksanaModal({ isOpen, editData, onClose, onSave }) {
  const [form, setForm] = useState({ kode: "", nama_pelaksana: "", level: "" });

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm({ kode: "", nama_pelaksana: "", level: "" });
  }, [editData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-[400px]">
        <h3 className="mb-4 text-lg font-semibold">{editData ? "Edit" : "Tambah"} Pelaksana</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm">Kode</label>
            <input name="kode" value={form.kode} onChange={handleChange} className="w-full border rounded p-2"/>
          </div>
          <div>
            <label className="text-sm">Nama Pelaksana</label>
            <input name="nama_pelaksana" value={form.nama_pelaksana} onChange={handleChange} className="w-full border rounded p-2"/>
          </div>
          <div>
            <label className="text-sm">Level</label>
            <input name="level" value={form.level} onChange={handleChange} className="w-full border rounded p-2"/>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-100 px-3 py-1 rounded">Batal</button>
          <button onClick={() => onSave(form)} className="bg-gray-800 text-white px-3 py-1 rounded">{editData?"Update":"Simpan"}</button>
        </div>
      </div>
    </div>
  );
}
