import puppeteer from 'puppeteer';
import path from 'path';
import { buildFileName } from '../utils/fileName.util';

/**
 * Generate PDF file using Puppeteer
 * NOTE: Keeps original file-based approach (NO BUFFER change)
 */
export async function generatePDF(
  html: string,
  lotteryId: number,
  drawNumber: number,
  reportDir: string
): Promise<string> {

  let browser;

  try {

    // Launch browser
    browser = await puppeteer.launch({
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Load HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate file path
    const filePath = path.join(
      __dirname,
      `../../reports/${buildFileName(lotteryId, drawNumber, 'PDF')}`
    );

    // Generate PDF
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,

      displayHeaderFooter: true,

      footerTemplate: `
        <div style="
          width: 100%;
          margin-left: 30px;
          margin-right: 30px;
          font-size: 10px;
          text-align: center;
          font-family: 'Segoe UI', Arial, sans-serif;
          border-top: 2px solid #000;
          padding-top: 5px;
          color: #000;
        ">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,

      margin: {
        top: '20px',
        bottom: '40px',
        left: '20px',
        right: '20px'
      }
    });

    return filePath;

  } catch (error) {
    console.error(`PDF generation failed (Lottery ${lotteryId}):`, error);
    throw error;

  } finally {
    // Always close browser safely
    if (browser) await browser.close();
  }
}