import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchSelect from "@/components/ui/search-select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { getItemBarangOptionsPotongan, getGudangOptions } from "@/services/masterDataService";

// Urgency dihapus sesuai API (tidak digunakan)

export default function AddItemBarangRequestPage() {
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useAlert();

    const [formData, setFormData] = useState({
        item_barang_id: "",
        quantity: "",
        gudang_tujuan_id: "",
        notes: "",
    });

    const [itemBarangOptions, setItemBarangOptions] = useState([]);
    const [gudangOptions, setGudangOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedItemInfo, setSelectedItemInfo] = useState({ gudang_nama: "-", gudang_id: null, quantity: 0 });
    const isSingleStock = selectedItemInfo.quantity === 1;

    // Load item options and gudang options at mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [items, gudangResp] = await Promise.all([
                    getItemBarangOptionsPotongan({ jenis_potongan: 'utuh' }),
                    getGudangOptions()
                ]);
                setItemBarangOptions(items || []);
                setGudangOptions(gudangResp || []);
            } catch (error) {
                console.error("Error loading options:", error);
                showAlert("error", "Gagal memuat master data");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.item_barang_id) {
            errors.push("Item barang harus dipilih");
        }

        if (!formData.quantity || parseInt(formData.quantity) <= 0) {
            errors.push("Quantity harus diisi dan lebih dari 0");
        }
        if (selectedItemInfo.quantity && parseInt(formData.quantity || "0") > selectedItemInfo.quantity) {
            errors.push("Quantity melebihi stok tersedia");
        }

        // urgency dihapus

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            showAlert("error", errors.join(", "));
            return;
        }

        try {
            setSubmitting(true);

            const submitData = {
                item_barang_id: formData.item_barang_id,
                quantity: parseInt(formData.quantity),
                gudang_id: selectedItemInfo.gudang_id || null,
                gudang_tujuan_id: formData.gudang_tujuan_id || null,
                notes: formData.notes || "",
            };

            const response = await itemBarangRequestService.create(submitData);

            if (response.success) {
                showAlert("success", "Item barang request berhasil dibuat");
                navigate("/item-barang-request");
            } else {
                showAlert("error", response.message || "Gagal membuat request");
            }
        } catch (error) {
            console.error("Error creating request:", error);
            showAlert("error", "Terjadi kesalahan saat membuat request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/item-barang-request");
    };

    return (
        <PageLayout title="Tambah Item Barang Request">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Button>
                            <CardTitle>Form Tambah Item Barang Request</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Item Barang Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="item_barang_id">
                                        Item Barang <span className="text-red-500">*</span>
                                    </Label>
                                    <SearchSelect
                                        label=""
                                        placeholder="Pilih item barang"
                                        searchPlaceholder="Cari item (kode/nama)"
                                        value={formData.item_barang_id}
                                        onValueChange={async (value) => {
                                            handleInputChange("item_barang_id", value);
                                            const opt = itemBarangOptions.find(o => (o.value?.toString() === String(value)));
                                            const gudangNama = opt?.gudang_nama || "-";
                                            const gudangId = opt?.gudang_id || null;
                                            const qty = typeof opt?.quantity === 'number' ? opt.quantity : parseInt(opt?.quantity || 0);
                                            setSelectedItemInfo({ gudang_nama: gudangNama, gudang_id: gudangId, quantity: isNaN(qty) ? 0 : qty });
                                            if (!isNaN(qty) && qty === 1) {
                                                setFormData(prev => ({ ...prev, quantity: "1" }));
                                            }
                                        }}
                                        options={itemBarangOptions}
                                        loading={loading}
                                        required
                                        usePortal
                                        displayKey="label"
                                        valueKey="value"
                                        searchKey="searchKey"
                                    />
                                </div>

                                {/* Info Gudang Asal & Stock */}
                                <div className="space-y-2">
                                    <Label>Gudang Saat Ini</Label>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 rounded-md border bg-gray-50 text-gray-700 text-sm">
                                            {selectedItemInfo.gudang_nama}
                                        </span>
                                        <span className="px-3 py-1 rounded-md border bg-gray-50 text-gray-700 text-sm">
                                            Stock: {selectedItemInfo.quantity}
                                        </span>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">
                                        Quantity <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        max={selectedItemInfo.quantity ? selectedItemInfo.quantity.toString() : undefined}
                                        value={isSingleStock ? "1" : formData.quantity}
                                        disabled={isSingleStock}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            const n = parseInt(v || "0");
                                            const cap = selectedItemInfo.quantity || n;
                                            handleInputChange("quantity", Math.min(n, cap).toString());
                                        }}
                                        placeholder="Masukkan quantity"
                                    />
                                </div>

                                {/* Urgency dihapus */}
                            </div>

                            {/* Gudang Tujuan */}
                            <div className="space-y-2">
                                <Label>Gudang Tujuan</Label>
                                <SearchSelect
                                    placeholder="Pilih gudang tujuan"
                                    searchPlaceholder="Cari gudang"
                                    value={formData.gudang_tujuan_id || ""}
                                    onValueChange={(value) => handleInputChange("gudang_tujuan_id", value)}
                                    options={gudangOptions}
                                    displayKey="label"
                                    valueKey="value"
                                    searchKey="searchKey"
                                    usePortal
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    placeholder="Masukkan catatan tambahan (opsional)"
                                    rows={4}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-6">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {submitting ? "Menyimpan..." : "Simpan Request"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={submitting}
                                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <AlertComponent />
        </PageLayout>
    );
}
