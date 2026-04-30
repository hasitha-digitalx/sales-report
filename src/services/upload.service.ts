import SFTPClient from 'ssh2-sftp-client';
import path from 'path';

export interface SFTPConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: Buffer | string;
  remoteDir: string;
  retries?: number;
}

export async function uploadFileSFTP(
  localFilePath: string,
  config: SFTPConfig
): Promise<string> {

  
  const retries = config.retries ?? 3;

  const today = new Date().toISOString().split('T')[0];

  const remoteDir = `${config.remoteDir}/${today}`;

  const remoteFilePath = path.posix.join(
    remoteDir,
    path.basename(localFilePath)
  );

  for (let attempt = 1; attempt <= retries; attempt++) {

    const sftp = new SFTPClient();

    try {
      console.log(`SFTP Attempt ${attempt}/${retries}`);

      await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey
    });

      // create remote folder if not exists
      await sftp.mkdir(remoteDir, true);

      console.log(`Uploading → ${remoteFilePath}`);

      await sftp.put(localFilePath, remoteFilePath);

      console.log('Upload success:', remoteFilePath);

      return remoteFilePath;

    } catch (err) {
      console.error(`Upload failed (attempt ${attempt}):`, err);

      if (attempt === retries) {
        throw err;
      }

      await new Promise(res =>
        setTimeout(res, 2000 * attempt)
      );
      } finally {
      try {
      await sftp.end();
    } catch (err) {
      console.error('SFTP close error:', err);
    }
    }
  }

  throw new Error('Upload failed');

} 
