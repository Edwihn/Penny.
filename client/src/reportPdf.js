import { money } from './utils.js';

// MVC View: printable representation of the same backend-calculated weekly report.
// PDF formatting is a helper, not an additional application design pattern.
export function reportDefinition(report) {
  const content = [
    { text: 'penny.', color: '#294e3e', bold: true, fontSize: 28 },
    { text: 'Weekly expense report', style: 'title', margin: [0, 8, 0, 5] },
    { text: `Monday ${report.start} - Sunday ${report.end}`, color: '#56645b', margin: [0, 0, 0, 4] },
    { text: `Sunday simulation: ${report.simulatedRunDate}  |  Currency: USD`, style: 'muted', margin: [0, 0, 0, 16] },
    { columns: [{ text: 'WEEKLY TOTAL', bold: true, color: '#294e3e' }, { text: money(report.totalCents), alignment: 'right', bold: true, fontSize: 19 }], margin: [0, 0, 0, 16] },
  ];
  for (const day of report.days) {
    const heading = { text: day.formattedDate, bold: true, fontSize: 12, color: '#294e3e', margin: [0, 12, 0, 6], headlineLevel: 1 };
    content.push(heading);
    if (day.expenses.length) {
      content.push({
        table: {
          // A note with many line breaks can be taller than a page; allow it to continue.
          headerRows: 1, dontBreakRows: false, widths: ['*', 90, 68],
          body: [
            ['EXPENSE / NOTE', 'CATEGORY', 'AMOUNT'].map((text, index) => ({ text, bold: true, color: '#294e3e', fontSize: 8, alignment: index === 2 ? 'right' : 'left' })),
            ...day.expenses.map(expense => [
              { stack: [{ text: expense.concept, bold: true }, ...(expense.reason ? [{ text: expense.reason, style: 'muted', margin: [0, 4, 0, 0] }] : [])] },
              { text: expense.categoryLabel, color: '#46574c' },
              { text: money(expense.amountCents), alignment: 'right', bold: true },
            ]),
          ],
        },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#dce3da', paddingTop: () => 9, paddingBottom: () => 9, paddingLeft: () => 9, paddingRight: () => 9 },
      });
    }
    content.push({ columns: [{ text: day.count ? `${day.count} expense${day.count === 1 ? '' : 's'}` : 'No expenses recorded.', style: 'muted' }, { text: `Daily subtotal: ${money(day.totalCents)}`, alignment: 'right', bold: true }], margin: [0, 8, 0, 6] });
  }
  content.push({ text: `WEEKLY TOTAL: ${money(report.totalCents)}`, alignment: 'right', bold: true, fontSize: 15, color: '#294e3e', margin: [0, 20, 0, 0] });
  return {
    info: { title: `Penny weekly report ${report.end}`, author: 'Penny Expense Tracker' },
    pageSize: 'A4', pageMargins: [42, 40, 42, 48],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#293d34', lineHeight: 1.2 },
    styles: { title: { fontSize: 20, bold: true }, muted: { fontSize: 9, color: '#68776d' } },
    content,
    pageBreakBefore: (node, following) => node.headlineLevel === 1 && following.length === 0,
    footer: (current, total) => ({ text: `Penny  |  ${report.start} - ${report.end}  |  Page ${current} of ${total}`, alignment: 'center', fontSize: 8, color: '#68776d', margin: [42, 18, 42, 0] }),
  };
}

export async function downloadReportPdf(report) {
  // Load the PDF engine and embedded fonts only when a report is requested.
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake.js'), import('pdfmake/build/vfs_fonts.js'),
  ]);
  pdfMake.addVirtualFileSystem(fonts);
  const pdf = pdfMake.createPdf(reportDefinition(report));
  const blob = await new Promise(resolve => pdf.getBlob(resolve));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `penny-weekly-${report.end}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
