# SPEC 01 — Home del feed

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-09-02
> **Objetivo:** Implementar en `/` un home estático, responsive y visualmente fiel a `referencias/pantallas/feed.dc.html` mediante componentes reutilizables y fixtures tipadas.

## Por qué existe esta spec

La ruta principal conserva la pantalla inicial de Next.js y todavía no establece el lenguaje visual de OpenDayCare. Esta spec convierte la referencia del feed en la primera pantalla real del producto sin anticipar autenticación, persistencia ni flujos que aún no existen.

## Alcance

**Incluye:**

- Reemplazar el contenido inicial de `app/page.tsx` por el feed de OpenDayCare en la ruta `/`.
- Reproducir el contenido, la jerarquía, los colores, las medidas, los bordes, las sombras, los iconos y el comportamiento de scroll de `referencias/pantallas/feed.dc.html`.
- Tomar `referencias/pantallas/feed.dc.html` como fuente visual principal y `referencias/screenshots/feed.png` únicamente como apoyo.
- Usar un layout de escritorio con sidebar fijo de 248 px y contenido principal desplazable.
- Usar en anchos menores de 768 px una cabecera compacta y una barra de navegación inferior fija.
- Mostrar exactamente los datos estáticos de la referencia: Caro Giménez, Sala Soles, 12 niños, martes 17 jun y las tres publicaciones con sus textos y contadores.
- Cargar Fredoka y Nunito mediante `next/font` y actualizar el idioma y los metadatos globales para OpenDayCare.
- Crear SVG propios para los iconos sin instalar una biblioteca externa.
- Separar shell, navegación, cabecera, composer, lista, tarjeta, avatar e insignia en componentes reutilizables.
- Mantener visibles los controles de flujos futuros, pero marcarlos como no disponibles y evitar que naveguen o ejecuten acciones.

**Fuera de alcance (para specs futuras):**

- Autenticación, sesión real y cierre de sesión.
- Base de datos, API, Server Actions, carga remota o persistencia local.
- Crear, editar, comentar o reaccionar a publicaciones.
- Carga, almacenamiento o visualización de fotografías reales.
- Las rutas de Niños, Avisos, Mi cuenta, Nueva publicación, detalle de publicación y fotografía.
- Actualización dinámica de la fecha, el usuario, la sala, las publicaciones o sus contadores.
- Una suite de pruebas automatizadas o la incorporación de Playwright.
- La implementación de otras pantallas de `referencias/pantallas/`.

## Modelo de datos

`types/feed.ts` define las estructuras de presentación. `FeedPost` es una unión discriminada por `category` para que cada variante declare únicamente los datos que puede mostrar.

```ts
type FeedPostBase = {
  id: string;
  title: string;
  publishedAt: string;
  publishedBy: string;
  audience: string;
  body: string;
  reactions: number;
  comments: number;
  editable: boolean;
};

type InitialsAvatar = {
  kind: "initials";
  initials: string;
  background: string;
  foreground: string;
};

type IconAvatar = {
  kind: "icon";
  icon: "megaphone";
  background: string;
  foreground: string;
};

type AchievementPost = FeedPostBase & {
  category: "achievement";
  avatar: InitialsAvatar;
  media: null;
};

type ActivityPost = FeedPostBase & {
  category: "activity";
  avatar: InitialsAvatar;
  media: {
    kind: "photo-placeholder";
    label: string;
  };
};

type AnnouncementPost = FeedPostBase & {
  category: "announcement";
  avatar: IconAvatar;
  media: null;
};

type FeedPost = AchievementPost | ActivityPost | AnnouncementPost;

type FeedData = {
  nurseryLabel: string;
  roomName: string;
  greeting: string;
  childCount: number;
  dateLabel: string;
  sectionLabel: string;
  composerPrompt: string;
  currentUser: {
    name: string;
    role: string;
    roomName: string;
    initials: string;
  };
  posts: readonly FeedPost[];
};
```

`data/feed.ts` exporta una única fixture tipada con los valores literales de la referencia. Los colores variables del avatar y de la categoría forman parte de los datos de presentación; los tokens globales permanecen en `app/globals.css`.

