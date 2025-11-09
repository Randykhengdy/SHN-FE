# API Endpoints Documentation

## Authentication
- `POST /api/auth/login` - Login user
  - **Request:** `{ "email": "string", "password": "string" }`
  - **Response:** `{ "access_token": "string", "refresh_token": "string", "user": {...} }`
- `POST /api/auth/refresh` - Refresh token
  - **Request:** `{ "refresh_token": "string" }`
- `POST /api/auth/logout` - Logout user

## User Management
- `GET /api/users` - List all users
  - **Response:** `{ "data": [{ "id": "int", "name": "string", "username": "string", "email": "string", "roles": [{ "id": "int", "name": "string" }] }] }`
- `POST /api/users` - Create new user (Admin only)
  - **Request:** `{ "username": "string", "name": "string", "email": "string", "password": "string", "role_id": "int" }`
  - **Response:** `{ "id": "int", "name": "string", "username": "string", "email": "string", "roles": [{ "id": "int", "name": "string" }] }`
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
  - **Request:** `{ "name": "string", "username": "string", "email": "string", "password": "string" }`
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Soft delete user
- `DELETE /api/users/{id}/soft` - Soft delete user
- `DELETE /api/users/{id}/force` - Force delete user (permanent)
- `PATCH /api/users/{id}/restore` - Restore soft deleted user
- `GET /api/users-with-trashed/all` - Get all users including deleted
- `GET /api/users-with-trashed/trashed` - Get only deleted users
- `POST /api/register` - Register new user
  - **Request:** `{ "username": "string", "name": "string", "email": "string", "password": "string", "role_id": "int" }`

## Role Management
- `GET /api/roles` - List all roles
  - **Response:** `{ "data": [{ "id": "int", "nama_role": "string" }] }`

## Permission Management
- `GET /api/permissions` - List all permissions
  - **Response:** `{ "data": [{ "id": "int", "nama_permission": "string" }] }`
- `GET /api/permissions/{id}` - Get permission by ID

## Role Menu Permission Management
- `GET /api/role-menu-permission` - List all role-menu-permission mappings
  - **Response:** `{ "data": [{ "id": "int", "role_id": "int", "menu_id": "int", "permission_id": "int", "role": {...}, "menu": {...}, "permission": {...} }] }`
- `POST /api/role-menu-permission` - Create new role-menu-permission mapping
  - **Request:** `{ "role_id": "int", "menu_id": "int", "permission_id": "int" }`
- `GET /api/role-menu-permission/{id}` - Get role-menu-permission mapping by ID
- `PUT /api/role-menu-permission/{id}` - Update role-menu-permission mapping
  - **Request:** `{ "role_id": "int", "menu_id": "int", "permission_id": "int" }`
- `PATCH /api/role-menu-permission/{id}` - Update role-menu-permission mapping
- `DELETE /api/role-menu-permission/{id}` - Delete role-menu-permission mapping
- `GET /api/role-menu-permission/by-role/{roleId}` - Get role-menu-permission mappings by role ID
- `GET /api/role-menu-permission/by-menu/{menuId}` - Get role-menu-permission mappings by menu ID
- `POST /api/role-menu-permission/bulk` - Bulk create role-menu-permission mappings
  - **Request:** `{ "role_id": "int", "mappings": [{ "menu_id": "int", "permission_id": "int" }] }`
- `DELETE /api/role-menu-permission/by-role/{roleId}` - Delete all mappings for a specific role
- `DELETE /api/role-menu-permission/by-menu/{menuId}` - Delete all mappings for a specific menu

