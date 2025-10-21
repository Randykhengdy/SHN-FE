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
        tebal: item.tebal || '0',
        qty: item.qty || '0',
        jenis_barang_id: item.jenis_barang_id || '',
        bentuk_barang_id: item.bentuk_barang_id || '',
        grade_barang_id: item.grade_barang_id || '',
        jenis_potongan: item.jenis_potongan || 'potongan',
        catatan: item.catatan || ''
      });
    }
  }, [item]);

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panjang (mm) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.panjang}
                  onChange={(e) => handleInputChange('panjang', e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lebar (mm) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.lebar}
                  onChange={(e) => handleInputChange('lebar', e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tebal (mm) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tebal}
                  onChange={(e) => handleInputChange('tebal', e.target.value)}
                  className="h-9"
                />
              </div>
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
