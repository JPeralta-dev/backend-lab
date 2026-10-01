# Preguntas de diseño — Caso 03: Connection pool bajo presión

> **Regla:** Responde estas preguntas antes de programar la simulación (30-40 min, sin IA).

---

## 1. El ciclo de vida de una conexión en PostgreSQL

* ¿Por qué es costoso abrir y cerrar una conexión TCP nueva directamente contra PostgreSQL en cada request HTTP?
* ¿Qué crea PostgreSQL a nivel de sistema operativo por cada cliente conectado (hilo vs proceso, memoria dedicada como `work_mem`)?

*Tu respuesta:* Es costoso porque todo el proceso de abrir una conexion de por si tiene algunos pasos antes de que se cree la conexion ahora imaginemos estar creando unua conexion por cada request y sea 1000/s eso seria garrafal, el pool reutiliza conexiones ya abiertas, dentro de crear una nueva conexion encontramos varias cosas.

1. Apreton de manos entre el servidor y la base de datos antes de crear la conexion, es recursos consumidos y tiempo de latencia.

2. cifrado de datos (TLS/SSL) Si la conexion es segura se deben intercambiar las llaves y los certificados para cifrar el canal, eso toma tiempo y CPU

3. autenticacions y autorizacion del cliente que esta entrando 

4. El servidor de base de datos debe reservar memoria y levantar un hilo para las peticiones entrante de ese nuevo cliente.

Estos pasos gastan demasiado muchimos. Investigando descubri que postgres utiliza algo llamado, modelo basado en procesos independientes, en lugar de hilos. Cuando el cliente se conecta a Postgres, hay algo llamado proceso principal o postmaster, a nivel de sisteam operativo realiza una bifurcacion para crear un nuevo proceso backend dedicado.

---

## 2. Parámetros del Pool en Node.js (`pg.Pool`)

* ¿Qué significan y cómo interactúan entre sí los siguientes parámetros?:
  * `max` (tamaño máximo del pool)
  * `connectionTimeoutMillis` (tiempo límite esperando un cliente libre del pool)
  * `idleTimeoutMillis` (tiempo antes de cerrar una conexión inactiva)
* Si `max = 20` y llegan 150 peticiones concurrentes, ¿qué hace el pool con las 130 peticiones restantes? ¿En qué momento empiezan a fallar?

*Tu respuesta:*

* `max` (tamaño máximo del pool), es decir cuantas conexiones reutilizables vamos a tener abiertas, esto interactua con lo demas diciendo cuantsd conexioned tendremos para uitilizar de manerar concurrente.
* `connectionTimeoutMillis` (tiempo límite esperando un cliente libre del pool) Cuantos milisegundos van a esperar las peticiones nuevas un cliente dentro del pool antes de mandar timeout.
* `idleTimeoutMillis` (tiempo antes de cerrar una conexión inactiva) Cuanto tiempo esperara a que una conexion este inactiva antes de cerrar.

las 130 peticiones que entran luego tienen que esperar a que terminen de realizarse las 20, empiezan a fallar cuando se cumplen los segundos impuestos en connectionTimeOutMilis. 

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
