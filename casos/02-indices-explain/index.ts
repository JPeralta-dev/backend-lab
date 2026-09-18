// TODO: lo escribo yo
import { Client } from "pg";
import dotenv from 'dotenv'

dotenv.config()

const config = {
    connectionString: process.env.DATABASE_URL || "postgres://lab:lab@localhost:5432/backend_lab"
}

const client = new Client(config);
await client.connect();

const indexUserId = `CREATE INDEX index_transactions_user_id
ON transactions(user_id)
`
const createIndexUserIdAndCreateAt = `CREATE INDEX index_transactions_user_create_at
ON transactions(user_id,created_at)`

// TODO: Escribe aquí tus 3 queries típicas y ejecútalas con EXPLAIN (ANALYZE, BUFFERS)
// Query 1: Por usuario (ej. userId = X)
console.time("queryBeforeIndex1")
const result1 = await client.query(`EXPLAIN BUFFERS SELECT * FROM transactions 
WHERE id = 10`)
console.log(result1.rows);

console.timeEnd("queryBeforeIndex1")
// Query 2: Por rango de fechas (ej. createdAt BETWEEN Y AND Z)\
console.time("queryBeforeIndex2")
const result2 = await client.query(`
EXPLAIN ANALYZE SELECT * FROM transactions 
WHERE created_at BETWEEN '2025-01-14' AND '2025-06-14'`)
console.log(result2.rows);
console.timeEnd("queryBeforeIndex2")

// Query 3: Por categoría + usuario (ej. category = C AND userId = X)

console.time("queryBeforeIndex3")
const result3 = await client.query(`EXPLAIN ANALYZE SELECT * FROM transactions 
WHERE created_at BETWEEN '2025-01-14' AND '2025-06-14'
AND user_id > 2000`)
console.log(result3.rows);
console.timeEnd("queryBeforeIndex3")

// Recuerda comparar los tiempos y planes antes y después de crear los índices correspondientes.

await client.end();
