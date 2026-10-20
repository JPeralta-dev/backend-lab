export type JobMessage = { jobId: string; payload: number[] };

export type WorkerResponse =
  | { jobId: string; ok: true; result: any }
  | { jobId: string; ok: false; error: string }


export type JobStatus = "pending" | "running" | "done" | "failed"


export type Stats = { avg: number, med: number, std: number, p95: number }