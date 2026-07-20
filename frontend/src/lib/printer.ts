export function printFormattedHtml(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) لفتح نافذة الطباعة');
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          text-align: right;
          padding: 40px;
          color: #1e293b;
          background: #ffffff;
        }
        .header {
          border-bottom: 2px solid #0284c7;
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          color: #0369a1;
          font-size: 20px;
        }
        .header p {
          margin: 3px 0 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .watermark {
          position: fixed;
          top: 40%;
          left: 30%;
          font-size: 60px;
          color: rgba(2, 132, 199, 0.05);
          transform: rotate(-30deg);
          pointer-events: none;
          font-weight: 900;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
        }
        .official-seal {
          border: 2px dashed #0284c7;
          padding: 10px 20px;
          border-radius: 12px;
          color: #0369a1;
          font-weight: bold;
          text-align: center;
          width: 180px;
          margin-top: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          font-size: 12px;
        }
        th {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        @media print {
          @page { margin: 20mm; }
        }
      </style>
    </head>
    <body>
      <div className="watermark">مكتـب النخبـة ERP</div>
      <div class="header">
        <div>
          <h1>مكتب النخبة للخدمات والاستشارات الحكومية والمالية</h1>
          <p>القاهرة - التجمع الخامس - شارع التسعين الشمالي | هاتف: 01000000000</p>
        </div>
        <div style="text-align: left; font-size: 11px; color: #475569;">
          <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
          <p>رقم السند/العقد: #DOC-${Math.floor(100000 + Math.random() * 900000)}</p>
        </div>
      </div>

      ${htmlContent}

      <div class="footer">
        <span>تأكيد المراجعة: موثق عبر المنظومة السحابية ERP</span>
        <span>صفحة 1 من 1</span>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(fullHtml);
  printWindow.document.close();
}
