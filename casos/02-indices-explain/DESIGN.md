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
