# SPEC 02 — Listado y perfiles de niños

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-02
> **Objetivo:** Implementar un listado buscable en `/kids` y perfiles estáticos en `/kids/[id]`, responsive y visualmente fieles a `ninos.dc.html` y `perfil-nino.dc.html`, integrados con la navegación existente.

## Por qué existe esta spec

SPEC 01 estableció el lenguaje visual, los datos de la sala y el shell inicial de OpenDayCare, pero dejó Niños como un destino no disponible. Esta spec habilita ese destino y su navegación principal sin anticipar formularios, persistencia ni otros flujos administrativos.

## Alcance

**Incluye:**

- Crear `/kids` a partir de `referencias/pantallas/ninos.dc.html` con los ocho niños, sus avatares, edades, cantidad de padres e insignias.
- Crear `/kids/[id]` a partir de `referencias/pantallas/perfil-nino.dc.html` y resolver un perfil distinto para cada uno de los ocho identificadores definidos en esta spec.
- Hacer que cada tarjeta del listado enlace al perfil dinámico correspondiente y que el perfil permita volver a `/kids`.
- Conservar literalmente los datos visibles de las referencias y completar los perfiles no definidos con las fixtures ficticias cerradas en esta spec.
- Implementar una búsqueda en cliente por nombre completo que ignore mayúsculas, minúsculas y diacríticos.
- Mostrar un estado vacío cuando la búsqueda no tenga coincidencias.
- Resolver con la página 404 de Next.js cualquier `id` que no exista en las fixtures.
- Extraer un `AppShell` reutilizable para componer Feed, Niños y los perfiles con el mismo sidebar, cabecera móvil y navegación inferior.
- Reutilizar y extender los componentes existentes de SPEC 01, especialmente `Sidebar`, `MobileNavigation`, `Brand`, `Avatar` e iconos, en lugar de crear equivalentes específicos para Niños.
- Habilitar Feed y Niños como enlaces reales en escritorio y móvil, con el destino actual identificado visual y semánticamente.
- Mantener Avisos y Mi cuenta como destinos no disponibles.
- Mantener visibles Agregar niño, Editar, Resumen del día y Vincular padre, pero deshabilitados y sin navegación.
- Usar un layout de escritorio con sidebar de 248 px desde 768 px y el patrón móvil de SPEC 01 por debajo de ese ancho.
- Usar SVG React propios y los tokens visuales existentes, ampliándolos solo cuando estas referencias requieran estados nuevos.
- Validar manualmente las dos pantallas a 1200 x 800 y su adaptación responsive a 390 x 844.

**Fuera de alcance (para specs futuras):**

- Crear, editar o eliminar niños.
- Vincular, invitar, editar o eliminar padres.
- Implementar la pantalla o el flujo de Resumen del día.
- Autenticación, autorización, sesión real y cierre de sesión.
- API, base de datos, Server Actions, carga remota o persistencia local.
- Fotografías reales de niños o padres.
- Buscar por edad, alergia, sala o cantidad de padres.
- Paginación, ordenamiento, filtros adicionales o agrupación por múltiples salas.
- Las rutas de Avisos, Mi cuenta, Nueva publicación, edición de niño, vinculación de padres o resumen diario.
- Una suite de pruebas automatizadas o la incorporación de Playwright.
- La implementación de otras pantallas de `referencias/pantallas/`.

## Modelo de datos

`types/avatar.ts` extrae del dominio del feed las estructuras visuales compartidas por avatares. `types/kids.ts` define el contrato completo de cada niño y de sus padres.

```ts
type InitialsAvatar = {
  kind: "initials";
  initials: string;
  background: string;
  foreground: string;
};

type ParentStatus = "active" | "pending";

type KidParent = {
  id: string;
  name: string;
  relationship: "Mamá" | "Papá";
  status: ParentStatus;
  avatar: InitialsAvatar;
};

type KidListBadge =
  | { kind: "medical"; label: string }
  | { kind: "link"; label: "VINCULAR" }
  | null;

type KidMedicalNotes =
  | { kind: "alert"; text: string }
  | { kind: "clear"; text: "Sin alergias ni notas registradas" };

type Kid = {
  id: string;
  name: string;
  ageYears: 2 | 3;
  birthDateLabel: string;
  roomName: "Soles";
  enrollmentLabel: string;
  avatar: InitialsAvatar;
  listBadge: KidListBadge;
  medicalNotes: KidMedicalNotes;
  parents: readonly KidParent[];
};

type KidsData = {
  roomName: "Sala Soles";
  children: readonly Kid[];
};
```

La cantidad de padres que muestra cada tarjeta se obtiene de `kid.parents.length`; no se almacena un contador duplicado. Una invitación pendiente forma parte de esa cantidad, como ocurre con Diego Fernández en la referencia.

