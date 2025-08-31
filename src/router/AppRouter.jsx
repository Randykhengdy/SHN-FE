import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PurchaseOrderPage from "@/pages/PurchaseOrder";
import Register from "@/pages/Register";
import JenisBarangPage from "@/pages/master-data/JenisBarang";
import BentukBarangPage from "@/pages/master-data/BentukBarang";
import GradeBarangPage from "@/pages/master-data/GradeBarang";
import ItemBarangPage from "@/pages/master-data/ItemBarang";
import JenisMutasiStockPage from "@/pages/master-data/JenisMutasiStock";
import JenisTransaksiKasPage from "@/pages/master-data/JenisTransaksiKas";
import JenisBiayaPage from "@/pages/master-data/JenisBiaya";
import PelaksanaPage from "@/pages/master-data/Pelaksana";
import SupplierPage from "@/pages/master-data/Supplier";
import PelangganPage from "@/pages/master-data/Pelanggan";
import GudangPage from "@/pages/master-data/Gudang";
import RolePage from "@/pages/master-data/Role";
import TermPage from "@/pages/master-data/Term";
import UnitPage from "@/pages/master-data/Unit";
import UsersPage from "@/pages/Users";
import WorkshopPage from "@/pages/Workshop";
import SalesOrderPage from "@/pages/sales-order";
import AddSalesOrderPage from "@/pages/sales-order/add";
import ViewSalesOrderPage from "@/pages/sales-order/view";
import ApprovalPage from "@/pages/approval";

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
        <Route path="/masterdata/role" element={<RolePage />} />
        <Route path="/masterdata/term" element={<TermPage />} />
        <Route path="/masterdata/unit" element={<UnitPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/workshop" element={<WorkshopPage />} />
        <Route path="/sales-order" element={<SalesOrderPage />} />
        <Route path="/sales-order/add" element={<AddSalesOrderPage />} />
        <Route path="/sales-order/view/:id" element={<ViewSalesOrderPage />} />
        <Route path="/approval" element={<ApprovalPage />} />

      </Routes>
    );
};

export default AppRouter;