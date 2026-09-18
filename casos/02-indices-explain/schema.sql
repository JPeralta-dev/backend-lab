CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices creados para optimizar las consultas del Caso 02
CREATE INDEX IF NOT EXISTS index_transactions_user_id
ON transactions(user_id);

CREATE INDEX IF NOT EXISTS index_transactions_user_create_at
ON transactions(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON transactions(created_at);