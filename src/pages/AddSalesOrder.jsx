import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, FileText, Eye, Trash2, ArrowLeft, Calendar, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Mock data untuk dropdown options
const termOptions = [
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit" },
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" }
];

const warehouseOptions = [
  { value: "gudang-utama", label: "Gudang Utama - Jakarta Pusat" },
  { value: "gudang-barat", label: "Gudang Barat - Jakarta Barat" },
  { value: "gudang-timur", label: "Gudang Timur - Jakarta Timur" }
];

const itemTypeOptions = [
  { value: "plat-besi", label: "Plat Besi" },
  { value: "plat-stainless", label: "Plat Stainless" },
  { value: "plat-aluminium", label: "Plat Aluminium" }
];

const itemShapeOptions = [
  { value: "persegi", label: "Persegi" },
  { value: "lingkaran", label: "Lingkaran" },
  { value: "custom", label: "Custom" }
];

const itemGradeOptions = [
  { value: "grade-a", label: "Grade A" },
  { value: "grade-b", label: "Grade B" },
  { value: "grade-c", label: "Grade C" }
];

const unitOptions = [
  { value: "per-dimensi", label: "per dimensi" },
  { value: "per-meter", label: "per meter" },
  { value: "per-piece", label: "per piece" }
];

export default function AddSalesOrderPage() {
  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Sales Order Details
  const [soNumber, setSoNumber] = useState("SO-20250825-001");
  const [soDate, setSoDate] = useState("2025-08-24");
  const [deliveryDate, setDeliveryDate] = useState("2025-08-31");
  const [termOfPayment, setTermOfPayment] = useState("cash");
  const [originWarehouse, setOriginWarehouse] = useState("");

  // Item Input Form
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemType, setItemType] = useState("");
  const [itemShape, setItemShape] = useState("");
  const [itemGrade, setItemGrade] = useState("");
  const [itemPrice, setItemPrice] = useState("Auto dari jenis plat");
  const [itemUnit, setItemUnit] = useState("per-dimensi");
  const [itemDiscount, setItemDiscount] = useState("0");
  const [itemNotes, setItemNotes] = useState("");

  // Calculated values
  const [itemThickness, setItemThickness] = useState("- mm");
  const [itemArea, setItemArea] = useState("0.00 m²");
  const [itemPricePerUnit, setItemPricePerUnit] = useState("Rp 0/m²");
  const [itemTotal, setItemTotal] = useState("Rp 0");

  // Item List
  const [items, setItems] = useState([]);

  // Calculate item area and total
  useEffect(() => {
    const length = parseFloat(itemLength) || 0;
    const width = parseFloat(itemWidth) || 0;
    const qty = parseInt(itemQty) || 0;
    const discount = parseFloat(itemDiscount) || 0;

    const area = length * width;
    const areaPerItem = area.toFixed(2);
    const pricePerUnit = 50000; // Mock price
    const totalBeforeDiscount = area * pricePerUnit * qty;
    const discountAmount = totalBeforeDiscount * (discount / 100);
    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    setItemArea(`${areaPerItem} m²`);
    setItemPricePerUnit(`Rp ${pricePerUnit.toLocaleString()}/m²`);
    setItemTotal(`Rp ${totalAfterDiscount.toLocaleString()}`);
  }, [itemLength, itemWidth, itemQty, itemDiscount]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleFillTestData = () => {
    setCustomerName("PT Test Customer");
    setCustomerPhone("08123456789");
    setCustomerEmail("test@customer.com");
    setCustomerAddress("Jl. Test No. 123, Jakarta");
    setOriginWarehouse("gudang-utama");
    setItemType("plat-besi");
    setItemShape("persegi");
    setItemGrade("grade-a");
  };

  const handleAddTestItem = () => {
    const testItem = {
      id: Date.now(),
      jenisBarang: "Plat Besi",
      bentuk: "Persegi",
      grade: "Grade A",
      dimensi: "2.00 x 1.50",
      qty: 2,
      luasPerItem: "3.00 m²",
      harga: "Rp 50,000/m²",
      satuan: "per dimensi",
      diskon: "5%",
      total: "Rp 285,000"
    };
    setItems([...items, testItem]);
  };

  const handleAddItem = () => {
    if (!itemType || !itemShape || !itemGrade || !itemLength || !itemWidth) {
      alert("Mohon lengkapi data item");
      return;
    }

    const newItem = {
      id: Date.now(),
      jenisBarang: itemTypeOptions.find(opt => opt.value === itemType)?.label || itemType,
      bentuk: itemShapeOptions.find(opt => opt.value === itemShape)?.label || itemShape,
      grade: itemGradeOptions.find(opt => opt.value === itemGrade)?.label || itemGrade,
      dimensi: `${itemLength} x ${itemWidth}`,
      qty: parseInt(itemQty),
      luasPerItem: itemArea,
      harga: itemPricePerUnit,
      satuan: unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit,
      diskon: `${itemDiscount}%`,
      total: itemTotal
    };

    setItems([...items, newItem]);

    // Reset form
    setItemLength("");
    setItemWidth("");
    setItemQty("1");
    setItemType("");
    setItemShape("");
    setItemGrade("");
    setItemDiscount("0");
    setItemNotes("");
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleTestSimpanSO = () => {
    console.log("Testing save SO...");
    alert("Test Simpan SO berhasil!");
  };

  const handleBackToList = () => {
    // Navigate back to sales order list
    window.history.back();
  };

  // Calculate summary
  const subtotal = items.reduce((sum, item) => {
    const total = parseInt(item.total.replace(/[^\d]/g, ''));
    return sum + total;
  }, 0);

  const totalDiscount = items.reduce((sum, item) => {
    const total = parseInt(item.total.replace(/[^\d]/g, ''));
    const discountPercent = parseInt(item.diskon.replace('%', ''));
    return sum + (total * discountPercent / 100);
  }, 0);

  const ppn = (subtotal - totalDiscount) * 0.11;
  const totalHargaSO = subtotal - totalDiscount + ppn;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="text-gray-600 text-sm">TRANSAKSI</div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Order (SO)</h1>
      </div>

      {/* Main Content Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Input Sales Order Baru</CardTitle>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleFillTestData}>
                Fill Test Data
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddTestItem}>
                Add Test Item
              </Button>
              <Button variant="default" size="sm" onClick={handleTestSimpanSO}>
                Test Simpan SO
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBackToList}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke List
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informasi Pelanggan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nama Pelanggan</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Telepon</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Masukkan email"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Alamat</Label>
                <Input
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Masukkan alamat"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* Sales Order Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="soNumber">Nomor SO</Label>
                <Input
                  id="soNumber"
                  value={soNumber}
                  onChange={(e) => setSoNumber(e.target.value)}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="soDate">Tanggal SO</Label>
                <div className="relative">
                  <Input
                    id="soDate"
                    type="date"
                    value={soDate}
                    onChange={(e) => setSoDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryDate">Tanggal Pengiriman</Label>
                <div className="relative">
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <Label htmlFor="termOfPayment">Term of Payment</Label>
                <Select value={termOfPayment} onValueChange={setTermOfPayment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="originWarehouse">Asal Gudang</Label>
                <Select value={originWarehouse} onValueChange={setOriginWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gudang" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Input Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Input Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="itemLength">Panjang (m)</Label>
              <Input
                id="itemLength"
                type="number"
                step="0.01"
                value={itemLength}
                onChange={(e) => setItemLength(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="itemWidth">Lebar (m)</Label>
              <Input
                id="itemWidth"
                type="number"
                step="0.01"
                value={itemWidth}
                onChange={(e) => setItemWidth(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="itemQty">Qty</Label>
              <Input
                id="itemQty"
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="itemType">Jenis Barang</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis Barang" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="itemShape">Bentuk Barang</Label>
              <Select value={itemShape} onValueChange={setItemShape}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bentuk" />
                </SelectTrigger>
                <SelectContent>
                  {itemShapeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="itemGrade">Grade Barang</Label>
              <Select value={itemGrade} onValueChange={setItemGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Grade" />
                </SelectTrigger>
                <SelectContent>
                  {itemGradeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="itemPrice">Harga</Label>
              <Input
                id="itemPrice"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="Auto dari jenis plat"
              />
            </div>
            <div>
              <Label htmlFor="itemUnit">Satuan</Label>
              <Select value={itemUnit} onValueChange={setItemUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="itemDiscount">Diskon (%)</Label>
              <Input
                id="itemDiscount"
                type="number"
                value={itemDiscount}
                onChange={(e) => setItemDiscount(e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="itemNotes">Catatan</Label>
              <Input
                id="itemNotes"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600">Ketebalan</Label>
              <div className="font-medium">{itemThickness}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Luas/item</Label>
              <div className="font-medium">{itemArea}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Harga</Label>
              <div className="font-medium">{itemPricePerUnit}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Item</Label>
              <div className="font-medium">{itemTotal}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Item List Table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Item dalam SO</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddTestItem}>
              <Dices className="w-4 h-4 mr-2" />
              Fill Test Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Jenis Barang</TableHead>
                <TableHead>Bentuk</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Dimensi</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Luas/item</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.jenisBarang}</TableCell>
                  <TableCell>{item.bentuk}</TableCell>
                  <TableCell>{item.grade}</TableCell>
                  <TableCell>{item.dimensi}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.luasPerItem}</TableCell>
                  <TableCell>{item.harga}</TableCell>
                  <TableCell>{item.satuan}</TableCell>
                  <TableCell>{item.diskon}</TableCell>
                  <TableCell>{item.total}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-gray-500 py-8">
                    Belum ada item yang ditambahkan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Subtotal</Label>
              <div className="text-lg font-semibold">{formatCurrency(subtotal)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Diskon</Label>
              <div className="text-lg font-semibold">{formatCurrency(totalDiscount)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">PPN (11%)</Label>
              <div className="text-lg font-semibold">{formatCurrency(ppn)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Harga SO</Label>
              <div className="text-xl font-bold text-green-700">{formatCurrency(totalHargaSO)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button size="lg" className="bg-green-600 hover:bg-green-700">
          Simpan SO
        </Button>
        <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
          Print SO
        </Button>
      </div>
    </div>
  );
}
