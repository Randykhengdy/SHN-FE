import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSelect from '@/components/ui/search-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, Users, Package } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { workOrderService } from '@/services/workOrderService';
import { 
  getGudangOptions, 
  getJenisBarangOptions, 
  getBentukBarangOptions, 
  getGradeBarangOptions,
  getPelangganFromSOHeader,
  getPelaksanaOptions,
  getPelangganOptions,
  getSalesOrderOptions
} from '@/services/masterDataService';

export default function AddWorkOrderPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  // Work Order Planning State
  const [workOrderData, setWorkOrderData] = useState({
    nomor_wo: '',
    tanggal_wo: new Date().toISOString().split('T')[0],
    tanggal_target: '',
    gudang_id: '',
    pelanggan_id: '',
    sales_order_id: '',
    catatan: '',
    status: 'Pending'
  });

  // Work Order Items State
  const [workOrderItems, setWorkOrderItems] = useState([
    {
      id: 1,
      panjang: '',
      lebar: '',
      tebal: '',
      qty: 1,
      jenis_barang_id: '',
      bentuk_barang_id: '',
      grade_barang_id: '',
      catatan: '',
      pelaksana: []
    }
  ]);

  // Master Data State
  const [gudangList, setGudangList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [jenisBarangList, setJenisBarangList] = useState([]);
  const [bentukBarangList, setBentukBarangList] = useState([]);
  const [gradeBarangList, setGradeBarangList] = useState([]);
  const [pelaksanaList, setPelaksanaList] = useState([]);
  const [salesOrderList, setSalesOrderList] = useState([]);

  // Loading State
  const [loading, setLoading] = useState(false);
  const [loadingGudang, setLoadingGudang] = useState(false);
  const [loadingPelanggan, setLoadingPelanggan] = useState(false);
  const [loadingJenisBarang, setLoadingJenisBarang] = useState(false);
  const [loadingBentukBarang, setLoadingBentukBarang] = useState(false);
  const [loadingGradeBarang, setLoadingGradeBarang] = useState(false);
  const [loadingPelaksana, setLoadingPelaksana] = useState(false);
  const [loadingSalesOrder, setLoadingSalesOrder] = useState(false);

  // Load master data on component mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('Loading master data...');
        
        const [
          gudang,
          jenisBarang,
          bentukBarang,
          gradeBarang,
          pelaksana
        ] = await Promise.all([
          getGudangOptions(),
          getJenisBarangOptions(),
          getBentukBarangOptions(),
          getGradeBarangOptions(),
          getPelaksanaOptions()
        ]);

        console.log('Gudang data:', gudang);
        console.log('Jenis Barang data:', jenisBarang);
        console.log('Bentuk Barang data:', bentukBarang);
        console.log('Grade Barang data:', gradeBarang);
        console.log('Pelaksana data:', pelaksana);

        // Set data directly like sales order does
        setGudangList(gudang);
        setJenisBarangList(jenisBarang);
        setBentukBarangList(bentukBarang);
        setGradeBarangList(gradeBarang);
        setPelaksanaList(pelaksana);
        
        // Load pelanggan separately since it needs different handling
        try {
          const [pelangganResponse, salesOrderResponse] = await Promise.all([
            getPelangganOptions({ per_page: 100 }),
            getSalesOrderOptions()
          ]);
          
          console.log('Pelanggan response:', pelangganResponse);
          console.log('Sales Order response:', salesOrderResponse);
          
          if (pelangganResponse?.data) {
            const pelangganOptions = pelangganResponse.data.map(item => ({
              value: item.id?.toString() || item.kode,
              label: item.nama || item.nama_pelanggan,
              searchKey: item.nama || item.nama_pelanggan
            }));
            setPelangganList(pelangganOptions);
            console.log('Pelanggan options:', pelangganOptions);
          }
          
          // Set sales order data
          setSalesOrderList(salesOrderResponse || []);
          
        } catch (error) {
          console.error('Error loading additional data:', error);
        }
        
        console.log('State set - gudangList:', gudang);
        console.log('State set - pelangganList:', pelangganList);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, []);

  // Add new work order item
  const addWorkOrderItem = () => {
    const newItem = {
      id: Date.now(),
      panjang: '',
      lebar: '',
      tebal: '',
      qty: 1,
      jenis_barang_id: '',
      bentuk_barang_id: '',
      grade_barang_id: '',
      catatan: '',
      pelaksana: []
    };
    setWorkOrderItems([...workOrderItems, newItem]);
  };

  // Remove work order item
  const removeWorkOrderItem = (itemId) => {
    if (workOrderItems.length > 1) {
      setWorkOrderItems(workOrderItems.filter(item => item.id !== itemId));
    }
  };

  // Update work order item
  const updateWorkOrderItem = (itemId, field, value) => {
    setWorkOrderItems(workOrderItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Add pelaksana to item
  const addPelaksanaToItem = (itemId) => {
    const item = workOrderItems.find(item => item.id === itemId);
    if (item) {
      const newPelaksana = {
        id: Date.now(),
        pelaksana_id: '',
        qty: 1,
        catatan: ''
      };
      updateWorkOrderItem(itemId, 'pelaksana', [...item.pelaksana, newPelaksana]);
    }
  };

  // Remove pelaksana from item
  const removePelaksanaFromItem = (itemId, pelaksanaId) => {
    const item = workOrderItems.find(item => item.id === itemId);
    if (item) {
      const updatedPelaksana = item.pelaksana.filter(p => p.id !== pelaksanaId);
      updateWorkOrderItem(itemId, 'pelaksana', updatedPelaksana);
    }
  };

  // Update pelaksana
  const updatePelaksana = (itemId, pelaksanaId, field, value) => {
    const item = workOrderItems.find(item => item.id === itemId);
    if (item) {
      const updatedPelaksana = item.pelaksana.map(p => 
        p.id === pelaksanaId ? { ...p, [field]: value } : p
      );
      updateWorkOrderItem(itemId, 'pelaksana', updatedPelaksana);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!workOrderData.nomor_wo || !workOrderData.gudang_id || !workOrderData.pelanggan_id) {
      showAlert('Error', 'Mohon lengkapi data Work Order', 'error');
      return;
    }

    // Validate items
    for (let item of workOrderItems) {
      if (!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id) {
        showAlert('Error', 'Mohon lengkapi data item', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await workOrderService.createWorkOrder({
        ...workOrderData,
        items: workOrderItems
      });
      
      showAlert('Sukses', 'Work Order berhasil dibuat!', 'success', () => {
        navigate('/work-order');
      });
    } catch (error) {
      console.error('Error creating work order:', error);
      showAlert('Error', 'Gagal membuat Work Order', 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <PageLayout title="Tambah Work Order Planning" category="TRANSAKSI">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/work-order')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Work Order Planning Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informasi Work Order Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor WO *
                </label>
                <Input
                  placeholder="Masukkan nomor WO..."
                  value={workOrderData.nomor_wo}
                  onChange={(e) => setWorkOrderData({...workOrderData, nomor_wo: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal WO *
                </label>
                <Input
                  type="date"
                  value={workOrderData.tanggal_wo}
                  onChange={(e) => setWorkOrderData({...workOrderData, tanggal_wo: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Target
                </label>
                <Input
                  type="date"
                  value={workOrderData.tanggal_target}
                  onChange={(e) => setWorkOrderData({...workOrderData, tanggal_target: e.target.value})}
                />
              </div>
              
                             <div>
                 <SearchSelect
                   label="Gudang *"
                   options={gudangList}
                   value={workOrderData.gudang_id ? workOrderData.gudang_id.toString() : ''} 
                   onValueChange={(value) => setWorkOrderData({...workOrderData, gudang_id: parseInt(value)})}
                   placeholder="Pilih gudang"
                   loading={loadingGudang}
                   required
                 />
               </div>
              
                             <div>
                 <SearchSelect
                   label="Pelanggan *"
                   options={pelangganList}
                   value={workOrderData.pelanggan_id ? workOrderData.pelanggan_id.toString() : ''} 
                   onValueChange={(value) => setWorkOrderData({...workOrderData, pelanggan_id: parseInt(value)})}
                   placeholder="Pilih pelanggan"
                   loading={loadingPelanggan}
                   required
                 />
               </div>
               
               <div>
                 <SearchSelect
                   label="Sales Order (Opsional)"
                   options={salesOrderList}
                   value={workOrderData.sales_order_id ? workOrderData.sales_order_id.toString() : ''} 
                   onValueChange={(value) => setWorkOrderData({...workOrderData, sales_order_id: parseInt(value)})}
                   placeholder="Pilih Sales Order (opsional)"
                   loading={loadingSalesOrder}
                 />
               </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <Input
                  placeholder="Catatan tambahan..."
                  value={workOrderData.catatan}
                  onChange={(e) => setWorkOrderData({...workOrderData, catatan: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Work Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workOrderItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Item #{index + 1}</h4>
                  {workOrderItems.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWorkOrderItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Panjang (m)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.panjang}
                      onChange={(e) => updateWorkOrderItem(item.id, 'panjang', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lebar (m)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.lebar}
                      onChange={(e) => updateWorkOrderItem(item.id, 'lebar', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tebal (m)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.tebal}
                      onChange={(e) => updateWorkOrderItem(item.id, 'tebal', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qty *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateWorkOrderItem(item.id, 'qty', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  
                                     <div>
                     <SearchSelect
                       label="Jenis Barang *"
                       options={jenisBarangList}
                       value={item.jenis_barang_id ? item.jenis_barang_id.toString() : ''} 
                       onValueChange={(value) => updateWorkOrderItem(item.id, 'jenis_barang_id', parseInt(value))}
                       placeholder="Pilih jenis"
                       loading={loadingJenisBarang}
                       required
                     />
                   </div>
                  
                                     <div>
                     <SearchSelect
                       label="Bentuk Barang *"
                       options={bentukBarangList}
                       value={item.bentuk_barang_id ? item.bentuk_barang_id.toString() : ''} 
                       onValueChange={(value) => updateWorkOrderItem(item.id, 'bentuk_barang_id', parseInt(value))}
                       placeholder="Pilih bentuk"
                       loading={loadingBentukBarang}
                       required
                     />
                   </div>
                  
                                     <div>
                     <SearchSelect
                       label="Grade Barang *"
                       options={gradeBarangList}
                       value={item.grade_barang_id ? item.grade_barang_id.toString() : ''} 
                       onValueChange={(value) => updateWorkOrderItem(item.id, 'grade_barang_id', parseInt(value))}
                       placeholder="Pilih grade"
                       loading={loadingGradeBarang}
                       required
                     />
                   </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Item
                  </label>
                  <Input
                    placeholder="Catatan untuk item ini..."
                    value={item.catatan}
                    onChange={(e) => updateWorkOrderItem(item.id, 'catatan', e.target.value)}
                  />
                </div>

                {/* Pelaksana Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Pelaksana
                    </h5>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPelaksanaToItem(item.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Pelaksana
                    </Button>
                  </div>
                  
                  {item.pelaksana.length === 0 ? (
                    <p className="text-gray-500 text-sm">Belum ada pelaksana ditambahkan</p>
                  ) : (
                    <div className="space-y-3">
                      {item.pelaksana.map((pelaksana, pelaksanaIndex) => (
                        <div key={pelaksana.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                         <div>
                               <SearchSelect
                                 label="Pelaksana"
                                 options={pelaksanaList}
                                 value={pelaksana.pelaksana_id ? pelaksana.pelaksana_id.toString() : ''} 
                                 onValueChange={(value) => updatePelaksana(item.id, pelaksana.id, 'pelaksana_id', parseInt(value))}
                                 placeholder="Pilih pelaksana"
                                 loading={loadingPelaksana}
                               />
                             </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Qty
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={pelaksana.qty}
                                onChange={(e) => updatePelaksana(item.id, pelaksana.id, 'qty', parseInt(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Catatan
                              </label>
                              <Input
                                placeholder="Catatan pelaksana..."
                                value={pelaksana.catatan}
                                onChange={(e) => updatePelaksana(item.id, pelaksana.id, 'catatan', e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePelaksanaFromItem(item.id, pelaksana.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addWorkOrderItem}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/work-order')}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Simpan Work Order'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
