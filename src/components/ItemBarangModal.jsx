import React, { useEffect, useState } from "react";

export default function ItemBarangModal({ isOpen, onClose, onSave, editData, options }) {
  const [form, setForm] = useState({
    kode_barang: "", nama_item_barang: "", jenis_barang_id: "", bentuk_barang_id: "", grade_barang_id: ""
  });

  useEffect(() => {
    if (editData) {
      setForm({
        kode_barang: editData.kode_barang,
        nama_item_barang: editData.nama_item_barang,
        jenis_barang_id: editData.jenis_barang_id,
        bentuk_barang_id: editData.bentuk_barang_id,
        grade_barang_id: editData.grade_barang_id,
      });
    } else {
      setForm({ kode_barang: "", nama_item_barang: "", jenis_barang_id: "", bentuk_barang_id: "", grade_barang_id: "" });
    }
  }, [editData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = () => onSave(form);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-[400px]">
        <h3 className="mb-4 text-lg font-semibold">{editData ? "Edit" : "Tambah"} Item Barang</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Kode Barang</label>
            <input name="kode_barang" value={form.kode_barang} onChange={handleChange}
                   className="w-full border rounded px-2 py-1" maxLength={8}/>
          </div>
          <div>
            <label className="block text-sm">Nama Item Barang</label>
            <input name="nama_item_barang" value={form.nama_item_barang} onChange={handleChange}
                   className="w-full border rounded px-2 py-1" maxLength={64}/>
          </div>
          <div>
            <label className="block text-sm">Jenis Barang</label>
            <select name="jenis_barang_id" value={form.jenis_barang_id} onChange={handleChange}
                    className="w-full border rounded px-2 py-1">
              <option value="">-- pilih --</option>
              {options.jenis?.map(j => (<option key={j.id} value={j.id}>{j.nama_jenis}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Bentuk Barang</label>
            <select name="bentuk_barang_id" value={form.bentuk_barang_id} onChange={handleChange}
                    className="w-full border rounded px-2 py-1">
              <option value="">-- pilih --</option>
              {options.bentuk?.map(b => (<option key={b.id} value={b.id}>{b.nama_bentuk}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm">Grade Barang</label>
            <select name="grade_barang_id" value={form.grade_barang_id} onChange={handleChange}
                    className="w-full border rounded px-2 py-1">
              <option value="">-- pilih --</option>
              {options.grade?.map(g => (<option key={g.id} value={g.id}>{g.nama}</option>))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded">Batal</button>
          <button onClick={submit} className="px-3 py-1 bg-gray-800 text-white rounded">{editData ? "Update" : "Simpan"}</button>
        </div>
      </div>
    </div>
  );
}
