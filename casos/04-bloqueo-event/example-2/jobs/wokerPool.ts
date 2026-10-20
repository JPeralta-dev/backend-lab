import { Worker } from "node:worker_threads"
import { JobStatus, Stats, WorkerResponse } from "../types/jobs.type.js";
import {uuidv7} from "uuidv7"
import { resolve } from "node:path";


type PoolWorker = {
    id: number,
    worker: Worker,
    busy: boolean
}

type PendingJob = {
    resolve: (value: Stats) => void,
    reject: (reason?: any) => void,
    timer: NodeJS.Timeout
}
export class WokerPool {

    private workers: PoolWorker[] = [];
    private jobs: Map<string, PendingJob>

    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.createWorker(i)
        }
        this.jobs = new Map<string, PendingJob>( );
    }

    run(payload: number[]) {
        const jobId = uuidv7()
        const jobPromise = new Promise<PendingJob>((resolve, reject) => {
            this.jobs.set(jobId,{resolve, reject,})
        })

        const freeWorker = this.workers.find((value) => { value.busy === false })
        
        freeWorker?.worker.postMessage({ jobId, payload })
        
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