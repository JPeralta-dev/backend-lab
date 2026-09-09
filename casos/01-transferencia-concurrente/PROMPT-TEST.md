# Caso 01: Transferencia Concurrente — Caso de Prueba para IA

Este documento contiene la especificación completa y el prompt para que cualquier asistente de IA o entorno de ejecución pueda correr y evaluar el **Caso 01: Transferencia Concurrente**.

---

## 1. Prompt para copiar y pegar a la IA

```text
Actúa como un Senior Backend Engineer. Necesito que evalúes y ejecutes la prueba del "Caso 01: Transferencia Concurrente" de mi backend-lab.

Contexto del escenario:
- Tabla: `account(id INT PRIMARY KEY, balance INT NOT NULL, version INT NOT NULL DEFAULT 1)`.
- Estado inicial antes de cada prueba: `id = 1, balance = 100, version = 1`.
- Escenario de estrés: Llegan dos transferencias simultáneas de $80 cada una en paralelo (usando Promise.all sobre dos clientes pg independientes).

Debes ejecutar y comparar las 4 variantes:
1. Sin protección (lectura a memoria en Node.js, validación if(balance >= 80) y posterior UPDATE).
2. Pessimistic Locking (BEGIN; SELECT balance FROM account WHERE id = 1 FOR UPDATE; validar y UPDATE; COMMIT).
3. Optimistic Locking (SELECT balance, version; UPDATE ... SET balance = balance - 80, version = version + 1 WHERE id = 1 AND version = $version).
4. UPDATE Atómico (UPDATE account SET balance = balance - 80 WHERE id = 1 AND balance >= 80).

Para cada variante necesito:
- Resultado devuelto por el Cliente A y el Cliente B (éxito o rechazo).
- El estado final de la fila en PostgreSQL (id, balance, version).
- La explicación técnica de qué ocurrió en el motor de base de datos.
```

---

## 2. Resultados esperados y Criterio "Resuelto"

| Variante | Cliente A ($80) | Cliente B ($80) | Saldo Final en DB | ¿Por qué ocurre? |
| :--- | :--- | :--- | :--- | :--- |
| **1. Sin protección** | Éxito ($80) | Éxito ($80) | **$20** (o **-$60**) | **Lost Update**: Ambos leyeron 100 a memoria antes de que el otro guardara. Ambos restaron 80 (100 - 80 = 20) y sobrescribieron el balance. Se retiraron $160 en total pero el banco dice que aún quedan $20. |
| **2. `FOR UPDATE`** | Éxito ($80) | Fallo (Saldo insuficiente) | **$20** | **Pessimistic Lock**: Cliente B se bloquea esperando a que Cliente A haga COMMIT. Al desbloquearse, lee el nuevo saldo ($20) y la validación `20 >= 80` lo rechaza con ROLLBACK. |
| **3. Optimistic Locking** | Éxito (`rowCount = 1`) | Fallo 409 Conflict (`rowCount = 0`) | **$20**, `version: 2` | Ambos enviaron `WHERE version = 1`. Cliente A entró primero y puso `version = 2`. Cuando llegó Cliente B, la fila ya no tenía version 1, por lo que Postgres afectó 0 filas. |
| **4. UPDATE Atómico** | Éxito (`rowCount = 1`) | Fallo (`rowCount = 0`) | **$20** | En PostgreSQL el `UPDATE` bloquea la fila a nivel de tupla. Al ejecutarse la segunda query, re-evalúa la condición `WHERE balance >= 80` sobre el nuevo saldo ($20), dando FALSO. |

---

## 3. Cómo ejecutar la prueba

### Opción A: Con Docker local
```bash
# Iniciar PostgreSQL
npm run db:up

# Ejecutar el script de pruebas
npm run case:01:test
```

### Opción B: Sin Docker (Usando PostgreSQL gratuito en la nube como Neon.tech o Supabase)
1. Crea un proyecto gratuito en [Neon.tech](https://neon.tech) o [Supabase](https://supabase.com).
2. Copia la URL de conexión en tu archivo `.env`:
   ```env
   DB_HOST=ep-xyz.us-east-2.aws.neon.tech
   DB_USER=neondb_owner
   DB_PASSWORD=tu_password
   DB_NAME=neondb
   DB_PORT=5432
   ```
3. Ejecuta directamente:
   ```bash
   npm run case:01:test
   ```
