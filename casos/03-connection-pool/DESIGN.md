# Preguntas de diseño — Caso 03: Connection pool bajo presión

> **Regla:** Responde estas preguntas antes de programar la simulación (30-40 min, sin IA).

---

## 1. El ciclo de vida de una conexión en PostgreSQL

* ¿Por qué es costoso abrir y cerrar una conexión TCP nueva directamente contra PostgreSQL en cada request HTTP?
* ¿Qué crea PostgreSQL a nivel de sistema operativo por cada cliente conectado (hilo vs proceso, memoria dedicada como `work_mem`)?

*Tu respuesta:*



---

## 2. Parámetros del Pool en Node.js (`pg.Pool`)

* ¿Qué significan y cómo interactúan entre sí los siguientes parámetros?:
  * `max` (tamaño máximo del pool)
  * `connectionTimeoutMillis` (tiempo límite esperando un cliente libre del pool)
  * `idleTimeoutMillis` (tiempo antes de cerrar una conexión inactiva)
* Si `max = 20` y llegan 150 peticiones concurrentes, ¿qué hace el pool con las 130 peticiones restantes? ¿En qué momento empiezan a fallar?

*Tu respuesta:*



---

## 3. ¿Más conexiones significan mayor rendimiento?

* Si tu servidor de base de datos tiene 4 CPUs, ¿por qué configurar un pool de 200 conexiones puede ser **más lento** que un pool de 20 conexiones? (Pistas: *context switching*, saturación de disco y contención de cerrojos/locks).

*Tu respuesta:*



---

## 4. Mitigación y Arquitectura

* ¿Qué es **PgBouncer** y qué diferencia hay entre sus modos de pooling (`session`, `transaction`, `statement`)?
* ¿Qué es **Backpressure** y cómo deberías responder desde tu API HTTP (código de estado y headers) si el pool de base de datos está totalmente saturado?

*Tu respuesta:*



---

## 5. Resultados de la Simulación

*(Aquí registrarás tus métricas: número de requests, exitosas, fallidas con timeout, tiempo promedio de espera, etc.)*

```log
// Pega aquí los resultados de tu corrida con 150 conexiones contra un pool de 20
```
