# backend-lab — Plan completo de casos

Repo único tipo laboratorio. Cada caso vive en `casos/NN-nombre/`.

**Regla fija en todos los casos:**
- IA sí → scaffolding (docker, package.json, carpetas, seeds, explicaciones de conceptos).
- IA no → la lógica del caso (transacciones, locks, streams, jobs, auth, etc.). Esa la escribes tú.
- Antes de programar, llenas `casos/NN-.../DESIGN.md` con las preguntas de diseño de esa sección (30-40 min, sin IA, papel o markdown).
- No pasas al siguiente caso hasta cumplir el criterio "resuelto".

---

## Bloque 1 — PostgreSQL profundo (2 semanas)

### Caso 01 — Transferencia concurrente
**Prompt scaffolding:**
```
Dame docker-compose con postgres:16 (db "lab", user/pass "lab") y un
package.json con TypeScript + tsx + pg. Crea casos/01-transferencia-concurrente/
con schema.sql e index.ts vacíos (solo comentario TODO). No escribas lógica.
```
**Preguntas de diseño:** ¿qué garantiza ACID aquí? ¿qué isolation level necesito y por qué? ¿row lock o table lock?
**Tú programas:** tabla `accounts(id, balance, version)`, dos transferencias de $80 en paralelo contra $100, en 4 variantes: sin protección, `FOR UPDATE`, optimistic locking (`version`), `UPDATE ... WHERE balance >= amount`.
**Resuelto cuando:** puedes explicar por qué las primeras dos variantes pueden fallar y las últimas dos no, viendo el balance real en la DB tras cada corrida.

### Caso 02 — Índices y EXPLAIN ANALYZE
**Prompt scaffolding:**
```
Genera un seed script que inserte 500,000 filas en una tabla "transactions"
(userId, amount, category, createdAt) con datos aleatorios usando faker.
Solo el seed, no las queries de análisis.
```
**Preguntas de diseño:** ¿qué columnas se consultan más? ¿índice simple, compuesto o parcial?
**Tú programas:** 3 queries típicas (por usuario, por rango de fechas, por categoría+usuario), corres `EXPLAIN ANALYZE` antes y después de indexar, comparas planes.
**Resuelto cuando:** puedes leer un plan y decir si usó Seq Scan o Index Scan y por qué, sin que la IA te lo traduzca.

### Caso 03 — Connection pool bajo presión
**Tú programas:** un script que abre 150 conexiones simultáneas contra un pool configurado a 20, mide timeouts y errores.
**Resuelto cuando:** puedes explicar qué pasó y cómo lo mitigarías (PgBouncer, ajustar pool size, backpressure).

---

## Bloque 2 — Node.js profundo (2 semanas)

### Caso 04 — Bloqueo del event loop
**Tú programas:** un endpoint que hace un cálculo CPU-bound pesado (ej. hash costoso) y mides cómo afecta a otras requests concurrentes; luego lo mueves a un `worker_thread` y vuelves a medir.
**Resuelto cuando:** tienes números de antes/después (latencia p95 de otras requests) que sustentan tu decisión.

### Caso 05 — Streaming de reportes sin cargar todo en RAM
**Prompt scaffolding:**
```
Deja listo casos/05-reporte-streaming/ con dependencia de exceljs y un
cursor de pg ("pg-cursor"), sin lógica.
```
**Tú programas:** pipeline `PostgreSQL cursor → Transform → Excel writer → archivo`, procesando 1M+ filas, midiendo memoria (`process.memoryUsage()`) con y sin streaming.
**Resuelto cuando:** demuestras que la memoria se mantiene estable en el tiempo, no crece con el volumen.

---

## Bloque 3 — Queues y consistencia (2 semanas)

### Caso 06 — Idempotency-Key
**Prompt scaffolding:**
```
Instala BullMQ y agrega redis al docker-compose. Deja carpeta
casos/06-idempotency-key/ vacía con TODO.
```
**Tú programas:** endpoint `POST /payments` con header `Idempotency-Key`, tabla que guarda key+hash+status+response, constraint único. Disparas 5 requests idénticos en paralelo.
**Resuelto cuando:** solo existe un pago creado, y los otros 4 requests devuelven la misma respuesta guardada.