## Menu Management
- `GET /api/menu` - List all menus
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "nama_menu": "string" }] }`
- `POST /api/menu` - Create new menu
  - **Request:** `{ "kode": "string", "nama_menu": "string" }`
- `GET /api/menu/{id}` - Get menu by ID
- `PUT /api/menu/{id}` - Update menu
  - **Request:** `{ "kode": "string", "nama_menu": "string" }`
- `PATCH /api/menu/{id}` - Update menu
- `DELETE /api/menu/{id}/soft` - Soft delete menu
- `PATCH /api/menu/{id}/restore` - Restore soft deleted menu
- `DELETE /api/menu/{id}/force` - Force delete menu
- `GET /api/menu/with-trashed/all` - Get all menus including deleted
- `GET /api/menu/with-trashed/trashed` - Get only deleted menus
- `GET /api/menu-with-permissions` - Get all menus with available permissions for role mapping
  - **Response:** `{ "success": true, "message": "string", "data": [{ "id": "int", "kode": "string", "nama_menu": "string", "available_permissions": [{ "id": "int", "nama_permission": "string" }] }] }`

## Master Data - Jenis Barang
- `GET /api/jenis-barang` - List all jenis barang
  - **Response:** `{ "data": [{ "id": "int", "nama_jenis_barang": "string" }] }`
- `POST /api/jenis-barang` - Create new jenis barang
  - **Request:** `{ "nama_jenis_barang": "string" }`
- `GET /api/jenis-barang/{id}` - Get jenis barang by ID
- `PUT /api/jenis-barang/{id}` - Update jenis barang
  - **Request:** `{ "nama_jenis_barang": "string" }`
- `PATCH /api/jenis-barang/{id}` - Update jenis barang
- `DELETE /api/jenis-barang/{id}` - Delete jenis barang
- `DELETE /api/jenis-barang/{id}/soft` - Soft delete jenis barang
- `PATCH /api/jenis-barang/{id}/restore` - Restore soft deleted jenis barang
- `DELETE /api/jenis-barang/{id}/force` - Force delete jenis barang
- `GET /api/jenis-barang/with-trashed/all` - Get all jenis barang including deleted
- `GET /api/jenis-barang/with-trashed/trashed` - Get only deleted jenis barang

## Master Data - Bentuk Barang
- `GET /api/bentuk-barang` - List all bentuk barang
  - **Response:** `{ "data": [{ "id": "int", "nama_bentuk_barang": "string" }] }`
- `POST /api/bentuk-barang` - Create new bentuk barang
  - **Request:** `{ "nama_bentuk_barang": "string" }`
- `GET /api/bentuk-barang/{id}` - Get bentuk barang by ID
- `PUT /api/bentuk-barang/{id}` - Update bentuk barang
  - **Request:** `{ "nama_bentuk_barang": "string" }`
- `PATCH /api/bentuk-barang/{id}` - Update bentuk barang
- `DELETE /api/bentuk-barang/{id}` - Delete bentuk barang
- `DELETE /api/bentuk-barang/{id}/soft` - Soft delete bentuk barang
- `PATCH /api/bentuk-barang/{id}/restore` - Restore soft deleted bentuk barang
- `DELETE /api/bentuk-barang/{id}/force` - Force delete bentuk barang
- `GET /api/bentuk-barang/with-trashed/all` - Get all bentuk barang including deleted
- `GET /api/bentuk-barang/with-trashed/trashed` - Get only deleted bentuk barang

## Master Data - Grade Barang
- `GET /api/grade-barang` - List all grade barang
  - **Response:** `{ "data": [{ "id": "int", "nama_grade_barang": "string" }] }`
- `POST /api/grade-barang` - Create new grade barang
  - **Request:** `{ "nama_grade_barang": "string" }`
- `GET /api/grade-barang/{id}` - Get grade barang by ID
- `PUT /api/grade-barang/{id}` - Update grade barang
  - **Request:** `{ "nama_grade_barang": "string" }`
- `PATCH /api/grade-barang/{id}` - Update grade barang
- `DELETE /api/grade-barang/{id}` - Delete grade barang
- `DELETE /api/grade-barang/{id}/soft` - Soft delete grade barang
- `PATCH /api/grade-barang/{id}/restore` - Restore soft deleted grade barang
- `DELETE /api/grade-barang/{id}/force` - Force delete grade barang
- `GET /api/grade-barang/with-trashed/all` - Get all grade barang including deleted
- `GET /api/grade-barang/with-trashed/trashed` - Get only deleted grade barang

## Master Data - Item Barang
- `GET /api/item-barang` - List all item barang
  - **Query Parameters**:
    - `gudang_id` (optional): Filter berdasarkan gudang ID
    - `per_page` (optional): Jumlah item per halaman (default: 10)
    - `search` (optional): Pencarian berdasarkan kode_barang atau nama_item_barang
    - `sort` (optional): Field untuk sorting
    - `order` (optional): Arah sorting (asc/desc, default: asc)
  - **Response:** `{ "data": [{ "id": "int", "kode_barang": "string", "nama_item_barang": "string", "sisa_luas": "decimal", "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "berat": "decimal", "quantity": "decimal", "quantity_tebal_sama": "decimal", "jenis_potongan": "string", "is_available": "boolean", "is_edit": "boolean", "is_edit_by": "string", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "gudang_id": "int" }] }`
  - **Example**: `GET /api/item-barang?gudang_id=1&search=aluminium&per_page=20`
- `GET /api/item-barang/by-gudang/{gudangId}` - Get item barang by gudang ID with search functionality
  - **Description**: Mendapatkan daftar item barang berdasarkan gudang ID dengan fitur pencarian
  - **Query Parameters**:
    - `per_page` (optional): Jumlah item per halaman (default: 10)
    - `search` (optional): Pencarian berdasarkan nama item barang
    - `sort` (optional): Field untuk sorting (kode_barang, nama_item_barang)
    - `order` (optional): Arah sorting (asc/desc, default: asc)
  - **Response**: Pagination standard dengan relasi `jenisBarang`, `bentukBarang`, `gradeBarang`, `gudang`
  - **Example**: `GET /api/item-barang/by-gudang/1?search=aluminium&per_page=20&sort=nama_item_barang&order=desc`
- `POST /api/item-barang` - Create new item barang
  - **Request:** `{ "kode_barang": "string", "nama_item_barang": "string", "sisa_luas": "decimal", "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "quantity": "decimal", "quantity_tebal_sama": "decimal", "jenis_potongan": "string", "is_available": "boolean", "is_edit": "boolean", "is_edit_by": "string", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "gudang_id": "int" }`
- `GET /api/item-barang/{id}` - Get item barang by ID
  - **Query Parameters**:
    - `gudang_id` (optional): Filter berdasarkan gudang ID untuk memastikan item berada di gudang yang benar
  - **Response**: Item barang dengan relasi `jenisBarang`, `bentukBarang`, `gradeBarang`, `gudang`
  - **Example**: `GET /api/item-barang/1?gudang_id=2`
- `PUT /api/item-barang/{id}` - Update item barang
  - **Query Parameters**:
    - `gudang_id` (optional): Filter berdasarkan gudang ID untuk memastikan item berada di gudang yang benar sebelum update
  - **Request:** `{ "kode_barang": "string", "nama_item_barang": "string", "sisa_luas": "decimal", "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "quantity": "decimal", "quantity_tebal_sama": "decimal", "jenis_potongan": "string", "is_available": "boolean", "is_edit": "boolean", "is_edit_by": "string", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "gudang_id": "int" }`
  - **Example**: `PUT /api/item-barang/1?gudang_id=2`
- `PATCH /api/item-barang/{id}` - Update item barang
  - **Query Parameters**:
    - `gudang_id` (optional): Filter berdasarkan gudang ID untuk memastikan item berada di gudang yang benar sebelum update
  - **Example**: `PATCH /api/item-barang/1?gudang_id=2`
- `DELETE /api/item-barang/{id}/soft` - Soft delete item barang
- `PATCH /api/item-barang/{id}/restore` - Restore soft deleted item barang
- `DELETE /api/item-barang/{id}/force` - Force delete item barang
- `GET /api/item-barang/with-trashed/all` - Get all item barang including deleted
- `GET /api/item-barang/with-trashed/trashed` - Get only deleted item barang
- `GET /api/item-barang/{itemBarangId}/canvas` - Get canvas data by item barang ID
  - **Description**: Mendapatkan canvas data (JSON) berdasarkan item barang ID dari tabel ref_item_barang
  - **Response**: JSON canvas data langsung (tanpa wrapper object)
  - **Example**: `GET /api/item-barang/1/canvas` akan mengembalikan canvas data untuk item barang ID 1
- `GET /api/item-barang/{itemBarangId}/canvas-image` - Get canvas image by item barang ID
  - **Description**: Mendapatkan canvas image (base64) berdasarkan item barang ID dari tabel ref_item_barang
  - **Response**: 
    ```json
    {
      "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    }
    ```
  - **Note**: 
    - Return base64 encoded JPG image dengan prefix data URI
    - Return error 404 jika file tidak ditemukan
  - **Example**: `GET /api/item-barang/1/canvas-image` akan mengembalikan canvas image untuk item barang ID 1

## Master Data - Jenis Transaksi Kas
- `GET /api/jenis-transaksi-kas` - List all jenis transaksi kas
  - **Response:** `{ "data": [{ "id": "int", "nama_jenis_transaksi_kas": "string" }] }`
- `POST /api/jenis-transaksi-kas` - Create new jenis transaksi kas
  - **Request:** `{ "nama_jenis_transaksi_kas": "string" }`
- `GET /api/jenis-transaksi-kas/{id}` - Get jenis transaksi kas by ID
- `PUT /api/jenis-transaksi-kas/{id}` - Update jenis transaksi kas
  - **Request:** `{ "nama_jenis_transaksi_kas": "string" }`
- `PATCH /api/jenis-transaksi-kas/{id}` - Update jenis transaksi kas
- `DELETE /api/jenis-transaksi-kas/{id}/soft` - Soft delete jenis transaksi kas
- `PATCH /api/jenis-transaksi-kas/{id}/restore` - Restore soft deleted jenis transaksi kas
- `DELETE /api/jenis-transaksi-kas/{id}/force` - Force delete jenis transaksi kas
- `GET /api/jenis-transaksi-kas/with-trashed/all` - Get all jenis transaksi kas including deleted
- `GET /api/jenis-transaksi-kas/with-trashed/trashed` - Get only deleted jenis transaksi kas

## Master Data - Gudang
- `GET /api/gudang` - List all gudang
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "nama_gudang": "string", "tipe_gudang": "string", "parent_id": "int|null", "telepon_hp": "string", "kapasitas": "float|null" }] }`
- `GET /api/gudang/tipe` - Get tipe gudang
- `GET /api/gudang/hierarchy` - Get gudang hierarchy
- `POST /api/gudang` - Create new gudang
  - **Request:** `{ "kode": "string", "nama_gudang": "string", "tipe_gudang": "string", "parent_id": "int|null", "telepon_hp": "string", "kapasitas": "float|null" }`
- `GET /api/gudang/{id}` - Get gudang by ID
- `GET /api/gudang/{id}/parent` - Get gudang parent
- `GET /api/gudang/{id}/children` - Get gudang children
- `GET /api/gudang/{id}/descendants` - Get gudang descendants
- `GET /api/gudang/{id}/ancestors` - Get gudang ancestors
- `PUT /api/gudang/{id}` - Update gudang
  - **Request:** `{ "kode": "string", "nama_gudang": "string", "tipe_gudang": "string", "parent_id": "int|null", "telepon_hp": "string", "kapasitas": "float|null" }`
- `PATCH /api/gudang/{id}` - Update gudang
- `DELETE /api/gudang/{id}/soft` - Soft delete gudang
- `PATCH /api/gudang/{id}/restore` - Restore soft deleted gudang
- `DELETE /api/gudang/{id}/force` - Force delete gudang
- `GET /api/gudang/with-trashed/all` - Get all gudang including deleted
- `GET /api/gudang/with-trashed/trashed` - Get only deleted gudang

## Master Data - Jenis Biaya
- `GET /api/jenis-biaya` - List all jenis biaya
  - **Response:** `{ "data": [{ "id": "int", "nama_jenis_biaya": "string" }] }`
- `POST /api/jenis-biaya` - Create new jenis biaya
  - **Request:** `{ "nama_jenis_biaya": "string" }`
- `GET /api/jenis-biaya/{id}` - Get jenis biaya by ID
- `PUT /api/jenis-biaya/{id}` - Update jenis biaya
  - **Request:** `{ "nama_jenis_biaya": "string" }`
- `PATCH /api/jenis-biaya/{id}` - Update jenis biaya
- `DELETE /api/jenis-biaya/{id}/soft` - Soft delete jenis biaya
- `PATCH /api/jenis-biaya/{id}/restore` - Restore soft deleted jenis biaya
- `DELETE /api/jenis-biaya/{id}/force` - Force delete jenis biaya
- `GET /api/jenis-biaya/with-trashed/all` - Get all jenis biaya including deleted
- `GET /api/jenis-biaya/with-trashed/trashed` - Get only deleted jenis biaya

## Master Data - Jenis Mutasi Stock
- `GET /api/jenis-mutasi-stock` - List all jenis mutasi stock
  - **Response:** `{ "data": [{ "id": "int", "nama_jenis_mutasi_stock": "string" }] }`
- `POST /api/jenis-mutasi-stock` - Create new jenis mutasi stock
  - **Request:** `{ "nama_jenis_mutasi_stock": "string" }`
- `GET /api/jenis-mutasi-stock/{id}` - Get jenis mutasi stock by ID
- `PUT /api/jenis-mutasi-stock/{id}` - Update jenis mutasi stock
  - **Request:** `{ "nama_jenis_mutasi_stock": "string" }`
- `PATCH /api/jenis-mutasi-stock/{id}` - Update jenis mutasi stock
- `DELETE /api/jenis-mutasi-stock/{id}/soft` - Soft delete jenis mutasi stock
- `PATCH /api/jenis-mutasi-stock/{id}/restore` - Restore soft deleted jenis mutasi stock
- `DELETE /api/jenis-mutasi-stock/{id}/force` - Force delete jenis mutasi stock
- `GET /api/jenis-mutasi-stock/with-trashed/all` - Get all jenis mutasi stock including deleted
- `GET /api/jenis-mutasi-stock/with-trashed/trashed` - Get only deleted jenis mutasi stock

## Master Data - Pelaksana
- `GET /api/pelaksana` - List all pelaksana
  - **Response:** `{ "data": [{ "id": "int", "nama_pelaksana": "string", "jabatan": "string" }] }`
- `POST /api/pelaksana` - Create new pelaksana
  - **Request:** `{ "nama_pelaksana": "string", "jabatan": "string" }`
- `GET /api/pelaksana/{id}` - Get pelaksana by ID
- `PUT /api/pelaksana/{id}` - Update pelaksana
  - **Request:** `{ "nama_pelaksana": "string", "jabatan": "string" }`
- `PATCH /api/pelaksana/{id}` - Update pelaksana
- `DELETE /api/pelaksana/{id}/soft` - Soft delete pelaksana
- `PATCH /api/pelaksana/{id}/restore` - Restore soft deleted pelaksana
- `DELETE /api/pelaksana/{id}/force` - Force delete pelaksana
- `GET /api/pelaksana/with-trashed/all` - Get all pelaksana including deleted
- `GET /api/pelaksana/with-trashed/trashed` - Get only deleted pelaksana

## Master Data - Pelanggan
- `GET /api/pelanggan` - List all pelanggan
  - **Response:** `{ "data": [{ "id": "int", "nama_pelanggan": "string", "alamat": "string", "telepon": "string" }] }`
- `POST /api/pelanggan` - Create new pelanggan
  - **Request:** `{ "nama_pelanggan": "string", "alamat": "string", "telepon": "string" }`
- `GET /api/pelanggan/{id}` - Get pelanggan by ID
- `PUT /api/pelanggan/{id}` - Update pelanggan
  - **Request:** `{ "nama_pelanggan": "string", "alamat": "string", "telepon": "string" }`
- `PATCH /api/pelanggan/{id}` - Update pelanggan
- `DELETE /api/pelanggan/{id}/soft` - Soft delete pelanggan
- `PATCH /api/pelanggan/{id}/restore` - Restore soft deleted pelanggan
- `DELETE /api/pelanggan/{id}/force` - Force delete pelanggan
- `GET /api/pelanggan/with-trashed/all` - Get all pelanggan including deleted
- `GET /api/pelanggan/with-trashed/trashed` - Get only deleted pelanggan

## Master Data - Supplier
- `GET /api/supplier` - List all supplier
  - **Response:** `{ "data": [{ "id": "int", "nama_supplier": "string", "alamat": "string", "telepon": "string" }] }`
- `POST /api/supplier` - Create new supplier
  - **Request:** `{ "nama_supplier": "string", "alamat": "string", "telepon": "string" }`
- `GET /api/supplier/{id}` - Get supplier by ID
- `PUT /api/supplier/{id}` - Update supplier
  - **Request:** `{ "nama_supplier": "string", "alamat": "string", "telepon": "string" }`
- `PATCH /api/supplier/{id}` - Update supplier
- `DELETE /api/supplier/{id}/soft` - Soft delete supplier
- `PATCH /api/supplier/{id}/restore` - Restore soft deleted supplier
- `DELETE /api/supplier/{id}/force` - Force delete supplier
- `GET /api/supplier/with-trashed/all` - Get all supplier including deleted
- `GET /api/supplier/with-trashed/trashed` - Get only deleted supplier

## Transaction - Penerimaan Barang
- `GET /api/penerimaan-barang` - List all penerimaan barang
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "tanggal": "date", "item_barang_id": "int", "gudang_id": "int", "quantity": "decimal", "supplier_id": "int" }] }`
- `POST /api/penerimaan-barang` - Create new penerimaan barang
  - **Request:** `{ "kode": "string", "tanggal": "date", "item_barang_id": "int", "gudang_id": "int", "quantity": "decimal", "supplier_id": "int" }`
- `GET /api/penerimaan-barang/{id}` - Get penerimaan barang by ID
- `PUT /api/penerimaan-barang/{id}` - Update penerimaan barang
  - **Request:** `{ "kode": "string", "tanggal": "date", "item_barang_id": "int", "gudang_id": "int", "quantity": "decimal", "supplier_id": "int" }`
