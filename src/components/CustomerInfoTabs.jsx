import React, { useState, useEffect } from "react";
import { Search, Plus, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomAlert from "@/components/modals/CustomAlert";

export default function CustomerInfoTabs({ onCustomerSelect, selectedCustomer }) {
  const [activeTab, setActiveTab] = useState("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
    nama: "",
    telepon: "",
    email: "",
    alamat: ""
  });

  // Mock data untuk existing customers
  useEffect(() => {
    const mockCustomers = [
      {
        id: 1,
        kode: "CUST001",
        nama: "PT Maju Bersama",
        telepon: "021-5550123",
        email: "info@majubersama.com",
        alamat: "Jl. Sudirman No. 123, Jakarta Pusat"
      },
      {
        id: 2,
        kode: "CUST002",
        nama: "CV Sukses Mandiri",
        telepon: "021-5550456",
        email: "contact@suksesmandiri.co.id",
        alamat: "Jl. Thamrin No. 456, Jakarta Pusat"
      },
      {
        id: 3,
        kode: "CUST003",
        nama: "UD Berkah Jaya",
        telepon: "021-5550789",
        email: "berkah@jaya.com",
        alamat: "Jl. Gatot Subroto No. 789, Jakarta Selatan"
      }
    ];
    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
  }, []);

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.kode.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const handleCustomerSelect = (customer) => {
    onCustomerSelect(customer);
    console.log("Customer selected:", customer);
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

  const handleSaveNewCustomer = () => {
    if (!newCustomer.kode || !newCustomer.nama) {
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

    const newCustomerData = {
      id: Date.now(),
      ...newCustomer
    };

    // Add to customers list
    setCustomers(prev => [...prev, newCustomerData]);
    
    // Select the new customer
    onCustomerSelect(newCustomerData);
    
    // Reset form
    setNewCustomer({
      kode: "",
      nama: "",
      telepon: "",
      email: "",
      alamat: ""
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
                <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? "Tidak ada pelanggan yang ditemukan" : "Tidak ada data pelanggan"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedCustomer?.id === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{customer.nama}</div>
                            <div className="text-sm text-gray-600">
                              {customer.kode} • {customer.telepon}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{customer.alamat}</div>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <div className="text-green-600 text-sm font-medium">
                              ✓ Selected
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                <Label htmlFor="nama">Nama Pelanggan *</Label>
                <Input
                  id="nama"
                  value={newCustomer.nama}
                  onChange={(e) => handleNewCustomerChange('nama', e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  className="form-input-standard"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  value={newCustomer.telepon}
                  onChange={(e) => handleNewCustomerChange('telepon', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={newCustomer.alamat}
                onChange={(e) => handleNewCustomerChange('alamat', e.target.value)}
                placeholder="Masukkan alamat lengkap"
              />
            </div>

                         <div className="flex justify-end gap-4">
               <Button
                 variant="outline"
                 onClick={() => setActiveTab("existing")}
                 className="px-6"
               >
                 Batal
               </Button>
               <Button
                 onClick={handleSaveNewCustomer}
                 className="flex items-center gap-2 px-6"
               >
                 <Plus className="h-4 w-4" />
                 Simpan & Pilih
               </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
 }
