export function downloadMarkdownReport(report, filename) {
  const blob = new Blob([report.markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `threatlens-report-${report.incidentId}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printReport() {
  window.print();
}
