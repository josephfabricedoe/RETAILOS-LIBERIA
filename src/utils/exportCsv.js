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

