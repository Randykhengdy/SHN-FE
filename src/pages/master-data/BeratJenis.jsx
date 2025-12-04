import React, { useState, useEffect, useRef } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { beratJenisService, bentukBarangService } from "@/services/master-data";
import { getJenisBarangOptions, getGradeBarangOptions } from "@/services/masterDataService";
import { useAlert } from "@/hooks/useAlert";
import { Sparkles } from "lucide-react";

export default function BeratJenisPage() {
  const [bentukBarangMap, setBentukBarangMap] = useState({}); // Map bentuk_barang_id -> dimensi
  const [currentDimensi, setCurrentDimensi] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const fetchDataRef = useRef(null);
  const editDataRef = useRef(null);

  // Function untuk mendapatkan fetchData dari MasterDataLayout
  // Kita akan menggunakan callback atau ref untuk memanggil refresh

  // State untuk track editData ID terakhir yang sudah diproses
  const [lastProcessedEditId, setLastProcessedEditId] = useState(null);

  // Load dimensi saat edit data berubah
  // Menggunakan useEffect yang hanya berjalan saat editDataRef berubah
  useEffect(() => {
    const editData = editDataRef.current;
    const editId = editData?.id;
    
    // Skip jika sudah diproses atau tidak ada editData
    if (!editData || editId === lastProcessedEditId) {
      if (!editData) {
        setCurrentDimensi(null);
        setLastProcessedEditId(null);
      }
      return;
    }

    // Mark as processed
    setLastProcessedEditId(editId);

    // Support both camelCase and snake_case
    const bentukBarang = editData?.bentuk_barang || editData?.bentukBarang;
    const bentukBarangId = editData?.bentuk_barang_id || editData?.bentukBarang?.id;
    
    if (!bentukBarangId) {
      setCurrentDimensi(null);
      return;
    }

    if (bentukBarang?.dimensi) {
      const dimensi = bentukBarang.dimensi;
      setBentukBarangMap(prev => {
        // Prevent unnecessary updates
        if (prev[bentukBarangId] === dimensi) return prev;
        return { ...prev, [bentukBarangId]: dimensi };
      });
      setCurrentDimensi(dimensi);
    } else {
      // Check map menggunakan functional update untuk mendapatkan current state
      setBentukBarangMap(prev => {
        const existingDimensi = prev[bentukBarangId];
        if (existingDimensi) {
          // Jika sudah ada di map, set dimensi di luar setState untuk mencegah infinite loop
          setTimeout(() => setCurrentDimensi(existingDimensi), 0);
          return prev;
        } else {
          // Fetch dimensi jika belum ada di map
          bentukBarangService.getById(bentukBarangId).then(response => {
            const dimensi = response.data?.dimensi || null;
            if (dimensi) {
              setBentukBarangMap(prevMap => {
                // Double check untuk prevent race condition
                if (prevMap[bentukBarangId] === dimensi) return prevMap;
                return { ...prevMap, [bentukBarangId]: dimensi };
              });
              setCurrentDimensi(dimensi);
            }
          }).catch(error => {
            console.error('Error fetching bentuk barang:', error);
          });
          return prev;
        }
      });
    }
  }, [lastProcessedEditId]); // Hanya trigger saat lastProcessedEditId berubah

  const handleGenerate = () => {
    showConfirm(
      "Konfirmasi Generate",
      "Apakah Anda yakin ingin generate berat jenis dari item barang group?\n\nIni akan membuat data berat jenis baru untuk kombinasi yang belum ada.",
      async () => {
        setGenerating(true);
        try {
          const response = await beratJenisService.generateFromItemBarangGroup();
          
          if (response.success) {
            const { created, skipped, total_combinations, data: generatedData } = response.data;
            
            showAlert(
              "Generate Berhasil",
              `Berhasil generate ${created} data berat jenis baru.\n${skipped} kombinasi sudah ada.\nTotal kombinasi: ${total_combinations}`,
              "success"
            );

            // Refresh data setelah generate
            // Kita perlu memanggil fetchData dari MasterDataLayout
            // Untuk sementara, kita reload halaman atau trigger refresh
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showAlert("Error", response.message || "Gagal generate berat jenis", "error");
          }
        } catch (error) {
          console.error("Error generating berat jenis:", error);
          showAlert("Error", error.message || "Terjadi kesalahan saat generate berat jenis", "error");
        } finally {
          setGenerating(false);
        }
      },
      () => {
        // Cancel handler - tidak perlu melakukan apa-apa
      },
      "Ya, Generate",
      "Batal"
    );
  };


  return (
    <>
      <AlertComponent />
      <MasterDataLayout
        title="Berat Jenis"
        subtitle="Master Data"
        service={beratJenisService}
        customHeaderButtons={[
          {
            label: "Generate Item Berat Jenis",
            icon: <Sparkles className="h-4 w-4" />,
            onClick: handleGenerate,
            disabled: generating,
            className: generating 
              ? "bg-gray-400 cursor-not-allowed text-white font-medium shadow-sm transition-all duration-200" 
              : "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          }
        ]}
        validate={(form) => {
          const errs = [];
          if (!form.jenis_barang_id) errs.push('Jenis Barang');
          if (!form.bentuk_barang_id) errs.push('Bentuk Barang');
          if (!form.grade_barang_id) errs.push('Grade Barang');
          
          // Validasi berdasarkan dimensi
          const dimensi = bentukBarangMap[form.bentuk_barang_id] || currentDimensi;
          if (dimensi === '1D') {
            if (!form.berat_per_cm || parseFloat(form.berat_per_cm) <= 0) {
              errs.push('Berat per cm (wajib untuk barang 1D)');
            }
          } else if (dimensi && dimensi !== '1D') {
            if (!form.berat_per_luas || parseFloat(form.berat_per_luas) <= 0) {
              errs.push('Berat per luas (wajib untuk plat 2D)');
            }
          }
          
          if (errs.length) return `Field wajib: ${errs.join(', ')}`;
          return null;
        }}
        preprocess={(form) => {
          // Hapus field yang tidak perlu dikirim
          const dimensi = bentukBarangMap[form.bentuk_barang_id] || currentDimensi;
          if (dimensi === '1D') {
            delete form.berat_per_luas;
            if (form.berat_per_cm) {
              form.berat_per_cm = parseFloat(form.berat_per_cm);
            }
          } else if (dimensi && dimensi !== '1D') {
            delete form.berat_per_cm;
            if (form.berat_per_luas) {
              form.berat_per_luas = parseFloat(form.berat_per_luas);
            }
          }
          return form;
        }}
        fields={[
          {
            name: "jenis_barang_id",
            label: "Jenis Barang",
            type: "select",
            required: true,
            disabledOnEdit: true,
            optionLabel: "label",
            mapFromEdit: (edit) => {
              // Support both camelCase and snake_case
              return edit?.jenis_barang_id || edit?.jenisBarang?.id || "";
            },
            editLabel: (edit) => {
              // Support both camelCase and snake_case
              const jenisBarang = edit?.jenis_barang || edit?.jenisBarang;
              return jenisBarang?.nama_jenis || jenisBarang?.nama || String(edit?.jenis_barang_id || edit?.jenisBarang?.id || "");
            },
            optionsLoader: async () => {
              const options = await getJenisBarangOptions();
              return options.map(opt => ({
                id: opt.value,
                label: opt.label,
                value: opt.value
              }));
            }
          },
          {
            name: "bentuk_barang_id",
            label: "Bentuk Barang",
            type: "select",
            required: true,
            disabledOnEdit: true,
            optionLabel: "label",
            mapFromEdit: (edit) => {
              // Set editDataRef untuk digunakan di useEffect
              // Gunakan setTimeout untuk mencegah setState di dalam render cycle
              if (edit && editDataRef.current?.id !== edit?.id) {
                editDataRef.current = edit;
                
                // Langsung load dimensi dari editData untuk memastikan showIf bisa mengaksesnya
                // Gunakan setTimeout untuk mencegah setState di dalam render cycle
                setTimeout(() => {
                  const bentukBarang = edit?.bentuk_barang || edit?.bentukBarang;
                  const bentukBarangId = edit?.bentuk_barang_id || edit?.bentukBarang?.id;
                  
                  if (bentukBarangId) {
                    if (bentukBarang?.dimensi) {
                      // Langsung set dimensi jika ada di editData
                      const dimensi = bentukBarang.dimensi;
                      setBentukBarangMap(prev => {
                        if (prev[bentukBarangId] === dimensi) return prev;
                        return { ...prev, [bentukBarangId]: dimensi };
                      });
                      setCurrentDimensi(dimensi);
                    } else {
                      // Trigger useEffect untuk fetch jika belum ada
                      setLastProcessedEditId(null); // Reset untuk trigger useEffect
                    }
                  }
                }, 0);
              }
              // Hanya return value, jangan setState di sini
              return edit?.bentuk_barang_id || edit?.bentukBarang?.id || "";
            },
            editLabel: (edit) => {
              // Support both camelCase and snake_case
              const bentukBarang = edit?.bentuk_barang || edit?.bentukBarang;
              return bentukBarang?.nama_bentuk || bentukBarang?.nama || String(edit?.bentuk_barang_id || edit?.bentukBarang?.id || "");
            },
            optionsLoader: async () => {
              const response = await bentukBarangService.getAll();
              const options = (response.data || []).map(item => ({
                id: item.id,
                label: item.nama_bentuk ? `${item.nama_bentuk} (${item.dimensi || 'N/A'})` : item.nama || 'Unknown',
                value: item.id?.toString(),
                dimensi: item.dimensi,
                nama: item.nama_bentuk || item.nama
              }));
              
              // Update map untuk akses dimensi
              const newMap = {};
              options.forEach(opt => {
                if (opt.id && opt.dimensi) {
                  newMap[opt.id] = opt.dimensi;
                }
              });
              setBentukBarangMap(prev => ({ ...prev, ...newMap }));
              
              return options;
            },
            onChangeForm: async (form, val) => {
              // Fetch dimensi dari API jika belum ada di map
              let dimensi = bentukBarangMap[val];
              if (!dimensi && val) {
                try {
                  const response = await bentukBarangService.getById(val);
                  dimensi = response.data?.dimensi || null;
                  if (dimensi) {
                    setBentukBarangMap(prev => ({ ...prev, [val]: dimensi }));
                  }
                } catch (error) {
                  console.error('Error fetching bentuk barang:', error);
                }
              }
              setCurrentDimensi(dimensi || null);
              
              // Reset berat fields saat bentuk barang berubah (hanya saat create, bukan edit)
              if (!form.id) {
                return {
                  ...form,
                  berat_per_cm: "",
                  berat_per_luas: ""
                };
              }
              return form;
            }
          },
          {
            name: "grade_barang_id",
            label: "Grade Barang",
            type: "select",
            required: true,
            disabledOnEdit: true,
            optionLabel: "label",
            mapFromEdit: (edit) => {
              // Support both camelCase and snake_case
              return edit?.grade_barang_id || edit?.gradeBarang?.id || "";
            },
            editLabel: (edit) => {
              // Support both camelCase and snake_case
              const gradeBarang = edit?.grade_barang || edit?.gradeBarang;
              return gradeBarang?.nama || gradeBarang?.nama_grade || String(edit?.grade_barang_id || edit?.gradeBarang?.id || "");
            },
            optionsLoader: async () => {
              const options = await getGradeBarangOptions();
              return options.map(opt => ({
                id: opt.value,
                label: opt.label,
                value: opt.value
              }));
            }
          },
          {
            name: "berat_per_cm",
            label: "Berat per cm (kg/cm)",
            type: "number",
            step: "0.0001",
            required: true,
            showIf: (form) => {
              // Tampilkan jika dimensi adalah 1D
              // Cek dari form, map, atau currentDimensi
              const bentukBarangId = form.bentuk_barang_id;
              let dimensi = null;
              
              // Cek dari map
              if (bentukBarangId && bentukBarangMap[bentukBarangId]) {
                dimensi = bentukBarangMap[bentukBarangId];
              }
              // Cek dari currentDimensi
              else if (currentDimensi) {
                dimensi = currentDimensi;
              }
              // Cek dari editDataRef jika ada
              else if (editDataRef.current) {
                const editData = editDataRef.current;
                const bentukBarang = editData?.bentuk_barang || editData?.bentukBarang;
                dimensi = bentukBarang?.dimensi || null;
              }
              
              return dimensi === '1D';
            }
          },
          {
            name: "berat_per_luas",
            label: "Berat per luas (kg/m²)",
            type: "number",
            step: "0.0001",
            required: true,
            showIf: (form) => {
              // Tampilkan jika dimensi bukan 1D
              // Cek dari form, map, atau currentDimensi
              const bentukBarangId = form.bentuk_barang_id;
              let dimensi = null;
              
              // Cek dari map
              if (bentukBarangId && bentukBarangMap[bentukBarangId]) {
                dimensi = bentukBarangMap[bentukBarangId];
              }
              // Cek dari currentDimensi
              else if (currentDimensi) {
                dimensi = currentDimensi;
              }
              // Cek dari editDataRef jika ada
              else if (editDataRef.current) {
                const editData = editDataRef.current;
                const bentukBarang = editData?.bentuk_barang || editData?.bentukBarang;
                dimensi = bentukBarang?.dimensi || null;
              }
              
              return dimensi && dimensi !== '1D';
            }
          }
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { 
            key: "jenis_barang", 
            label: "Jenis Barang", 
            align: "left", 
            minWidth: "12rem",
            getValue: (item) => {
              // Support both camelCase and snake_case
              const jenisBarang = item.jenis_barang || item.jenisBarang;
              return jenisBarang?.nama_jenis || jenisBarang?.nama || '-';
            }
          },
          { 
            key: "bentuk_barang", 
            label: "Bentuk Barang", 
            align: "left", 
            minWidth: "12rem",
            getValue: (item) => {
              // Support both camelCase and snake_case
              const bentukBarang = item.bentuk_barang || item.bentukBarang;
              return bentukBarang?.nama_bentuk || bentukBarang?.nama || '-';
            }
          },
          { 
            key: "grade_barang", 
            label: "Grade Barang", 
            align: "left", 
            minWidth: "12rem",
            getValue: (item) => {
              // Support both camelCase and snake_case
              const gradeBarang = item.grade_barang || item.gradeBarang;
              return gradeBarang?.nama || gradeBarang?.nama_grade || '-';
            }
          },
          { 
            key: "berat_per_cm", 
            label: "Berat per cm (kg/cm)", 
            align: "right", 
            width: "12rem",
            getValue: (item) => {
              if (!item.berat_per_cm || item.berat_per_cm === null) return '-';
              // Hapus desimal, tampilkan sebagai integer dengan separator dot
              const num = Math.round(parseFloat(item.berat_per_cm));
              return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            },
            getCellClassName: (item) => {
              // Support both camelCase and snake_case
              const bentukBarang = item.bentuk_barang || item.bentukBarang;
              const dimensi = bentukBarang?.dimensi;
              // Jika 1D dan berat_per_cm null, tandai merah
              if (dimensi === '1D' && (!item.berat_per_cm || item.berat_per_cm === null)) {
                return 'bg-red-50';
              }
              return '';
            }
          },
          { 
            key: "berat_per_luas", 
            label: "Berat per luas (kg/m²)", 
            align: "right", 
            width: "12rem",
            getValue: (item) => {
              if (!item.berat_per_luas || item.berat_per_luas === null) return '-';
              // Hapus desimal, tampilkan sebagai integer dengan separator dot
              const num = Math.round(parseFloat(item.berat_per_luas));
              return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            },
            getCellClassName: (item) => {
              // Support both camelCase and snake_case
              const bentukBarang = item.bentuk_barang || item.bentukBarang;
              const dimensi = bentukBarang?.dimensi;
              // Jika 2D dan berat_per_luas null, tandai merah
              if (dimensi && dimensi !== '1D' && (!item.berat_per_luas || item.berat_per_luas === null)) {
                return 'bg-red-50';
              }
              return '';
            }
          }
        ]}
      />
    </>
  );
}
