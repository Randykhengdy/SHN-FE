import { format } from 'date-fns';

/**
 * Print Report Waktu Proses SO / WO / Tanggal
 *
 * data[] = [{
 *   tanggal, nomor_so, nomor_wo, gudang, pelanggan,
 *   so_dibuat, so_dicetak, wo_dicetak,
 *   estimate_selesai, real_selesai, selisih, selisih_menit,
 *   no_invoice, status_wo
 * }]
 */
export const printTrackingSOWOReport = (data, startDate, endDate) => {
  const periodeStart = startDate ? format(new Date(startDate), 'dd-MM-yyyy') : '-';
  const periodeEnd   = endDate   ? format(new Date(endDate),   'dd-MM-yyyy') : '-';
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  const rows = (data || []).map((row) => {
    const selisihMenit = row.selisih_menit;
    let selisihClass = '';
    if (selisihMenit !== null && selisihMenit !== undefined) {
      selisihClass = selisihMenit >= 0 ? 'early' : 'late';
    }

    return `
      <tr>
        <td align="center">${row.tanggal || ''}</td>
        <td align="left">${row.nomor_so || ''}</td>
        <td align="left">${row.nomor_wo || ''}</td>
        <td align="left">${row.gudang || ''}</td>
        <td align="left">${row.pelanggan || ''}</td>
        <td align="center">${row.so_dibuat || ''}</td>
        <td align="center">${row.so_dicetak || ''}</td>
        <td align="center">${row.wo_dicetak || ''}</td>
        <td align="center">${row.estimate_selesai || '-'}</td>
        <td align="center">${row.real_selesai || '-'}</td>
        <td align="center" class="${selisihClass}">${row.selisih || '-'}</td>
        <td align="left">${row.no_invoice || '-'}</td>
        <td align="center">${row.status_wo || ''}</td>
      </tr>
    `;
  }).join('');

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Waktu Proses SO / WO / Tanggal</title>
      <style>
        body { font-family:'Courier New',Courier,monospace; font-size:9px; margin:0; padding:60px 10px 20px; background:#f5f5f5; }
        .report-page { background:white; padding:20px 30px; box-shadow:0 0 10px rgba(0,0,0,.1); min-height:21cm; margin:0 auto; width:52cm; }
        .toolbar { position:fixed; top:0; left:0; right:0; height:50px; background:#1e293b; color:white; display:flex; align-items:center; padding:0 20px; gap:10px; z-index:1000; }
        .toolbar-title { font-family:sans-serif; font-size:14px; font-weight:bold; margin-right:auto; }
        .btn { padding:6px 15px; border-radius:4px; border:none; cursor:pointer; font-weight:bold; font-family:sans-serif; font-size:12px; }
        .btn-print { background:#2563eb; color:white; } .btn-close { background:#ef4444; color:white; }
        .header { text-align:center; margin-bottom:12px; position:relative; }
        .header h1 { font-size:13px; margin:0 0 3px; text-decoration:underline; font-family:sans-serif; }
        .header .periode { font-size:10px; font-weight:bold; font-family:sans-serif; }
        .top-right-info { position:absolute; top:0; right:0; text-align:right; font-family:sans-serif; font-size:9px; }
        table { width:100%; border-collapse:collapse; }
        th { border-top:2px solid #000; border-bottom:2px solid #000; padding:3px 2px; text-align:center; font-weight:bold; font-size:9px; }
        th.group-header { border-bottom:1px solid #555; }
        th.sub-header { border-top:none; border-bottom:2px solid #000; }
        td { padding:2px 2px; font-size:9px; border-bottom:1px solid #eee; }
        tr:nth-child(even) td { background:#fafafa; }
        .early { color:#15803d; font-weight:bold; }
        .late  { color:#dc2626; font-weight:bold; }
        @media print {
          .toolbar { display:none!important; }
          body { padding:0; background:white; }
          .report-page { padding:5mm; box-shadow:none; width:100%; }
          @page { size:A3 landscape; margin:8mm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Waktu Proses SO / WO / Tanggal</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Waktu Proses SO / WO / Tanggal</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" width="5%"  style="vertical-align:bottom;">Tanggal</th>
              <th rowspan="2" width="8%"  style="vertical-align:bottom;">No. SO</th>
              <th rowspan="2" width="8%"  style="vertical-align:bottom;">No. WO</th>
              <th rowspan="2" width="6%"  style="vertical-align:bottom;">Gudang</th>
              <th rowspan="2" width="10%" style="vertical-align:bottom;">Pelanggan</th>
              <th colspan="3" class="group-header" width="21%">Waktu Proses</th>
              <th colspan="3" class="group-header" width="21%">Selesai</th>
              <th rowspan="2" width="8%"  style="vertical-align:bottom;">No. Invoice</th>
              <th rowspan="2" width="5%"  style="vertical-align:bottom;">Status</th>
            </tr>
            <tr>
              <th class="sub-header">SO Dibuat</th>
              <th class="sub-header">SO Dicetak</th>
              <th class="sub-header">WO Dicetak</th>
              <th class="sub-header">Estimasi</th>
              <th class="sub-header">Real</th>
              <th class="sub-header">Selisih</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="13" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
