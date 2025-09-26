# Backlog inicial ORIPA Web

## Leyenda
- **P**: prioridad (Alta/Media/Baja)
- **E**: esfuerzo relativo (1 = día, 5 = dos semanas)
- **Dep**: dependencias clave

## Fundamentos
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| FND-1 | Configurar proyecto web HTML5/ESM sin bundler con estructura base de carpetas. | Alta | 2 | — |
| FND-2 | Documentar arquitectura base y decisiones de bootstrap de la app. | Alta | 1 | FND-1 |
| FND-3 | Definir convención de estilos (ESLint, Prettier, editorconfig) y flujos de CI iniciales. | Media | 2 | FND-1 |
| FND-4 | Crear carpeta de muestras de patrones y guía de pruebas manuales. | Media | 1 | FND-1 |

> **Actualización 2024-05-03**: Se configuraron linters/formatters (FND-3) y se creó la carpeta inicial de muestras con checklist manual (FND-4).

> **Actualización 2024-05-04**: Se inició la implementación geométrica (GEO-1) con vectores, segmentos, rayos e intersecciones cubiertos por pruebas unitarias y renderizados en el documento inicial.

## Núcleo geométrico
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| GEO-1 | Portar entidades geométricas básicas (Vector2, LineSegment, Ray) con utilidades matemáticas. | Alta | 3 | FND-1 |
| GEO-2 | Implementar estructura de datos de grafo de caras y aristas para el patrón. | Alta | 5 | GEO-1 |
| GEO-3 | Portar verificación de plegabilidad local (Demaine & O'Rourke) a JS y crear pruebas unitarias. | Alta | 5 | GEO-1 |

## Renderizado y herramientas
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| RND-1 | Renderizar patrón estático en Canvas con capas de selección y guías. | Alta | 3 | GEO-1 |
| RND-2 | Implementar controlador de herramientas con línea básica y selección rectangular. | Alta | 3 | RND-1 |
| RND-3 | Añadir transformaciones (mover, escalar) sobre selección múltiple. | Alta | 4 | RND-2 |
| RND-4 | Implementar herramientas avanzadas (bisectriz, perpendicular, simetría). | Media | 5 | RND-2 |

> **Actualización 2024-05-05**: El toolbox integra selección rectangular con resaltado en canvas y actualización del estado de selección en el store.

> **Actualización 2024-05-06**: Se habilitó la herramienta de movimiento con arrastre directo, historial de transformaciones y actualización dinámica de vértices (RND-3).

> **Actualización 2024-05-07**: Se añadió escalado uniforme con pivote automático, registro en historial y pruebas unitarias para completar RND-3.

> **Actualización 2024-05-08**: La herramienta de selección admite eliminar segmentos con Supr/Backspace y el store registra la operación en el historial con metadatos por arista.

> **Actualización 2024-05-09**: Se añadió la herramienta Perpendicular (RND-4) que reutiliza el tipo de pliegue de la arista base y cuenta con pruebas unitarias.

> **Actualización 2024-05-10**: Se incorporó la herramienta Bisectriz (RND-4) con selección de aristas de referencia y generación automática del tipo de pliegue resultante.

> **Actualización 2024-05-11**: La herramienta de Simetría refleja segmentos respecto a una arista existente y completa el set RND-4.

> **Actualización 2024-05-12**: El panel de selección permite reasignar tipos de pliegue de forma masiva y deja documentado el tamaño de la selección.

> **Actualización 2024-05-13**: Se incorporó un parser/serializador `.opx` junto con importación en el `documentStore`, cubierto por pruebas unitarias.

> **Actualización 2024-05-14**: La UI del prototipo permite importar y exportar archivos `.opx` desde la barra lateral con mensajes de estado accesibles.
>
> **Actualización 2024-05-15**: Se añadió soporte `.cp` al store y a la barra lateral, incluyendo parser/serializador dedicado y botones de exportación/importación con historial.

## Persistencia
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| PER-1 | Implementar parser y serializador `.opx` (XML) con subset mínimo. | Alta | 4 | GEO-2 |
| PER-2 | Añadir importación `.cp` y exportación `.fold`. | Alta | 5 | PER-1 |
| PER-3 | Exportación a PNG/JPG desde Canvas. | Media | 2 | RND-1 |
| PER-4 | Exportación SVG del modelo plegado con líneas auxiliares. | Alta | 4 | FLD-3 |

## Motor de plegado
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| FLD-1 | Migrar pipeline de corte y propagación de caras a Web Worker. | Alta | 5 | GEO-2 |
| FLD-2 | Determinar relaciones de solape con detección de penetraciones. | Alta | 5 | FLD-1 |
| FLD-3 | Enumerar estados plegables y exponer selector de resultados. | Alta | 5 | FLD-2 |

## UI y experiencia de usuario
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| UI-1 | Diseñar layout web responsivo con barra de herramientas, canvas y paneles. | Alta | 3 | FND-1 |
| UI-2 | Sistema de atajos configurable con overlay de ayuda. | Media | 2 | UI-1 |
| UI-3 | Implementar administrador de múltiples patrones con pestañas. | Media | 3 | PER-1 |
| UI-4 | Integrar guardado automático en IndexedDB. | Media | 3 | PER-1 |

## Automatizaciones
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| AUTO-1 | Crear script Node para conversiones batch `.opx` ↔ `.fold` usando lógica compartida. | Media | 3 | PER-2 |
| AUTO-2 | Implementar modo headless para cálculo de plegado desde CLI (Node). | Media | 4 | FLD-3 |

## Calidad
| ID | Historia | P | E | Dep |
| --- | --- | --- | --- | --- |
| QA-1 | Configurar pruebas end-to-end básicas con Playwright. | Media | 3 | UI-1 |
| QA-2 | Construir suite de regresión basada en patrones de ejemplo. | Media | 4 | QA-1 |
