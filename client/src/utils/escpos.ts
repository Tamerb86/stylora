/**
 * ESC/POS Command Generator for Thermal Printers
 * Generates ESC/POS commands for 80mm thermal printers
 */

import { ReceiptData } from "@/contexts/ThermalPrinterContext";

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;

export class ESCPOSBuilder {
  private commands: number[] = [];
  private encoder = new TextEncoder();

  // Initialize printer
  init(): this {
    this.commands.push(ESC, 0x40);
    return this;
  }

  // Text alignment
  alignLeft(): this {
    this.commands.push(ESC, 0x61, 0x00);
    return this;
  }

  alignCenter(): this {
    this.commands.push(ESC, 0x61, 0x01);
    return this;
  }

  alignRight(): this {
    this.commands.push(ESC, 0x61, 0x02);
    return this;
  }

  // Text formatting
  bold(enable: boolean = true): this {
    this.commands.push(ESC, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  underline(enable: boolean = true): this {
    this.commands.push(ESC, 0x2d, enable ? 0x01 : 0x00);
    return this;
  }

  // Text size (0 = normal, 1 = double width, 2 = double height, 3 = double both)
  textSize(width: number, height: number): this {
    const size = ((width & 0x07) << 4) | (height & 0x07);
    this.commands.push(GS, 0x21, size);
    return this;
  }

  doubleWidth(): this {
    return this.textSize(1, 0);
  }

  doubleHeight(): this {
    return this.textSize(0, 1);
  }

  doubleSize(): this {
    return this.textSize(1, 1);
  }

  normalSize(): this {
    return this.textSize(0, 0);
  }

  // Print text
  text(str: string): this {
    const bytes = this.encoder.encode(str);
    this.commands.push(...Array.from(bytes));
    return this;
  }

  // Print line (text + newline)
  line(str: string = ""): this {
    return this.text(str + "\n");
  }

  // Feed lines
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.commands.push(0x0a); // Line feed
    }
    return this;
  }

  // Horizontal rule
  hr(char: string = "-", width: number = 32): this {
    return this.line(char.repeat(width));
  }

  // Cut paper
  cut(mode: "full" | "partial" = "full"): this {
    this.commands.push(GS, 0x56, mode === "full" ? 0x00 : 0x01);
    return this;
  }

  // Open cash drawer (if connected)
  openDrawer(): this {
    this.commands.push(ESC, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  // Build final command array
  build(): Uint8Array {
    return new Uint8Array(this.commands);
  }
}

/**
 * Generate ESC/POS commands for a receipt
 */
export function generateReceiptESCPOS(data: ReceiptData): Uint8Array {
  const builder = new ESCPOSBuilder();

  builder.init();

  // Header - Salon name
  if (data.salonName) {
    builder
      .alignCenter()
      .doubleSize()
      .bold()
      .line(data.salonName)
      .normalSize()
      .bold(false);
  }

  // Salon details
  if (data.salonAddress) {
    builder.alignCenter().line(data.salonAddress);
  }
  if (data.salonPhone) {
    builder.alignCenter().line(`Tel: ${data.salonPhone}`);
  }

  builder.feed(1).hr("=").feed(1);

  // Receipt info
  builder
    .alignLeft()
    .bold()
    .line(`KVITTERING #${data.orderId}`)
    .bold(false)
    .line(`Dato: ${data.date}  Tid: ${data.time}`)
    .line(`Betaling: ${data.paymentMethod}`)
    .feed(1)
    .hr();

  // Items
  builder.bold().line("VARER/TJENESTER").bold(false).hr("-");

  data.items.forEach((item) => {
    // Item name
    builder.line(item.name);

    // Quantity x Price = Total
    const qtyPrice = `${item.quantity} x ${item.unitPrice.toFixed(2)} kr`;
    const total = `${item.total.toFixed(2)} kr`;
    const spacing = " ".repeat(Math.max(1, 32 - qtyPrice.length - total.length));
    builder.line(`  ${qtyPrice}${spacing}${total}`);
  });

  builder.hr();

  // Totals
  const formatLine = (label: string, amount: number) => {
    const amountStr = `${amount.toFixed(2)} kr`;
    const spacing = " ".repeat(Math.max(1, 32 - label.length - amountStr.length));
    return `${label}${spacing}${amountStr}`;
  };

  builder
    .line(formatLine("Subtotal:", data.subtotal))
    .line(formatLine("MVA (25%):", data.vat))
    .hr("=")
    .bold()
    .doubleHeight()
    .line(formatLine("TOTAL:", data.total))
    .normalSize()
    .bold(false)
    .hr("=");

  // Footer
  if (data.footerText) {
    builder.feed(1).alignCenter().line(data.footerText);
  }

  builder
    .feed(1)
    .alignCenter()
    .line("Takk for besøket!")
    .line("Velkommen tilbake!")
    .feed(3)
    .cut();

  return builder.build();
}

/**
 * Generate test receipt ESC/POS
 */
export function generateTestReceiptESCPOS(salonName: string = "Stylora"): Uint8Array {
  const builder = new ESCPOSBuilder();

  builder
    .init()
    .alignCenter()
    .doubleSize()
    .bold()
    .line(salonName)
    .normalSize()
    .bold(false)
    .feed(1)
    .hr("=")
    .feed(1)
    .line("TEST UTSKRIFT")
    .line("Skriveren fungerer!")
    .feed(1)
    .hr("=")
    .feed(1)
    .alignLeft()
    .line("Dato: " + new Date().toLocaleDateString("no-NO"))
    .line("Tid: " + new Date().toLocaleTimeString("no-NO"))
    .feed(3)
    .cut();

  return builder.build();
}
