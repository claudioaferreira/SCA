# Fase 1 — `core/constants/` paso a paso

> Esta guía te lleva de la mano por la primera fase del plan: **eliminar los magic numbers** del código creando archivos de constantes.
>
> Tiempo estimado: 30-45 minutos. Riesgo: muy bajo (sólo renombras valores, no cambias lógica).

---

## 1. ¿Qué es un "magic number"?

Es un número que aparece directamente en el código sin contexto, y obliga al que lee a recordar qué significa.

**Ejemplo de tu código actual** (`asignaciones-semanal.component.ts` línea 397):

```ts
.filter(i => !i.esNueva && i.tipoId === 1)
```

Para entender qué significa `1` tienes que recordar: *"ah, 1 es Sede Central"*. Y si en seis meses miras este código, ya lo olvidaste. Si tu equipo crece, el otro programador tiene que adivinar.

**Ejemplo después del refactor:**

```ts
.filter(i => !i.esNueva && i.tipoId === TIPO_ASIGNACION.SEDE)
```

Ahora se lee como un texto: *"items que NO son nuevos Y son tipo SEDE"*. Sin necesidad de recordar nada.

---

## 2. ¿Qué es la carpeta `core/`?

Es **una convención de Angular**. La idea:

| Carpeta | Para qué |
|---|---|
| `core/` | Cosas que se usan en **todo** el proyecto y se cargan **una vez**: constantes, interceptors, guards, servicios singleton globales. |
| `shared/` | Componentes reutilizables (botones, breadcrumb, tarjetas) que se importan en varias features. |
| `features/` | El código **propio de cada pantalla**: empleados, asignaciones, gestión humana. |
| `layout/` | Header, sidebar, footer (la cáscara de la app). |

`core/constants/` es para los valores fijos que vienen de los catálogos de la BD: tipos de asignación, estados, roles, lo que sea que tenga IDs estables.

---

## 3. Lo que ya te dejé creado

Acabo de crear dos archivos nuevos en tu proyecto. Ábrelos y míralos antes de seguir:

```
src/app/core/
└── constants/
    ├── tipo-asignacion.ts      ← ★ NUEVO
    └── estado-asignacion.ts    ← ★ NUEVO
```

### 3.1 Contenido de `tipo-asignacion.ts`

```ts
export const TIPO_ASIGNACION = {
  SEDE:     1,
  METRO:    2,
  INTERIOR: 3,
  EXTERIOR: 4,
} as const;

export const TIPOS_CON_LIMITE: number[] = [
  TIPO_ASIGNACION.METRO,
  TIPO_ASIGNACION.INTERIOR,
  TIPO_ASIGNACION.EXTERIOR,
];

export const TIPOS_CON_RUTA: number[] = [
  TIPO_ASIGNACION.METRO,
  TIPO_ASIGNACION.INTERIOR,
];

export function nombreTipo(idTipo: number): string { ... }
```

**Lo que cada cosa hace:**

- **`TIPO_ASIGNACION`** es un objeto con los IDs que vienen de la tabla `Cat_TipoAsignacion`. El `as const` al final hace que TypeScript lo trate como **inmutable** (no podrás cambiar `TIPO_ASIGNACION.SEDE = 99` por accidente).
- **`TIPOS_CON_LIMITE`** es la lista de tipos que bloquean al técnico toda la semana (Metro, Interior, Exterior). Antes tenías esto duplicado dentro del componente como `private readonly TIPOS_CON_LIMITE = [2, 3, 4]`.
- **`TIPOS_CON_RUTA`** son los que necesitan formulario de detalle (fechas, ticket, chofer, placa, centros).
- **`nombreTipo(id)`** es un helper para mostrar el nombre cuando aún no cargaste el catálogo de la API.

### 3.2 Contenido de `estado-asignacion.ts`

```ts
export const ESTADO_ASIGNACION = {
  OCUPADO:    1,
  EN_CURSO:   2,
  DISPONIBLE: 3,
} as const;
```

Antes tenías `idEstado !== 3` regado por todos lados. Ahora se escribe `idEstado !== ESTADO_ASIGNACION.DISPONIBLE`.

---

## 4. Cómo importarlas (TypeScript básico)

Al inicio de cualquier archivo donde las quieras usar:

```ts
import { TIPO_ASIGNACION, TIPOS_CON_LIMITE, TIPOS_CON_RUTA } from '../../core/constants/tipo-asignacion';
import { ESTADO_ASIGNACION } from '../../core/constants/estado-asignacion';
```

> **Nota sobre las rutas relativas (`../../`)**: cuenta cuántas carpetas tienes que subir desde el archivo donde estás hasta llegar a `src/app/`. Por ejemplo, desde `src/app/pages/asignaciones-semanal/asignaciones-semanal.component.ts` hay que subir 2 niveles → `../../core/constants/...`.

---

## 5. Reemplazos a hacer — lista completa con archivo y línea

Hice una búsqueda en tu código y estos son **TODOS** los lugares donde aparecen magic numbers de tipos y estados. Ve uno por uno.

### 5.1 En `asignaciones-semanal.component.ts`

