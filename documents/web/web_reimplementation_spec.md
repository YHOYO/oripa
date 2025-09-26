# ORIPA Web Reimplementation Specification

## 1. Objetivo y alcance
- **Meta principal**: reimplementar ORIPA como aplicación 100 % web con paridad funcional respecto a la versión de escritorio, manteniendo cálculo de plegado, herramientas de edición de patrones y opciones de importación/exportación.【F:README.md†L4-L18】
- **Plataforma**: navegador moderno con soporte de HTML5, CSS y JavaScript ES Modules sin dependencias nativas.
- **Compatibilidad de archivos**: lectura/escritura de `.opx`, `.cp` y `.fold`, además de exportes a PNG/JPG y SVG para patrones y modelos plegados.【F:README.md†L12-L23】【F:README.md†L30-L55】

## 2. Inventario funcional
| Dominio | Capacidades requeridas |
| --- | --- |
| Entrada de líneas | Todas las herramientas de creación de aristas (línea libre, ángulo dado, bisectriz, perpendicular, simetría, copia, etc.).【F:README.md†L12-L23】|
| Edición | Selección múltiple, traslación, escalado, borrado, modificación de tipo de pliegue, operaciones de deshacer/rehacer y gestión de múltiples patrones simultáneos.【F:README.md†L12-L23】|
| Portapapeles | Cortar/copiar/pegar con selección de vértice de origen y atajos estándar.【F:README.md†L15-L18】|
| Persistencia | Abrir/guardar proyectos `.opx`, conversión a `.fold`, importación `.cp` y exportación de imágenes raster (PNG/JPG).【F:README.md†L12-L23】【F:README.md†L30-L55】|
| Motor de plegado | Verificación de plegabilidad local, cálculo completo de caras/subcaras, determinación de solapes y enumeración de estados plegables basados en los algoritmos documentados.【F:documents/algorithms.md†L1-L56】|
| Salidas plegadas | Generación de SVG del modelo plegado incluyendo líneas auxiliares.【F:README.md†L12-L23】|
| CLI/Web Workers | Preservar automatizaciones (conversión, plegado, exportes) mediante procesos en segundo plano (Web Workers) para no bloquear la UI.【F:README.md†L37-L67】|

## 3. Requisitos técnicos
1. **Arquitectura modular** organizada en capas:
   - Núcleo geométrico y de plegado con algoritmos portados desde Java a TypeScript/JavaScript (uso opcional de JSDoc para tipado).
   - Modelo de datos reactivo con historial de comandos (undo/redo) y sistema de eventos.
   - Renderizado Canvas 2D (patrones) y SVG/WebGL para modelos plegados.
   - Capa de UI basada en componentes Web (Custom Elements) o composición modular sin frameworks.
2. **Gestión de estado** centralizada (patrón store + comandos) para soportar múltiples documentos y sincronización con persistencia.
3. **Workers** dedicados para tareas pesadas: verificación de plegado y enumeración de estados.
4. **Internacionalización** y accesibilidad básica heredadas de la versión actual (soporte de atajos, tooltips y layout flexible).
5. **Pruebas** automatizadas con vitest/jest (núcleo algorítmico) y Playwright o Web Test Runner para flujos críticos.
6. **Herramientas de desarrollo**: servir directamente archivos ESM durante las primeras fases; incorporar bundler ligero de ser necesario junto con ESLint/Prettier y configuración editorconfig.

