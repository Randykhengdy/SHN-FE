import React, { useEffect, useState } from "react";

export default function JenisMutasiStockModal({ isOpen, editData, onClose, onSave }) {
  const [form, setForm] = useState({ kode: "", mutasi_stock: "", jenis: "" });

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm({ kode: "", mutasi_stock: "", jenis: "" });
  }, [editData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-[400px]">
        <h3 className="mb-4 text-lg font-semibold">{editData ? "Edit" : "Tambah"} Jenis Mutasi Stock</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm">Kode</label>
            <input name="kode" value={form.kode} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Mutasi Stock</label>
            <input name="mutasi_stock" value={form.mutasi_stock} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Jenis</label>
            <select name="jenis" value={form.jenis} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">-- pilih --</option>
              <option value="Masuk">Masuk</option>
              <option value="Keluar">Keluar</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded">Batal</button>
          <button onClick={() => onSave(form)} className="px-3 py-1 bg-gray-800 text-white rounded">
            {editData ? "Update" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
