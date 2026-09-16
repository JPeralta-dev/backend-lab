// TODO: lo escribo yo
import { Client } from "pg";

const config = {
    user: "lab",
    password: "lab",
    host: "localhost",
    port: 5432,
    database: "backend_lab",
};

const client = new Client(config);
await client.connect();

// TODO: Escribe aquí tus 3 queries típicas y ejecútalas con EXPLAIN (ANALYZE, BUFFERS)
// Query 1: Por usuario (ej. userId = X)
// Query 2: Por rango de fechas (ej. createdAt BETWEEN Y AND Z)
// Query 3: Por categoría + usuario (ej. category = C AND userId = X)
//
// Recuerda comparar los tiempos y planes antes y después de crear los índices correspondientes.

await client.end();
