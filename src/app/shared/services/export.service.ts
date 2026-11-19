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
   * Export data to PDF and trigger browser download
   */
  exportToPdf(data: Record<string, unknown>[], columns: ExportColumn[], title: string, fileName: string): void {
    if (!data.length) {
      console.warn('No data to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Title
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text(title, 14, 15);

    // Subtitle with date
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const dateStr = new Date().toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Exported: ${dateStr}`, 14, 22);

    // Table
    const headers = columns.map(c => c.header);
    const body = data.map(row =>
      columns.map(col => {
        const val = row[col.key];
        return val == null ? '' : String(val);
      })
    );

    autoTable(doc, {
      head: [headers],
      body,
      startY: 28,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 255],
      },
      columnStyles: Object.fromEntries(
        columns.map((col, i) => [i, { cellWidth: col.width || 'auto' }])
      ),
      margin: { top: 28, left: 14, right: 14 },
    });

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
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