- `PATCH /api/penerimaan-barang/{id}` - Update penerimaan barang
- `GET /api/penerimaan-barang/by-item-barang/{idItemBarang}` - Get penerimaan barang by item barang
- `GET /api/penerimaan-barang/by-gudang/{idGudang}` - Get penerimaan barang by gudang
- `GET /api/penerimaan-barang/by-rak/{idRak}` - Get penerimaan barang by rak
- `DELETE /api/penerimaan-barang/{id}/soft` - Soft delete penerimaan barang
- `PATCH /api/penerimaan-barang/{id}/restore` - Restore soft deleted penerimaan barang
- `DELETE /api/penerimaan-barang/{id}/force` - Force delete penerimaan barang
- `GET /api/penerimaan-barang/with-trashed/all` - Get all penerimaan barang including deleted
- `GET /api/penerimaan-barang/with-trashed/trashed` - Get only deleted penerimaan barang

## Transaction - Sales Order
## Transaction - Konversi Barang

- Base URL: `/api/konversi-barang`

- `GET /api/konversi-barang` - List item barang yang dapat dikonversi
  - **Query Params (optional):**
    - `per_page` (default: 10)
    - `search` (filter nama item)
    - `status` (values: `utuh` | `potongan` | `all`; default filter hanya `utuh` dan `potongan`)
  - **Behavior:**
    - Hanya menampilkan item dengan `jenis_potongan` in [`potongan`, `utuh`] dan `quantity = 1`
  - **Response:** Pagination standard dengan relasi `jenisBarang`, `bentukBarang`, `gradeBarang`

- `PATCH /api/konversi-barang/{id}` - Konversi item menjadi potongan
  - **Description:** Mengubah `jenis_potongan` menjadi `potongan` dan set `convert_date` ke tanggal hari ini (Asia/Jakarta)
  - **Response:** `{ success, message, data: ItemBarang(with relations) }`

- `GET /api/sales-order` - List all sales order
  - **Query Parameters (optional):**
    - `per_page` (integer): Jumlah data per halaman. Jika `per_page`/`page` tidak dikirim, semua hasil dikembalikan dalam satu halaman.
    - `page` (integer): Nomor halaman.
    - `search` (string): Pencarian global (`nomor_so`, `syarat_pembayaran`, `status`).
    - `sort` atau `sort_by` + `order`: Sorting multiple (`sort` menerima format `field,order;field,order`) atau single (`sort_by` + `order`).
    - `date_start`, `date_end` (date): Filter periode berdasarkan `tanggal_so`.
  - **Catatan Response:** Menyertakan `items_count` sebagai jumlah item SO (alias dari `sales_order_items_count`)
  - **Contoh Request:**
    - `GET /api/sales-order?per_page=50&sort=tanggal_so,desc;nomor_so,asc`
    - `GET /api/sales-order?date_start=2024-01-01&date_end=2024-03-31`
  - **Response:** `{ "data": [{ "id": "int", "nomor_so": "string", "tanggal_so": "date", "tanggal_pengiriman": "date", "syarat_pembayaran": "string", "gudang_id": "int", "pelanggan_id": "int", "subtotal": "decimal", "total_diskon": "decimal", "ppn_percent": "decimal", "ppn_amount": "decimal", "total_harga_so": "decimal", "status": "string", "salesOrderItems": [{ "id": "int", "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "qty": "int", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "harga": "decimal", "satuan": "string", "jenis_potongan": "string", "diskon": "decimal", "catatan": "string", "jenis_barang": { "id": "int", "nama_jenis_barang": "string" }, "bentuk_barang": { "id": "int", "nama_bentuk_barang": "string" }, "grade_barang": { "id": "int", "nama_grade_barang": "string" } }], "pelanggan": { "id": "int", "nama_pelanggan": "string", "alamat": "string", "telepon": "string" }, "gudang": { "id": "int", "kode": "string", "nama_gudang": "string", "tipe_gudang": "string" } }] }`
- `POST /api/sales-order` - Create new sales order
  - **Request:** `{ "nomor_so": "string", "tanggal_so": "date", "tanggal_pengiriman": "date", "syarat_pembayaran": "string", "gudang_id": "int", "pelanggan_id": "int", "subtotal": "decimal", "total_diskon": "decimal", "ppn_percent": "decimal", "ppn_amount": "decimal", "total_harga_so": "decimal", "items": [{ "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "qty": "int", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "harga": "decimal", "satuan": "string", "jenis_potongan": "string", "diskon": "decimal", "catatan": "string" }] }`
- `GET /api/sales-order/{id}` - Get sales order by ID
  - **Response:** `{ "id": "int", "nomor_so": "string", "tanggal_so": "date", "tanggal_pengiriman": "date", "syarat_pembayaran": "string", "gudang_id": "int", "pelanggan_id": "int", "subtotal": "decimal", "total_diskon": "decimal", "ppn_percent": "decimal", "ppn_amount": "decimal", "total_harga_so": "decimal", "status": "string", "salesOrderItems": [{ "id": "int", "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "qty": "int", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "harga": "decimal", "satuan": "string", "jenis_potongan": "string", "diskon": "decimal", "catatan": "string", "jenis_barang": { "id": "int", "nama_jenis_barang": "string" }, "bentuk_barang": { "id": "int", "nama_bentuk_barang": "string" }, "grade_barang": { "id": "int", "nama_grade_barang": "string" } }], "pelanggan": { "id": "int", "nama_pelanggan": "string", "alamat": "string", "telepon": "string" }, "gudang": { "id": "int", "kode": "string", "nama_gudang": "string", "tipe_gudang": "string" } }`
- `PUT /api/sales-order/{id}` - Update sales order
  - **Request:** `{ "nomor_so": "string", "tanggal_so": "date", "tanggal_pengiriman": "date", "syarat_pembayaran": "string", "gudang_id": "int", "pelanggan_id": "int", "subtotal": "decimal", "total_diskon": "decimal", "ppn_percent": "decimal", "ppn_amount": "decimal", "total_harga_so": "decimal", "items": [{ "panjang": "decimal", "lebar": "decimal", "tebal": "decimal", "qty": "int", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int", "harga": "decimal", "satuan": "string", "jenis_potongan": "string", "diskon": "decimal", "catatan": "string" }] }`
- `PATCH /api/sales-order/{id}` - Update sales order
- `POST /api/sales-order/{id}/request-delete` - Request delete sales order (user)
  - **Request:** `{ "delete_reason": "string" }`
- `PATCH /api/sales-order/{id}/cancel-delete-request` - Cancel delete request (user)
- `GET /api/sales-order/pending-delete-requests` - Get pending delete requests for approval (admin only)
  - **Response:** `{ "data": [{ "id": "int", "nomor_so": "string", "status": "delete_requested", "delete_reason": "string", "delete_requested_at": "datetime", "deleteRequestedBy": { "id": "int", "name": "string" } }] }`
- `PATCH /api/sales-order/{id}/approve-delete` - Approve delete request (admin only)
- `PATCH /api/sales-order/{id}/reject-delete` - Reject delete request (admin only)
  - **Request:** `{ "rejection_reason": "string" }`
- `DELETE /api/sales-order/{id}/soft` - Soft delete sales order (admin only)
- `PATCH /api/sales-order/{id}/restore` - Restore soft deleted sales order (admin only)
- `DELETE /api/sales-order/{id}/force` - Force delete sales order (admin only)

### Sales Order Header Endpoints (Header Only)
- `GET /api/sales-order/header` - List all sales order (header attributes only, without item details)
  - **Description:** Mendapatkan data sales order dengan atribut header saja (tanpa salesOrderItems yang kompleks)
  - **Query Parameters:**
    - `per_page`: Jumlah data per halaman (default: 10)
    - `search`: Pencarian berdasarkan nomor_so, syarat_pembayaran, status
    - `tanggal_mulai`: Filter tanggal mulai (format: YYYY-MM-DD)
    - `tanggal_akhir`: Filter tanggal akhir (format: YYYY-MM-DD)
    - `pelanggan_id`: Filter berdasarkan ID pelanggan
    - `gudang_id`: Filter berdasarkan ID gudang
  - **Catatan Response:** Menyertakan `items_count` sebagai jumlah item SO (alias dari `sales_order_items_count`)
  - **Response:** `{ "data": [{ "id": "int", "nomor_so": "string", "tanggal_so": "date", "tanggal_pengiriman": "date", "syarat_pembayaran": "string", "gudang_id": "int", "pelanggan_id": "int", "subtotal": "decimal", "total_diskon": "decimal", "ppn_percent": "decimal", "ppn_amount": "decimal", "total_harga_so": "decimal", "status": "string", "pelanggan": { "id": "int", "nama_pelanggan": "string" }, "gudang": { "id": "int", "kode": "string", "nama_gudang": "string" } }] }`
- `GET /api/sales-order/header/{id}` - Get sales order by ID (header attributes only)
  - **Description:** Mendapatkan detail sales order dengan atribut header saja (tanpa salesOrderItems)
  - **Response:** `{ "id": "int", "nomor_so": "string", "tanggal_so": "date", "tanggal_pengiriman": "date", "syarat_pembayaran": "string", "gudang_id": "int", "pelanggan_id": "int", "subtotal": "decimal", "total_diskon": "decimal", "ppn_percent": "decimal", "ppn_amount": "decimal", "total_harga_so": "decimal", "status": "string", "created_at": "datetime", "updated_at": "datetime", "pelanggan": { "id": "int", "nama_pelanggan": "string" }, "gudang": { "id": "int", "kode": "string", "nama_gudang": "string" } }`

### Sales Order Report Endpoints
- `GET /api/sales-order/report` - Laporan Sales Order ringkas dengan summary dan filter
  - **Description:** Mendapatkan daftar Sales Order untuk kebutuhan report dengan atribut header, jumlah item, dan summary agregat berdasarkan filter.
  - **Query Parameters:**
    - `per_page`: Jumlah data per halaman (default: 100)
    - `search`: Pencarian berdasarkan `nomor_so`, `syarat_pembayaran`, `status`
    - `sort` atau `sort_by` + `order`: Sorting multiple (`sort` menerima format `field,order;field,order`) atau single (`sort_by` + `order`)
    - `tanggal_mulai`: Filter tanggal mulai (`YYYY-MM-DD`)
    - `tanggal_akhir`: Filter tanggal akhir (`YYYY-MM-DD`)
    - `pelanggan_id`: Filter berdasarkan ID pelanggan
    - `gudang_id`: Filter berdasarkan ID gudang
    - `status`: Filter status (`active`, `delete_requested`, `deleted`)
    - `min_total`: Filter total minimal (`total_harga_so`)
    - `max_total`: Filter total maksimal (`total_harga_so`)
  - **Response:**
    ```json
    {
      "success": true,
      "message": "Data ditemukan",
      "data": [
        {
          "id": 123,
          "nomor_so": "SO-2024-001",
          "tanggal_so": "2024-10-01",
          "tanggal_pengiriman": "2024-10-05",
          "status": "active",
          "pelanggan": { "id": 10, "nama_pelanggan": "PT Maju Jaya" },
          "gudang": { "id": 3, "kode": "GD-01", "nama_gudang": "Gudang Utama" },
          "subtotal": 150000000.00,
          "total_diskon": 5000000.00,
          "ppn_amount": 14500000.00,
          "total_harga_so": 159500000.00,
          "items_count": 12
        }
      ],
      "summary": {
        "orders_count": 250,
        "items_count": 1200,
        "subtotal_sum": 2500000000.00,
        "total_diskon_sum": 75000000.00,
        "ppn_amount_sum": 275000000.00,
        "total_amount_sum": 2700000000.00
      },
      "pagination": {
        "current_page": 1,
        "per_page": 100,
        "last_page": 25,
        "total": 250
      }
    }
    ```
  - **Request Examples:**
    ```
    GET /api/sales-order/report?search=SO-2024
    GET /api/sales-order/report?tanggal_mulai=2024-01-01&tanggal_akhir=2024-03-31
    GET /api/sales-order/report?pelanggan_id=10&gudang_id=3&status=active
    GET /api/sales-order/report?min_total=100000000&max_total=500000000
    GET /api/sales-order/report?sort=tanggal_so,desc;nomor_so,asc
    ```

