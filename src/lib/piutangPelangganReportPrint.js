import { format } from 'date-fns';

const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID').format(Number(number));
};

/**
 * Cetak Report Invoice Piutang / Pelanggan
 * @param {Array}  data        Array of { pelanggan, invoices[] } dari API
 * @param {string} startDate   YYYY-MM-DD
 * @param {string} endDate     YYYY-MM-DD
 */
export const printPiutangPelangganReport = (data, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), 'dd-MM-yyyy');
  const periodeEnd   = format(new Date(endDate),   'dd-MM-yyyy');
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let grandTotalInvoice  = 0;
  let grandTotalUM       = 0;
  let grandTotalBayar    = 0;
  let grandTotalPiutang  = 0;
  let grandTotalCount    = 0;

  const bodyRows = (data || []).map((grup) => {
    const pelanggan = grup.pelanggan || '-';
    const invoices  = grup.invoices  || [];

    let subTotalInvoice = 0;
    let subTotalUM      = 0;
    let subTotalBayar   = 0;
    let subTotalPiutang = 0;

    const invoiceRows = invoices.map((inv, i) => {
      const harga   = Number(inv.harga_invoice     ?? 0);
      const um      = Number(inv.uang_muka          ?? 0);
      const bayar   = Number(inv.total_pembayaran   ?? 0);
      const sisa    = Number(inv.sisa_piutang        ?? 0);

      subTotalInvoice += harga;
      subTotalUM      += um;
      subTotalBayar   += bayar;
      subTotalPiutang += sisa;

      const sisaStyle = sisa > 0 ? 'color:#b91c1c;font-weight:bold;' : 'color:#15803d;';

      return `
        <tr>
          <td align="center">${i + 1}</td>
          <td align="left">${inv.no_invoice ?? '-'}</td>
          <td align="center">${inv.tanggal_invoice ?? '-'}</td>
          <td align="right">${formatCurrency(harga)}</td>
          <td align="right">${formatCurrency(um)}</td>
          <td align="right">${formatCurrency(bayar)}</td>
          <td align="right" style="${sisaStyle}">${formatCurrency(sisa)}</td>
        </tr>
      `;
    }).join('');

    grandTotalInvoice  += subTotalInvoice;
    grandTotalUM       += subTotalUM;
    grandTotalBayar    += subTotalBayar;
    grandTotalPiutang  += subTotalPiutang;
    grandTotalCount    += invoices.length;

    const sisaTotalStyle = subTotalPiutang > 0
      ? 'color:#b91c1c;font-weight:bold;'
      : 'color:#15803d;font-weight:bold;';

    return `
      <tr>
        <td colspan="8" class="pelanggan-header">Pelanggan : ${pelanggan} (${invoices.length} invoice)</td>
      </tr>
      ${invoiceRows}
      <tr class="subtotal-row">
        <td colspan="2" align="center" style="font-weight:bold;">Sub Total</td>
        <td align="center">-</td>
        <td align="right" style="font-weight:bold;">${formatCurrency(subTotalInvoice)}</td>
        <td align="right" style="font-weight:bold;">${formatCurrency(subTotalUM)}</td>
        <td align="right" style="font-weight:bold;">${formatCurrency(subTotalBayar)}</td>
        <td align="right" style="${sisaTotalStyle}">${formatCurrency(subTotalPiutang)}</td>
      </tr>
    `;
  }).join('');

  const grandSisaStyle = grandTotalPiutang > 0
    ? 'color:#b91c1c;font-weight:bold;'
    : 'color:#15803d;font-weight:bold;';

  const documentHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Invoice Piutang / Pelanggan</title>
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
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 21cm;
          margin: 0 auto;
          width: 29.7cm;
        }
        .toolbar {
          position: fixed; top: 0; left: 0; right: 0; height: 50px;
          background-color: #333; color: white;
          display: flex; align-items: center; padding: 0 20px; gap: 10px;
          z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .toolbar-title { font-family: sans-serif; font-size: 14px; font-weight: bold; margin-right: auto; }
        .btn { padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; font-family: sans-serif; font-size: 12px; }
        .btn-print { background-color: #2563eb; color: white; }
        .btn-print:hover { background-color: #1d4ed8; }
        .btn-close  { background-color: #ef4444; color: white; }
        .btn-close:hover { background-color: #dc2626; }
        .header { text-align: center; margin-bottom: 20px; position: relative; }
        .header h1 { font-size: 16px; margin: 0 0 5px 0; text-decoration: underline; }
        .header .periode { margin-top: 5px; font-weight: bold; }
        .top-right-info { position: absolute; top: 0; right: 0; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th {
          border-top: 2px solid #000; border-bottom: 2px solid #000;
          padding: 5px 3px; text-align: center; font-weight: bold;
        }
        td { padding: 3px 3px; }
        .pelanggan-header {
          font-weight: bold; padding-top: 10px; padding-bottom: 5px;
          border-top: 1px solid #333; background-color: #f0f0f0;
        }
        .subtotal-row td { border-top: 1px dotted #555; }
        .grand-total-row td {
          border-top: 2px solid #000; border-bottom: 2px double #000;
          font-weight: bold; padding-top: 5px; padding-bottom: 5px;
        }
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
        <span class="toolbar-title">Print Preview - Invoice Piutang / Pelanggan</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <div class="top-right-info">
            <div>${todayStr}</div>
            <div>Halaman : 001</div>
          </div>
          <h1>Invoice Piutang / Pelanggan</h1>
          <div class="periode">Periode ${periodeStart} s.d. ${periodeEnd}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="3%"  align="center">No.</th>
              <th width="16%" align="left">No. Invoice</th>
              <th width="10%" align="center">Tgl. Invoice</th>
              <th width="17%" align="right">Harga Invoice</th>
              <th width="16%" align="right">Uang Muka</th>
              <th width="17%" align="right">Total Pembayaran</th>
              <th width="17%" align="right">Sisa Piutang</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
            <tr class="grand-total-row">
              <td colspan="2" align="center">GRAND TOTAL (${grandTotalCount} invoice)</td>
              <td align="center">-</td>
              <td align="right">${formatCurrency(grandTotalInvoice)}</td>
              <td align="right">${formatCurrency(grandTotalUM)}</td>
              <td align="right">${formatCurrency(grandTotalBayar)}</td>
              <td align="right" style="${grandSisaStyle}">${formatCurrency(grandTotalPiutang)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(documentHtml);
  printWindow.document.close();
};
