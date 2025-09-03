import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info, Package, Ruler } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import { request } from '@/lib/request';

export default function SelectPlatShaftDasar({ 
  jenisBarangId, 
  bentukBarangId, 
  gradeBarangId, 
  tebal, 
  totalDibutuhkan,
  onSelectionChange,
  onClose 
}) {
  const { showAlert } = useAlert();
  const [saranItems, setSaranItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalTercukupi, setTotalTercukupi] = useState(0);

  // Load saran plat/shaft dasar
  useEffect(() => {
    if (jenisBarangId && bentukBarangId && gradeBarangId && tebal) {
      loadSaranPlatDasar();
    }
  }, [jenisBarangId, bentukBarangId, gradeBarangId, tebal]);

  // Calculate total tercukupi when selection changes
  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => sum + item.sisa_luas, 0);
    setTotalTercukupi(total);
  }, [selectedItems]);

  const loadSaranPlatDasar = async () => {
    setLoading(true);
    try {
      const response = await request('/work-order-planning/get-saran-plat-dasar', {
        method: 'POST',
        body: JSON.stringify({
          jenis_barang_id: jenisBarangId,
          bentuk_barang_id: bentukBarangId,
          grade_barang_id: gradeBarangId,
          tebal: tebal
        })
      });

      if (response.success) {
        setSaranItems(response.data || []);
        setSelectedItems([]);
      } else {
        showAlert('Error', 'Gagal memuat saran plat/shaft dasar', 'error');
      }
    } catch (error) {
      console.error('Error loading saran plat dasar:', error);
      showAlert('Error', 'Gagal memuat saran plat/shaft dasar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (item, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    }
  };

  const handlePilih = () => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
    if (onClose) {
      onClose();
    }
  };

  const isPilihDisabled = totalTercukupi < (totalDibutuhkan * 1.1); // 110% tolerance

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="w-6 h-6" />
              SARAN PLAT/SHAFT DASAR
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Recommendation Logic Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Logic Saran plat/shaft dasar:</p>
                  <p>Mengurutkan plat/shaft yang memiliki JENIS, BENTUK, GRADE, dan TEBAL yang sama dari yang luasnya terkecil, sampai terbesar, dengan syarat muat untuk dipotong sesuai dengan jumlah x ukuran potongan</p>
                </div>
              </div>
            </div>

            {/* Summary Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Total panjang / luas dibutuhkan:</span>
                </div>
                <p className="text-blue-700">{totalDibutuhkan} × 110% (toleransi)</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Luas tercukupi:</span>
                </div>
                <p className="text-green-700 text-xl font-semibold">{totalTercukupi}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12">
                      Pilih
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Nama Barang
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Ukuran
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Sisa Luas
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Gambar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : saranItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        Tidak ada saran plat/shaft dasar yang sesuai
                      </td>
                    </tr>
                  ) : (
                    saranItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedItems.some(selected => selected.id === item.id)}
                            onCheckedChange={(checked) => handleItemSelection(item, checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.nama || 'Nama Item Barang'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700">
                            {item.ukuran || 'Ukuran'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="font-mono">
                            {item.sisa_luas}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            Gambar plat/shaft
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Batal
              </Button>
              
              <div className="flex items-center gap-4">
                {/* Disabled Logic Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-yellow-800">
                      Akan disabled selama total ukuran base plat/shaft yang dipilih lebih kecil daripada total ukuran yang dibutuhkan
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={handlePilih}
                  disabled={isPilihDisabled}
                  className="px-6"
                >
                  Pilih
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