## Static Data APIs (Temporary)
- `GET /api/static/tipe-gudang` - Get tipe gudang data
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "nama": "string", "deskripsi": "string" }] }`
- `GET /api/static/status-order` - Get status order data
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "nama": "string", "deskripsi": "string" }] }`
- `GET /api/static/satuan` - Get satuan data
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "nama": "string", "deskripsi": "string" }] }`
- `GET /api/static/term-of-payment` - Get term of payment data
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "nama": "string", "deskripsi": "string" }] }`

## System Settings
- `GET /api/sys-setting` - List all system settings
  - **Response:** `{ "data": [{ "id": "int", "key": "string", "value": "string", "description": "string" }] }`
- `POST /api/sys-setting` - Create new system setting
  - **Request:** `{ "key": "string", "value": "string", "description": "string" }`
- `GET /api/sys-setting/{id}` - Get system setting by ID
- `PUT /api/sys-setting/{id}` - Update system setting
  - **Request:** `{ "key": "string", "value": "string", "description": "string" }`
- `PATCH /api/sys-setting/{id}` - Update system setting
- `DELETE /api/sys-setting/{id}` - Delete system setting
- `GET /api/sys-setting/value/{key}` - Get system setting value by key

## Utility
- `GET /api/user` - Get current authenticated user
  - **Response:** `{ "id": "int", "name": "string", "email": "string", "role": "string" }`
- `GET /api/test` - Test endpoint

---

## Common Response Format:
```json
{
  "success": true,
  "message": "string",
  "data": {...},
  "pagination": {
    "current_page": "int",
    "per_page": "int",
    "total": "int",
    "last_page": "int"
  }
}
```

- **Error Responses**:
```json
// Validation Error (422)
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "foto_bukti": ["The foto bukti field is required."],
    "actualWorkOrderId": ["The actual work order id field is required."]
  }
}

// Not Found Error (500)
{
  "success": false,
  "message": "Terjadi kesalahan saat menyimpan data",
  "error": "ActualWorkOrder dengan ID 999 tidak ditemukan"
}

// Empty Request Error (400)
{
  "success": false,
  "message": "Data tidak boleh kosong"
}
```

## Notes:
- All endpoints require authentication via JWT token (except Static Data APIs)
- Role-based access control is implemented via middleware
- Soft delete operations are available for most entities
- Pagination is supported with `per_page` parameter
- Filtering is available for most list endpoints
- All responses follow consistent JSON format
- The `menu-with-permissions` endpoint is specifically designed for role-menu-permission mapping in the frontend
- Role-menu-permission endpoints provide full CRUD operations for managing role access to menu permissions
- Bulk operations are available for efficient role-menu-permission management

## Work Order Planning

### Base URL: `/api/work-order-planning`

#### 1. Get All Work Order Planning
- **GET** `/api/work-order-planning`
- **Description**: Mendapatkan semua data work order planning dengan pagination, pencarian, filter, dan sorting
- **Query Parameters**:
  - `per_page`: Jumlah data per halaman (default: 10). Jika `per_page`/`page` tidak dikirim, semua hasil dikembalikan dalam satu halaman.
  - `page`: Nomor halaman.
  - `search`: Pencarian global berdasarkan field yang dapat dicari
  - `sort` atau `sort_by` + `order`: Sorting multiple (`sort` menerima format `field,order;field,order`) atau single (`sort_by` + `order`)
  - `date_start`, `date_end`: Filter periode berdasarkan `created_at` (format: `YYYY-MM-DD`).
  - `filter[field_name]`: Filter spesifik berdasarkan field tertentu
- **Searchable Fields**: 
  - `sales_order.nomor_so`: Nomor Sales Order
  - `nomor_wo`: Nomor Work Order
  - `tanggal_wo`: Tanggal Work Order
  - `prioritas`: Prioritas (HIGH, MEDIUM, LOW)
  - `status`: Status (DRAFT, APPROVED, IN_PROGRESS, COMPLETED)
- **Sortable Fields**: Semua field yang dapat dicari juga dapat disortir
- **Filter Options**:
  - `filter[status]`: Filter berdasarkan status
  - `filter[prioritas]`: Filter berdasarkan prioritas
  - `filter[tanggal_wo]`: Filter berdasarkan tanggal (format: YYYY-MM-DD)
- **Request Examples**:
  ```
  GET /api/work-order-planning?search=WO001
  GET /api/work-order-planning?sort=tanggal_wo,desc
  GET /api/work-order-planning?filter[status]=DRAFT&filter[prioritas]=HIGH
  GET /api/work-order-planning?sort=nomor_wo,asc;tanggal_wo,desc
  GET /api/work-order-planning?date_start=2024-01-01&date_end=2024-03-31
  ```
- **Response**: List work order planning dengan kolom referensi ringkas dan jumlah item
- **Returned Fields**: mencakup `nomor_wo`, `tanggal_wo`, `prioritas`, `status`, `nomor_so`, `nama_pelanggan`, `nama_gudang`, `count` (jumlah item terkait)
- **Features**:
  - **Pagination**: Standard Laravel pagination dengan meta data
  - **Search**: Pencarian global di multiple field sekaligus
  - **Multiple Sorting**: Dapat sort berdasarkan multiple field dengan arah berbeda
  - **Advanced Filtering**: Filter spesifik per field dengan operator yang fleksibel
  - **Join Optimization**: Menggunakan leftJoin untuk performa optimal
  - **Count Relationship**: Menampilkan jumlah item terkait tanpa memuat semua data

#### Report Work Order Planning (Header Only)
- **GET** `/api/work-order-planning/report`
- **Description**: Laporan Work Order Planning dengan atribut header/parent saja (tanpa item). Cocok untuk tampilan ringkas dan export header data.
- **Query Parameters**:
  - `per_page`: Jumlah data per halaman (default: 100)
  - `search`: Pencarian global (`nomor_wo`, `nomor_so`, `nama_pelanggan`, `nama_gudang`, `status`, `prioritas`)
  - `sort` atau `sort_by` + `order`: Sorting multiple atau single
  - `tanggal_wo_start`: Filter tanggal mulai (`YYYY-MM-DD`)
  - `tanggal_wo_end`: Filter tanggal akhir (`YYYY-MM-DD`)
  - `id_pelanggan`: Filter berdasarkan ID pelanggan
  - `id_gudang`: Filter berdasarkan ID gudang
  - `status`: Filter status WO Planning
  - `prioritas`: Filter prioritas WO Planning
  - `nomor_wo`: Filter nomor WO (like)
  - `nomor_so`: Filter nomor SO (like)
- **Response**:
```json
{
  "success": true,
  "message": "Data ditemukan",
  "data": [
    {
      "id": 1,
      "wo_unique_id": "WO-20240101-ABC123",
      "nomor_wo": "WO/2024/001",
      "tanggal_wo": "2024-01-01",
      "id_sales_order": 10,
      "id_pelanggan": 5,
      "id_gudang": 3,
      "id_pelaksana": 7,
      "prioritas": "HIGH",
      "status": "DRAFT",
      "handover_method": "pickup",
      "created_at": "2024-01-01T08:00:00.000000Z",
      "updated_at": "2024-01-01T08:00:00.000000Z",
      "nama_pelanggan": "PT Maju Jaya",
      "nama_gudang": "Gudang Utama",
      "nomor_so": "SO/2024/001"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 100,
    "last_page": 10,
    "total": 1000
  }
}
```

#### 2. Get Work Order Planning by ID
- **GET** `/api/work-order-planning/{id}`
- **Description**: Mendapatkan detail work order planning lengkap berdasarkan ID
- **Query Parameters (optional)**:
  - `create_actual` (boolean): Jika `true`, akan membuat Work Order Actual untuk WO ini bila belum ada, serta mengembalikan info actual.
