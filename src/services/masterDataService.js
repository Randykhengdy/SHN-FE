import { 
  gudangService, 
  jenisBarangService, 
  bentukBarangService, 
  gradeBarangService 
} from './master-data';

// Fetch Gudang options
export const getGudangOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Fetching gudang options...');
  }
  try {
    const response = await gudangService.getAll();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Gudang options fetched:', response.data.length, 'items');
      // Map data untuk console.table yang lebih mudah dibaca
      const mappedData = response.data.map(item => ({
        'Kode': item.kode,
        'Nama Gudang': item.nama_gudang,
        'Alamat': item.alamat || item.lokasi || '-',
        'ID': item.id
      }));
      console.table(mappedData);
    }
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: `${item.nama_gudang} - ${item.alamat || item.lokasi}`,
      searchKey: `${item.nama_gudang} - ${item.alamat || item.lokasi}`
    }));
  } catch (error) {
    console.error('❌ Error fetching gudang options:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using fallback gudang options');
    }
    // Fallback to default options
    return [
      { value: "gudang-utama", label: "Gudang Utama - Jakarta Pusat", searchKey: "Gudang Utama - Jakarta Pusat" },
      { value: "gudang-barat", label: "Gudang Barat - Jakarta Barat", searchKey: "Gudang Barat - Jakarta Barat" },
      { value: "gudang-timur", label: "Gudang Timur - Jakarta Timur", searchKey: "Gudang Timur - Jakarta Timur" }
    ];
  }
};

// Fetch Jenis Barang options
export const getJenisBarangOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Fetching jenis barang options...');
  }
  try {
    const response = await jenisBarangService.getAll();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Jenis barang options fetched:', response.data.length, 'items');
      // Map data untuk console.table yang lebih mudah dibaca
      const mappedData = response.data.map(item => ({
        'Kode': item.kode,
        'Nama Jenis Barang': item.nama_jenis || item.label,
        'ID': item.id
      }));
      console.table(mappedData);
    }
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: item.nama_jenis || item.label,
      searchKey: item.nama_jenis || item.label
    }));
  } catch (error) {
    console.error('❌ Error fetching jenis barang options:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using fallback jenis barang options');
    }
    // Fallback to default options
    return [
      { value: "plat-besi", label: "Plat Besi", searchKey: "Plat Besi" },
      { value: "plat-stainless", label: "Plat Stainless", searchKey: "Plat Stainless" },
      { value: "plat-aluminium", label: "Plat Aluminium", searchKey: "Plat Aluminium" }
    ];
  }
};

// Fetch Bentuk Barang options
export const getBentukBarangOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔷 Fetching bentuk barang options...');
  }
  try {
    const response = await bentukBarangService.getAll();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Bentuk barang options fetched:', response.data.length, 'items');
      // Map data untuk console.table yang lebih mudah dibaca
      const mappedData = response.data.map(item => ({
        'Kode': item.kode,
        'Nama Bentuk Barang': item.nama_bentuk,
        'Dimensi': item.dimensi,
        'ID': item.id
      }));
      console.table(mappedData);
    }
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: `${item.nama_bentuk} (${item.dimensi})`,
      searchKey: item.nama_bentuk,
      dimensi: item.dimensi,
      nama: item.nama_bentuk
    }));
  } catch (error) {
    console.error('❌ Error fetching bentuk barang options:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using fallback bentuk barang options');
    }
    // Fallback to default options
    return [
      { value: "BBG01", label: "AS (1D)", searchKey: "AS", dimensi: "1D", nama: "AS" },
      { value: "BBG02", label: "PLAT (2D)", searchKey: "PLAT", dimensi: "2D", nama: "PLAT" },
      { value: "BBG03", label: "CANAL U (1D)", searchKey: "CANAL U", dimensi: "1D", nama: "CANAL U" }
    ];
  }
};

// Fetch Grade Barang options
export const getGradeBarangOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('⭐ Fetching grade barang options...');
  }
  try {
    const response = await gradeBarangService.getAll();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Grade barang options fetched:', response.data.length, 'items');
      // Map data untuk console.table yang lebih mudah dibaca
      const mappedData = response.data.map(item => ({
        'Kode': item.kode,
        'Nama Grade Barang': item.nama || item.label,
        'ID': item.id
      }));
      console.table(mappedData);
    }
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: item.nama || item.label,
      searchKey: item.nama || item.label
    }));
  } catch (error) {
    console.error('❌ Error fetching grade barang options:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using fallback grade barang options');
    }
    // Fallback to default options
    return [
      { value: "grade-a", label: "Grade A", searchKey: "Grade A" },
      { value: "grade-b", label: "Grade B", searchKey: "Grade B" },
      { value: "grade-c", label: "Grade C", searchKey: "Grade C" }
    ];
  }
};

// Fetch Term of Payment options (temporary mock data)
export const getTermOptions = async () => {
  // For now, return mock data since we don't have term payment service yet
  return [
    { value: "cash", label: "Cash", searchKey: "Cash" },
    { value: "credit", label: "Credit", searchKey: "Credit" },
    { value: "net30", label: "Net 30", searchKey: "Net 30" },
    { value: "net60", label: "Net 60", searchKey: "Net 60" }
  ];
};

// Fetch Unit options (temporary mock data)
export const getUnitOptions = async () => {
  // For now, return mock data since we don't have unit service yet
  return [
    { value: "per-dimensi", label: "per dimensi", searchKey: "per dimensi" },
    { value: "per-meter", label: "per meter", searchKey: "per meter" },
    { value: "per-piece", label: "per piece", searchKey: "per piece" }
  ];
};
