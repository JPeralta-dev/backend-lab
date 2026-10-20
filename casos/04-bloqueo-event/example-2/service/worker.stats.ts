import { Worker, parentPort } from "node:worker_threads";
import {queueJob} from "../jobs/wokerPool.js"


parentPort?.on("message", (queueJob: queueJob) => {
    
    
    parentPort?.postMessage({})
})