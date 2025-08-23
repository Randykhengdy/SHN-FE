import React, { useState, useEffect } from "react";

export default function BentukBarangModal({ isOpen, onClose, onSave, editData }) {
    const [form, setForm] = useState({ kode:"", nama:"" });
  
    useEffect(() => {
      if(editData) setForm({kode:editData.kode, nama:editData.nama});
      else setForm({kode:"", nama:""});
    }, [editData]);
  
    const handleChange = (e) => setForm({...form, [e.target.name]:e.target.value});
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(form);
    };
  
    if(!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">
            {editData ? "Edit Bentuk Barang" : "Tambah Bentuk Barang"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Kode</label>
              <input type="text" name="kode" value={form.kode} onChange={handleChange} required className="w-full border rounded p-2"/>
            </div>
            <div>
              <label className="block font-medium mb-1">Nama</label>
              <input type="text" name="nama" value={form.nama} onChange={handleChange} required className="w-full border rounded p-2"/>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={onClose} type="button" className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Batal</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700">{editData?"Update":"Simpan"}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  