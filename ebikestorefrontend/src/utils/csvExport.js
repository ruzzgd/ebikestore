export const downloadCSV = (data, filename) => {
  if (!data || !data.length) {
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Map each row
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
        // Escape quotes
        value = value.replace(/"/g, '""');
        // Wrap in quotes if it contains a comma or quote or newline
        if (value.search(/("|,|\n)/g) >= 0) {
          value = `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('url');
  
  // Use a temporary anchor to trigger download
  if (navigator.msSaveBlob) { 
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
};
