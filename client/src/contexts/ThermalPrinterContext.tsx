import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { generateReceiptESCPOS, generateTestReceiptESCPOS } from "@/utils/escpos";

// Type declarations for WebUSB and Web Serial API
declare global {
  interface Navigator {
    usb: USB;
    serial: Serial;
  }
}

interface USB {
  requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
}

interface USBDeviceRequestOptions {
  filters: Array<{ vendorId: number }>;
}

interface USBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  configuration: USBConfiguration | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
}

interface USBConfiguration {
  interfaces: USBInterface[];
}

interface USBInterface {
  alternate: USBAlternateInterface;
}

interface USBAlternateInterface {
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: "ok" | "stall" | "babble";
}

interface Serial {
  requestPort(): Promise<SerialPort>;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
}

interface PrinterInfo {
  type: "usb" | "serial";
  name: string;
  vendorId?: number;
  productId?: number;
}

interface ThermalPrinterContextType {
  isSupported: boolean;
  connectedPrinter: PrinterInfo | null;
  isConnecting: boolean;
  isPrinting: boolean;
  isOpeningDrawer: boolean;
  detectPrinters: () => Promise<void>;
  connectPrinter: (type: "usb" | "serial") => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  printReceipt: (receiptData: ReceiptData) => Promise<boolean>;
  testPrint: () => Promise<boolean>;
  openCashDrawer: () => Promise<boolean>;
}

export interface ReceiptData {
  orderId: number;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  vat: number;
  total: number;
  paymentMethod: string;
  salonName?: string;
  salonAddress?: string;
  salonPhone?: string;
  footerText?: string;
}

const ThermalPrinterContext = createContext<ThermalPrinterContextType | undefined>(undefined);

