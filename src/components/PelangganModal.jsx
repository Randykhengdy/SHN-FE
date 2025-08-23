import React, { useState, useEffect } from "react";
import FormInput from "@/components/FormInput";

export default function PelangganModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState({
    kode: "",
    nama_pelanggan: "",
    kota: "",
    telepon_hp: "",
    contact_person: ""
  });

  useEffect(() => {
    if (editData) {
      setForm({
        kode: editData.kode || "",
        nama_pelanggan: editData.nama_pelanggan || "",
        kota: editData.kota || "",
        telepon_hp: editData.telepon_hp || "",
        contact_person: editData.contact_person || ""
      });
    } else {
      setForm({
        kode: "",
        nama_pelanggan: "",
        kota: "",
        telepon_hp: "",
        contact_person: ""
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
        <h2 className="text-xl font-semibold mb-4">
          {editData ? "Edit Pelanggan" : "Tambah Pelanggan"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <FormInput
              label="Kode"
              id="kode"
              name="kode"
              value={form.kode}
              onChange={handleChange}
              required
              maxLength={8}
            />
          </div>

          <div className="mb-4">
            <FormInput
              label="Nama Pelanggan"
              id="nama_pelanggan"
              name="nama_pelanggan"
              value={form.nama_pelanggan}
              onChange={handleChange}
              required
              maxLength={64}
            />
          </div>

          <div className="mb-4">
            <FormInput
              label="Kota"
              id="kota"
              name="kota"
              value={form.kota}
              onChange={handleChange}
              maxLength={32}
            />
          </div>

          <div className="mb-4">
            <FormInput
              label="Telepon/HP"
              id="telepon_hp"
              name="telepon_hp"
              value={form.telepon_hp}
              onChange={handleChange}
              maxLength={16}
            />
          </div>

          <div className="mb-6">
            <FormInput
              label="Contact Person"
              id="contact_person"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              maxLength={64}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
