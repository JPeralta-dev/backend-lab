-- TODO: lo escribo yo
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    balance INT,
    version VARCHAR(10)
)

UPDATE account
SET balance = balance - 1
WHERE id = 1

BEGIN;
SELECT id, balance FROM account WHERE id = 1 FOR UPDATE;
UPDATE account SET balance = balance - 1 WHERE id = 1;
COMMIT;

