# API Endpoint Tambahan (Ringkas)

## Authentication
- Change Password: `POST /api/auth/change-password`
  - Request:
    ```json
    {
      "user_id": 123,
      "password": "password_baru_anda",
      "password_confirmation": "password_baru_anda"
    }
    ```
    atau menggunakan username:
    ```json
    {
      "username": "john_doe",
      "password": "password_baru_anda",
      "password_confirmation": "password_baru_anda"
    }
    ```
  - Response (Success):
    ```json
    {
      "success": true,
      "message": "Password berhasil diubah"
    }
    ```
  - Response (Error - Validation):
    ```json
    {
      "success": false,
      "message": "Konfirmasi password tidak cocok"
    }
    ```
  - Response (Error - Server):
    ```json
    {
      "success": false,
      "message": "Gagal mengubah password. Silakan coba lagi nanti."
    }
    ```
  - Validasi:
    - `user_id` atau `username`: wajib salah satu, harus ada di database (jika belum login/token)
    - `password`: wajib, minimal 8 karakter
    - `password_confirmation`: wajib, harus sama dengan `password`

## Master Data - Gudang
- List Gudang: `GET /api/gudang`
  - Filter `tipe_gudang`: `GET /api/gudang?tipe_gudang=gudang` atau `GET /api/gudang?tipe_gudang=rak` (case-insensitive)
- Create Gudang: `POST /api/gudang`
  - Request:
    ```json
    {
      "kode": "GDG-001",
      "nama_gudang": "Gudang Utama",
      "tipe_gudang": "gudang",
      "parent_id": null,
      "telepon_hp": "08123456789",
      "kapasitas": 1000
    }
    ```
  - Validasi:
    - `tipe_gudang`: hanya menerima nilai `gudang` atau `rak` (case-insensitive, akan otomatis dikonversi ke lowercase)
- Update Gudang: `PUT /api/gudang/{id}`
  - Request: sama dengan create
  - Validasi: sama dengan create

## Item Barang Request

Ringkasan endpoint baru, dengan contoh singkat request/response.

## Item Barang Request
- Create: `POST /api/item-barang-request`
  - Request (referensi item): `{ "item_barang_id": 6, "quantity": 1 }`
  - Response: menyertakan `nomor_request`, `requested_at`, `asal_gudang`, `tujuan_gudang`
- Get by ID: `GET /api/item-barang-request/{id}`
  - Response: detail request + `asal_gudang`, `tujuan_gudang`, `item_barang.gudang`
- Approve: `PATCH /api/item-barang-request/{id}/approve`
  - Request: `{ "gudang_tujuan_id": 2, "item_barang_id": 42 }`
  - Response: `{ request, updated_item }` (item pindah gudang, `jenis_potongan = "potongan"`)
- Cancel: `DELETE /api/item-barang-request/{id}`
  - Soft delete; hanya untuk status `pending` oleh pemilik

## Item Barang Canvas
- Save canvas: `POST /api/item-barang/canvas/{itemBarangId}` (wajib `canvas_image` dan `canvas_json`)
  - Request:
    ```json
    {
      "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAA...",
      "canvas_json": "{ \"lines\": [...], \"shapes\": [...] }"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Canvas berhasil disimpan",
      "data": {
        "item_barang_id": 42,
        "file_path_image": "canvas/item-barang/42/canvas.jpg",
        "file_path_json": "canvas/item-barang/42/canvas.json"
      }
    }
    ```
- Get canvas (image + json): `GET /api/item-barang/canvas/{itemBarangId}`
  - Response (jika file ada):
    ```json
    {
      "success": true,
      "message": "Canvas ditemukan",
      "data": {
        "item_barang_id": 42,
        "file_path_image": "canvas/item-barang/42/canvas.jpg",
        "file_path_json": "canvas/item-barang/42/canvas.json",
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAA...",
        "json": { "lines": [], "shapes": [] }
      }
    }
    ```
  - Response (jika belum ada file → kosong, tetap editable):
    ```json
    {
      "success": true,
      "message": "Canvas kosong",
      "data": {
        "item_barang_id": 42,
        "file_path_image": null,
        "file_path_json": null,
        "image_base64": null,
        "json": {}
      }
    }
    ```

## Contoh di Work Order Planning
- Simpan canvas per item setelah WO Planning dibuat:
  - Ambil `item_barang_id` dari item terkait, lalu panggil `POST /api/item-barang/canvas/{itemBarangId}` dengan base64
- Tampilkan preview saat user membuka item:
  - Panggil `GET /api/item-barang/canvas/{itemBarangId}` lalu render `image_base64` jika ada
## Notifications
- Create: `POST /api/notifications`
  - Request: `{ "title": "...", "message": "...", "type": "sales_order", "recipients": [2,5] }`
  - Response: notifikasi + recipients
- Get by user: `GET /api/notifications/by-user/{userId}`
  - Query: `per_page`, `unread`
  - Response: daftar notif user dengan `is_read`, `read_at`

