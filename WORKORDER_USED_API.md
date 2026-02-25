# Daftar API WorkOrder yang Dipakai di Frontend

Dokumen ini adalah ringkasan endpoint **Work Order Planning** & **WO Actual** yang **benar‑benar dipakai** di FE, diambil dari implementasi nyata (bukan semua endpoint teoretis).

Base URL global mengikuti konfigurasi di [api.js](file:///c:/Randy/Code/shn-react-main/src/config/api.js#L3-L20):

- Local: `http://localhost:8000/api`
- Prod: `https://shn.divineproject.my.id/api`

Semua path di bawah ini diasumsikan mempunyai prefix `/api` di backend.

---

## 1. Work Order Planning – List & Detail

Sumber utama: [workOrderService.js](file:///c:/Randy/Code/shn-react-main/src/services/workOrderService.js#L1-L55)

### 1.1 List Work Order Planning

- **Method**: `GET`
- **URL**: `/work-order-planning`
- **Dipakai di**: 
  - List WO Planning: [work-order/index.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/index.jsx#L136-L200)
  - Dashboard WO Planning (via service dashboard terpisah)
- **Query parameter yang benar‑benar dipakai FE** (lihat mapping di `loadWorkOrders`):
  - `page`
  - `per_page`
  - `search`
  - `status`
  - `nomor_wo`
  - `nomor_so`
  - `nama_customer`
  - `gudang`
  - `tanggal_wo_from`
  - `tanggal_wo_to`
  - `sort_by`
  - `sort_order` / `order`

### 1.2 Detail Work Order Planning by ID

- **Method**: `GET`
- **URL**: `/work-order-planning/{id}`
- **Dipakai di**:
  - Halaman detail WO Planning: [work-order/view.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/view.jsx#L145-L187)
  - Pengambilan WO Planning dari WO Actual Add: [wo-actual/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/add.jsx#L139-L181)
  - Pengambilan WO Planning dari WO Actual View: [wo-actual/view.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/view.jsx#L92-L97)

---

## 2. Work Order Planning – Create & Update

Sumber utama: [workOrderService.js](file:///c:/Randy/Code/shn-react-main/src/services/workOrderService.js#L57-L99), [work-order/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/add.jsx#L1360-L1396)

### 2.1 Create Work Order Planning

- **Method**: `POST`
- **URL**: `/work-order-planning`
- **Dipakai di**:
  - Halaman Input WO Planning: submit utama di [work-order/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/add.jsx)
- **Catatan**:
  - Payload di‑preprocess dengan `processWorkOrderItemsWithCanvasPreviews` sebelum dikirim.

### 2.2 Update Work Order Planning

- **Method**: `PUT`
- **URL**: `/work-order-planning/{id}`
- **Dipakai di**:
  - Halaman edit / update WO Planning (menggunakan `workOrderService.updateWorkOrder`).

---

## 3. Work Order Planning – Delete & Approval Flow

Sumber: [workOrderService.js](file:///c:/Randy/Code/shn-react-main/src/services/workOrderService.js#L101-L159), [work-order/index.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/index.jsx#L310-L363)

### 3.1 Delete Work Order (soft delete biasa)

- **Method**: `DELETE`
- **URL**: `/work-order-planning/{id}`
- **Dipakai di**:
  - Aksi delete langsung dari list WO (admin).

### 3.2 Request Delete Work Order

- **Method**: `POST`
- **URL**: `/work-order-planning/{id}/request-delete`
- **Dipakai di**:
  - User non‑admin meminta penghapusan WO.

### 3.3 Cancel Delete Request

- **Method**: `PATCH`
- **URL**: `/work-order-planning/{id}/cancel-delete-request`
- **Dipakai di**:
  - Pembatalan permintaan delete WO dari list WO.

### 3.4 Get Pending Delete Requests

- **Method**: `GET`
- **URL**: `/work-order-planning/pending-delete-requests`
- **Dipakai di**:
  - List permintaan delete untuk admin (modal / section approval).

### 3.5 Approve Delete

- **Method**: `PATCH`
- **URL**: `/work-order-planning/{id}/approve-delete`
- **Dipakai di**:
  - Admin menyetujui penghapusan WO.

### 3.6 Reject Delete

- **Method**: `PATCH`
- **URL**: `/work-order-planning/{id}/reject-delete`
- **Dipakai di**:
  - Admin menolak permintaan delete WO.

### 3.7 Soft Delete (Admin Only)

- **Method**: `DELETE`
- **URL**: `/work-order-planning/{id}/soft`
- **Dipakai di**:
  - Soft delete khusus admin (berbeda dengan request‑delete flow).

### 3.8 Restore Soft Deleted WO

- **Method**: `PATCH`
- **URL**: `/work-order-planning/{id}/restore`
- **Dipakai di**:
  - Restore WO yang sudah di‑soft delete.

### 3.9 Force Delete WO

- **Method**: `DELETE`
- **URL**: `/work-order-planning/{id}/force`
- **Dipakai di**:
  - Hard delete WO (admin).

---

## 4. Work Order Planning – Saran Plat Dasar & Canvas

Endpoint utilitas untuk rekomendasi plat dasar & layout canvas.

### 4.1 Get Saran Plat Utuh

Sumber: [work-order/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/add.jsx#L239-L259)

- **Method**: `POST`
- **URL**: `/work-order-planning/get-saran-plat-utuh`
- **Dipakai di**:
  - Modal “Saran Plat Utuh” saat memilih plat dasar dari item WO.

### 4.2 Get Saran Plat Dasar (Per Item)

Sumber: [work-order/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/add.jsx#L685-L273), [work-order/select-platshaftdasar.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/select-platshaftdasar.jsx#L251-L275)

- **Method**: `POST`
- **URL**: `/work-order-planning/get-saran-plat-dasar?per_page={perPage}&page=1`
- **Dipakai di**:
  - Pemilihan saran plat/shaft dasar untuk item WO.

### 4.3 Save WO + Saran Plat Dasar + Canvas (Combined)

Sumber: [API_endpoint3.md](file:///c:/Randy/Code/shn-react-main/API_endpoint3.md), [work-order/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/add.jsx#L1133-L1133)

- **Method**: `POST`
- **URL**: `/work-order-planning/with-saran-plat-dasar`
- **Dipakai di**:
  - Flow “Save WO” yang sekaligus menyimpan canvas dan mapping saran plat dasar.

### 4.4 Validate SO Coverage vs WO Planning

Sumber: [workOrderPlanningService.js](file:///c:/Randy/Code/shn-react-main/src/services/workOrderPlanningService.js#L4-L10), [work-order/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/add.jsx#L1360-L1378)

- **Method**: `POST`
- **URL**: `/work-order-planning/validate-so-coverage`
- **Dipakai di**:
  - Validasi sebelum simpan WO, memastikan total qty WO vs SO sudah konsisten.

### 4.5 Get All Canvas Images per Work Order

Sumber: [workOrderService.js](file:///c:/Randy/Code/shn-react-main/src/services/workOrderService.js#L193-L201), [work-order/view.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/work-order/view.jsx#L102-L111), [wo-actual/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/add.jsx#L466-L466), [wo-actual/view.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/view.jsx#L211-L211)

- **Method**: `GET`
- **URL**: `/work-order-planning/{id}/images`
- **Dipakai di**:
  - Halaman detail WO Planning (preview canvas terkait).
  - WO Actual (untuk menampilkan foto/canvas terkait WO Planning).

> Catatan: Method `getCanvasDataByItemBarangId` di `workOrderService` belum dipakai langsung di file JSX pada saat dokumentasi ini dibuat.

---

## 5. Work Order Actual – Endpoint yang Dipakai FE

Untuk WO Actual, FE **menggunakan service/halaman khusus** yang memanggil API dengan base `/work-order-actual`. Dari kode yang ada (index/add/view), pola penggunaannya:

### 5.1 List Work Order Actual

- **Method**: `GET`
- **URL**: `/work-order-actual`
- **Dipakai di**:
  - Halaman list WO Actual: [wo-actual/index.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/index.jsx)

### 5.2 Detail Work Order Actual by ID

- **Method**: `GET`
- **URL**: `/work-order-actual/{id}`
- **Dipakai di**:
  - Halaman detail WO Actual: [wo-actual/view.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/view.jsx)

### 5.3 Simpan Work Order Actual

- **Method**: `POST`
- **URL**: `/work-order-actual`
- **Dipakai di**:
  - Halaman input WO Actual: [wo-actual/add.jsx](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/add.jsx#L369-L379) – payload berisi `planningWorkOrderId`, `items`, `assignments`, dan `foto_bukti` (base64).

> Detail field permintaan/response lengkap bisa dilihat di [wo-actual/response_fields_used.json](file:///c:/Randy/Code/shn-react-main/src/pages/wo-actual/response_fields_used.json).

---

## 6. Ringkasan Singkat

Jika diringkas, endpoint WorkOrder yang **benar‑benar dipanggil dari JSX saat ini** adalah:

- `GET /work-order-planning`
- `GET /work-order-planning/{id}`
- `POST /work-order-planning/{id}/request-delete`
- `PATCH /work-order-planning/{id}/cancel-delete-request`
- `DELETE /work-order-planning/{id}/soft`
- `POST /work-order-planning/get-saran-plat-utuh`
- `POST /work-order-planning/get-saran-plat-dasar`
- `POST /work-order-planning/with-saran-plat-dasar`
- `POST /work-order-planning/validate-so-coverage`
- `GET /work-order-planning/{id}/images`
- `GET /work-order-actual`
- `GET /work-order-actual/{id}`
- `POST /work-order-actual`