- **Request Example**:
```
GET /api/work-order-planning/1?create_actual=true
Authorization: Bearer your_jwt_token
```
- **Response**: Detail WO lengkap dengan struktur yang menyediakan data lengkap namun terorganisir:
  - Header: informasi WO dengan objek terstruktur untuk `sales_order`, `pelanggan`, `gudang`, `pelaksana`
  - Items: setiap item memuat objek terstruktur untuk `jenis_barang`, `bentuk_barang`, `grade_barang`, `plat_dasar`, `pelaksana` (dengan info pelaksana), dan `saran_plat_dasar` (dengan info item barang).
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "wo_unique_id": "WO-20240101-ABC123",
    "nomor_wo": "WO/2024/001",
    "tanggal_wo": "2024-01-01",
    "prioritas": "HIGH",
    "status": "DRAFT",
    "catatan": null,
    "created_at": "2024-01-01T08:00:00.000000Z",
    "updated_at": "2024-01-01T08:00:00.000000Z",
    "close_wo_at": null,
    "has_generated_invoice": false,
    "has_generated_pod": false,
    "sales_order": {
      "id": 1,
      "nomor_so": "SO/2024/001",
      "tanggal_so": "2024-01-01",
      "tanggal_pengiriman": "2024-01-05",
      "syarat_pembayaran": "Net 30",
      "handover_method": "pickup"
    },
    "pelanggan": {
      "id": 1,
      "nama_pelanggan": "PT. Contoh Pelanggan"
    },
    "gudang": {
      "id": 1,
      "nama_gudang": "Gudang Utama"
    },
    "pelaksana": {
      "id": 1,
      "nama_pelaksana": "John Doe"
    },
    "workOrderPlanningItems": [
      {
        "id": 1,
        "wo_item_unique_id": "WOI-20240101-DEF456",
        "qty": 10,
        "panjang": 100.00,
        "lebar": 50.00,
        "tebal": 2.00,
        "berat": 25.50,
        "satuan": "pcs",
        "diskon": 0,
        "catatan": "Catatan item",
        "jenis_potongan": "utuh",
        "created_at": "2024-01-01T08:00:00.000000Z",
        "updated_at": "2024-01-01T08:00:00.000000Z",
        "jenis_barang": {
          "id": 1,
          "nama_jenis_barang": "Aluminium"
        },
        "bentuk_barang": {
          "id": 1,
          "nama_bentuk_barang": "Plat"
        },
        "grade_barang": {
          "id": 1,
          "nama_grade_barang": "Grade A"
        },
        "plat_dasar": {
          "id": 5,
          "nama_item_barang": "Plat Dasar AL-001"
        },
        "pelaksana": [
          {
            "id": 1,
            "qty": 5,
            "weight": 12.5,
            "tanggal": "2024-01-02",
            "jam_mulai": "08:00:00",
            "jam_selesai": "12:00:00",
            "catatan": "Shift pagi",
            "created_at": "2024-01-01T08:00:00.000000Z",
            "updated_at": "2024-01-01T08:00:00.000000Z",
            "pelaksana_info": {
              "id": 1,
              "nama_pelaksana": "John Doe"
            }
          }
        ],
        "saran_plat_dasar": [
          {
            "id": 1,
            "is_selected": true,
            "quantity": 2,
            "created_at": "2024-01-01T08:00:00.000000Z",
            "updated_at": "2024-01-01T08:00:00.000000Z",
            "item_barang": {
              "id": 5,
              "nama_item_barang": "Plat Dasar AL-001"
            }
          },
          {
            "id": 2,
            "is_selected": false,
            "quantity": 1,
            "created_at": "2024-01-01T08:00:00.000000Z",
            "updated_at": "2024-01-01T08:00:00.000000Z",
            "item_barang": {
              "id": 6,
              "nama_item_barang": "Plat Dasar AL-002"
            }
          }
        ]
      }
    ]
  }
}
```
- **Notes**:
  - Saran plat/shaft dasar memuat semua kandidat. Yang digunakan/terpilih ditandai `is_selected = true`. Field `plat_dasar_id` pada item juga mereferensikan pilihan yang aktif.
  - Endpoint ini menyiapkan data siap pakai untuk 1 tampilan besar detail WO (header + item + pelaksana + saran plat/shaft dasar).

#### 3. Create Work Order Planning
- **POST** `/api/work-order-planning`
- **Description**: Membuat work order planning baru dengan support multiple pelaksana per item dan mapping saran plat/shaft dasar per item.
- **Request Body**:
```json
{
  "wo_unique_id": "WO-20240101-ABC123",
  "tanggal_wo": "2024-01-01",
  "id_sales_order": 1,
  "id_pelanggan": 1,
  "id_gudang": 1,
  "prioritas": "HIGH",
  "status": "DRAFT",
  "items": [
    {
      "wo_item_unique_id": "WOI-20240101-DEF456",
      "qty": 10,
      "panjang": 100.00,
      "lebar": 50.00,
      "tebal": 2.00,
      "berat": 12.50,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "catatan": "Catatan item",
      "jenis_potongan": "utuh",
      "pelaksana": [
        {
          "pelaksana_id": 1,
          "qty": 5,
          "weight": 12.5,
          "tanggal": "2024-01-02",
          "jam_mulai": "08:00",
          "jam_selesai": "12:00",
          "catatan": "Shift pagi"
        }
      ],
      "saran_plat_dasar": [
        { 
          "item_barang_id": 11, 
          "quantity": 2.5,
          "canvas_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        },
        { 
          "item_barang_id": 12, 
          "quantity": 1.0,
          "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }
      ]
    },
    {
      "wo_item_unique_id": "WOI-20240101-GHI789",
      "qty": 5,
      "panjang": 80.00,
      "lebar": 40.00,
      "tebal": 1.50,
      "berat": 7.80,
      "jenis_barang_id": 2,
      "bentuk_barang_id": 1,
      "grade_barang_id": 2,
      "catatan": "Item kedua",
      "jenis_potongan": "potongan",
      "saran_plat_dasar": [
        { "item_barang_id": 21, "quantity": 0.5 }
      ]
    }
  ]
}
```
- **Parameters**:
  - `wo_unique_id` (required): Unique identifier untuk work order planning
  - `tanggal_wo` (required): Tanggal work order
  - `id_sales_order` (required): ID sales order
  - `id_pelanggan` (required): ID pelanggan
  - `id_gudang` (required): ID gudang
  - `prioritas` (required): Prioritas work order
  - `status` (required): Status work order
  - `items` (required, array): Array items work order
  - `items.*.wo_item_unique_id` (required): Unique identifier untuk setiap item
  - `items.*.qty` (optional): Quantity item
  - `items.*.panjang` (optional): Panjang item
  - `items.*.lebar` (optional): Lebar item
  - `items.*.tebal` (optional): Tebal item
  - `items.*.berat` (optional): Berat item (decimal)
  - `items.*.pelaksana` (optional, array of object): Detail pelaksana per item
    - `pelaksana_id` (required): ID pelaksana
    - `qty` (optional): Qty yang dikerjakan pelaksana
    - `weight` (optional, number): Berat yang dikerjakan pelaksana
    - `items.*.saran_plat_dasar` (optional, array of object): Mapping saran plat/shaft dasar per item saat create WO
    - `item_barang_id` (required): ID item barang yang dijadikan saran
    - `quantity` (optional, number): Jumlah yang digunakan
    - `canvas_image` (optional, string): Base64 encoded image data untuk canvas gambar (format: data:image/[type];base64,[data])
  - `items.*.jenis_barang_id` (optional): ID jenis barang
  - `items.*.bentuk_barang_id` (optional): ID bentuk barang
  - `items.*.grade_barang_id` (optional): ID grade barang
  - `items.*.catatan` (optional): Catatan item
  - `items.*.jenis_potongan` (optional): Jenis potongan item (enum: 'utuh', 'potongan')
  - `items.*.id_pelaksana` (optional, array): Array ID pelaksana untuk item
- **Notes**:
  - `wo_unique_id` dan `wo_item_unique_id` harus unik dan disediakan dari request
  - `nomor_wo` akan digenerate otomatis di server
  - Mapping saran plat/shaft dasar dibuat saat create WO bila `saran_plat_dasar` dikirim
  - Response akan include relasi `workOrderPlanningItems.hasManyPelaksana.pelaksana` dan `workOrderPlanningItems.hasManySaranPlatShaftDasar.itemBarang`

#### 4. Update Work Order Planning
- **PUT/PATCH** `/api/work-order-planning/{id}`
- **Description**: Mengupdate work order planning
- **Request Body**: Semua field yang ingin diupdate

#### 5. Delete Work Order Planning
- **DELETE** `/api/work-order-planning/{id}`
- **Description**: Soft delete work order planning

#### 6. Restore Work Order Planning
- **PATCH** `/api/work-order-planning/{id}/restore`
- **Description**: Restore work order planning yang sudah di-soft delete

#### 7. Force Delete Work Order Planning
- **DELETE** `/api/work-order-planning/{id}/force`
- **Description**: Hard delete work order planning

### Item Management

#### 8. Get Work Order Planning Item
- **GET** `/api/work-order-planning/item/{id}`
- **Description**: Mendapatkan detail item work order planning
- **Response**: Item dengan relasi jenis barang, bentuk barang, grade barang, dan plat dasar

#### 9. Update Work Order Planning Item
- **PUT/PATCH** `/api/work-order-planning/item/{id}`
- **Description**: Mengupdate item work order planning, pelaksana, dan saran plat dasar
- **Request Body**:
```json
{
  "qty": 15,
  "panjang": 120.00,
  "lebar": 60.00,
  "tebal": 2.50,
  "berat": 20.00,
  "jenis_barang_id": 1,
  "bentuk_barang_id": 1,
  "grade_barang_id": 1,
  "catatan": "Update catatan",
  "pelaksana": [
    {
      "pelaksana_id": 1,
      "qty": 5,
      "weight": 25.50,
      "tanggal": "2024-01-01",
      "jam_mulai": "08:00",
      "jam_selesai": "12:00",
      "catatan": "Catatan pelaksana"
    }
  ],
  "saran_plat_dasar": [
    {
      "item_barang_id": 1,
      "quantity": 2.5,
      "canvas_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    },
    {
      "item_barang_id": 2,
      "quantity": 1.0,
      "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    },
    {
      "item_barang_id": 3,
      "quantity": null,
      "canvas_image": null
    }
  ]
}
```

### Pelaksana Management

#### 10. Add Pelaksana to Item
- **POST** `/api/work-order-planning/item/{itemId}/pelaksana`
- **Description**: Menambahkan pelaksana baru ke item work order planning
- **Request Body**:
```json
{
  "pelaksana_id": 1,
  "qty": 5,
  "weight": 25.50,
  "tanggal": "2024-01-01",
  "jam_mulai": "08:00",
  "jam_selesai": "12:00",
  "catatan": "Catatan pelaksana"
}
```

#### 11. Update Pelaksana
- **PUT/PATCH** `/api/work-order-planning/item/{itemId}/pelaksana/{pelaksanaId}`
- **Description**: Mengupdate data pelaksana
- **Request Body**: Field yang ingin diupdate (qty, weight, tanggal, jam_mulai, jam_selesai, catatan).

#### 12. Remove Pelaksana
- **DELETE** `/api/work-order-planning/item/{itemId}/pelaksana/{pelaksanaId}`
- **Description**: Menghapus pelaksana dari item

### Utility Endpoints

#### 13. Get Saran Plat Dasar
- **POST** `/api/work-order-planning/get-saran-plat-dasar`
- **Description**: Mendapatkan saran plat dasar berdasarkan kriteria (jenis, bentuk, grade barang, tebal, dan sisa_luas). Hanya menampilkan item yang jenis_potongan = 'potongan' dan tidak sedang diedit (is_edit = false atau null)
- **Request Body**:
```json
{
  "jenis_barang_id": 1,
  "bentuk_barang_id": 1,
  "grade_barang_id": 1,
  "tebal": 10,
  "sisa_luas": 100
}
```
- **Response**: List item barang yang memenuhi kriteria, dengan jenis, bentuk, grade barang yang sama, tebal yang sama, sisa_luas lebih besar dari parameter, jenis_potongan = 'potongan', dan tidak sedang diedit (is_edit = false atau null), diurutkan berdasarkan sisa_luas (ascending).
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "Aluminium Shaft Grade A",
      "ukuran": "80.5 x 45.2 x 5.0",
      "sisa_luas": 3640.60
    }
  ]
}
```

#### 13.1. Get Saran Plat Utuh
- **POST** `/api/work-order-planning/get-saran-plat-utuh`
- **Description**: Mendapatkan saran plat dasar untuk jenis potongan 'utuh' berdasarkan kriteria (jenis, bentuk, grade barang, tebal, panjang, dan lebar). Hanya menampilkan item yang jenis_potongan = 'utuh' dan tidak sedang diedit (is_edit = false atau null)
- **Request Body**:
```json
{
  "jenis_barang_id": 1,
  "bentuk_barang_id": 1,
  "grade_barang_id": 1,
  "tebal": 10,
  "panjang": 100,
  "lebar": 50
}
```
- **Response**: List item barang yang memenuhi kriteria, dengan jenis, bentuk, grade barang yang sama, tebal sama persis, panjang dan lebar sama persis dengan parameter, jenis_potongan = 'utuh', dan tidak sedang diedit (is_edit = false atau null), diurutkan berdasarkan sisa_luas (ascending).
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "Aluminium Shaft Grade A",
      "ukuran": "80.5 x 45.2 x 5.0",
      "sisa_luas": 3640.60
    }
  ]
}
```


#### 14. Print SPK Work Order
- **GET** `/api/work-order-planning/{id}/print-spk`
- **Description**: Mendapatkan data untuk print SPK work order
- **Response**: Data terformat untuk print dengan informasi jenis barang, bentuk barang, grade barang, ukuran, qty, berat, luas, plat dasar, dan pelaksana

#### 15. Get All Canvas Images by Work Order ID
- **GET** `/api/work-order-planning/{id}/images`
- **Description**: Mendapatkan semua canvas images dari Work Order berdasarkan WO ID. Loop ke dalam child WO items dan ambil canvas images dalam format base64 dari saran plat dasar.
- **Parameters**:
  - `id` (required): Work Order Planning ID
- **Response**:
```json
{
  "success": true,
  "message": "Canvas images berhasil diambil",
  "data": {
    "work_order": {
      "id": 1,
      "wo_unique_id": "WO-2024-001",
      "nomor_wo": "WO/001/2024",
      "tanggal_wo": "2024-01-15",
      "status": "active",
      "prioritas": "high"
    },
    "total_images": 2,
    "images": [
      {
        "wo_id": 1,
        "wo_unique_id": "WO-2024-001",
        "wo_item_id": 5,
        "wo_item_unique_id": "WOI-2024-001-001",
        "saran_id": 10,
        "item_barang_id": 25,
        "item_barang_name": "Plat Aluminium 5mm",
        "canvas_file_path": "canvas_woitem/5_25/canvas_image.jpg",
        "canvas_image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
        "is_selected": true,
        "quantity": 2.5,
        "created_at": "2024-01-15T10:30:00.000000Z",
        "updated_at": "2024-01-15T10:30:00.000000Z"
      },
      {
        "wo_id": 1,
        "wo_unique_id": "WO-2024-001",
        "wo_item_id": 6,
        "wo_item_unique_id": "WOI-2024-001-002",
        "saran_id": 11,
        "item_barang_id": 30,
        "item_barang_name": "Plat Steel 10mm",
        "canvas_file_path": "canvas_woitem/6_30/canvas_image.jpg",
        "canvas_image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
        "is_selected": false,
        "quantity": 1.0,
        "created_at": "2024-01-15T11:00:00.000000Z",
        "updated_at": "2024-01-15T11:00:00.000000Z"
      }
    ]
  }
}
```

### Saran Plat/Shaft Dasar Management

#### 16. Get Saran Plat Dasar by Item
- **GET** `/api/work-order-planning/item/{itemId}/saran-plat-dasar`
- **Description**: Mendapatkan semua saran plat/shaft dasar untuk item tertentu
- **Response**: List saran plat dasar dengan relasi item barang, diurutkan berdasarkan created_at

#### 17. Save Canvas (Saran Plat)
- **POST** `/api/work-order-planning/saran-plat-dasar`
- **Description**: Menyimpan canvas JSON dan/atau canvas image untuk `item_barang_id`. Tidak membuat record saran; mapping saran dilakukan saat create Work Order.
- **Request Body**:
```json
{
  "item_barang_id": 1,
  "canvas_data": "{\"shapes\":[{\"type\":\"rectangle\",\"x\":10,\"y\":20,\"width\":100,\"height\":50}]}",
  "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
}
```
- **Parameters**:
  - `item_barang_id` (required): ID item barang target penyimpanan canvas
  - `canvas_data` (optional, json): Data canvas (JSON string)
  - `canvas_image` (optional, string): Base64 JPG image data
- **Response**:
```json
{
  "success": true,
  "message": "Canvas berhasil disimpan",
  "data": {
    "canvas_file": "canvas/1/canvas.json",
    "canvas_image": "canvas/1/canvas_image.jpg"
  }
}
```


#### 17. Set Selected Plat Dasar
- Dihandle di create Work Order (mapping saran). Endpoint ini tidak digunakan lagi.


## Work Order Actual

### Overview
Work Order Actual API menyediakan endpoint untuk mengelola data aktual dari work order yang telah dieksekusi. API ini mendukung operasi untuk melihat daftar work order actual, detail work order actual, dan menyimpan data work order actual.

#### 1. Get All Work Order Actual (List Ringkas)
- **GET** `/api/work-order-actual`
- **Description**: Mendapatkan daftar work order actual dalam format ringkas untuk halaman list. Atribut dikurangi agar hemat bandwidth.
- **Query Parameters (optional)**:
  - `page` (integer): Halaman data (default: 1). Jika `per_page`/`page` tidak dikirim, semua hasil dikembalikan dalam satu halaman.
  - `per_page` (integer): Jumlah data per halaman (default: 10)
  - `search` (string): Pencarian global (WO/SO/pelanggan/gudang/status)
  - `sort` atau `sort_by` + `order`: Sorting multiple (`sort` menerima format `field,order;field,order`) atau single (`sort_by` + `order`)
  - `status` (string): Filter status
  - `id_pelanggan` (integer): Filter pelanggan
  - `id_gudang` (integer): Filter gudang
  - `nomor_wo` (string): Filter nomor WO (like)
  - `nomor_so` (string): Filter nomor SO (like)
  - `date_start`, `date_end` (date): Filter periode berdasarkan `created_at` (dukungan legacy `date_from`, `date_to` tetap ada)
 - **Contoh Request:**
   - `GET /api/work-order-actual?sort=nomor_wo,asc;status,desc`
   - `GET /api/work-order-actual?date_start=2024-01-01&date_end=2024-01-31`
- **Response**: Paginated list ringkas tanpa relasi berat. Hanya field penting untuk list.
- **Response Format**:
```json
{
  "success": true,
  "message": "Data work order actual berhasil diambil",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 10,
        "work_order_planning_id": 7,
        "tanggal_actual": "2025-11-08",
        "status": "Proses",
        "nomor_wo": "WO-08112025-003",
        "nomor_so": "SO-000123",
        "nama_pelanggan": "PT Contoh Pelanggan",
        "nama_gudang": "Gudang A",
        "jumlah_item": 1
      }
    ],
    "per_page": 10,
    "total": 4
  }
}
```

Catatan:
- Untuk detail lengkap (dengan semua relasi), gunakan endpoint `GET /api/work-order-actual/{id}`.

#### 2. Get Work Order Actual by ID
- **GET** `/api/work-order-actual/{id}`
- **Description**: Mendapatkan detail work order actual berdasarkan ID dengan relasi lengkap
- **Request Example**:
```
GET /api/work-order-actual/1
Authorization: Bearer your_jwt_token
```
- **Response**: Detail work order actual lengkap dengan semua relasi
- **Response Format**:
```json
{
  "success": true,
  "message": "Data work order actual berhasil diambil",
  "data": {
    "id": 1,
    "work_order_planning_id": 1,
    "foto_bukti": "bukti/wo_actual_1.jpg",
    "created_at": "2024-01-01T10:00:00.000000Z",
    "updated_at": "2024-01-01T10:00:00.000000Z",
    "work_order_planning": {
      "id": 1,
      "nomor_wo": "WO/2024/001",
      "tanggal_wo": "2024-01-01",
      "prioritas": "HIGH",
      "status": "COMPLETED"
    },
    "work_order_actual_items": [
      {
        "id": 1,
        "work_order_planning_item_id": 1,
        "qty_actual": 10,
        "berat": 25.5,
        "foto_bukti": "work-order-actual/1/items/1/foto_bukti.jpg",
        "qty_planning": 10,
        "berat_planning": 30.0,
        "created_at": "2024-01-01T10:00:00.000000Z",
        "updated_at": "2024-01-01T10:00:00.000000Z",
        "work_order_planning_item": {
          "id": 1,
          "qty": 10,
          "panjang": 100.00,
          "lebar": 50.00,
          "tebal": 2.00,
          "jenis_potongan": "utuh",
          "item_barang": {
            "id": 1,
            "nama_item_barang": "Aluminium Sheet",
            "jenis_barang": {
              "id": 1,
              "nama_jenis_barang": "Aluminium"
            },
            "bentuk_barang": {
              "id": 1,
              "nama_bentuk_barang": "Sheet"
            },
            "grade_barang": {
              "id": 1,
              "nama_grade_barang": "Grade A"
            }
          }
        },
        "work_order_actual_pelaksanas": [
          {
            "id": 1,
            "qty": 5,
            "weight": 12.5,
            "tanggal": "2024-01-01",
            "jam_mulai": "08:00:00",
            "jam_selesai": "12:00:00",
            "catatan": "Shift pagi",
            "created_at": "2024-01-01T10:00:00.000000Z",
            "updated_at": "2024-01-01T10:00:00.000000Z",
            "pelaksana": {
              "id": 1,
              "nama_pelaksana": "John Doe",
              "email": "john@example.com"
            }
          }
        ]
      }
    ]
  }
}
```

#### 3. Save Work Order Actual (Add New)
- **POST** `/api/work-order-actual`
- **Description**: Menyimpan data work order actual baru dengan foto bukti dan detail pelaksanaan. Endpoint ini digunakan untuk menambahkan work order actual baru berdasarkan work order planning yang sudah ada. Form structure mengikuti pola yang sama dengan work order planning namun fokus pada data realisasi/actual.
- **Content-Type**: Wajib `application/json` (bukan `multipart/form-data`).
- **JSON Requirements**:
  - **Header**: `foto_bukti` (required, base64), `actualWorkOrderId` (optional), `planningWorkOrderId` (required)
  - **Items**: Setiap item memiliki `qtyActual` (required), `berat` (required, berat actual), opsional `foto_bukti` (base64), dan `assignments` pelaksana
  - Catatan: Field `beratActual` tidak digunakan lagi. Gunakan `berat` sebagai satu-satunya nama field berat di item.
  - **Assignments**: Detail pelaksana dengan qty, weight/berat, tanggal, jam kerja, dan catatan
  - Format Items: Harus berupa object dengan key ID `WorkOrderPlanningItem` (contoh: "14": { ... }). Jika dikirim sebagai array, key numerik (0, 1, ...) akan dianggap sebagai ID dan memicu error "WorkOrderPlanningItem dengan ID 0 tidak ditemukan".
 - **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "foto_bukti": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "actualWorkOrderId": null,
  "planningWorkOrderId": 1,
  "items": {
    "1": {
      "qtyActual": 10,
      "berat": 25.5,
      "foto_bukti": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "timestamp": "2024-01-01T08:00:00Z",
      "assignments": [
        {
          "id": null,
          "qty": 5,
          "weight": 12.5,
          "pelaksana_id": 1,
          "tanggal": "2024-01-01",
          "jamMulai": "08:00:00",
          "jamSelesai": "12:00:00",
          "catatan": "Shift pagi",
          "status": null
        },
        {
          "id": null,
          "qty": 5,
          "weight": 13.0,
          "pelaksana_id": 2,
          "tanggal": "2024-01-01",
          "jamMulai": "13:00:00",
          "jamSelesai": "17:00:00",
          "catatan": "Shift siang",
          "status": null
        }
      ]
    }
  }
}
```
- **Parameters**:
  - `foto_bukti` (required): Base64 encoded image sebagai bukti pelaksanaan work order actual
  - `actualWorkOrderId` (optional): ID work order actual. Jika `null` atau tidak ditemukan, sistem otomatis membuat Work Order Actual baru berdasarkan `planningWorkOrderId`.
  - `planningWorkOrderId` (required): ID work order planning sebagai referensi
  - `items` (required): Object items dengan data actual yang direalisasikan
    - Key: ID work order planning item (sebagai key object)
    - `qtyActual` (required): Quantity actual yang berhasil dikerjakan (numeric, min: 0)
    - `berat` (required): Berat actual yang berhasil dikerjakan (numeric, min: 0)
    - `foto_bukti` (optional): Base64 image bukti per item (akan disimpan di folder item)
    - `timestamp` (optional): Timestamp pelaksanaan (format: ISO 8601)
    - `assignments` (required): Array assignment pelaksana yang mengerjakan item ini
      - `id` (optional): ID assignment (integer, nullable saat create)
      - `qty` (required): Quantity yang dikerjakan oleh pelaksana ini (integer, min: 1)
      - `weight` atau `berat` (required): Berat yang dikerjakan oleh pelaksana ini (numeric, min: 0)
      - `pelaksana` (optional): Nama pelaksana (string, tidak wajib saat create)
      - `pelaksana_id` (required): ID pelaksana (integer)
      - `tanggal` (required): Tanggal pelaksanaan (format: YYYY-MM-DD)
      - `jamMulai` (required): Jam mulai kerja (string, format fleksibel)
      - `jamSelesai` (required): Jam selesai kerja (string, format fleksibel)
      - `catatan` (optional): Catatan pelaksanaan (string)
      - `status` (optional): Status pelaksanaan (string, tidak wajib saat create)
