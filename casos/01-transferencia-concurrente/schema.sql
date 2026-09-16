
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


UPDATE account
SET balance =  balance - 2700, version = v2
WHERE id = 5
AND version v1