### Caso 07 — Outbox Pattern
**Tú programas:** en la misma transacción que actualizas el balance, insertas en `outbox_events`; un worker separado lee la tabla y "publica" (simulado), marcando como enviado.
**Resuelto cuando:** simulas que el "publish" falla y el evento sigue pendiente para reintento, sin perder el commit de negocio.

### Caso 08 — Jobs con retry y DLQ
**Tú programas:** un worker BullMQ que falla las primeras 2 veces (simulado) y reintenta con backoff exponencial; tras N fallos va a una dead-letter queue.
**Resuelto cuando:** puedes ver en logs/DB cada intento con su backoff, y el job termina en DLQ correctamente tras agotar reintentos.

---

## Bloque 4 — Seguridad (1-2 semanas)

### Caso 09 — Auth con JWT + refresh tokens
**Tú programas:** login que emite access token corto + refresh token largo (guardado hasheado en DB), endpoint de refresh, revocación.
**Resuelto cuando:** un access token expirado no funciona, pero el flujo de refresh sí, y puedes revocar un refresh token específico.

### Caso 10 — IDOR / autorización
**Tú programas:** endpoint `GET /accounts/:id` que un usuario intenta usar con el ID de otro.
**Resuelto cuando:** responde 403/404 según tu política, y tienes un test que lo prueba.

### Caso 11 — Rate limiting
**Tú programas:** rate limiter con Redis (token bucket o sliding window) sobre un endpoint sensible.
**Resuelto cuando:** el request N+1 dentro de la ventana es rechazado con 429, y puedes explicar el algoritmo que usaste.

---

## Bloque 5 — Testing (2 semanas)

### Caso 12 — Unit + integration sobre los casos anteriores
**Tú programas:** tests unitarios de la lógica de idempotencia y locks (casos 01, 06), tests de integración contra Postgres/Redis reales (no mocks) para los flujos críticos.
**Resuelto cuando:** tienes cobertura real de los escenarios de fallo (no solo el happy path) y los tests fallan si rompes la lógica a propósito.

### Caso 13 — Load testing con k6
**Prompt scaffolding:**
```
Dame un script base de k6 (sin escenarios de carga definidos) apuntando
a un endpoint configurable por variable de entorno.
```
**Tú programas:** escenarios a 100/500/1000 req/s contra tu endpoint de transferencias, mides p50/p95/p99 y error rate.
**Resuelto cuando:** tienes números reales documentados, no una afirmación de "escala".

---

## Bloque 6 — Docker, Kubernetes, CI/CD (2 semanas)

### Caso 14 — Dockerizar y romperlo a propósito
**Tú programas:** Dockerfile del backend-lab, y provocas a propósito un `OOMKilled` (limitando memoria) y un `CrashLoopBackOff` (si tienes acceso a un cluster k8s local tipo kind/minikube).
**Resuelto cuando:** puedes diagnosticar el problema con `kubectl describe`/`logs` sin ayuda.

### Caso 15 — Pipeline CI/CD básico
**Tú programas:** GitHub Actions con lint → typecheck → tests → build → imagen Docker.
**Resuelto cuando:** un PR que rompe un test falla el pipeline antes de mergear.

---

## Bloque 7 — Sistemas distribuidos (2 semanas)

### Caso 16 — Escenario de fallo: proveedor externo con timeout
**Tú programas:** simulas un "proveedor de pagos" que a veces responde timeout; implementas reconciliación (job que revisa pagos "pendientes" contra el estado real del proveedor simulado).
**Resuelto cuando:** ningún pago queda en estado ambiguo permanentemente — todos terminan reconciliados.

### Caso 17 — Redis caído: degradación controlada
**Tú programas:** apagas Redis manualmente mientras el sistema corre y defines qué endpoints deben seguir funcionando (aunque más lento) y cuáles deben fallar explícitamente.
**Resuelto cuando:** tienes esa lista documentada y el comportamiento real coincide con lo que definiste.

---

## Cómo usarlo con tu asistente de IA en cada caso

1. Pega el prompt de scaffolding de ese caso (o pídeme uno nuevo si no está aquí).
2. Llena el `DESIGN.md` tú solo, sin IA.
3. Programas la lógica tú, sin autocomplete de IA.
4. Verificas el criterio "resuelto" con datos reales (logs, métricas, queries), no por intuición.
5. Solo entonces le puedes pedir a la IA feedback o revisión del código ya escrito — no que lo genere.

System design queda cubierto en el paso 2 de cada caso: no es un tema aparte, es la disciplina de pensar antes de programar.
