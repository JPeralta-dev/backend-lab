# Preguntas de diseño — Caso 02: Índices y EXPLAIN ANALYZE

> **Regla:** Responde estas preguntas antes de programar las consultas o crear índices (30-40 min, sin IA).

---

## 1. Análisis de Carga y Consultas

¿Cuáles son las columnas que se consultan más frecuentemente en una tabla de transacciones financieras y por qué?

*Tu respuesta:*
En una tabla financiera, las columnas más consultadas son:
- **`user_id`**: Es el filtro más común en sistemas transaccionales/multitenant. Los usuarios casi nunca ven transacciones globales, siempre consultan su propio historial de movimientos.
- **`created_at`**: Se utiliza constantemente para rangos temporales (extractos mensuales, transacciones de hoy, etc.) y para ordenar (`ORDER BY created_at DESC`).
- **`category`**: Para reportes y análisis de gastos por rubro (comida, entretenimiento, servicios).
- **`amount`**: Para filtros de auditoría, alertas de fraude o búsqueda de transacciones de alto valor.
- **`id`**: Clave primaria para operaciones puntuales de detalle o reconciliación bancaria.

---

## 2. Tipos de Índices: ¿Simple, Compuesto o Parcial?

* ¿Cuándo conviene usar un índice **simple** (ej. solo `userId`)?:
  * *Respuesta:* Conviene cuando realizamos búsquedas frecuentes filtrando exclusivamente por una sola columna de alta o moderada selectividad (ej. buscar todas las transacciones de un usuario: `WHERE user_id = X`).

* ¿Cuándo conviene usar un índice **compuesto** (ej. `(userId, createdAt)`) y por qué importa el **orden de las columnas** en el índice?
  * *Respuesta:* Conviene cuando las consultas frecuentes filtran o combinan múltiples columnas juntas (por ejemplo, buscar el historial de un usuario en un rango de fechas: `WHERE user_id = X AND created_at >= Y`).
  * **Por qué importa el orden (Regla del Leftmost Prefix):** Los índices B-Tree compuestos se ordenan jerárquicamente de izquierda a derecha, como una guía telefónica organizada por `(Apellido, Nombre)`.
    - Permite buscar por el prefijo izquierdo solo: `WHERE user_id = X`.
    - Permite buscar por ambas columnas: `WHERE user_id = X AND created_at = Y`.
    - **No permite** buscar eficientemente solo por la columna derecha (`WHERE created_at = Y`), ya que el árbol no está ordenado por fecha de forma global.
    - Además, permite optimizar ordenamientos directos sin costo de memoria: `WHERE user_id = X ORDER BY created_at DESC`.

* ¿En qué escenario tendría sentido usar un índice **parcial** (ej. `WHERE amount > 10000` o `WHERE status = 'FAILED'`)?
  * *Respuesta:* Conviene cuando consultamos frecuentemente un subconjunto pequeño o asimétrico de los datos (datos con alta selectividad frente al total).
  * Por ejemplo, en un sistema donde el 99% de las transacciones son exitosas, un índice sobre `WHERE status = 'FAILED'` o `WHERE amount > 10000` solo almacena las excepciones o anomalías. Esto produce un índice minúsculo (ej. 1 MB en lugar de 100 MB), ultrarrápido en memoria RAM y que no degrada el rendimiento de los `INSERT` del 99% de las transacciones normales.

---

## 3. Costo de los Índices

Tener índices acelera las lecturas (`SELECT`), pero ¿qué impacto negativo tienen sobre las escrituras (`INSERT`, `UPDATE`, `DELETE`) y el almacenamiento en disco?

*Tu respuesta:*

* **Insert:** Al agregar un nuevo registro, además de escribirlo en la tabla principal (heap), el motor debe calcular y actualizar la posición en el árbol B-Tree de cada índice asociado, aumentando el uso de CPU e I/O de disco.
* **Update:** Si se modifica una columna indexada, el sistema debe eliminar la entrada anterior en el índice e insertar la nueva, duplicando el trabajo y generando fragmentación (bloqueando además optimizaciones como HOT - *Heap-Only Tuples* en Postgres).
* **Delete:** Borrar una fila obliga a buscar y remover sus referencias en cada uno de los índices existentes en la tabla.
* **Almacenamiento:** Los índices son estructuras físicas independientes que consumen espacio en disco y memoria RAM (buffer pool), compitiendo con los datos reales por el caché disponible.

---

## 4. Lectura de Planes (EXPLAIN ANALYZE)

* ¿Qué diferencia hay entre `Seq Scan` (Sequential Scan) e `Index Scan` / `Bitmap Index Scan`?
* ¿Qué métricas clave debes observar en el resultado de `EXPLAIN ANALYZE` para saber si tu consulta mejoró realmente?

