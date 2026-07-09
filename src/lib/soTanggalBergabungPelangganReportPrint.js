/**
 * Utility to generate and print Sales Order per Tanggal Bergabung Pelanggan report
 */

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.substring(0, 10);
  const [year, month, day] = cleanDate.split('-');
  return `${day}-${month}-${year}`;
};

export const printSOTanggalBergabungPelangganReport = (data, dateFrom, dateTo) => {
  let grandTotalBelanja = 0;
  let grandTotalDP = 0;
  let grandTotalSisa = 0;

  data.forEach(pelanggan => {
    (pelanggan.sales_orders || []).forEach(so => {
      grandTotalBelanja += parseFloat(so.total_harga || 0);
      grandTotalDP += parseFloat(so.down_payment || 0);
      grandTotalSisa += parseFloat(so.total_harga || 0) - parseFloat(so.down_payment || 0);
    });
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report SO / Tanggal Bergabung Pelanggan</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          margin: 0;
          padding: 60px 20px 20px 20px;
          background-color: #f5f5f5;
        }
        .report-page {
          background-color: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 29.7cm;
          margin: 0 auto;
          width: 25.7cm;
        }
        .toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background-color: #333;
          color: white;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 10px;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .toolbar-title {
          font-family: sans-serif;
          font-size: 14px;
          font-weight: bold;
          margin-right: auto;
        }
        .btn {
          padding: 6px 15px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-family: sans-serif;
          font-size: 12px;
          transition: background 0.2s;
        }
        .btn-print { background-color: #2563eb; color: white; }
        .btn-print:hover { background-color: #1d4ed8; }
        .btn-close { background-color: #ef4444; color: white; }
        .btn-close:hover { background-color: #dc2626; }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h2 {
          margin: 0 0 5px 0;
          font-size: 16px;
        }
        .header p {
          margin: 5px 0;
          font-size: 11px;
        }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .report-table th {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 6px 4px;
          text-align: left;
          font-weight: bold;
        }
        .report-table td {
          padding: 6px 4px;
          vertical-align: top;
        }
        .border-bottom {
          border-bottom: 1px dashed #eee;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .total-row td {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          font-weight: bold;
          padding: 8px 4px;
        }
        
        @media print {
          body {
            background-color: white;
            padding: 0;
            margin: 0;
          }
          .report-page {
            box-shadow: none;
            padding: 0;
            width: 100%;
          }
          .toolbar {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span class="toolbar-title">Preview Laporan SO per Tanggal Bergabung Pelanggan</span>
        <button class="btn btn-print" onclick="window.print()">Print</button>
        <button class="btn btn-close" onclick="window.close()">Tutup</button>
      </div>
      
      <div class="report-page">
        <div class="header">
          <h2>LAPORAN SALES ORDER PER TANGGAL BERGABUNG PELANGGAN</h2>
          <p>Periode Bergabung: ${formatDate(dateFrom)} s/d ${formatDate(dateTo)}</p>
          <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        
        <table class="report-table">
          <thead>
            <tr>
              <th width="3%" class="text-center">No</th>
              <th width="22%">Pelanggan</th>
              <th width="12%" class="text-center">Tgl Bergabung</th>
              <th width="12%">No. SO</th>
              <th width="10%" class="text-center">Tgl SO</th>
              <th width="13%" class="text-right">Total SO</th>
              <th width="13%" class="text-right">Uang Muka</th>
              <th width="13%" class="text-right">Sisa Bayar</th>
              <th width="10%" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
  `;

  let index = 1;
  data.forEach((pelanggan) => {
    const orders = pelanggan.sales_orders || [];
    const dateJoined = pelanggan.tanggal_bergabung ? formatDate(pelanggan.tanggal_bergabung.substring(0, 10)) : '-';
    const pelangganInfo = `${pelanggan.kode_pelanggan ? `[${pelanggan.kode_pelanggan}] ` : ''}${pelanggan.nama_pelanggan}`;

    if (orders.length === 0) {
      html += `
        <tr class="border-bottom">
          <td class="text-center">${index++}</td>
          <td>${pelangganInfo}</td>
          <td class="text-center">${dateJoined}</td>
          <td colspan="6" class="text-center" style="color: #666; font-style: italic;">Belum ada transaksi Sales Order</td>
        </tr>
      `;
    } else {
      orders.forEach((so, soIdx) => {
        const sisaBayar = parseFloat(so.total_harga || 0) - parseFloat(so.down_payment || 0);
        html += `
          <tr class="border-bottom">
            <td class="text-center">${soIdx === 0 ? index++ : ''}</td>
            <td>${soIdx === 0 ? pelangganInfo : ''}</td>
            <td class="text-center">${soIdx === 0 ? dateJoined : ''}</td>
            <td>${so.nomor_so}</td>
            <td class="text-center">${formatDate(so.tanggal_so)}</td>
            <td class="text-right">${formatCurrency(so.total_harga)}</td>
            <td class="text-right">${formatCurrency(so.down_payment)}</td>
            <td class="text-right">${formatCurrency(sisaBayar)}</td>
            <td class="text-center">${so.status}</td>
          </tr>
        `;
      });
    }
  });

  html += `
            <tr class="total-row">
              <td colspan="5" class="text-right">GRAND TOTAL:</td>
              <td class="text-right">${formatCurrency(grandTotalBelanja)}</td>
              <td class="text-right">${formatCurrency(grandTotalDP)}</td>
              <td class="text-right">${formatCurrency(grandTotalSisa)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};