## Work Order Planning
- Validate SO coverage: `POST /api/work-order-planning/validate-so-coverage`
  - Request: `{ "id_sales_order": 123, "items": [{ "sales_order_item_id": 1001, "quantity": 2 }] }`
  - Response valid: `{ "success": true, "data": { "valid": true } }`
  - Response tidak valid: `{ "success": true, "data": { "valid": false, "mismatches": [...] } }`
  - Contoh `mismatches`:
    ```json
    [
      {
        "sales_order_item_id": 1003,
        "expected_qty": 3,
        "combined_qty": 2,
        "difference": -1,
        "existing_planned_qty": 1,
        "incoming_qty": 1,
        "jenis_barang": { "id": 8, "nama": "Aluminium" },
        "bentuk_barang": { "id": 9, "nama": "Plat" },
        "grade_barang": { "id": 6, "nama": "A" }
      }
    ]
    ```
- Save WO: `POST /api/work-order-planning`
  - Request wajib menyertakan `typeWO` (`normal`, `pending`, `cancel`)
  - Efek:
    - `pending`: set `sales_order.is_wo_qty_matched = false`, `process_status = 'pending'`, status tetap `active`
    - `normal`: tidak mengubah SO (default `is_wo_qty_matched = true`)
    - `cancel`: set `sales_order.status = 'closed'`, `process_status = 'cancel'`
  - Notifikasi admin: untuk `Pending` dan `Batal` dibuat notifikasi ke semua user role admin dengan pesan bahwa qty WO vs SO tidak match (berisi `nomor_so` dan `nomor_wo`)
  - Contoh request:
    ```json
    {
      "wo_unique_id": "WO-TEMP-123",
      "id_sales_order": 123,
      "id_pelanggan": 45,
      "id_gudang": 3,
      "status": "pending",
      "typeWO": "pending",
      "tanggal_wo": "2025-12-05",
      "prioritas": "normal",
      "handover_method": "pickup",
      "items": [
        {
          "wo_item_unique_id": "WOITEM-001",
          "sales_order_item_id": 1001,
          "qty": 2,
          "berat": 10.5,
          "satuan": "PCS"
        }
      ]
    }
    ```

## Work Order Actual
- Save Actual: `POST /api/work-order-actual`
  - Catatan format:
    - `tanggal`: `YYYY-MM-DD`
    - `jamMulai` dan `jamSelesai`: `HH:mm:ss`
    - `items.*.timestamp`: optional, `date` (boleh ISO-8601)
    - `jenis_potongan` disimpan per item actual mengikuti item planning
    - `foto_bukti` dan `items.*.foto_bukti`: base64 image string
  - Request:
    ```json
    {
      "foto_bukti": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAA...",
      "actualWorkOrderId": null,
      "planningWorkOrderId": 123,
      "items": {
        "1001": {
          "qtyActual": 2,
          "berat": 10.5,
          "foto_bukti": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAA...",
          "assignments": [
            {
              "pelaksana_id": 7,
              "qty": 2,
              "weight": 10.5,
              "tanggal": "2025-12-22",
              "jamMulai": "08:00:00",
              "jamSelesai": "10:00:00",
              "catatan": "Shift pagi"
            }
          ],
          "timestamp": "2025-12-22T08:00:00.000000Z"
        },
        "1002": {
          "qtyActual": 1,
          "berat": 5.0,
          "assignments": [
            {
              "pelaksana_id": 8,
              "qty": 1,
              "berat": 5.0,
              "tanggal": "2025-12-22",
              "jamMulai": "13:00:00",
              "jamSelesai": "14:00:00"
            }
          ]
        }
      }
    }
    ```
  - Response (201):
    ```json
    {
      "success": true,
      "message": "Data WorkOrderActual berhasil disimpan"
    }
    ```

## Pelanggan
Fields (data): `kode`, `nama_pelanggan`, `kota`, `telepon_hp`, `contact_person`, `id`

- Create: `POST /api/pelanggan`
  - Request:
    ```json
    {
      "kode": "CUST-001",
      "nama_pelanggan": "PT Contoh",
      "kota": "Jakarta",
      "telepon_hp": "08123456789",
      "contact_person": "Budi",
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Data berhasil ditambahkan",
      "data": {
        "id": 9,
        "kode": "CUST-001",
        "nama_pelanggan": "PT Contoh",
        "kota": "Jakarta",
        "telepon_hp": "08123456789",
        "contact_person": "Budi",
      }
    }
    ```

