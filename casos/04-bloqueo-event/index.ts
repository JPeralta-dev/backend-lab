
import Express, { Response, Request } from "express"
import { threadSecundary } from "./example-1/service.hash.js";
import { WokerPool } from "./example-2/jobs/wokerPool.js";
import { generateBigNumbers } from "./example-2/service/generateNumbers.js";

const app = Express()

const pool = new WokerPool(2)

const PORT = 3000

app.get("/health", (req: Request, res: Response) => {
    const response = {
        workers: pool.getSize(),
        busy: pool.workers.filter((w) => w.busy).length,
        queued: pool.queue.length
    }
    res.status(200).json({ "message": response })
})

app.get("/hash", async (req: Request, res: Response) => {
    try {
        const salt = 16
        const password = "dkEGh1xiBF7PsdgsdihjljnKJWDSFLKJHADSLKJFHASDX223"
        const hash = await threadSecundary(password, salt)
        res.status(200).json({ "message": hash })
    } catch (error) {
        console.log(error);
        res.json({ error }).status(500)
    }
})

app.post("/reports", (req: Request, res: Response) => {
    if (pool.queue.length >= 20) {
         return res.status(429).json({ error: "Server busy, queue is full. Try again later." });
    }
    const numbers = generateBigNumbers(); // o los que vengan en req.body

    const jobId = pool.run(numbers);
    return res.status(202).json({ jobId });

})

app.get("/reports/:id", (req: Request, res: Response) => {
    const id = req.params.id
    const job = pool.getStatusJob(id as string)
    console.log(job);

    if (!job) return res.status(404).json({ "error": "job not found" })

    res.status(200).json({ "message": job })
})


app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}/`);
})