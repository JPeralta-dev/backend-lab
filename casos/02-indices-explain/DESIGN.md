# Preguntas de diseño — Caso 02: Índices y EXPLAIN ANALYZE

> **Regla:** Responde estas preguntas antes de programar las consultas o crear índices (30-40 min, sin IA).

---

## 1. Análisis de Carga y Consultas

¿Cuáles son las columnas que se consultan más frecuentemente en una tabla de transacciones financieras y por qué?

*Tu respuesta:*

Dentro de  lo que podemos encontrar en las columnas que mas se frecuencias, es que creo que sinceramente son las de id, categoria, montos y por fechas de creaciones de esas transacciones esas son exactamente las que yo creo que pueden ser las mas frecuentadas.

---

## 2. Tipos de Índices: ¿Simple, Compuesto o Parcial?

* ¿Cuándo conviene usar un índice **simple** (ej. solo `userId`)?: /
*Respuesta:*claramente es cuando tenemos que hacer busquedas simples es decir si frecuentamos en buscar solo por id, por monto o por alguna columa en especifico, es decir si no tenemos complejidad de mas de una columna en busquedas frecuentes.

* ¿Cuándo conviene usar un índice **compuesto** (ej. `(userId, createdAt)`) y por qué importa el **orden de las columnas** en el índice?
*Respuesta:* Comviene en precisamente busquedas compuestas, en donde el orden de estas involucran mas de una columna en la consulta frecuente, puede ser por ejemplo como lo que se ponia de UserId y createAt

* ¿En qué escenario tendría sentido usar un índice **parcial** (ej. `WHERE amount > 10000` o `WHERE status = 'FAILED'`)?

*respuesta:*Cuando ademas de lo anterior o solo por el hecho de que tenemos que hacer una busqueda frecuente excluyendo algunas filas con respecto a alguna condicion que tenga.

---

## 3. Costo de los Índices

Tener índices acelera las lecturas (`SELECT`), pero ¿qué impacto negativo tienen sobre las escrituras (`INSERT`, `UPDATE`, `DELETE`) y el almacenamiento en disco?

*respuesta:* Buenos luego de hacer una investigacion pasoa algo interesante en cada una de las operacions de escritura:

**Insert:** Al agregar un nuevo registro ademas de tener que crearlo en la tabla principal, tendra que calcular y ubicar la posicion correcta de cada indice asociado, lo que hace que crezca el tiempo de uso de la CPU y E/S disco.

**Update:** Al cambiar una columna que este indexada, el sistema debe eliminar la estructura o entrada vieja y crear una nueva duplicando el trabajo en la base de dato.

**Delete:** Borrar obliga a buscar y remover todas las referencias de combinaciones que exiten en cada uno de los indices de las tablas.

**Almacenamiento:** Los indices son estructuras independientes que ocupan espacio fisico adicional en el disco o en la memoria Ram.

---

## 4. Lectura de Planes (EXPLAIN ANALYZE)

* ¿Qué diferencia hay entre `Seq Scan` (Sequential Scan) e `Index Scan` / `Bitmap Index Scan`?
* ¿Qué métricas clave debes observar en el resultado de `EXPLAIN ANALYZE` para saber si tu consulta mejoró realmente?

*Tu respuesta:*


## 5. Demostracion de diferencias 

```log
1
queryBeforeIndex1: 96.149ms
68932
queryBeforeIndex2: 867.359ms
55095
queryBeforeIndex3: 222.245ms
```

```Log
[
  {
    'QUERY PLAN': 'Index Scan using transactions_pkey on transactions  (cost=0.42..8.44 rows=1 width=31)'
  },
  { 'QUERY PLAN': '  Index Cond: (id = 10)' }
]
queryBeforeIndex1: 88.909ms
[
  {
    'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..11432.00 rows=68997 width=31)'
  },
  {
    'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))"
  }
]
queryBeforeIndex2: 92.102ms
[
  {
    'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..12682.00 rows=55395 width=31)'
  },
  {
    'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone) AND (user_id> 2000))"
  }
]
queryBeforeIndex3: 85.566ms
```

```log
[
  {
    'QUERY PLAN': 'Index Scan using transactions_pkey on transactions  (cost=0.42..8.44 rows=1 width=31) (actual time=0.031..0.032 rows=1 loops=1)'
  },
  { 'QUERY PLAN': '  Index Cond: (id = 10)' },
  { 'QUERY PLAN': 'Planning Time: 0.061 ms' },
  { 'QUERY PLAN': 'Execution Time: 0.056 ms' }
]
queryBeforeIndex1: 87.359ms
[
  {
    'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..11432.00 rows=68997 width=31) (actual time=0.081..38.171 rows=68932 loops=1)'
  },
  {
    'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))"
  },
  { 'QUERY PLAN': '  Rows Removed by Filter: 431068' },
  { 'QUERY PLAN': 'Planning Time: 0.057 ms' },
  { 'QUERY PLAN': 'Execution Time: 40.844 ms' }
]
queryBeforeIndex2: 128.318ms
[
  {
    'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..12682.00 rows=55395 width=31) (actual time=0.013..39.436 rows=55095 loops=1)'
  },
  {
    'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone) AND (user_id> 2000))"
  },
  { 'QUERY PLAN': '  Rows Removed by Filter: 444905' },
  { 'QUERY PLAN': 'Planning Time: 0.065 ms' },
  { 'QUERY PLAN': 'Execution Time: 41.543 ms' }
]
queryBeforeIndex3: 128.081ms
```

Ahora despues de los indices colocado

```log
[
  {
    'QUERY PLAN': 'Index Scan using transactions_pkey on transactions  (cost=0.42..8.44 rows=1 width=31) (actual time=0.008..0.008 rows=1 loops=1)'
  },
  { 'QUERY PLAN': '  Index Cond: (id = 10)' },
  { 'QUERY PLAN': 'Planning Time: 0.269 ms' },
  { 'QUERY PLAN': 'Execution Time: 0.030 ms' }
]
queryBeforeIndex1: 90.12ms
[
  {
    'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..11432.00 rows=68997 width=31) (actual time=0.011..35.632 rows=68932 loops=1)'
  },
  {
    'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone))"
  },
  { 'QUERY PLAN': '  Rows Removed by Filter: 431068' },
  { 'QUERY PLAN': 'Planning Time: 0.070 ms' },
  { 'QUERY PLAN': 'Execution Time: 38.140 ms' }
]
queryBeforeIndex2: 129.878ms
[
  {
    'QUERY PLAN': 'Seq Scan on transactions  (cost=0.00..12682.00 rows=55395 width=31) (actual time=0.011..38.799 rows=55095 loops=1)'
  },
  {
    'QUERY PLAN': "  Filter: ((created_at >= '2025-01-14 00:00:00'::timestamp without time zone) AND (created_at <= '2025-06-14 00:00:00'::timestamp without time zone) AND (user_id> 2000))"
  },
  { 'QUERY PLAN': '  Rows Removed by Filter: 444905' },
  { 'QUERY PLAN': 'Planning Time: 0.089 ms' },
  { 'QUERY PLAN': 'Execution Time: 44.381 ms' }
]
queryBeforeIndex3: 142.006ms
```