| Línea | ANTES | DESPUÉS |
|---|---|---|
| 43 | `private readonly TIPOS_CON_LIMITE: number[] = [2, 3, 4];` | **BORRAR** esta línea — ya viene importada |
| 189 | `i.uid !== itemActual?.uid && this.TIPOS_CON_LIMITE.includes(i.tipoId)` | `i.uid !== itemActual?.uid && TIPOS_CON_LIMITE.includes(i.tipoId)` (sin `this.`) |
| 194 | `if (!this.TIPOS_CON_LIMITE.includes(t.IdTipo)) return true;` | `if (!TIPOS_CON_LIMITE.includes(t.IdTipo)) return true;` |
| 256 | `i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)` | `i.idEstado !== ESTADO_ASIGNACION.DISPONIBLE && TIPOS_CON_LIMITE.includes(i.tipoId)` |
| 397 | `i.tipoId === 1` | `i.tipoId === TIPO_ASIGNACION.SEDE` |
| 409 | `i.tipoId !== 2` | `i.tipoId !== TIPO_ASIGNACION.METRO` |
| 425 | `i.tipoId !== 3 && i.tipoId !== 4` | `i.tipoId !== TIPO_ASIGNACION.INTERIOR && i.tipoId !== TIPO_ASIGNACION.EXTERIOR` |
| 467 | `i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)` | `i.idEstado !== ESTADO_ASIGNACION.DISPONIBLE && TIPOS_CON_LIMITE.includes(i.tipoId)` |
| 477 | `this.TIPOS_CON_LIMITE.includes(i.tipoId)` | `TIPOS_CON_LIMITE.includes(i.tipoId)` |
| 479 | `this.TIPOS_CON_LIMITE.every(...)` | `TIPOS_CON_LIMITE.every(...)` |
| 512 | `if (this.TIPOS_CON_LIMITE.includes(item.tipoId))` | `if (TIPOS_CON_LIMITE.includes(item.tipoId))` |
| 529 | `item.tipoId === 2 ? item.dias : item.cantidad` | `item.tipoId === TIPO_ASIGNACION.METRO ? item.dias : item.cantidad` |
| 535 | `item.tipoId === 1 ? Number(...)` | `item.tipoId === TIPO_ASIGNACION.SEDE ? Number(...)` |
| 536 | `(item.tipoId === 2 \|\| item.tipoId === 3)` | `(item.tipoId === TIPO_ASIGNACION.METRO \|\| item.tipoId === TIPO_ASIGNACION.INTERIOR)` |
| 540 | `[2, 3].includes(item.tipoId)` | `TIPOS_CON_RUTA.includes(item.tipoId)` |
| 641 | `item.idEstado = 3;` | `item.idEstado = ESTADO_ASIGNACION.DISPONIBLE;` |
| 645 | `actualizarEstadoAsignacion(item.idAsignacion, 3)` | `actualizarEstadoAsignacion(item.idAsignacion, ESTADO_ASIGNACION.DISPONIBLE)` |
| 647 | `item.idEstado = 1;` | `item.idEstado = ESTADO_ASIGNACION.OCUPADO;` |
| 657 | `if (item.tipoId === 1) return;` | `if (item.tipoId === TIPO_ASIGNACION.SEDE) return;` |
| 658 | `item.idEstado = 1;` | `item.idEstado = ESTADO_ASIGNACION.OCUPADO;` |
| 662 | `actualizarEstadoAsignacion(item.idAsignacion, 1)` | `actualizarEstadoAsignacion(item.idAsignacion, ESTADO_ASIGNACION.OCUPADO)` |
| 664 | `item.idEstado = 3;` | `item.idEstado = ESTADO_ASIGNACION.DISPONIBLE;` |
| 769 | `i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)` | `i.idEstado !== ESTADO_ASIGNACION.DISPONIBLE && TIPOS_CON_LIMITE.includes(i.tipoId)` |
| 860 | `asigOcupada.tipoId === 1` | `asigOcupada.tipoId === TIPO_ASIGNACION.SEDE` |
| 862 | `asigOcupada.tipoId === 2` | `asigOcupada.tipoId === TIPO_ASIGNACION.METRO` |
| 864 | `asigOcupada.tipoId === 3 \|\| asigOcupada.tipoId === 4` | `asigOcupada.tipoId === TIPO_ASIGNACION.INTERIOR \|\| asigOcupada.tipoId === TIPO_ASIGNACION.EXTERIOR` |

### 5.2 En `asignaciones-semanal.component.html`

> **¡Importante!** En los templates Angular puedes usar las constantes, pero hay que exponerlas desde el componente. Te explico abajo.

Líneas afectadas (todas dentro de `*ngIf` o `[class.X]="..."`):

- 303: `item.idEstado !== 3 && item.tipoId !== 0`
- 305: `[class.chip-libre]="item.idEstado === 3"`
- 314-317: `item.tipoId === 1/2/3/4`
- 321: `item.tipoId === 1`
- 324: `item.tipoId === 2`
- 327: `item.tipoId === 3 \|\| item.tipoId === 4`
- 332: `item.idEstado !== 3 ? "🔴" : "🟢"`
- 351, 373: `item.idEstado !== 3` y `=== 3`
- 380: `item.tipoId !== 1`
- 444, 455, 512: `item.tipoId === 1/2/3`