No se introduce un modelo persistente ni un contrato de API.

## Archivos

**Archivos existentes que cambian:**

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`

**Archivos nuevos:**

- `components/icons.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/mobile-navigation.tsx`
- `components/feed/feed-header.tsx`
- `components/feed/feed-composer.tsx`
- `components/feed/feed-list.tsx`
- `components/feed/post-card.tsx`
- `components/feed/avatar.tsx`
- `components/feed/category-badge.tsx`
- `data/feed.ts`
- `types/feed.ts`

No se agregan assets a `public/` ni dependencias a `package.json`.

## Plan de implementación

1. Actualizar `app/layout.tsx` con Fredoka, Nunito, `lang="es"` y los metadatos de OpenDayCare; actualizar `app/globals.css` con el reset, los tokens visuales, el tema de Tailwind v4 y el scrollbar de la referencia, manteniendo la pantalla inicial ejecutable.
2. Crear `types/feed.ts` con `FeedData`, la unión discriminada `FeedPost` y los tipos de avatar y media, sin conectar todavía estos tipos a la ruta.
3. Crear `data/feed.ts` con la fixture completa y exacta de Caro, Sala Soles y las tres publicaciones de `feed.dc.html`.
4. Crear `components/icons.tsx`, `components/feed/avatar.tsx` y `components/feed/category-badge.tsx` con SVG y variantes controladas por props.
5. Crear `components/feed/post-card.tsx` para representar logro, actividad con placeholder de foto y anuncio desde `FeedPost`; crear `components/feed/feed-list.tsx` para preservar el orden de la fixture.
6. Crear `components/feed/feed-header.tsx` y `components/feed/feed-composer.tsx` para el saludo, el resumen de sala, el separador de fecha y el acceso visual deshabilitado a una nueva publicación.
7. Crear `components/layout/sidebar.tsx` con la marca, navegación y perfil de escritorio; crear `components/layout/mobile-navigation.tsx` con la cabecera compacta y la barra inferior para anchos menores de 768 px.
8. Reemplazar el starter de `app/page.tsx` y componer la ruta `/` con la fixture y los componentes nuevos hasta completar el layout de escritorio.
9. Aplicar los estados deshabilitados y la adaptación responsive; comprobar que a 390 x 844 no exista scroll horizontal, que el contenido no quede oculto y que la barra inferior permanezca utilizable.

Cada paso debe conservar `npm run dev` funcional y no debe crear enlaces a rutas inexistentes.

## Criterios de aceptación

- [ ] Visitar `/` muestra el home de OpenDayCare y no conserva contenido visual del starter de Next.js.
- [ ] A 1200 x 800, una comparación manual lado a lado con `referencias/pantallas/feed.dc.html` confirma la misma estructura, medidas, espaciado, paleta, bordes, radios, sombras, tipografía, iconografía y comportamiento de scroll, salvo diferencias inevitables de antialiasing tipográfico.
- [ ] En escritorio, el sidebar mide 248 px, permanece fijo a la izquierda y ocupa la altura del viewport.
- [ ] En escritorio, el área principal tiene scroll independiente y su contenido usa un ancho máximo de 760 px, 40 px de padding horizontal y 34 px de padding superior.
- [ ] La página usa `#F6ECDF` como fondo principal, `#FFFDF9` en sidebar y tarjetas, y `#ECE0D0` en los bordes definidos por la referencia.
- [ ] Fredoka se aplica a marca, títulos y nombres; Nunito se aplica al resto del contenido.
- [ ] La cabecera muestra `GUARDERÍA · SALA SOLES`, `Buenas, Caro`, `12 niños · martes 17 jun` y `PUBLICADO HOY` exactamente como la referencia.
- [ ] El composer muestra el avatar `C`, el texto `Compartí un momento…` y el icono de cámara sin ejecutar acciones.
- [ ] Se muestran exactamente tres publicaciones, en el mismo orden, con categorías LOGRO, ACTIVIDAD y ANUNCIO, sus textos, audiencias, horas y contadores originales.
- [ ] La publicación de actividad muestra el placeholder punteado `Foto · pintando con témperas`; ninguna publicación solicita o carga una imagen real.
- [ ] Feed se anuncia como la página actual; los demás destinos y acciones se anuncian como no disponibles, no cambian estado y no navegan a una ruta inexistente.
- [ ] En anchos menores de 768 px desaparece el sidebar y aparecen una cabecera compacta y una barra inferior con Feed, Niños, Avisos y Mi cuenta.
- [ ] A 390 x 844 no existe scroll horizontal, ninguna tarjeta se recorta y el final del feed puede desplazarse por encima de la barra inferior.
- [ ] La paleta permanece fiel a la referencia independientemente de la preferencia de tema del sistema.
- [ ] El documento usa `lang="es"`, el título global `OpenDayCare` y una descripción del feed de Sala Soles.
- [ ] La consola del navegador no muestra errores ni advertencias producidos por esta pantalla.
- [ ] `npm run lint -- app components data types` finaliza correctamente.
- [ ] `npx tsc --noEmit` finaliza correctamente.
- [ ] `npm run build` finaliza correctamente.
- [ ] `package.json` y `package-lock.json` no incorporan nuevas dependencias para esta implementación.

