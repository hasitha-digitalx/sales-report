import { db } from '../config/db';

export interface LotteryReport {
  Code: string;
  AgentName: string;
  lottery_name: string;
  drawNumber: number;
  ReturnDate: string;
  SalesFrom: number | null;
  SalesTo: number | null;
  ReturnsFrom: number | null;
  ReturnsTo: number | null;
  Quantity: number;
}

/* =========================
   1. GET LOTTERY DATA
========================= */

export async function getLotteryData(
  lotteryId: number,
  drawNumber: number
): Promise<LotteryReport[]> {

  const [rows] = await db.execute(
    `
    WITH ticket_data AS (
        SELECT 
            t.serialNumber,
            t.status,

            CASE 
                WHEN t.status = 13 THEN DATE(t.updatedAt)
                ELSE DATE(t.purchasedDate)
            END AS issue_date,

            t.drawNumber,
            t.lotteryId,
            l.name AS lottery_name,

            CASE 
                WHEN t.status IN (6,7,15) THEN 'SALES'
                WHEN t.status = 13 THEN 'RETURNS'
            END AS ticket_type

        FROM Tickets t
        JOIN Lotteries l ON t.lotteryId = l.id

        WHERE t.status IN (6,7,15,13)
          AND t.lotteryId = ?
          AND t.drawNumber = ?
    ),

    range_groups AS (
        SELECT *,
               serialNumber - ROW_NUMBER() OVER (
                    PARTITION BY ticket_type, issue_date 
                    ORDER BY serialNumber
               ) AS grp
        FROM ticket_data
    )

    SELECT
        'E005' AS Code,
        'Lucky1.lk' AS AgentName,
        lottery_name,
        drawNumber,
        issue_date AS ReturnDate,

        CASE WHEN ticket_type='SALES' THEN MIN(serialNumber) END AS SalesFrom,
        CASE WHEN ticket_type='SALES' THEN MAX(serialNumber) END AS SalesTo,

        CASE WHEN ticket_type='RETURNS' THEN MIN(serialNumber) END AS ReturnsFrom,
        CASE WHEN ticket_type='RETURNS' THEN MAX(serialNumber) END AS ReturnsTo,

        COUNT(*) AS Quantity

    FROM range_groups
    GROUP BY ticket_type, issue_date, grp, lottery_name, drawNumber
    ORDER BY issue_date
    `,
    [lotteryId, drawNumber]
  );

  return rows as LotteryReport[];
}

/* =========================
   2. GET TODAY DRAW NUMBER
========================= */

export async function getTodayDraw(lotteryId: number): Promise<number | null> {

  const [rows]: any = await db.execute(
    `
    SELECT drawNumber
    FROM draws
    WHERE lotteryId = ? 
    AND status = 5
    AND DATE(drawDate) = '2020-03-19'
    LIMIT 1;
    `,
    [lotteryId]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  return rows[0].drawNumber;
}




// SELECT drawNumber
// FROM lucky1.draws
// WHERE lotteryId = ?
// AND DATE(drawDate) = CURDATE() - INTERVAL 1 DAY
// LIMIT 1;