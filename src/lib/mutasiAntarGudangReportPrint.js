import { format } from 'date-fns';

const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const formatDecimal2 = (number) => {
  if (number === undefined || number === null) return '0.00';
  return Number(number).toFixed(2);
};

/**
 * Print Report Mutasi Antar Gudang / Tanggal
 *
 * data[] = [{
 *   gudang_asal_id, gudang_asal, gudang_tujuan_id, gudang_tujuan,
 *   rows: [{ tanggal, nomor_mutasi, jenis_mutasi, nama_barang, status, qty, total_kg, harga, jumlah, status_mutasi }]
 * }]
 *
 * Layout:
 *   Gudang : A-14 → Gudang Utama    ← group header
 *     02-03-2026 | SHN.260302.007 | Permintaan Pindah Gudang | ALUMINIUM PLAT 5052... | UTUH | 1 | 41.60 | 3,120,000
 *   [subtotal grup]
 *   GRAND TOTAL
 */
export const printMutasiAntarGudangReport = (data, startDate, endDate) => {
  const periodeStart = startDate ? format(new Date(startDate), 'dd-MM-yyyy') : '-';
  const periodeEnd   = endDate   ? format(new Date(endDate),   'dd-MM-yyyy') : '-';
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let gtQty = 0, gtKg = 0, gtJumlah = 0;

  const gudangBlocks = (data || []).map((grup) => {
    const headerLabel = `Gudang : ${grup.gudang_asal || '-'} &rarr; ${grup.gudang_tujuan || '-'}`;
    const rows = grup.rows || [];

    let stQty = 0, stKg = 0, stJumlah = 0;

    const rowHtml = rows.map((row) => {
      stQty    += Number(row.qty      || 0);
      stKg     += Number(row.total_kg || 0);
      stJumlah += Number(row.jumlah   || 0);

      return `
        <tr>
          <td align="center">${row.tanggal      || ''}</td>
          <td align="left"  >${row.nomor_mutasi || ''}</td>
          <td align="left"  >${row.jenis_mutasi || ''}</td>
          <td align="left"  >${row.nama_barang  || ''}</td>
          <td align="center">${row.status       || ''}</td>
          <td align="right" >${row.qty          ?? 0}</td>
          <td align="right" >${formatDecimal2(row.total_kg)}</td>
          <td align="right" >${formatCurrency(row.jumlah)}</td>
        </tr>
      `;
    }).join('');

    gtQty    += stQty;
    gtKg     += stKg;
    gtJumlah += stJumlah;

    return `
      <tr class="gudang-header">
        <td colspan="8" style="font-weight:bold; padding:7px 4px 3px 4px;">${headerLabel}</td>
      </tr>
      ${rowHtml}
      <tr class="subtotal-row">
        <td colspan="4" align="right" style="font-style:italic; font-size:9px; border-top:1px dotted #888; padding-right:8px;">
          ${grup.gudang_asal} → ${grup.gudang_tujuan}
        </td>
        <td style="border-top:1px dotted #888;"></td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${stQty}</td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${formatDecimal2(stKg)}</td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${formatCurrency(stJumlah)}</td>
      </tr>
    `;
  }).join('');

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Mutasi Antar Gudang / Tanggal</title>
      <style>
        body { font-family:'Courier New',Courier,monospace; font-size:10px; margin:0; padding:60px 20px 20px; background:#f5f5f5; }
        .report-page { background:white; padding:25px 35px; box-shadow:0 0 10px rgba(0,0,0,.1); min-height:21cm; margin:0 auto; width:37cm; }
        .toolbar { position:fixed; top:0; left:0; right:0; height:50px; background:#1e293b; color:white; display:flex; align-items:center; padding:0 20px; gap:10px; z-index:1000; }
        .toolbar-title { font-family:sans-serif; font-size:14px; font-weight:bold; margin-right:auto; }
        .btn { padding:6px 15px; border-radius:4px; border:none; cursor:pointer; font-weight:bold; font-family:sans-serif; font-size:12px; }
        .btn-print { background:#2563eb; color:white; } .btn-close { background:#ef4444; color:white; }
        .header { text-align:center; margin-bottom:14px; position:relative; }
        .header h1 { font-size:14px; margin:0 0 4px; text-decoration:underline; font-family:sans-serif; }
        .header .periode { font-size:11px; font-weight:bold; font-family:sans-serif; }
        .top-right-info { position:absolute; top:0; right:0; text-align:right; font-family:sans-serif; font-size:10px; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        th { border-top:2px solid #000; border-bottom:2px solid #000; padding:4px 3px; text-align:center; font-weight:bold; font-size:10px; }
        td { padding:2px 3px; font-size:10px; }
        .gudang-header td { background:#f0f0f0; }
        .subtotal-row td { padding-top:2px; padding-bottom:5px; }
        .grand-total-row td { border-top:2px solid #000; border-bottom:2px double #000; font-weight:bold; padding:4px 3px; }
        @media print {
          .toolbar { display:none!important; }
          body { padding:0; background:white; }
          .report-page { padding:0; box-shadow:none; width:100%; }
          @page { size:A3 landscape; margin:1cm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Mutasi Antar Gudang / Tanggal</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Mutasi Antar Gudang / Tanggal</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="9%">Tanggal</th>
              <th width="14%">No. Bukti</th>
              <th width="22%">Jenis Mutasi</th>
              <th width="28%" align="left">Nama Barang</th>
              <th width="7%">Status</th>
              <th width="5%">Qty</th>
              <th width="7%">Total Kg</th>
              <th width="8%">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${gudangBlocks || '<tr><td colspan="8" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
            <tr class="grand-total-row">
              <td colspan="5" align="center">GRAND TOTAL</td>
              <td align="right">${gtQty}</td>
              <td align="right">${formatDecimal2(gtKg)}</td>
              <td align="right">${formatCurrency(gtJumlah)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
