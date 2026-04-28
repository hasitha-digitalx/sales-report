import { db } from './db';

export async function checkDB() {
  try {
    const [result] = await db.execute('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // stop app
  }
}