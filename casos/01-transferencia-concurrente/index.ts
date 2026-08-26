// TODO: lo escribo yo
import { Client } from "pg"


const config = {
    user: "lab",
    password: "lab",
    host: "localhost",
    port: 5432,
    database: "backend_lab",
    connectionTimeoutMillis: 80000
}

export const client = new Client(config)

const query = `CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    balance INT,
    version VARCHAR(10)
)
`
await client.connect()
const response = await client.query('SELECT NOW()')
    .then(() => {
    console.log('TODO CORRECTO');
    
    
})


console.log(response);

await client.end()