- Item Barang Mergeable: `GET /api/item-barang/mergeable`
  - Query: `per_page`, `page`, `search`
  - Search di: `kode_barang`, `nama_item_barang`, `gudang.nama_gudang`, `gudang.kode`, `jenisBarang.kode`, `bentukBarang.kode`, `gradeBarang.kode`
  - Response (paginated):
    ```json
    {
      "success": true,
      "message": "Data ditemukan",
      "data": [
        {
          "id": 101,
          "kode_barang": "PLT-ALU-A-200x100x5-000123",
          "nama_item_barang": "PLT-ALU-A-200x100x5",
          "jenis_potongan": "utuh",
          "quantity": 12,
          "gudang": { "id": 3, "kode": "GDG-01", "nama_gudang": "Gudang Utama" },
          "jenisBarang": { "id": 8, "kode": "ALU" },
          "bentukBarang": { "id": 9, "kode": "PLT" },
          "gradeBarang": { "id": 6, "kode": "A" }
        }
      ],
      "pagination": {
        "current_page": 1,
        "per_page": 50,
        "last_page": 10,
        "total": 500
      }
    }
    ```

 - Item Barang Similar Type: `GET /api/item-barang/similar-type/{id}`
   - Query: `per_page`, `page`, `search`
   - Mengembalikan item di gudang yang sama, dengan kombinasi `jenis_barang_id`, `bentuk_barang_id`, `grade_barang_id`, dan `tebal` yang sama, serta `jenis_potongan = 'utuh'`
   - Search di: `kode_barang`, `nama_item_barang`, `gudang.nama_gudang`, `gudang.kode`, `jenisBarang.kode`, `bentukBarang.kode`, `gradeBarang.kode`
   - Response (paginated):
     ```json
     {
       "success": true,
       "message": "Data ditemukan",
       "data": [
         {
           "id": 202,
           "kode_barang": "PLT-ALU-A-200x100x5-000456",
           "nama_item_barang": "PLT-ALU-A-200x100x5",
           "jenis_potongan": "utuh",
           "quantity": 6,
           "gudang": { "id": 3, "kode": "GDG-01", "nama_gudang": "Gudang Utama" },
           "jenisBarang": { "id": 8, "kode": "ALU" },
           "bentukBarang": { "id": 9, "kode": "PLT" },
           "gradeBarang": { "id": 6, "kode": "A" }
         }
       ],
       "pagination": {
         "current_page": 1,
         "per_page": 50,
         "last_page": 3,
         "total": 120
       }
     }
     ```

- List: `GET /api/pelanggan`
  - Query: `per_page`, `search`, `sort_by`, `order`
  - Response (paginated):
    ```json
    {
      "success": true,
      "message": "Data ditemukan",
      "data": [
        {
          "id": 8,
          "kode": "CUST-0008",
          "nama_pelanggan": "PT Sampoerna",
          "kota": "Surabaya",
          "telepon_hp": "0812xxxx",
          "contact_person": "Agus",
        }
      ],
      "pagination": {
        "current_page": 1,
        "per_page": 100,
        "last_page": 1,
        "total": 1
      }
    }
    ```

- Show: `GET /api/pelanggan/{id}`
  - Response:
    ```json
    {
      "success": true,
      "message": "Data ditemukan",
      "data": {
        "id": 8,
        "kode": "CUST-0008",
        "nama_pelanggan": "PT Sampoerna",
        "kota": "Surabaya",
        "telepon_hp": "0812xxxx",
        "contact_person": "Agus",
      }
    }
    ```

- Update: `PATCH /api/pelanggan/{id}`
  - Request (contoh minimal):
    ```json
    {
      "nama_pelanggan": "PT Sampoerna Tbk",
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Data berhasil diupdate",
      "data": {
        "id": 8,
        "kode": "CUST-0008",
        "nama_pelanggan": "PT Sampoerna Tbk",
        "kota": "Surabaya",
        "telepon_hp": "0812xxxx",
        "contact_person": "Agus",
        "email": "halo@sampoerna.co.id"
      }
    }
    ```

- Delete (soft): `DELETE /api/pelanggan/{id}`
  - Response:
    ```json
    { "success": true, "message": "Data berhasil di-soft delete", "data": null }
    ```

- Restore: `PATCH /api/pelanggan/{id}/restore`
  - Response:
    ```json
    {
      "success": true,
      "message": "Data berhasil di-restore",
      "data": { "id": 8, "kode": "CUST-0008", "nama_pelanggan": "PT Sampoerna" }
    }
    ```
## Sales Order Header
- List: `GET /api/sales-order/header`
  - Query params:
    - `per_page` (default 100)
    - `search` (mencari di beberapa kolom dasar)
    - `sort_by`, `order` atau `sort` multi
    - `process_status` (exact match)
    - `status` (exact match; nilai enum: `active`, `delete_requested`, `deleted`, `closed`)
  - Contoh:
    - `GET /api/sales-order/header?status=closed&per_page=1000`
    - `GET /api/sales-order/header?status=cancel&sort_by=id&order=desc`
    - `GET /api/sales-order/header?process_status=pending&status=active`

## Purchase Order Dropdowns
- Order pemilihan: Supplier → Jenis Barang → Grade Barang → Bentuk Barang
- Supplier: `GET /api/supplier`
  - Query: `per_page`, `page`, `search`
  - Fields: `id`, `kode`, `nama_supplier`, `kota`, `telepon_hp`, `contact_person`
- Jenis Barang: `GET /api/jenis-barang`
  - Query: `per_page`, `page`, `search`
  - Fields: `id`, `kode`, `nama_jenis`
- Grade Barang: `GET /api/grade-barang`
  - Query: `per_page`, `page`, `search`
  - Fields: `id`, `kode`, `nama`
- Bentuk Barang: `GET /api/bentuk-barang`
  - Query: `per_page`, `page`, `search`
  - Fields: `id`, `kode`, `nama_bentuk`, `dimensi`
