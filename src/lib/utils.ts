import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility for DZD
export function formatCurrency(amount: number, locale: string = 'fr-DZ') {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'DZD' 
  }).format(amount);
}

// Date formatting utility
export function formatDate(date: Date | string, locale: string = 'fr-FR') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}

// Generate barcode
export function generateBarcode() {
  return Math.random().toString().slice(2, 15);
}

// Generate invoice number
export function generateInvoiceNumber(type: 'sale' | 'purchase') {
  const prefix = type === 'sale' ? 'FAC' : 'ACH';
  const number = Math.floor(Math.random() * 9999) + 1;
  return `${prefix}-${number.toString().padStart(4, '0')}`;
}

// Export to CSV utility
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Generate PDF receipt (simplified)
export function generateReceipt(invoiceData: any, format: '80mm' | 'A4' = '80mm') {
  // This would integrate with a PDF library like jsPDF
  // For now, we'll create a printable HTML structure
  const receiptWindow = window.open('', '_blank');
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reçu - ${invoiceData.id}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          ${format === '80mm' ? 'width: 80mm; margin: 0; padding: 10px;' : 'max-width: 210mm; margin: 20px auto; padding: 20px;'}
          font-size: ${format === '80mm' ? '12px' : '14px'};
        }
        .header { text-align: center; margin-bottom: 20px; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>KHACHIRI AUTO PIÈCES</h2>
        <p>Reçu N° ${invoiceData.id}</p>
        <p>${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      <div class="items">
        ${invoiceData.items.map((item: any) => `
          <div class="item">
            <span>${item.productName} x${item.quantity}</span>
            <span>${formatCurrency(item.total)}</span>
          </div>
        `).join('')}
      </div>
      <div class="total">
        <div class="item">
          <span>Total</span>
          <span>${formatCurrency(invoiceData.total)}</span>
        </div>
      </div>
    </body>
    </html>
  `;
  
  receiptWindow?.document.write(receiptHTML);
  receiptWindow?.document.close();
  receiptWindow?.print();
}