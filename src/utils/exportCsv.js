/**
 * Utility to export JavaScript arrays of objects to a clean downloadable CSV file.
 */
export function downloadCSV(filename, rows, headers) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const headerKeys = headers ? Object.keys(headers) : Object.keys(rows[0]);
  const headerLabels = headers ? Object.values(headers) : headerKeys;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [];
  csvRows.push(headerLabels.map(escapeCSV).join(','));

  for (const row of rows) {
    const values = headerKeys.map(k => {
      const val = row[k];
      return escapeCSV(val);
    });
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv(rows, filename = 'export.csv') {
  return downloadCSV(filename, rows);
}

/**
 * Exports double-entry balanced General Ledger Journal Entries formatted
 * for direct import into QuickBooks Online, QuickBooks Desktop, Xero, Wave,
 * or professional CPA spreadsheets in Excel / Google Sheets.
 */
export function exportQuickBooksJournalEntries({
  sales = [],
  expenses = [],
  products = [],
  storeName = 'Retail Store',
  fxRate = 198,
  dateLabel = ''
}) {
  if ((!sales || !sales.length) && (!expenses || !expenses.length)) {
    alert('No sales or expense transactions recorded in this period to export.');
    return;
  }

  // Cost map for COGS calculation
  const productCostMap = {};
  (products || []).forEach((p) => {
    const cost = Number(p.costPriceUSD || p.costPrice || 0);
    if (p.id) productCostMap[p.id] = cost;
    if (p.name) productCostMap[p.name.toLowerCase()] = cost;
  });

  // Group by Date (YYYY-MM-DD)
  const dateMap = {};

  const getDayString = (rawDate) => {
    if (!rawDate) return new Date().toISOString().slice(0, 10);
    if (typeof rawDate === 'string') return rawDate.slice(0, 10);
    if (rawDate.seconds) return new Date(rawDate.seconds * 1000).toISOString().slice(0, 10);
    if (rawDate instanceof Date) return rawDate.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  };

  // Process Sales
  sales.forEach((s) => {
    const dStr = getDayString(s.date || s.timestamp || s.createdAt);
    if (!dateMap[dStr]) {
      dateMap[dStr] = {
        cash: 0,
        momo: 0,
        orange: 0,
        credit: 0,
        other: 0,
        discounts: 0,
        grossSales: 0,
        cogs: 0,
        expenses: []
      };
    }

    const total = Number(s.totalUSD || s.total || 0);
    const discount = Number(s.discountUSD || 0);
    const method = String(s.paymentMethod || 'cash').toLowerCase();

    if (method.includes('momo') || method.includes('mtn')) {
      dateMap[dStr].momo += total;
    } else if (method.includes('orange')) {
      dateMap[dStr].orange += total;
    } else if (method.includes('credit') || method.includes('tab')) {
      dateMap[dStr].credit += total;
    } else {
      dateMap[dStr].cash += total;
    }

    dateMap[dStr].discounts += discount;
    dateMap[dStr].grossSales += (total + discount);

    // COGS
    if (Array.isArray(s.items)) {
      s.items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const unitCost = productCostMap[item.id] || (item.name && productCostMap[item.name.toLowerCase()]) || Number(item.costPriceUSD || 0) || (Number(item.priceUSD || 0) * 0.65);
        dateMap[dStr].cogs += (unitCost * qty);
      });
    }
  });

  // Process Expenses
  expenses.forEach((e) => {
    const dStr = getDayString(e.date || e.createdAt);
    if (!dateMap[dStr]) {
      dateMap[dStr] = {
        cash: 0,
        momo: 0,
        orange: 0,
        credit: 0,
        other: 0,
        discounts: 0,
        grossSales: 0,
        cogs: 0,
        expenses: []
      };
    }
    const amtUSD = e.currency === 'LRD' ? (Number(e.amount || 0) / fxRate) : Number(e.amount || 0);
    dateMap[dStr].expenses.push({
      category: e.category || 'General Operating',
      amount: amtUSD,
      note: e.note || e.description || e.category || 'Operating expense'
    });
  });

  const sortedDates = Object.keys(dateMap).sort();
  const journalRows = [];
  let journalCounter = 1001;

  sortedDates.forEach((dStr) => {
    const day = dateMap[dStr];
    const jrnNo = `JRN-${dStr.replace(/-/g, '')}-${journalCounter++}`;

    // 1. Sales Inflow Entries
    if (day.grossSales > 0 || (day.cash + day.momo + day.orange + day.credit) > 0) {
      if (day.cash > 0) {
        journalRows.push({
          journalNo: jrnNo,
          date: dStr,
          accountName: 'Cash on Hand (Store Drawer)',
          accountType: 'Bank / Current Asset',
          debit: day.cash.toFixed(2),
          credit: '0.00',
          memo: `Daily cash register collections - ${storeName}`,
          store: storeName
        });
      }
      if (day.momo > 0) {
        journalRows.push({
          journalNo: jrnNo,
          date: dStr,
          accountName: 'MTN Mobile Money Clearing',
          accountType: 'Bank / Current Asset',
          debit: day.momo.toFixed(2),
          credit: '0.00',
          memo: `Lonestar MTN MoMo collections - ${storeName}`,
          store: storeName
        });
      }
      if (day.orange > 0) {
        journalRows.push({
          journalNo: jrnNo,
          date: dStr,
          accountName: 'Orange Money Clearing',
          accountType: 'Bank / Current Asset',
          debit: day.orange.toFixed(2),
          credit: '0.00',
          memo: `Orange Money collections - ${storeName}`,
          store: storeName
        });
      }
      if (day.credit > 0) {
        journalRows.push({
          journalNo: jrnNo,
          date: dStr,
          accountName: 'Accounts Receivable (Customer Credit)',
          accountType: 'Accounts Receivable',
          debit: day.credit.toFixed(2),
          credit: '0.00',
          memo: `Customer store credit tabs taken - ${storeName}`,
          store: storeName
        });
      }
      if (day.discounts > 0) {
        journalRows.push({
          journalNo: jrnNo,
          date: dStr,
          accountName: 'Sales Discounts & Allowances',
          accountType: 'Income (Contra)',
          debit: day.discounts.toFixed(2),
          credit: '0.00',
          memo: `Customer promotional discounts allowed`,
          store: storeName
        });
      }

      // Credit: Gross Sales
      const totalCollected = day.cash + day.momo + day.orange + day.credit + day.discounts;
      journalRows.push({
        journalNo: jrnNo,
        date: dStr,
        accountName: 'Sales Revenue: Retail Merchandise',
        accountType: 'Income / Revenue',
        debit: '0.00',
        credit: totalCollected.toFixed(2),
        memo: `Gross retail merchandise sales revenue - ${storeName}`,
        store: storeName
      });

      // 2. Cost of Goods Sold (COGS) Entries
      if (day.cogs > 0) {
        const cogsJrn = `JRN-${dStr.replace(/-/g, '')}-${journalCounter++}`;
        journalRows.push({
          journalNo: cogsJrn,
          date: dStr,
          accountName: 'Cost of Goods Sold (COGS)',
          accountType: 'Cost of Goods Sold',
          debit: day.cogs.toFixed(2),
          credit: '0.00',
          memo: `Inventory depletion cost for goods sold`,
          store: storeName
        });
        journalRows.push({
          journalNo: cogsJrn,
          date: dStr,
          accountName: 'Merchandise Inventory Asset',
          accountType: 'Other Current Asset',
          debit: '0.00',
          credit: day.cogs.toFixed(2),
          memo: `Inventory asset reduction on sales`,
          store: storeName
        });
      }
    }

    // 3. Operating Expenses Entries
    if (day.expenses && day.expenses.length > 0) {
      day.expenses.forEach((exp) => {
        const expJrn = `JRN-${dStr.replace(/-/g, '')}-${journalCounter++}`;
        journalRows.push({
          journalNo: expJrn,
          date: dStr,
          accountName: `Expenses: ${exp.category}`,
          accountType: 'Expense',
          debit: exp.amount.toFixed(2),
          credit: '0.00',
          memo: exp.note,
          store: storeName
        });
        journalRows.push({
          journalNo: expJrn,
          date: dStr,
          accountName: 'Cash on Hand (Store Drawer)',
          accountType: 'Bank / Current Asset',
          debit: '0.00',
          credit: exp.amount.toFixed(2),
          memo: `Cash drawer payout for ${exp.category}`,
          store: storeName
        });
      });
    }
  });

  const headers = {
    journalNo: 'Journal Entry #',
    date: 'Date (YYYY-MM-DD)',
    accountName: 'Account Name',
    accountType: 'Account Type',
    debit: 'Debit (USD)',
    credit: 'Credit (USD)',
    memo: 'Description / Memo',
    store: 'Store Location'
  };

  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `QuickBooks_GL_${cleanStoreName}_${dateLabel || new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, journalRows, headers);
}

export function downloadSampleInventoryTemplate() {
  const sample = "Barcode,Name,Category,RetailPrice,CostPrice,ShowroomQty,StoreroomQty,Supplier\n" +
    "794552001,Classic Oxford Shoes Size 42,Apparel & Fashion,45.00,25.00,10,20,Monrovia Importers\n" +
    "794552002,Multivitamin Capsules 60s,Pharmacy & Health,12.00,7.00,15,30,Sinkor Wholesale\n" +
    "794552003,Coconut Shea Hair Cream,Cosmetics & Hair,8.50,4.50,25,50,Ivory Coast Beauty Hub\n" +
    "794552004,Basmati Rice 25kg Bag,Supermarket & Grocery,28.00,22.00,12,40,Freeport Logistics";
  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'retailos-inventory-template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

