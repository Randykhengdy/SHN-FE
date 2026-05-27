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

const getBulanLabel = (startDate, endDate) => {
  try {
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T00:00:00');
    const sLabel = format(s, 'MMMM yyyy', { locale: localeId });
    const eLabel = format(e, 'MMMM yyyy', { locale: localeId });
    return sLabel === eLabel ? sLabel : `${sLabel} s.d. ${eLabel}`;
  } catch {
    return '';
  }
};

// Baris laporan: label kiri, nilai kanan, tanda (+/-)
const row = (label, value, sign = '', bold = false, indent = true) => {
  const indentStyle = indent ? 'padding-left:24px;' : '';
  const boldStyle = bold ? 'font-weight:bold;' : '';
  const signHtml = sign
    ? `<td style="width:40px;text-align:left;padding-left:6px;${boldStyle}">${sign}</td>`
    : `<td style="width:40px;"></td>`;
  return `
    <tr>
      <td style="${indentStyle}${boldStyle}padding-top:1px;padding-bottom:1px;">${label}</td>
      <td style="text-align:right;white-space:nowrap;${boldStyle}padding-top:1px;padding-bottom:1px;">${value !== undefined && value !== null ? fmt(value) : ''}</td>
      ${signHtml}
    </tr>`;
};

const separator = () => `<tr><td colspan="3" style="border-top:1px solid #000;padding:0;"></td></tr>`;

export const printRekapLabaOperasionalReport = (reportData, startDate, endDate) => {
  const rl = reportData?.rugi_laba_operasional || {};
  const sk = reportData?.saldo_kas_keuangan || {};

  const todayStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId });
  const bulanLabel = getBulanLabel(startDate, endDate);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rekap Laba Operasional &amp; Keuangan</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      margin: 0;
      padding: 60px 20px 20px 20px;
      background-color: #f5f5f5;
      color: #000;
    }
    .report-page {
      background-color: white;
      padding: 30px 50px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      min-height: 21cm;
      margin: 0 auto;
      width: 18cm;
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
    .header h1 { font-size: 13px; margin: 0 0 3px 0; font-weight: bold; }
    .header .bulan { font-size: 12px; margin-top: 2px; }
    .top-right-info { position: absolute; top: 0; right: 0; text-align: right; font-size: 11px; }
    .section-title { font-weight: bold; padding-top: 6px; padding-bottom: 2px; }
    table.report-table { width: 100%; border-collapse: collapse; }
    table.report-table td { font-size: 12px; }
    hr.thick { border: none; border-top: 2px solid #000; margin: 6px 0; }
    hr.thin  { border: none; border-top: 1px solid #000; margin: 4px 0; }
    @media print {
      .toolbar { display: none !important; }
      body { padding: 0; background-color: white; }
      .report-page { padding: 0; box-shadow: none; width: 100%; min-height: auto; }
      @page { size: A4 portrait; margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="toolbar-title">Print Preview - Rekap Laba Operasional &amp; Keuangan</span>
    <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
    <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
  </div>

  <div class="report-page">
    <div class="header">
      <div class="top-right-info">${todayStr}</div>
      <h1>Rekap Laba Operasional &amp; Keuangan</h1>
      <div class="bulan">Bulan : ${bulanLabel}</div>
    </div>

    <hr class="thick" />

    <!-- Rugi Laba Operasional -->
    <table class="report-table">
      <tbody>
        <tr><td colspan="3" class="section-title">Perhitungan Rugi Laba Operasional :</td></tr>
        ${row('Total Penjualan',          rl.total_penjualan)}
        ${row('Harga Pokok Pembelian',    rl.harga_pokok_pembelian,  '(-)')}
        ${row('Discount Pembelian',       rl.discount_pembelian,     '(+)')}
        ${row('Biaya Lain-2 Pembelian',   rl.biaya_lain_pembelian,   '(-)')}
        ${row('Discount Penjualan',       rl.discount_penjualan,     '(-)')}
        ${row('Biaya Lain-2 Penjualan',   rl.biaya_lain_penjualan,   '(+)')}
        ${row('Pemakaian Kas / Biaya',    rl.pemakaian_kas_biaya,    '(-)')}
        ${separator()}
        ${row('Laba Operasional',         rl.laba_operasional,       '', true, false)}
      </tbody>
    </table>

    <hr class="thick" style="margin-top:8px;" />

    <!-- Saldo Kas / Keuangan -->
    <table class="report-table">
      <tbody>
        <tr><td colspan="3" class="section-title">Perhitungan Saldo Kas / Keuangan :</td></tr>
        ${row(`Saldo Awal Per ${fmtDate(sk.tanggal_saldo_awal)}`, sk.saldo_awal)}
        ${row('Uang Muka Penjualan / SO',         sk.uang_muka_penjualan,           '(+)')}
        ${row('Pembayaran Piutang Penjualan',      sk.pembayaran_piutang_penjualan,  '(+)')}
        ${row('Kembali Uang Muka Penjualan',       sk.kembali_uang_muka_penjualan,   '(-)')}
        ${row('Uang Muka Pembelian',               sk.uang_muka_pembelian,           '(-)')}
        ${row('Pembayaran Hutang Pembelian',        sk.pembayaran_hutang_pembelian,   '(-)')}
        ${row('Adjusment Kas (+/-)',               sk.adjustment_kas,                '(+)')}
        ${row('Pemakaian Kas / Biaya',             sk.pemakaian_kas_biaya,           '(-)')}
        ${separator()}
        ${row('Saldo Akhir Kas',                   sk.saldo_akhir_kas,               '', true, false)}
      </tbody>
    </table>

    <hr class="thick" style="margin-top:8px;" />
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};
