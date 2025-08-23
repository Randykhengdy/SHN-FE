// Data dummy jenis plat & harga
const platTypes = [
  { kode: "A1100", ketebalan: 1.2, harga: 500000 },
  { kode: "A5052", ketebalan: 1.5, harga: 650000 },
  { kode: "A6061", ketebalan: 2.0, harga: 700000 },
  { kode: "A2024", ketebalan: 2.5, harga: 900000 },
  { kode: "A7075", ketebalan: 3.0, harga: 1200000 },
  { kode: "A3003", ketebalan: 1.0, harga: 550000 }
];

let currentItems = [];

function populateJenisPlat() {
  const select = document.getElementById('jenisPlat');
  select.innerHTML = '';
  platTypes.forEach(pt => {
    const opt = document.createElement('option');
    opt.value = pt.kode;
    opt.textContent = pt.kode;
    select.appendChild(opt);
  });
}

function getPlatData(kode) {
  return platTypes.find(pt => pt.kode === kode);
}

function generateNoPO() {
  const date = new Date();
  const ymd = date.toISOString().slice(0,10).replace(/-/g,'');
  const count = (JSON.parse(localStorage.getItem('poList')||'[]').length+1).toString().padStart(3,'0');
  return `PO-ALU-${ymd}-${count}`;
}

function updateItemForm() {
  const panjang = parseFloat(document.getElementById('panjang').value) || 0;
  const lebar = parseFloat(document.getElementById('lebar').value) || 0;
  const qty = parseInt(document.getElementById('qty').value) || 1;
  const jenis = document.getElementById('jenisPlat').value;
  const plat = getPlatData(jenis);
  const luas = panjang * lebar;
  document.getElementById('ketebalan').textContent = plat ? plat.ketebalan : '';
  document.getElementById('luas').textContent = luas.toFixed(2);
  document.getElementById('harga').textContent = plat ? plat.harga.toLocaleString() : '';
  document.getElementById('total').textContent = plat ? (luas * plat.harga * qty).toLocaleString() : '';
}

function tambahItem() {
  const panjang = parseFloat(document.getElementById('panjang').value);
  const lebar = parseFloat(document.getElementById('lebar').value);
  const qty = parseInt(document.getElementById('qty').value);
  const jenis = document.getElementById('jenisPlat').value;
  const plat = getPlatData(jenis);
  if (!panjang || !lebar || !qty || !plat) {
    alert('Lengkapi data item!');
    return;
  }
  const luas = panjang * lebar;
  const total = luas * plat.harga * qty;
  currentItems.push({
    jenis,
    panjang,
    lebar,
    ketebalan: plat.ketebalan,
    qty,
    luas,
    harga: plat.harga,
    total
  });
  renderItemTable();
  document.getElementById('itemForm').reset();
  updateItemForm();
}

function hapusItem(idx) {
  currentItems.splice(idx, 1);
  renderItemTable();
}

function renderItemTable() {
  const tbody = document.querySelector('#itemTable tbody');
  tbody.innerHTML = '';
  let totalPO = 0;
  currentItems.forEach((item, idx) => {
    totalPO += item.total;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${item.jenis}</td>
      <td>${item.panjang}x${item.lebar}x${item.ketebalan}</td>
      <td>${item.qty}</td>
      <td>${item.luas.toFixed(2)}</td>
      <td>Rp ${item.harga.toLocaleString()}</td>
      <td>Rp ${item.total.toLocaleString()}</td>
      <td><button onclick="hapusItem(${idx})">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('totalPO').textContent = totalPO.toLocaleString();
}

function simpanPO() {
  if (currentItems.length === 0) {
    alert('Tambahkan minimal 1 item ke PO!');
    return;
  }
  const total = currentItems.reduce((a, b) => a + b.total, 0);
  const noPO = generateNoPO();
  const po = {
    noPO,
    items: currentItems,
    total,
    status: "Menunggu Workshop"
  };
  const poList = JSON.parse(localStorage.getItem('poList')||'[]');
  poList.push(po);
  localStorage.setItem('poList', JSON.stringify(poList));
  currentItems = [];
  renderItemTable();
  renderPO();
  alert('PO berhasil disimpan!');
}

function renderPO() {
  const tbody = document.querySelector('#poTable tbody');
  tbody.innerHTML = '';
  const poList = JSON.parse(localStorage.getItem('poList')||'[]');
  poList.forEach(po => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${po.noPO}</td><td>${po.items.length}</td><td>Rp ${po.total.toLocaleString()}</td><td>${po.status}</td>`;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateJenisPlat();
  updateItemForm();
  renderItemTable();
  renderPO();
  document.getElementById('jenisPlat').addEventListener('change', updateItemForm);
  document.getElementById('panjang').addEventListener('input', updateItemForm);
  document.getElementById('lebar').addEventListener('input', updateItemForm);
  document.getElementById('qty').addEventListener('input', updateItemForm);
  document.getElementById('tambahItem').addEventListener('click', tambahItem);
  document.getElementById('simpanPO').addEventListener('click', simpanPO);
}); 