*Tu respuesta:*

### Diferencias entre tipos de Scan:
1. **`Seq Scan` (Sequential Scan):** Lee toda la tabla secuencialmente de inicio a fin bloque por bloque en disco y aplica el filtro en memoria (`Filter:` descartando filas con `Rows Removed by Filter:`). Es eficiente cuando la tabla es muy pequeña o cuando la consulta devuelve un porcentaje alto de filas (>15-20%).
2. **`Index Scan`:** Recorre el árbol B-Tree del índice y por cada coincidencia salta de inmediato a la página de la tabla (*random I/O*) a recuperar las columnas. Es ideal para consultas de altísima selectividad que devuelven 1 o muy pocas filas (ej. por clave primaria o `user_id` único).
3. **`Bitmap Index Scan` + `Bitmap Heap Scan`:** Punto medio óptimo para consultas que devuelven decenas o miles de filas:
   - **`Bitmap Index Scan`**: Escanea el índice y crea un mapa de bits en memoria con las direcciones físicas de las páginas de la tabla donde hay coincidencias.
   - **`Bitmap Heap Scan`**: Ordena físicamente esas páginas para leerlas de manera secuencial (evitando saltos desordenados en disco) y extrae las filas.

### Métricas clave a observar:
* **`Execution Time`**: Tiempo real que tardó el motor en ejecutar la consulta (excluyendo el tiempo de parseo/planificación).
* **`Buffers: shared hit / read`**: Muestra la eficiencia de I/O. `shared hit` son bloques de 8KB leídos directo desde la memoria RAM (caché), mientras que `read` son lecturas físicas desde el disco.
* **`Rows Removed by Filter`**: Filas que el motor tuvo que leer y descartar. Un número alto indica que el índice no fue suficiente y se hizo trabajo desperdiciado.
* **`cost=X..Y`**: Estimación del optimizador de costo de arranque (*startup cost*) y costo total.

## 5. Demostración y Comparativa de Resultados

### 5.1 Estado Inicial: Antes de los Índices (Seq Scan)

#### Medición de Tiempos en Node.js (`console.time`):
```log
queryBeforeIndex1: 96.149ms
queryBeforeIndex2: 867.359ms
queryBeforeIndex3: 222.245ms
```

#### Planes de Ejecución (`EXPLAIN ANALYZE`):

* **Query 1 (`WHERE id = 10`):** Usó la Primary Key predeterminada.
```log
[
  { 'QUERY PLAN': 'Index Scan using transactions_pkey on transactions  (cost=0.42..8.44 rows=1 width=31) (actual time=0.031..0.032 rows=1 loops=1)' },
  { 'QUERY PLAN': '  Index Cond: (id = 10)' },
  { 'QUERY PLAN': 'Planning Time: 0.061 ms' },
  { 'QUERY PLAN': 'Execution Time: 0.056 ms' }
]
```

* **Query 2 (`WHERE created_at BETWEEN '2025-01-14' AND '2025-06-14'`):** Al no haber índice en `created_at`, forzó un `Seq Scan` completo sobre los 500,000 registros.
```log
[
  { 'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..11432.00 rows=68997 width=31) (actual time=0.081..38.171 rows=68932 loops=1)' },
  { 'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))" },
  { 'QUERY PLAN': '  Rows Removed by Filter: 431068' },
  { 'QUERY PLAN': 'Planning Time: 0.057 ms' },
  { 'QUERY PLAN': 'Execution Time: 40.844 ms' }
]
```

* **Query 3 (`WHERE created_at BETWEEN ... AND user_id > 2000`):** Sin índice aplicable en fecha y rango amplio de usuario, realizó un `Seq Scan`.
```log
[
  { 'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..12682.00 rows=55395 width=31) (actual time=0.013..39.436 rows=55095 loops=1)' },
  { 'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone) AND (user_id > 2000))" },
  { 'QUERY PLAN': '  Rows Removed by Filter: 444905' },
  { 'QUERY PLAN': 'Planning Time: 0.065 ms' },
  { 'QUERY PLAN': 'Execution Time: 41.543 ms' }
]
```

---

### 5.2 Estado Final: Con Índices Creados y `EXPLAIN (ANALYZE, BUFFERS)`

Se aplicaron los índices en `schema.sql`:
- `index_transactions_user_id` sobre `user_id`
- `idx_transactions_created_at` sobre `created_at`
- `index_transactions_user_create_at` sobre `(user_id, created_at)`

#### Planes Optimizados:

