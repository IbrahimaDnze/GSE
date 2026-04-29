/**
 * Export an array of objects to a CSV file download.
 * @param {Object[]} data
 * @param {string} filename - without extension
 * @param {string[]} [columns] - ordered list of keys to include (defaults to all)
 */
export function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) return;
  const keys = columns || Object.keys(data[0]);
  const header = keys.join(';');
  const rows = data.map((row) =>
    keys.map((k) => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(';')
  );
  const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
