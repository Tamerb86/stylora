import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface PrintSettings {
  printerType: "thermal_80mm" | "a4";
  fontSize: "small" | "medium" | "large";
  showLogo: boolean;
  customFooterText: string;
  orgNumber?: string;
  bankAccount?: string;
  website?: string;
  businessHours?: string;
}

export interface ReceiptData {
  orderId: number;
  orderDate: Date;
  salonName: string;
  salonAddress?: string;
  salonPhone?: string;
  salonEmail?: string;
  salonLogoUrl?: string;
  receiptLogoUrl?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  vatRate: number; // e.g., 0.25 for 25%
  vatAmount: number;
  total: number;
  paymentMethod: "cash" | "card";
  employeeName?: string;
  customerName?: string;
  printSettings?: PrintSettings;
}

/**
 * Get font size based on print settings
 */
function getFontSize(base: number, setting: "small" | "medium" | "large"): number {
  const multipliers = { small: 0.8, medium: 1.0, large: 1.2 };
  return Math.round(base * multipliers[setting]);
}

/**
 * Generate a PDF receipt and return it as a Buffer
 */
export async function generateReceipt(data: ReceiptData): Promise<Buffer> {
  // Use default print settings if not provided
  const printSettings: PrintSettings = data.printSettings || {
    printerType: "thermal_80mm",
    fontSize: "medium",
    showLogo: true,
    customFooterText: "Takk for besøket! Velkommen tilbake!",
  };
  
  // Configure PDF based on printer type
  const isThermal = printSettings.printerType === "thermal_80mm";
  const pageWidth = isThermal ? 226.77 : 595.28; // 80mm = 226.77pt, A4 = 595.28pt
  const pageHeight = isThermal ? 3000 : 841.89; // Long thermal paper vs A4
  const margins = isThermal 
    ? { top: 10, bottom: 10, left: 10, right: 10 } // Minimal margins for thermal
    : { top: 50, bottom: 50, left: 50, right: 50 }; // Standard margins for A4
  
  // Calculate content width
  const contentWidth = pageWidth - margins.left - margins.right;
  const leftMargin = margins.left;
  const rightMargin = pageWidth - margins.right;
  
  // Load logo image if available
  let logoBuffer: Buffer | null = null;
  if (printSettings.showLogo && data.receiptLogoUrl) {
    try {
      const response = await fetch(data.receiptLogoUrl);
      if (response.ok) {
        logoBuffer = Buffer.from(await response.arrayBuffer());
      }
    } catch (error) {
      console.error("Failed to load receipt logo:", error);
    }
  }
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margins,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Set default font to bold for all text
    doc.font("Helvetica-Bold");

    // Header with salon branding (always at top)
    doc
      .fontSize(getFontSize(isThermal ? 16 : 24, printSettings.fontSize))
      .fillColor("#3B82F6")
      .text(data.salonName, leftMargin, doc.y, { 
        width: contentWidth,
        align: "center" 
      });

    doc.moveDown(0.3);

    // Logo (if enabled and loaded) - placed AFTER salon name
    if (logoBuffer) {
      try {
        // Calculate logo size (max width 50% of content width, max height 50pt)
        const maxLogoWidth = contentWidth * 0.5;
        const maxLogoHeight = isThermal ? 35 : 50;
        
        // Center the logo
        const logoX = leftMargin + (contentWidth - maxLogoWidth) / 2;
        
        doc.image(logoBuffer, logoX, doc.y, {
          fit: [maxLogoWidth, maxLogoHeight],
          align: "center",
        });
        
        doc.moveDown(0.3);
      } catch (error) {
        // If logo fails to render, continue without it
        console.error("Failed to render receipt logo:", error);
      }
    }

    doc.moveDown(0.5);

    if (data.salonAddress || data.salonPhone || data.salonEmail) {
      doc.fontSize(getFontSize(isThermal ? 8 : 10, printSettings.fontSize)).fillColor("#6B7280");
      if (data.salonAddress) {
        doc.text(data.salonAddress, leftMargin, doc.y, { 
          width: contentWidth,
          align: "center" 
        });
      }
      if (data.salonPhone) {
        doc.text(`Tlf: ${data.salonPhone}`, leftMargin, doc.y, { 
          width: contentWidth,
          align: "center" 
        });
      }
      if (data.salonEmail) {
        doc.text(`E-post: ${data.salonEmail}`, leftMargin, doc.y, { 
          width: contentWidth,
          align: "center" 
        });
      }
    }

    doc.moveDown(1);

    // Divider line
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(leftMargin, doc.y)
      .lineTo(rightMargin, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Receipt title
    doc
      .fontSize(getFontSize(isThermal ? 12 : 18, printSettings.fontSize))
      .fillColor("#111827")
      .text("KVITTERING", leftMargin, doc.y, { 
        width: contentWidth,
        align: "center" 
      });

    doc.moveDown(0.5);

    // Order details
    doc.fontSize(getFontSize(isThermal ? 7 : 10, printSettings.fontSize)).fillColor("#6B7280");
    doc.text(`Ordre-ID: #${data.orderId}`, leftMargin, doc.y, { width: contentWidth });
    doc.text(
      `Dato: ${data.orderDate.toLocaleDateString("no-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      leftMargin,
      doc.y,
      { width: contentWidth }
    );

    if (data.employeeName) {
      doc.text(`Betjent av: ${data.employeeName}`, leftMargin, doc.y, { width: contentWidth });
    }

    if (data.customerName) {
      doc.text(`Kunde: ${data.customerName}`, leftMargin, doc.y, { width: contentWidth });
    }

    doc.moveDown(1);

    // Divider line
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(leftMargin, doc.y)
      .lineTo(rightMargin, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Items - simplified layout for thermal printer
    doc.fontSize(getFontSize(isThermal ? 7 : 10, printSettings.fontSize)).fillColor("#111827");
    doc.text("Vare/Tjeneste", leftMargin, doc.y, { width: contentWidth });
    doc.moveDown(0.3);

    // Items
    doc.fillColor("#374151");

    data.items.forEach((item) => {
      const itemY = doc.y;
      
      // Item name and quantity
      doc.text(`${item.name} x${item.quantity}`, leftMargin, itemY, { 
        width: contentWidth * 0.6,
        continued: false 
      });
      
      // Item total (right-aligned)
      doc.text(`${item.total.toFixed(2)} kr`, leftMargin, itemY, {
        width: contentWidth,
        align: "right",
      });

      doc.moveDown(0.5);
    });

    doc.moveDown(0.3);

    // Divider line
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(leftMargin, doc.y)
      .lineTo(rightMargin, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Totals
    doc.fontSize(getFontSize(isThermal ? 7 : 10, printSettings.fontSize)).fillColor("#6B7280");
    
    // Subtotal
    const subtotalY = doc.y;
    doc.text("Subtotal:", leftMargin, subtotalY, { width: contentWidth * 0.5, continued: false });
    doc.text(`${data.subtotal.toFixed(2)} kr`, leftMargin, subtotalY, {
      width: contentWidth,
      align: "right",
    });
    doc.moveDown(0.5);

    // VAT
    const vatY = doc.y;
    doc.text(`MVA (${(data.vatRate * 100).toFixed(0)}%):`, leftMargin, vatY, {
      width: contentWidth * 0.5,
      continued: false,
    });
    doc.text(`${data.vatAmount.toFixed(2)} kr`, leftMargin, vatY, {
      width: contentWidth,
      align: "right",
    });
    doc.moveDown(0.8);

    // Total
    doc.fontSize(getFontSize(isThermal ? 9 : 12, printSettings.fontSize)).fillColor("#111827");
    const totalY = doc.y;
    doc.text("TOTAL:", leftMargin, totalY, { width: contentWidth * 0.5, continued: false });
    doc.text(`${data.total.toFixed(2)} kr`, leftMargin, totalY, {
      width: contentWidth,
      align: "right",
    });

    doc.moveDown(1);

    // Payment method
    doc.fontSize(getFontSize(isThermal ? 7 : 10, printSettings.fontSize)).fillColor("#6B7280");
    const paymentMethodText =
      data.paymentMethod === "cash" ? "Kontant" : "Kort";
    doc.text(`Betalt med: ${paymentMethodText}`, leftMargin, doc.y, { 
      width: contentWidth,
      align: "center" 
    });

    doc.moveDown(1.5);

    // Footer divider
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(leftMargin, doc.y)
      .lineTo(rightMargin, doc.y)
      .stroke();

    doc.moveDown(0.8);

    // Custom footer text
    doc
      .fontSize(getFontSize(isThermal ? 7 : 9, printSettings.fontSize))
      .fillColor("#9CA3AF")
      .text(printSettings.customFooterText, leftMargin, doc.y, { 
        width: contentWidth,
        align: "center" 
      });

    // Business information (if provided)
    const hasBusinessInfo = printSettings.orgNumber || printSettings.bankAccount || 
                           printSettings.website || printSettings.businessHours;
    
    if (hasBusinessInfo) {
      doc.moveDown(1);
      
      doc
        .fontSize(getFontSize(isThermal ? 6 : 8, printSettings.fontSize))
        .fillColor("#9CA3AF");

      if (printSettings.orgNumber) {
        doc.text(`Org.nr: ${printSettings.orgNumber}`, leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      }

      if (printSettings.bankAccount) {
        doc.text(`Konto: ${printSettings.bankAccount}`, leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      }

      if (printSettings.website) {
        doc.text(printSettings.website, leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      }

      if (printSettings.businessHours) {
        doc.text(printSettings.businessHours, leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      }
    }

    doc.moveDown(2);

    // Finalize the PDF
    doc.end();
  });
}
