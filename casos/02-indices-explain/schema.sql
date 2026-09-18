CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TODO: Aquí escribirás tus sentencias CREATE INDEX más adelante para comparar antes y después
CREATE INDEX index_transactions_user_id
ON transactions(user_id)

CREATE INDEX index_transactions_user_create_at
ON transactions(user_id,created_at)

CREATE INDEX idx_transactions_created_at ON transactions(created_at);