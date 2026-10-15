import { Worker } from "worker_threads"

export const threadSecundary = (password: string, salt: number = 16) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), { workerData: { password, salt } })
        worker.once('message', resolve)
        worker.once('error', reject)
    })
}