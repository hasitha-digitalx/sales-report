import { lotteryCodeMap } from './lotteryMap';

const DEALER_CODE = 'E005';

// 2026.02.17
export function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

// 2026.02.17 08.56.45
export function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
}

// lottery code mapping)
export function getLotteryCode(lotteryId: number): string {
  return lotteryCodeMap[lotteryId] || 'UNKNOWN_LOTTERY';
}

// PDF / TXT
export function buildFileName(lotteryId: number, drawNumber: number, type: 'PDF' | 'TXT'): string {

  const code = getLotteryCode(lotteryId);
  const date = formatDate(new Date());

  return `${DEALER_CODE} Sales ${code}${drawNumber} ${date}.${type.toLowerCase()}`;
}

// ZIP
export function buildZipName(lotteryId: number, drawNumber: number): string {

  const code = getLotteryCode(lotteryId);
  const dateTime = formatDateTime(new Date());

  return `${DEALER_CODE} Sales ${code}${drawNumber} ${dateTime}.zip`;
}