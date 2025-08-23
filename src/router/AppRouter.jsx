import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PurchaseOrderPage from "@/pages/PurchaseOrder";
import Register from "@/pages/Register";
import JenisBarangPage from "@/pages/JenisBarang";
import BentukBarangPage from "@/pages/BentukBarang";
import GradeBarangPage from "@/pages/GradeBarang";
import ItemBarangPage from "@/pages/ItemBarang";
import JenisMutasiStockPage from "@/pages/JenisMutasiStock";
import JenisTransaksiKasPage from "@/pages/JenisTransaksiKas";
import JenisBiayaPage from "@/pages/JenisBiaya";
import PelaksanaPage from "@/pages/Pelaksana";
import SupplierPage from "@/pages/Supplier";
import PelangganPage from "@/pages/Pelanggan";
import GudangPage from "@/pages/Gudang";
import WorkshopPage from "@/pages/Workshop";

const AppRouter = () => {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/input-po" element={<PurchaseOrderPage />} />
        <Route path="/masterdata/jenis-barang" element={<JenisBarangPage />} />
        <Route path="/masterdata/bentuk-barang" element={<BentukBarangPage />} />
        <Route path="/masterdata/grade-barang" element={<GradeBarangPage />} />
        <Route path="/masterdata/item-barang" element={<ItemBarangPage />} />
        <Route path="/masterdata/jenis-biaya" element={<JenisBiayaPage />} />
        <Route path="/masterdata/jenis-mutasi-stock" element={<JenisMutasiStockPage />} />
        <Route path="/masterdata/supplier" element={<SupplierPage />} />
        <Route path="/masterdata/pelanggan" element={<PelangganPage />} />
        <Route path="/masterdata/gudang" element={<GudangPage />} />
        <Route path="/masterdata/pelaksana" element={<PelaksanaPage />} />
        <Route path="/masterdata/jenis-transaksi-kas" element={<JenisTransaksiKasPage />} />
        <Route path="/workshop" element={<WorkshopPage />} />

      </Routes>
    );
};

export default AppRouter;