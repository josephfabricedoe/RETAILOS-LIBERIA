// Bluetooth ESC/POS Thermal Printer Driver for 58mm Mobile Printers (32 columns)

// Standard GATT services used by mobile 58mm ESC/POS Bluetooth printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common portable printer service (Goojprt, PT-210, MPT-II)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Microchip UART Service
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Chinese thermal printer
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
];

// In-memory active connection
let activeDevice = null;
let activeCharacteristic = null;

export const isWebBluetoothSupported = () => {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
};

export const getConnectedPrinterName = () => {
  if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected) {
    return activeDevice.name || '58mm Thermal Printer';
  }
  return null;
};

export async function connectBluetoothPrinter() {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      'Web Bluetooth is not supported in this browser. Please open in Google Chrome on Android or enable Bluetooth flags.'
    );
  }

  if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected && activeCharacteristic) {
    return { device: activeDevice, characteristic: activeCharacteristic, name: activeDevice.name || '58mm Printer' };
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    });

    if (!device || !device.gatt) {
      throw new Error('No Bluetooth device selected.');
    }

    device.addEventListener('gattserverdisconnected', () => {
      console.warn('Bluetooth printer disconnected:', device.name);
      if (activeDevice === device) {
        activeCharacteristic = null;
      }
    });

    const server = await device.gatt.connect();
    let characteristic = null;

    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              characteristic = c;
              break;
            }
          }
        } catch (e) {}
        if (characteristic) break;
      }
    } catch (e) {
      console.warn('Failed to get all primary services, trying known printer services...');
    }

    if (!characteristic) {
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              characteristic = c;
              break;
            }
          }
          if (characteristic) break;
        } catch (e) {}
      }
    }

    if (!characteristic) {
      throw new Error(
        'Connected to Bluetooth device, but could not find a writable printing channel. Please ensure device is a thermal printer.'
      );
    }

    activeDevice = device;
    activeCharacteristic = characteristic;

    return { device, characteristic, name: device.name || '58mm Printer' };
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('Printer connection cancelled. No device was paired.');
    }
    throw err;
  }
}

export async function disconnectBluetoothPrinter() {
  if (activeDevice && activeDevice.gatt) {
    try {
      activeDevice.gatt.disconnect();
    } catch (e) {}
  }
  activeDevice = null;
  activeCharacteristic = null;
}