## 4. Diseño de módulos
### 4.1 Núcleo geométrico
- Representación de vértices, aristas y caras con estructuras inmutables y utilidades de operaciones vectoriales.
- Implementación de algoritmos de plegabilidad local (Demaine & O'Rourke) y cálculo de subcaras siguiendo el flujo del motor original.【F:documents/algorithms.md†L1-L56】
- Motor de restricciones para validación en tiempo real al dibujar (evitar intersecciones ilegales y asegurar teoremas de Kawasaki y Maekawa como pre-validación rápida).

### 4.2 Modelo de documento
- `ProjectStore`: mantiene metadatos (nombre, rutas, historial de exportes) y orquesta múltiples patrones simultáneos.
- `PatternDocument`: estado de un patrón (lista de líneas, atributos, selección, historial de comandos) con serialización/deserialización hacia `.opx/.cp/.fold`.
- Sistema de comandos con pila doble (`undoStack`, `redoStack`) y serialización de comandos para macros.

### 4.3 Renderizado y herramientas
- `PatternRenderer`: capa Canvas que dibuja líneas con estilos configurables y capas auxiliares (selección, guías, resaltados).
- `ToolController`: coordina herramientas de entrada (line tool, bisector, copy, etc.) y sugiere opciones basadas en contexto.
- `SelectionManager` y `TransformationService` para edición (mover, escalar, borrar) incluyendo reglas de snapping.

### 4.4 Motor de plegado
- `FoldingWorker`: worker que ejecuta pipeline de cuatro pasos (validación, cortes, resolución de solapes, enumeración).【F:documents/algorithms.md†L17-L56】
- `OverlapGraph`: grafo dirigido que modela relaciones arriba/abajo y soporta backtracking para estados alternativos.
- `FoldedStateView`: genera geometría 3D/2.5D proyectada a SVG con opciones de exportación.

### 4.5 Persistencia e importadores
- Abstracción `FileCodec` con implementaciones para `.opx`, `.cp` y `.fold`; utiliza `DOMParser`/`XMLSerializer` para formatos XML y DataView para binarios.
- `ImageExporter`: renderiza patrones vía Canvas `toDataURL`, y modelos plegados con `svg` serializable.
- Interfaz de conversión masiva reutilizable por la UI y servicios de línea de comandos (p.e. modo batch en Node).

### 4.6 Interfaz de usuario
- Layout principal dividido en: barra de herramientas, canvas central, panel de propiedades, panel de estados plegados.
- Sistema de atajos configurable (registrador central) que mapea a comandos y expone overlay de ayuda.
- Guardado automático en `IndexedDB` y soporte drag-and-drop para archivos.

## 5. Roadmap de implementación
1. **Infraestructura del proyecto web**: levantar scaffolding HTML5/ESM sin bundler, documentación de arquitectura y CI básico.
2. **Modelo base y renderizador**: port de entidades geométricas, renderizado de patrones estáticos y motor de comandos.
3. **Herramientas de dibujo esenciales**: líneas básicas, selección y transformaciones.
4. **Persistencia inicial**: import/export de `.opx` (subset) y guardado en IndexedDB.
5. **Folding core (fase 1)**: comprobación de plegabilidad local con pruebas.
6. **Herramientas avanzadas y portapapeles**: pegado relativo, escalado proporcional, borrado por arrastre.
7. **Folding core (fase 2)**: cálculo de subcaras, solapes y enumeración con visualización.
8. **Exportes avanzados**: PNG/JPG de patrones y SVG del modelo plegado.
9. **CLI/Automatizaciones**: empaquetar scripts Node y exponer UI para lotes.
10. **QA y documentación**: suites de regresión, manual de usuario web y guía de contribución.

## 6. Artefactos de seguimiento
- **Backlog**: mantener en `documents/web/backlog.md` con historias priorizadas, dependencias y estimaciones.
- **Bitácora de sesiones**: registrar en `documents/web/sessions/YYYY-MM-DD.md` los avances, bloqueos y próximos pasos.
- **Patrones de prueba**: curar carpeta `documents/web/samples/` con patrones representativos para pruebas manuales y automatizadas.

## 7. Próximos pasos inmediatos
1. Crear backlog inicial priorizado y plantillas de bitácora/samples.
2. Investigar esquemas exactos de `.opx`, `.cp` y `.fold` revisando código Java existente para planificar parsers.
3. Definir convenciones de código (linting, estilo de commits) y plantillas de pruebas automatizadas.
4. Establecer estrategia de migración progresiva (p.e. incrustar visor web dentro de la app Java mientras se completa la paridad).
