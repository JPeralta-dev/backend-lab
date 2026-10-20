import { parentPort } from "node:worker_threads";
import { queueJob } from "../jobs/wokerPool.js"
import { Stats } from "../types/jobs.type.js";


parentPort?.on("message", (queueJob: queueJob) => {

    const result = findStats(queueJob.job)

    parentPort?.postMessage({ jobId: queueJob.jobId, ok: true, result })
})



export function findStats(numbers: number[]): Stats {
    const n = numbers.length;
    if (n === 0) {
        return { avg: 0, med: 0, std: 0, p95: 0 };
    }

    // 1. Promedio (avg)
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += numbers[i];
    }
    const avg = sum / n;

    // 2. Desviación estándar (std)
    let varianceSum = 0;
    for (let i = 0; i < n; i++) {
        const diff = numbers[i] - avg;
        varianceSum += diff * diff;
    }
    const std = Math.sqrt(varianceSum / n);

    // 3. Ordenamiento numérico (obligatorio para mediana y percentil 95)
    // OJO: En JS, arr.sort() sin comparador ordena como texto ("10" antes que "2").
    // Usamos (a, b) => a - b para orden numérico ascendente.
    numbers.sort((a, b) => a - b);

    // 4. Mediana (med)
    let med: number;
    const mid = Math.floor(n / 2);
    if (n % 2 !== 0) {
        med = numbers[mid];
    } else {
        med = (numbers[mid - 1] + numbers[mid]) / 2;
    }

    // 5. Percentil 95 (p95)
    // Posición basada en índice: 95% de la longitud
    const p95Index = Math.min(Math.floor(n * 0.95), n - 1);
    const p95 = numbers[p95Index];

    return { avg, med, std, p95 };
}