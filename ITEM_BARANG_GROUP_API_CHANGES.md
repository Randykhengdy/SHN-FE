# API terkait `item_barang_group_id`

Daftar singkat API yang diubah/ditambahkan supaya pakai `item_barang_group_id`.

## 1. Work Order Planning

- `GET /sales-order/sales-order-for-woplanning`
  - Controller: `SalesOrderController@salesOrderForWOPlanning`
  - Perubahan:
    - Response `sales_order_items[*]` sekarang mengembalikan:
      - `item_barang_group_id`
      - `item_barang_group.id`
      - `item_barang_group.nama_group_barang`

- `POST /work-order-planning`
  - Controller: `WorkOrderPlanningController@store`
  - Perubahan:
    - Request body `items[*].item_barang_group_id` (nullable, FK ke `ref_item_barang_group`)

- `POST /work-order-planning/with-saran-plat-dasar`
  - Controller: `WorkOrderPlanningController@storeWithSaranPlatDasar`
  - Perubahan:
    - Sama seperti `POST /work-order-planning`, request body support `items[*].item_barang_group_id`

- `PUT /work-order-planning/item/{id}`
  - Controller: `WorkOrderPlanningController@updateItem`
  - Perubahan:
    - Request body bisa mengirim `item_barang_group_id` untuk update grup item WO

## 2. Saran Plat

- `POST /work-order-planning/get-saran-plat-dasar`
  - Controller: `SaranPlatController@getSaranPlatDasar`
  - Perubahan:
    - Request body optional field `item_barang_group_id`
    - Digunakan sebagai filter: hanya ambil kandidat dengan `item_barang_group_id` yang sama

- `POST /work-order-planning/get-saran-plat-utuh`
  - Controller: `SaranPlatController@getSaranPlatUtuh`
  - Perubahan:
    - Request body optional field `item_barang_group_id`
    - Digunakan sebagai filter: hanya ambil kandidat dengan `item_barang_group_id` yang sama

Catatan umum untuk FE:

- Kalau workflow-nya dari SO → WO:
  - Ambil `item_barang_group_id` dari `GET /sales-order/sales-order-for-woplanning`
  - Teruskan ke:
    - `items[*].item_barang_group_id` saat create/update WO Planning (terutama di `POST /work-order-planning/with-saran-plat-dasar` yang dipakai FE)
    - `item_barang_group_id` saat call saran plat (`POST /work-order-planning/get-saran-plat-dasar` / `POST /work-order-planning/get-saran-plat-utuh`) bila mau lock ke group yang sama
