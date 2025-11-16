import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
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
import WorkOrderPage from "@/pages/work-order";
import AddWorkOrderPage from "@/pages/work-order/add";
import ViewWorkOrderPage from "@/pages/work-order/view";
import CanvasTestingPage from "@/pages/CanvasTesting";
import GridStackTestingPage from "@/pages/GridStackTesting";
import SimpleGridTestingPage from "@/pages/SimpleGridTesting";
import CanvasGridTestingPage from "@/pages/CanvasGridTesting";
import WorkOrderPlatShaftCanvasPage from "@/pages/work-order/PlatShaftCanvasPage";
import PurchaseOrderPage from "@/pages/purchase-order";
import AddPurchaseOrderPage from "@/pages/purchase-order/add";
import ViewPurchaseOrderPage from "@/pages/purchase-order/view";
import FinanceInvoicePodPage from "@/pages/finance-invoice-pod";
import PembayaranPage from "@/pages/pembayaran";

import DashboardWorkshopPage from "@/pages/dashboard/workshop";
import MutasiStockPage from "@/pages/mutasi-stock";
import AddMutasiStockPage from "@/pages/mutasi-stock/add";
import ViewMutasiStockPage from "@/pages/mutasi-stock/view";
import KonversiBarangPage from "@/pages/konversi-barang";
import MergeBarangPage from "@/pages/merge-barang";
import SplitBarangPage from "@/pages/split-barang";
import WOActualPage from "@/pages/wo-actual";
import WOActualDetailPage from "@/pages/wo-actual/detail";
import AddWOActualPage from "@/pages/wo-actual/add";
import ViewWOActualPage from "@/pages/wo-actual/view";
import ItemBarangRequestPage from "@/pages/item-barang-request";
import AddItemBarangRequestPage from "@/pages/item-barang-request/add";
import ViewItemBarangRequestPage from "@/pages/item-barang-request/view";

const AppRouter = () => {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="/work-order" element={<WorkOrderPage />} />
        <Route path="/work-order/add" element={<AddWorkOrderPage />} />
        <Route path="/work-order/view/:id" element={<ViewWorkOrderPage />} />
        <Route path="/work-order/plat-shaft-canvas" element={<WorkOrderPlatShaftCanvasPage />} />
        <Route path="/canvas-testing" element={<CanvasTestingPage />} />
        <Route path="/gridstack-testing" element={<GridStackTestingPage />} />
        <Route path="/simple-grid-testing" element={<SimpleGridTestingPage />} />
        <Route path="/canvas-grid-testing" element={<CanvasGridTestingPage />} />
        <Route path="/purchase-order" element={<PurchaseOrderPage />} />
        <Route path="/purchase-order/add" element={<AddPurchaseOrderPage />} />
        <Route path="/purchase-order/view/:id" element={<ViewPurchaseOrderPage />} />
        <Route path="/dashboard/workshop" element={<DashboardWorkshopPage />} />

        <Route path="/finance-invoice-pod" element={<FinanceInvoicePodPage />} />
        <Route path="/pembayaran" element={<PembayaranPage />} />
        <Route path="/mutasi-stock" element={<MutasiStockPage/>} />
        <Route path="/mutasi-stock/add" element={<AddMutasiStockPage />} />
        <Route path="/mutasi-stock/view/:id" element={<ViewMutasiStockPage />} />
        <Route path="/item-barang-request" element={<ItemBarangRequestPage />} />
        <Route path="/item-barang-request/add" element={<AddItemBarangRequestPage />} />
        <Route path="/item-barang-request/view/:id" element={<ViewItemBarangRequestPage />} />
        <Route path="/konversi-barang" element={<KonversiBarangPage/>}/>
        <Route path="/split-barang" element={<SplitBarangPage/>}/>
        <Route path="/merge-barang" element={<MergeBarangPage/>}/>

        <Route path="/wo-actual" element={<WOActualPage />} />
        <Route path="/wo-actual/add" element={<AddWOActualPage />} />
        <Route path="/wo-actual/detail/:id" element={<WOActualDetailPage />} />
        <Route path="/wo-actual/view/:id" element={<ViewWOActualPage />} />
      </Routes>
    );
};

export default AppRouter;