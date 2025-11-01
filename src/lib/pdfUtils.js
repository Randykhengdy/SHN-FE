import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generatePDF(canvasElementId = "canvas") {
  const canvas = document.getElementById(canvasElementId);
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  const canvasImage = await html2canvas(canvas);
  const imgData = canvasImage.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvasImage.width, canvasImage.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvasImage.width, canvasImage.height);
  pdf.save("workshop_output.pdf");
}

// Generate Sales Order PDF
export const generateSalesOrderPDF = async (salesOrderData) => {
  try {
    // Convert logo to base64
    const logoResponse = await fetch('/src/assets/logo.png');
    const logoBlob = await logoResponse.blob();
    const logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(logoBlob);
    });

    // Create an isolated iframe to avoid CSS conflicts
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    await new Promise(resolve => {
      iframe.onload = resolve;
      iframe.src = 'about:blank';
    });
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    // Write clean HTML with inline styles only
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #000000; 
            background-color: #ffffff;
            padding: 20px;
          }
          .container { max-width: 800px; background-color: #ffffff; color: #000000; }
          .header { display: flex; align-items: flex-start; margin-bottom: 30px; position: relative; min-height: 100px; padding-top: 10px; }
          .logo { width: 80px; height: auto; margin-right: 20px; object-fit: contain; }
          .header-content { position: absolute; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; top: 10px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; line-height: 1.2; color: #000000; }
          .document-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; line-height: 1.2; color: #000000; }
          .info-section { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; min-width: 200px; }
          .info-value { margin-left: 1px; }

          .items-section { margin-bottom: 25px; }
          .items-section h3 { margin: 0 0 15px 0; font-size: 16px; color: #333333; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #dddddd; background-color: #ffffff; }
          th { border: 1px solid #dddddd; padding: 10px; text-align: left; font-weight: bold; color: #000000; background-color: #f5f5f5; }
          td { border: 1px solid #dddddd; padding: 8px; color: #000000; background-color: #ffffff; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .summary { margin-top: 20px; }
          .summary-table { width: 50%; margin-left: auto; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .summary-label { font-weight: bold; }
          .summary-value { text-align: right; }
          .grand-total { border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666666; }
        </style>
      </head>
      <body>
        <div class="container">
           <!-- Header -->
           <div class="header">
             <img src="${logoBase64}" alt="PT. SHN Logo" class="logo" />
             <div class="header-content">
               <div class="company-name">PT. SURYA HARSA NAGARA</div>
               <div class="document-title">SALES ORDER</div>
             </div>
           </div>

          <!-- Sales Order Info -->
           <div class="info-section">
             ${salesOrderData.nomor_so ? `
             <div class="info-row">
               <span class="info-label">Nomor SO:</span>
               <span class="info-value">${salesOrderData.nomor_so}</span>
             </div>` : ''}
             ${salesOrderData.tanggal_so ? `
             <div class="info-row">
               <span class="info-label">Tanggal SO:</span>
               <span class="info-value">${salesOrderData.tanggal_so}</span>
             </div>` : ''}
             ${salesOrderData.tanggal_pengiriman ? `
             <div class="info-row">
               <span class="info-label">Tanggal Pengiriman:</span>
               <span class="info-value">${salesOrderData.tanggal_pengiriman}</span>
             </div>` : ''}
             ${salesOrderData.term_of_payment ? `
             <div class="info-row">
               <span class="info-label">Term of Payment:</span>
               <span class="info-value">${salesOrderData.term_of_payment}</span>
             </div>` : ''}
             ${salesOrderData.gudang_asal ? `
             <div class="info-row">
               <span class="info-label">Gudang Asal:</span>
               <span class="info-value">${salesOrderData.gudang_asal}</span>
             </div>` : ''}
             ${salesOrderData.customer?.nama ? `
             <div class="info-row">
               <span class="info-label">Nama Customer:</span>
               <span class="info-value">${salesOrderData.customer.nama}</span>
             </div>` : ''}
           </div>

          <!-- Items Table -->
          <div class="items-section">
            <h3>Detail Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Bentuk</th>
                  <th class="text-center">Grade</th>
                  <th class="text-center">Dimensi</th>
                  <th class="text-center">Qty</th>
                  <th class="text-center">Total Kg</th>
                  <th class="text-right">Harga/Unit</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${salesOrderData.items?.map(item => `
                  <tr>
                    <td>${item.nama_item || '-'}</td>
                    <td class="text-center">${item.bentuk_barang?.nama_bentuk || '-'}</td>
                    <td class="text-center">${item.grade_barang || '-'}</td>
                    <td class="text-center">${item.bentuk_barang?.dimensi || '-'}</td>
                    <td class="text-center">${item.qty || 0}</td>
                    <td class="text-center">${item.total_kg || 0}</td>
                    <td class="text-right">Rp ${(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
                    <td class="text-right">Rp ${(item.total_harga || 0).toLocaleString('id-ID')}</td>
                  </tr>
                `).join('') || '<tr><td colspan="8" class="text-center">Tidak ada item</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div class="summary">
            <div class="summary-table">
              ${salesOrderData.total_harga ? `
              <div class="summary-row">
                <span class="summary-label">Subtotal:</span>
                <span class="summary-value">Rp ${Number(salesOrderData.total_harga).toLocaleString('id-ID')}</span>
              </div>` : ''}
              ${salesOrderData.discount ? `
              <div class="summary-row">
                <span class="summary-label">Discount:</span>
                <span class="summary-value">Rp ${Number(salesOrderData.discount).toLocaleString('id-ID')}</span>
              </div>` : ''}
              ${salesOrderData.ppn ? `
              <div class="summary-row">
                <span class="summary-label">PPN (11%):</span>
                <span class="summary-value">Rp ${Number(salesOrderData.ppn).toLocaleString('id-ID')}</span>
              </div>` : ''}
              ${salesOrderData.grand_total ? `
              <div class="summary-row grand-total">
                <span class="summary-label">Grand Total:</span>
                <span class="summary-value">Rp ${Number(salesOrderData.grand_total).toLocaleString('id-ID')}</span>
              </div>` : ''}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Dokumen ini dibuat pada ${new Date().toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert iframe content to canvas
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: false,
      foreignObjectRendering: false
    });

    // Remove iframe
    document.body.removeChild(iframe);

    // Create PDF
    const imgData = canvas.toDataURL('image/png', 0.9);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF with proper async handling
    const fileName = `Sales_Order_${salesOrderData.nomor_so || 'Draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create a promise to handle the save completion
    return new Promise((resolve, reject) => {
      try {
        pdf.save(fileName);
        
        // Wait a bit to ensure the download has started
        setTimeout(() => {
          console.log('✅ PDF generated successfully:', fileName);
          resolve(true);
        }, 1000);
      } catch (error) {
        console.error('❌ Error saving PDF:', error);
        reject(error);
      }
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

// Generate Work Order PDF
export const generateWorkOrderPDF = async (workOrderData) => {
  try {
    console.log('🔄 Generating Work Order PDF...', workOrderData);

    // Convert logo to base64
    const logoResponse = await fetch('/src/assets/logo.png');
    const logoBlob = await logoResponse.blob();
    const logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(logoBlob);
    });

    // Create iframe for rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Work Order - ${workOrderData.nomor_wo || 'Draft'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000000; background-color: #ffffff; }
          .container { padding: 20px; max-width: 210mm; margin: 0 auto; background-color: #ffffff; }
          
          .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #333333; padding-bottom: 15px; }
          .logo { width: 80px; height: auto; margin-right: 20px; }
          .header-content { flex: 1; text-align: center; }
          .company-name { font-size: 24px; font-weight: bold; color: #333333; margin-bottom: 5px; }
          .document-title { font-size: 18px; font-weight: bold; color: #666666; }
          
          .info-section { margin-bottom: 25px; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: bold; width: 150px; color: #333333; }
          .info-value { margin-left: 1px; }

          .items-section { margin-bottom: 25px; }
          .items-section h3 { margin: 0 0 15px 0; font-size: 16px; color: #333333; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #dddddd; background-color: #ffffff; }
          th { border: 1px solid #dddddd; padding: 10px; text-align: left; font-weight: bold; color: #000000; background-color: #f5f5f5; }
          td { border: 1px solid #dddddd; padding: 8px; color: #000000; background-color: #ffffff; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666666; }
        </style>
      </head>
      <body>
        <div class="container">
           <!-- Header -->
           <div class="header">
             <img src="${logoBase64}" alt="PT. SHN Logo" class="logo" />
             <div class="header-content">
               <div class="company-name">PT. SURYA HARSA NAGARA</div>
               <div class="document-title">WORK ORDER</div>
             </div>
           </div>

          <!-- Work Order Info -->
           <div class="info-section">
             ${workOrderData.nomor_wo ? `
             <div class="info-row">
               <span class="info-label">Nomor WO:</span>
               <span class="info-value">${workOrderData.nomor_wo}</span>
             </div>` : ''}
             ${workOrderData.tanggal_wo ? `
             <div class="info-row">
               <span class="info-label">Tanggal WO:</span>
               <span class="info-value">${workOrderData.tanggal_wo}</span>
             </div>` : ''}
             ${workOrderData.due_date ? `
             <div class="info-row">
               <span class="info-label">Due Date:</span>
               <span class="info-value">${workOrderData.due_date}</span>
             </div>` : ''}
             ${workOrderData.priority ? `
             <div class="info-row">
               <span class="info-label">Priority:</span>
               <span class="info-value">${workOrderData.priority}</span>
             </div>` : ''}
             ${workOrderData.status ? `
             <div class="info-row">
               <span class="info-label">Status:</span>
               <span class="info-value">${workOrderData.status}</span>
             </div>` : ''}
             ${workOrderData.assigned_to ? `
             <div class="info-row">
               <span class="info-label">Assigned To:</span>
               <span class="info-value">${workOrderData.assigned_to}</span>
             </div>` : ''}
           </div>

          <!-- Items Table -->
          <div class="items-section">
            <h3>Detail Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Bentuk</th>
                  <th class="text-center">Grade</th>
                  <th class="text-center">Dimensi</th>
                  <th class="text-center">Qty</th>
                  <th class="text-center">Status</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                ${workOrderData.items?.map(item => `
                  <tr>
                    <td>${item.nama_item || '-'}</td>
                    <td class="text-center">${item.bentuk_barang?.nama_bentuk || '-'}</td>
                    <td class="text-center">${item.grade_barang || '-'}</td>
                    <td class="text-center">${item.bentuk_barang?.dimensi || '-'}</td>
                    <td class="text-center">${item.qty || 0}</td>
                    <td class="text-center">${item.status || '-'}</td>
                    <td>${item.keterangan || '-'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="7" class="text-center">Tidak ada item</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Dokumen ini dibuat pada ${new Date().toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert iframe content to canvas
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: false,
      foreignObjectRendering: false
    });

    // Remove iframe
    document.body.removeChild(iframe);

    // Create PDF
    const imgData = canvas.toDataURL('image/png', 0.9);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF with proper async handling
    const fileName = `Work_Order_${workOrderData.nomor_wo || 'Draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create a promise to handle the save completion
    return new Promise((resolve, reject) => {
      try {
        pdf.save(fileName);
        
        // Wait a bit to ensure the download has started
        setTimeout(() => {
          console.log('✅ Work Order PDF generated successfully:', fileName);
          resolve(true);
        }, 1000);
      } catch (error) {
        console.error('❌ Error saving Work Order PDF:', error);
        reject(error);
      }
    });

  } catch (error) {
    console.error('❌ Error generating Work Order PDF:', error);
    throw error;
  }
};
