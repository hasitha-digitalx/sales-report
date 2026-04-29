// import cron from 'node-cron';
// import path from 'path';
// import fs from 'fs-extra';

// import { getLotteryData, getTodayDraw } from '../services/data.service';
// import { buildHTML } from '../utils/template.util';
// import { generatePDF } from '../services/pdf.service';
// import { generateText } from '../services/text.service';
// import { createZip } from '../services/zip.service';
// import { buildZipName } from '../utils/fileName.util';
// import { uploadFileSFTP } from '../services/upload.service';
// import { sftpConfig } from '../config/sftpConfig';

// /**
//  * Start cron job
//  */
// export function startReportJob() {

//   cron.schedule('37 12 * * *', async () => {

//     console.log('==============================');
//     console.log('Running Lottery Report Job');
//     console.log('==============================');

//     const today = new Date().toISOString().split('T')[0];

//     // ✅ LOCAL DAILY FOLDER
//     const reportDir = path.join(__dirname, `../../reports/${today}`);
//     await fs.ensureDir(reportDir);

//     // ✅ SFTP CONFIG (DAILY FOLDER)
//     // const sftpConfig = {
//     //   host: process.env.SFTP_HOST!,
//     //   port: Number(process.env.SFTP_PORT || 22),
//     //   username: process.env.SFTP_USER!,
//     //   password: process.env.SFTP_PASS!,
//     //   remoteDir: process.env.SFTP_REMOTE_DIR!,
//     //   retries: Number(process.env.SFTP_RETRIES || 3)
//     // };

//     const safeDelete = async (filePath: string) => {
//       try {
//         if (await fs.pathExists(filePath)) {
//           await fs.remove(filePath);
//         }
//       } catch (err) {
//         console.error('Delete failed:', filePath, err);
//       }
//     };

//     try {

//       const lotteryIds = [1, 2, 72, 84, 42, 3, 88];
//       const uploadedFiles: string[] = [];

//       for (const lotteryId of lotteryIds) {

//         let pdfPath = '';
//         let textPath = '';

//         try {

//           const drawNumber = await getTodayDraw(lotteryId);

//           if (!drawNumber) {
//             console.log(`No draw found for Lottery ${lotteryId}`);
//             continue;
//           }

//           console.log(`Processing Lottery ${lotteryId}, Draw ${drawNumber}`);

//           const data = await getLotteryData(lotteryId, drawNumber);

//           if (!data || data.length === 0) {
//             console.log(`No data for Lottery ${lotteryId}`);
//             continue;
//           }

//           const html = buildHTML(data);

//           // ✅ generate files INSIDE today's folder
//           pdfPath = await generatePDF(html, lotteryId, drawNumber,reportDir);
//           textPath = await generateText(data, lotteryId, drawNumber,reportDir);

//           const zipPath = path.join(reportDir, buildZipName(lotteryId, drawNumber));

//           await createZip(
//             [
//               { path: pdfPath, name: path.basename(pdfPath) },
//               { path: textPath, name: path.basename(textPath) }
//             ],
//             zipPath
//           );

//           console.log('ZIP Created:', zipPath);

//           // ✅ UPLOAD ONLY TODAY FILE
//           const remotePath = await uploadFileSFTP(zipPath, sftpConfig);

//           uploadedFiles.push(remotePath);

//         } catch (err) {
//           console.error(`Error Lottery ${lotteryId}:`, err);

//         } finally {
//           // delete temp files only
//           await Promise.all([
//             safeDelete(pdfPath),
//             safeDelete(textPath)
//           ]);
//         }
//       }

//       console.log('\n✅ ALL REPORTS COMPLETED');
//       console.log(`Uploaded ${uploadedFiles.length} files for ${today}`);
//       console.log(uploadedFiles);

//     } catch (error) {
//       console.error('Job Failed:', error);
//     }

//     console.log('==============================\n');
//   });
// }


