import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const fmt = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('id-ID').format(Math.round(num));
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return format(d, 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

export const printRincianKeuanganReport = (reportData, startDate, endDate) => {
  const { saldo_awal, rows = [], total } = reportData;

  const periodeLabel = `${fmtDate(startDate)} s.d. ${fmtDate(endDate)}`;
  const bulanLabel = (() => {
    try {
      const d = new Date(startDate + 'T00:00:00');
      return format(d, 'MMMM yyyy', { locale: localeId });
    } catch { return ''; }
  })();
  const todayStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId });

  // Header baris saldo awal
  const saldoAwalHtml = saldo_awal?.saldo
    ? `<tr class="saldo-awal-row">
        <td colspan="3" align="left" style="font-style:italic;">Saldo Kas Per ${fmtDate(saldo_awal.tanggal)}</td>
        <td align="right" style="font-style:italic;">${fmt(saldo_awal.saldo)}</td>
        <td colspan="5"></td>
      </tr>`
    : '';

  const rowsHtml = rows.map(r => `
    <tr>
      <td align="center">${fmtDate(r.tanggal)}</td>
      <td align="right">${fmt(r.kas_masuk)}</td>
      <td align="right">${fmt(r.kas_keluar)}</td>
      <td align="right">${fmt(r.saldo_kas)}</td>
      <td align="right">${fmt(r.penjualan)}</td>
      <td align="right">${fmt(r.hpp)}</td>
      <td align="right">${fmt(r.lain_lain)}</td>
      <td align="right">${fmt(r.pemakaian_kas)}</td>
      <td align="right">${fmt(r.laba_operasional)}</td>
    </tr>
  `).join('');

  const totalHtml = `
    <tr class="grand-total-row">
      <td align="center">TOTAL</td>
      <td align="right">${fmt(total?.kas_masuk)}</td>
      <td align="right">${fmt(total?.kas_keluar)}</td>
      <td align="right">${fmt(total?.saldo_kas_akhir)}</td>
      <td align="right">${fmt(total?.penjualan)}</td>
      <td align="right">${fmt(total?.hpp)}</td>
      <td align="right">${fmt(total?.lain_lain)}</td>
      <td align="right">${fmt(total?.pemakaian_kas)}</td>
      <td align="right">${fmt(total?.laba_operasional)}</td>
    </tr>
  `;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rincian Keuangan dan Laba Operasional</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      margin: 0;
      padding: 60px 20px 20px 20px;
      background-color: #f5f5f5;
      color: #000;
    }
    .report-page {
      background-color: white;
      padding: 30px 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      min-height: 21cm;
      margin: 0 auto;
      width: 32cm;
    }
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0;
      height: 50px; background-color: #333; color: white;
      display: flex; align-items: center; padding: 0 20px; gap: 10px; z-index: 1000;
    }
    .toolbar-title { font-family: sans-serif; font-size: 14px; font-weight: bold; margin-right: auto; }
    .btn { padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; font-family: sans-serif; font-size: 12px; }
    .btn-print { background-color: #2563eb; color: white; }
    .btn-print:hover { background-color: #1d4ed8; }
    .btn-close { background-color: #ef4444; color: white; }
    .header { text-align: center; margin-bottom: 16px; position: relative; }
    .header h1 { font-size: 14px; margin: 0 0 3px 0; text-decoration: underline; }
    .header .bulan { font-size: 12px; font-weight: bold; margin-top: 2px; }
    .top-right-info { position: absolute; top: 0; right: 0; text-align: right; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    th {
      border-top: 2px solid #000; border-bottom: 2px solid #000;
      padding: 4px 3px; text-align: center; font-weight: bold; font-size: 10.5px;
    }
    td { padding: 2px 3px; font-size: 10.5px; }
    .saldo-awal-row td { border-bottom: 1px dotted #555; }
    .grand-total-row td {
      border-top: 2px solid #000; border-bottom: 2px double #000;
      font-weight: bold; padding-top: 4px; padding-bottom: 4px;
    }
    tr:nth-child(even) { background-color: #fafafa; }
    @media print {
      .toolbar { display: none !important; }
      body { padding: 0; background-color: white; }
      .report-page { padding: 0; box-shadow: none; width: 100%; min-height: auto; }
      @page { size: A4 landscape; margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="toolbar-title">Print Preview - Rincian Keuangan dan Laba Operasional</span>
    <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
    <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
  </div>

  <div class="report-page">
    <div class="header">
      <div class="top-right-info">
        <div>${todayStr}</div>
      </div>
      <h1>Rincian Keuangan dan Laba Operasional / Tanggal</h1>
      <div class="bulan">Bulan : ${bulanLabel}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th width="9%">Tanggal</th>
          <th width="11%">Kas Masuk</th>
          <th width="11%">Kas Keluar</th>
          <th width="13%">Saldo Kas</th>
          <th width="12%">Penjualan</th>
          <th width="10%">H P P</th>
          <th width="10%">Lain-lain</th>
          <th width="12%">Pemakaian Kas</th>
          <th width="12%">Laba Operasional</th>
        </tr>
      </thead>
      <tbody>
        ${saldoAwalHtml}
        ${rowsHtml}
        ${totalHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};
