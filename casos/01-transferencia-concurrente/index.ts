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

const clientA = new Client(config)
const clientB = new Client(config)

const createTableQuery = `
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    balance INT,
    version VARCHAR(10)
)
`

const createStockQuery = `
    INSERT INTO account (balance, version)
    VALUES
        (1000, 'v1'),
        (2500, 'v1'),
        (500, 'v2'),
        (7500, 'v1')
`
await clientA.connect()
// const response = await client.query(createStockQuery)
//     .then(() => {
//     console.log('TODO CORRECTO');  
//     }).catch((reason) => {
//     console.log('salio algo raro ' + reason);
    
// })

const result = await clientA.query(`SELECT * FROM account`)
 console.log(result.rows);
await clientA.end()

const queryWithoutSecurityA = ``
const queryWithoutSecurityB = ``


async function paralelTransaction(query:string) {
    await Promise.all([
        clientA.query(query),
        clientB.query(query)
  ])  
}

