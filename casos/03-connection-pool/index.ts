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

  // 1. Lanza 150 tareas concurrentes (puedes usar Promise.allSettled). ✅
  // 2. Cada tarea debe pedir una conexión al pool (o hacer un query simulando latencia, ej. "SELECT pg_sleep(0.1)").✅
  // 3. Mide cuántas peticiones terminan con éxito y cuántas fallan por timeout.✅
  // 4. Mide los tiempos de espera y latencia.✅
  // 5. Imprime un resumen de métricas (éxitos, fallos, códigos de error).

  const TOTAL_REQUESTS = 150;
  const REQUEST = `SELECT * FROM transactions WHERE created_at BETWEEN '2025-01-14' AND '2025-06-14'`

  const executeMetrics = async (id: number) => {
    const start = performance.now()
    try {
      const result = await pool.query(REQUEST)

      const end = performance.now()
      return {
        id,
        result,
        success: true,
        time: end - start
      }
    } catch (error) {
      const end = performance.now();
      return {
        id,
        error,
        success: false,
        time: end - start
      }
    }
  }
  const taks = []
  // TODO: Escribe aquí la simulación de 150 peticiones simultáneas:

  for (let index = 0; index < TOTAL_REQUESTS; index++) {
    taks.push(executeMetrics(index))
  }

  const resultado = await Promise.allSettled(taks)

  const failed = resultado.filter(
    (item) => item.status === "fulfilled" && !item.value.success
  );

  const successful = resultado.filter(
    (item) => item.status === "fulfilled" && item.value.success
  );

  const TotalTtime = resultado.map((item) => { if (item.status === "fulfilled") { return item.value.time } return 0 })

  const avrg = TotalTtime.length > 0 ? TotalTtime.filter((i) => i != 0).reduce((sum, time) => sum + time, 0) / TotalTtime.length : 0

  console.log(`Las request que fueron ejecutadas correctamente fueron: ${successful.length}`);
  console.log(`Las request que fueron ejecutadas con error fueron: ${failed.length}`);
  console.log(`Estos fueron las request que lograron ejectuarse: ${resultado.map((i) => i.status === "fulfilled").length}`)
  console.log(`Tiempo promedio en el cual se ejecuto cada query: ${avrg.toFixed(2)}`);


  const errorSummary: Record<string, number> = {};
  for (const item of failed) {
    if (item.status === "fulfilled") {
      const errMsg = (item.value.error as any)?.message || "Unknown error";
      errorSummary[errMsg] = (errorSummary[errMsg] || 0) + 1;
    }
  }
  console.log("Desglose de errores:", errorSummary);
  await pool.end();
}

main().catch((err) => {
  console.error("Error fatal en la ejecución:", err);
  process.exit(1);
});
