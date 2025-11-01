// Utility functions for generating print content

export const generatePodPrintContent = (podData) => {
  const itemsHtml = podData.invoice_pod_items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.nama_item}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.unit}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.dimensi_potong}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.total_kg} kg</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Surat Jalan - ${podData.nomor_pod}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 30px; position: relative; min-height: 100px; padding-top: 10px; }
        .logo { width: 80px; height: auto; margin-right: 20px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 10px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; line-height: 1.2; }
        .document-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; line-height: 1.2; }
        .info-section { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; min-width: 200px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/src/assets/logo.png" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">SURAT JALAN</div>
        </div>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Nomor Surat Jalan</span>
          <span class="info-value">${podData.nomor_pod}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor WO</span>
          <span class="info-value">${podData.nomor_wo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor SO</span>
          <span class="info-value">${podData.nomor_so}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Customer</span>
          <span class="info-value">${podData.nama_customer}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Cetak Pertama</span>
          <span class="info-value">${new Date(podData.tanggal_cetak_pod).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metode Handover</span>
          <span class="info-value">${podData.handover_method}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nama Item</th>
            <th>Unit</th>
            <th>Dimensi Potong</th>
            <th>Qty</th>
            <th>Total Berat</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    </body>
    </html>
  `;
};

export const generateInvoicePrintContent = (invoiceData) => {
  const itemsHtml = invoiceData.invoice_pod_items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.nama_item}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.unit}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.dimensi_potong}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.total_kg} kg</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${parseFloat(item.harga_per_unit).toLocaleString('id-ID')}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${parseFloat(item.total_harga).toLocaleString('id-ID')}</td>
    </tr>
  `).join('');

  const formatCurrency = (amount) => {
    return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoiceData.nomor_invoice}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 30px; position: relative; min-height: 100px; padding-top: 10px; }
        .logo { width: 80px; height: auto; margin-right: 20px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 10px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; line-height: 1.2; }
        .document-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; line-height: 1.2; }
        .info-section { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; min-width: 200px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .summary-section { margin-top: 20px; }
        .summary-table { width: 50%; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .summary-label { font-weight: bold; }
        .summary-value { text-align: right; }
        .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/src/assets/logo.png" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">INVOICE</div>
        </div>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Nomor Invoice</span>
          <span class="info-value">${invoiceData.nomor_invoice}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor WO</span>
          <span class="info-value">${invoiceData.nomor_wo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor SO</span>
          <span class="info-value">${invoiceData.nomor_so}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Customer</span>
          <span class="info-value">${invoiceData.nama_customer}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Cetak</span>
          <span class="info-value">${new Date(invoiceData.tanggal_cetak_invoice).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metode Handover</span>
          <span class="info-value">${invoiceData.handover_method}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nama Item</th>
            <th>Unit</th>
            <th>Dimensi Potong</th>
            <th>Qty</th>
            <th>Total Berat</th>
            <th>Harga per Unit</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-section">
        <table class="summary-table">
          <tbody>
            <tr>
              <td class="summary-label">Total Harga Invoice:</td>
              <td class="summary-value">${formatCurrency(invoiceData.total_harga_invoice)}</td>
            </tr>
            <tr>
              <td class="summary-label">Discount:</td>
              <td class="summary-value">- ${formatCurrency(invoiceData.discount_invoice)}</td>
            </tr>
            <tr>
              <td class="summary-label">Biaya Lain:</td>
              <td class="summary-value">${formatCurrency(invoiceData.biaya_lain)}</td>
            </tr>
            <tr>
              <td class="summary-label">PPN (11%):</td>
              <td class="summary-value">${formatCurrency(invoiceData.ppn_invoice)}</td>
            </tr>
            <tr class="grand-total">
              <td class="summary-label">Grand Total:</td>
              <td class="summary-value">${formatCurrency(invoiceData.grand_total)}</td>
            </tr>
            <tr>
              <td class="summary-label">Uang Muka:</td>
              <td class="summary-value">${formatCurrency(invoiceData.uang_muka)}</td>
            </tr>
            <tr>
              <td class="summary-label">Sisa Bayar:</td>
              <td class="summary-value">${formatCurrency(invoiceData.sisa_bayar)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    </body>
    </html>
  `;
};

export const generateSalesOrderPrintContent = (salesOrderData) => {
  const itemsHtml = salesOrderData.items?.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.nama_item || item.jenis_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.bentuk_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.grade_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.dimensi_potong || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.unit || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty || 0}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.total_kg || 0} kg</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${parseFloat(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${parseFloat(item.total_harga || 0).toLocaleString('id-ID')}</td>
    </tr>
  `).join('') || '<tr><td colspan="9" style="text-align: center; padding: 20px;">Tidak ada item</td></tr>';

  const formatCurrency = (amount) => {
    return `Rp ${parseFloat(amount || 0).toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Order - ${salesOrderData.nomor_so || salesOrderData.so_number || 'N/A'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 30px; position: relative; min-height: 100px; padding-top: 10px; }
        .logo { width: 80px; height: auto; margin-right: 20px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 10px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; line-height: 1.2; }
        .document-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; line-height: 1.2; }
        .info-section { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; min-width: 200px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
        td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        .summary-section { margin-top: 20px; }
        .summary-table { width: 50%; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .summary-label { font-weight: bold; }
        .summary-value { text-align: right; }
        .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .customer-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; }
        .customer-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/src/assets/logo.png" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">SALES ORDER</div>
        </div>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Nomor SO</span>
          <span class="info-value">${salesOrderData.nomor_so || salesOrderData.so_number || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal SO</span>
          <span class="info-value">${formatDate(salesOrderData.tanggal_so || salesOrderData.so_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Pengiriman</span>
          <span class="info-value">${formatDate(salesOrderData.tanggal_pengiriman || salesOrderData.delivery_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Term of Payment</span>
          <span class="info-value">${salesOrderData.term_of_payment || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Gudang Asal</span>
          <span class="info-value">${salesOrderData.gudang_asal || salesOrderData.origin_warehouse || 'N/A'}</span>
        </div>
      </div>

      ${salesOrderData.customer ? `
      <div class="customer-section">
        <div class="customer-title">Informasi Customer</div>
        <div class="info-row">
          <span class="info-label">Nama Customer</span>
          <span class="info-value">${salesOrderData.customer.nama_customer || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Alamat</span>
          <span class="info-value">${salesOrderData.customer.alamat || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telepon</span>
          <span class="info-value">${salesOrderData.customer.telepon || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${salesOrderData.customer.email || 'N/A'}</span>
        </div>
      </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Nama Item</th>
            <th>Bentuk</th>
            <th>Grade</th>
            <th>Dimensi Potong</th>
            <th>Unit</th>
            <th>Qty</th>
            <th>Total Berat</th>
            <th>Harga per Unit</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-section">
        <table class="summary-table">
          <tbody>
            <tr>
              <td class="summary-label">Total Harga:</td>
              <td class="summary-value">${formatCurrency(salesOrderData.total_harga || salesOrderData.total_amount)}</td>
            </tr>
            ${salesOrderData.discount ? `
            <tr>
              <td class="summary-label">Discount:</td>
              <td class="summary-value">- ${formatCurrency(salesOrderData.discount)}</td>
            </tr>
            ` : ''}
            ${salesOrderData.ppn ? `
            <tr>
              <td class="summary-label">PPN (11%):</td>
              <td class="summary-value">${formatCurrency(salesOrderData.ppn)}</td>
            </tr>
            ` : ''}
            <tr class="grand-total">
              <td class="summary-label">Grand Total:</td>
              <td class="summary-value">${formatCurrency(salesOrderData.grand_total || salesOrderData.total_amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        <p>Sales Order - PT. Surya Harsa Nagara</p>
      </div>
    </body>
    </html>
  `;
};

// Utility function to open print dialog
export const openPrintDialog = (printContent) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load then trigger print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};