- **Response**:
```json
{
  "success": true,
  "message": "Data WorkOrderActual berhasil disimpan"
}
```

- **Error Responses**:
```json
// Validation Error (422)
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "foto_bukti": ["The foto bukti field is required."],
    
  }
}

// Catatan: Jika `actualWorkOrderId` tidak ditemukan, API akan membuat WO Actual baru secara otomatis.

// Format Items Salah (400/404)
{
  "success": false,
  "message": "WorkOrderPlanningItem dengan ID 0 tidak ditemukan"
}

// Empty Request Error (400)
{
  "success": false,
  "message": "Data tidak boleh kosong"
}
```

### Features
- **Pagination**: Mendukung pagination dengan parameter `page` dan `per_page`
- **Search**: Pencarian berdasarkan ID, foto_bukti, atau nomor WO planning
- **Filter**: Filter berdasarkan berbagai field seperti work_order_planning_id, created_at, dll
- **Sorting**: Sorting berdasarkan field apapun dengan urutan ascending/descending
- **Eager Loading**: Otomatis memuat relasi work order planning, items, dan pelaksana
- **File Upload**: Upload foto bukti dalam format base64 via JSON (tidak mendukung `multipart/form-data`)
- **Multiple Assignments**: Mendukung multiple pelaksana per item dengan detail waktu kerja
- **Form Structure**: Form add mengikuti struktur yang mirip dengan work order planning namun fokus pada data realisasi
- **Validation**: Validasi lengkap untuk semua field required dan format data
- **Transaction Safety**: Menggunakan database transaction untuk memastikan konsistensi data
- **Auto Status Update**: Otomatis mengubah status Work Order Planning menjadi 'Selesai' dan mengisi `close_wo_at` timestamp
- **Data Cleanup**: Menghapus data actual items dan pelaksana yang sudah ada sebelum menyimpan data baru
- **File Management**: Menyimpan foto bukti ke folder `work-order-actual/{actualWorkOrderId}/` dengan nama `foto_bukti.jpg`

