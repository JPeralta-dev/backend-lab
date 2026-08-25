# Preguntas de diseño

**¿qué garantiza ACID aquí?**
cuando hablamos de una transaccion concurrente nos refermos que ese cambio de estado de un recurso se hara de manera simultanea dentro del servior, teniendo eso claro tenemos que tener en cuenta que dentro de esto existen muchos riesgos de no integridad del datos y transacciones con errores dentro del sistema, pero entonces existe algo llamado ACID, este es el tipo de aislamiento del sistema de las base de datos, este ailsamiento o isolation que esta mencionada en sus siglas envuelve a que las transaciones se haran juntos pero una no afectara la otra, esto dentro de la concurrencia es muy importante, pero el complemento de las demas siglas, nos afrece atomicidad que algo se haga o no. Es decir se hace completo o no se hace ofrece que las transacciones son seguras, consistencia, asegura que la informacion es integra que no afecta a la integridad del sistema, isolation la propiedad imporatnte la cual hablamos anteriormente y por ultimo pero no por menos imporatnte, durabilidad el hecho que perdure lo que se hizo.

**¿qué isolation level necesito y por qué?**

Luego de una investigacion realizada lo que conclui es que necesitamos la serializable esta los que asegura es que sea estricta con respecto al bloque de las demas filas o rango de estas mientra se esta realizando una transaccion.

**¿row lock o table lock?**

Row lockk, porque nos ayuda con la corrurencia en un flujo masivo, aunque luego de que sea en grandes cantidades de peticiones de debe revisar si pasarse a table lock normalmente se utiliza este a pesar de la cantidde de recursos que consume.
