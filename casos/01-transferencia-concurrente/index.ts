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
const clientC = new Client(config)

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


// Comportamiento sin seguridad
const queryWithoutSecurityA = `UPDATE account
SET balance = balance - 1000
WHERE id = 1`

// Comportamiento con FOR UPDATE 
const queryWithLockRowA = `BEGIN;
SELECT id, balance FROM account WHERE id = 1 FOR UPDATE;
UPDATE usuario SET balance = balance - 1000 WHERE id = 1;
COMMIT;
`


async function paralelTransaction(query: string) {
    console.log('Entre en la funcion vamos a empezar ');
    
    console.time('bunch-of-stuff')
    Promise.all([
        clientA.query(query),
        clientB.query(query),
        clientC.query(query)
    ])
    
        .then((values) => {
        console.log("Se realizaron las dos trasacciones");
        console.log(values);
        
        })
        .catch((err) => {
        console.error(err)
        
        })
    
    console.timeEnd('bunch-of-stuff')
    
}

//await paralelTransaction(queryWithLockRowA)

//clientA.query('SELECT * FROM account')

await clientA.end()