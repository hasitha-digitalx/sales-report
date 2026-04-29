import 'dotenv/config'; 
import { startReportJob } from './jobs/report.job';
import { checkDB } from './config/db.health';

console.log('Starting application...');

(async () => {
  try {
    await checkDB();

    startReportJob();

    console.log('App started successfully');
  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1); 
  }
})();