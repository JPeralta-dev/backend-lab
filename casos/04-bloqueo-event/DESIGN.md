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

