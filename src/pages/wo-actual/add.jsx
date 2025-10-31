import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Plus, Trash2, Calendar, User, Package, FileText } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { woActualService } from '@/services/woActualService';
import { Label } from '@/components/ui/label';

export default function AddWOActualPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // Form State
  const [formData, setFormData] = useState({
    work_order_planning_id: '',
    nomor_wo_actual: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    jam_mulai: '',
    jam_selesai: '',
    status: 'Pending',
    catatan: '',
    prioritas: 'MEDIUM'
  });

  // WO Planning Options
  const [woPlanningList, setWoPlanningList] = useState([]);
  const [selectedWOPlanning, setSelectedWOPlanning] = useState(null);
  const [loadingWOPlanning, setLoadingWOPlanning] = useState(false);

  // Items State
  const [actualItems, setActualItems] = useState([]);

  // Loading State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load WO Planning options
  const loadWOPlanningOptions = useCallback(async () => {
    try {
      setLoadingWOPlanning(true);
      const response = await woActualService.getWOPlanningForActual();
      const planningList = response.data || response || [];
      setWoPlanningList(planningList);
    } catch (error) {
      console.error('Error loading WO Planning options:', error);
      showAlert('Error loading WO Planning options', 'error');
    } finally {
      setLoadingWOPlanning(false);
    }
  }, [showAlert]);

  // Load WO Planning detail when selected
  const handleWOPlanningChange = async (planningId) => {
    if (!planningId) {
      setSelectedWOPlanning(null);
      setActualItems([]);
      setFormData(prev => ({ ...prev, work_order_planning_id: '' }));
      return;
    }

    try {
      setLoading(true);
      // Find selected planning from list
      const planning = woPlanningList.find(p => p.id === planningId);
      if (planning) {
        setSelectedWOPlanning(planning);
        setFormData(prev => ({
          ...prev,
          work_order_planning_id: planningId,
          nomor_wo_actual: `WOA-${Date.now()}`
        }));

        // Initialize actual items based on planning items
        if (planning.items && planning.items.length > 0) {
          const initialItems = planning.items.map(item => ({
            work_order_item_id: item.id,
            jumlah_actual: 0,
            jumlah_cacat: 0,
            catatan: '',
            status: 'Pending',
            // Planning item details for display
            planning_item: item
          }));
          setActualItems(initialItems);
        }
      }
    } catch (error) {
      console.error('Error loading WO Planning detail:', error);
      showAlert('Error loading WO Planning detail', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle actual item changes
  const handleActualItemChange = (index, field, value) => {
    setActualItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Add new actual item
  const addActualItem = () => {
    if (!selectedWOPlanning) {
      showAlert('Please select WO Planning first', 'warning');
      return;
    }

    const newItem = {
      work_order_item_id: '',
      jumlah_actual: 0,
      jumlah_cacat: 0,
      catatan: '',
      status: 'Pending',
      planning_item: null
    };
    setActualItems(prev => [...prev, newItem]);
  };

  // Remove actual item
  const removeActualItem = (index) => {
    setActualItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save WO Actual
  const handleSave = async () => {
    try {
      // Validation
      if (!formData.work_order_planning_id) {
        showAlert('Please select WO Planning', 'warning');
        return;
      }

      if (!formData.tanggal_mulai) {
        showAlert('Please enter start date', 'warning');
        return;
      }

      if (actualItems.length === 0) {
        showAlert('Please add at least one actual item', 'warning');
        return;
      }

      setSaving(true);

      const saveData = {
        ...formData,
        items: actualItems.filter(item => item.work_order_item_id)
      };

      console.log('Saving WO Actual:', saveData);

      const response = await woActualService.createWOActual(saveData);
      
      if (response.success || response.data) {
        showAlert('WO Actual berhasil disimpan', 'success');
        setTimeout(() => {
          navigate('/wo-actual');
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to save WO Actual');
      }
    } catch (error) {
      console.error('Error saving WO Actual:', error);
      showAlert(error.message || 'Error saving WO Actual', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadWOPlanningOptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageLayout>
      <div className="space-y-6">
        <AlertComponent />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/wo-actual')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tambah WO Actual</h1>
              <p className="text-gray-600">Buat Work Order Actual baru</p>
            </div>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work_order_planning_id">WO Planning *</Label>
                    <Select
                      value={formData.work_order_planning_id}
                      onValueChange={(value) => handleWOPlanningChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih WO Planning" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingWOPlanning ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          woPlanningList.map((planning) => (
                            <SelectItem key={planning.id} value={planning.id}>
                              {planning.nomor_wo} - {planning.pelanggan?.nama || 'N/A'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nomor_wo_actual">No. WO Actual</Label>
                    <Input
                      id="nomor_wo_actual"
                      value={formData.nomor_wo_actual}
                      onChange={(e) => handleInputChange('nomor_wo_actual', e.target.value)}
                      placeholder="Auto generated"
                      readOnly
                    />
                  </div>

                  <div>
                    <Label htmlFor="tanggal_mulai">Tanggal Mulai *</Label>
                    <Input
                      id="tanggal_mulai"
                      type="date"
                      value={formData.tanggal_mulai}
                      onChange={(e) => handleInputChange('tanggal_mulai', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                    <Input
                      id="tanggal_selesai"
                      type="date"
                      value={formData.tanggal_selesai}
                      onChange={(e) => handleInputChange('tanggal_selesai', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="jam_mulai">Jam Mulai</Label>
                    <Input
                      id="jam_mulai"
                      type="time"
                      value={formData.jam_mulai}
                      onChange={(e) => handleInputChange('jam_mulai', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="jam_selesai">Jam Selesai</Label>
                    <Input
                      id="jam_selesai"
                      type="time"
                      value={formData.jam_selesai}
                      onChange={(e) => handleInputChange('jam_selesai', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="On Progress">On Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prioritas">Prioritas</Label>
                    <Select
                      value={formData.prioritas}
                      onValueChange={(value) => handleInputChange('prioritas', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="catatan">Catatan</Label>
                  <Textarea
                    id="catatan"
                    value={formData.catatan}
                    onChange={(e) => handleInputChange('catatan', e.target.value)}
                    placeholder="Catatan tambahan..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actual Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item Actual
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addActualItem}
                    className="flex items-center gap-2"
                    disabled={!selectedWOPlanning}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {actualItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {!selectedWOPlanning 
                      ? 'Pilih WO Planning terlebih dahulu'
                      : 'Belum ada item actual. Klik "Tambah Item" untuk menambah.'
                    }
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Planning</TableHead>
                          <TableHead>Qty Planning</TableHead>
                          <TableHead>Qty Actual</TableHead>
                          <TableHead>Qty Cacat</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Catatan</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actualItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.planning_item ? (
                                <div>
                                  <div className="font-medium">
                                    {item.planning_item.jenis_barang?.nama || 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.planning_item.bentuk_barang?.nama || 'N/A'} - 
                                    {item.planning_item.grade_barang?.nama || 'N/A'}
                                  </div>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {item.planning_item?.jumlah || 0}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.jumlah_actual}
                                onChange={(e) => handleActualItemChange(index, 'jumlah_actual', parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.jumlah_cacat}
                                onChange={(e) => handleActualItemChange(index, 'jumlah_cacat', parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="0"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.status}
                                onValueChange={(value) => handleActualItemChange(index, 'status', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="On Progress">On Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.catatan}
                                onChange={(e) => handleActualItemChange(index, 'catatan', e.target.value)}
                                placeholder="Catatan..."
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeActualItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* WO Planning Info */}
            {selectedWOPlanning && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Info WO Planning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">No. WO</Label>
                    <p className="text-sm">{selectedWOPlanning.nomor_wo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pelanggan</Label>
                    <p className="text-sm">{selectedWOPlanning.pelanggan?.nama || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Gudang</Label>
                    <p className="text-sm">{selectedWOPlanning.gudang?.nama || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tanggal WO</Label>
                    <p className="text-sm">{selectedWOPlanning.tanggal_wo || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant="outline" className="text-xs">
                      {selectedWOPlanning.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Item:</span>
                  <span className="text-sm font-medium">{actualItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Qty Actual:</span>
                  <span className="text-sm font-medium">
                    {actualItems.reduce((sum, item) => sum + (item.jumlah_actual || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Qty Cacat:</span>
                  <span className="text-sm font-medium text-red-600">
                    {actualItems.reduce((sum, item) => sum + (item.jumlah_cacat || 0), 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}