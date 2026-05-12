import 'dotenv/config';

type JobStatus = 'SUCCESS' | 'FAILED';

type SimResult = {
  total: number;
  success: number;
  failed: number;
  successRatePct: number;
  elapsedMs: number;
  thresholdPct: number;
  pass: boolean;
};

function simulatePrintPipeline(totalJobs: number): SimResult {
  const started = Date.now();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < totalJobs; i += 1) {
    // Inject deterministic fault pattern:
    // - every 173rd job has temporary network fault
    // - every 997th job has printer offline fault
    const networkFault = i % 173 === 0;
    const printerOfflineFault = i % 997 === 0;

    let status: JobStatus = 'SUCCESS';
    let retry = 0;
    const maxRetry = 3;
    while (retry <= maxRetry) {
      const stillFailing =
        printerOfflineFault || (networkFault && retry < maxRetry);
      if (!stillFailing) {
        status = 'SUCCESS';
        break;
      }
      retry += 1;
      if (retry > maxRetry) {
        status = 'FAILED';
      }
    }
    if (status === 'SUCCESS') success += 1;
    else failed += 1;
  }

  const elapsedMs = Date.now() - started;
  const successRatePct = Number(((success / Math.max(totalJobs, 1)) * 100).toFixed(4));
  const thresholdPct = 99.5;
  return {
    total: totalJobs,
    success,
    failed,
    successRatePct,
    elapsedMs,
    thresholdPct,
    pass: successRatePct >= thresholdPct,
  };
}

function parseJobsArg(): number {
  const arg = process.argv.find((x) => x.startsWith('--jobs='));
  if (!arg) return 100_000;
  const parsed = Number(arg.split('=')[1] ?? '100000');
  if (!Number.isFinite(parsed) || parsed <= 0) return 100_000;
  return Math.floor(parsed);
}

function main() {
  const jobs = parseJobsArg();
  const result = simulatePrintPipeline(jobs);
  console.log(
    JSON.stringify(
      {
        mode: 'chaos-benchmark',
        ...result,
      },
      null,
      2,
    ),
  );
  if (!result.pass) process.exit(1);
}

main();
