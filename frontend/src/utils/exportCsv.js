/**
 * Utility to export datasets to CSV with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToCsv(filename, headers, rows) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(h => escapeCsv(h.label)).join(',');
  const dataRows = rows.map(row => {
    return headers.map(h => {
      const val = typeof h.key === 'function' ? h.key(row) : row[h.key];
      return escapeCsv(val);
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
