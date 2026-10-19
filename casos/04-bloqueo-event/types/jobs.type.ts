type JobMessage = { jobId: string; payload: number[] };

type WorkerResponse =
  | { jobId: string; ok: true; result: any }
  | { jobId: string; ok: false; error: string };