async function writeBytes(characteristic, data) {
  const chunkSize = 100;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export class EscPosBuilder {
  constructor() {
    this.buffer = [];
    this.encoder = new TextEncoder();
    this.init();
  }

  init() {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  align(alignment = 'left') {
    const n = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  bold(enable = true) {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  size(doubleSize = false) {
    this.buffer.push(0x1d, 0x21, doubleSize ? 0x11 : 0x00);
    return this;
  }

  text(str = '', newline = true) {
    const bytes = this.encoder.encode(str + (newline ? '\n' : ''));
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  feed(lines = 1) {
    this.buffer.push(0x1b, 0x64, lines);
    return this;
  }

  cut() {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  separator(char = '-') {
    return this.text(char.repeat(32));
  }

  twoColumns(leftStr, rightStr, width = 32) {
    const left = String(leftStr);
    const right = String(rightStr);
    const spaceCount = Math.max(1, width - left.length - right.length);
    const line = left + ' '.repeat(spaceCount) + right;
    return this.text(line.slice(0, width));
  }

  getBytes() {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Formats a store 58mm receipt into ESC/POS bytes
 */
export function buildSaleReceiptEscPos(sale, storeSettings = {}, exchangeRate = 198) {
  const b = new EscPosBuilder();
  const rate = exchangeRate || 198;
  const lrd = (usd) => (Number(usd || 0) * rate).toFixed(0);

  const storeName = (storeSettings.storeName || 'RETAIL STORE').toUpperCase();
  const address = storeSettings.address || 'Monrovia, Liberia';
  const phone = storeSettings.phone || '';
  const receiptNo = sale.receiptNo || sale.id?.slice(-6).toUpperCase() || 'RECEIPT';
  const dateStr = new Date(sale.timestamp?.toDate?.() || Date.now()).toLocaleString();

  // Header
  b.align('center')
    .bold(true)
    .size(true)
    .text(storeName)
    .size(false)
    .bold(false);

  if (address) b.text(address);
  if (phone) b.text(`Tel: ${phone}`);

  b.separator('-')
    .text(`RECEIPT #${receiptNo}`)
    .text(dateStr)
    .separator('-');

  if (sale.customerName && sale.customerName !== 'Walk-in Customer') {
    const custInfo = sale.customerPhone ? `${sale.customerName} (${sale.customerPhone})` : sale.customerName;
    b.align('left')
      .text(`Client: ${custInfo}`)
      .separator('-');
  }

  b.align('left').bold(true).twoColumns('ITEM / QTY', 'TOTAL (USD)').bold(false).separator('-');

  const items = sale.items || [];
  for (const item of items) {
    b.bold(true).text(item.name.slice(0, 32)).bold(false);
    const unitP = Number(item.unitPrice || 0).toFixed(2);
    const totalP = `$${Number(item.total || 0).toFixed(2)}`;
    const qtyStr = `  ${item.quantity} x $${unitP} (${item.pricingMode || 'retail'})`;
    b.twoColumns(qtyStr, totalP);
  }

  b.separator('-');

  b.align('left');
  if (sale.discount > 0) {
    b.twoColumns('Order Discount:', `-$${Number(sale.discount).toFixed(2)}`);
  }

  b.bold(true)
    .twoColumns('TOTAL USD:', `$${Number(sale.total || 0).toFixed(2)}`)
    .twoColumns('TOTAL LRD:', `L$${lrd(sale.total)}`)
    .bold(false);

  b.separator('-');

  b.twoColumns('Payment Method:', sale.paymentMethod || 'Cash');
  if (sale.amountPaid > 0) {
    b.twoColumns('Paid Today:', `$${Number(sale.amountPaid).toFixed(2)}`);
  }
  if (sale.balanceOwed > 0) {
    b.bold(true).twoColumns('BALANCE DUE (Credit):', `$${Number(sale.balanceOwed).toFixed(2)}`).bold(false);
  }
  if (sale.change > 0) {
    b.twoColumns('Change Returned:', `$${Number(sale.change).toFixed(2)}`);
  }

  b.separator('-');

  b.align('center')
    .text('Thank you for your business!')
    .text('Powered by RetailOS Liberia')
    .feed(3);

  return b.getBytes();
}

/**
 * Formats a Shift Handover / Z-Report slip for 58mm thermal printer
 */
export function buildZReportEscPos(reportData, storeSettings = {}) {
  const b = new EscPosBuilder();
  const storeName = (storeSettings.storeName || 'RETAIL STORE').toUpperCase();

  b.align('center')
    .bold(true)
    .size(true)
    .text(storeName)
    .size(false)
    .text('DAILY SHIFT Z-REPORT')
    .text(new Date().toLocaleString())
    .separator('=')
    .align('left');

  b.twoColumns('Cashier:', reportData.cashierName || 'Staff');
  b.twoColumns('Shift Date:', reportData.date || new Date().toLocaleDateString());
  b.separator('-');

  b.bold(true).text('SALES SUMMARY').bold(false);
  b.twoColumns('Total Gross Sales:', `$${Number(reportData.totalSales || 0).toFixed(2)}`);
  b.twoColumns('Transactions Count:', String(reportData.salesCount || 0));
  b.twoColumns('Cash In Drawer:', `$${Number(reportData.cashSales || 0).toFixed(2)}`);
  b.twoColumns('Mobile Money (MoMo):', `$${Number(reportData.momoSales || 0).toFixed(2)}`);
  b.twoColumns('Card / Other:', `$${Number(reportData.cardSales || 0).toFixed(2)}`);
  b.separator('-');

  b.bold(true).text('DRAWER RECONCILIATION').bold(false);
  b.twoColumns('Opening Float:', `$${Number(reportData.openingFloat || 0).toFixed(2)}`);
  b.twoColumns('Physical Cash Counted:', `$${Number(reportData.countedCash || 0).toFixed(2)}`);
  b.twoColumns('Expected Cash:', `$${Number(reportData.expectedCash || 0).toFixed(2)}`);
  b.bold(true).twoColumns('Variance:', `$${Number(reportData.variance || 0).toFixed(2)}`).bold(false);
  b.twoColumns('Status:', reportData.status || 'BALANCED');

  b.separator('-');
  b.align('center')
    .feed(2)
    .text('Cashier Signature: _______________')
    .feed(1)
    .text('Manager Verification: ___________')
    .feed(3);

  return b.getBytes();
}

export async function printToBluetoothThermalPrinter(escPosBytes) {
  let characteristic = activeCharacteristic;

  if (!characteristic || !activeDevice || !activeDevice.gatt?.connected) {
    const conn = await connectBluetoothPrinter();
    characteristic = conn.characteristic;
  }

  await writeBytes(characteristic, escPosBytes);
  return { success: true, printerName: activeDevice?.name || '58mm Printer' };
}

export async function printReceipt58mm(sale, storeSettings = {}, exchangeRate = 198) {
  const bytes = buildSaleReceiptEscPos(sale, storeSettings, exchangeRate);
  return printToBluetoothThermalPrinter(bytes);
}

