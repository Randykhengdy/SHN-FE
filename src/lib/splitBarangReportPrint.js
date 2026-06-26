import { format } from 'date-fns';

const formatDecimal2 = (number) => {
  if (number === undefined || number === null) return '0.00';
  return Number(number).toFixed(2);
};

const formatDimensiNum = (number) => {
  if (number === undefined || number === null) return '';
  const num = Number(number);
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

const getDimensiString = (item) => {
  const parts = [];
  if (item.panjang && item.panjang > 0) parts.push(`P:${formatDimensiNum(item.panjang)}`);
  if (item.lebar && item.lebar > 0) parts.push(`L:${formatDimensiNum(item.lebar)}`);
  if (item.tebal && item.tebal > 0) parts.push(`T:${formatDimensiNum(item.tebal)}`);
  if (item.diameter && item.diameter > 0) parts.push(`Ø:${formatDimensiNum(item.diameter)}`);
  if (item.diameter_dalam && item.diameter_dalam > 0) parts.push(`ØD:${formatDimensiNum(item.diameter_dalam)}`);
  if (item.diameter_luar && item.diameter_luar > 0) parts.push(`ØL:${formatDimensiNum(item.diameter_luar)}`);
  if (item.sisi1 && item.sisi1 > 0) parts.push(`S1:${formatDimensiNum(item.sisi1)}`);
  if (item.sisi2 && item.sisi2 > 0) parts.push(`S2:${formatDimensiNum(item.sisi2)}`);
  return parts.length > 0 ? parts.join(' x ') : '-';
};

/**
 * Print Report Split Barang / Tanggal
 */
export const printSplitBarangReport = (data, startDate, endDate) => {
  const periodeStart = startDate ? format(new Date(startDate), 'dd-MM-yyyy') : '-';
  const periodeEnd   = endDate   ? format(new Date(endDate),   'dd-MM-yyyy') : '-';
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let gtTotalAnak = 0;

  const rowsHtml = (data || []).map((parentItem) => {
    const children = parentItem.children || [];
    const namaBarang = parentItem.nama_item_barang || '-';
    const kodeBarang = parentItem.kode_barang || '-';
    const gudang = parentItem.gudang ? parentItem.gudang.nama_gudang : '-';
    const tanggalSplit = parentItem.split_at ? format(new Date(parentItem.split_at), 'dd-MM-yyyy HH:mm') : '-';
    const parentDimensi = getDimensiString(parentItem);
    
    let anakRows = '';
    if (children.length > 0) {
      anakRows = children.map((anak) => {
        gtTotalAnak++;
        const anakDimensi = getDimensiString(anak);
        return `
          <tr class="anak-row">
            <td align="right" style="padding-right:15px; font-size:12px; color:#64748b;">↳</td>
            <td align="left" class="kode-barang-cell">${anak.kode_barang || '-'}</td>
            <td align="left">${anak.nama_item_barang || '-'}</td>
            <td align="left">${anakDimensi}</td>
            <td align="right">${anak.quantity ?? 0}</td>
            <td align="right">${formatDecimal2(anak.berat)}</td>
          </tr>
        `;
      }).join('');
    } else {
      anakRows = `
        <tr class="anak-row">
          <td align="center">↳</td>
          <td colspan="5" align="center" style="font-style: italic; color: #888;">Tidak ada data hasil split (kemungkinan sudah dihapus)</td>
        </tr>
      `;
    }

    return `
      <tr class="parent-row">
        <td align="center" style="font-weight: bold;">${tanggalSplit}</td>
        <td align="left" class="kode-barang-cell" style="font-weight: bold;">${kodeBarang}</td>
        <td align="left" style="font-weight: bold;">${namaBarang}</td>
        <td align="left" style="font-weight: bold;">${parentDimensi}</td>
        <td align="right" style="font-weight: bold;">${parentItem.quantity ?? 0}</td>
        <td align="right" style="font-weight: bold;">${formatDecimal2(parentItem.berat)}</td>
      </tr>
      ${anakRows}
    `;
  }).join('');

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Report Split Barang / Tanggal</title>
      <style>
        body { font-family:'Courier New',Courier,monospace; font-size:10px; margin:0; padding:60px 20px 20px; background:#f5f5f5; }
        .report-page { background:white; padding:25px 35px; box-shadow:0 0 10px rgba(0,0,0,.1); min-height:21cm; margin:0 auto; width:28cm; }
        .toolbar { position:fixed; top:0; left:0; right:0; height:50px; background:#1e293b; color:white; display:flex; align-items:center; padding:0 20px; gap:10px; z-index:1000; }
        .toolbar-title { font-family:sans-serif; font-size:14px; font-weight:bold; margin-right:auto; }
        .btn { padding:6px 15px; border-radius:4px; border:none; cursor:pointer; font-weight:bold; font-family:sans-serif; font-size:12px; }
        .btn-print { background:#2563eb; color:white; } .btn-close { background:#ef4444; color:white; }
        .header { text-align:center; margin-bottom:14px; position:relative; }
        .header h1 { font-size:13px; margin:0 0 4px; text-decoration:underline; font-family:sans-serif; }
        .header .periode { font-size:11px; font-weight:bold; font-family:sans-serif; }
        .top-right-info { position:absolute; top:0; right:0; text-align:right; font-family:sans-serif; font-size:10px; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; table-layout:fixed; }
        th { border-top:2px solid #000; border-bottom:2px solid #000; padding:6px 4px; text-align:center; font-weight:bold; font-size:11px; background:#f0f0f0; }
        td { padding:6px 4px; font-size:10px; border-bottom:1px solid #ddd; word-wrap:break-word; vertical-align:top; }
        .parent-row td { background:#e2e8f0; border-top: 1px solid #94a3b8; padding-top:8px; padding-bottom:8px; }
        .anak-row td { color:#334155; }
        .kode-barang-cell { word-break: break-all; }
        .grand-total-row td { border-top:2px solid #000; border-bottom:2px double #000; font-weight:bold; padding:6px 4px; }
        @media print {
          .toolbar { display:none!important; }
          body { padding:0; background:white; }
          .report-page { padding:0; box-shadow:none; width:100%; }
          @page { size:A4 landscape; margin:1cm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Report Split Barang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Report Split Barang / Tanggal</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="12%">Tanggal Split</th>
              <th width="28%" align="left">Kode Barang</th>
              <th width="28%" align="left">Nama Barang</th>
              <th width="17%" align="left">Dimensi</th>
              <th width="5%" align="right">Qty</th>
              <th width="10%" align="right">Berat</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
            <tr class="grand-total-row">
              <td colspan="4" align="center">TOTAL ITEM HASIL SPLIT</td>
              <td align="right">${gtTotalAnak}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
