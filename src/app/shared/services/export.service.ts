import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  /**
   * Format an ISO date string to the user's local timezone.
   * Returns empty string for null/undefined/non-date values.
   */
  formatLocalDate(value: unknown): string {
    if (value == null) return '';
    const str = String(value);
    // Try to parse as a date
    const date = new Date(str);
    if (isNaN(date.getTime())) return str; // not a date, return as-is
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Export data to CSV and trigger browser download
   */
  exportToCsv(data: Record<string, unknown>[], columns: ExportColumn[], fileName: string): void {
    if (!data.length) {
      console.warn('No data to export');
      return;
    }

    const headers = columns.map(c => c.header);
    const rows = data.map(row =>
      columns.map(col => {
        const val = row[col.key];
        if (val == null) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
    );

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${fileName}.csv`);
  }

  /**
   * Draw the SmartBook banner header on a PDF page.
   */
  drawBanner(doc: jsPDF, pageWidth: number): void {
    // Blue banner background
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 18, 'F');

    // SmartBook logo text
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('SmartBook', 14, 12);

    // Report title on the right side
    doc.setFontSize(10);
    doc.setTextColor(230, 235, 255);
  }

  /**
   * Draw the footer with page numbers on a PDF page.
   */
  drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, page: number, totalPages: number): void {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `SmartBook — Page ${page} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  /**
   * Export data to PDF and trigger browser download
   */
  exportToPdf(data: Record<string, unknown>[], columns: ExportColumn[], title: string, fileName: string): void {
    if (!data.length) {
      console.warn('No data to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw banner on first page
    this.drawBanner(doc, pageWidth);

    // Report title and export date below banner
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(title, 14, 26);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const dateStr = new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    doc.text(`Exported: ${dateStr}`, 14, 32);

    // Format body data — convert ISO dates to local timezone
    const headers = columns.map(c => c.header);
    const body = data.map(row =>
      columns.map(col => {
        const val = row[col.key];
        if (val == null) return '';
        // Check if the value looks like an ISO date string
        const str = String(val);
        if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
          return this.formatLocalDate(str);
        }
        return str;
      })
    );

    autoTable(doc, {
      head: [headers],
      body,
      startY: 38,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 255],
      },
      columnStyles: Object.fromEntries(
        columns.map((col, i) => [i, { cellWidth: col.width || 'auto' }])
      ),
      margin: { top: 38, left: 14, right: 14 },
      // Draw banner and footer on every page (including new pages from table)
      didDrawPage: (data: { doc: jsPDF; pageNumber: number }) => {
        const pw = data.doc.internal.pageSize.getWidth();
        const ph = data.doc.internal.pageSize.getHeight();
        // Redraw banner on every page
        this.drawBanner(data.doc, pw);
        // Redraw title on first page only
        if (data.pageNumber === 1) {
          data.doc.setFontSize(14);
          data.doc.setTextColor(30, 30, 30);
          data.doc.text(title, 14, 26);
          data.doc.setFontSize(9);
          data.doc.setTextColor(120, 120, 120);
          data.doc.text(`Exported: ${dateStr}`, 14, 32);
        }
      },
      didParseCell: () => {},
    });

    // Footer with page numbers on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      this.drawFooter(doc, pw, ph, i, pageCount);
    }

    doc.save(`${fileName}.pdf`);
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
