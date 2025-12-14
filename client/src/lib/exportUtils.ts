import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
}

interface ExportData {
  [key: string]: any;
}

/**
 * Export data to PDF format
 */
export function exportToPDF(
  data: ExportData[],
  columns: ExportColumn[],
  title: string,
  filename: string
) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generert: ${new Date().toLocaleDateString('no-NO')}`, 14, 22);
  
  // Prepare table data
  const tableHeaders = columns.map(col => col.header);
  const tableData = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      // Format dates
      if (value instanceof Date) {
        return value.toLocaleDateString('no-NO');
      }
      // Format numbers
      if (typeof value === 'number') {
        return value.toFixed(2);
      }
      return value?.toString() || '';
    })
  );
  
  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 28,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  // Save PDF
  doc.save(`${filename}.pdf`);
}

/**
 * Export data to Excel format
 */
export function exportToExcel(
  data: ExportData[],
  columns: ExportColumn[],
  title: string,
  filename: string
) {
  // Prepare worksheet data
  const worksheetData = data.map(row => {
    const formattedRow: any = {};
    columns.forEach(col => {
      const value = row[col.key];
      // Format dates
      if (value instanceof Date) {
        formattedRow[col.header] = value.toLocaleDateString('no-NO');
      }
      // Format numbers
      else if (typeof value === 'number') {
        formattedRow[col.header] = parseFloat(value.toFixed(2));
      }
      else {
        formattedRow[col.header] = value?.toString() || '';
      }
    });
    return formattedRow;
  });
  
  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title);
  
  // Auto-size columns
  const maxWidths: number[] = [];
  columns.forEach((col, i) => {
    const headerLength = col.header.length;
    const dataLengths = worksheetData.map(row => 
      (row[col.header]?.toString() || '').length
    );
    maxWidths[i] = Math.max(headerLength, ...dataLengths) + 2;
  });
  
  worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w, 50) }));
  
  // Save Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Format hours for display (ensure positive)
 */
export function formatHours(hours: number | string): string {
  const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
  return Math.abs(numHours).toFixed(2);
}

/**
 * Format hours as "X timer Y minutter" for better readability
 */
export function formatDuration(hours: number | string): string {
  const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
  const absHours = Math.abs(numHours);
  
  const wholeHours = Math.floor(absHours);
  const minutes = Math.round((absHours - wholeHours) * 60);
  
  if (wholeHours === 0 && minutes === 0) {
    return "0 minutter";
  }
  
  if (wholeHours === 0) {
    return `${minutes} minutt${minutes !== 1 ? 'er' : ''}`;
  }
  
  if (minutes === 0) {
    return `${wholeHours} time${wholeHours !== 1 ? 'r' : ''}`;
  }
  
  return `${wholeHours} time${wholeHours !== 1 ? 'r' : ''} ${minutes} minutt${minutes !== 1 ? 'er' : ''}`;
}
