## Como saber cuando estamos bloqueando el event loop

Dentro de lo que encontramos como este taller o lab tenemos varias cosas por argumentar
cuando nosotros desarrollamos sin atencion a este detalle que es como trabaja Nodejs podemos llegar a tenner
cuellos de botellas inncesarios, dentro de estos tenemos que varios de los problemas que puede tener una app es cuando no libera el event loop y hace cosas asicronas mal planteadas.

El dia de hoy lo que se hizo fue realizar una pequena prubea con un servidor que implementa dos endpoint, el primero es el /heath que es el de salud de toda la vida y luegp  es el /hash que  lo que ejecuta es una tarea pesada para bloquear el event loop. Con un aherramienta pra poder medir ek perfomance llamad autocannon podemos llegar a tener un avance.

En la primera ejecucion podemos llegara a encontranos esto:

```terminal
Running 20s test @ http://localhost:3000/heath
10 connections


┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 0 ms │ 0 ms │ 0 ms  │ 0 ms │ 0.01 ms │ 0.05 ms │ 11 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Req/Sec   │ 22.111  │ 22.111  │ 22.447  │ 22.607  │ 22.400,8 │ 139,81  │ 22.099  │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Bytes/Sec │ 5.55 MB │ 5.55 MB │ 5.64 MB │ 5.67 MB │ 5.62 MB  │ 35.1 kB │ 5.55 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┴─────────┘ mira sin nada en ejecucuin 
npx autocannon -c 10 -d 20 http://localhost:3000/heath
Running 20s test @ http://localhost:3000/heath
10 connections


┌─────────┬──────┬──────┬───────┬────────┬─────────┬──────────┬────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%    │ Avg     │ Stdev    │ Max    │
├─────────┼──────┼──────┼───────┼────────┼─────────┼──────────┼────────┤
│ Latency │ 0 ms │ 0 ms │ 0 ms  │ 448 ms │ 5.43 ms │ 50.41 ms │ 674 ms │
└─────────┴──────┴──────┴───────┴────────┴─────────┴──────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬────────┬──────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%  │ Avg      │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼────────┼──────────┼──────────┼─────────┤
│ Req/Sec   │ 20      │ 20      │ 20      │ 22.319 │ 1.714,05 │ 5.354,24 │ 20      │
├───────────┼─────────┼─────────┼─────────┼────────┼──────────┼──────────┼─────────┤
│ Bytes/Sec │ 5.02 kB │ 5.02 kB │ 5.02 kB │ 5.6 MB │ 430 kB   │ 1.34 MB  │ 5.02 kB │
└───────────┴─────────┴─────────┴─────────┴────────┴──────────┴──────────┴─────────┘ 
```

Esto se realizo estando libre solo pidiendo esto pero luiego hicimos un prueba realizando una tarea pesada el resultado fue este
```
npx autocannon -c 10 -d 20 http://localhost:3000/heath
Running 20s test @ http://localhost:3000/heath
10 connections


┌─────────┬──────┬──────┬───────┬──────┬─────────┬──────────┬────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev    │ Max    │
├─────────┼──────┼──────┼───────┼──────┼─────────┼──────────┼────────┤
│ Latency │ 0 ms │ 0 ms │ 0 ms  │ 1 ms │ 2.75 ms │ 35.09 ms │ 681 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴──────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┤
│ Req/Sec   │ 20      │ 20      │ 21      │ 22.479  │ 3.128,3 │ 7.453,14 │ 20      │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┤
│ Bytes/Sec │ 5.02 kB │ 5.02 kB │ 5.27 kB │ 5.64 MB │ 785 kB  │ 1.87 MB  │ 5.02 kB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 20

63k requests in 20.17s, 15.7 MB read
Running 20s test @ http://localhost:3000/hash
2 connections


┌─────────┬────────┬────────┬────────┬────────┬───────────┬──────────┬────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg       │ Stdev    │ Max    │
├─────────┼────────┼────────┼────────┼────────┼───────────┼──────────┼────────┤
│ Latency │ 449 ms │ 452 ms │ 575 ms │ 679 ms │ 454.96 ms │ 48.56 ms │ 679 ms │
└─────────┴────────┴────────┴────────┴────────┴───────────┴──────────┴────────┘
┌───────────┬───────┬───────┬─────────┬─────────┬─────────┬───────┬───────┐
│ Stat      │ 1%    │ 2.5%  │ 50%     │ 97.5%   │ Avg     │ Stdev │ Min   │
├───────────┼───────┼───────┼─────────┼─────────┼─────────┼───────┼───────┤
│ Req/Sec   │ 3     │ 3     │ 4       │ 5       │ 4,35    │ 0,58  │ 3     │
├───────────┼───────┼───────┼─────────┼─────────┼─────────┼───────┼───────┤
│ Bytes/Sec │ 927 B │ 927 B │ 1.24 kB │ 1.54 kB │ 1.34 kB │ 177 B │ 927 B │
└───────────┴───────┴───────┴─────────┴─────────┴─────────┴───────┴───────┘

Req/Bytes counts sampled once per second.
# of samples: 20

89 requests in 20.15s, 26.9 kB read
```

