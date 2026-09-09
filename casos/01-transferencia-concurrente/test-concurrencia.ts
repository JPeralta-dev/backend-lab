import { Client } from "pg";
import "dotenv/config";

const config = {
  user: process.env.DB_USER || "lab",
  password: process.env.DB_PASSWORD || "lab",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "backend_lab",
  connectionTimeoutMillis: 10000,
};

// Dos clientes con conexiones independientes para simular concurrencia real
const clientA = new Client(config);
const clientB = new Client(config);

async function resetAccount(client: Client) {
  await client.query(`DROP TABLE IF EXISTS account;`);
  await client.query(`
    CREATE TABLE account (
      id INT PRIMARY KEY,
      balance INT NOT NULL,
      version INT NOT NULL DEFAULT 1
    );
  `);
  await client.query(`INSERT INTO account (id, balance, version) VALUES (1, 100, 1);`);
}

async function getBalance(client: Client): Promise<{ id: number; balance: number; version: number }> {
  const res = await client.query(`SELECT id, balance, version FROM account WHERE id = 1;`);
  return res.rows[0];
}

// ============================================================================
// VARIANTE 1: Sin protección (Read-Modify-Write ingenuo en Node.js)
// Problema: Lost Update (ambos leen 100, ambos calculan 20, se pierden 80 dólares)
// ============================================================================
async function transferWithoutProtection(client: Client, clientName: string, amount: number) {
  // 1. Lee saldo a memoria de Node
  const res = await client.query(`SELECT balance FROM account WHERE id = 1;`);
  const currentBalance = res.rows[0].balance;

  // Pequeña pausa para garantizar que ambos clientes lean antes de escribir
  await new Promise((r) => setTimeout(r, 20));

  // 2. Valida en JavaScript
  if (currentBalance >= amount) {
    const newBalance = currentBalance - amount;
    // 3. Sobrescribe el valor
    await client.query(`UPDATE account SET balance = $1 WHERE id = 1;`, [newBalance]);
    return `${clientName}: Éxito (Transfirió $${amount})`;
  } else {
    return `${clientName}: Fallo (Saldo insuficiente)`;
  }
}

// ============================================================================
// VARIANTE 2: Pessimistic Locking (SELECT ... FOR UPDATE)
// Mecanismo: Bloqueo de fila. El 2do cliente espera al COMMIT del 1ero.
// Al desbloquear, lee el nuevo saldo ($20) y falla por saldo insuficiente.
// ============================================================================
async function transferWithForUpdate(client: Client, clientName: string, amount: number) {
  try {
    await client.query("BEGIN;");
    const res = await client.query(`SELECT balance FROM account WHERE id = 1 FOR UPDATE;`);
    const currentBalance = res.rows[0].balance;

    if (currentBalance >= amount) {
      await client.query(`UPDATE account SET balance = balance - $1 WHERE id = 1;`, [amount]);
      await client.query("COMMIT;");
      return `${clientName}: Éxito (Transfirió $${amount})`;
    } else {
      await client.query("ROLLBACK;");
      return `${clientName}: Fallo (Saldo insuficiente: tenía $${currentBalance}, requería $${amount})`;
    }
  } catch (error) {
    await client.query("ROLLBACK;");
    throw error;
  }
}

// ============================================================================
// VARIANTE 3: Optimistic Locking (version)
// Mecanismo: Condiciona el UPDATE a que la version coincida.
// El 1ero incrementa version (1 -> 2). El 2do obtiene rowCount = 0 (409 Conflict).
// ============================================================================
async function transferWithOptimisticLock(client: Client, clientName: string, amount: number) {
  const res = await client.query(`SELECT balance, version FROM account WHERE id = 1;`);
  const { balance, version } = res.rows[0];

  if (balance < amount) {
    return `${clientName}: Fallo (Saldo insuficiente)`;
  }

  // Intenta actualizar solo si la versión sigue siendo la que leyó
  const updateRes = await client.query(
    `UPDATE account 
     SET balance = balance - $1, version = version + 1 
     WHERE id = 1 AND version = $2;`,
    [amount, version]
  );

  if (updateRes.rowCount === 0) {
    return `${clientName}: Fallo 409 Conflict (Colisión concurrente: la versión ya no es ${version})`;
  }

  return `${clientName}: Éxito (Transfirió $${amount})`;
}