export function ThermalPrinterProvider({ children }: { children: ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false);
  const [device, setDevice] = useState<any>(null); // USBDevice or SerialPort

  // Check if WebUSB or Web Serial API is supported
  useEffect(() => {
    const hasUSB = "usb" in navigator;
    const hasSerial = "serial" in navigator;
    setIsSupported(hasUSB || hasSerial);

    if (!hasUSB && !hasSerial) {
      console.warn("WebUSB and Web Serial API are not supported in this browser");
    }
  }, []);

  const detectPrinters = async () => {
    // This is called when user clicks "Søk etter skriver"
    // The actual device selection happens in connectPrinter
    toast.info("Klikk 'Koble til USB' eller 'Koble til Serial' for å velge skriver");
  };

  const connectPrinter = async (type: "usb" | "serial") => {
    if (!isSupported) {
      toast.error("Nettleseren støtter ikke direkte skrivertilkobling");
      return;
    }

    setIsConnecting(true);
    try {
      if (type === "usb") {
        if (!("usb" in navigator)) {
          throw new Error("WebUSB er ikke støttet i denne nettleseren");
        }

        // Request USB device (thermal printers typically use vendor-specific class)
        const usbDevice = await (navigator as any).usb.requestDevice({
          filters: [
            // Common thermal printer vendor IDs
            { vendorId: 0x0416 }, // CUSTOM
            { vendorId: 0x04b8 }, // Epson
            { vendorId: 0x0519 }, // Star Micronics
            { vendorId: 0x154f }, // Wincor Nixdorf
            { vendorId: 0x0dd4 }, // Citizen
          ],
        });

        await usbDevice.open();
        
        // Select configuration and claim interface
        if (usbDevice.configuration === null) {
          await usbDevice.selectConfiguration(1);
        }
        await usbDevice.claimInterface(0);

        setDevice(usbDevice);
        setConnectedPrinter({
          type: "usb",
          name: usbDevice.productName || "USB Thermal Printer",
          vendorId: usbDevice.vendorId,
          productId: usbDevice.productId,
        });

        toast.success(`Tilkoblet: ${usbDevice.productName || "USB Thermal Printer"}`);
      } else if (type === "serial") {
        if (!("serial" in navigator)) {
          throw new Error("Web Serial API er ikke støttet i denne nettleseren");
        }

        // Request serial port
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 }); // Common baud rate for thermal printers

        setDevice(port);
        setConnectedPrinter({
          type: "serial",
          name: "Serial Thermal Printer",
        });

        toast.success("Tilkoblet: Serial Thermal Printer");
      }
    } catch (error: any) {
      console.error("Failed to connect printer:", error);
      if (error.name === "NotFoundError") {
        toast.error("Ingen skriver valgt");
      } else {
        toast.error(`Kunne ikke koble til skriver: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectPrinter = async () => {
    if (!device) return;

    try {
      if (connectedPrinter?.type === "usb") {
        const usbDevice = device as USBDevice;
        await usbDevice.close();
      } else if (connectedPrinter?.type === "serial") {
        const port = device as SerialPort;
        await port.close();
      }

      setDevice(null);
      setConnectedPrinter(null);
      toast.success("Skriver frakoblet");
    } catch (error: any) {
      toast.error(`Kunne ikke koble fra skriver: ${error.message}`);
    }
  };

  const sendToPrinter = async (data: Uint8Array): Promise<boolean> => {
    if (!device || !connectedPrinter) {
      throw new Error("Ingen skriver tilkoblet");
    }

    try {
      if (connectedPrinter.type === "usb") {
        const usbDevice = device as USBDevice;
        // Find OUT endpoint (typically endpoint 1 or 2)
        const endpoint = usbDevice.configuration?.interfaces[0]?.alternate?.endpoints.find(
          (ep: USBEndpoint) => ep.direction === "out"
        );

        if (!endpoint) {
          throw new Error("Kunne ikke finne OUT endpoint");
        }

        await usbDevice.transferOut(endpoint.endpointNumber, data.buffer as BufferSource);
      } else if (connectedPrinter.type === "serial") {
        const port = device as SerialPort;
        const writer = port.writable?.getWriter();
        if (!writer) {
          throw new Error("Kunne ikke få writer fra serial port");
        }

        await writer.write(data);
        writer.releaseLock();
      }

      return true;
    } catch (error: any) {
      console.error("Failed to send to printer:", error);
      throw error;
    }
  };

  const printReceipt = async (receiptData: ReceiptData): Promise<boolean> => {
    if (!device || !connectedPrinter) {
      toast.error("Ingen skriver tilkoblet");
      return false;
    }

    setIsPrinting(true);
    try {
      // Generate ESC/POS commands
      const escPosData = generateReceiptESCPOS(receiptData);
      await sendToPrinter(escPosData);
      
      toast.success("Kvittering skrevet ut!");
      return true;
    } catch (error: any) {
      toast.error(`Utskrift mislyktes: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const testPrint = async (): Promise<boolean> => {
    if (!device || !connectedPrinter) {
      toast.error("Ingen skriver tilkoblet");
      return false;
    }

    setIsPrinting(true);
    try {
      // Generate test receipt
      const testData = generateTestReceiptESCPOS("Stylora POS");

      await sendToPrinter(testData);
      toast.success("Test utskrift sendt!");
      return true;
    } catch (error: any) {
      toast.error(`Test utskrift mislyktes: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const openCashDrawer = async (): Promise<boolean> => {
    if (!device || !connectedPrinter) {
      toast.error("Ingen skriver tilkoblet");
      return false;
    }

    setIsOpeningDrawer(true);
    try {
      // ESC/POS command to open cash drawer
      // ESC p m t1 t2 (0x1B 0x70 m t1 t2)
      // m = pin number (0 or 1), t1 = on time, t2 = off time
      const openDrawerCommand = new Uint8Array([
        0x1b, 0x70, 0x00, // ESC p 0 (pin 2)
        0x19,             // t1 = 25ms on time
        0xfa,             // t2 = 250ms off time
      ]);

      await sendToPrinter(openDrawerCommand);
      toast.success("Åpnet kassaskuff!");
      return true;
    } catch (error: any) {
      toast.error(`Kunne ikke åpne skuff: ${error.message}`);
      return false;
    } finally {
      setIsOpeningDrawer(false);
    }
  };

  return (
    <ThermalPrinterContext.Provider
      value={{
        isSupported,
        connectedPrinter,
        isConnecting,
        isPrinting,
        isOpeningDrawer,
        detectPrinters,
        connectPrinter,
        disconnectPrinter,
        printReceipt,
        testPrint,
        openCashDrawer,
      }}
    >
      {children}
    </ThermalPrinterContext.Provider>
  );
}

export function useThermalPrinter() {
  const context = useContext(ThermalPrinterContext);
  if (!context) {
    throw new Error("useThermalPrinter must be used within ThermalPrinterProvider");
  }
  return context;
}


