/**
 * Genera un arreglo de números aleatorios.
 * 
 * @param count Cantidad de números a generar (por defecto 5 millones según el ejercicio)
 * @param min Valor mínimo (inclusive)
 * @param max Valor máximo (inclusive)
 */
export function generateBigNumbers(
  count: number = 5_000_000,
  min: number = 1,
  max: number = 100_000
): number[] {
  // Pre-alocamos el tamaño en el array para no causar redimensionamientos lentos en V8
  const numbers = new Array<number>(count);
  const range = max - min + 1;

  for (let i = 0; i < count; i++) {
    numbers[i] = Math.floor(Math.random() * range) + min;
  }

  return numbers;
}