#### 4. Get WO Actual Image (Header)
- **GET** `/api/work-order-actual/{id}/image`
- **Description**: Mengembalikan file image foto bukti header Work Order Actual secara langsung (stream/file). Cocok untuk `<img src="...">` di frontend.
- **Response**: Konten binary image (`image/jpeg`), bukan JSON.
- **Auth**: Endpoint berada dalam group `checkrole` → wajib `Authorization: Bearer <token>`. Browser tidak mengirim header ini untuk `<img src>`. Gunakan fetch → blob → `URL.createObjectURL(blob)` atau generate signed URL jika ingin embed langsung.
- **Path & Storage**:
  - Path yang disimpan di DB adalah path relatif terhadap disk `public` (mis. `work-order-actual/{actualId}/foto_bukti.jpg`).
  - Streaming membangun full path via `storage/app/public/{path_relatif}` menggunakan disk `public`.
- **Fallback**:
  - Jika yang tersimpan berupa folder (mis. `work-order-actual/{actualId}/foto_bukti`), endpoint akan mencoba `foto_bukti.jpg` di dalam folder tersebut.
  - Jika tetap tidak ditemukan, endpoint akan mengambil file gambar pertama (`.jpg/.jpeg/.png`) di folder tersebut.
- **Contoh**:
  - `GET /api/work-order-actual/10/image`
  - Ekspektasi path: `storage/app/public/work-order-actual/10/foto_bukti.jpg`
  - `curl` (PowerShell):
    ```powershell
    curl "http://localhost/api/work-order-actual/10/image" `
      -H "Authorization: Bearer <token>"
    ```

#### 5. Get WO Actual Item Image by Item ID
- **GET** `/api/work-order-actual/item/{itemId}/image`
- **Description**: Mengembalikan file image foto bukti untuk satu Work Order Actual Item berdasarkan ID item (stream/file).
- **Response**: Konten binary image (`image/jpeg`), bukan JSON.
- **Auth**: Wajib `Authorization: Bearer <token>` (bagian dari group `checkrole`). Untuk `<img src>`, gunakan pendekatan fetch blob atau signed URL.
- **Path & Storage**:
  - Path item disimpan relatif: `work-order-actual/{actualId}/items/{itemId}/foto_bukti.jpg`.
  - Streaming menggunakan disk `public` → `storage/app/public/{path_relatif}`.
- **Fallback**:
  - Jika yang tersimpan folder (mis. `work-order-actual/{actualId}/items/{itemId}/foto_bukti`), endpoint akan mencoba `foto_bukti.jpg` di dalamnya, lalu mengambil gambar pertama jika masih gagal.
- **Contoh**:
  - `GET /api/work-order-actual/item/4/image`
  - Ekspektasi path: `storage/app/public/work-order-actual/10/items/4/foto_bukti.jpg` (di mana `10` adalah `work_order_actual_id` yang memiliki item `4`).
  - `curl` (PowerShell):
    ```powershell
    curl "http://localhost/api/work-order-actual/item/4/image" `
      -H "Authorization: Bearer <token>"
    ```

<!-- Endpoint untuk mengambil semua image item dihapus untuk menghindari membuka seluruh file/folder. Gunakan endpoint item per item di atas. -->

#### Report Work Order Actual (Header Only)
- **GET** `/api/work-order-actual/report`
- **Description**: Laporan Work Order Actual dengan atribut header/parent saja. Menyertakan konteks header WO Planning (nomor_wo, tanggal_wo) dan referensi pelanggan/gudang.
- **Query Parameters**:
  - `per_page`: Jumlah data per halaman (default: 100)
  - `search`: Pencarian global (`status`, `nomor_wo`, `nomor_so`, `nama_pelanggan`, `nama_gudang`)
  - `sort` atau `sort_by` + `order`: Sorting multiple atau single
  - `tanggal_actual_start`: Filter tanggal mulai actual (`YYYY-MM-DD`)
  - `tanggal_actual_end`: Filter tanggal akhir actual (`YYYY-MM-DD`)
  - `id_pelanggan`: Filter berdasarkan ID pelanggan (via planning)
  - `id_gudang`: Filter berdasarkan ID gudang (via planning)
  - `status`: Filter status actual
  - `nomor_wo`: Filter nomor WO (like)
  - `nomor_so`: Filter nomor SO (like)
- **Response**:
```json
{
  "success": true,
  "message": "Data ditemukan",
  "data": [
    {
      "id": 9,
      "work_order_planning_id": 1,
      "tanggal_actual": "2024-01-03",
      "status": "On Progress",
      "catatan": "",
      "foto_bukti": "work-order-actual/9/foto_bukti.jpg",
      "created_at": "2024-01-03T10:00:00.000000Z",
      "updated_at": "2024-01-03T10:00:00.000000Z",
      "nomor_wo": "WO/2024/001",
      "tanggal_wo": "2024-01-01",
      "id_pelanggan": 5,
      "id_gudang": 3,
      "id_pelaksana": 7,
      "prioritas": "HIGH",
      "handover_method": "pickup",
      "nama_pelanggan": "PT Maju Jaya",
      "nama_gudang": "Gudang Utama",
      "nomor_so": "SO/2024/001"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 100,
    "last_page": 10,
    "total": 1000
  }
}
```


## Notes

- Semua endpoint memerlukan authentication dan authorization (middleware `checkrole`)
- **Multiple Pelaksana Support**: Field `id_pelaksana` dalam create work order sekarang berada di dalam setiap item dan menerima array of integers untuk multiple pelaksana per item
- Field `pelaksana` dalam update item akan mengganti semua pelaksana yang ada dengan yang baru
- Field `saran_plat_dasar` dalam update item akan mengganti semua saran plat dasar yang ada dengan yang baru
- Jika tidak ada field `pelaksana` atau `saran_plat_dasar` dalam request, data yang ada tidak akan berubah
- Semua operasi pelaksana dan saran plat dasar menggunakan soft delete
- Relasi yang di-load secara otomatis: jenis barang, bentuk barang, grade barang, plat dasar, pelaksana, dan saran plat dasar
- **Pelaksana Assignment**: Setiap item dapat memiliki pelaksana yang berbeda melalui field `id_pelaksana` di dalam item

### Canvas File Notes

- Canvas data disimpan sebagai file JSON di `storage/app/public/canvas/{item_id}/canvas.json`
- Canvas image disimpan sebagai file JPG di `storage/app/public/canvas/{item_id}/canvas_image.jpg`
- Path file disimpan di database:
  - Field `canvas_file` untuk JSON data di tabel `ref_item_barang`
  - Field `canvas_image` untuk JPG image di tabel `ref_item_barang`
