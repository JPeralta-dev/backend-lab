// TODO: lo escribo yo
import { Client } from "pg"


const config = {
    user: "lab",
    password: "lab",
    host: "localhost",
    port: 5432,
    database: "backend_lab",
    query_timeout: 1000,
    connectionTimeoutMillis: 80000
}

export const client = new Client(config)

await client.connect()
    .then(() => {
        console.log("Connection correctly");
    })
    .catch((reason) => {
        console.log(reason);
        
    })

await client.end()
    .then(() => {
        console.log("bay bay database closed");

    }).catch(() => {
        console.log("Hubo un error al cerra la conexion");
        
    })
