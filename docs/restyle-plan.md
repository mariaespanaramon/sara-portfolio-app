# Plan de reestilizado completo — rama `restile-whole-website`

Una sola PR contra `main`, dividida en commits pequeños y verificables.
Cada commit debe dejar el proyecto compilando (`npx tsc --noEmit` + `npm run build` en verde).

> **Ciclo de trabajo — obligatorio en cada commit.**
> Ningún commit se crea sin que María lo haya revisado antes en local.
> Ver la sección [0. Ciclo de revisión](#0-ciclo-de-revisión-antes-de-cada-commit).

---

## 0. Ciclo de revisión antes de cada commit

Para **cada uno** de los 9 commits, en este orden y sin saltarse pasos:

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
| Gif de intro | Se muestra **una vez por sesión** de navegador (`sessionStorage`). |
| Fondo blanco | Tema claro completo: fondo blanco **y texto oscuro** en toda la web (home, sección, proyecto, footer). Un fondo blanco con el texto blanco actual sería ilegible, así que se invierte la paleta entera. |
| Logo/menú que cambia de color | `mix-blend-mode: difference` sobre texto blanco — es la técnica que usa valleeduhamel.com. El texto se calcula como inverso real de lo que tiene detrás, sin JS. |
| Nombres de tokens de color | Se renombra `dark.*` → `site.*`. Dejar `dark-bg: #ffffff` sería una mentira que confundiría cualquier trabajo futuro. |
| Modelado de secciones | Nueva entidad de dominio `Section` + puerto `SectionRepository` + adaptador mock, siguiendo el patrón hexagonal existente. `WorkItem` gana `sectionSlug`. |
| Home | Solo cambia el bloque de trabajo (proyectos → secciones). Hero, About y Contact se mantienen. |
| Botón "Back" del proyecto | Además de renombrarlo, pasa a `navigate(-1)`: entrando desde una sección, volver a la home sería desorientador. |
| Idioma del código | **Todo el código en inglés**: nombres de variables, funciones, componentes, tipos, comentarios, JSDoc, mensajes de `TODO`, mensajes de error y de commit. Sin excepciones. Es lo que ya hace el repo entero. Este documento de plan se mantiene en español porque es material de trabajo, no código — pero cada snippet que contiene va en inglés, tal cual se va a escribir. |

---

## 3. Riesgos y puntos a vigilar

1. **`mix-blend-mode: difference` sobre gris medio (~#808080) da gris medio** → contraste casi nulo.
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

**Objetivo:** al entrar por primera vez en la sesión, logo animado centrado a pantalla completa unos segundos; luego se desvanece y aparece la home.

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

### Commit 3 — `Invert header logo and menu colors over background`

**Objetivo:** logo y menú en Nunito Sans Black (900) y con color inverso al fondo.

**Archivos:**
- `src/presentation/components/Header.tsx`

**Detalle:**
- **Peso 900 (Black) en logo y menú**: clase `font-black` de Tailwind
  (su escala mapea `black` → `font-weight: 900`).
  - Logo: `font-heading` → `font-title font-black`. Hoy no lleva clase de peso,
    así que hereda el 400 normal; hay que añadirla explícitamente.
  - Menú: `font-light` → `font-black` en los tres enlaces.
  - Nunito Sans se carga como fuente variable en rango `200..1000`, así que el 900 es
    un peso real del archivo, no una negrita sintética del navegador. Ya está cubierto
    por el `<link>` de Google Fonts que hay en `index.html`; no hay que tocarlo.
  - Con peso 900 conviene revisar el `tracking-tight` del logo: a ese grosor las letras
    se juntan mucho. Si se ve apretado, subir a `tracking-normal` — a validar en la
    revisión visual.
- Envolver el contenido del `<nav>` en un contenedor con
  `text-white mix-blend-difference`. Sobre blanco da negro, sobre negro da blanco,
  sobre una imagen da el inverso exacto — que es el efecto de valleeduhamel.com.
- Quitar de los enlaces los `hover:text-site-text-secondary`: con blend de diferencia
  un cambio de color en hover produce saltos raros. Sustituir por `hover:opacity-60`
  (el logo ya usaba `hover:opacity-70`, así queda coherente).
- El `<header>` mantiene `fixed z-50 bg-transparent`. **No** añadir `isolate` ni
  `backdrop-*` a ningún ancestro: aislarían el stacking context y el blend dejaría
  de ver el fondo.

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
- `src/App.tsx` — instanciar `const sectionRepository = new MockSectionRepository();`

**Verificación:** `npx tsc --noEmit` y `npm run build`. La web sigue exactamente igual.

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
- Implementación: contenedor `relative`. La imagen ocupa el 70 % derecho
  (`ml-auto w-full md:w-[70%] aspect-[4/3] object-cover`). El título va en
  `absolute top-[8%] left-0 z-10 md:w-[60%]`, de forma que su mitad derecha cae
  encima del borde superior-izquierdo de la imagen.
- El título usa `font-title text-5xl md:text-7xl lg:text-8xl` + `text-white mix-blend-difference`,
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
- `renderMedia` se mantiene para el resto de medios del cuerpo.

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
  Posición `fixed top-24 left-6 z-40` con `text-white mix-blend-difference`,
  para que se lea sobre el hero a pantalla completa.
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

### Commit 9 — `Update README for new structure`

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
9 (README)            ← al final, cuando todo lo demás está cerrado
```

El 1 debe ir primero: cambia tokens que todos los commits posteriores usan, y hacerlo
después obligaría a repasar el mismo código dos veces.

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
contraste real del `mix-blend-difference`, el solapamiento título/imagen de la pantalla de
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

