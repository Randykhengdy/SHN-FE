import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Plus, Trash2, Calendar, User, Package, FileText, Search } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { woActualService } from '@/services/woActualService';
import { Label } from '@/components/ui/label';

export default function AddWOActualPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // Form State - Updated to match new API structure
  const [formData, setFormData] = useState({
    planningWorkOrderId: '',
    actualWorkOrderId: '',
    tanggal_mulai: new Date().toISOString().split('T')[0], // Default to today
    jam_mulai: '',
    jam_selesai: '',
    status: 'Pending', // Default status
    prioritas: 'MEDIUM', // Default priority
    catatan: '',
    foto_bukti: null, // Will store base64 encoded image
    foto_bukti_preview: null // For preview display
  });

  // WO Planning Options
  const [woPlanningList, setWoPlanningList] = useState([]);
  const [selectedWOPlanning, setSelectedWOPlanning] = useState(null);
  const [loadingWOPlanning, setLoadingWOPlanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Items State - Updated structure
  const [actualItems, setActualItems] = useState({});

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

  // Filter WO Planning based on search term
  const filteredWOPlanningList = woPlanningList.filter(planning => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      planning.nomor_wo?.toLowerCase().includes(searchLower) ||
      planning.pelanggan?.nama?.toLowerCase().includes(searchLower) ||
      planning.id?.toString().includes(searchLower)
    );
  });

  // Load WO Planning detail when selected
  const handleWOPlanningChange = async (planningId) => {
    if (!planningId) {
      setSelectedWOPlanning(null);
      setActualItems({});
      setFormData(prev => ({ ...prev, planningWorkOrderId: '' }));
      return;
    }

    try {
      setLoading(true);
      // Find selected planning from list
      const planning = woPlanningList.find(p => p.id === planningId);
      console.log('Selected planning:', planning);
      
      if (planning) {
        setSelectedWOPlanning(planning);
        setFormData(prev => ({
          ...prev,
          planningWorkOrderId: planningId,
          actualWorkOrderId: planning.id // Use planning ID as actual ID for now
        }));

        // Initialize actual items based on planning items with new structure
        if (planning.items && planning.items.length > 0) {
          console.log('Planning items:', planning.items);
          const initialItems = {};
          planning.items.forEach(item => {
            initialItems[item.id] = {
              qtyActual: item.jumlah || 0, // Mirror planning quantity as default
              beratActual: item.berat || 0, // Mirror planning weight as default
              timestamp: new Date().toISOString(),
              assignments: []
            };
          });
          console.log('Initial actual items:', initialItems);
          setActualItems(initialItems);
        } else {
          console.log('No items found in planning, creating sample items');
          // Create sample items if planning doesn't have items
          const sampleItems = {
            'sample-1': {
              qtyActual: 0,
              beratActual: 0,
              timestamp: new Date().toISOString(),
              assignments: []
            }
          };
          setActualItems(sampleItems);
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
  const handleActualItemChange = (itemId, field, value) => {
    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
        timestamp: new Date().toISOString() // Update timestamp on any change
      }
    }));
  };

  // Add assignment to item
  const addAssignment = (itemId) => {
    const newAssignment = {
      id: Date.now(), // Temporary ID
      qty: 0,
      berat: 0,
      pelaksana: '',
      pelaksana_id: null,
      tanggal: new Date().toISOString().split('T')[0],
      jamMulai: '',
      jamSelesai: '',
      catatan: '',
      status: 'Pending'
    };

    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        assignments: [...(prev[itemId]?.assignments || []), newAssignment]
      }
    }));
  };

  // Remove assignment from item
  const removeAssignment = (itemId, assignmentIndex) => {
    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        assignments: prev[itemId].assignments.filter((_, index) => index !== assignmentIndex)
      }
    }));
  };

  // Handle assignment changes
  const handleAssignmentChange = (itemId, assignmentIndex, field, value) => {
    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        assignments: prev[itemId].assignments.map((assignment, index) => 
          index === assignmentIndex 
            ? { ...assignment, [field]: value }
            : assignment
        )
      }
    }));
  };

  // Handle foto bukti upload
  const handleFotoBuktiChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showAlert('Please select an image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setFormData(prev => ({
          ...prev,
          foto_bukti: base64,
          foto_bukti_preview: base64
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove foto bukti
  const removeFotoBukti = () => {
    setFormData(prev => ({
      ...prev,
      foto_bukti: '',
      foto_bukti_preview: ''
    }));
  };

  // Save WO Actual
  const handleSave = async () => {
    try {
      // Validation
      if (!formData.planningWorkOrderId) {
        showAlert('Please select WO Planning', 'warning');
        return;
      }

      if (!formData.tanggal_mulai) {
        showAlert('Please enter start date', 'warning');
        return;
      }

      // Validate that at least one item has actual data
      const hasActualData = Object.keys(actualItems).some(itemId => {
        const item = actualItems[itemId];
        return item.qtyActual > 0 || item.beratActual > 0 || item.assignments.length > 0;
      });

      if (!hasActualData) {
         showAlert('Please enter actual data for at least one item', 'warning');
         return;
       }

      setSaving(true);

      // Prepare data according to new API structure
      const saveData = {
        planningWorkOrderId: formData.planningWorkOrderId,
        actualWorkOrderId: formData.actualWorkOrderId,
        tanggal_mulai: formData.tanggal_mulai,
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
        status: formData.status,
        prioritas: formData.prioritas,
        catatan: formData.catatan || '',
        foto_bukti: formData.foto_bukti || '',
        items: actualItems
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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
                    <Label htmlFor="planningWorkOrderId">WO Planning *</Label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder={selectedWOPlanning ? selectedWOPlanning.nomor_wo : "Cari WO Planning..."}
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Dropdown */}
                      {showDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {loadingWOPlanning ? (
                            <div className="p-3 text-center text-gray-500">Loading...</div>
                          ) : filteredWOPlanningList.length === 0 ? (
                            <div className="p-3 text-center text-gray-500">
                              {searchTerm ? 'Tidak ada WO Planning yang cocok' : 'Tidak ada WO Planning tersedia'}
                            </div>
                          ) : (
                            filteredWOPlanningList.map((planning) => (
                              <div
                                key={planning.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  handleWOPlanningChange(planning.id);
                                  setSearchTerm('');
                                  setShowDropdown(false);
                                }}
                              >
                                <div className="font-medium text-gray-900">
                                  {planning.nomor_wo}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="actualWorkOrderId">Actual WO ID</Label>
                    <Input
                      id="actualWorkOrderId"
                      value={formData.actualWorkOrderId}
                      onChange={(e) => handleInputChange('actualWorkOrderId', e.target.value)}
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
                        <SelectValue placeholder="Pilih Status" />
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
                        <SelectValue placeholder="Pilih Prioritas" />
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

                {/* Foto Bukti Upload */}
                <div>
                  <Label htmlFor="foto_bukti">Foto Bukti</Label>
                  <div className="space-y-2">
                    <Input
                      id="foto_bukti"
                      type="file"
                      accept="image/*"
                      onChange={handleFotoBuktiChange}
                      className="cursor-pointer"
                    />
                    {formData.foto_bukti_preview && (
                      <div className="relative inline-block">
                        <img
                          src={formData.foto_bukti_preview}
                          alt="Preview foto bukti"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeFotoBukti}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Format: JPG, PNG, GIF. Maksimal 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actual Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(actualItems).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {!selectedWOPlanning 
                      ? 'Pilih WO Planning terlebih dahulu'
                      : 'Belum ada item actual. Item akan muncul setelah memilih WO Planning.'
                    }
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Display items from planning if available, otherwise show actual items */}
                    {selectedWOPlanning?.items && selectedWOPlanning.items.length > 0 ? (
                      selectedWOPlanning.items.map((planningItem) => {
                        const actualItem = actualItems[planningItem.id] || {};
                        return (
                          <Card key={planningItem.id} className="p-4">
                            <div className="space-y-4">
                              {/* Item Header */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">
                                    {planningItem.jenis_barang?.nama || 'Item'}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {planningItem.bentuk_barang?.nama || 'Bentuk'} - 
                                    {planningItem.grade_barang?.nama || 'Grade'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Qty Planning: {planningItem.jumlah || 0}
                                  </p>
                                </div>
                              </div>

                              {/* Actual Data */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Qty Actual</Label>
                                  <Input
                                    type="number"
                                    value={actualItem.qtyActual || 0}
                                    onChange={(e) => handleActualItemChange(planningItem.id, 'qtyActual', parseInt(e.target.value) || 0)}
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <Label>Berat Actual (kg)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={actualItem.beratActual || 0}
                                    onChange={(e) => handleActualItemChange(planningItem.id, 'beratActual', parseFloat(e.target.value) || 0)}
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Select
                                    value={actualItem.status || 'PENDING'}
                                    onValueChange={(value) => handleActualItemChange(planningItem.id, 'status', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">Pending</SelectItem>
                                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                      <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      // Fallback: show actual items even without planning items
                      Object.keys(actualItems).map((itemId) => {
                        const actualItem = actualItems[itemId];
                        return (
                          <Card key={itemId} className="p-4">
                            <div className="space-y-4">
                              {/* Item Header */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">Item Actual</h4>
                                  <p className="text-sm text-gray-500">
                                    Item dari WO Planning yang dipilih
                                  </p>
                                </div>
                              </div>

                              {/* Actual Data */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Qty Actual</Label>
                                  <Input
                                    type="number"
                                    value={actualItem.qtyActual || 0}
                                    onChange={(e) => handleActualItemChange(itemId, 'qtyActual', parseInt(e.target.value) || 0)}
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <Label>Berat Actual (kg)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={actualItem.beratActual || 0}
                                    onChange={(e) => handleActualItemChange(itemId, 'beratActual', parseFloat(e.target.value) || 0)}
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Select
                                    value={actualItem.status || 'PENDING'}
                                    onValueChange={(value) => handleActualItemChange(itemId, 'status', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">Pending</SelectItem>
                                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                      <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
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
                  <span className="text-sm font-medium">{Object.keys(actualItems).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Qty Actual:</span>
                  <span className="text-sm font-medium">
                    {Object.values(actualItems).reduce((sum, item) => sum + (item.qtyActual || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Berat Actual:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {Object.values(actualItems).reduce((sum, item) => sum + (item.beratActual || 0), 0)} kg
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