### Fixtures cerradas

`data/kids.ts` contiene los siguientes datos exactos:

- `mateo-fernandez`: Mateo Fernández, 3 años, nacimiento `12 mar 2022`, ingreso `feb 2025`, avatar azul de la referencia, insignia `MANÍ`, nota `Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.`, Lucía Fernández como Mamá activa y Diego Fernández como Papá pendiente.
- `sofia-mendez`: Sofía Méndez, 2 años, nacimiento `8 nov 2022`, ingreso `mar 2025`, avatar rosa de la referencia, sin insignia, sin alergias ni notas, y Laura Méndez como Mamá activa.
- `benjamin-ruiz`: Benjamín Ruiz, 3 años, nacimiento `21 ene 2022`, ingreso `ago 2024`, avatar verde de la referencia, sin insignia, sin alergias ni notas, y Ana Ruiz como Mamá activa y Martín Ruiz como Papá activo.
- `valentina-soto`: Valentina Soto, 2 años, nacimiento `30 sep 2022`, ingreso `abr 2025`, avatar amarillo de la referencia, insignia `VINCULAR`, sin alergias ni notas y sin padres vinculados.
- `tomas-diaz`: Tomás Díaz, 3 años, nacimiento `5 may 2022`, ingreso `ene 2025`, avatar violeta de la referencia, insignia `LACTOSA`, nota `Intolerancia a la lactosa. Consumir únicamente alimentos sin lactosa.` y Paula Díaz como Mamá activa.
- `emma-castro`: Emma Castro, 2 años, nacimiento `14 dic 2022`, ingreso `mar 2025`, avatar rosa de la referencia, sin insignia, sin alergias ni notas, y Natalia Castro como Mamá activa.
- `lucas-romero`: Lucas Romero, 3 años, nacimiento `27 feb 2022`, ingreso `sep 2024`, avatar azul de la referencia, sin insignia, sin alergias ni notas, y Andrés Romero como Papá activo.
- `olivia-vega`: Olivia Vega, 2 años, nacimiento `6 ago 2022`, ingreso `feb 2025`, avatar verde de la referencia, sin insignia, sin alergias ni notas, y Camila Vega como Mamá activa.

Los nombres, edades, cantidades, insignias y colores de los ocho niños conservan `ninos.dc.html`. Los datos adicionales distintos de Mateo son contenido ficticio de presentación y no representan registros reales.

No se introduce un modelo persistente ni un contrato de API.

## Archivos

**Archivos existentes que cambian:**

- `app/page.tsx`
- `app/globals.css`
- `components/icons.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/mobile-navigation.tsx`
- `components/feed/feed-composer.tsx`
- `components/feed/post-card.tsx`
- `types/feed.ts`

**Archivo existente que se mueve:**

- `components/feed/avatar.tsx` a `components/ui/avatar.tsx`

**Archivos nuevos:**

- `app/kids/page.tsx`
- `app/kids/[id]/page.tsx`
- `components/layout/app-shell.tsx`
- `components/kids/kids-directory.tsx`
- `components/kids/kids-header.tsx`
- `components/kids/kid-card.tsx`
- `components/kids/kid-profile.tsx`
- `components/kids/kid-profile-header.tsx`
- `components/kids/medical-notes-card.tsx`
- `components/kids/kid-facts.tsx`
- `components/kids/linked-parents-card.tsx`
- `data/kids.ts`
- `types/avatar.ts`
- `types/kids.ts`

No se agregan assets a `public/`, rutas de estado personalizadas ni dependencias a `package.json`.

## Plan de implementación

1. Crear `types/avatar.ts`, mover `Avatar` a `components/ui/avatar.tsx` y actualizar sus consumidores y `types/feed.ts`, sin modificar la presentación del feed.
2. Crear `types/kids.ts` con `Kid`, `KidParent`, `KidMedicalNotes`, `KidListBadge` y `KidsData`.
3. Crear `data/kids.ts` con las ocho fixtures exactas definidas en esta spec y una función pura para localizar un niño por `id`.
4. Actualizar `components/icons.tsx` con los iconos de búsqueda, flechas y advertencia que requieren las referencias; ampliar `app/globals.css` con los tokens de estados médicos, padres y avatares que no existan todavía.
5. Actualizar `Sidebar` y `MobileNavigation` para recibir el destino actual, enlazar Feed con `/`, enlazar Niños con `/kids` y conservar Avisos y Mi cuenta deshabilitados.
6. Crear `components/layout/app-shell.tsx` para componer la navegación responsive y el área principal; adaptar `app/page.tsx` para usarlo y comprobar que `/` no cambia visualmente ni en contenido.
7. Crear `components/kids/kid-card.tsx`, `kids-header.tsx` y `kids-directory.tsx`; implementar en este último la búsqueda normalizada y el estado sin resultados.
8. Crear `app/kids/page.tsx` y componer el listado de escritorio desde las fixtures, con enlaces únicos a `/kids/[id]` y controles futuros deshabilitados.
9. Adaptar `/kids` a la cabecera y navegación móvil de SPEC 01; convertir la grilla en una columna y reservar espacio inferior para que ninguna tarjeta quede oculta tras la navegación fija.
10. Crear `kid-profile-header.tsx`, `medical-notes-card.tsx`, `kid-facts.tsx` y `linked-parents-card.tsx` para representar los datos, estados médicos, padres activos o pendientes y ausencia de padres.
11. Crear `kid-profile.tsx` y `app/kids/[id]/page.tsx`; resolver el parámetro dinámico desde las fixtures, renderizar los ocho perfiles y usar `notFound()` para identificadores desconocidos.
12. Adaptar el perfil a 390 x 844 apilando contenido y panel lateral, mantener accesible el enlace de regreso y comprobar que todos los controles no implementados permanecen deshabilitados.

