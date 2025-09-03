import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSelect from '@/components/ui/search-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, Users, Package } from 'lucide-react';
import SelectPlatShaftDasar from './select-platshaftdasar';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { workOrderService } from '@/services/workOrderService';
import { request } from '@/lib/request';
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
    status: 'Pending',
    prioritas: 'MEDIUM'
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

  // Sales Order Detail State
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [loadingSalesOrderDetail, setLoadingSalesOrderDetail] = useState(false);

  // Plat Dasar State
  const [showPlatDasarModal, setShowPlatDasarModal] = useState(false);
  const [currentItemData, setCurrentItemData] = useState(null);
  const [selectedPlatDasar, setSelectedPlatDasar] = useState({});

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
        console.log('Setting gudang list:', gudang);
        console.log('Setting jenis barang list:', jenisBarang);
        console.log('Setting bentuk barang list:', bentukBarang);
        console.log('Setting grade barang list:', gradeBarang);
        console.log('Setting pelaksana list:', pelaksana);
        
        setGudangList(gudang);
        setJenisBarangList(jenisBarang);
        setBentukBarangList(bentukBarang);
        setGradeBarangList(gradeBarang);
        setPelaksanaList(pelaksana);
        
        // Load pelanggan separately since it needs different handling
        try {
          setLoadingPelanggan(true);
          setLoadingSalesOrder(true);
          
          const [pelangganResponse, salesOrderResponse] = await Promise.all([
            getPelangganOptions({ per_page: 100 }),
            getSalesOrderOptions()
          ]);
          
          console.log('Pelanggan response:', pelangganResponse);
          console.log('Sales Order response:', salesOrderResponse);
          
          // getPelangganOptions sudah mengembalikan data yang sudah di-map
          if (pelangganResponse && Array.isArray(pelangganResponse)) {
            setPelangganList(pelangganResponse);
            console.log('Pelanggan options:', pelangganResponse);
          } else if (pelangganResponse?.data && Array.isArray(pelangganResponse.data)) {
            // Fallback jika response masih dalam format lama
            const pelangganOptions = pelangganResponse.data.map(item => ({
              value: item.id?.toString(),
              label: item.nama_pelanggan ? `${item.nama_pelanggan} (${item.alamat || 'N/A'})` : item.nama || 'Unknown',
              searchKey: `${item.nama_pelanggan || item.nama || ''} ${item.alamat || ''}`.trim()
            }));
            setPelangganList(pelangganOptions);
            console.log('Pelanggan options (fallback):', pelangganOptions);
          }
          
          // Set sales order data
          setSalesOrderList(salesOrderResponse || []);
          
        } catch (error) {
          console.error('Error loading additional data:', error);
        } finally {
          setLoadingPelanggan(false);
          setLoadingSalesOrder(false);
        }
        
        console.log('State set - gudangList:', gudang);
        console.log('State set - pelangganList:', pelangganList);
        
        // Debug: Log semua state setelah di-set
        setTimeout(() => {
          console.log('=== DEBUG STATE AFTER SET ===');
          console.log('gudangList state:', gudangList);
          console.log('pelangganList state:', pelangganList);
          console.log('jenisBarangList state:', jenisBarangList);
          console.log('bentukBarangList state:', bentukBarangList);
          console.log('gradeBarangList state:', gradeBarangList);
          console.log('pelaksanaList state:', pelaksanaList);
          console.log('================================');
        }, 100);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, []);

  // Function to load Sales Order detail and populate items
  const loadSalesOrderDetail = async (salesOrderId) => {
    if (!salesOrderId) return;
    
    setLoadingSalesOrderDetail(true);
    try {
      console.log('Loading Sales Order detail for ID:', salesOrderId);
      
      // Get Sales Order detail with items
      const response = await request(`/sales-order/${salesOrderId}`, {
        method: 'GET'
      });
      
      console.log('Sales Order detail response:', response);
      
      let soData = response.data || response;
      
      // If response is an array, take the first item
      if (Array.isArray(soData)) {
        soData = soData[0];
      }
      
      if (!soData) {
        throw new Error('Sales order data not found');
      }
      
      setSelectedSalesOrder(soData);
      
      // Extract items from Sales Order
      const itemsData = soData.salesOrderItems || soData.items || soData.sales_order_items || soData.orderItems || [];
      console.log('Sales Order items:', itemsData);
      
      if (itemsData && itemsData.length > 0) {
        // Transform Sales Order items to Work Order items
        const transformedItems = itemsData.map((item, index) => ({
          id: Date.now() + index,
          panjang: item.panjang || item.length || 0,
          lebar: item.lebar || item.width || 0,
          tebal: item.tebal || item.ketebalan || item.thickness || 0,
          qty: item.qty || item.quantity || item.jumlah || 1,
          jenis_barang_id: item.jenis_barang_id || item.jenis_barang?.id,
          bentuk_barang_id: item.bentuk_barang_id || item.bentuk_barang?.id,
          grade_barang_id: item.grade_barang_id || item.grade_barang?.id,
          catatan: item.catatan || item.note || item.notes || '',
          pelaksana: []
        }));
        
        console.log('Transformed Work Order items:', transformedItems);
        setWorkOrderItems(transformedItems);
        
                 // Auto-fill other fields from Sales Order
         setWorkOrderData(prev => ({
           ...prev,
           gudang_id: soData.gudang_id || soData.gudang?.id,
           pelanggan_id: soData.pelanggan_id || soData.pelanggan?.id,
           catatan: soData.catatan || '',
           tanggal_target: workOrderData.tanggal_wo // Set tanggal target sama dengan tanggal WO
         }));
        
        showAlert('Sukses', `${itemsData.length} item berhasil diambil dari Sales Order`, 'success');
      } else {
        showAlert('Info', 'Sales Order tidak memiliki item', 'info');
        // Reset to default item if no items found
        setWorkOrderItems([{
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
        }]);
      }
      
    } catch (error) {
      console.error('Error loading Sales Order detail:', error);
      showAlert('Error', 'Gagal memuat detail Sales Order', 'error');
    } finally {
      setLoadingSalesOrderDetail(false);
    }
  };

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

  // Plat Dasar functions
  const openPlatDasarModal = (item) => {
    setCurrentItemData(item);
    setShowPlatDasarModal(true);
  };

  const closePlatDasarModal = () => {
    setShowPlatDasarModal(false);
    setCurrentItemData(null);
  };

  const handlePlatDasarSelection = (selectedItems) => {
    if (currentItemData) {
      setSelectedPlatDasar(prev => ({
        ...prev,
        [currentItemData.id]: selectedItems
      }));
    }
  };

  const getTotalLuasTercukupi = (itemId) => {
    const selected = selectedPlatDasar[itemId] || [];
    return selected.reduce((sum, item) => sum + item.sisa_luas, 0);
  };

  const isLuasCukup = (itemId, totalDibutuhkan) => {
    const totalTercukupi = getTotalLuasTercukupi(itemId);
    return totalTercukupi >= (totalDibutuhkan * 1.1); // 110% tolerance
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!workOrderData.nomor_wo || !workOrderData.gudang_id || !workOrderData.pelanggan_id || !workOrderData.sales_order_id) {
      showAlert('Error', 'Mohon lengkapi data Work Order', 'error');
      return;
    }

    // Check if there are pelaksana but no id_pelaksana at top level
    const hasPelaksana = workOrderItems.some(item => item.pelaksana.length > 0);
    if (hasPelaksana) {
      const firstPelaksanaId = workOrderItems.find(item => item.pelaksana.length > 0)?.pelaksana[0]?.pelaksana_id;
      if (!firstPelaksanaId) {
        showAlert('Error', 'Mohon lengkapi data pelaksana untuk semua item', 'error');
        return;
      }
    }

    // Validate items
    for (let item of workOrderItems) {
      if (!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id) {
        showAlert('Error', 'Mohon lengkapi data item', 'error');
        return;
      }
      
      // Validate pelaksana if exists
      for (let pelaksana of item.pelaksana) {
        if (!pelaksana.pelaksana_id) {
          showAlert('Error', 'Mohon lengkapi data pelaksana', 'error');
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Transform data to match API expected format
      const transformedData = {
        nomor_wo: workOrderData.nomor_wo,
        tanggal_wo: workOrderData.tanggal_wo,
        tanggal_target: workOrderData.tanggal_target,
        id_sales_order: workOrderData.sales_order_id,
        id_pelanggan: workOrderData.pelanggan_id,
        id_gudang: workOrderData.gudang_id,
        // Add id_pelaksana field at the top level as required by API
        id_pelaksana: workOrderItems.some(item => item.pelaksana.length > 0) 
          ? workOrderItems[0].pelaksana[0]?.pelaksana_id || null 
          : null,
        prioritas: workOrderData.prioritas,
        catatan: workOrderData.catatan,
        status: workOrderData.status,
        items: workOrderItems.map(item => ({
          qty: item.qty,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.tebal) || 0,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          // plat_dasar_id is optional and will be set later when plat dasar is selected
          catatan: item.catatan,
          // Add required fields for pelaksana
          pelaksana: item.pelaksana.map(p => ({
            pelaksana_id: p.pelaksana_id,
            qty: p.qty,
            weight: 0, // Default weight, bisa diisi nanti
            tanggal: workOrderData.tanggal_wo, // Use WO date as default
            jam_mulai: "08:00", // Default start time
            jam_selesai: "17:00", // Default end time
            catatan: p.catatan
          }))
        }))
      };

      console.log('Transformed data to send:', transformedData);
      
      const response = await workOrderService.createWorkOrder(transformedData);
      
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
                  Sales Order *
                </label>
                <SearchSelect
                  label=""
                  options={salesOrderList}
                  value={workOrderData.sales_order_id ? workOrderData.sales_order_id.toString() : ''} 
                  onValueChange={(value) => {
                    const selectedSO = salesOrderList.find(so => so.value === value);
                    if (selectedSO) {
                      // Generate WO number from SO number
                      const soNumber = selectedSO.label || selectedSO.value;
                      const woNumber = soNumber.replace(/^SO-/, 'WO-');
                      setWorkOrderData({
                        ...workOrderData, 
                        sales_order_id: parseInt(value),
                        nomor_wo: woNumber
                      });
                      
                      // Load Sales Order detail and populate items automatically
                      loadSalesOrderDetail(parseInt(value));
                    } else {
                      setWorkOrderData({...workOrderData, sales_order_id: parseInt(value)});
                    }
                  }}
                  placeholder="Pilih Sales Order"
                  loading={loadingSalesOrder}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor WO *
                </label>
                <Input
                  placeholder="Nomor WO akan otomatis terisi"
                  value={workOrderData.nomor_wo}
                  disabled
                  className="bg-gray-100"
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
                  onValueChange={(value) => {
                    console.log('Gudang selected:', value, 'Type:', typeof value);
                    console.log('Available gudang options:', gudangList);
                    setWorkOrderData({...workOrderData, gudang_id: parseInt(value)});
                  }}
                  placeholder="Pilih gudang"
                  loading={loadingGudang}
                />
              </div>
              
              <div>
                <SearchSelect
                  label="Pelanggan *"
                  options={pelangganList}
                  value={workOrderData.pelanggan_id ? workOrderData.pelanggan_id.toString() : ''} 
                  onValueChange={(value) => {
                    console.log('Pelanggan selected:', value, 'Type:', typeof value);
                    console.log('Available pelanggan options:', pelangganList);
                    setWorkOrderData({...workOrderData, pelanggan_id: parseInt(value)});
                  }}
                  placeholder="Pilih pelanggan"
                  loading={loadingPelanggan}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritas
                </label>
                <select
                  value={workOrderData.prioritas}
                  onChange={(e) => setWorkOrderData({...workOrderData, prioritas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Mendesak</option>
                </select>
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
              {selectedSalesOrder && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSalesOrder.nomor_so} - {selectedSalesOrder.pelanggan?.nama_pelanggan || 'Unknown'}
                </Badge>
              )}
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
                      Panjang (mm)
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
                      Lebar (mm)
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
                      Tebal (mm)
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

                {/* Plat Dasar Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plat Dasar
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openPlatDasarModal(item)}
                      disabled={!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id || !item.tebal}
                      className="text-xs"
                    >
                      <Package className="w-3 h-3 mr-1" />
                      Pilih Plat Dasar
                    </Button>
                    
                    {selectedPlatDasar[item.id] && selectedPlatDasar[item.id].length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {selectedPlatDasar[item.id].length} item dipilih
                        </Badge>
                        {(() => {
                          const totalDibutuhkan = parseFloat(item.panjang || 0) * parseFloat(item.lebar || 0) * item.qty;
                          const isCukup = isLuasCukup(item.id, totalDibutuhkan);
                          return (
                            <Badge variant={isCukup ? "default" : "destructive"} className="text-xs">
                              {isCukup ? "✓ Cukup" : "✗ Kurang"}
                            </Badge>
                          );
                        })()}
                      </div>
                    )}
                  </div>
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

      {/* Plat Dasar Modal */}
      {showPlatDasarModal && currentItemData && (
        <SelectPlatShaftDasar
          jenisBarangId={currentItemData.jenis_barang_id}
          bentukBarangId={currentItemData.bentuk_barang_id}
          gradeBarangId={currentItemData.grade_barang_id}
          tebal={parseFloat(currentItemData.tebal) || 0}
          totalDibutuhkan={parseFloat(currentItemData.panjang || 0) * parseFloat(currentItemData.lebar || 0) * currentItemData.qty}
          onSelectionChange={handlePlatDasarSelection}
          onClose={closePlatDasarModal}
        />
      )}
    </PageLayout>
  );
}
