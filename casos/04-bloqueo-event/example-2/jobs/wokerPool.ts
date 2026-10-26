import { Worker } from "node:worker_threads"
import { JobStatus, Stats, WorkerResponse } from "../types/jobs.type.js";
import { uuidv7 } from "uuidv7"

type JobRecord = {
    id: string;
    status: "pending" | "running" | "done" | "failed";
    result?: Stats;
    error?: string;
    createdAt: number;
};

type PoolWorker = {
    id: number,
    worker: Worker,
    busy: boolean
}

export type queueJob = {
    jobId: string,
    job: number[]
}

type PendingJob = {
    resolve: (value: Stats) => void,
    reject: (reason?: any) => void,
    timer: NodeJS.Timeout
}
export class WokerPool {

    public workers: PoolWorker[] = [];
    
    public queue: queueJob[]
    private jobRecord: Map<string, JobRecord>

    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.createWorker(i)
        }
        this.queue = []
        this.jobRecord = new Map<string, JobRecord>()
    }

    run(payload: number[]) {
        const jobId = uuidv7()

        this.jobRecord.set(jobId, {
            id: jobId,
            status: "pending",
            createdAt: Date.now()
        })
        
        this.queue.push({ jobId, job: payload }) 
        
        this.processQueue()

        return jobId
    }

    getStatusWorker(id: number) {
        return this.workers.find((value, i) => {
            if (value.id === id) return value
        })
    }

    getStatusJob(JobId: string | undefined) {
        if (!JobId) return
        console.log(this.jobRecord.get(JobId));
        
        return this.jobRecord.get(JobId)
    }

    getSize() {
        return this.size
    }

    resolveJob(queueJob: queueJob) {
        const freeWorker = this.workers.find((w) => !w.busy)
        if (!freeWorker) return

        console.log(queueJob,"aqui llego a resolverse");
        

        const job = this.jobRecord.get(queueJob.jobId)
        if (job) job.status = "running"

        freeWorker.busy = true
        freeWorker.worker.postMessage(queueJob)

        console.log(this.jobRecord.get(queueJob.jobId));

    }

    processQueue() {
        if (this.queue.length === 0) return
        const freeWorker = this.workers.find((w) => !w.busy)
        console.log(freeWorker);
        
        if (!freeWorker) return
        const job = this.queue.shift()
        console.log(job);
        
        if (job) this.resolveJob(job)
    }

    private createWorker(index: number) {

        const worker = new Worker(new URL("../service/worker.stats.ts", import.meta.url))

        const poolWooker = { id: index, worker, busy: false }

        worker.on("message", (response: WorkerResponse) => {
            const { jobId } = response

            const job = this.jobRecord.get(jobId)

            if (job) {
                if (response.ok) {
                    job.status = "done"
                    job.result = response.result
                } else {
                    job.status = "failed"
                    job.error = response.error
                }
            }

            poolWooker.busy = false

            //this.jobRecord.delete(jobId)

            this.processQueue()
        })

        worker.on("error", (error) => {
            console.log(error);
        })

        worker.on("exit", () => {

        })

        this.workers.push(poolWooker)
    }
}