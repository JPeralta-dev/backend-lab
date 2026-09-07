# Preguntas de diseño

**¿qué garantiza ACID aquí?**
cuando hablamos de una transaccion concurrente nos refermos que ese cambio de estado de un recurso se hara de manera simultanea dentro del servior, teniendo eso claro tenemos que tener en cuenta que dentro de esto existen muchos riesgos de no integridad del datos y transacciones con errores dentro del sistema, pero entonces existe algo llamado ACID, este es el tipo de aislamiento del sistema de las base de datos, este ailsamiento o isolation que esta mencionada en sus siglas envuelve a que las transaciones se haran juntos pero una no afectara la otra, esto dentro de la concurrencia es muy importante, pero el complemento de las demas siglas, nos afrece atomicidad que algo se haga o no. Es decir se hace completo o no se hace ofrece que las transacciones son seguras, consistencia, asegura que la informacion es integra que no afecta a la integridad del sistema, isolation la propiedad imporatnte la cual hablamos anteriormente y por ultimo pero no por menos imporatnte, durabilidad el hecho que perdure lo que se hizo.

**¿qué isolation level necesito y por qué?**

Luego de una investigacion realizada lo que conclui es que necesitamos la serializable esta los que asegura es que sea estricta con respecto al bloque de las demas filas o rango de estas mientra se esta realizando una transaccion.

**¿row lock o table lock?**

Row lockk, porque nos ayuda con la corrurencia en un flujo masivo, aunque luego de que sea en grandes cantidades de peticiones de debe revisar si pasarse a table lock normalmente se utiliza este a pesar de la cantidde de recursos que consume (**Correcion:** Por nada del mundo en una de estas tablas que las cuales estamos utilizando para hacer tantas transacciones escalemos a eso porque bloqueriamos a todos los usuarios que intenten esto.).

**¿Porque es insegura las dos primeras?**
La primera que se escribe de esta manera

```SQL
UPDATE account
SET balance = balance - 1
WHERE id = 1
```

A primera vista todo correcto, el usuario actualiza el recusro y todo perfecto, pero y si dos de manera simultanea viene a cambiar el recurso? entonces tenemos un problema porque cuando pase eso lo mas seguro es que si tenemos el ultimo stock de un producto a uno de los usuarios vamos a venderle algo que no tenemos.

Ahora por otra parte tenemos la seguna manera y es de esta manera.

```SQL
BEGIN;
SELECT id, balance FROM account WHERE id = 1 FOR UPDATE;
UPDATE usuario SET balance = balance - 1 WHERE id = 1;
COMMIT;
```

```JavaScript
[
  { id: 2, balance: 2500, version: 'v1' },
  { id: 3, balance: 500, version: 'v2' },
  { id: 5, balance: 1000, version: 'v1' },
  { id: 6, balance: 2500, version: 'v1' },
  { id: 7, balance: 500, version: 'v2' },
  { id: 8, balance: 7500, version: 'v1' },
  { id: 1, balance: -3000, version: 'v1' },
  { id: 4, balance: -15000, version: 'v1' }
]
Entre en la funcion vamos a empezar 
Se lograron hacer todas las transacciones
El cliente 0 completo su transaccion
El cliente 1 completo su transaccion
El cliente 2 completo su transaccion
bunch-of-stuff: 3.811ms
```

Como puedes ver aunque se blooque con el FOR UPDATE incluso si en la sql y cambiiamos 

```SQL
BEGIN;
SELECT id, balance FROM account WHERE id = 1 FOR UPDATE;
UPDATE usuario SET balance = balance - 1 WHERE id = 1
AND balance > 1;
COMMIT;
```

Esto aunque asegura que no vendmos nada sigue siendo malo para concurrencia (correcion de lo anterior, no es que sea malo, pero para concurrenia el optimits lock es pesimo, lo que ocurre es que las peticiones entran en una fila mientras una se este ejecutando la otra no puede modificar esa fila al mismo tiempo, esto no garantiza la validacion que dije, me resto es porque no lo hice yo pero verdaderamente no funciona es por lo anterior.). Incluso si bloqueamos la fila.

**¿Porque estas dos si son excelentes?**

```JSON
[
  { id: 2, balance: 2500, version: 'v1' },
  { id: 3, balance: 500, version: 'v2' },
  { id: 5, balance: 1000, version: 'v1' },
  { id: 6, balance: 2500, version: 'v1' },
  { id: 7, balance: 500, version: 'v2' },
  { id: 8, balance: 7500, version: 'v1' },
  { id: 1, balance: -3000, version: 'v1' },
  { id: 4, balance: 4000, version: 'v1' }
]
```

Como podemos observar algo interesante, como vemos en el anterior log el producto 5 tiene un 1000, entonces como implementamos optimistc loking vemos una reaccion impresionante, cuanso ejectamos esta query de manera simultanea.

```SQL
UPDATE account
SET balance = balance - 500, version = 'v2'
WHERE id = 5
AND version = 'v1'
```

Imprimos lo que ocurrio y nos impresiona con los siguiente.

```json
[
  { id: 2, balance: 2500, version: 'v1' },
  { id: 3, balance: 500, version: 'v2' },
  { id: 6, balance: 2500, version: 'v1' },
  { id: 7, balance: 500, version: 'v2' },
  { id: 8, balance: 7500, version: 'v1' },
  { id: 1, balance: -3000, version: 'v1' },
  { id: 4, balance: 4000, version: 'v1' },
  { id: 5, balance: 500, version: 'v2' }
]
```

Si nos damos cuenta tenemos que el producto con id 5 solo pudo hacer una compra, porque si recondamos es que todos hicieron la transaccion pero dos de estos bloquearon su transaccion porque llamaban a una version del registro que ya no existe.
