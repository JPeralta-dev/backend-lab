import { Worker } from "node:worker_threads"
import { JobStatus, Stats, WorkerResponse } from "../types/jobs.type.js";
import { uuidv7 } from "uuidv7"
import { resolve } from "node:path";


type PoolWorker = {
    id: number,
    worker: Worker,
    busy: boolean
}

type queueJob = {
    jobId: string,
    job: number[]
}

type PendingJob = {
    resolve: (value: Stats) => void,
    reject: (reason?: any) => void,
    timer: NodeJS.Timeout
}
export class WokerPool {

    private workers: PoolWorker[] = [];
    private jobs: Map<string, PendingJob>
    private queue: queueJob[]

    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.createWorker(i)
        }
        this.jobs = new Map<string, PendingJob>();
        this.queue = []
    }

    run(payload: number[]) {
        const jobId = uuidv7()
        const jobPromise = new Promise<Stats>((resolve, reject) => {
            this.jobs.set(jobId, { resolve, reject, timer: setTimeout(()=>{},200000) })
        })

        const freeWorker = this.workers.find((w) => !w.busy)

        if (freeWorker) {
            freeWorker.busy = true
            freeWorker.worker.postMessage({jobId,payload})
        } else {
            this.queue.push({ jobId , job:payload})
        }

        return jobPromise
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