podemos llegar a observar como aumento la cantidad de tiempo y el max con respecto al primero test, sabesmos que pasa de un 11ms a un 679ms una cantidad absurda de tiempo aunque sea rapido en muchas pediciones eso empiezan hacer segundos.

## Después de implementar Worker Threads

Después de observar el problema que genera una tarea CPU-bound ejecutada de forma síncrona, el siguiente paso fue mover el cálculo de bcrypt a un `Worker Thread`.

La idea no es hacer que el cálculo sea más rápido, sino evitar que ese trabajo bloquee el hilo principal de Node.js. De esta manera, mientras el worker realiza el cálculo del hash, el servidor puede continuar atendiendo otras peticiones, como las solicitudes al endpoint `/heath`.

Para comprobarlo, mantuvimos el mismo escenario de pruebas con `autocannon`: dos conexiones concurrentes contra `/hash` y diez conexiones contra `/heath`.

Los resultados obtenidos fueron los siguientes:

```terminal
# Endpoint /hash con Worker Thread

Latency:
  Avg: 4025.23 ms
  97.5%: 4429 ms
  99%: 4429 ms
  Max: 4429 ms
```

El cálculo del hash ahora tarda aproximadamente cuatro segundos por petición. Esto demuestra que utilizar un worker no elimina el coste computacional de bcrypt. De hecho, existe un coste adicional relacionado con la creación del hilo y la comunicación entre el worker y el hilo principal.

Sin embargo, el resultado más importante lo encontramos al observar el endpoint `/heath` mientras se ejecutaban las tareas pesadas:

```terminal
# Endpoint /heath durante la carga de /hash

Latency:
  Avg: 0.05 ms
  97.5%: 1 ms
  99%: 1 ms
  Max: 10 ms
```

Si comparamos estos resultados con la ejecución anterior, donde el cálculo de bcrypt se ejecutaba de forma síncrona, observamos una diferencia significativa. En aquella prueba, la latencia máxima de `/heath` alcanzó los 674 ms y el p99 llegó a 448 ms. Con el worker, la latencia máxima registrada fue de 10 ms y el p99 de 1 ms.

Esta diferencia permite observar cómo aislar una tarea CPU-bound del hilo principal mejora la capacidad de respuesta del servidor ante otras solicitudes concurrentes.

### Conclusión

La principal lección de este laboratorio es que una tarea pesada no necesariamente debe ejecutarse en el hilo principal de Node.js. Cuando una operación consume mucho tiempo de CPU y bloquea el event loop, puede perjudicar a endpoints que, por sí mismos, son muy rápidos.

Mediante `Worker Threads`, conseguimos ejecutar el cálculo de bcrypt en otro hilo y mantener una latencia baja en `/heath`, sin necesidad de modificar la lógica de ese endpoint.

No obstante, los workers no hacen que la CPU tenga más capacidad de la que realmente posee. Si creamos demasiados hilos o saturamos los núcleos disponibles, el rendimiento puede degradarse. Por eso, en una aplicación de producción, sería conveniente evaluar el uso de un *worker pool* que limite la cantidad de trabajadores y gestione las tareas pendientes.

Este experimento demuestra que las decisiones de arquitectura deben sustentarse en mediciones reales. En este caso, comparamos la latencia bajo carga antes y después de aislar el cálculo, obteniendo evidencia de la mejora en la capacidad de respuesta del servidor.