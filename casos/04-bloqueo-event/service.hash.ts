import { Worker } from "worker_threads"

export const threadSecundary = (password: string, salt: number = 16) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./hashWorker.js',import.meta.url), { workerData: { password, salt } })
        worker.once('message', resolve)
        worker.once('error', reject)
        worker.once('exit', (code) => {
            console.log(`este es el codigo con el que finalizo ${code}`)
        })
    })
}