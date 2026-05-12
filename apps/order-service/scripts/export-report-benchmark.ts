import 'dotenv/config';

type Row = {
  staffId: string;
  staffName: string;
  inviteClicks: number;
  newUsers: number;
  orderContributions: number;
  conversionRatePct: number;
};

function buildRows(count: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < count; i += 1) {
    const inviteClicks = 10 + (i % 200);
    const newUsers = Math.floor(inviteClicks * 0.35);
    const orderContributions = Math.floor(newUsers * 0.6);
    const conversionRatePct =
      inviteClicks === 0 ? 0 : Math.round((newUsers / inviteClicks) * 100);
    rows.push({
      staffId: `staff_${i}`,
      staffName: `Staff ${i}`,
      inviteClicks,
      newUsers,
      orderContributions,
      conversionRatePct,
    });
  }
  return rows;
}

function buildCsv(rows: Row[]): string {
  const header =
    'staffId,staffName,inviteClicks,newUsers,orderContributions,conversionRatePct';
  const body = rows
    .map(
      (r) =>
        `${r.staffId},${r.staffName},${r.inviteClicks},${r.newUsers},${r.orderContributions},${r.conversionRatePct}`,
    )
    .join('\n');
  return `${header}\n${body}`;
}

async function main() {
  const started = Date.now();
  const rows = buildRows(100_000);
  const csv = buildCsv(rows);
  const elapsedMs = Date.now() - started;
  const pass = elapsedMs < 30_000;
  console.log(
    JSON.stringify(
      {
        rows: rows.length,
        bytes: Buffer.byteLength(csv, 'utf8'),
        elapsedMs,
        thresholdMs: 30000,
        pass,
      },
      null,
      2,
    ),
  );
  if (!pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
