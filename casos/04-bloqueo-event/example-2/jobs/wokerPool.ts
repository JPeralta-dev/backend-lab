import { Worker } from "node:worker_threads"
import { JobStatus, WorkerResponse } from "../types/jobs.type.js";

type PoolWorker = {
    id: number,
    worker: Worker,
    busy: boolean
}

export class WokerPool {

    private workers: PoolWorker[] = [];
    private jobs: Map<string, Promise<JobStatus>>

    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.createWorker(i)
        }
        this.jobs = new Map<string, Promise<JobStatus>>();
    }

    run(payload: number[]): Promise<WorkerResponse> | void {

    }

    getStatusWorker(id: number) {
        return this.workers.find((value, i) => {
            if (value.id === id) return value
        })
    }

    getStatusJob(JobId: string) {
        return this.jobs.get(JobId)
    }
    
    private createWorker(index: number) {
        this.workers.push({ id: index, worker: new Worker(new URL("../service/worker.stats.ts", import.meta.url)), busy: false })
    }
}