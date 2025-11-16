import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { getItemBarangOptions, getGudangOptions } from "@/services/masterDataService";

const urgencyOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export default function AddItemBarangRequestPage() {
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useAlert();

    const [formData, setFormData] = useState({
        item_barang_id: "",
        quantity: "",
        urgency_level: "medium",
        notes: "",
    });

    const [itemBarangOptions, setItemBarangOptions] = useState([]);
    const [gudangOptions, setGudangOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load item barang options and gudang options
    useEffect(() => {
        const loadItemBarangOptions = async () => {
            try {
                setLoading(true);
                const response = await getItemBarangOptions();
                if (response.success) {
                    setItemBarangOptions(response.data || []);
                }
                const gudangResp = await getGudangOptions();
                setGudangOptions(gudangResp || []);
            } catch (error) {
                console.error("Error loading item barang options:", error);
                showAlert("error", "Gagal memuat data item barang");
            } finally {
                setLoading(false);
            }
        };

        loadItemBarangOptions();
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

        if (!formData.quantity || formData.quantity <= 0) {
            errors.push("Quantity harus diisi dan lebih dari 0");
        }

        if (!formData.urgency_level) {
            errors.push("Urgency level harus dipilih");
        }

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
                ...formData,
                quantity: parseInt(formData.quantity),
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
                                    <Select
                                        value={formData.item_barang_id}
                                        onValueChange={(value) => handleInputChange("item_barang_id", value)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih item barang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {itemBarangOptions.map((item) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.nama} - {item.kode}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                        value={formData.quantity}
                                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                                        placeholder="Masukkan quantity"
                                    />
                                </div>

                                {/* Urgency Level */}
                                <div className="space-y-2">
                                    <Label htmlFor="urgency_level">
                                        Urgency Level <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.urgency_level}
                                        onValueChange={(value) => handleInputChange("urgency_level", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih urgency level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {urgencyOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Gudang Tujuan */}
                            <div className="space-y-2">
                                <Label>Gudang Tujuan</Label>
                                <Select
                                    value={formData.gudang_tujuan_id || ""}
                                    onValueChange={(value) => handleInputChange("gudang_tujuan_id", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih gudang tujuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gudangOptions.map(g => (
                                            <SelectItem key={g.value} value={g.value.toString()}>
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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