export const platTypes = [
  { kode: "A1100", ketebalan: 1.2, harga: 500000 },
  { kode: "A5052", ketebalan: 1.5, harga: 650000 },
  { kode: "A6061", ketebalan: 2.0, harga: 700000 },
  { kode: "A2024", ketebalan: 2.5, harga: 900000 },
  { kode: "A7075", ketebalan: 3.0, harga: 1200000 },
  { kode: "A3003", ketebalan: 1.0, harga: 550000 }
];

export function getPlatData(kode) {
  return platTypes.find(pt => pt.kode === kode);
}

export function generateNoPO() {
  const date = new Date();
  const ymd = date.toISOString().slice(0,10).replace(/-/g,'');
  const poList = JSON.parse(localStorage.getItem('poList') || '[]');
  const count = (poList.length + 1).toString().padStart(3, '0');
  return `PO-ALU-${ymd}-${count}`;
}