import { 
  gudangService, 
  jenisBarangService, 
  bentukBarangService, 
  gradeBarangService 
} from './master-data';
import { request } from '@/lib/request';

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
      { id: 1, kode: "JB001", value: "JB001", label: "Plat Besi", searchKey: "Plat Besi", nama_jenis: "Plat Besi" },
      { id: 2, kode: "JB002", value: "JB002", label: "Plat Stainless", searchKey: "Plat Stainless", nama_jenis: "Plat Stainless" },
      { id: 3, kode: "JB003", value: "JB003", label: "Plat Aluminium", searchKey: "Plat Aluminium", nama_jenis: "Plat Aluminium" }
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
    // Fallback to default options (1D, 2D, and 3D)
    return [
      { id: 1, kode: "BBG01", value: "BBG01", label: "AS (1D)", searchKey: "AS", dimensi: "1D", nama: "AS", nama_bentuk: "AS" },
      { id: 2, kode: "BBG02", value: "BBG02", label: "PLAT (2D)", searchKey: "PLAT", dimensi: "2D", nama: "PLAT", nama_bentuk: "PLAT" },
      { id: 3, kode: "BBG03", value: "BBG03", label: "CANAL U (1D)", searchKey: "CANAL U", dimensi: "1D", nama: "CANAL U", nama_bentuk: "CANAL U" },
      { id: 4, kode: "BBG04", value: "BBG04", label: "PIPA (1D)", searchKey: "PIPA", dimensi: "1D", nama: "PIPA", nama_bentuk: "PIPA" },
      { id: 5, kode: "BBG05", value: "BBG05", label: "SHEET (2D)", searchKey: "SHEET", dimensi: "2D", nama: "SHEET", nama_bentuk: "SHEET" },
      { id: 6, kode: "BBG06", value: "BBG06", label: "KOTAK (3D)", searchKey: "KOTAK", dimensi: "3D", nama: "KOTAK", nama_bentuk: "KOTAK" },
      { id: 7, kode: "BBG07", value: "BBG07", label: "BALOK (3D)", searchKey: "BALOK", dimensi: "3D", nama: "BALOK", nama_bentuk: "BALOK" }
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
      { id: 1, kode: "GB001", value: "GB001", label: "Grade A", searchKey: "Grade A", nama: "Grade A" },
      { id: 2, kode: "GB002", value: "GB002", label: "Grade B", searchKey: "Grade B", nama: "Grade B" },
      { id: 3, kode: "GB003", value: "GB003", label: "Grade C", searchKey: "Grade C", nama: "Grade C" }
    ];
  }
};

// Fetch Term of Payment options from static API
export const getTermOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('💳 Fetching term options from static API...');
  }
  try {
    const response = await request('/static/term-of-payment', { method: 'GET' });
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Term options fetched:', response.data.length, 'items');
      const mappedData = response.data.map(item => ({
        'Kode': item.kode,
        'Nama Term': item.nama,
        'Deskripsi': item.deskripsi
      }));
      console.table(mappedData);
    }
    return response.data.map(item => ({
      value: item.kode, // Use kode as value (string)
      label: item.nama,
      searchKey: item.nama
    }));
  } catch (error) {
    console.error('❌ Error fetching term options:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using fallback term options');
    }
    // Fallback to default options
    return [
      { value: "CASH", label: "Cash", searchKey: "Cash" },
      { value: "CREDIT30", label: "Credit 30 Days", searchKey: "Credit 30 Days" },
      { value: "CREDIT60", label: "Credit 60 Days", searchKey: "Credit 60 Days" },
      { value: "DP", label: "Down Payment", searchKey: "Down Payment" }
    ];
  }
};

// Fetch Satuan options from static API
export const getUnitOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📏 Fetching satuan options from static API...');
  }
  try {
    const response = await request('/static/satuan', { method: 'GET' });
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Satuan options fetched:', response.data.length, 'items');
      const mappedData = response.data.map(item => ({
        'Kode': item.kode,
        'Nama Satuan': item.nama,
        'Deskripsi': item.deskripsi
      }));
      console.table(mappedData);
    }
    return response.data.map(item => ({
      value: item.kode, // Use kode as value (string)
      label: item.nama,
      searchKey: item.nama
    }));
  } catch (error) {
    console.error('❌ Error fetching satuan options:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using fallback satuan options');
    }
    // Fallback to default options
    return [
      { value: "PER_DIMENSI", label: "per dimensi", searchKey: "per dimensi" },
      { value: "PER_METER", label: "per meter", searchKey: "per meter" },
      { value: "PER_UNIT", label: "per unit", searchKey: "per unit" },
      { value: "PER_KG", label: "per kg", searchKey: "per kg" }
    ];
  }
};
