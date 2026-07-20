import { LOGO_BASE64 } from './logoConstants';

// Utility functions for generating print content

export const generatePodPrintContent = (podData) => {
  const itemsHtml = podData.invoice_pod_items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.nama_item}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.item_barang_group || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.unit?.toLowerCase() === 'dimensi' ? 'Dimensi (dalam pcs)' : (item.unit || '-')}</td>
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
        .info-label { font-weight: bold; min-width: 160px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">SURAT JALAN</div>
        </div>
      </div>
      
      <div class="info-section" style="display: flex; justify-content: space-between;">
        <div style="width: 48%;">
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
        </div>
        <div style="width: 48%;">
          <div class="info-row">
            <span class="info-label">Nama Customer</span>
            <span class="info-value">${podData.nama_customer}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cetak Pertama</span>
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
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nama Item</th>
            <th>Master Barang</th>
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

export const generatePurchaseOrderPrintContent = (purchaseOrderData) => {
  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return String(value);
    }
  };

  const itemsHtml = (purchaseOrderData.items || []).map((item, index) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">
        ${item.bentuk_barang || '-'} ${item.jenis_barang || ''}
        <div style="font-size: 11px; color: #555; margin-top: 2px;">
          Grade: ${item.grade_barang || '-'}
        </div>
      </td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.dimensi || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty || 0}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.satuan || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.berat ? `${item.berat} kg` : '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.harga_display || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.diskon_display || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.total_display || '-'}</td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="9" style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #777;">
        Tidak ada item
      </td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Order - ${purchaseOrderData.nomor_po || ''}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 24px; position: relative; min-height: 80px; padding-top: 8px; }
        .logo { width: 70px; height: auto; margin-right: 16px; object-fit: contain; }
        .qr-code-container { position: absolute; right: 50px; top: 8px; }
        .qr-code-container canvas { border: 2px solid #4CAF50; border-radius: 4px; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 8px; }
        .company-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; line-height: 1.2; }
        .company-address { font-size: 11px; color: #555; }
        .document-title { font-size: 16px; font-weight: bold; margin-top: 12px; }
        .info-section { margin-bottom: 16px; display: flex; justify-content: space-between; }
        .info-column { width: 48%; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; min-width: 110px; }
        .info-value { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
        td { border: 1px solid #ddd; padding: 6px; font-size: 11px; vertical-align: top; }
        .footer { margin-top: 20px; text-align: right; font-size: 11px; color: #666; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="company-address"></div>
          <div class="document-title">PURCHASE ORDER</div>
        </div>
        <div class="qr-code-container">
          <div id="qrcode"></div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-column">
          <div class="info-row">
            <span class="info-label">Nomor PO</span>
            <span class="info-value">${purchaseOrderData.nomor_po || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal PO</span>
            <span class="info-value">${formatDate(purchaseOrderData.tanggal_po)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value">${purchaseOrderData.status || '-'}</span>
          </div>
        </div>
        <div class="info-column">
          <div class="info-row">
            <span class="info-label">Supplier</span>
            <span class="info-value">${purchaseOrderData.supplier_name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Telepon</span>
            <span class="info-value">${purchaseOrderData.supplier_phone || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Alamat</span>
            <span class="info-value">${purchaseOrderData.supplier_address || '-'}</span>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Item</th>
            <th style="width: 120px; text-align: center;">Dimensi</th>
            <th style="width: 70px; text-align: center;">Qty</th>
            <th style="width: 70px; text-align: center;">Satuan</th>
            <th style="width: 80px; text-align: right;">Berat (kg)</th>
            <th style="width: 110px; text-align: right;">Harga</th>
            <th style="width: 70px; text-align: right;">Diskon</th>
            <th style="width: 120px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${purchaseOrderData.subtotal !== undefined ? `
      <div style="margin-top: 20px;">
        <table style="width: 50%; margin-left: auto; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 6px; font-weight: bold; font-size: 11px;">Subtotal:</td>
              <td style="padding: 6px; text-align: right; font-size: 11px;">Rp ${parseFloat(purchaseOrderData.subtotal || 0).toLocaleString('id-ID')}</td>
            </tr>
            ${purchaseOrderData.total_discount > 0 ? `
            <tr>
              <td style="padding: 6px; font-weight: bold; font-size: 11px;">Total Diskon:</td>
              <td style="padding: 6px; text-align: right; font-size: 11px;">- Rp ${parseFloat(purchaseOrderData.total_discount || 0).toLocaleString('id-ID')}</td>
            </tr>
            ` : ''}
            ${purchaseOrderData.ppn > 0 ? `
            <tr>
              <td style="padding: 6px; font-weight: bold; font-size: 11px;">PPN (11%):</td>
              <td style="padding: 6px; text-align: right; font-size: 11px;">Rp ${parseFloat(purchaseOrderData.ppn || 0).toLocaleString('id-ID')}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 8px; font-weight: bold; font-size: 13px;">Grand Total:</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 13px;">Rp ${parseFloat(purchaseOrderData.grand_total || 0).toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        Dicetak pada: ${new Date().toLocaleString('id-ID')}
      </div>

      <script>
        // Generate QR code when page loads
        window.addEventListener('load', function() {
          const poNumber = '${purchaseOrderData.nomor_po || 'N/A'}';
          if (poNumber && poNumber !== 'N/A') {
            new QRCode(document.getElementById('qrcode'), {
              text: poNumber,
              width: 75,
              height: 75,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H
            });
          }
        });
      </script>
    </body>
    </html>
  `;
};

export const generateInvoicePrintContent = (invoiceData) => {
  const itemsHtml = invoiceData.invoice_pod_items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.nama_item}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.item_barang_group || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.unit?.toLowerCase() === 'dimensi' ? 'Dimensi (dalam pcs)' : (item.unit || '-')}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.dimensi_potong}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${(item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'kilogram') ? `${item.total_kg} kg` : '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${parseFloat(item.harga_per_unit).toLocaleString('id-ID')}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rp ${parseFloat(item.total_harga).toLocaleString('id-ID')}</td>
    </tr>
  `).join('');

  const formatCurrency = (amount) => {
    const num = parseFloat(amount).toFixed(2);
    return `Rp ${num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
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
        .info-label { font-weight: bold; min-width: 140px; }
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
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">INVOICE</div>
        </div>
      </div>
      
      <div class="info-section" style="display: flex; justify-content: space-between;">
        <div style="width: 48%;">
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
        </div>
        <div style="width: 48%;">
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
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nama Item</th>
            <th>Master Barang</th>
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
      <td style="border: 1px solid #ddd; padding: 4px;">${item.nama_item || item.jenis_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${item.bentuk_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${item.grade_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${item.master_item || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${item.dimensi_potong || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${item.jenis_potongan?.toLowerCase() === 'utuh' ? 'Utuh' : (item.jenis_potongan?.toLowerCase() === 'potongan' ? 'Potong' : (item.jenis_potongan || '-'))}</td>
      <td style="border: 1px solid #ddd; padding: 4px;">${item.unit?.toLowerCase() === 'dimensi' || item.unit?.toLowerCase() === 'pcs' ? 'Pcs' : (item.unit?.toLowerCase() === 'kilogram' || item.unit?.toLowerCase() === 'kg' ? 'Kg' : (item.unit || '-'))}</td>
      <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${item.qty || 0}</td>
      <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${(item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'kilogram') ? `${item.total_kg || 0} kg` : '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${(item.unit?.toLowerCase() === 'kg' || item.unit?.toLowerCase() === 'kilogram') ? `${((item.qty || 0) * (item.total_kg || 0)).toFixed(2)} kg` : '-'}</td>
      <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">Rp ${parseFloat(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
      <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">Rp ${parseFloat(item.total_harga || 0).toLocaleString('id-ID')}</td>
    </tr>
  `).join('') || '<tr><td colspan="12" style="text-align: center; padding: 20px;">Tidak ada item</td></tr>';

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0).toFixed(2);
    return `Rp ${num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
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
        body { font-family: Arial, sans-serif; margin: 10px; font-size: 11px; }
        .header { display: flex; align-items: center; margin-bottom: 10px; position: relative; min-height: 40px; }
        .logo { width: 45px; height: auto; margin-right: 15px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; line-height: 1.2; }
        .document-title { font-size: 13px; font-weight: bold; margin-bottom: 0; line-height: 1.2; }
        .info-section { margin-bottom: 8px; }
        .info-row { display: flex; margin-bottom: 2px; }
        .info-label { font-weight: bold; min-width: 120px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 5px; text-align: left; font-size: 10px; }
        td { border: 1px solid #ddd; padding: 4px; font-size: 10px; }
        .summary-section { margin-top: 8px; }
        .summary-table { width: 50%; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .summary-label { font-weight: bold; }
        .summary-value { text-align: right; }
        .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 12px; }
        .footer { margin-top: 10px; text-align: center; font-size: 10px; color: #666; }
        .customer-section { margin-bottom: 0; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; }
        .customer-title { font-weight: bold; margin-bottom: 5px; font-size: 11px; }
        @page {
          size: A5 landscape;
          margin: 10mm 5mm 5mm 5mm;
          @top-right {
            content: counter(page) " dari " counter(pages);
            font-size: 9px;
            font-family: Arial, sans-serif;
            color: #333;
          }
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">SALES ORDER</div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 20px;">
        <div class="info-section" style="width: 48%; margin-bottom: 0;">
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

        <div style="width: 48%;">
          ${salesOrderData.customer ? `
          <div class="customer-section" style="margin-bottom: 0; padding: 10px 15px; height: 100%; box-sizing: border-box;">
            <div class="customer-title" style="margin-bottom: 6px;">Informasi Customer</div>
            <div class="info-row">
              <span class="info-label">Nama Customer</span>
              <span class="info-value">${salesOrderData.customer.nama_customer || salesOrderData.customer.nama_pelanggan || salesOrderData.customer.nama || salesOrderData.customer.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Alamat</span>
              <span class="info-value">${salesOrderData.customer.alamat || salesOrderData.customer.address || salesOrderData.customer.kota || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Telepon</span>
              <span class="info-value">${salesOrderData.customer.telepon || salesOrderData.customer.telepon_hp || salesOrderData.customer.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Person</span>
              <span class="info-value">${salesOrderData.customer.contact_person || salesOrderData.customer.contactPerson || salesOrderData.customer.pic || salesOrderData.customer.cp || 'N/A'}</span>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Jenis Barang</th>
            <th>Bentuk</th>
            <th>Grade</th>
            <th>Master Item Barang (Utuh)</th>
            <th>Dimensi Potong</th>
            <th>Status</th>
            <th>Unit</th>
            <th>Qty</th>
            <th>Berat Satuan</th>
            <th>Berat Total</th>
            <th>Harga per Unit</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="summary-section" style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 8px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; width: 45%; margin-top: 5px;">
          <div style="width: 48%; text-align: center;">
            <p style="margin-bottom: 40px; margin-top: 0;">Tanda Tangan Customer,</p>
            <p>( _______________________ )</p>
          </div>
          <div style="width: 48%; text-align: center;">
            <p style="margin-bottom: 40px; margin-top: 0;">Hormat Kami,</p>
            <p>( _______________________ )</p>
          </div>
        </div>

        <table class="summary-table" style="width: 50%; margin-left: auto; margin-top: 0;">
          <tbody>
            <tr>
              <td class="summary-label">Total Harga:</td>
              <td class="summary-value">${formatCurrency(salesOrderData.total_harga || salesOrderData.total_amount)}</td>
            </tr>
            ${salesOrderData.diskon_so_amount ? `
            <tr>
              <td class="summary-label">Diskon SO ${salesOrderData.diskon_so_type === 'percent' ? `(${salesOrderData.diskon_so_value}%)` : '(Nominal)'}:</td>
              <td class="summary-value">- ${formatCurrency(salesOrderData.diskon_so_amount)}</td>
            </tr>
            ` : (salesOrderData.diskon_so_percent || salesOrderData.diskon_so ? `
            <tr>
              <td class="summary-label">Diskon SO (${salesOrderData.diskon_so_percent || salesOrderData.diskon_so || 0}%):</td>
              <td class="summary-value">- ${formatCurrency(salesOrderData.diskon_so_amount || 0)}</td>
            </tr>
            ` : '')}
            ${(salesOrderData.discount && salesOrderData.discount !== salesOrderData.diskon_so_amount) ? `
            <tr>
              <td class="summary-label">Total Discount:</td>
              <td class="summary-value">- ${formatCurrency(salesOrderData.discount)}</td>
            </tr>
            ` : ''}
            ${salesOrderData.price_includes_ppn && salesOrderData.dpp ? `
            <tr>
              <td class="summary-label">DPP (Dasar Pengenaan Pajak):</td>
              <td class="summary-value">${formatCurrency(salesOrderData.dpp)}</td>
            </tr>
            ` : ''}
            ${salesOrderData.ppn ? `
            <tr>
              <td class="summary-label">PPN (11%)${salesOrderData.price_includes_ppn ? ' (sudah termasuk)' : ''}:</td>
              <td class="summary-value">${formatCurrency(salesOrderData.ppn)}</td>
            </tr>
            ` : ''}
            <tr class="grand-total">
              <td class="summary-label">Grand Total:</td>
              <td class="summary-value">${formatCurrency(salesOrderData.grand_total || salesOrderData.total_amount)}</td>
            </tr>
            ${salesOrderData.down_payment ? `
            <tr>
              <td class="summary-label">Down Payment (DP):</td>
              <td class="summary-value">${formatCurrency(salesOrderData.down_payment)}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd; font-weight: bold;">
              <td class="summary-label">Sisa Pembayaran:</td>
              <td class="summary-value">${formatCurrency((salesOrderData.grand_total || salesOrderData.total_amount) - salesOrderData.down_payment)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')} | Sales Order - PT. Surya Harsa Nagara</p>
      </div>
    </body>
    </html>
  `;
};

// Generate printable HTML for Work Order Actual (WO Actual)
export const generateWOActualPrintContent = (woActualData, options = {}) => {
  const includeImages = options.includeImages !== false;
  const hideCustomer = options.hideCustomer === true;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  };

  const itemsHtml = (woActualData.items || []).map((item, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.jenisBarang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.bentukBarang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.gradeBarang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.dimensi || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.qtyPlanning ?? 0}</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.qtyActual ?? 0}</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.beratActual ?? 0} kg</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.jenisPotongan || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${(item.pelaksanas || []).map(p => {
    const name = p.pelaksana?.nama_pelaksana || p.nama_pelaksana || p.nama || '-';
    const qty = p.qty || p.quantity || 0;
    const berat = p.berat || p.weight || 0;
    return `${name} (${qty} Pcs, ${berat} kg)`;
  }).join(', ')}</td>
    </tr>
  `).join('') || '<tr><td colspan="10" style="text-align: center; padding: 12px;">Tidak ada item</td></tr>';

  // Render Parent image section (WO Actual header photo) before Before/After
  const parentSectionHtml = (() => {
    const imgs = Array.isArray(woActualData.parentImages) ? woActualData.parentImages : [];
    if (!imgs.length) return '';
    const tiles = imgs.map((img, idx) => {
      const src = img.canvas_image_base64 || img.image_base64 || img.image_url || img.src || img.url || '';
      return `
        <div style="page-break-inside: avoid;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Parent #${idx + 1}</div>
          <div style="border: 1px solid #ddd; background-color: #fafafa; padding: 8px; text-align: center;">
            ${src ? `
              <img src="${src}" alt="Parent #${idx + 1}" style="max-width: 100%; max-height: 280px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div style="display: none; padding: 12px; color: #666; font-style: italic;">Gambar tidak dapat dimuat</div>
            ` : `
              <div style="padding: 12px; color: #666; font-style: italic;">Gambar tidak tersedia</div>
            `}
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="section" style="margin-top: 16px;">
        <div style="font-weight: bold; margin-bottom: 8px;">Foto Bukti WO Actual</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${tiles}
        </div>
      </div>
    `;
  })();

  // Render Before/After/Sisa images per item (Planning vs Actual) using mapped arrays
  const beforeAfterSectionHtml = includeImages && (woActualData.items || []).length > 0
    ? (() => {
      const itemSections = (woActualData.items || []).map((item, idx) => {
        const it = { ...item, no: idx + 1 };
        const beforeImages = Array.isArray(it.beforeImages) ? it.beforeImages : [];
        const afterImages = Array.isArray(it.afterImages) ? it.afterImages : [];
        const sisaImages = Array.isArray(it.sisaImages) ? it.sisaImages : [];

        const maxRows = Math.max(beforeImages.length, afterImages.length, sisaImages.length);

        let rowsHtml = '';
        if (maxRows === 0) {
          rowsHtml = `<div style="padding: 16px; color: #666; font-style: italic; text-align: center;">Tidak ada gambar Before maupun After</div>`;
        } else {
          for (let i = 0; i < maxRows; i++) {
            const beforeImg = beforeImages[i];
            const afterImg = afterImages[i];
            const sisaImg = sisaImages[i];

            const renderImgTile = (img, label, idx) => {
              if (!img) return '<div style="height: 100%;"></div>'; // Empty placeholder

              const src = img.canvas_image_base64 || img.image_base64 || img.image_url || img.src || img.url || '';
              return `
                    <div style="margin-bottom: 10px; height: 100%;">
                      <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${label} #${idx + 1}</div>
                      <div style="border: 1px solid #ddd; background-color: #fafafa; padding: 8px; text-align: center; height: 280px; display: flex; align-items: center; justify-content: center;">
                        ${src ? `
                          <img src="${src}" alt="${label} #${idx + 1}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                          <div style="display: none; padding: 12px; color: #666; font-style: italic;">Gambar tidak dapat dimuat</div>
                        ` : `
                          <div style="padding: 12px; color: #666; font-style: italic;">Gambar tidak tersedia</div>
                        `}
                      </div>
                    </div>
                  `;
            };

            rowsHtml += `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; page-break-inside: avoid;">
                  <div>
                    ${i === 0 ? '<div style="font-weight: bold; margin-bottom: 6px;">Before (WO Planning)</div>' : ''}
                    ${renderImgTile(beforeImg, 'Before', i)}
                  </div>
                  <div>
                    ${i === 0 ? '<div style="font-weight: bold; margin-bottom: 6px;">After (WO Actual)</div>' : ''}
                    ${renderImgTile(afterImg, 'After', i)}
                  </div>
                  <div>
                    ${i === 0 ? '<div style="font-weight: bold; margin-bottom: 6px;">Sisa Barang</div>' : ''}
                    ${renderImgTile(sisaImg, 'Sisa', i)}
                  </div>
                </div>
              `;
          }
        }

        return `
            <div class="section" style="margin-top: 16px; page-break-inside: avoid;">
              <div style="font-weight: bold; margin-bottom: 8px;">Item ${it.no || '-'}</div>
              ${rowsHtml}
            </div>
          `;
      }).join('');

      return `
          <div class="section" style="margin-top: 16px;">
            <div style="font-weight: bold; margin-bottom: 8px;">Foto Before/After per Item</div>
            ${itemSections}
          </div>
        `;
    })()
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WO Actual - ${woActualData.workOrderPlanning?.nomor_wo || 'N/A'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 20px; position: relative; min-height: 80px; padding-top: 10px; }
        .logo { width: 70px; height: auto; margin-right: 16px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 10px; }
        .company-name { font-size: 22px; font-weight: bold; margin-bottom: 6px; line-height: 1.2; }
        .document-title { font-size: 16px; font-weight: bold; margin-bottom: 14px; line-height: 1.2; }
        .section { margin-bottom: 16px; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; min-width: 140px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">WORK ORDER ACTUAL</div>
        </div>
      </div>

      <div class="section" style="display: flex; justify-content: space-between;">
        <div style="width: 48%;">
          <div class="info-row"><span class="info-label">Nomor WO</span><span class="info-value">${woActualData.workOrderPlanning?.nomor_wo || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Tanggal WO</span><span class="info-value">${formatDate(woActualData.workOrderPlanning?.tanggal_wo)}</span></div>
          <div class="info-row"><span class="info-label">Tanggal Actual</span><span class="info-value">${formatDate(woActualData.woActual?.tanggal_actual || woActualData.woActual?.created_at || new Date().toISOString())}</span></div>
        </div>
        <div style="width: 48%;">
          <div class="info-row"><span class="info-label">Prioritas</span><span class="info-value">${woActualData.workOrderPlanning?.prioritas || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Status WO</span><span class="info-value">${woActualData.workOrderPlanning?.status || 'N/A'}</span></div>
        </div>
      </div>

      ${((woActualData.customer && !hideCustomer) || woActualData.warehouse) ? `
      <div class="section" style="padding: 12px; border: 1px solid #ddd; background-color: #fafafa;">
        ${(woActualData.customer && !hideCustomer) ? `
        <div class="info-row"><span class="info-label">Pelanggan</span><span class="info-value">${woActualData.customer?.nama_pelanggan || woActualData.customer?.nama || 'N/A'}</span></div>
        ` : ''}
        ${woActualData.warehouse ? `
        <div class="info-row"><span class="info-label">Gudang</span><span class="info-value">${woActualData.warehouse?.nama_gudang || woActualData.warehouse?.nama || 'N/A'}</span></div>
        ` : ''}
      </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Jenis</th>
            <th>Bentuk</th>
            <th>Grade</th>
            <th>Dimensi</th>
            <th>Qty Planning</th>
            <th>Qty Actual</th>
            <th>Berat Actual</th>
            <th>Status</th>
            <th>Pelaksana</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${parentSectionHtml}

      ${beforeAfterSectionHtml}

      <div class="footer">
        <p>Dokumen ini di-print pada: ${new Date().toLocaleString('id-ID')}</p>
        <p>Work Order Actual - PT. Surya Harsa Nagara</p>
      </div>
    </body>
    </html>
  `;
};

// Generate printable HTML for Work Order Planning (WO Planning)
export const generateWOPlanningPrintContent = (woPlanningData, options = {}) => {
  const includeImages = options.includeImages !== false;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  };

  const itemsHtml = (woPlanningData.items || []).map((item, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.jenisBarang?.nama_jenis_barang || item.jenisBarang?.nama || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.bentukBarang?.nama_bentuk_barang || item.bentukBarang?.nama_bentuk || item.bentukBarang?.nama || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.gradeBarang?.nama_grade_barang || item.gradeBarang?.nama_grade || item.gradeBarang?.nama || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.groupBarangName || item.item_barang_group_name || item.item_barang_group?.nama_group_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.bentukBarang?.dimensi || item.dimensi || `${Math.round(parseFloat(item.panjang) || 0)}x${Math.round(parseFloat(item.lebar) || 0)}x${Math.round(parseFloat(item.ketebalan || item.tebal) || 0)}`}</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.qtyPlanning ?? item.qty ?? 0}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.jenisPotongan || item.jenis_potongan || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${item.keterangan || item.catatan || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="9" style="text-align: center; padding: 12px;">Tidak ada item</td></tr>';

  // Render canvas images with robust item-based grouping and naming
  const canvasImagesHtml = includeImages && (woPlanningData.canvasImages || []).length > 0
    ? (() => {
      // Build map from item IDs to index and display name
      const itemsArr = woPlanningData.items || [];
      const itemMap = new Map();
      itemsArr.forEach((item, index) => {
        const name = item.nama_item || item.jenisBarang?.nama_jenis_barang || item.jenisBarang?.nama || `Item ${index + 1}`;
        const idCandidates = [
          item.wo_item_unique_id,
          item.id,
          item.wo_item_id,
          // Removed item.item_id to prevent ambiguous mapping when multiple WO items share the same inventory item
        ].filter(Boolean);

        // Use Set to ensure unique string keys
        const uniqueIds = [...new Set(idCandidates.map(String))];

        // Detect if item is 1D (Shaft/As)
        const bentukName = (item.bentukBarang?.nama_bentuk_barang || item.bentukBarang?.nama_bentuk || item.bentukBarang?.nama || '').toLowerCase();
        const is1D = bentukName.includes('as') || bentukName.includes('shaft') || bentukName.includes('round bar') || bentukName.includes('1d');

        uniqueIds.forEach(id => {
          if (!itemMap.has(id)) {
            itemMap.set(id, { index: index + 1, name, is1D });
          }
        });
      });

      const groupedMap = new Map();
      let unknownCounter = 1;
      const unknownStartIndex = itemsArr.length + 1;

      (woPlanningData.canvasImages || []).forEach((img, idx) => {
        const idCandidates = [
          img.wo_item_id, // Prioritize explicit WO Item link
          img.work_order_planning_item_id,
          img.wo_plan_item_id,
          img.wo_item_unique_id,
          img.item_id
        ].filter(Boolean);

        let key = null;
        let info = null;

        // Try to match with any candidate ID
        for (const id of idCandidates) {
          const found = itemMap.get(String(id));
          if (found) { key = String(id); info = found; break; }
        }

        if (!key) {
          key = `unknown_${unknownCounter}`;
          info = { index: unknownStartIndex + unknownCounter - 1, name: `Item ${unknownStartIndex + unknownCounter - 1}` };
          unknownCounter++;
        }

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            itemNumber: info.index,
            itemName: info.name,
            is1D: info.is1D,
            images: []
          });
        }
        groupedMap.get(key).images.push({ ...img, originalIndex: idx });
      });

      // Sort sections by item number (ascending) for consistent ordering
      const sections = Array.from(groupedMap.values())
        .sort((a, b) => a.itemNumber - b.itemNumber)
        .map(group => {
          const items = group.images.map((image, imageIndex) => {
            const src = image.canvas_image_base64 || image.image_base64 || image.image_url || image.src || '';
            return `
                <div style="page-break-inside: avoid;">
                  <div style="font-weight: bold; margin-bottom: 6px; font-size: 12px; color: #555;">WO Item ${group.itemNumber} - Image ${imageIndex + 1}</div>
                  <div style="text-align: center; border: 1px solid #ddd; background-color: #f9f9f9; overflow: hidden; ${group.is1D ? 'height: 100px; display: flex; align-items: flex-start;' : 'padding: 8px;'}">
                    ${src ? `
                      <img src="${src}" alt="WO Item ${group.itemNumber} - Image ${imageIndex + 1}" style="${group.is1D ? 'width: 100%; height: auto; object-fit: cover; object-position: top;' : 'max-width: 100%; max-height: 260px; object-fit: contain;'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <div style="display: none; padding: 16px; color: #666; font-style: italic;">Gambar tidak dapat dimuat</div>
                    ` : `
                      <div style="padding: 16px; color: #666; font-style: italic;">Canvas image tidak tersedia</div>
                    `}
                  </div>
                  ${image.quantity || image.dimensi || image.wo_item_id ? `
                  <div style="margin-top: 6px; font-size: 11px; color: #666;">
                    ${image.quantity ? `Quantity: ${image.quantity}` : ''}
                    ${image.dimensi ? ` | Dimensi: ${image.dimensi}` : ''}
                    ${image.wo_item_id ? ` | WO Item ID: ${image.wo_item_id}` : ''}
                  </div>
                  ` : ''}
                </div>
              `;
          }).join('');

          return `
              <div style="margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 8px;">Canvas Layout - Item ${group.itemNumber}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  ${items}
                </div>
              </div>
            `;
        }).join('');

      return `
          <div class="section" style="margin-top: 16px;">
            ${sections}
          </div>
        `;
    })()
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WO Planning - ${woPlanningData.nomor_wo || 'N/A'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 20px; position: relative; min-height: 80px; padding-top: 10px; }
        .logo { width: 70px; height: auto; margin-right: 16px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 10px; }
        .company-name { font-size: 22px; font-weight: bold; margin-bottom: 6px; line-height: 1.2; }
        .document-title { font-size: 16px; font-weight: bold; margin-bottom: 14px; line-height: 1.2; }
        .section { margin-bottom: 16px; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; min-width: 140px; }
        .info-value { margin-left: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">WORK ORDER PLANNING</div>
        </div>
      </div>

      <div class="section" style="display: flex; justify-content: space-between;">
        <div style="width: 48%;">
          <div class="info-row"><span class="info-label">Nomor WO</span><span class="info-value">${woPlanningData.nomor_wo || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Tanggal WO</span><span class="info-value">${formatDate(woPlanningData.tanggal_wo)}</span></div>
          <div class="info-row"><span class="info-label">Tanggal Target</span><span class="info-value">${formatDate(woPlanningData.due_date || woPlanningData.tanggal_target)}</span></div>
        </div>
        <div style="width: 48%;">
          <div class="info-row"><span class="info-label">Prioritas</span><span class="info-value">${woPlanningData.priority || woPlanningData.prioritas || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-value">${woPlanningData.status || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Metode Handover</span><span class="info-value">${woPlanningData.assigned_to || woPlanningData.handover_method || 'N/A'}</span></div>
        </div>
      </div>

      ${((woPlanningData.customer && !options.hideCustomerName) || woPlanningData.warehouse) ? `
      <div class="section" style="padding: 12px; border: 1px solid #ddd; background-color: #fafafa;">
        ${(woPlanningData.customer && !options.hideCustomerName) ? `
        <div class="info-row"><span class="info-label">Pelanggan</span><span class="info-value">${woPlanningData.customer?.nama_pelanggan || woPlanningData.customer?.nama || '-'}</span></div>
        ` : ''}
        ${woPlanningData.warehouse ? `
        <div class="info-row"><span class="info-label">Gudang</span><span class="info-value">${woPlanningData.warehouse?.nama_gudang || woPlanningData.warehouse?.nama || '-'}</span></div>
        ` : ''}
      </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Jenis</th>
            <th>Bentuk</th>
            <th>Grade</th>
            <th>Group Barang</th>
            <th>Dimensi</th>
            <th>Qty Planning</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${canvasImagesHtml}

      <div class="footer">
        <p>Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        <p>Work Order Planning - PT. Surya Harsa Nagara</p>
      </div>
    </body>
    </html>
  `;
};

// Generate printable HTML for Payment Receipt (Kwitansi)
export const generatePaymentReceiptPrintContent = (receiptData) => {
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0).toFixed(2);
    return `Rp ${num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  };

  // Convert number to Indonesian terbilang (spelled out)
  const terbilang = (angka) => {
    if (angka === 0) return 'nol';

    const bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    const convert = (num) => {
      if (num < 12) {
        return bilangan[num];
      } else if (num < 20) {
        return convert(num - 10) + ' belas';
      } else if (num < 100) {
        const puluhan = Math.floor(num / 10);
        const satuan = num % 10;
        return (puluhan === 1 ? 'se' : bilangan[puluhan]) + ' puluh' + (satuan > 0 ? ' ' + convert(satuan) : '');
      } else if (num < 200) {
        return 'seratus' + (num % 100 > 0 ? ' ' + convert(num % 100) : '');
      } else if (num < 1000) {
        const ratusan = Math.floor(num / 100);
        return bilangan[ratusan] + ' ratus' + (num % 100 > 0 ? ' ' + convert(num % 100) : '');
      } else if (num < 2000) {
        return 'seribu' + (num % 1000 > 0 ? ' ' + convert(num % 1000) : '');
      } else if (num < 1000000) {
        const ribuan = Math.floor(num / 1000);
        return convert(ribuan) + ' ribu' + (num % 1000 > 0 ? ' ' + convert(num % 1000) : '');
      } else if (num < 1000000000) {
        const jutaan = Math.floor(num / 1000000);
        return convert(jutaan) + ' juta' + (num % 1000000 > 0 ? ' ' + convert(num % 1000000) : '');
      } else if (num < 1000000000000) {
        const milyaran = Math.floor(num / 1000000000);
        return convert(milyaran) + ' milyar' + (num % 1000000000 > 0 ? ' ' + convert(num % 1000000000) : '');
      } else {
        const triliunan = Math.floor(num / 1000000000000);
        return convert(triliunan) + ' triliun' + (num % 1000000000000 > 0 ? ' ' + convert(num % 1000000000000) : '');
      }
    };

    // Handle decimal numbers (for rupiah, we usually round to nearest integer)
    const num = Math.round(parseFloat(angka) || 0);
    return convert(num) + ' rupiah';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return '-';
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  };

  const payment = receiptData.payment || {};
  const receipt = receiptData.receipt || {};
  const invoice = receiptData.invoice || {};
  const customer = receiptData.customer || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kwitansi - ${receipt.nomor_receipt || 'N/A'}</title>
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
        .payment-section { background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; }
        .payment-amount { font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
        .terbilang { text-align: center; font-style: italic; color: #555; margin-top: 10px; margin-bottom: 10px; }
        .summary-section { margin-top: 20px; }
        .summary-table { width: 50%; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .summary-label { font-weight: bold; }
        .summary-value { text-align: right; }
        .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">KWITANSI PEMBAYARAN</div>
        </div>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Nomor Kwitansi</span>
          <span class="info-value">${receipt.nomor_receipt || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Generate</span>
          <span class="info-value">${formatDate(receipt.tanggal_generate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor Invoice</span>
          <span class="info-value">${invoice.nomor_invoice || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Invoice</span>
          <span class="info-value">${formatDate(invoice.tanggal_cetak_invoice)}</span>
        </div>
      </div>

      <div class="payment-section">
        <div style="text-align: center; margin-bottom: 10px;">
          <strong>PEMBAYARAN</strong>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Pembayaran</span>
          <span class="info-value">${formatDateOnly(payment.tanggal_payment)}</span>
        </div>
        <div class="payment-amount">
          ${formatCurrency(payment.jumlah_payment)}
        </div>
        <div class="terbilang">
          Terbilang: <strong>${terbilang(payment.jumlah_payment)}</strong>
        </div>
        ${payment.catatan ? `
        <div class="info-row">
          <span class="info-label">Catatan</span>
          <span class="info-value">${payment.catatan}</span>
        </div>
        ` : ''}
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Nama Pelanggan</span>
          <span class="info-value">${customer.nama_pelanggan || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metode Handover</span>
          <span class="info-value">${invoice.handover_method || '-'}</span>
        </div>
      </div>

      <div class="summary-section">
        <table class="summary-table">
          <tbody>
            <tr>
              <td class="summary-label">Grand Total Invoice:</td>
              <td class="summary-value">${formatCurrency(invoice.grand_total)}</td>
            </tr>
            <tr>
              <td class="summary-label">Uang Muka:</td>
              <td class="summary-value">${formatCurrency(invoice.uang_muka)}</td>
            </tr>
            <tr>
              <td class="summary-label">Jumlah Pembayaran:</td>
              <td class="summary-value">${formatCurrency(payment.jumlah_payment)}</td>
            </tr>
            <tr class="grand-total">
              <td class="summary-label">Sisa Bayar:</td>
              <td class="summary-value">${formatCurrency(invoice.sisa_bayar)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            <div>Penerima,</div>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <div>PT. SURYA HARSA NAGARA</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    </body>
    </html>
  `;
};

// Utility function to open print dialog
export const openPrintDialog = (printContent) => {
  if (window.electronAPI && window.electronAPI.print) {
    const isQR = printContent.includes('Sticker QR') || printContent.includes('create-qr-code');
    const docTitleMatch = printContent.match(/<title>(.*?)<\/title>/);
    const title = docTitleMatch ? docTitleMatch[1] : 'document';
    window.electronAPI.print({
      html: printContent,
      landscape: !isQR,
      pageSize: isQR ? { width: 100000, height: 100000 } : 'A5',
      title: title
    });
    return;
  }

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

export const generateItemRequestPrintContent = (req, title = "BUKTI KONVERSI") => {
  const safe = (v) => (v ?? "-");
  const isSuratJalan = title.toUpperCase().includes("SURAT JALAN");
  const signatureHtml = isSuratJalan ? `
    <div style="margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid;">
      <div style="text-align: center; width: 30%;">
        <p style="margin-bottom: 5px; margin-top: 0; font-size: 13px;">Diterima oleh,</p>
        <p style="margin-bottom: 60px; font-weight: bold; margin-top: 0; visibility: hidden;">&nbsp;</p>
        <p>( _________________ )</p>
      </div>
      <div style="text-align: center; width: 30%;">
        <p style="margin-bottom: 5px; margin-top: 0; font-size: 13px;">Dibawa oleh,</p>
        <p style="margin-bottom: 60px; font-weight: bold; margin-top: 0;">Driver</p>
        <p>( _________________ )</p>
      </div>
      <div style="text-align: center; width: 30%;">
        <p style="margin-bottom: 5px; margin-top: 0; font-size: 13px;">Diserahkan,</p>
        <p style="margin-bottom: 60px; font-weight: bold; margin-top: 0;">Kepala Gudang</p>
        <p>( _________________ )</p>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title} - ${safe(req.nomor_request)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 24px; position: relative; min-height: 80px; }
        .logo { width: 70px; height: auto; margin-right: 16px; object-fit: contain; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 0; }
        .company-name { font-size: 20px; font-weight: bold; }
        .document-title { font-size: 16px; font-weight: bold; margin-top: 6px; }
        .info { margin-top: 16px; }
        .row { display: flex; gap: 8px; margin: 4px 0; }
        .label { min-width: 120px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #666; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="document-title">${title}</div>
        </div>
      </div>
      <div class="info" style="display: flex; justify-content: space-between;">
        <div style="width: 48%;">
          <div class="row"><div class="label">Nomor Request</div><div>${safe(req.nomor_request)}</div></div>
          <div class="row"><div class="label">Tanggal Request</div><div>${req.requested_at ? new Date(req.requested_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</div></div>
          <div class="row"><div class="label">Requestor</div><div>${safe(req.requested_by?.name || req.requestor)}</div></div>
        </div>
        <div style="width: 48%;">
          <div class="row"><div class="label">Gudang Asal</div><div>${safe(req.asal_gudang?.nama_gudang || req.gudang_asal_nama)}</div></div>
          <div class="row"><div class="label">Gudang Tujuan</div><div>${safe(req.tujuan_gudang?.nama_gudang || req.gudang_tujuan_nama)}</div></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Item Group</th>
            <th>Allocated Physical items</th>
            <th>Total Qty</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${(req.details || []).map((detail, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${safe(detail.item_name)}</td>
            <td>
              ${(detail.assigned_items || []).map(ai => `
                <div style="font-size: 11px; margin-bottom: 2px;">
                  <b>${ai.kode_barang}</b> (qty: ${ai.quantity})
                </div>
              `).join('') || '<span style="color: #999; font-style: italic;">No items allocated</span>'}
            </td>
            <td style="text-align: center;">${safe(detail.quantity)}</td>
            <td>${safe(detail.notes)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ${signatureHtml}
      <div class="footer">Dokumen ini dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
    </body>
    </html>
  `;
};

export const generateItemQRPrintContent = async (item) => {
  const payload = encodeURIComponent(
    JSON.stringify({
      id: item.id,
      kode: item.kode_barang || item.kode || '',
      nama: item.nama_item_barang || item.nama_item || '',
      bentuk: item.bentuk_barang?.nama_bentuk || item.bentuk || '',
      grade: item.grade_barang?.nama || item.grade || '',
      printed_at: new Date().toISOString(),
    })
  );
  const sizePx = 900;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${sizePx}x${sizePx}&data=${payload}`;
  let dataUrl = url;
  try {
    const resp = await fetch(url, { mode: 'cors' });
    const blob = await resp.blob();
    dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (_) { }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Sticker QR</title>
      <style>
        @page { size: 100mm 100mm; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100mm; height: 100mm; }
        body { font-family: Arial, sans-serif; color: #000; display: block; }
        .wrap { width: 100mm; height: 100mm; padding: 6mm 6mm 4mm 6mm; display: flex; flex-direction: column; gap: 2mm; }
        .qr { width: 50mm; height: 50mm; margin: 0 auto; border: 0.5pt solid #ddd; display: flex; align-items: center; justify-content: center; background: #fff; }
        .qr img { width: 100%; height: 100%; object-fit: contain; }
        .info { font-size: 8pt; line-height: 1.25; margin: 0 2mm; }
        .row { display: flex; gap: 2mm; }
        .label { font-weight: bold; }
        .value { flex: 1; word-break: break-word; }
        .footer { margin-top: auto; text-align: center; font-size: 7pt; color: #777; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="qr"><img src="${dataUrl}" alt="QR"/></div>
        <div class="info">
          ${item.kode_barang || item.kode ? `<div class="row"><div class="label">Kode</div><div class="value">${item.kode_barang || item.kode}</div></div>` : ''}
          ${item.nama_item_barang || item.nama_item ? `<div class="row"><div class="label">Nama</div><div class="value">${item.nama_item_barang || item.nama_item}</div></div>` : ''}
        </div>
        <div class="footer">SURYA LOGAM JAYA - Warehouse Management System</div>
      </div>
    </body>
    </html>
  `;
};

export const generateStockMutationPrintContent = (mutationData) => {
  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return String(value);
    }
  };

  const itemsHtml = (mutationData.items || []).map((item, index) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.barang || item.nama_barang || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.rak_asal || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.unit || item.satuan || '-'}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity || item.qty || 0}</td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="5" style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #777;">
        Tidak ada item
      </td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mutasi Stock - ${mutationData.nomor_mutasi || ''}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 24px; position: relative; min-height: 80px; padding-top: 8px; }
        .logo { width: 70px; height: auto; margin-right: 16px; object-fit: contain; }
        .qr-code-container { position: absolute; right: 50px; top: 8px; }
        .qr-code-container canvas { border: 2px solid #4CAF50; border-radius: 4px; }
        .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 8px; }
        .company-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; line-height: 1.2; }
        .company-address { font-size: 11px; color: #555; }
        .document-title { font-size: 16px; font-weight: bold; margin-top: 12px; }
        .info-section { margin-bottom: 16px; display: flex; justify-content: space-between; }
        .info-column { width: 48%; }
        .info-row { display: flex; margin-bottom: 4px; }
        .info-label { font-weight: bold; min-width: 110px; }
        .info-value { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
        td { border: 1px solid #ddd; padding: 6px; font-size: 11px; vertical-align: top; }
        .footer { margin-top: 20px; text-align: right; font-size: 11px; color: #666; }
        @page {
          size: A5 landscape;
          margin: 10mm;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
        <div class="header-content">
          <div class="company-name">PT. SURYA HARSA NAGARA</div>
          <div class="company-address"></div>
          <div class="document-title">MUTASI STOCK</div>
        </div>
        <div class="qr-code-container">
          <div id="qrcode"></div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-column">
          <div class="info-row">
            <span class="info-label">Nomor Mutasi</span>
            <span class="info-value">${mutationData.nomor_mutasi || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal Mutasi</span>
            <span class="info-value">${formatDate(mutationData.tanggal_mutasi || new Date())}</span>
          </div>
        </div>
        <div class="info-column">
          <div class="info-row">
            <span class="info-label">Gudang Asal</span>
            <span class="info-value">${mutationData.gudang_asal || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gudang Tujuan</span>
            <span class="info-value">${mutationData.gudang_tujuan || '-'}</span>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Item Barang</th>
            <th>Rak Asal</th>
            <th style="width: 100px; text-align: center;">Satuan</th>
            <th style="width: 80px; text-align: center;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="footer">
        Dicetak pada: ${new Date().toLocaleString('id-ID')}
      </div>

      <script>
        // Generate QR code when page loads
        window.addEventListener('load', function() {
          const mutasiNumber = '${mutationData.nomor_mutasi || 'N/A'}';
          if (mutasiNumber && mutasiNumber !== 'N/A') {
            new QRCode(document.getElementById('qrcode'), {
              text: mutasiNumber,
              width: 75,
              height: 75,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H
            });
          }
        });
      </script>
    </body>
    </html>
  `;
};
