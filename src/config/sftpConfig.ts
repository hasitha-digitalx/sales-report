import dotenv from 'dotenv';
dotenv.config();

export const sftpConfig = {
  host: process.env.SFTP_HOST!,
  port: Number(process.env.SFTP_PORT || 22),
  username: process.env.SFTP_USER!,
  password: process.env.SFTP_PASS!,
  remoteDir: process.env.SFTP_REMOTE_DIR!,
  retries: Number(process.env.SFTP_RETRIES || 3)
};


// privateKey: fs.readFileSync('/home/app/.ssh/id_rsa')