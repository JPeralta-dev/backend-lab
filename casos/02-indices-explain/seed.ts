import { Client } from "pg";
import { faker } from "@faker-js/faker";

const config = {
    connectionString: process.env.DATABASE_URL || "postgres://lab:lab@localhost:5432/backend_lab"
};

const CATEGORIES = [
    "food",
    "electronics",
    "clothing",
    "entertainment",
    "health",
    "utilities",
    "travel",
    "education"
];

async function seed() {
    const client = new Client(config);
    await client.connect();

    console.log("🚀 Iniciando creación de tabla y limpieza...");
    await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // Limpiar tabla antes de seedear
    await client.query(`TRUNCATE TABLE transactions RESTART IDENTITY;`);

    const TOTAL_ROWS = 500_000;
    const BATCH_SIZE = 5_000;
    const TOTAL_BATCHES = TOTAL_ROWS / BATCH_SIZE;

    console.log(`📦 Insertando ${TOTAL_ROWS.toLocaleString()} filas en ${TOTAL_BATCHES} lotes de ${BATCH_SIZE.toLocaleString()}...`);
    console.time("⏱️ Tiempo total de seed");

    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2026, 0, 1);

    for (let batch = 1; batch <= TOTAL_BATCHES; batch++) {
        const values: any[] = [];
        const placeholders: string[] = [];

        for (let i = 0; i < BATCH_SIZE; i++) {
            const offset = i * 4;
            const userId = faker.number.int({ min: 1, max: 10_000 });
            const amount = parseFloat(faker.finance.amount({ min: 1, max: 5000, dec: 2 }));
            const category = faker.helpers.arrayElement(CATEGORIES);
            const createdAt = faker.date.between({ from: startDate, to: endDate });

            values.push(userId, amount, category, createdAt);
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
        }

        const queryText = `
            INSERT INTO transactions (user_id, amount, category, created_at)
            VALUES ${placeholders.join(", ")};
        `;

        await client.query(queryText, values);

        if (batch % 10 === 0 || batch === TOTAL_BATCHES) {
            const percent = ((batch / TOTAL_BATCHES) * 100).toFixed(0);
            console.log(`⏳ Progreso: ${percent}% (${(batch * BATCH_SIZE).toLocaleString()} / ${TOTAL_ROWS.toLocaleString()} filas)`);
        }
    }

    console.timeEnd("⏱️ Tiempo total de seed");
    const countResult = await client.query("SELECT COUNT(*) FROM transactions;");
    console.log(`✅ Seed finalizado con éxito. Total de registros en DB: ${countResult.rows[0].count}`);

    await client.end();
}

seed().catch((err) => {
    console.error("❌ Error ejecutando el seed:", err);
    process.exit(1);
});
