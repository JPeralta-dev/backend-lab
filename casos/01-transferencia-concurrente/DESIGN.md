# Preguntas de diseño — Caso 01: Transferencia Concurrente

## 1. ¿Qué garantiza ACID aquí?

Cuando hablamos de una transacción concurrente, nos referimos a que el cambio de estado de un recurso se realiza de manera simultánea dentro del servidor. Teniendo esto claro, existen riesgos de pérdida de integridad de datos y condiciones de carrera (*race conditions*). Para mitigar esto, los motores de bases de datos relacionales implementan las propiedades **ACID**:

* **A (Atomicidad):** Garantiza que todas las operaciones de la transacción se completen con éxito o ninguna se aplique (*todo o nada*).
* **C (Consistencia):** Asegura que los datos pasen de un estado válido a otro, respetando todas las reglas, restricciones (*constraints*) e invariantes del sistema (por ejemplo, que el saldo no quede en negativo si hay una restricción).
* **I (Aislamiento / Isolation):** Asegura que la ejecución concurrente de transacciones resulte en un estado equivalente a si se hubiesen ejecutado de forma secuencial, evitando interferencias entre clientes.
* **D (Durabilidad):** Garantiza que, una vez confirmado el `COMMIT`, los cambios persistan en el almacenamiento no volátil incluso ante caídas del servidor.

---

## 2. ¿Qué isolation level necesito y por qué?

Para la mayoría de operaciones bancarias o de stock concurrentes podemos operar en el nivel por defecto de PostgreSQL (**`READ COMMITTED`**) complementado con bloqueos pesimistas explícitos (`SELECT ... FOR UPDATE`) o actualizaciones atómicas condicionales (`UPDATE ... WHERE`). Si se requiere garantizar que ninguna transacción lea datos modificados concurrentemente sin usar bloqueos manuales, se puede optar por **`SERIALIZABLE`**, el cual aborta con error de serialización (`40001`) aquellas transacciones que entren en conflicto para que el backend las reintente.

---

## 3. ¿Row lock o Table lock?

**Row Lock (bloqueo a nivel de fila):** Es el adecuado porque maximiza la concurrencia en un flujo masivo, bloqueando únicamente los registros específicos que se están modificando (por ejemplo, la cuenta con `id = 1`) y permitiendo que otros clientes operen simultáneamente sobre otras cuentas. Un **Table Lock** bloquearía toda la tabla para todos los usuarios, degradando drásticamente el rendimiento del sistema.

---

## 4. ¿Por qué son inseguras las dos primeras variantes?

### Variante 1: Actualización directa sin validación de saldo

```sql
UPDATE account
SET balance = balance - 1000
WHERE id = 1;
```

**Problema:** Aunque la resta en SQL es atómica, no valida si el saldo actual es suficiente. Si dos o más clientes ejecutan esta sentencia de forma concurrente, el saldo puede caer a valores negativos (ej. `-3000`), vendiendo stock inexistente o sobregirando la cuenta.

### Variante 2: `FOR UPDATE` mal implementado o sin validación

```sql
BEGIN;
SELECT id, balance FROM account WHERE id = 1 FOR UPDATE;
UPDATE account SET balance = balance - 1000 WHERE id = 1;
COMMIT;
```

**Problema:** Si tras adquirir el bloqueo no se valida en la lógica del backend si `balance >= monto_a_debitar` antes de ejecutar el `UPDATE`, todas las transacciones en cola se ejecutarán una tras otra hasta dejar el saldo en negativo.

---

## 5. ¿Por qué las otras dos variantes sí son seguras?

### Variante 3: Optimistic Locking (Bloqueo Optimista por versión)

```sql
UPDATE account
SET balance = balance - 500, version = 'v2'
WHERE id = 5
AND version = 'v1';
```

**Resultado:** Cuando varias peticiones intentan actualizar el registro simultáneamente leyendo la versión `'v1'`, la primera en llegar actualiza el registro y cambia la versión a `'v2'`. Las peticiones posteriores no encontrarán ninguna fila con `version = 'v1'`, afectando **0 filas** (`rowCount = 0`) y protegiendo el saldo de sobreescrituras no deseadas.

```json
[
  { "id": 2, "balance": 2500, "version": "v1" },
  { "id": 3, "balance": 500, "version": "v2" },
  { "id": 6, "balance": 2500, "version": "v1" },
  { "id": 7, "balance": 500, "version": "v2" },
  { "id": 8, "balance": 7500, "version": "v1" },
  { "id": 1, "balance": -3000, "version": "v1" },
  { "id": 4, "balance": 4000, "version": "v1" },
  { "id": 5, "balance": 500, "version": "v2" }
]
```

### Variante 4: UPDATE Atómico con condición

```sql
UPDATE account
SET balance = balance - 2500
WHERE id = 6
AND balance >= 2500;
```

**Resultado:** PostgreSQL evalúa la condición `balance >= 2500` en el momento exacto de aplicar el bloqueo de tupla. Si el saldo no es suficiente, la consulta no afecta filas (`rowCount = 0`), garantizando que nunca se sobregire la cuenta sin necesidad de locks pesimistas explícitos.
