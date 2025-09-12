import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSelect from '@/components/ui/search-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Package, Users } from 'lucide-react';
import { 
  getJenisBarangOptions, 
  getBentukBarangOptions, 
  getGradeBarangOptions,
  getPelaksanaOptions
} from '@/services/masterDataService';
import PelaksanaModal from './PelaksanaModal';

export default function WorkOrderItemEditModal({ 
  isOpen, 
  onClose, 
  item, 
  onSave,
  selectedPlatDasar,
  onPlatDasarChange,
  isLuasCukup,
  selectedSalesOrder,
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
    catatan: '',
    pelaksana: []
  });

  // Master Data State
  const [jenisBarangList, setJenisBarangList] = useState([]);
  const [bentukBarangList, setBentukBarangList] = useState([]);
  const [gradeBarangList, setGradeBarangList] = useState([]);
  const [pelaksanaList, setPelaksanaList] = useState([]);

  // Loading State
  const [loadingJenisBarang, setLoadingJenisBarang] = useState(false);
  const [loadingBentukBarang, setLoadingBentukBarang] = useState(false);
  const [loadingGradeBarang, setLoadingGradeBarang] = useState(false);
  const [loadingPelaksana, setLoadingPelaksana] = useState(false);

  // Pelaksana Modal State
  const [pelaksanaModalOpen, setPelaksanaModalOpen] = useState(false);

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
        catatan: item.catatan || '',
        pelaksana: item.pelaksana || []
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
    setLoadingPelaksana(true);

    try {
      const [jenisBarang, bentukBarang, gradeBarang, pelaksana] = await Promise.all([
        getJenisBarangOptions(),
        getBentukBarangOptions(),
        getGradeBarangOptions(),
        getPelaksanaOptions()
      ]);

      setJenisBarangList(jenisBarang);
      setBentukBarangList(bentukBarang);
      setGradeBarangList(gradeBarang);
      setPelaksanaList(pelaksana);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setLoadingJenisBarang(false);
      setLoadingBentukBarang(false);
      setLoadingGradeBarang(false);
      setLoadingPelaksana(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to calculate required area based on dimension
  const calculateRequiredArea = (item) => {
    const panjang = parseFloat(item.panjang || 0);
    const lebar = parseFloat(item.lebar || 0);
    const qty = parseInt(item.qty || 0);
    
    // Get bentuk barang info to determine dimension
    const bentukBarang = bentukBarangList.find(b => b.value === item.bentuk_barang_id);
    
    if (bentukBarang && bentukBarang.dimensi === '1D') {
      // For 1D (shaft), only use panjang
      return panjang * qty;
    } else {
      // For 2D (plat), use panjang × lebar
      return panjang * lebar * qty;
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const openPlatDasarModal = () => {
    // This would open the plat dasar selection modal
    // For now, we'll just show a placeholder
    console.log('Open plat dasar modal for item:', item.id);
  };

  const openPelaksanaModal = () => {
    setPelaksanaModalOpen(true);
  };

  const savePelaksana = (rows) => {
    setFormData(prev => ({
      ...prev,
      pelaksana: rows
    }));
    setPelaksanaModalOpen(false);
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Plat Dasar and Pelaksana Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plat Dasar
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openPlatDasarModal}
                    disabled={!formData.jenis_barang_id || !formData.bentuk_barang_id || !formData.grade_barang_id || !formData.tebal}
                    className="text-xs"
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Pilih Plat Dasar
                  </Button>
                  {selectedPlatDasar && selectedPlatDasar.length > 0 && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {(() => {
                        const totalDibutuhkan = calculateRequiredArea(formData);
                        const isCukup = isLuasCukup ? isLuasCukup(item.id, totalDibutuhkan) : false;
                        return `${selectedPlatDasar.length} • ${isCukup ? 'Cukup' : 'Kurang'}`;
                      })()}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelaksana
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openPelaksanaModal}
                  className="text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Kelola Pelaksana ({formData.pelaksana.length})
                </Button>
              </div>
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

      {/* Pelaksana Modal */}
      <PelaksanaModal
        isOpen={pelaksanaModalOpen}
        onClose={() => setPelaksanaModalOpen(false)}
        onSave={savePelaksana}
        initialData={formData.pelaksana}
        pelaksanaList={pelaksanaList}
        loadingPelaksana={loadingPelaksana}
      />
    </div>
  );
}