import cron from 'node-cron';
import path from 'path';
import fs from 'fs-extra';
import pLimit from 'p-limit';

import { getLotteryData, getTodayDraw } from '../services/data.service';
import { buildHTML } from '../utils/template.util';
import { generatePDF } from '../services/pdf.service';
import { generateText } from '../services/text.service';
import { createZip } from '../services/zip.service';
import { buildZipName } from '../utils/fileName.util';
import { uploadFileSFTP } from '../services/upload.service';
import { sftpConfig } from '../config/sftpConfig';

/**
 * Start Lottery Report Cron Job
 */
export function startReportJob() {

  cron.schedule('31 10 * * *', async () => {

    console.log('==============================');
    console.log('Lottery Report Job Started');
    console.log('==============================');

    const today = new Date().toISOString().split('T')[0];

    // 📁 LOCAL DAILY REPORT DIRECTORY
    const reportDir = path.join(__dirname, `../../reports/${today}`);
    await fs.ensureDir(reportDir);

    /**
     * Safe file delete helper
     */
    const safeDelete = async (filePath: string) => {
      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      } catch (err) {
        console.error('Delete failed:', filePath, err);
      }
    };

    const lotteryIds = [1, 2, 72, 84, 42, 3, 88];
    const zipFiles: string[] = [];

    try {

      /* =========================
         STEP 1: GENERATE REPORTS
      ========================= */
      for (const lotteryId of lotteryIds) {

        let pdfPath = '';
        let textPath = '';

        try {

          // Get today's draw number
          const drawNumber = await getTodayDraw(lotteryId);

          if (!drawNumber) {
            console.log(`No draw found for Lottery ${lotteryId}`);
            continue;
          }

          // Fetch lottery data
          const data = await getLotteryData(lotteryId, drawNumber);

          if (!data || data.length === 0) {
            console.log(`No data for Lottery ${lotteryId}`);
            continue;
          }

          console.log(`Processing Lottery ${lotteryId}, Draw ${drawNumber}`);

          // Build HTML content
          const html = buildHTML(data);

          // Generate PDF + TXT files
          pdfPath = await generatePDF(html, lotteryId, drawNumber, reportDir);
          textPath = await generateText(data, lotteryId, drawNumber, reportDir);

          // Create ZIP file
          const zipPath = path.join(
            reportDir,
            buildZipName(lotteryId, drawNumber)
          );

          await createZip(
            [
              { path: pdfPath, name: path.basename(pdfPath) },
              { path: textPath, name: path.basename(textPath) }
            ],
            zipPath
          );

          console.log('ZIP Created:', zipPath);

          // 💾 store for upload step
          zipFiles.push(zipPath);

        } catch (err) {
          console.error(`Error generating Lottery ${lotteryId}:`, err);

        } finally {
          // 🧹 cleanup temp files
          await Promise.all([
            safeDelete(pdfPath),
            safeDelete(textPath)
          ]);
        }
      }

      /* =========================
         STEP 2: UPLOAD
      ========================= */

      console.log('Starting upload...');

      const limit = pLimit(1); // limit concurrency (change if needed)

      const results = await Promise.allSettled(
        zipFiles.map(file =>
          limit(async () => {
            const remotePath = await uploadFileSFTP(file, sftpConfig);
            //console.log('Uploaded:', remotePath);
            return remotePath;
          })
        )
      );

      /* =========================
         STEP 3: UPLOAD SUMMARY
      ========================= */

      const success: string[] = [];
      const failed: string[] = [];

      results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          success.push(res.value);
        } else {
          failed.push(zipFiles[index]);
          console.error('Failed upload:', zipFiles[index]);
        }
      });

      console.log('==============================');
      console.log('UPLOAD COMPLETE');
      console.log('Success:', success.length);
      console.log('Failed:', failed.length);
      console.log('==============================');

    } catch (error) {
      console.error('Job Failed:', error);
    }

    console.log('==============================\n');
  });
}