* **Query 1 (`WHERE user_id = 10`):** El motor ahora usa `Bitmap Index Scan` sobre `index_transactions_user_id`. El tiempo cayó a **0.333 ms** leyendo únicamente 67 buffers de memoria RAM.
```log
[
  { 'QUERY PLAN': 'Bitmap Heap Scan on transactions  (cost=4.81..188.52 rows=50 width=31) (actual time=0.019..0.079 rows=66 loops=1)' },
  { 'QUERY PLAN': '  Recheck Cond: (user_id = 10)' },
  { 'QUERY PLAN': '  Heap Blocks: exact=64' },
  { 'QUERY PLAN': '  Buffers: shared hit=67' },
  { 'QUERY PLAN': '  ->  Bitmap Index Scan on index_transactions_user_id  (cost=0.00..4.80 rows=50 width=0) (actual time=0.010..0.010 rows=66 loops=1)' },
  { 'QUERY PLAN': '        Index Cond: (user_id = 10)' },
  { 'QUERY PLAN': '        Buffers: shared hit=3' },
  { 'QUERY PLAN': 'Planning Time: 0.119 ms' },
  { 'QUERY PLAN': 'Execution Time: 0.333 ms' }
]
```

* **Query 2 (`WHERE created_at BETWEEN '2025-01-14' AND '2025-06-14'`):** Utiliza `Bitmap Index Scan` sobre `idx_transactions_created_at`, reduciendo el tiempo a más de la mitad (**17.960 ms**).
```log
[
  { 'QUERY PLAN': 'Bitmap Heap Scan on transactions  (cost=1467.64..6434.60 rows=68997 width=31) (actual time=3.486..14.982 rows=68932 loops=1)' },
  { 'QUERY PLAN': "  Recheck Cond: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))" },
  { 'QUERY PLAN': '  Heap Blocks: exact=3932' },
  { 'QUERY PLAN': '  Buffers: shared hit=4124' },
  { 'QUERY PLAN': '  ->  Bitmap Index Scan on idx_transactions_created_at  (cost=0.00..1450.39 rows=68997 width=0) (actual time=3.076..3.077 rows=68932 loops=1)' },
  { 'QUERY PLAN': "        Index Cond: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))" },
  { 'QUERY PLAN': '        Buffers: shared hit=192' },
  { 'QUERY PLAN': 'Planning Time: 0.113 ms' },
  { 'QUERY PLAN': 'Execution Time: 17.960 ms' }
]
```

* **Query 3 (`WHERE created_at BETWEEN ... AND user_id > 2000`):** Utiliza `Bitmap Index Scan` sobre `idx_transactions_created_at` para prefiltrar la fecha en 3 ms y luego descarta en memoria las filas con `user_id <= 2000`. El tiempo de ejecución se redujo de **44.3 ms a 19.8 ms**.
```log
[
  { 'QUERY PLAN': 'Bitmap Heap Scan on transactions  (cost=1464.24..6603.69 rows=55395 width=31) (actual time=3.412..17.169 rows=55095 loops=1)' },
  { 'QUERY PLAN': "  Recheck Cond: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))" },
  { 'QUERY PLAN': '  Filter: (user_id > 2000)' },
  { 'QUERY PLAN': '  Rows Removed by Filter: 13837' },
  { 'QUERY PLAN': '  Heap Blocks: exact=3932' },
  { 'QUERY PLAN': '  Buffers: shared hit=4124' },
  { 'QUERY PLAN': '  ->  Bitmap Index Scan on idx_transactions_created_at  (cost=0.00..1450.39 rows=68997 width=0) (actual time=2.996..2.996 rows=68932 loops=1)' },
  { 'QUERY PLAN': "        Index Cond: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))" },
  { 'QUERY PLAN': '        Buffers: shared hit=192' },
  { 'QUERY PLAN': 'Planning Time: 0.100 ms' },
  { 'QUERY PLAN': 'Execution Time: 19.892 ms' }
]
```

---

### 5.3 Tabla Resumen Comparativa

| Consulta | Filtro Principal | Plan Antes | Plan Después | Tiempo Antes | Tiempo Después | Mejora |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Query 1** | `user_id = 10` | Seq Scan | **Bitmap Index Scan** (`index_transactions_user_id`) | ~87.3 ms | **0.33 ms** | **99.6% más rápido** |
| **Query 2** | `created_at BETWEEN ...` | Seq Scan | **Bitmap Index Scan** (`idx_transactions_created_at`) | ~40.8 ms | **17.9 ms** | **56.1% más rápido** |
| **Query 3** | `created_at` + `user_id > 2000` | Seq Scan | **Bitmap Index Scan** (`idx_transactions_created_at`) | ~44.3 ms | **19.8 ms** | **55.3% más rápido** |