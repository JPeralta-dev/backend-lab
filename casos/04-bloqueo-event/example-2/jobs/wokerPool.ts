import { Worker } from "node:worker_threads"
import { JobStatus, Stats, WorkerResponse } from "../types/jobs.type.js";
import { uuidv7 } from "uuidv7"



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
            this.jobs.set(jobId, { resolve, reject, timer: setTimeout(() => { }, 200000) })
        })

        this.queue.push({ jobId, job: payload })

        this.processQueue()

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

    getSize() {
        return this.size
    }

    resolveJob(queueJob: queueJob) {
        const freeWorker = this.workers.find((w) => !w.busy)
        if (!freeWorker) return

        freeWorker.busy = true
        freeWorker.worker.postMessage(queueJob)

    }

    processQueue() {
        if (this.queue.length === 0) return

        const job = this.queue.shift()
        if (job) this.resolveJob(job)
    }

    private createWorker(index: number) {

        const worker = new Worker(new URL("../service/worker.stats.ts", import.meta.url))

        const poolWooker = { id: index, worker, busy: false }

        worker.on("message", (response: WorkerResponse) => {
            const { jobId } = response

            const pending = this.jobs.get(jobId)

            if (pending) {
                if (response.ok) {
                    pending.resolve(response.result)
                }

                pending.reject(new Error("No se pudo procesar"))
            }

            poolWooker.busy = false

            this.jobs.delete(jobId)
            
            this.processQueue()
        })

        worker.on("error", () => { })

        worker.on("exit", () => {

        })

        this.workers.push(poolWooker)
    }
}