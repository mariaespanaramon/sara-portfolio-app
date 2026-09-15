# Plan de reestilizado completo — rama `restile-whole-website`

Una sola PR contra `main`, dividida en commits pequeños y verificables.
Cada commit debe dejar el proyecto compilando (`npx tsc --noEmit` + `npm run build` en verde).

> **Ciclo de trabajo — obligatorio en cada commit.**
> Ningún commit se crea sin que María lo haya revisado antes en local.
> Ver la sección [0. Ciclo de revisión](#0-ciclo-de-revisión-antes-de-cada-commit).

---

## 0. Ciclo de revisión antes de cada commit

Para **cada uno** de los 10 commits, en este orden y sin saltarse pasos:

1. **Implementar** solo ese commit. No adelantar trabajo de los siguientes:
   si el diff mezcla dos commits, la revisión deja de ser útil.
2. **Verificar con herramientas** y reportar el resultado real:
   ```bash
   npx tsc --noEmit && npm run lint && npm run build
   ```
3. **Levantar la web** en local:
   ```bash
   npm run dev          # → http://localhost:5173
   ```
   El servidor se queda corriendo en background durante la revisión, con HMR activo,
   para que los refinamientos se vean al instante sin reiniciar nada.
4. **Entregar a María una guía de revisión concreta**, no un "ya está":
   - qué archivos cambiaron;
   - qué URL abrir y qué mirar exactamente (ej. *"scroll cruzando el hero: el texto
     del header debe pasar de blanco a negro solo"*);
   - qué comprobar en móvil (DevTools a 375 px);
   - qué está verificado por tooling y qué **solo se puede juzgar mirándolo**;
   - qué decisiones tomé por mi cuenta dentro de ese commit.
5. **Parar y esperar.** Nada de commits en este punto.
6. **Refinar** sobre el mismo commit tantas vueltas como haga falta. Cada ronda de
   refinamiento vuelve al paso 2.
7. **Commit solo cuando María lo pida explícitamente**, con el mensaje propuesto en
   este plan (o el que ella prefiera). Después, pasar al commit siguiente y volver al paso 1.

**Reglas que se derivan de esto:**
- El `dev server` se lanza en background, nunca bloqueando la conversación.
- Si un commit resulta ser demasiado grande para revisarlo de una vez (candidatos claros:
  el 6 y el 7), se parte en dos y se avisa, en lugar de pedir una revisión de 300 líneas.
- Los commits sin nada visible que revisar (el **4**, dominio de `Section`, y el **9**,
  README) se entregan igualmente para lectura del diff: en el 4 lo que hay que validar
  son los nombres de las secciones, los slugs y el reparto de proyectos.
- Si un refinamiento contradice algo escrito en este plan, se actualiza el plan en el
  mismo commit. Un plan desactualizado a mitad de PR es peor que no tenerlo.

---

## 1. Estado actual (punto de partida)

- **Stack:** React 18 + TypeScript + Vite 5 + Tailwind 3.3 + react-router-dom 7.
- **Arquitectura hexagonal** ya establecida y que hay que respetar:
  - `src/application/domain/` — entidades (`WorkItem`, `AboutContent`, `ContactDetails`)
  - `src/application/service/` — hooks de caso de uso (`useWorkItems`, …)
  - `src/infrastructure/ports/repositories.ts` — interfaces de repositorio
  - `src/infrastructure/adapters/` — `Mock*` + `NetlifyBlobsWorkItemRepository`
  - `src/presentation/components/` — componentes React
- **Patrón factory ya existente** para tipos de work item:
  `workItemCards/` (`IWorkItemCard` + `WorkItemCardFactory`) y
  `workItemDetails/` (`IWorkItemDetail` + `WorkItemDetailFactory`), con
  implementaciones `Video*`, `Image*`, `Gallery*`. **Lo reutilizamos, no lo sustituimos.**
- **Rutas actuales:** `/` (Hero + Work + About + Contact) y `/work/:slug`.
- **Fuentes:** ya migradas a Nunito Sans (títulos/logo/menú) y Source Sans 3 (texto)
  en el commit previo de esta rama.

---

## 2. Decisiones tomadas y asunciones

| Tema | Decisión |
|---|---|
| Secciones | Las **5** enumeradas: 3D Modeling, Videoclips, Black & White, Exhibitions, Awards & Recognition. En grid de 3 columnas → 2 filas (3 + 2). |
| Gif de intro | Se muestra **una vez por pestaña** (`sessionStorage`). Recargar la misma pestaña no lo repite; abrir una pestaña nueva sí, porque `sessionStorage` está aislado por pestaña, no compartido por el navegador. |
| Fondo blanco | Tema claro completo: fondo blanco **y texto oscuro** en toda la web (home, sección, proyecto, footer). Un fondo blanco con el texto blanco actual sería ilegible, así que se invierte la paleta entera. |
| Logo/menú que cambia de color | `mix-blend-mode: exclusion` sobre texto blanco, **aplicado al `<header>` mismo**. Es el modo que usa valleeduhamel.com. El texto se calcula como inverso de lo que tiene detrás, sin JS. |
| Nombres de tokens de color | Se renombra `dark.*` → `site.*`. Dejar `dark-bg: #ffffff` sería una mentira que confundiría cualquier trabajo futuro. |
| Modelado de secciones | Nueva entidad de dominio `Section` + puerto `SectionRepository` + adaptador mock, siguiendo el patrón hexagonal existente. `WorkItem` gana `sectionSlug`. |
| Home | Solo cambia el bloque de trabajo (proyectos → secciones). Hero, About y Contact se mantienen. |
| Botón "Back" del proyecto | Además de renombrarlo, pasa a `navigate(-1)`: entrando desde una sección, volver a la home sería desorientador. |
| Idioma del código | **Todo el código en inglés**: nombres de variables, funciones, componentes, tipos, comentarios, JSDoc, mensajes de `TODO`, mensajes de error y de commit. Sin excepciones. Es lo que ya hace el repo entero. Este documento de plan se mantiene en español porque es material de trabajo, no código — pero cada snippet que contiene va en inglés, tal cual se va a escribir. |

---

## 3. Riesgos y puntos a vigilar

1. **`mix-blend-mode: exclusion` sobre gris medio (~#808080) da gris medio** → contraste casi nulo.
   Mitigación: las imágenes de fondo del header deben ser claras u oscuras, no grises planas.
   Si aparece el problema, añadir un `drop-shadow` sutil detrás del texto.
2. **El gif de Giphy es un hotlink de 2,5 MB a un tercero.** Sirve como placeholder,
   no para producción. Se aísla en una constante para cambiarlo en una línea.
3. **`items.json` de producción (Netlify Blobs) no tiene ni `type` ni `sectionSlug`.**
   El validador actual de `NetlifyBlobsWorkItemRepository` ya lanzaría error con ese dato.
   → `sectionSlug` se valida como **opcional** para no romper el deploy.
4. **Interacciones de hover no existen en táctil.** Toda reproducción "al pasar el ratón"
   necesita fallback móvil (autoplay o imagen estática), como ya hace `WorkItemCard`.
5. **5 secciones en grid de 3 columnas** dejan 2 huecos en la última fila.
   Decisión: las 2 últimas ocupan cada una 1 columna alineadas a la izquierda (sin estirar),
   dejando el hueco a la derecha. Es lo que hacen los portfolios editoriales.
6. **`prefers-reduced-motion`**: el splash y los reveals por scroll deben respetarlo.

---

## 4. Commits

### Commit 1 — `Switch site to light theme with white background`

**Objetivo:** fondo blanco y texto oscuro en toda la web.

**Archivos:**
- `tailwind.config.js` — renombrar la paleta `dark` → `site` con valores claros:
  ```js
  site: {
    bg: '#ffffff',
    surface: '#f5f5f5',
    border: '#e5e5e5',
    text: { primary: '#0a0a0a', secondary: '#4a4a4a', muted: '#8a8a8a' },
  }
  ```
  La clave `fontFamily.heading` **se mantiene aquí** y se elimina en el Commit 3.
  (Corrección sobre la versión inicial del plan: borrarla ya dejaría el logo del header,
  que todavía usa `font-heading`, sin familia asignada entre el commit 1 y el 3.)
- `src/index.css` — `@apply border-site-border` y `body { @apply bg-site-bg text-site-text-primary antialiased; }`
- `src/App.tsx` — `bg-dark-bg` → `bg-site-bg`
- Renombrado mecánico en los 8 componentes que usan tokens `dark-*`:
  `Header`, `Hero`, `Footer`, `WorkSection`, `WorkItemCard`, `WorkItemDetail`,
  `AboutSection`, `ContactSection`, `workItemCards/GalleryItemCard`.

**Cómo:** `grep -rl 'dark-' src/ | xargs sed -i '' 's/dark-bg/site-bg/g; s/dark-surface/site-surface/g; s/dark-border/site-border/g; s/dark-text/site-text/g'`
y revisar el diff a mano (hay un `bg-dark-bg/60` en `WorkItemCard` que pasa a `bg-site-bg/60`;
ese overlay se replantea en el Commit 5).

**Verificación:** `npx tsc --noEmit`, `npm run build`, `grep -rn 'dark-' src/` sin resultados.
Visual: home, `/work/:slug` y footer legibles en claro.

---

### Commit 2 — `Add intro splash with animated logo`

**Objetivo:** al abrir la web en una pestaña, logo animado centrado a pantalla completa unos segundos; luego se desvanece y aparece la home. No se repite al recargar ni al navegar dentro de la SPA.

**Archivos nuevos:**
- `src/presentation/components/IntroSplash.tsx`

**Detalle:**
- Constante aislada arriba del archivo, para sustituirla en una línea cuando haya gif propio:
  ```ts
  // TODO: replace with the final logo gif served from /public
  const INTRO_GIF_URL = 'https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.gif';
  const HOLD_MS = 2500;
  const FADE_MS = 500;
  const SESSION_KEY = 'sara-intro-seen';
  ```
- Estado: `'visible' | 'fading' | 'done'`. `useEffect` con dos `setTimeout`
  (`HOLD_MS` → fading, `HOLD_MS + FADE_MS` → done + `sessionStorage.setItem`).
  Limpiar ambos timers en el cleanup.
- No se monta si `sessionStorage.getItem(SESSION_KEY)` existe o si
  `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- **Ámbito real de `sessionStorage`:** una pestaña, no el navegador. Cada pestaña nueva
  parte con almacenamiento vacío y vuelve a ver el gif — que es el comportamiento buscado.
  Única excepción del estándar: si la pestaña se **duplica** o se abre con
  `target="_blank"` desde la propia web, el navegador copia el `sessionStorage` del
  origen y el gif no sale. No merece la pena forzarlo.
- Overlay `fixed inset-0 z-[100] bg-site-bg flex items-center justify-center`,
  gif con `max-w-[70vw] max-h-[70vh] object-contain`, `alt="Sara Ramon"`.
- Bloquear scroll mientras está visible (`document.body.style.overflow = 'hidden'`,
  restaurar en cleanup).
- Cerrar también al pulsar cualquier tecla o clic (escape hatch de accesibilidad).

**Archivos modificados:**
- `src/App.tsx` — montar `<IntroSplash />` como primer hijo dentro de `<Router>`,
  hermano del `<Header />`, para que cubra todo.

**Verificación:** primera carga muestra el gif ~2,5 s y desaparece; recargar no lo repite;
abrir en ventana nueva sí; con "reducir movimiento" activo no aparece.

---

### Commit 3 — `Restyle header and hero type with inverted colours`

**Objetivo:** logo en Nunito Sans Black (900), menú en Bold (700), y ambos con color
inverso al fondo. El título del Hero recibe el mismo tratamiento, y su descripción pasa a
subtítulo.

**Archivos:**
- `src/presentation/components/Header.tsx`
- `src/presentation/components/Hero.tsx`

**Detalle:**
- **Pesos distintos para logo y menú**, ajustados durante la revisión visual:
  - Logo: `font-heading` → `font-title font-black` (**900**). Antes no llevaba clase de
    peso, así que heredaba el 400 normal; hay que ponerla explícitamente.
  - Menú: `font-light` → `font-bold` (**700**) en los tres enlaces. Se probó primero en
    900 igual que el logo y pesaba demasiado con los enlaces ya a `text-3xl`;
    el 700 mantiene la jerarquía a favor del logo.
  - Nunito Sans se carga como fuente variable en rango `200..1000`, así que 700 y 900 son
    pesos reales del archivo, no negritas sintéticas del navegador. Ya está cubierto
    por el `<link>` de Google Fonts que hay en `index.html`; no hay que tocarlo.
  - Con peso 900 conviene revisar el `tracking-tight` del logo: a ese grosor las letras
    se juntan mucho. Si se ve apretado, subir a `tracking-normal` — a validar en la
    revisión visual.
- **Tamaño y caja del menú**, también de la revisión: los enlaces pasan de
  `text-xl` a `text-3xl` (el mismo del logo) y su texto se escribe en minúsculas
  (`work` / `about` / `contact`) en lugar de aplicar la utilidad `lowercase`, para seguir
  la convención del logo, que ya escribe `sara ramon` en minúsculas en el propio código.
  A 375 px esto desborda el header: lo resuelve el Commit 9.
- `text-white mix-blend-exclusion` **en el elemento `<header>`**, no en un contenedor
  interno. Sobre blanco da negro, sobre negro da blanco, sobre una imagen da el inverso.
  - **Esto es un error corregido durante la implementación, y el motivo importa.**
    El primer intento puso el blend en un `div` dentro del `<nav>` y salía todo blanco:
    `position: fixed` + `z-index` convierten al `<header>` en un *stacking context*, así que
    el backdrop de cualquier hijo es solo lo pintado **dentro** del header — o sea, nada.
    Blanco mezclado con un backdrop vacío sigue siendo blanco.
    En el `<header>` el backdrop es la página de detrás, y el efecto funciona.
  - Se usa `exclusion` y no `difference` porque es el modo del sitio de referencia.
    Con texto blanco ambos coinciden en los extremos (`blanco→negro`, `negro→blanco`);
    `exclusion` es algo más suave en los tonos medios.
- Quitar de los enlaces los `hover:text-site-text-secondary`: con blend de diferencia
  un cambio de color en hover produce saltos raros. Sustituir por `hover:opacity-60`
  (el logo ya usaba `hover:opacity-70`, así queda coherente).
- El `<header>` mantiene `fixed z-50 bg-transparent`. **No** añadir `isolate` ni
  `backdrop-*` a ningún ancestro: aislarían el stacking context y el blend dejaría
  de ver el fondo.

**Hero (`Hero.tsx`) — mismo tratamiento tipográfico:**
- Título `Design State Of Mind`: `font-light` → `font-bold` (**700**) más
  `text-white mix-blend-exclusion`. Se probó en 900 como el logo y resultaba demasiado
  pesado a `text-8xl`; el 700 deja el 900 reservado al logo.
- La descripción de debajo pasa a ser un **subtítulo**: se le añade `font-title` (antes
  heredaba Source Sans 3, la fuente de texto), `font-light` → `font-bold` (700) y
  `text-white` fijo. **No** lleva blend: es blanca siempre, por decisión de María.
- **Hay que quitar el `z-10` del contenedor del contenido** (`div.relative.z-10`).
  Es la misma trampa del header en otra forma: `z-index: 10` sobre un elemento posicionado
  abre un stacking context, y entonces el `h1` blendeado solo vería ese contenedor como
  backdrop, no la imagen de fondo — saldría blanco.
  Sin `z-index`, el contenedor sigue pintándose sobre la imagen: ambos son hermanos
  posicionados y este va después en el árbol.
  Queda un comentario en el componente explicando el porqué, para que nadie lo "arregle"
  devolviendo el `z-10`.

**Verificación:** scroll por la home cruzando el hero (imagen) y las secciones blancas —
el texto del header debe invertirse solo. Comprobar en Safari y Chrome
(`mix-blend-mode` tiene soporte pleno, pero conviene mirarlo sobre vídeo en reproducción).

---

### Commit 4 — `Add Section domain, port and mock adapter`

**Objetivo:** modelar las secciones en el dominio antes de tocar la UI. Commit sin cambios visuales.

**Archivos nuevos:**
- `src/application/domain/Section.ts`
  ```ts
  export interface Section {
    id: string;
    slug: string;
    title: string;
    order: number;
    coverImageUrl: string;   // static image shown at rest
    coverVideoUrl?: string;  // plays on hover
    coverGifUrl?: string;    // alternative to video for the hover state
  }
  ```
- `src/infrastructure/adapters/MockSectionRepository.ts` — las 5 secciones con
  slugs `3d-modeling`, `videoclips`, `black-and-white`, `exhibitions`,
  `awards-and-recognition`, y `order` 1..5. Media de placeholder (Pexels/Giphy)
  con `TODO` para sustituir por material real de Sara.
- `src/application/service/useSections.ts` — hook `useSections(repository)` con
  `{ sections, loading, error }`, mismo patrón exacto que `useWorkItems`
  (flag `isMounted`, cleanup).

**Archivos modificados:**
- `src/infrastructure/ports/repositories.ts` — añadir:
  ```ts
  export interface SectionRepository {
    getAll(): Promise<Section[]>;
    getBySlug(slug: string): Promise<Section | null>;
  }
  ```
- `src/application/domain/WorkItem.ts` — añadir `sectionSlug?: string;` y `gifUrl?: string;`
  (el gif de preview para proyectos de Blender/3D; para vídeos se usa `imageUrl` como foto estática).
- `src/infrastructure/adapters/MockWorkItemRepository.ts` — asignar `sectionSlug` a los
  5 items existentes y añadir 2–3 más para que cada sección tenga al menos un proyecto.
- `src/infrastructure/adapters/NetlifyBlobsWorkItemRepository.ts` — en `isValidWorkItem`,
  validar `sectionSlug` y `gifUrl` como **opcionales**
  (`workItem.sectionSlug === undefined || typeof workItem.sectionSlug === 'string'`).
  No hacerlos obligatorios: el `items.json` que ya está en producción no los tiene.
- **`src/App.tsx` NO se toca en este commit.** Corrección sobre el plan inicial:
  `tsconfig.json` tiene `noUnusedLocals: true`, así que declarar
  `const sectionRepository = new MockSectionRepository();` sin consumirlo todavía rompe
  la compilación (`TS6133`). El wiring se hace en el Commit 5, donde `SectionGrid` lo usa.

**Arreglo de datos que entra aquí (no estaba planificado):**
Todas las URLs de vídeo del repo apuntaban a `commondatastorage.googleapis.com/gtv-videos-bucket`,
que **ha dejado de ser público**: responde `403 AccessDenied` para llamadas anónimas.
O sea que los vídeos de las cards y de las pantallas de proyecto no se veían desde antes de
esta PR. Se sustituyen por tres fuentes verificadas (`mdn.github.io/shared-assets`,
`test-videos.co.uk`, `w3schools.com`). Siguen siendo placeholders.
Aparte, el vídeo real de Sara referenciado en `items.json`
(`sararamon.netlify.app/.netlify/blobs/serve/videos/moonshoe_3.mp4`) responde **404**;
queda anotado en la sección 7 porque es contenido de producción, no de este repo.

**Verificación:** `npx tsc --noEmit` y `npm run build`. La web sigue igual, salvo que los
vídeos de las cards vuelven a reproducirse.

---

### Commit 5 — `Replace project grid with section grid on home`

**Objetivo:** la home muestra las 5 secciones en lugar de los proyectos, con el estilo de las cards actuales pero al doble de alto, imagen estática que se reproduce al hover y título siempre visible.

**Archivos nuevos:**
- `src/presentation/hooks/useIsMobile.ts` — extraer la detección de móvil que hoy está
  duplicada dentro de `WorkItemCard` (listener de `resize`, breakpoint `md` = 768).
  La van a usar `SectionCard` y `WorkItemCard`.
- `src/presentation/components/SectionCard.tsx`
- `src/presentation/components/SectionGrid.tsx`

**`SectionCard` — detalle:**
- Contenedor `article` con `relative aspect-[8/9] overflow-hidden bg-site-surface cursor-pointer group`.
  **`aspect-[8/9]` es exactamente el doble de alto que el `aspect-[16/9]` de las cards actuales**
  (misma anchura, altura ×2).
- Media en capas, ambas en `absolute inset-0 object-cover`:
  - imagen estática (`coverImageUrl`), visible en reposo;
  - vídeo (`coverVideoUrl`, `loop muted playsInline preload="metadata"`) o gif
    (`coverGifUrl`), que aparece con `opacity` en transición al hacer hover.
  - Al `onMouseEnter`: `currentTime = 0` + `play()`. Al `onMouseLeave`: `pause()` + reset.
    Envolver `play()` con `.catch(() => {})` — devuelve una promesa que rechaza si
    el navegador bloquea la reproducción.
- En móvil (`useIsMobile`): sin hover, se queda la imagen estática.
- **Título siempre visible** (a diferencia de las cards actuales, que lo tapan con overlay
  al 60 % y solo lo muestran en hover): banda inferior con degradado
  `bg-gradient-to-t from-black/70 to-transparent` y `h3 font-title text-white`
  con `text-2xl md:text-3xl`. Sin overlay que cubra toda la card.
- `onClick` → `navigate('/section/' + section.slug)`.
- Accesible: `role="link"`, `tabIndex={0}` y `onKeyDown` para Enter/Space.

**`SectionGrid` — detalle:**
- `useSections(repository)`, con los mismos bloques de loading y error que `WorkSection`.
- `<section id="work">` (mantener el id: el ancla `#work` del header y el scroll del
  botón Back dependen de él).
- `grid grid-cols-1 md:grid-cols-3 gap-0`, secciones ordenadas por `order`.
  Las 2 últimas quedan en la fila inferior ocupando 1 columna cada una.

**Archivos modificados / eliminados:**
- `src/App.tsx` — `<WorkSection repository={workItemRepository} />` →
  `<SectionGrid repository={sectionRepository} />`.
- `src/presentation/components/WorkSection.tsx` — **eliminar**. Su función la asume
  `SectionGrid`, y dejarlo sin usar sería código muerto.
- `src/presentation/components/WorkItemCard.tsx` — pasa a usar `useIsMobile`.
  No se borra: se reutiliza como base de las filas de proyecto del Commit 6.

**Verificación:** home con 5 secciones en 2 filas; título legible siempre; hover reproduce
y al salir vuelve a la imagen; en móvil una columna sin vídeos; click navega a
`/section/:slug` (que aún no existe → pantalla en blanco, se resuelve en el commit siguiente).

---

### Commit 6 — `Add section page with alternating project rows`

**Objetivo:** pantalla de sección con título solapando la imagen, y todos los proyectos de la sección uno por fila en costados alternos.

**Archivos nuevos:**
- `src/application/service/useSection.ts` — `useSection(repository, slug)` →
  `{ section, loading, error }` usando `getBySlug`.
- `src/presentation/components/SectionPage.tsx`
- `src/presentation/components/ProjectRow.tsx`

**`SectionPage` — cabecera con solapamiento:**
- Requisito: *"la mitad derecha del título, superpuesto a la esquina superior izquierda de la imagen"*.
- Implementación final, tras varias rondas de revisión visual:
  - La imagen se envuelve en un `div.relative.md:ml-auto.md:w-[70%]`. El título se
    posiciona contra **ese contenedor, no contra el `<header>`**: el header lleva padding
    superior, así que sus porcentajes no coinciden con los de la imagen.
  - Título en `md:absolute md:top-0 md:left-0 md:-translate-x-1/2 md:-translate-y-1/2`.
    `top-0 left-0` es la esquina superior izquierda de la imagen y los dos
    desplazamientos del 50 % **centran el título en esa esquina**: media altura del texto
    cuelga por encima y medio largo queda a la izquierda.
  - **`md:whitespace-nowrap` es lo que hace exacta la geometría, y es la clave.**
    Una caja posicionada en absoluto se encoge hasta su contenido, así que con una sola
    línea media caja **es** medio texto. Si se permite que el título se parta, la caja se
    queda al ancho máximo mientras las líneas acaban antes, y la proporción de letras que
    cae sobre la imagen empieza a depender del largo de cada título.
    Se intentó compensar eso con `-translate-x-1/4` y luego con `text-right`, y ambos
    arreglaban un título rompiendo los otros.
  - Por eso el tamaño es **relativo al viewport**, `md:text-[min(4.5vw,80px)]`, en vez de
    los escalones `md:text-7xl lg:text-8xl`: el título más largo tiene que caber en una
    línea con su mitad izquierda dentro del margen blanco. Coste asumido: en desktop los
    títulos son menores que con `text-8xl`.
  - `pt-40 lg:pt-56` en el `<header>`: con media altura del título colgando por encima de
    la imagen, con menos padding se metía por debajo del header fijo.
- **Sin `z-index`** en el título, al contrario de lo que decía la versión inicial del plan:
  no hace falta (un elemento posicionado ya se pinta sobre un hermano estático) y cuanto
  menos stacking context se cree, menos riesgo de repetir el problema del Commit 3.
- El título va **antes** que la imagen en el DOM: así en móvil, donde no se posiciona,
  se apila encima sin más. Los `md:` lo sacan del flujo solo en desktop.
- El título usa `font-title font-bold` + `text-white mix-blend-exclusion`,
  así se lee tanto sobre el blanco del margen izquierdo como sobre la imagen —
  reaprovecha la misma técnica del header.
- En móvil (< `md`) se apila: título encima, imagen debajo, sin solapamiento
  (el solape a ancho de móvil hace el título ilegible).
- `useEffect` para `window.scrollTo(0, 0)` al cambiar de slug.
- Estado "sección no encontrada" con enlace a `/`.

**`ProjectRow` — detalle:**
- Props: `item: WorkItem`, `index: number`. El costado se deriva de `index % 2 === 0`
  → media izquierda / texto derecha, y al revés en las impares (patrón albertgvld.com).
- Layout `grid md:grid-cols-2 items-center gap-8 lg:gap-16` y, en la fila invertida,
  `md:order-2` / `md:order-1` sobre los dos hijos. En móvil siempre media arriba, texto abajo.
- Media según tipo:
  - `video` → `<img src={item.imageUrl}>` como **foto estática** (no se reproduce aquí);
  - `gifUrl` presente (proyectos de Blender/3D) → `<img src={item.gifUrl}>`;
  - `image` → `imageUrl`; `gallery` → `galleryImages[0]`.
  - Esta selección va en una función `resolvePreview(item)` en el propio archivo,
    no en el factory: es lógica de preview de fila, no de card.
- Lado del texto: `h3 font-title` con el título, `p` con la descripción,
  y `category · year` en pequeño con `tracking-widest uppercase text-site-text-muted`.
- Toda la fila es clicable → `/work/:slug` con el mismo slug que ya genera
  `WorkItemCard` (`title.toLowerCase().replace(/\s+/g, '-')`).
  **Extraer ese slug a un helper** `src/application/domain/slug.ts` (`toSlug(title)`),
  porque ahora mismo la misma expresión está duplicada en `WorkItemCard` y `WorkItemDetail`,
  y con una tercera copia se acaba rompiendo.

**Filtrado de proyectos:** `useWorkItems(workItemRepository)` y filtrar por
`item.sectionSlug === slug`. Mensaje explícito si la sección no tiene proyectos todavía
(caso real de Exhibitions / Awards al principio).

**Archivos modificados:**
- `src/App.tsx` — nueva ruta:
  ```tsx
  <Route path="/section/:slug" element={
    <SectionPage sectionRepository={sectionRepository} workItemRepository={workItemRepository} />
  } />
  ```
- `src/presentation/components/WorkItemCard.tsx` y `WorkItemDetail.tsx` — usar `toSlug`.

**Verificación:** entrar a cada una de las 5 secciones; comprobar el solape del título en
desktop y el apilado en móvil; que las filas alternan costado; que los vídeos muestran foto
estática; que el click abre `/work/:slug` correcto.

---

### Commit 7 — `Rework project page with full-screen framed hero and scroll reveal`

**Objetivo:** primera imagen/vídeo a pantalla completa con marco, y el resto del contenido apareciendo al hacer scroll.

**Archivos nuevos:**
- `src/presentation/hooks/useRevealOnScroll.ts` — `IntersectionObserver`
  (`threshold: 0.15`, `rootMargin: '0px 0px -10% 0px'`), devuelve `{ ref, isVisible }`.
  Se desconecta tras la primera aparición (no re-oculta al volver a subir).
  Si `prefers-reduced-motion: reduce`, devuelve `isVisible: true` desde el inicio.
- `src/presentation/components/RevealOnScroll.tsx` — wrapper que aplica
  `opacity-0 translate-y-8` → `opacity-100 translate-y-0` con
  `transition-all duration-700 ease-out`.

**`IWorkItemDetail` — extensión de la interfaz:**
- Añadir `renderHeroMedia(workItem: WorkItem): JSX.Element` a
  `workItemDetails/IWorkItemDetail.ts` e implementarlo en los tres renderers.
  Se respeta el patrón factory existente en lugar de meter un `switch` en el componente.
  - `ImageItemDetail` → `<img>` a pantalla completa, `object-cover`.
  - `VideoItemDetail` → `<video controls playsInline preload="metadata" poster={imageUrl}>`
    **sin `muted` y sin autoplay**: el requisito es que se pueda reproducir.
    Quitar también el `loop` del hero (molesta con controles).
  - `GalleryItemDetail` → primera imagen de la galería.
- **`renderMedia` se sustituye por `renderBodyMedia`, no se mantiene.** Corrección sobre
  el plan inicial: dejar `renderMedia` con el significado difuso de "los demás medios"
  obligaba a que el componente supiera qué esperar de cada tipo. Con dos métodos de
  contrato explícito (`renderHeroMedia` y `renderBodyMedia`, que puede devolver `null`),
  cada renderer decide qué va arriba y qué abajo, incluido su propio tamaño.
  `renderMedia` solo se usaba desde `WorkItemDetail`, así que el cambio no afecta a nadie
  más — el `renderMedia` de `workItemCards/` es otra interfaz y no se toca.
  - `ImageItemDetail` / `VideoItemDetail` → `gifUrl` si existe, `null` si no.
    Para vídeo no se repite la imagen abajo: el `poster` ya la muestra.
  - `GalleryItemDetail` → **el carrusel existente** (con su visor a pantalla completa y
    navegación por teclado) envuelto en `aspect-video`, o `null` si la galería tiene una
    sola imagen. Así no se pierde funcionalidad ya construida.

**`WorkItemDetail.tsx` — reescritura del layout:**
- Bloque hero: `h-screen w-full p-4 md:p-8` (el padding **es** el marco) con un hijo
  `w-full h-full border border-site-border overflow-hidden` que contiene el media.
  Quitar el `pt-32` actual del contenedor: el hero arranca pegado arriba y el header
  transparente flota encima.
- Debajo, cuerpo centrado `max-w-4xl mx-auto px-6 lg:px-12 py-24 space-y-24`, con cada
  bloque envuelto en `<RevealOnScroll>`: título → `category · year` → descripción →
  medios adicionales (`galleryImages` restantes, o `imageUrl`/`gifUrl` si existen) → tags.
- Botón: texto **`Back`** (no "Back to Work"), y `onClick` → `navigate(-1)` con fallback a
  `navigate('/')` si no hay historial (`window.history.length <= 1`).
  Se puede eliminar el `setTimeout` + `scrollIntoView` de `handleBackToWork`.
  Posición `fixed top-28 left-6 lg:left-12 z-40` con `text-white mix-blend-exclusion`,
  para que se lea sobre el hero a pantalla completa. `top-28` y no `top-24`: con el
  padding vertical del header en `lg`, a 24 el botón quedaba pegado al menú.
  **Ojo:** el blend va en el propio elemento posicionado, nunca en un hijo suyo —
  misma trampa de stacking context que se resolvió en el Commit 3.
- Mismo texto `Back` en el estado "Project not found".

**Verificación:** un proyecto de imagen, uno de vídeo y uno de galería.
El vídeo debe poder reproducirse con sus controles. El marco visible en los 4 lados.
Los bloques aparecen al bajar. Con "reducir movimiento" el contenido está visible sin animación.

---

### Commit 8 — `Update copy, footer social links and contact email`

**Objetivo:** redes correctas, email de contacto real y textos corregidos.

**Archivos:**
- `src/presentation/components/Footer.tsx` — sustituir Youtube / Instagram / Linkedin por
  **Instagram, Vimeo, Behance**, manteniendo `target="_blank" rel="noopener noreferrer"`.
  Los `href` quedan como `TODO` con las URLs base (`https://instagram.com/`,
  `https://vimeo.com/`, `https://behance.net/`) hasta tener los usuarios reales de Sara.
- `src/infrastructure/adapters/MockContactDetailsRepository.ts` —
  `email: 'sararamon222@icloud.com'` y borrar el comentario `// TODO update email`.
- `src/presentation/components/AboutSection.tsx` (línea 61) — el encabezado
  **`Expertise` → `Skills`**. Es la única aparición: un texto hardcodeado en el `<h3>`.
  El campo del dominio ya se llama `skills` (`AboutContent.skills`), así que el cambio
  alinea la UI con el modelo en vez de separarla — no hay que tocar dominio ni adaptador.

**Verificación:** el `mailto:` de la sección de contacto abre con la dirección nueva;
el bloque de About dice "Skills"; `grep -rn 'Expertise' src/` sin resultados.

---

### Commit 9 — `Add fullscreen menu for mobile navigation`

**Objetivo:** sustituir los enlaces en línea del header por un menú a pantalla completa
en móvil, al estilo de valleeduhamel.com. Nace de un problema concreto: con el menú a
`text-3xl` y peso 900, a 375 px el logo y los tres enlaces no caben en una fila.

**Qué hace realmente la web de referencia** (extraído de su HTML, no de memoria):

- **El disparador no es un icono de hamburguesa.** Es la palabra `menu`, que voltea a
  `close` con un `rotateX` 3D: `menu` gira 90° y desaparece mientras `close` entra desde
  −90°. Cada letra lleva además un `top` distinto (`5px`, `-3px`, `0`, `-8px`), lo que da
  ese aire de rótulo compuesto a mano.
- **Overlay** `position: fixed`, `100%`×`100%`, `z-index: 9999`, fondo con degradado,
  `opacity` 0.3 s y `pointer-events: none` mientras está cerrado.
- **Enlaces enormes centrados en columna**: `5vw` en desktop, `10vw` bajo 768 px y
  `13vw` bajo 480 px.
- **Al pasar el ratón por un enlace aparecen 3 imágenes** colocadas en posiciones fijas
  distintas (`top: 10%; right: 10%; width: 50vw`, etc.), entrando escalonadas a 0,1 s /
  0,3 s / 0,5 s. En ≤768 px las desactivan con `display: none !important`.
- Ese hover también aplica `mix-blend-mode: exclusion` al texto del enlace, para que se
  invierta contra las imágenes que acaban de aparecer.

**Decisión de alcance — leer antes de implementar:**

Hay una tensión que conviene resolver explícitamente. La referencia usa el menú a
pantalla completa **en todos los tamaños**, y ahí el header solo tiene logo + disparador.
Si lo copiamos así, los enlaces `work / about / contact` en línea desaparecen — y con
ellos el trabajo de tamaño y minúsculas que se hizo en el Commit 3.

- **Opción elegida: solo en móvil** (`< md`). Los enlaces en línea se mantienen en
  desktop (`hidden md:flex`) y el disparador es `md:hidden`. Resuelve el desbordamiento,
  que es el problema real, y no tira nada de lo ya hecho.
- **Alternativa**: menú a pantalla completa en todos los tamaños, más fiel a la
  referencia. Requiere decidir a la vez si el header desktop pierde los enlaces.
  Queda a criterio de María; si se elige esta, el efecto de imágenes al hover sí tendría
  sentido implementarlo.

**Archivos nuevos:**
- `src/presentation/components/FullscreenMenu.tsx`
- `src/presentation/hooks/useScrollLock.ts` — el bloqueo de scroll del body pasa a ser
  el segundo uso del mismo patrón (el primero es `IntroSplash`), así que se extrae en
  vez de duplicarlo.

**`FullscreenMenu` — detalle:**
- Overlay `fixed inset-0 z-40` con `bg-site-bg`. **Va por debajo del header** (`z-50`),
  no por encima: así el logo y el disparador siguen visibles y clicables sin necesidad
  de los `z-index` de 10000 de la referencia. El contenido de la página no tiene
  `z-index`, así que queda tapado.
- Transición de `opacity` + `pointer-events-none` mientras está cerrado, igual que la
  referencia.
- Enlaces en columna centrada, `font-title font-black`, `text-[10vw]` y
  `max-[480px]:text-[13vw]` para replicar la escala de la referencia.
- El header lleva `mix-blend-exclusion`: sobre el overlay blanco, su texto se leerá en
  negro. Hay que confirmarlo visualmente, no darlo por hecho.
- **Fuera de alcance**: las 3 imágenes al hover. Con el menú limitado a móvil no habría
  ratón que las dispare, y la propia referencia las desactiva bajo 768 px. Se documenta
  como posible extensión si se adopta la alternativa de todos los tamaños.
- Cierre: al pulsar el disparador, con `Escape`, al clicar un enlace, y al cambiar de ruta.
- Accesibilidad: `aria-expanded` y `aria-controls` en el disparador, `aria-hidden` en el
  overlay cerrado, foco al primer enlace al abrir y devuelto al disparador al cerrar.
- `prefers-reduced-motion`: sin volteo ni fundido, aparición directa.

**Disparador — detalle:**
- Texto `menu` / `close` en lugar de las tres rayas, para ser fiel a la referencia.
  Si María prefiere el icono clásico de hamburguesa, es un cambio contenido en este mismo
  componente.
- El volteo `rotateX` por letra con los `top` escalonados es *polish* opcional: se
  implementa primero un cambio de texto con fundido simple, y el volteo se añade solo
  si compensa. Conviene decirlo por adelantado en vez de prometer la animación completa.

**Archivos modificados:**
- `src/presentation/components/Header.tsx` — enlaces en línea a `hidden md:flex`,
  disparador `md:hidden`.
- `src/App.tsx` — **aquí vive el estado `isMenuOpen`, no en `Header`.** Corrección sobre
  el plan inicial: el overlay tiene que ser **hermano** del header, no hijo. Anidado
  dentro heredaría dos cosas del `<header>`: su stacking context (el overlay se pintaría
  por encima del propio logo, tapándolo) y su `mix-blend-exclusion` (el fondo blanco del
  overlay saldría invertido). Al ser hermanos, los dos necesitan el mismo estado y sube a
  `App`.
  Los dos handlers van en `useCallback`: `FullscreenMenu` se cierra solo al cambiar de
  ruta, y con una identidad nueva en cada render ese efecto se dispararía sin parar,
  cerrando el menú justo al abrirlo.

**Verificación:** a 375 px el header no desborda; abrir y cerrar por los cuatro caminos;
sin scroll de fondo con el menú abierto; en desktop nada cambia respecto al Commit 3;
navegación por teclado completa; con "reducir movimiento" no hay animación.

---

### Commit 10 — `Update README for new structure`

**Objetivo:** que el README no quede desfasado respecto al código.

**Archivos:**
- `README.md`:
  - "Theme Colors": documentar la paleta clara y el renombrado `dark.*` → `site.*`.
  - Nueva subsección sobre `Section`: entidad, puerto, adaptador mock y cómo añadir
    o reordenar secciones.
  - Documentar el campo `sectionSlug` (y `gifUrl`) en los ejemplos de `items.json`
    de la sección "Adding Content", avisando de que `sectionSlug` es opcional pero
    necesario para que un proyecto aparezca en su sección.
  - Rutas actualizadas: `/`, `/section/:slug`, `/work/:slug`.
  - Mencionar `IntroSplash` y el `sessionStorage` key, para que nadie se pelee con
    "no me sale el gif".
  - Documentar `FullscreenMenu` y a partir de qué breakpoint sustituye a los enlaces
    en línea.
- `docs/restyle-plan.md` — este archivo; se puede dejar como registro de la PR.

**Verificación:** lectura del README de arriba abajo comparando con el código.

---

## 5. Orden y dependencias

```
1 (tema claro)
2 (splash)            ← independiente, puede ir en paralelo
3 (header invertido)  ← depende de 1 (paleta) y de las fuentes ya migradas
4 (dominio Section)   ← base de 5 y 6
5 (grid de secciones) ← depende de 4
6 (pantalla sección)  ← depende de 4 y 5
7 (pantalla proyecto) ← depende de 6 (helper toSlug) y de 1
8 (footer + email)    ← independiente
9 (menú pantalla completa) ← depende de 3 (header) y de 2 (patrón de bloqueo de scroll)
10 (README)           ← al final, cuando todo lo demás está cerrado
```

El 1 debe ir primero: cambia tokens que todos los commits posteriores usan, y hacerlo
después obligaría a repasar el mismo código dos veces.

El README se mantiene como último commit aunque el menú se haya añadido después:
documenta el resto, así que ponerlo antes lo dejaría desfasado el mismo día.

---

## 6. Verificación por commit

El procedimiento completo está en la [sección 0](#0-ciclo-de-revisión-antes-de-cada-commit).
Resumen de comandos:

```bash
npx tsc --noEmit      # tipos
npm run lint          # eslint, --max-warnings 0
npm run build         # tsc + vite build
npm run dev           # → localhost:5173, revisión visual de María
```

Revisión visual mínima en cada commit: home, una pantalla de sección, un proyecto de
imagen, uno de vídeo, y todo en viewport móvil (375 px) además de desktop.

Ojo con lo que el tooling **no** detecta, y que por tanto siempre necesita revisión humana:
contraste real del `mix-blend-exclusion`, el solapamiento título/imagen de la pantalla de
sección, el timing del splash, y que los vídeos arranquen y paren donde deben.

---

## 7. Pendiente de Sara (no bloquea el código, pero sí el resultado final)

1. **Gif de logo definitivo** para el splash → a `public/`, sustituyendo el de Giphy.
2. **Imagen estática + vídeo/gif de portada** para cada una de las 5 secciones.
3. **URLs reales** de Instagram, Vimeo y Behance.
4. **Asignación de cada proyecto a su sección** (`sectionSlug`), y `gifUrl` para los de Blender/3D.
5. **Fotos estáticas (poster)** de los proyectos de vídeo, para las filas de sección.
6. Decidir si Exhibitions y Awards & Recognition van a tener proyectos con la misma
   estructura o necesitan un formato propio — hasta entonces se comportan igual que las demás.
7. **El vídeo de producción da 404.** `items.json` apunta a
   `https://sararamon.netlify.app/.netlify/blobs/serve/videos/moonshoe_3.mp4` y esa URL
   responde 404 desde fuera. Hay que comprobar si el blob sigue subido y si esa ruta
   `blobs/serve` necesita token — afecta al sitio publicado, no al desarrollo local.

