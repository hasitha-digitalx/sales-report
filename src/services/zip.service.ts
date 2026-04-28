import fs from 'fs-extra';
import archiver from 'archiver';

/**
 * Create ZIP file from generated files
 */
export async function createZip(
  files: { path: string; name: string }[],
  zipPath: string
): Promise<string> {

  await fs.ensureDir(require('path').dirname(zipPath));

  return new Promise((resolve, reject) => {

    try {

      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      // Handle stream close
      output.on('close', () => resolve(zipPath));

      // Handle archive errors
      archive.on('error', (err) => {
        console.error('ZIP creation error:', err);
        reject(err);
      });

      archive.pipe(output);

      // Add files safely
      files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            archive.file(file.path, { name: file.name });
          } else {
            console.warn('File missing for ZIP:', file.path);
          }
        } catch (err) {
          console.error('File append error:', file.path, err);
        }
      });

      archive.finalize();

    } catch (error) {
      console.error('ZIP service failed:', error);
      reject(error);
    }
  });
}