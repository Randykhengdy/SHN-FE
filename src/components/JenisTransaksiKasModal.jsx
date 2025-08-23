import React, { useEffect, useState } from "react";

export default function JenisTransaksiKasModal({ isOpen, editData, onClose, onSave, jenisBiayaOptions }) {
  const [form, setForm] = useState({ jenis_biaya_id: "", keterangan: "", jumlah: "" });

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm({ jenis_biaya_id: "", keterangan: "", jumlah: "" });
  }, [editData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded p-6">
        <h3 className="font-semibold mb-4">{editData ? "Edit" : "Tambah"} Jenis Transaksi Kas</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm block">Jenis Biaya</label>
            <select name="jenis_biaya_id" value={form.jenis_biaya_id} onChange={handleChange} className="border rounded p-2 w-full">
              <option value="">-- pilih jenis biaya --</option>
              {jenisBiayaOptions.map((j) => (
                <option key={j.id} value={j.id}>{j.nama_jenis_biaya}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm block">Keterangan</label>
            <input name="keterangan" value={form.keterangan} onChange={handleChange} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="text-sm block">Jumlah (Rp)</label>
            <input type="number" name="jumlah" value={form.jumlah} onChange={handleChange} className="border rounded p-2 w-full" />
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button onClick={onClose} className="bg-gray-100 px-3 py-1 rounded">Batal</button>
          <button onClick={() => onSave(form)} className="bg-gray-800 text-white px-3 py-1 rounded">{editData?"Update":"Simpan"}</button>
        </div>
      </div>
    </div>
  );
}