- File canvas akan di-timpa setiap upload baru untuk item yang sama
- Format path:
  - Canvas data: `canvas/{item_id}/canvas.json`
  - Canvas image: `canvas/{item_id}/canvas_image.jpg`
- Canvas data dan image dapat diakses via API atau langsung dari storage URL
- **Canvas data format bebas**: Bisa berisi shapes, coordinates, annotations, metadata, atau struktur JSON apapun yang dibutuhkan untuk mapping/visualization
- **Canvas image**: Base64 JPG data yang dikonversi dan disimpan sebagai file JPG

## Item Barang Request Management

### List Item Barang Requests
- `GET /api/item-barang-request` - List all item barang requests
  - **Query Parameters:**
    - `page` (optional): Page number for pagination
    - `per_page` (optional): Items per page (default: 15)
    - `status` (optional): Filter by status (pending, approved, rejected)
    - `search` (optional): Search by nomor_request or nama_item_barang
  - **Response:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "nomor_request": "REQ-20251031-001",
        "nama_item_barang": "Plat Besi Tebal 10mm",
        "jenis_barang_id": 1,
        "bentuk_barang_id": 1,
        "grade_barang_id": 1,
        "panjang": 2000.00,
        "lebar": 1000.00,
        "tebal": 10.00,
        "quantity": 5,
        "keterangan": "Untuk proyek konstruksi gedung A",
        "status": "pending",
        "requested_by": 1,
        "approved_by": null,
        "approved_at": null,
        "approval_notes": null,
        "created_at": "2025-10-31T12:00:00.000000Z",
        "updated_at": "2025-10-31T12:00:00.000000Z",
        "jenis_barang": {
          "id": 1,
          "nama_jenis_barang": "Plat"
        },
        "bentuk_barang": {
          "id": 1,
          "nama_bentuk_barang": "Persegi"
        },
        "grade_barang": {
          "id": 1,
          "nama_grade_barang": "A"
        },
        "requested_by_user": {
          "id": 1,
          "name": "Admin User",
          "username": "admin"
        },
        "approved_by_user": null
      }
    ],
    "first_page_url": "http://localhost:8000/api/item-barang-request?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost:8000/api/item-barang-request?page=1",
    "links": [...],
    "next_page_url": null,
    "path": "http://localhost:8000/api/item-barang-request",
    "per_page": 15,
    "prev_page_url": null,
    "to": 4,
    "total": 4
  }
}
```

### Get Pending Requests
- `GET /api/item-barang-request/pending` - Get only pending requests
  - **Query Parameters:** Same as list endpoint
  - **Response:** Same format as list endpoint but filtered to pending status only

### Get Item Barang Request by ID
- `GET /api/item-barang-request/{id}` - Get specific item barang request
  - **Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nomor_request": "REQ-20251031-001",
    "nama_item_barang": "Plat Besi Tebal 10mm",
    "jenis_barang_id": 1,
    "bentuk_barang_id": 1,
    "grade_barang_id": 1,
    "panjang": 2000.00,
    "lebar": 1000.00,
    "tebal": 10.00,
    "quantity": 5,
    "keterangan": "Untuk proyek konstruksi gedung A",
    "status": "pending",
    "requested_by": 1,
    "approved_by": null,
    "approved_at": null,
    "approval_notes": null,
    "created_at": "2025-10-31T12:00:00.000000Z",
    "updated_at": "2025-10-31T12:00:00.000000Z",
    "jenis_barang": {...},
    "bentuk_barang": {...},
    "grade_barang": {...},
    "requested_by_user": {...},
    "approved_by_user": null
  }
}
```

### Create Item Barang Request
- `POST /api/item-barang-request` - Create new item barang request
  - **Request:**
```json
{
  "nama_item_barang": "Plat Besi Tebal 10mm",
  "jenis_barang_id": 1,
  "bentuk_barang_id": 1,
  "grade_barang_id": 1,
  "panjang": 2000.00,
  "lebar": 1000.00,
  "tebal": 10.00,
  "quantity": 5,
  "keterangan": "Untuk proyek konstruksi gedung A"
}
```
  - **Response:**
```json
{
  "success": true,
  "message": "Item barang request berhasil dibuat",
  "data": {
    "id": 1,
    "nomor_request": "REQ-20251031-001",
    "nama_item_barang": "Plat Besi Tebal 10mm",
    "status": "pending",
    "requested_by": 1,
    "created_at": "2025-10-31T12:00:00.000000Z",
    ...
  }
}
```

### Update Item Barang Request
- `PUT /api/item-barang-request/{id}` - Update item barang request (only if pending and owned by user)
- `PATCH /api/item-barang-request/{id}` - Update item barang request (only if pending and owned by user)
  - **Request:** Same fields as create request
  - **Response:** Updated item barang request data

### Delete Item Barang Request
- `DELETE /api/item-barang-request/{id}` - Delete item barang request (only if pending and owned by user)
  - **Response:**
```json
{
  "success": true,
  "message": "Item barang request berhasil dihapus"
}
```

### Approve Item Barang Request
- `PATCH /api/item-barang-request/{id}/approve` - Approve pending request
  - **Request:**
```json
{
  "approval_notes": "Disetujui untuk pengadaan segera"
}
```
  - **Response:**
```json
{
  "success": true,
  "message": "Request berhasil disetujui",
  "data": {
    "id": 1,
    "status": "approved",
    "approved_by": 1,
    "approved_at": "2025-10-31T12:30:00.000000Z",
    "approval_notes": "Disetujui untuk pengadaan segera",
    ...
  }
}
```

### Reject Item Barang Request
- `PATCH /api/item-barang-request/{id}/reject` - Reject pending request
  - **Request:**
```json
{
  "approval_notes": "Stok masih tersedia, tidak perlu pengadaan baru"
}
```
  - **Response:**
```json
{
  "success": true,
  "message": "Request berhasil ditolak",
  "data": {
    "id": 1,
    "status": "rejected",
    "approved_by": 1,
    "approved_at": "2025-10-31T12:30:00.000000Z",
    "approval_notes": "Stok masih tersedia, tidak perlu pengadaan baru",
    ...
  }
}
```

### Item Barang Request Features
- **Auto Document Number**: Nomor request otomatis generate dengan format REQ-YYYYMMDD-XXX
- **Status Management**: Status pending, approved, rejected dengan workflow approval
- **Authorization**: User hanya bisa edit/delete request milik sendiri yang masih pending
- **Approval System**: Approval dengan notes dan timestamp
- **Relationships**: Terintegrasi dengan jenis barang, bentuk barang, grade barang, dan user
- **Validation**: Validasi lengkap untuk semua field required
- **Pagination & Search**: Support pagination dan pencarian
- **Soft Delete**: Menggunakan soft delete untuk data integrity
## Transaction - Purchase Order

### Base URL: `/api/purchase-order`

#### 1. Get All Purchase Order
- **GET** `/api/purchase-order`
- **Description**: Mendapatkan daftar Purchase Order dengan pagination, pencarian, filter tanggal, dan sorting.
- **Query Parameters (optional)**:
  - `per_page` (integer): Jumlah data per halaman (default: 100). Jika `per_page`/`page` tidak dikirim, semua hasil dikembalikan dalam satu halaman.
  - `page` (integer): Nomor halaman.
  - `search` (string): Pencarian global (`nomor_po`, `tanggal_po`, `tanggal_jatuh_tempo`, `status`).
  - `sort` atau `sort_by` + `order`: Sorting multiple (`sort` menerima format `field,order;field,order`) atau single (`sort_by` + `order`).
  - `date_start`, `date_end` (date): Filter periode berdasarkan `tanggal_po`.
- **Contoh Request:**
  - `GET /api/purchase-order?per_page=50&sort=tanggal_po,desc;nomor_po,asc`
  - `GET /api/purchase-order?date_start=2024-01-01&date_end=2024-03-31`
- **Response**: Pagination standar dengan relasi `supplier` dan item (`purchaseOrderItems` dengan `jenisBarang`, `bentukBarang`, `gradeBarang`, `itemBarang`).

#### 2. Create Purchase Order
- **POST** `/api/purchase-order`
- **Description**: Menambahkan Purchase Order baru.
- **Body (JSON)**:
  - `tanggal_po` (date, optional, default: hari ini)
  - `tanggal_jatuh_tempo` (date, required)
  - `tanggal_penerimaan` (date, optional)
  - `tanggal_pembayaran` (date, optional)
  - `id_supplier` (integer, required)
  - `total_amount` (numeric, optional)
  - `status` (string, optional, default: `draft`)
  - `catatan` (string, optional, max: 500)
  - `items` (array, optional)
    - `qty` (integer, required)
    - `panjang` (numeric, required)
    - `lebar` (numeric, optional)
    - `tebal` (numeric, required)
    - `jenis_barang_id` (integer, required)
    - `bentuk_barang_id` (integer, required)
    - `grade_barang_id` (integer, required)
    - `harga` (numeric, required)
    - `satuan` (string, optional)
    - `diskon` (numeric, optional)
    - `catatan` (string, optional)
- **Contoh Request:**
```http
POST /api/purchase-order
Content-Type: application/json

{
  "tanggal_po": "2025-11-09",
  "tanggal_jatuh_tempo": "2025-11-16",
  "tanggal_penerimaan": "2025-11-10",
  "tanggal_pembayaran": "2025-11-20",
  "id_supplier": 12,
  "total_amount": 123456.78,
  "status": "draft",
  "catatan": "PO awal",
  "items": [
    {
      "qty": 10,
      "panjang": 120.5,
      "lebar": 80.0,
      "tebal": 1.2,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 2,
      "grade_barang_id": 3,
      "harga": 15000,
      "satuan": "PCS"
    }
  ]
}
```
- **Response**: Mengembalikan data Purchase Order yang dibuat beserta relasi.

#### 3. Get Purchase Order by ID
- **GET** `/api/purchase-order/{id}`
- **Description**: Mendapatkan detail Purchase Order beserta relasi supplier dan semua item.

#### 4. Update Purchase Order
- **PUT** `/api/purchase-order/{id}`
- **Description**: Mengupdate Purchase Order yang ada.
- **Body (JSON)**: Mendukung field yang sama seperti create, termasuk
  - `tanggal_po`, `tanggal_jatuh_tempo` (date)
  - `tanggal_penerimaan` (date, optional)
  - `tanggal_pembayaran` (date, optional)
  - `id_supplier`, `total_amount`, `status`, `catatan`
  - `items` (array, optional; jika dikirim, akan menggantikan item lama)
- **Contoh Request:**
```http
PUT /api/purchase-order/123
Content-Type: application/json

{
  "tanggal_penerimaan": "2025-11-12",
  "tanggal_pembayaran": "2025-11-21",
  "status": "approved",
  "items": []
}
```
- **Response**: Mengembalikan data Purchase Order yang telah diupdate.
