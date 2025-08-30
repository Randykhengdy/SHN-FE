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
  - **Response:** `{ "data": [{ "id": "int", "kode_barang": "string", "nama_item_barang": "string", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int" }] }`
- `POST /api/item-barang` - Create new item barang
  - **Request:** `{ "kode_barang": "string", "nama_item_barang": "string", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int" }`
- `GET /api/item-barang/{id}` - Get item barang by ID
- `PUT /api/item-barang/{id}` - Update item barang
  - **Request:** `{ "kode_barang": "string", "nama_item_barang": "string", "jenis_barang_id": "int", "bentuk_barang_id": "int", "grade_barang_id": "int" }`
- `PATCH /api/item-barang/{id}` - Update item barang
- `DELETE /api/item-barang/{id}/soft` - Soft delete item barang
- `PATCH /api/item-barang/{id}/restore` - Restore soft deleted item barang
- `DELETE /api/item-barang/{id}/force` - Force delete item barang
- `GET /api/item-barang/with-trashed/all` - Get all item barang including deleted
- `GET /api/item-barang/with-trashed/trashed` - Get only deleted item barang

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
- `GET /api/sales-order` - List all sales order
  - **Response:** `{ "data": [{ "id": "int", "kode": "string", "tanggal": "date", "pelanggan_id": "int", "total_amount": "decimal", "status": "string" }] }`
- `POST /api/sales-order` - Create new sales order
  - **Request:** `{ "kode": "string", "tanggal": "date", "pelanggan_id": "int", "total_amount": "decimal", "status": "string" }`
- `GET /api/sales-order/{id}` - Get sales order by ID
- `PUT /api/sales-order/{id}` - Update sales order
  - **Request:** `{ "kode": "string", "tanggal": "date", "pelanggan_id": "int", "total_amount": "decimal", "status": "string" }`
- `PATCH /api/sales-order/{id}` - Update sales order
- `DELETE /api/sales-order/{id}/soft` - Soft delete sales order
- `PATCH /api/sales-order/{id}/restore` - Restore soft deleted sales order
- `DELETE /api/sales-order/{id}/force` - Force delete sales order

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
- Static Data APIs are temporary and should be converted to proper master data tables in the future
