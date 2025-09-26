# Evaluación del plan de reimplementación web (2024-05-16)

## Resumen ejecutivo
- **Estado general**: el proyecto mantiene la Fase 2 (prototipo base web) activa. Las fundaciones, el núcleo geométrico y la caja de herramientas principal están completados; la persistencia está parcialmente disponible ( `.opx` y `.cp`).
- **Avance estimado de la Fase 2**: ~72 %. El cálculo considera 13 hitos planificados: 9 completados (fundamentos, renderizado, herramientas básicas/avanzadas, inspector, importación `.opx/.cp`) y 4 pendientes (portapapeles, múltiples documentos, exportes gráficos y soporte `.fold`).
- **Riesgos**: deuda pendiente en portapapeles/multiproyecto podría bloquear validación de plegado y UI de fases posteriores si no se prioriza.

## Seguimiento del plan por sesiones
| Sesión planeada | Objetivos clave | Estado al 2024-05-16 | Comentarios |
| --- | --- | --- | --- |
| 1. Auditoría y especificación | Levantar inventario funcional y backlog priorizado. | ✅ Completado | Especificación y backlog inicial documentados (`documents/web/web_reimplementation_spec.md`, `documents/web/backlog.md`). |
| 2. Diseño base del proyecto web | Estructura HTML5/ESM, convenciones y documentación. | ✅ Completado | Repositorio `webapp/` con scaffolding, ESLint/Prettier y README consolidados. |
| 3. Renderizado y estado central | Canvas, store observable, undo/redo básico. | ✅ Completado | `documentStore` maneja historial, selección y renderizado en capas. |
| 4. Herramientas de entrada de líneas | Selección y herramientas de dibujo principales. | ✅ Completado | Herramientas de segmento, selección y panel de propiedades operativos. |
| 5. Operaciones de edición avanzadas | Copiar/cortar/pegar, escalado, borrado, múltiples patrones. | ⚠️ Parcial | Escalado, movimiento y borrado implementados; **portapapeles y multiproyecto pendientes**. |
| 6. Persistencia de archivos | Parsers `.opx/.cp/.fold`, exportes PNG/JPG. | ⚠️ Parcial | `.opx` y `.cp` completos con UI; faltan `.fold` y exportes raster. |
| 7. Motor de plegado – fundamentos | Validaciones locales de plegabilidad. | ⏳ No iniciado | Dependiente de cerrar edición/persistencia. |
| 8. Motor de plegado – transformación geométrica | Subcaras y visualización plegada. | ⏳ No iniciado | Requiere progreso en motor de plegado base. |
| 9. Motor de plegado – solapes y enumeración | Ordenes arriba/abajo y estados alternativos. | ⏳ No iniciado | Bloqueado por sesiones 7-8. |
| 10. Integraciones finales y QA | Exportes, pruebas, documentación final. | ⏳ No iniciado | Programado tras completar plegado y persistencia. |

## Próximas acciones recomendadas
1. **Portapapeles (copiar/cortar/pegar)**: implementar snapshots de selección y transformaciones relativas (dependencia directa para multi-documento). Prioridad Alta.
2. **Gestión de múltiples patrones**: introducir pestañas/documentos en `documentStore` y UI. Prioridad Media-Alta.
3. **Codec `.fold` y exportes PNG/JPG**: cerrar PER-2/PER-3 para habilitar ciclo completo de persistencia. Prioridad Alta.
4. **Planificación del motor de plegado**: preparar diseño técnico detallado mientras se libera deuda de edición, para iniciar Sesión 7 sin retrasos.

## Notas sobre la estimación de Fase 2
- La Fase 2 se divide en 13 entregables concretos. Se consideran completados: FND-1/2/3/4, GEO-1, RND-1/2/3/4, PER-1 (parcial) y PER-2 (parcial). Para fines de porcentaje se ponderó cada hito de forma uniforme.
- Ajustes de estimación futuros deberán revisitar la ponderación si nuevos requisitos emergen (p. ej. guardado automático IndexedDB, QA end-to-end).
- Se recomienda mantener el indicador de progreso basado en hitos cerrados para evitar regresiones en la comunicación de avance.
