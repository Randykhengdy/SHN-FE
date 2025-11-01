import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { warehouseTransferRequestService } from "@/services/warehouseTransferRequestService";
import { gudangService } from "@/services/gudangService";
import { itemBarangService } from "@/services/itemBarangService";

const WarehouseTransferRequestAdd = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    item_id: "",
    quantity: "",
    notes: "",
    urgency_level: "normal"
  });

  useEffect(() => {
    fetchWarehouses();
    fetchItems();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await gudangService.getAll();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Gagal memuat data gudang");
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemBarangService.getAll();
      setItems(response.data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Gagal memuat data item");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ["from_warehouse_id", "to_warehouse_id", "item_id", "quantity"];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return false;
    }

    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      toast.error("Gudang asal dan tujuan tidak boleh sama");
      return false;
    }

    if (parseInt(formData.quantity) <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      await warehouseTransferRequestService.create(formData);
      toast.success("Warehouse transfer request berhasil dibuat");
      navigate("/warehouse-transfer-request");
    } catch (error) {
      console.error("Error creating warehouse transfer request:", error);
      toast.error("Gagal membuat warehouse transfer request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/warehouse-transfer-request")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Tambah Warehouse Transfer Request</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="from_warehouse_id">Dari Gudang *</Label>
                <Select
                  value={formData.from_warehouse_id}
                  onValueChange={(value) => handleInputChange("from_warehouse_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gudang asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.nama_gudang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_warehouse_id">Ke Gudang *</Label>
                <Select
                  value={formData.to_warehouse_id}
                  onValueChange={(value) => handleInputChange("to_warehouse_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gudang tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.nama_gudang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_id">Item *</Label>
                <Select
                  value={formData.item_id}
                  onValueChange={(value) => handleInputChange("item_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.nama_barang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  placeholder="Masukkan jumlah"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency_level">Tingkat Urgensi</Label>
                <Select
                  value={formData.urgency_level}
                  onValueChange={(value) => handleInputChange("urgency_level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat urgensi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                    <SelectItem value="urgent">Mendesak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Masukkan catatan tambahan (opsional)"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/warehouse-transfer-request")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseTransferRequestAdd;