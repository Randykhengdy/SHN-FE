import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import InfoBlock from "@/components/InfoBlock";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "@/components/Table";
import { platTypes, getPlatData, generateNoPO } from "@/data/platData";
import useLocalStorage from "@/hooks/useLocalStorage";
import "@/styles/po.css";

export default function PurchaseOrderPage() {
  // State untuk form dan items
  const [form, setForm] = useState({ panjang: "", lebar: "", qty: 1, jenisPlat: "" });
  const [items, setItems] = useState([]);
  const [totalPO, setTotalPO] = useState(0);
  const [poList, setPoList] = useLocalStorage("poList", []);
  
  // State untuk informasi kalkulasi
  const [ketebalan, setKetebalan] = useState("-");
  const [luas, setLuas] = useState(0);
  const [harga, setHarga] = useState(0);
  const [totalItem, setTotalItem] = useState(0);

  // Effect untuk update kalkulasi saat form berubah
  useEffect(() => {
    const panjangVal = parseFloat(form.panjang) || 0;
    const lebarVal = parseFloat(form.lebar) || 0;
    const qtyVal = parseInt(form.qty) || 1;
    const plat = getPlatData(form.jenisPlat);
    
    const luasVal = panjangVal * lebarVal;
    setLuas(luasVal.toFixed(2));
    
    if (plat) {
      setKetebalan(plat.ketebalan);
      setHarga(plat.harga);
      setTotalItem((luasVal * plat.harga * qtyVal).toFixed(0));
    } else {
      setKetebalan("-");
      setHarga(0);
      setTotalItem(0);
    }
  }, [form]);

  // Handler untuk perubahan form
  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  // Handler untuk tambah item
  const handleTambahItem = () => {
    const panjangVal = parseFloat(form.panjang);
    const lebarVal = parseFloat(form.lebar);
    const qtyVal = parseInt(form.qty);
    const plat = getPlatData(form.jenisPlat);
    
    if (!panjangVal || !lebarVal || !qtyVal || !plat) {
      alert("Lengkapi data item!");
      return;
    }
    
    const luasVal = panjangVal * lebarVal;
    const total = luasVal * plat.harga * qtyVal;
    
    const newItem = {
      jenis: form.jenisPlat,
      panjang: panjangVal,
      lebar: lebarVal,
      ketebalan: plat.ketebalan,
      qty: qtyVal,
      luas: luasVal.toFixed(2),
      harga: plat.harga,
      total
    };
    
    const updated = [...items, newItem];
    setItems(updated);
    setTotalPO(updated.reduce((acc, item) => acc + item.total, 0));
    
    // Reset form
    setForm({ panjang: "", lebar: "", qty: 1, jenisPlat: "" });
  };

  // Handler untuk hapus item
  const handleDeleteItem = (index) => {
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered);
    setTotalPO(filtered.reduce((acc, item) => acc + item.total, 0));
  };

  // Handler untuk simpan PO
  const handleSimpanPO = () => {
    if (items.length === 0) {
      alert("Tambahkan minimal 1 item ke PO!");
      return;
    }
    
    const noPO = generateNoPO();
    const po = {
      noPO,
      items,
      total: totalPO,
      status: "Menunggu Workshop"
    };
    
    setPoList([...poList, po]);
    setItems([]);
    setTotalPO(0);
    alert("PO berhasil disimpan!");
  };

  return (
    <div className="content">
      <h1>Input Purchase Order (PO)</h1>
      
      {/* Form Input */}
      <form id="itemForm">
        {/* Row 1: Input fields */}
        <div className="row-4col">
          <div>
            <FormInput 
              label="Panjang (m):"
              id="panjang"
              type="number"
              step="0.01"
              value={form.panjang}
              onChange={handleChange}
              required
              className="input-long"
            />
          </div>
          <div>
            <FormInput 
              label="Lebar (m):"
              id="lebar"
              type="number"
              step="0.01"
              value={form.lebar}
              onChange={handleChange}
              required
              className="input-long"
            />
          </div>
          <div>
            <FormInput 
              label="Qty:"
              id="qty"
              type="number"
              min="1"
              value={form.qty}
              onChange={handleChange}
              required
              className="input-long"
            />
          </div>
          <div>
            <FormSelect 
              label="Jenis Plat:"
              id="jenisPlat"
              value={form.jenisPlat}
              onChange={handleChange}
              options={[
                { value: "", label: "--Pilih--" },
                ...platTypes.map(pt => ({ value: pt.kode, label: pt.kode }))
              ]}
              className="input-short"
            />
          </div>
        </div>

        {/* Row 2+3: Info blocks and action button */}
        <div className="info-action-row">
          <div className="info-row-merged">
            <InfoBlock label="Ketebalan" value={ketebalan} unit="mm" />
            <InfoBlock label="Luas/item" value={luas} unit="m²" />
            <InfoBlock label="Harga/m²" value={`Rp ${harga.toLocaleString()}`} />
            <InfoBlock label="Total Item" value={`Rp ${parseInt(totalItem).toLocaleString()}`} />
          </div>
          <div>
            <Button 
              onClick={handleTambahItem}
              type="button"
              className="tambah-item-btn"
            >
              Tambah Item
            </Button>
          </div>
        </div>
      </form>

      {/* Daftar Item */}
      <h3>Daftar Item dalam PO</h3>
      <div className="table-scroll-x">
        <Table id="itemTable" border="1">
          <TableHead>
            <TableRow>
              <TableHeader>#</TableHeader>
              <TableHeader>Jenis</TableHeader>
              <TableHeader>Dimensi</TableHeader>
              <TableHeader>Qty</TableHeader>
              <TableHeader>Luas/item</TableHeader>
              <TableHeader>Harga/m²</TableHeader>
              <TableHeader>Total</TableHeader>
              <TableHeader>Aksi</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.jenis}</TableCell>
                <TableCell>{`${item.panjang}x${item.lebar}x${item.ketebalan}`}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{`${item.luas} m²`}</TableCell>
                <TableCell>{`Rp ${item.harga.toLocaleString()}`}</TableCell>
                <TableCell>{`Rp ${item.total.toLocaleString()}`}</TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleDeleteItem(index)} 
                    className="delete-btn"
                  >
                    Hapus
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="po-total-actions">
        <span><strong>Total Harga PO:</strong> Rp <span id="totalPO">{totalPO.toLocaleString()}</span></span>
        <Button 
          onClick={handleSimpanPO}
          className="simpan-po-btn"
        >
          Simpan PO
        </Button>
      </div>

      {/* Daftar PO */}
      <h2>Daftar PO</h2>
      <div className="table-scroll-x">
        <Table id="poTable" border="1">
          <TableHead>
            <TableRow>
              <TableHeader>No PO</TableHeader>
              <TableHeader>Jumlah Item</TableHeader>
              <TableHeader>Total Harga</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {poList.map((po, index) => (
              <TableRow key={index}>
                <TableCell>{po.noPO}</TableCell>
                <TableCell>{po.items.length}</TableCell>
                <TableCell>{`Rp ${po.total.toLocaleString()}`}</TableCell>
                <TableCell>{po.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
