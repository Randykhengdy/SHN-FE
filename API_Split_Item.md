# API: Save Canvas & Split Item Barang (Satu Endpoint)

**URL** : `/api/item-barang/save-canvas`
**Method** : `POST`
**Auth** : `Bearer Token`

## Deskripsi
Endpoint ini menyimpan canvas JSON dan image terakhir untuk Item Barang. Jika parameter `splits` dikirim, endpoint akan sekaligus melakukan split item induk menjadi beberapa item anak.

## Request Body
```json
{
  "item_barang_id": 123,
  "canvas_data": "{\"version\":\"5.2.1\",\"objects\":[...]}", 
  "canvas_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "splits": [
    { "panjang": 100, "lebar": 50 },
    { "panjang": 200, "lebar": 50 }
  ]
}
```

Catatan:
- `canvas_data` dan/atau `canvas_image` opsional.
- `splits` opsional. Jika dikirim, setiap elemen wajib punya `panjang`; `lebar` opsional untuk item 1D.

## Perilaku
- Menyimpan `canvas_file` dan `canvas_image` pada item induk.
- Menghitung ulang `sisa_luas` induk dari `canvas_data` jika tersedia.
- Jika `splits` dikirim:
  - Membuat item anak baru sesuai dimensi split dengan status `active`.
  - Mengosongkan `canvas_file` dan `canvas_image` pada item anak.
  - Menghubungkan anak ke induk via `parent_id`.
  - Mengurangi `quantity` induk sebesar 1 dan mengubah `status` induk menjadi `destroy`.

## Response Success (200 OK)
```json
{
  "status": "success",
  "message": "Data saved successfully",
  "data": {
    "canvas_file": "canvas/123/canvas.json",
    "canvas_image": "canvas/123/canvas_image.jpg",
    "created_items": [
      {
        "id": 124,
        "parent_id": 123,
        "panjang": 100,
        "lebar": 50,
        "status": "active"
      },
      {
        "id": 125,
        "parent_id": 123,
        "panjang": 200,
        "lebar": 50,
        "status": "active"
      }
    ]
  }
}
```