// ============================================================================
// VARIANTE 4: UPDATE Atómico (WHERE balance >= amount)
// Mecanismo: El motor de Postgres evalúa la condición al escribir.
// No requiere transacciones manuales ni control de versiones en la app.
// ============================================================================
async function transferWithAtomicUpdate(client: Client, clientName: string, amount: number) {
  const res = await client.query(
    `UPDATE account 
     SET balance = balance - $1 
     WHERE id = 1 AND balance >= $1;`,
    [amount]
  );

  if (res.rowCount === 0) {
    return `${clientName}: Fallo (Saldo insuficiente evaluado por la BD)`;
  }

  return `${clientName}: Éxito (Transfirió $${amount})`;
}

// ============================================================================
// EJECUTOR DE LAS 4 VARIANTES
// ============================================================================
async function main() {
  await clientA.connect();
  await clientB.connect();

  console.log("==================================================================");
  console.log("  CASO 01: PRUEBA CONCURRENTE (2 x $80 contra cuenta de $100)");
  console.log("==================================================================\n");

  // PRUEBA 1
  console.log("--- VARIANTE 1: Sin protección (Lost Update) ---");
  await resetAccount(clientA);
  const r1 = await Promise.all([
    transferWithoutProtection(clientA, "Cliente A", 80),
    transferWithoutProtection(clientB, "Cliente B", 80),
  ]);
  console.log(r1.join("\n"));
  console.log("Estado DB:", await getBalance(clientA));
  console.log("-> Explicación: Ambos leyeron $100 y ambos guardaron $20. Se perdieron $80!\n");

  // PRUEBA 2
  console.log("--- VARIANTE 2: FOR UPDATE (Pessimistic Lock) ---");
  await resetAccount(clientA);
  const r2 = await Promise.all([
    transferWithForUpdate(clientA, "Cliente A", 80),
    transferWithForUpdate(clientB, "Cliente B", 80),
  ]);
  console.log(r2.join("\n"));
  console.log("Estado DB:", await getBalance(clientA));
  console.log("-> Explicación: Cliente B esperó al lock. Al entrar, el saldo era $20 y fue rechazado.\n");

  // PRUEBA 3
  console.log("--- VARIANTE 3: Optimistic Locking (version) ---");
  await resetAccount(clientA);
  const r3 = await Promise.all([
    transferWithOptimisticLock(clientA, "Cliente A", 80),
    transferWithOptimisticLock(clientB, "Cliente B", 80),
  ]);
  console.log(r3.join("\n"));
  console.log("Estado DB:", await getBalance(clientA));
  console.log("-> Explicación: El primero subió a version=2. El segundo obtuvo rowCount=0 (409 Conflict).\n");

  // PRUEBA 4
  console.log("--- VARIANTE 4: UPDATE Atómico (WHERE balance >= amount) ---");
  await resetAccount(clientA);
  const r4 = await Promise.all([
    transferWithAtomicUpdate(clientA, "Cliente A", 80),
    transferWithAtomicUpdate(clientB, "Cliente B", 80),
  ]);
  console.log(r4.join("\n"));
  console.log("Estado DB:", await getBalance(clientA));
  console.log("-> Explicación: El motor evaluó atómicamente '20 >= 80' como falso en la segunda query.\n");

  await clientA.end();
  await clientB.end();
}

main().catch((err) => {
  console.error("Error ejecutando pruebas:", err);
  clientA.end().catch(() => {});
  clientB.end().catch(() => {});
});