Cada paso debe conservar `npm run dev` funcional y no debe crear enlaces a rutas inexistentes.

## Criterios de aceptación

- [ ] Visitar `/kids` muestra la pantalla Niños de OpenDayCare y conserva el shell visual establecido por SPEC 01.
- [ ] A 1200 x 800, una comparación manual lado a lado con `referencias/pantallas/ninos.dc.html` confirma la misma estructura, medidas, espaciado, paleta, bordes, radios, sombras, tipografía e iconografía, salvo diferencias inevitables de antialiasing.
- [x] El listado muestra exactamente ocho tarjetas, en el orden Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas y Olivia.
- [x] Cada tarjeta muestra el nombre, edad, cantidad de padres, avatar e insignia definidos por la referencia y por las fixtures cerradas.
- [x] Cada tarjeta es un enlace a `/kids/{id}` y los ocho enlaces usan un identificador único de `data/kids.ts`.
- [ ] Escribir `sofia` encuentra a Sofía Méndez aunque la consulta no contenga tilde ni respete mayúsculas.
- [ ] La búsqueda filtra al escribir por cualquier fragmento del nombre completo y no busca por otros atributos.
- [ ] Una consulta sin coincidencias muestra un estado vacío explícito y no conserva tarjetas ocultas visualmente.
- [ ] Vaciar la búsqueda restaura las ocho tarjetas en su orden original.
- [ ] Visitar `/kids/mateo-fernandez` reproduce el contenido, la jerarquía y la distribución de `referencias/pantallas/perfil-nino.dc.html` con sus datos literales.
- [x] Cada uno de los ocho identificadores definidos abre un perfil con el nombre, avatar, edad, nacimiento, sala, ingreso, notas y padres exactos de esta spec.
- [ ] Un perfil sin alertas muestra `Sin alergias ni notas registradas` con un estilo neutro que no se confunde con una advertencia.
- [x] El perfil de Valentina muestra `Sin padres vinculados` y conserva visible la acción deshabilitada para vincular un padre.
- [x] Los padres activos muestran la insignia `ACTIVA` y Diego Fernández muestra la insignia `PENDIENTE` y el texto de invitación enviada.
- [ ] El enlace `Volver a Niños` navega desde cualquier perfil hasta `/kids`.
- [x] Visitar `/kids/un-id-inexistente` devuelve la página 404 de Next.js.
- [ ] Agregar niño, Editar, Resumen del día y Vincular padre se anuncian semánticamente como no disponibles, no cambian estado y no navegan.
- [x] Feed enlaza a `/`, Niños enlaza a `/kids` y el destino correspondiente usa `aria-current="page"` tanto en escritorio como en móvil.
- [ ] Avisos y Mi cuenta continúan visibles, semánticamente deshabilitados y sin navegación.
- [x] `/kids` y `/kids/[id]` reutilizan los componentes existentes `Sidebar`, `MobileNavigation`, `Brand`, `Avatar` e iconos aplicables; no incorporan implementaciones duplicadas de esas responsabilidades.
- [ ] La ruta `/` conserva los datos, el layout y el comportamiento aceptados en SPEC 01 después de adoptar `AppShell` y el avatar compartido.
- [ ] En anchos menores de 768 px desaparece el sidebar y aparecen la cabecera compacta y la navegación inferior con Niños como destino actual.
- [ ] A 390 x 844, `/kids` usa una sola columna, no tiene scroll horizontal y la última tarjeta puede desplazarse por encima de la navegación inferior.
- [ ] A 390 x 844, `/kids/mateo-fernandez` apila el contenido principal y los padres, no recorta textos ni controles y permite volver al listado.
- [ ] La paleta permanece fiel a las referencias independientemente de la preferencia de tema del sistema.
- [ ] La consola del navegador no muestra errores ni advertencias producidos por `/`, `/kids` o los perfiles.
- [x] `npm run lint -- app components data types` finaliza correctamente.
- [x] `npx tsc --noEmit` finaliza correctamente.
- [x] `npm run build` finaliza correctamente y genera correctamente las rutas estáticas basadas en fixtures.
- [x] `package.json` y `package-lock.json` no incorporan nuevas dependencias para esta implementación.

