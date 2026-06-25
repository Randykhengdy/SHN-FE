import { format } from 'date-fns';

const formatDecimal2 = (number) => {
  if (number === undefined || number === null) return '0.00';
  return Number(number).toFixed(2);
};

/**
 * Print Report Barang Habis / Tanggal
 *
 * data[] = [{
 *   gudang_id, gudang,
 *   rows: [{ habis_at, kode_barang, nama_barang, group_barang, jenis_barang, qty, berat, dimensi }]
 * }]
 */
export const printBarangHabisReport = (data, startDate, endDate) => {
  const periodeStart = startDate ? format(new Date(startDate), 'dd-MM-yyyy') : '-';
  const periodeEnd   = endDate   ? format(new Date(endDate),   'dd-MM-yyyy') : '-';
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let gtQty = 0, gtBerat = 0;

  const gudangBlocks = (data || []).map((grup) => {
    const rows = grup.rows || [];
    const namaGudang = grup.gudang || '-';
    let stQty = 0, stBerat = 0;

    const rowHtml = rows.map((row) => {
      stQty += Number(row.qty || 0);
      stBerat += Number(row.berat || 0);

      const tglFormatted = row.habis_at ? format(new Date(row.habis_at), 'dd-MM-yyyy HH:mm:ss') : '-';

      return `
        <tr>
          <td align="center">${tglFormatted}</td>
          <td align="center">${row.kode_barang || '-'}</td>
          <td align="left"  >${row.nama_barang || '-'}</td>
          <td align="left"  >${row.group_barang || '-'}</td>
          <td align="left"  >${row.dimensi || '-'}</td>
          <td align="right" >${row.qty ?? 0}</td>
          <td align="right" >${formatDecimal2(row.berat)}</td>
        </tr>
      `;
    }).join('');

    gtQty += stQty;
    gtBerat += stBerat;

    return `
      <tr class="gudang-header">
        <td colspan="7" style="font-weight:bold; padding:7px 4px 3px 4px;">Gudang : ${namaGudang}</td>
      </tr>
      ${rowHtml}
      <tr class="subtotal-row">
        <td colspan="5" align="right" style="font-style:italic; font-size:9px; border-top:1px dotted #888; padding-right:8px;">
          ${namaGudang}
        </td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${stQty}</td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${formatDecimal2(stBerat)}</td>
      </tr>
    `;
  }).join('');

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Report Barang Habis / Tanggal</title>
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
          @page { size:A4 landscape; margin:1cm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Report Barang Habis</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Report Barang Habis / Tanggal</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="15%">Terhitung Habis Pada</th>
              <th width="10%">Kode Barang</th>
              <th width="30%" align="left">Nama Barang</th>
              <th width="15%" align="left">Group Barang</th>
              <th width="15%" align="left">Dimensi</th>
              <th width="5%">Qty</th>
              <th width="10%">Berat</th>
            </tr>
          </thead>
          <tbody>
            ${gudangBlocks || '<tr><td colspan="7" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
            <tr class="grand-total-row">
              <td colspan="5" align="center">GRAND TOTAL</td>
              <td align="right">${gtQty}</td>
              <td align="right">${formatDecimal2(gtBerat)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
