import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSelect from '@/components/ui/search-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import {
  getJenisBarangOptions,
  getBentukBarangOptions,
  getGradeBarangOptions
} from '@/services/masterDataService';

export default function WorkOrderItemEditModal({
  isOpen,
  onClose,
  item,
  onSave,
  isNewItem = false
}) {
  const [formData, setFormData] = useState({
    panjang: '0',
    lebar: '0',
    tebal: '0',
    diameter: '0',
    diameter_luar: '0',
    diameter_dalam: '0',
    sisi1: '0',
    sisi2: '0',
    qty: '0',
    jenis_barang_id: '',
    bentuk_barang_id: '',
    grade_barang_id: '',
    jenis_potongan: 'potongan',
    catatan: ''
  });

  // Master Data State
  const [jenisBarangList, setJenisBarangList] = useState([]);
  const [bentukBarangList, setBentukBarangList] = useState([]);
  const [gradeBarangList, setGradeBarangList] = useState([]);

  // Active Dimension Rules State
  const [activeTipeBarang, setActiveTipeBarang] = useState(null);

  // Loading State
  const [loadingJenisBarang, setLoadingJenisBarang] = useState(false);
  const [loadingBentukBarang, setLoadingBentukBarang] = useState(false);
  const [loadingGradeBarang, setLoadingGradeBarang] = useState(false);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        panjang: item.panjang || '0',
        lebar: item.lebar || '0',
        tebal: item.tebal || item.ketebalan || '0',
        diameter: item.diameter || '0',
        diameter_luar: item.diameter_luar || '0',
        diameter_dalam: item.diameter_dalam || '0',
        sisi1: item.sisi1 || '0',
        sisi2: item.sisi2 || '0',
        qty: item.qty || '0',
        jenis_barang_id: item.jenis_barang_id || '',
        bentuk_barang_id: item.bentuk_barang_id || '',
        grade_barang_id: item.grade_barang_id || '',
        jenis_potongan: item.jenis_potongan || 'potongan',
        catatan: item.catatan || ''
      });
    }
  }, [item]);

  // Update activeTipeBarang when bentuk_barang_id or master data changes
  useEffect(() => {
    if (formData.bentuk_barang_id && bentukBarangList.length > 0) {
      const selectedBentuk = bentukBarangList.find(b => b.value === formData.bentuk_barang_id || b.id === formData.bentuk_barang_id);
      if (selectedBentuk && (selectedBentuk.tipe_barang || selectedBentuk.tipeBarang)) {
        setActiveTipeBarang(selectedBentuk.tipe_barang || selectedBentuk.tipeBarang);
      } else {
        setActiveTipeBarang(null);
      }
    } else {
      setActiveTipeBarang(null);
    }
  }, [formData.bentuk_barang_id, bentukBarangList]);

  // Load master data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  const loadMasterData = async () => {
    setLoadingJenisBarang(true);
    setLoadingBentukBarang(true);
    setLoadingGradeBarang(true);

    try {
      const [jenisBarang, bentukBarang, gradeBarang] = await Promise.all([
        getJenisBarangOptions(),
        getBentukBarangOptions(),
        getGradeBarangOptions()
      ]);

      setJenisBarangList(jenisBarang);
      setBentukBarangList(bentukBarang);
      setGradeBarangList(gradeBarang);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setLoadingJenisBarang(false);
      setLoadingBentukBarang(false);
      setLoadingGradeBarang(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {isNewItem ? 'Tambah Item Work Order' : 'Edit Item Work Order'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dimensi Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const renderInput = (field, label) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label} (mm) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="h-9"
                    />
                  </div>
                );

                const inputs = [];

                if (activeTipeBarang) {
                  // Render based on activeTipeBarang rules
                  if (activeTipeBarang.diameter_luar) inputs.push(renderInput('diameter_luar', 'Diameter Luar'));
                  if (activeTipeBarang.diameter_dalam) inputs.push(renderInput('diameter_dalam', 'Diameter Dalam'));
                  if (activeTipeBarang.diameter) inputs.push(renderInput('diameter', 'Diameter'));
                  if (activeTipeBarang.sisi1) inputs.push(renderInput('sisi1', 'Sisi 1'));
                  if (activeTipeBarang.sisi2) inputs.push(renderInput('sisi2', 'Sisi 2'));
                  if (activeTipeBarang.tebal) inputs.push(renderInput('tebal', 'Tebal'));
                  if (activeTipeBarang.lebar) inputs.push(renderInput('lebar', 'Lebar'));
                  if (activeTipeBarang.panjang) inputs.push(renderInput('panjang', 'Panjang'));
                } else {
                  // Fallback to default
                  inputs.push(renderInput('panjang', 'Panjang'));
                  inputs.push(renderInput('lebar', 'Lebar'));
                  inputs.push(renderInput('tebal', 'Tebal'));
                }

                // Ensure panjang is always there just in case
                if (!inputs.find(el => el.key === 'panjang') && (!activeTipeBarang || activeTipeBarang.panjang !== false)) {
                  inputs.push(renderInput('panjang', 'Panjang'));
                }

                return inputs;
              })()}
            </div>

            {/* Qty and Master Data Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qty *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.qty}
                  onChange={(e) => handleInputChange('qty', parseInt(e.target.value))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Barang *
                </label>
                <SearchSelect
                  label=""
                  options={jenisBarangList}
                  value={formData.jenis_barang_id ? formData.jenis_barang_id.toString() : ''}
                  onValueChange={(value) => handleInputChange('jenis_barang_id', parseInt(value))}
                  placeholder="Pilih jenis"
                  loading={loadingJenisBarang}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bentuk Barang *
                </label>
                <SearchSelect
                  label=""
                  options={bentukBarangList}
                  value={formData.bentuk_barang_id ? formData.bentuk_barang_id.toString() : ''}
                  onValueChange={(value) => handleInputChange('bentuk_barang_id', parseInt(value))}
                  placeholder="Pilih bentuk"
                  loading={loadingBentukBarang}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Barang *
                </label>
                <SearchSelect
                  label=""
                  options={gradeBarangList}
                  value={formData.grade_barang_id ? formData.grade_barang_id.toString() : ''}
                  onValueChange={(value) => handleInputChange('grade_barang_id', parseInt(value))}
                  placeholder="Pilih grade"
                  loading={loadingGradeBarang}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Potongan *
                </label>
                <SearchSelect
                  label=""
                  options={[
                    { value: 'utuh', label: 'Utuh' },
                    { value: 'potongan', label: 'Potongan' }
                  ]}
                  value={formData.jenis_potongan || 'potongan'}
                  onValueChange={(value) => handleInputChange('jenis_potongan', value)}
                  placeholder="Pilih jenis"
                />
              </div>
            </div>

            {/* Catatan Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <Input
                placeholder="Catatan..."
                value={formData.catatan}
                onChange={(e) => handleInputChange('catatan', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                className="px-6"
              >
                {isNewItem ? 'Tambah' : 'Simpan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