**Para usar las constantes en el template HTML:**

Dentro del componente `.ts` agrega estas dos líneas como propiedades públicas:

```ts
export class AsignacionesSemanalComponent implements OnInit {
  // … (todo lo que ya tienes)

  // Exponer constantes al template
  readonly TIPO   = TIPO_ASIGNACION;
  readonly ESTADO = ESTADO_ASIGNACION;
}
```

Luego en el HTML escribes:

```html
<!-- ANTES -->
[class.dot-sede]="item.tipoId === 1"

<!-- DESPUÉS -->
[class.dot-sede]="item.tipoId === TIPO.SEDE"
```

---

## 6. Cómo hacer los cambios sin volverte loco

### Estrategia recomendada — un archivo a la vez

1. **Abre `asignaciones-semanal.component.ts`** en VS Code.
2. **Agrega los imports** al inicio del archivo (antes de la línea `@Component`):

   ```ts
   import { TIPO_ASIGNACION, TIPOS_CON_LIMITE, TIPOS_CON_RUTA } from '../../core/constants/tipo-asignacion';
   import { ESTADO_ASIGNACION } from '../../core/constants/estado-asignacion';
   ```

3. **Borra la línea 43** (`private readonly TIPOS_CON_LIMITE: number[] = [2, 3, 4];`).
4. **Usa Buscar y reemplazar** (Ctrl+H en VS Code) **archivo por archivo** (no en todo el proyecto a la vez):
   - Buscar: `this.TIPOS_CON_LIMITE` → Reemplazar: `TIPOS_CON_LIMITE`
   - Buscar: `i.idEstado !== 3` → Reemplazar: `i.idEstado !== ESTADO_ASIGNACION.DISPONIBLE`
   - Buscar: `i.idEstado === 3` → Reemplazar: `i.idEstado === ESTADO_ASIGNACION.DISPONIBLE`
   - Buscar: `tipoId === 1` → Reemplazar: `tipoId === TIPO_ASIGNACION.SEDE`
   - Buscar: `tipoId === 2` → Reemplazar: `tipoId === TIPO_ASIGNACION.METRO`
   - Buscar: `tipoId === 3` → Reemplazar: `tipoId === TIPO_ASIGNACION.INTERIOR`
   - Buscar: `tipoId === 4` → Reemplazar: `tipoId === TIPO_ASIGNACION.EXTERIOR`
   - Buscar: `tipoId !== 1` → Reemplazar: `tipoId !== TIPO_ASIGNACION.SEDE`
   - Buscar: `tipoId !== 2` → Reemplazar: `tipoId !== TIPO_ASIGNACION.METRO`

5. **Para el HTML**, primero expón las constantes en la clase (paso 5.2 arriba) y luego haz los reemplazos similares con `TIPO.SEDE`, `ESTADO.DISPONIBLE`, etc.

6. **Guarda y prueba**. Si el `ng serve` está corriendo, el navegador se recarga solo. Verifica:
   - Que se cargue la grilla de asignaciones.
   - Que puedas agregar / guardar / eliminar una asignación.
   - Que las alertas (técnico ocupado, tipo duplicado) sigan apareciendo.

### Si algo se rompe

- Mira la consola del navegador (F12) — TypeScript suele decirte exactamente qué línea.
- Si el error es `Cannot read property 'X' of undefined`, probablemente olvidaste un `import`.
- Si dice `TIPO_ASIGNACION is not defined`, el path del import está mal — recuerda contar bien los `../`.

---

## 7. Validación final — checklist

Antes de dar Fase 1 por terminada, asegúrate de:

- [ ] No queda **ningún** `tipoId === 1`, `=== 2`, `=== 3`, `=== 4` en el `.ts`.
- [ ] No queda **ningún** `idEstado === 3` o `!== 3` en el `.ts`.
- [ ] No queda la línea `private readonly TIPOS_CON_LIMITE = [2, 3, 4]`.
- [ ] El HTML usa `TIPO.SEDE`, `TIPO.METRO`, etc. en lugar de `=== 1`, `=== 2`.
- [ ] El proyecto compila (`ng build` o el watch de `ng serve` no muestra errores).
- [ ] La grilla semanal sigue funcionando exactamente igual que antes.

Cuando todo esté ✅, vuelve a abrir `01-arquitectura-actual.md` y marca la **Fase 1** como completada.

---

## 8. Lo que viene después

Cuando termines esto y todo siga funcionando:

- **Fase 2**: separar las interfaces y servicios (te paso otra guía igual de detallada cuando llegues acá).
- **Fase 3**: mover archivos a la nueva estructura de carpetas `features/`.
- **Fase 4**: módulo de Gestión Humana (lo que es tu meta original).

> **Consejo final**: no avances hasta que esta fase esté 100% funcionando. La tentación es saltar a Gestión Humana ya, pero si lo haces sobre código desordenado, vas a duplicar el problema. Esto que estás haciendo es el "ordenar el cuarto antes de meter más muebles".
