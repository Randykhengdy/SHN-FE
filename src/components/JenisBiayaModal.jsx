import React, { useEffect, useState } from "react";

export default function JenisBiayaModal({ isOpen, editData, onClose, onSave }) {
  const [form, setForm] = useState({ kode: "", jenis_biaya: "" });

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm({ kode: "", jenis_biaya: "" });
  }, [editData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-[400px] rounded">
        <h3 className="mb-4 text-lg font-semibold">{editData ? "Edit" : "Tambah"} Jenis Biaya</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm">Kode</label>
            <input name="kode" value={form.kode} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm">Jenis Biaya</label>
            <input name="jenis_biaya" value={form.jenis_biaya} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <button onClick={onClose} className="bg-gray-100 px-3 py-1 rounded">Batal</button>
          <button onClick={() => onSave(form)} className="bg-gray-800 text-white px-3 py-1 rounded">
            {editData ? "Update" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
