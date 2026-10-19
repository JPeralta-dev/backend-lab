import { Worker } from "node:worker_threads"

type PoolWorker = {
    id: number,
    worker: Worker,
    busy: boolean
}

export class WokerPool {
     
    private workers: PoolWorker[] = [];

  
    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.createWorker(i)
        }
    }

    run() { }
    
    getStatus(id: string) { }
    
    private createWorker(index: number) {
        this.workers.push({ id: index, worker: new Worker(new URL("../service/worker.stats.ts",import.meta.url)), busy: false })
    }
}