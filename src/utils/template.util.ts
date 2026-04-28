import fs from 'fs';
import path from 'path';
import { LotteryReport } from '../services/data.service';

export function buildHTML(data: LotteryReport[]): string {

  let html = fs.readFileSync(
    path.join(__dirname, '../../templates/report.html'),
    'utf8'
  );

  const today = new Date().toLocaleDateString();
  const drawDate = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString([], {hour: '2-digit',minute: '2-digit'});

  // Replace all dates
  html = html.replace(/{{REPORT_DATE}}/g, today);
  html = html.replace('{{Time}}', time);

  // Dynamic values
  html = html.replace('{{Lottery}}', data[0]?.lottery_name.toUpperCase() || '-');
  html = html.replace('{{Draw_No}}', data[0]?.drawNumber?.toString() || '-');
  html = html.replace('{{Draw_DATE}}', drawDate);

  // Table rows (UPDATED)
  const rows = data.map((row, index) => {
  // Convert ReturnDate to YYYY-MM-DD if it exists
    let returnDate = '';
    if (row.ReturnDate) {
        const d = new Date(row.ReturnDate);
        returnDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    return `
        <tr>
        <td>${row.Code}</td>
        <td>${row.AgentName}</td>
        <td>${returnDate}</td>
        <td>${row.SalesFrom ?? ''}</td>
        <td>${row.SalesTo ?? ''}</td>
        <td>${row.ReturnsFrom ?? ''}</td>
        <td>${row.ReturnsTo ?? ''}</td>
        <td>${row.Quantity}</td>
        </tr>
    `;
}).join('');

  html = html.replace('{{TABLE_ROWS}}', rows);

  // Summary
  const sales = data
    .filter(d => d.SalesFrom !== null)
    .reduce((sum, d) => sum + d.Quantity, 0);

  const returns = data
    .filter(d => d.ReturnsFrom !== null)
    .reduce((sum, d) => sum + d.Quantity, 0);

  html = html.replace('{{AGENT_SALES}}', sales.toString());
  html = html.replace('{{AGENT_RETURNS}}', returns.toString());
  html = html.replace('{{GRAND_TOTAL}}', (sales + returns).toString());

  // Embed logo
  const imagePath = path.join(__dirname, '../../templates/assets/images.png');
  if (fs.existsSync(imagePath)) {
    const imageBase64 = fs.readFileSync(imagePath, 'base64');
    html = html.replace(
      '<img src="assets/images.png"',
      `<img src="data:image/png;base64,${imageBase64}"`
    );
  }

  

  return html;
}