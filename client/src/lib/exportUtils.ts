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

interface ExportMetadata {
  filters?: {
    period?: string;
    employee?: string;
    dateRange?: string;
  };
  totals?: Array<{
    employeeName: string;
    totalHours: number;
    totalShifts: number;
  }>;
}

/**
 * Export data to PDF format
 */
export function exportToPDF(
  data: ExportData[],
  columns: ExportColumn[],
  title: string,
  filename: string,
  metadata?: ExportMetadata
) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Add generation date
  doc.setFontSize(10);
  let currentY = 22;
  doc.text(`Generert: ${new Date().toLocaleDateString('no-NO')}`, 14, currentY);
  currentY += 7;
  
  // Add filters if provided
  if (metadata?.filters) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    if (metadata.filters.period) {
      doc.text(`Periode: ${metadata.filters.period}`, 14, currentY);
      currentY += 5;
    }
    if (metadata.filters.dateRange) {
      doc.text(`Datoer: ${metadata.filters.dateRange}`, 14, currentY);
      currentY += 5;
    }
    if (metadata.filters.employee) {
      doc.text(`Ansatt: ${metadata.filters.employee}`, 14, currentY);
      currentY += 5;
    }
    doc.setTextColor(0);
    currentY += 3;
  }
  
  // Add employee totals if provided
  if (metadata?.totals && metadata.totals.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Total timer per ansatt:', 14, currentY);
    currentY += 6;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    metadata.totals.forEach((total) => {
      const text = `${total.employeeName}: ${total.totalHours.toFixed(2)} timer (${total.totalShifts} skift)`;
      doc.text(text, 20, currentY);
      currentY += 5;
    });
    currentY += 3;
  }
  
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
    startY: currentY,
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
  filename: string,
  metadata?: ExportMetadata
) {
  // Prepare header rows with metadata
  const headerRows: any[] = [];
  
  // Add title
  headerRows.push([title]);
  headerRows.push([`Generert: ${new Date().toLocaleDateString('no-NO')}`]);
  headerRows.push([]); // Empty row
  
  // Add filters if provided
  if (metadata?.filters) {
    if (metadata.filters.period) {
      headerRows.push([`Periode: ${metadata.filters.period}`]);
    }
    if (metadata.filters.dateRange) {
      headerRows.push([`Datoer: ${metadata.filters.dateRange}`]);
    }
    if (metadata.filters.employee) {
      headerRows.push([`Ansatt: ${metadata.filters.employee}`]);
    }
    headerRows.push([]); // Empty row
  }
  
  // Add employee totals if provided
  if (metadata?.totals && metadata.totals.length > 0) {
    headerRows.push(['Total timer per ansatt:']);
    metadata.totals.forEach((total) => {
      headerRows.push([`${total.employeeName}: ${total.totalHours.toFixed(2)} timer (${total.totalShifts} skift)`]);
    });
    headerRows.push([]); // Empty row
  }
  
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
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(headerRows);
  
  // Append data table
  XLSX.utils.sheet_add_json(worksheet, worksheetData, {
    origin: -1, // Append after existing content
    skipHeader: false,
  });
  
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
