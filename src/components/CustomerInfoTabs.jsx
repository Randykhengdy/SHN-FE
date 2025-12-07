import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomAlert from "@/components/modals/CustomAlert";
import { pelangganService } from "@/services/master-data/pelangganService";

export default function CustomerInfoTabs({ onCustomerSelect, selectedCustomer }) {
  const [activeTab, setActiveTab] = useState("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);
  const debounceRef = useRef(null);
  
  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "warning"
  });

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    kode: "",
    nama_pelanggan: "",
    telepon_hp: "",
    alamat: "",
    kota: "",
    contact_person: ""
  });

  // Load customers with pagination
  const loadCustomers = async (q = "", p = 1, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      const resp = await pelangganService.getPaginated(p, 10, q || "");
      const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      if (append) {
        const existingIds = new Set(customers.map(c => c.id));
        const merged = [...customers];
        rows.forEach(r => { if (!existingIds.has(r.id)) merged.push(r); });
        setCustomers(merged);
      } else {
        setCustomers(rows);
      }
      setHasMore(rows.length >= 10);
      setPage(p);
    } catch (error) {
      console.error('Error loading customers:', error);
      const msg = error?.message || 'Gagal memuat data pelanggan.';
      showAlert("Error", msg, "error");
      if (!append) setCustomers([]);
      setHasMore(false);
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => { loadCustomers("", 1, false); }, []);

  // Server-side search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadCustomers(searchQuery, 1, false);
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleCustomerSelect = async (customer) => {
    try {
      const resp = await pelangganService.getById(customer.id);
      const detailed = resp?.data || resp || {};
      const merged = { ...customer, ...detailed };
      onCustomerSelect(merged);
      console.log("Customer selected (merged):", merged);
    } catch (error) {
      onCustomerSelect(customer);
      console.log("Customer selected (fallback):", customer, error);
      const msg = error?.message || 'Gagal mengambil detail pelanggan.';
      showAlert("Error", msg, "error");
    }
  };

  const handleNewCustomerChange = (field, value) => {
    setNewCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showAlert = (title, message, type = "warning") => {
    setAlertConfig({ title, message, type });
    setAlertOpen(true);
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustomer.kode || !newCustomer.nama_pelanggan) {
      showAlert(
        "Data Tidak Lengkap", 
        "Kode dan Nama Pelanggan wajib diisi!", 
        "warning"
      );
      return;
    }

    const customerExists = customers.find(c => c.kode === newCustomer.kode);
    if (customerExists) {
      showAlert(
        "Kode Sudah Ada", 
        "Kode pelanggan sudah ada dalam sistem!", 
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      
      const response = await pelangganService.create(newCustomer);
      
      if (response && (response.data || response.id)) {
        const newCustomerData = response.data || response;
        
        // Add to customers list
        setCustomers(prev => [...prev, newCustomerData]);
        
        // Select the new customer
        onCustomerSelect(newCustomerData);
        
        // Reset form
        setNewCustomer({
          kode: "",
          nama_pelanggan: "",
          telepon_hp: "",
          alamat: "",
          kota: "",
          contact_person: ""
        });

        // Switch to existing tab
        setActiveTab("existing");
        
        console.log("New customer saved:", newCustomerData);
       
        // Show success alert
        showAlert(
          "Berhasil!", 
          "Pelanggan baru berhasil ditambahkan dan dipilih.", 
          "success"
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error saving new customer:', error);
      const msg = error?.message || 'Gagal menyimpan pelanggan baru.';
      showAlert("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

   // Clear selected customer when switching to new tab
   const handleTabChange = (value) => {
     setActiveTab(value);
     if (value === "new") {
       onCustomerSelect(null); // Clear selected customer when switching to new tab
     }
   };

     return (
    <>
      <CustomAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      
      <div className="space-y-4">
                 <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                         <TabsTrigger 
               value="existing" 
               className="flex items-center gap-3 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm cursor-pointer"
             >
               <User className="h-4 w-4" />
               Existing Customer
             </TabsTrigger>
             <TabsTrigger 
               value="new" 
               className="flex items-center gap-3 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm cursor-pointer"
             >
               <UserPlus className="h-4 w-4" />
               New Customer
             </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-md">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Cari Pelanggan</Label>
                <div className="relative">
                  <Input
                    placeholder="Cari berdasarkan nama atau kode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                                         className="pr-12 form-input-standard"
                  />
                                     <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Daftar Pelanggan</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md" ref={listRef}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    if (!hasMore || loadingMore) return;
                    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
                      const nextPage = page + 1;
                      loadCustomers(searchQuery, nextPage, true);
                    }
                  }}
                >
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Memuat data pelanggan...
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchQuery ? "Tidak ada pelanggan yang ditemukan" : "Tidak ada data pelanggan"}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedCustomer?.id === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{customer.nama_pelanggan || 'Nama tidak tersedia'}</div>
                              <div className="text-sm text-gray-600">
                                {customer.kode || 'Kode tidak tersedia'} • {customer.telepon_hp || 'Telepon tidak tersedia'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{customer.kota || 'Kota tidak tersedia'}</div>
                            </div>
                            {selectedCustomer?.id === customer.id && (
                              <div className="text-green-600 text-sm font-medium">
                                ✓ Selected
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {loadingMore && (
                        <div className="p-2 text-center text-gray-500 text-xs">Memuat...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode Pelanggan *</Label>
                <Input
                  id="kode"
                  value={newCustomer.kode}
                  onChange={(e) => handleNewCustomerChange('kode', e.target.value)}
                  placeholder="Masukkan kode pelanggan"
                  className="form-input-standard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_pelanggan">Nama Pelanggan *</Label>
                <Input
                  id="nama_pelanggan"
                  value={newCustomer.nama_pelanggan}
                  onChange={(e) => handleNewCustomerChange('nama_pelanggan', e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  className="form-input-standard"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telepon_hp">Telepon</Label>
                <Input
                  id="telepon_hp"
                  value={newCustomer.telepon_hp}
                  onChange={(e) => handleNewCustomerChange('telepon_hp', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={newCustomer.contact_person}
                  onChange={(e) => handleNewCustomerChange('contact_person', e.target.value)}
                  placeholder="Nama contact person"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  value={newCustomer.alamat}
                  onChange={(e) => handleNewCustomerChange('alamat', e.target.value)}
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kota">Kota</Label>
                <Input
                  id="kota"
                  value={newCustomer.kota}
                  onChange={(e) => handleNewCustomerChange('kota', e.target.value)}
                  placeholder="Masukkan kota"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setActiveTab("existing")}
                className="px-6 py-2"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveNewCustomer}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                   </>
                 ) : (
                   <>
                     <Plus className="h-4 w-4" />
                     Simpan & Pilih
                   </>
                 )}
               </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
 }
