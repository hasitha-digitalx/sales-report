import fs from 'fs-extra';
import path from 'path';
import { LotteryReport } from './data.service';
import { buildFileName } from '../utils/fileName.util';

/**
 * Format date safely
 */
function formatDate(date: Date | string | null): string {
  if (!date) return '';

  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Pad fields for fixed-width text file
 */
function formatField(value: any, length: number): string {
  return String(value ?? '').padEnd(length, ' ');
}

// Column width
const COL1 = 8;
const COL2 = 23;
const COL3 = 15;
const COL4 = 15;
const COL5 = 15;
const COL6 = 15;

/**
 * Generate TXT file (keeps original format)
 */
export async function generateText(
  data: LotteryReport[],
  lotteryId: number,
  drawNumber: number,
  reportDir: string
): Promise<string> {

  try {

    // const reportDir = path.join(__dirname, '../../reports');
    

    // Ensure folder exists
    await fs.ensureDir(reportDir);

    // File name
    const filePath = path.join(
      reportDir,
      buildFileName(lotteryId, drawNumber, 'TXT')
    );

    let content = '';

    // Build fixed-width content
    data.forEach(row => {
      const code = formatField(row.Code, COL1);
      const date = formatField(formatDate(row.ReturnDate), COL2);
      const from = formatField(row.SalesFrom, COL3);
      const to = formatField(row.SalesTo, COL4);
      const rFrom = formatField(row.ReturnsFrom, COL5);
      const rTo = formatField(row.ReturnsTo, COL6);

      content += `${code}${date}${from}${to}${rFrom}${rTo}\n`;
    });

    // Write file
    await fs.writeFile(filePath, content);

    return filePath;

  } catch (error) {
    console.error(`TXT generation failed (Lottery ${lotteryId}):`, error);
    throw error;
  }
}