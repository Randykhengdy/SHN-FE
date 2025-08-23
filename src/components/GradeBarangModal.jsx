import React, { useState, useEffect } from "react";

export default function GradeBarangModal({ isOpen, onClose, onSave, editData }) {
  const [form,setForm] = useState({ kode:"", nama:"" });

  useEffect(()=>{
    if(editData) setForm({kode:editData.kode, nama:editData.nama});
    else setForm({kode:"", nama:""});
  },[editData]);

  const handleSubmit=(e)=>{
    e.preventDefault();
    onSave(form);
  };

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{editData ? "Edit" : "Tambah"} Grade Barang</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Kode</label>
            <input type="text" className="w-full p-2 border rounded" value={form.kode} required
                   onChange={(e)=>setForm({...form,kode:e.target.value})} />
          </div>
          <div>
            <label className="block mb-1">Nama</label>
            <input type="text" className="w-full p-2 border rounded" value={form.nama} required
                   onChange={(e)=>setForm({...form,nama:e.target.value})} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Batal</button>
            <button type="submit" className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700">{editData ? "Update":"Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
