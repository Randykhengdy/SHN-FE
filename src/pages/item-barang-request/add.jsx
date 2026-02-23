import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import SearchSelect from "@/components/ui/search-select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { getItemBarangGroupOptions, getGudangOptions } from "@/services/masterDataService";
import { useAppContext } from "@/context/AppContext";

export default function AddItemBarangRequestPage() {
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useAlert();
    const { hasPermission } = useAppContext();
    const canCreate = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Create');

    const [formData, setFormData] = useState({
        gudang_tujuan_id: "",
        keterangan: "",
        details: [],
    });

    const [currentItem, setCurrentItem] = useState({
        item_barang_group_id: "",
        quantity: "",
        notes: "",
    });

    const [itemGroupOptions, setItemGroupOptions] = useState([]);
    const [gudangOptions, setGudangOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [groups, gudangResp] = await Promise.all([
                    getItemBarangGroupOptions(),
                    getGudangOptions()
                ]);
                setItemGroupOptions(groups || []);
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

    const handleAddItem = () => {
        if (!currentItem.item_barang_group_id) {
            showAlert("error", "Pilih item barang group terlebih dahulu");
            return;
        }
        if (!currentItem.quantity || parseInt(currentItem.quantity) <= 0) {
            showAlert("error", "Quantity harus lebih dari 0");
            return;
        }

        const selectedGroup = itemGroupOptions.find(o => o.value === currentItem.item_barang_group_id);

        setFormData(prev => ({
            ...prev,
            details: [
                ...prev.details,
                {
                    ...currentItem,
                    item_name: selectedGroup?.label || "Unknown Item",
                    quantity: parseInt(currentItem.quantity)
                }
            ]
        }));

        // Reset current item form
        setCurrentItem({
            item_barang_group_id: "",
            quantity: "",
            notes: "",
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            details: prev.details.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const errors = [];
        if (formData.details.length === 0) {
            errors.push("Minimal harus ada satu item dalam request");
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            showAlert("error", errors.join(", "));
            return;
        }

        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.create(formData);

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

    if (!canCreate) {
        return (
            <PageLayout title="Item Barang Request" category="TRANSAKSI">
                <div className="p-6">
                    <Card>
                        <CardContent className="p-6 text-center text-gray-600">Anda tidak memiliki akses Create untuk Item Barang Request</CardContent>
                    </Card>
                    <AlertComponent />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Item Barang Request" category="TRANSAKSI">
            <div className="space-y-6">
                <Card className="section-card">
                    <CardHeader className="section-header">
                        <div className="flex items-center justify-between">
                            <CardTitle className="page-title">Input Multi-Item Request</CardTitle>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="secondary" size="sm" onClick={() => navigate("/item-barang-request")} className="btn-secondary">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali ke List
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Header Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Gudang Tujuan</Label>
                                <SearchSelect
                                    placeholder="Pilih gudang tujuan"
                                    value={formData.gudang_tujuan_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, gudang_tujuan_id: val }))}
                                    options={gudangOptions}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Keterangan Request</Label>
                                <Input
                                    placeholder="Contoh: Request untuk Proyek A"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Add Detail Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 space-y-4">
                            <h3 className="font-semibold text-sm">Tambah Item ke Request</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Item Barang Group</Label>
                                    <SearchSelect
                                        placeholder="Pilih group barang"
                                        value={currentItem.item_barang_group_id}
                                        onValueChange={(val) => setCurrentItem(prev => ({ ...prev, item_barang_group_id: val }))}
                                        options={itemGroupOptions}
                                        loading={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        placeholder="Qty"
                                        value={currentItem.quantity}
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: e.target.value }))}
                                    />
                                </div>
                                <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Item
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes Item (Opsional)</Label>
                                <Input
                                    placeholder="Contoh: Cari yang grade A"
                                    value={currentItem.notes}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="space-y-2">
                            <Label>Daftar Item dalam Request</Label>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead>Nama Item Group</TableHead>
                                            <TableHead className="w-[100px] text-center">Qty</TableHead>
                                            <TableHead>Notes</TableHead>
                                            <TableHead className="w-[80px] text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.details.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-gray-500 italic">
                                                    Belum ada item ditambahkan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            formData.details.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{item.item_name}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-gray-600 italic text-sm">{item.notes || "-"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || formData.details.length === 0}
                                className="bg-green-600 hover:bg-green-700 w-full md:w-auto px-8"
                            >
                                {submitting ? "Menyimpan..." : "Simpan & Kirim Request"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <AlertComponent />
        </PageLayout>
    );
}