## Decisiones

- **Sí:** la lista vive en `/kids` y cada detalle en `/kids/[id]`. La URL identifica de forma estable al niño seleccionado.
- **Sí:** SPEC 02 depende de SPEC 01. Reutiliza sus fuentes, tokens, identidad de sala, usuario y patrón responsive.
- **Sí:** `ninos.dc.html` y `perfil-nino.dc.html` son las fuentes de verdad visual de escritorio.
- **Sí:** los ocho niños tienen perfiles completos. Los datos que no aparecen en las referencias quedan fijados en esta spec para evitar decisiones durante la implementación.
- **Sí:** los datos viven en `data/kids.ts` como fixtures TypeScript tipadas. No existe una necesidad actual de persistencia o red.
- **Sí:** las edades y fechas son etiquetas estáticas de presentación. No se recalcula la edad con la fecha del sistema.
- **Sí:** la búsqueda es la única interacción nueva en cliente. Normaliza texto con Unicode para ignorar diacríticos y mayúsculas.
- **No:** búsqueda por atributos adicionales. La referencia presenta una búsqueda de niños y el nombre es el único contrato acordado.
- **Sí:** un identificador desconocido usa la página 404 de Next.js. No se oculta el error mediante una redirección.
- **Sí:** los niños sin notas conservan una sección neutra explícita. Ocultarla haría ambiguo si la información fue revisada o no existe.
- **Sí:** los niños sin padres conservan el panel y muestran un estado vacío. La estructura del perfil no cambia y la ausencia es explícita.
- **Sí:** `AppShell` centraliza sidebar, cabecera móvil y navegación inferior. Tres rutas necesitan ya el mismo comportamiento.
- **Sí:** se reutilizan y extienden primero los componentes existentes de SPEC 01. Solo se crea un componente nuevo cuando ninguna pieza actual cubre esa responsabilidad sin mezclar dominios.
- **Sí:** Feed y Niños son enlaces reales y reciben el estado actual mediante props. Avisos y Mi cuenta siguen deshabilitados hasta sus propias specs.
- **Sí:** Agregar, Editar, Resumen del día y Vincular padre permanecen visibles y deshabilitados. Sus flujos merecen specs independientes.
- **Sí:** el avatar se mueve a `components/ui/avatar.tsx` y sus tipos a `types/avatar.ts`. Ya no pertenece únicamente al feed y se reutiliza en Niños.
- **Sí:** el móvil sigue el patrón de SPEC 01. No se introduce un menú lateral colapsable nuevo.
- **Sí:** la fidelidad se valida manualmente a 1200 x 800 y la adaptación responsive a 390 x 844.
- **No:** Playwright o un runner automatizado. La validación acordada combina navegador, lint, TypeScript y build.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los perfiles ficticios pueden confundirse con datos reales del producto. | Mantenerlos exclusivamente en `data/kids.ts` y documentarlos como contenido de presentación sin persistencia. |
| La normalización de búsqueda puede comportarse distinto con caracteres acentuados. | Normalizar consulta y nombres con Unicode, retirar marcas diacríticas y verificar expresamente `sofia` contra `Sofía`. |
| Extraer `AppShell` y mover el avatar puede introducir una regresión en el feed. | Conservar las props y valores visuales existentes y volver a validar `/` a 1200 x 800 y 390 x 844. |
| No existe una referencia visual móvil para estas pantallas. | Aplicar el contrato responsive de SPEC 01 y verificar ausencia de recortes y scroll horizontal a 390 x 844. |
| Los controles visibles pueden parecer funcionales. | Usar controles deshabilitados con nombres accesibles que indiquen su indisponibilidad y evitar enlaces a rutas futuras. |

## Qué **no** incluye esta spec

- Formularios o mutaciones de niños y padres.
- Resumen del día.
- Autenticación, autorización o cierre de sesión real.
- Persistencia, API, base de datos o datos obtenidos por red.
- Fotografías reales.
- Búsqueda avanzada, filtros, ordenamiento o paginación.
- Rutas distintas de `/`, `/kids` y `/kids/[id]`.
- Playwright, snapshots visuales automatizados o un runner de pruebas.
- Otras plantillas del directorio `referencias/pantallas/`.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
