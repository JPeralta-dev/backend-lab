# Preguntas de diseño — Caso 02: Índices y EXPLAIN ANALYZE

> **Regla:** Responde estas preguntas antes de programar las consultas o crear índices (30-40 min, sin IA).

---

### 1. Análisis de Carga y Consultas
¿Cuáles son las columnas que se consultan más frecuentemente en una tabla de transacciones financieras y por qué?

*Tu respuesta:*


---

### 2. Tipos de Índices: ¿Simple, Compuesto o Parcial?
* ¿Cuándo conviene usar un índice **simple** (ej. solo `userId`)?
* ¿Cuándo conviene usar un índice **compuesto** (ej. `(userId, createdAt)`) y por qué importa el **orden de las columnas** en el índice?
* ¿En qué escenario tendría sentido usar un índice **parcial** (ej. `WHERE amount > 10000` o `WHERE status = 'FAILED'`)?

*Tu respuesta:*


---

### 3. Costo de los Índices
Tener índices acelera las lecturas (`SELECT`), pero ¿qué impacto negativo tienen sobre las escrituras (`INSERT`, `UPDATE`, `DELETE`) y el almacenamiento en disco?

*Tu respuesta:*


---

### 4. Lectura de Planes (`EXPLAIN ANALYZE`)
* ¿Qué diferencia hay entre `Seq Scan` (Sequential Scan) e `Index Scan` / `Bitmap Index Scan`?
* ¿Qué métricas clave debes observar en el resultado de `EXPLAIN ANALYZE` para saber si tu consulta mejoró realmente?

*Tu respuesta:*
