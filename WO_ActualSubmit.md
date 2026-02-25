## API: Submit Work Order Actual

- **Endpoint**: `POST /api/work-order-actual`
- **Deskripsi**: Simpan data Work Order Actual baru berdasarkan 1 Work Order Planning yang sudah ada. Sekaligus upload foto bukti header dan, opsional, foto bukti per item.
- **Content-Type**: `application/json`
- **Auth**: `Authorization: Bearer <token>`

---

### 1. Struktur Request

Body wajib berbentuk JSON dengan struktur:

```json
{
  "foto_bukti": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "actualWorkOrderId": null,
  "planningWorkOrderId": 1,
  "items": {
    "49": {
      "qtyActual": 2,
      "berat": 100.0,
      "foto_bukti": "data:image/jpeg;base64,...",
      "foto_sisa_barang": "data:image/jpeg;base64,...",
      "timestamp": "2026-02-22T17:34:43Z",
      "item_barang_group_id": 123,
      "assignments": [
        {
          "id": null,
          "qty": 1,
          "weight": 50.0,
          "pelaksana_id": 10,
          "tanggal": "2026-02-22",
          "jamMulai": "08:00:00",
          "jamSelesai": "12:00:00",
          "catatan": "Shift pagi",
          "status": null
        },
        {
          "id": null,
          "qty": 1,
          "weight": 50.0,
          "pelaksana_id": 11,
          "tanggal": "2026-02-22",
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

#### 1.1 Header Fields

- `foto_bukti` (string, required)  
  Base64 image bukti pelaksanaan WO Actual header. FE kirim dalam format `data:image/jpeg;base64,...`.

- `actualWorkOrderId` (integer | null, optional)  
  - `null` → backend akan membuat Work Order Actual baru dari `planningWorkOrderId`.  
  - angka (mis. `36`) → backend akan update WO Actual yang sudah ada (replace data item & assignments).

- `planningWorkOrderId` (integer, required)  
  ID Work Order Planning sumber data.

#### 1.2 Items Object

- `items` (object, required)  
  - Key: ID `WorkOrderPlanningItem` dalam bentuk string (`"49"`, `"50"`, dst).  
  - Value: data actual item untuk ID tersebut.

Catatan penting:

- **Jangan** kirim `items` sebagai array. Kalau dikirim array, key akan jadi `0,1,2,...` dan backend akan baca sebagai ID item planning → bisa muncul error `"WorkOrderPlanningItem dengan ID 0 tidak ditemukan"`.

#### 1.3 Item Fields

Untuk setiap `items["49"]`:

- `qtyActual` (number, required)  
  Qty actual yang berhasil dikerjakan untuk item planning ini. Minimal 0.

- `berat` (number, required)  
  Berat actual yang berhasil dikerjakan (total, bukan per unit).  
  Catatan: field `beratActual` **sudah tidak dipakai**.

- `foto_bukti` (string, optional)  
  Base64 image bukti per item. Disimpan dengan struktur folder:  
  `work-order-actual/{actualId}/items/{itemId}/foto_bukti.jpg`

- `foto_sisa_barang` (string, optional)  
  Base64 image foto sisa barang per item. Disimpan di path sisa barang item (lihat `WO_ActualImage.md`).

- `timestamp` (string, optional)  
  Waktu pelaksanaan untuk item ini (ISO8601). FE boleh pakai local time lalu di-convert string.

- `item_barang_group_id` (integer, optional tapi **direkomendasikan**)  
  ID group barang yang sama dengan Work Order Planning Item:  
  - Di FE, diambil dari `work_order_planning_item.item_barang_group_id` atau `item_barang_group.id`.  
  - Di BE, disimpan sebagai FK ke `ref_item_barang_group`.

- `assignments` (array, required)  
  List pelaksana yang mengerjakan item ini.

##### 1.3.1 Assignment Fields

Untuk setiap elemen `assignments[*]`:

- `id` (integer | null, optional)  
  ID assignment existing. Saat create pakai `null`.

- `qty` (integer, required)  
  Qty yang dikerjakan oleh pelaksana ini. Minimal 1.

- `weight` atau `berat` (number, required)  
  Berat yang dikerjakan oleh pelaksana ini. BE menerima salah satu field, FE boleh kirim `weight` saja.

- `pelaksana_id` (integer, required)  
  ID pelaksana (relasi ke `ref_pelaksana`).

- `pelaksana` (string, optional)  
  Nama pelaksana. Boleh kosong saat create.

- `tanggal` (string, required)  
  Tanggal pelaksanaan, format `YYYY-MM-DD`.

- `jamMulai` (string, required)  
  Jam mulai kerja, format fleksibel tapi direkomendasikan `HH:mm:ss`.

- `jamSelesai` (string, required)  
  Jam selesai kerja, format fleksibel tapi direkomendasikan `HH:mm:ss`.

- `catatan` (string, optional)  
  Catatan untuk assignment ini.

- `status` (string | null, optional)  
  Status assignment, optional saat create.

---

### 2. Contoh Sukses

**Request:**

```http
POST /api/work-order-actual HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json
```

Body seperti contoh di atas.

**Response:**

```json
{
  "success": true,
  "message": "Data WorkOrderActual berhasil disimpan"
}
```

Backend juga bisa mengembalikan objek `data` berisi WO Actual yang baru dibuat, tergantung implementasi controller.

---

### 3. Contoh Error

#### 3.1 Validasi Gagal (422)

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "foto_bukti": ["The foto bukti field is required."]
  }
}
```

#### 3.2 ID Item Planning Salah (400/404)

```json
{
  "success": false,
  "message": "WorkOrderPlanningItem dengan ID 0 tidak ditemukan"
}
```

Biasanya terjadi kalau `items` dikirim sebagai array, bukan object keyed by ID.

#### 3.3 Body Kosong (400)

```json
{
  "success": false,
  "message": "Data tidak boleh kosong"
}
```

---

### 4. Catatan Implementasi di Frontend

- FE **wajib**:
  - Mengirim `foto_bukti` header dalam bentuk base64.
  - Mengirim `items` sebagai object keyed by ID planning item (`"49"`, `"50"`, ...).
  - Mengirim `assignments[*].pelaksana_id`, `qty`, dan `weight/berat`.
- FE **sebaiknya**:
  - Meneruskan `item_barang_group_id` dari Work Order Planning ke setiap item WO Actual.
  - Mengirim `foto_sisa_barang` kalau ada foto sisa yang perlu di-track.

