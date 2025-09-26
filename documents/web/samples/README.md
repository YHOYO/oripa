# Patrones de prueba ORIPA Web

Este directorio recopila patrones representativos para validar el prototipo web durante las fases tempranas.

## Archivos incluidos

| Archivo | Descripción | Fuente |
| --- | --- | --- |
| `opx/crane_base_mitani.opx` | Grulla base de Robert J. Lang, usada para validar estructuras clásicas de ave. | Copiado de `src/test/resources/crane_base_mitani.opx` del repositorio original. |
| `opx/waterbomb_base_collapse.opx` | Patrón de waterbomb con colapso parcial que estresa validadores de solapamiento. | Copiado de `src/test/resources/waterbomb_base_collapse.opx`. |

Los archivos mantienen el formato original `.opx` y se utilizarán para futuras pruebas de importación y renderizado.

## Lista de comprobación manual (fase 2)

Durante la fase 2, el objetivo es verificar que la aplicación puede cargar un documento vacío y mostrar capas básicas. Use la siguiente guía rápida:

1. Abrir `index.html` en un navegador compatible.
2. Confirmar que el lienzo principal y la barra lateral se renderizan sin errores en la consola.
3. Validar que el indicador de fase muestre "Phase 2 · Proyecto base".
4. Registrar cualquier error encontrado en la bitácora de sesiones correspondiente.

A medida que se incorporen funcionalidades, esta lista se ampliará con pasos de importación/exportación y herramientas de edición.
