
import Express, { Response, Request } from "express"
import crypto from "bcryptjs"


const app = Express()

const PORT = 3000

app.get("/heath", (req:Request,res:Response) => {
    res.status(200).json({ "message": "Ok" })
})

app.get("/hash", (req: Request, res: Response) => {
    const iteration = 5_000_000
    const salt = 12
    const password = "dkEGh1xiBF7P"
    // for (let index = 0; index < iteration; index++) {
    //     crypto.hashSync(password,salt)
    // }

    const hash = crypto.hashSync(password,salt)
    res.status(200).json({ "message": hash})
})


app.listen(PORT,() => {
    console.log(`http://localhost:${PORT}/`);
})