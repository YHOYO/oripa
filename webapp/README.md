# ORIPA Web Prototype – Phase 2

This directory contains the base project scaffolding for the HTML5/JavaScript reimplementation of ORIPA. The goal for **Phase 2** is to establish a maintainable structure that future sessions can extend with the full feature set documented in [`documents/web/web_reimplementation_spec.md`](../documents/web/web_reimplementation_spec.md).

## Directory layout

```
webapp/
├── index.html            # Shell document that loads the ESM application.
├── styles/
│   └── main.css          # Global styling for the prototype layout.
└── src/
    ├── app/              # Bootstrap helpers and cross-cutting composition.
    ├── core/
    │   └── geometry/     # Vector, segment, ray primitives and math utilities.
    ├── io/               # OPX import/export adapters and future persistence layers.
    ├── rendering/        # Canvas/SVG rendering layers.
    ├── state/            # Reactive state containers and models.
    └── ui/               # DOM-level presentation components.
```

Only a minimal subset of folders currently contain files; placeholders exist to clarify ownership for upcoming phases. The
`core/geometry` primitives fuel both rendering and future folding checks.

## Development workflows

The project now ships with linting and formatting tooling to keep the early-stage codebase consistent.

### Prerequisites

- Node.js 18 or newer (the scripts rely on native ES modules).

Run the following commands from the `webapp/` directory:

| Command | Description |
| --- | --- |
| `npm install` | Installs ESLint and Prettier dev dependencies. |
| `npm run lint` | Checks all `src/**/*.js` modules with ESLint. |
| `npm run test` | Executes the geometry unit tests with Node's built-in test runner. |
| `npm run format` | Verifies JS and CSS files with Prettier (no changes). |
| `npm run format:write` | Applies Prettier formatting to JS and CSS assets. |

These scripts will be hooked into future CI once automated workflows are defined.

## Application bootstrap

The entry point `src/app/bootstrap.js` wires together:

* `createDocumentStore` &mdash; an observable store that emits the crease-pattern document state.
* `createCanvasPresenter` &mdash; the 2D renderer responsible for drawing grid and edge layers.
* `createToolRegistry`, `createSelectionInspector` and `createHistoryTimeline` &mdash; lightweight DOM presenters to populate the sidebar.

When the page loads the application:

1. Mounts the UI presenters onto the DOM.
2. Subscribes them to the document store.
3. Emits an initial crease-pattern document that pre-populates a square frame, diagonals, and spokes using the shared geometry
   utilities.
4. Updates the header indicator with the active roadmap phase ("Phase 2 · Proyecto base").

## Herramientas disponibles (avance Fase 2)

Las primeras herramientas interactivas ya están enlazadas con el canvas y el historial del documento:

- **Selección (V)** &mdash; Permite seleccionar aristas individuales o por marco rectangular, eliminar la selección con Supr/Backspace y actualizar el tipo de pliegue desde el panel lateral.
- **Mover (M)** &mdash; Traslada la selección activa con arrastre directo y registra la distancia recorrida.
- **Escalar (S)** &mdash; Aplica un escalado uniforme alrededor del centroide de la selección conservando un snapshot para cancelar.
- **Simetría (Y)** &mdash; Refleja aristas dibujadas respecto a una arista base conservando su tipo de pliegue.
- **Bisectriz (B)** &mdash; Calcula la bisectriz de dos aristas existentes y genera una nueva arista usando su punto de intersección.
- **Perpendicular (P)** &mdash; Traza aristas ortogonales a una arista base seleccionada y reutiliza el tipo de pliegue original.
- **Segmento (L)** &mdash; Traza nuevas aristas de pliegue en el patrón activo.

Además de las herramientas, la **inspección de selección** del panel lateral muestra el tamaño de la selección y permite asignar rápidamente los tipos estándar (montaña, valle, borde, auxiliar) a todas las aristas seleccionadas.

El nuevo panel de **portapapeles** habilita atajos nativos (Ctrl/Cmd+C, X, V) y controles visibles para copiar, cortar y pegar la selección actual. Cada pegado genera aristas nuevas con desplazamientos configurables y registra la operación en el historial para mantener trazabilidad.

## Gestión de documentos

- **Pestañas de proyectos** &mdash; El encabezado de la aplicación muestra todos los patrones abiertos, permitiendo alternar entre ellos sin perder el estado.
- **Creación y cierre** &mdash; Es posible abrir múltiples documentos vacíos en paralelo y cerrar cualquiera de ellos; siempre se mantiene al menos un patrón disponible.
- **Renombrado en línea** &mdash; El formulario contextual actualiza el nombre del documento activo y sincroniza el cambio con el panel de archivo y el historial.

## Persistencia inicial

- **Importación `.opx`** &mdash; El estado de la aplicación puede reemplazarse desde archivos XML de ORIPA (subset `OriLineProxy`). La barra lateral expone un selector de archivos que procesa las cargas directamente en el navegador.
- **Importación `.cp`** &mdash; Se aceptan archivos de texto plano con la convención histórica de ORIPA (tipo numérico + coordenadas). El documento se normaliza en el store y conserva un registro de historial.
- **Exportación `.opx`** &mdash; El documento activo se serializa nuevamente al formato esperado por ORIPA y el panel de archivo descarga automáticamente el resultado.
- **Exportación `.cp`** &mdash; El panel lateral permite generar versiones `.cp` filtrando las aristas auxiliares, como hace el exportador original.

## Next steps

Phase 3 and beyond will replace the placeholder data with live editing tools, extend the document model to include vertices, constraints, and undo/redo stacks, and add feature-complete rendering. Refer to the session log for planned milestones.

See `documents/web/samples/README.md` for curated `.opx` fixtures and the manual checklist used during Phase 2 validation.
