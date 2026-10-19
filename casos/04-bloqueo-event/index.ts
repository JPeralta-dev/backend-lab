
import Express, { Response, Request } from "express"
import { threadSecundary } from "./service.hash.js";

const app = Express()

const PORT = 3000

app.get("/heath", (req:Request,res:Response) => {
    res.status(200).json({ "message": "Ok" })
})

app.get("/hash", async (req: Request, res: Response) => {
    try {
        const salt = 16
    const password = "dkEGh1xiBF7P"
    const hash = await threadSecundary(password,salt)
    res.status(200).json({ "message": hash})
    } catch (error) {
        console.log(error);
        res.json({error}).status(500)
    }
})


app.listen(PORT,() => {
    console.log(`http://localhost:${PORT}/`);
})