## Decisiones

- **Sí:** `feed.dc.html` es la fuente de verdad visual. `feed.png` se usa únicamente para apoyar la comparación.
- **Sí:** el contenido permanece fijo en `data/feed.ts`. Esto permite replicar la referencia sin inventar infraestructura.
- **No:** fecha dinámica, API, base de datos, `localStorage` o estado interactivo. No forman parte de un home visual estático.
- **Sí:** `FeedPost` es una unión discriminada. Las variantes de tarjeta comparten una API tipada sin multiplicar componentes.
- **Sí:** los componentes viven en carpetas raíz `components/`, `data/` y `types/`. Así podrán reutilizarse en rutas futuras.
- **Sí:** se separan avatar e insignia aunque sean piezas pequeñas. Ambas tienen variantes visuales que se repiten.
- **Sí:** se usan utilidades Tailwind v4 y tokens en `app/globals.css`. No se crean CSS Modules ni una hoja global de clases por componente.
- **Sí:** los iconos se implementan como SVG React propios. No se agrega una dependencia de iconos ni archivos individuales en `public/`.
- **Sí:** los controles de funcionalidades futuras permanecen visibles y explícitamente deshabilitados. No se crean rutas placeholder ni botones enfocables sin efecto.
- **Sí:** el móvil usa cabecera compacta y barra inferior fija. No se intenta comprimir el sidebar de 248 px.
- **Sí:** la fidelidad de escritorio se valida manualmente lado a lado a 1200 x 800. Por ahora no se instala ni utiliza Playwright.
- **No:** una suite automatizada en esta spec. El repositorio no dispone todavía de un runner y el alcance es principalmente visual.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El navegador puede renderizar las fuentes con diferencias mínimas de antialiasing. | Usar Fredoka y Nunito mediante `next/font` y aceptar únicamente diferencias de rasterizado, no de tamaño, peso o espaciado. |
| No existe una referencia visual móvil. | Usar como contrato el breakpoint de 768 px, la cabecera compacta, la barra inferior y las comprobaciones concretas a 390 x 844. |
| Los controles visibles pueden parecer funcionales. | Marcarlos semánticamente como no disponibles, impedir navegación y conservar Feed como único destino actual. |
| La fixture mezcla contenido con colores de variantes visuales. | Limitar esos colores a avatares e insignias; mantener la paleta estructural en tokens globales. |

## Qué **no** incluye esta spec

- Autenticación, cierre de sesión real o usuarios dinámicos.
- Persistencia, API, base de datos o datos obtenidos por red.
- Interacciones de publicación, edición, comentarios, reacciones o fotografía.
- Rutas adicionales a `/`.
- Playwright, snapshots visuales automatizados o un runner de pruebas.
- Otras plantillas del directorio `referencias/pantallas/`.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
