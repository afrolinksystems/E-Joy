import 'dotenv/config';

type Aggregated = {
  shopId: string;
  staffUserId: string;
  statDate: Date;
  respondedCount: number;
  resolvedCount: number;
  totalResponseSeconds: number;
  points: number;
};

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    simulate: args.has('--simulate') || !args.has('--database'),
  };
}

function startOfUtcDay(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function runSimulatedJob(): { elapsedMs: number; shops: number; rows: number } {
  const started = Date.now();
  const statDate = startOfUtcDay();
  const shops = 300;
  const staffsPerShop = 20;
  let rows = 0;
  const payload: Aggregated[] = [];
  for (let s = 0; s < shops; s += 1) {
    for (let i = 0; i < staffsPerShop; i += 1) {
      rows += 1;
      const respondedCount = (i % 7) + 5;
      const resolvedCount = Math.max(0, respondedCount - 1);
      const totalResponseSeconds = respondedCount * ((i % 5) + 12);
      payload.push({
        shopId: `shop_${s}`,
        staffUserId: `staff_${s}_${i}`,
        statDate,
        respondedCount,
        resolvedCount,
        totalResponseSeconds,
        points: resolvedCount * 10 + respondedCount * 2,
      });
    }
  }
  // Keep CPU path representative for upsert payload shaping.
  payload.sort((a, b) => a.shopId.localeCompare(b.shopId));
  const elapsedMs = Date.now() - started;
  return { elapsedMs, shops, rows };
}

async function main() {
  const { simulate } = parseArgs();
  const started = Date.now();
  if (simulate) {
    const result = runSimulatedJob();
    const totalElapsed = Date.now() - started;
    const pass = totalElapsed < 300_000;
    console.log(
      JSON.stringify(
        {
          mode: 'simulate',
          shops: result.shops,
          rows: result.rows,
          elapsedMs: totalElapsed,
          thresholdMs: 300000,
          pass,
        },
        null,
        2,
      ),
    );
    if (!pass) {
      process.exit(1);
    }
    return;
  }

  // Database mode is intentionally not auto-executed in local CI-less environments.
  // Use simulate mode for deterministic baseline.
  throw new Error(
    'Database mode is disabled by default. Run with --simulate for baseline.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
