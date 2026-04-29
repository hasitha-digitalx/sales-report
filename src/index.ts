import 'dotenv/config'; 
import './config/db';
import './config/sftpConfig';
import { startReportJob } from './jobs/report.job';
import { checkDB } from './config/db.health';

console.log('Starting application...');

(async () => {
  await checkDB(); // IMPORTANT

  startReportJob();

  console.log('App started successfully');
})();