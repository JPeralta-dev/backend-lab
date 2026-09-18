import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Configuración base del pool
const poolConfig = {
  connectionString: process.env.DATABASE_URL || "postgres://lab:lab@localhost:5432/backend_lab",
  max: 20, // Máximo 20 clientes concurrentes en el pool
  connectionTimeoutMillis: 2000, // Tiempo límite de espera antes de lanzar error de timeout
  idleTimeoutMillis: 30000,
};

const pool = new Pool(poolConfig);

async function main() {
  console.log("🚀 Iniciando prueba de estrés sobre el Connection Pool...");
  console.log(`⚙️ Configuración del pool: max = ${poolConfig.max}, timeout = ${poolConfig.connectionTimeoutMillis}ms`);

  const TOTAL_REQUESTS = 150;

  // TODO: Escribe aquí la simulación de 150 peticiones simultáneas:
  // 1. Lanza 150 tareas concurrentes (puedes usar Promise.allSettled).
  // 2. Cada tarea debe pedir una conexión al pool (o hacer un query simulando latencia, ej. "SELECT pg_sleep(0.1)").
  // 3. Mide cuántas peticiones terminan con éxito y cuántas fallan por timeout.
  // 4. Mide los tiempos de espera y latencia.
  // 5. Imprime un resumen de métricas (éxitos, fallos, códigos de error).

  await pool.end();
}

main().catch((err) => {
  console.error("Error fatal en la ejecución:", err);
  process.exit(1);
});
