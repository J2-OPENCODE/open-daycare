# SPEC 06 — Modal de nueva publicación

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02, SPEC 05
> **Fecha:** 2026-09-05
> **Objetivo:** Implementar en el feed un modal responsive de nueva publicación con selección de destinatarios y tipo, validación local y envío simulado sin persistencia.

## Por qué existe esta spec

SPEC 01 dejó visibles pero deshabilitados el composer y los accesos globales a Nueva publicación. Esta spec habilita esos controles únicamente en el feed y reutiliza el patrón de diálogo de SPEC 05 sin anticipar persistencia, fotografías ni contratos de backend.

## Alcance

**Incluye:**

- Usar `referencias/pantallas/crear-publicacion.dc.html` como fuente de verdad para el contenido, la jerarquía, la tipografía, la paleta y las proporciones del formulario.
- Abrir el modal desde el composer, el botón Nueva publicación del sidebar y el botón más de la cabecera móvil de `/`.
- Mantener esos accesos deshabilitados en `/kids` y `/kids/[id]`.
- Abrir el modal sobre el feed sin cambiar la URL.
- Mantener el feed visible detrás del fondo semitransparente difuminado de los modales existentes.
- Reutilizar `ModalDialog`, `Avatar`, los iconos, los tokens visuales y las fixtures existentes.
- Mostrar en PARA los ocho niños de `kidsData.children`, con su nombre, inicial y colores de avatar.
- Iniciar la audiencia sin destinatarios seleccionados.
- Permitir activar y desactivar varios niños de manera independiente.
- Mantener activos los ocho chips individuales si los ocho niños se seleccionan manualmente.
- Representar Toda la sala como una audiencia exclusiva que incluye lógicamente a los ocho niños, desactiva visualmente todos los chips individuales y deja activo únicamente el chip Toda la sala.
- Permitir desactivar Toda la sala mediante una segunda pulsación para volver a una audiencia vacía.
- Al pulsar un niño mientras Toda la sala está activa, desactivar Toda la sala e iniciar una nueva selección individual únicamente con ese niño.
- Mostrar en TIPO exactamente `Comida`, `Siesta`, `Actividad`, `Logro`, `Ánimo`, `Foto` y `Anuncio`.
- Permitir seleccionar exactamente un tipo e iniciar con `Actividad` seleccionada.
- Mantener seleccionado el tipo activo si vuelve a pulsarse.
- Iniciar DESCRIPCIÓN con el texto `Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón.` y permitir editarlo.
- Mostrar en FOTOS el placeholder y el control Agregar de la referencia, con Agregar deshabilitado semánticamente y sin recibir foco.
- Validar al publicar que exista al menos un destinatario y que la descripción contenga al menos un carácter después de aplicar `trim()`.
- Mostrar errores asociados con PARA y DESCRIPCIÓN después de intentar publicar y revalidar cada campo mientras se corrige.
- Enfocar el primer control inválido según el orden visual, primero PARA y después DESCRIPCIÓN.
- Cerrar manualmente el modal únicamente mediante Cancelar; Escape y el clic en el fondo no deben cerrarlo.
- Conservar en memoria los destinatarios, el tipo y la descripción al cancelar y reabrir mientras el feed continúe montado.
- Limpiar los errores y el estado de intento de envío al cancelar, aunque se conserve el borrador.
- Cerrar y reiniciar el formulario después de una publicación válida simulada.
- Restaurar el foco al control que abrió el modal después de cerrarlo.
- Mantener el feed sin cambios y sin mostrar una confirmación después de una publicación válida.
- Adaptar el modal a escritorio y móvil con contenido desplazable cuando no quepa en el viewport.
- Validar manualmente la interacción a 1200 x 800 y 390 x 844.

**Fuera de alcance (para specs futuras):**

- Crear la ruta `/posts/new`, otra ruta de publicación o cambiar la URL al abrir el modal.
- Agregar la publicación simulada al feed o modificar `feedData.posts`.
- Persistir el borrador o la publicación en `localStorage`, una API o una base de datos.
- Incorporar Server Actions, Route Handlers o solicitudes de red.
- Seleccionar archivos, generar previews, almacenar o mostrar fotografías reales.
- Abrir el modal desde `/kids`, `/kids/[id]` u otras rutas distintas del feed.
- Editar publicaciones existentes desde sus tarjetas.
- Añadir validaciones de longitud, archivos o contenido por tipo.
- Mostrar un aviso de publicación exitosa.
- Incorporar una suite de pruebas automatizadas o nuevas dependencias.

## Modelo de datos

`lib/create-post-form.ts` define el estado efímero del formulario, los tipos disponibles, el contenido inicial y los validadores puros.

```ts
type CreatePostAudience =
  | { kind: "kids"; kidIds: readonly string[] }
  | { kind: "room" };

type CreatePostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

type CreatePostFormValues = {
  audience: CreatePostAudience;
  type: CreatePostType;
  description: string;
};

type RequiredCreatePostField = "audience" | "description";

type CreatePostFormErrors = Partial<
  Record<RequiredCreatePostField, string>
>;

const INITIAL_CREATE_POST_FORM_VALUES: CreatePostFormValues = {
  audience: { kind: "kids", kidIds: [] },
  type: "activity",
  description:
    "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón.",
};
```

La variante `room` representa a toda la sala sin copiar los ocho identificadores al estado. La variante `kids` puede contener entre cero y ocho identificadores únicos y conserva la selección manual de los ocho niños como un estado visual distinto de Toda la sala.

Los valores viven únicamente mientras el feed permanezca montado. Recargar la página o abandonar `/` descarta el borrador; publicar correctamente reinicia el estado inicial.

## Archivos

**Archivos existentes que cambian:**

- `app/page.tsx`
- `app/globals.css`
- `components/feed/feed-composer.tsx`
- `components/layout/app-shell.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/mobile-navigation.tsx`
- `components/ui/avatar.tsx`
- `components/ui/modal-dialog.tsx`

**Archivos nuevos:**

- `components/feed/feed-experience.tsx`
- `components/feed/create-post-modal.tsx`
- `components/feed/post-audience-selector.tsx`
- `components/feed/post-type-selector.tsx`
- `lib/create-post-form.ts`

No se modifica `data/feed.ts`, `data/kids.ts`, `types/feed.ts`, `types/kids.ts`, `package.json` ni `package-lock.json`, y no se crea una ruta nueva.

## Plan de implementación

1. Crear `lib/create-post-form.ts` con `CreatePostAudience`, `CreatePostType`, `CreatePostFormValues`, `CreatePostFormErrors`, las siete opciones de tipo, el estado inicial y validadores puros para audiencia y descripción.
2. Ampliar `components/ui/avatar.tsx` con un tamaño para chips de destinatario que conserve la API y los tamaños existentes.
3. Ampliar `components/ui/modal-dialog.tsx` con una opción `dismissible` activada por defecto; cuando sea `false`, Escape y el clic directo en el fondo no ejecutan `onClose`, mientras Agregar niño y Vincular padre conservan su comportamiento actual.
4. Crear `components/feed/post-audience-selector.tsx` para renderizar `kidsData.children`, alternar selecciones individuales, manejar Toda la sala como estado exclusivo, exponer `aria-pressed` y asociar el error de audiencia con el grupo.
5. Crear `components/feed/post-type-selector.tsx` con los siete tipos, sus estilos tomados de la referencia, selección única y estado activo comunicado mediante `aria-pressed`.
6. Crear `components/feed/create-post-modal.tsx` con la estructura visual de la referencia, `ModalDialog`, encabezado, selectores reutilizables, textarea controlado, placeholder de fotografía y control Agregar deshabilitado.
7. Incorporar en `CreatePostModal` la validación al enviar, la revalidación durante la corrección, el foco sobre el primer campo inválido, la limpieza de errores al cancelar, la conservación del borrador y el reinicio después de un envío válido.
8. Crear `components/feed/feed-experience.tsx` como frontera de cliente para componer el feed actual, controlar la apertura del modal y compartir un único callback entre sus tres disparadores.
9. Actualizar `components/feed/feed-composer.tsx`, `components/layout/app-shell.tsx`, `components/layout/sidebar.tsx` y `components/layout/mobile-navigation.tsx` con callbacks opcionales que habiliten Nueva publicación únicamente cuando `FeedExperience` los proporcione.
10. Actualizar `app/page.tsx` para entregar `feedData` y `kidsData.children` a `FeedExperience` sin convertir las fixtures ni las rutas de niños en estado de cliente.
11. Ampliar `app/globals.css` únicamente con los tokens o estilos que falten para los tipos, los estados seleccionados, los errores y la adaptación responsive del modal.
12. Adaptar el modal a 390 x 844 mediante márgenes exteriores, altura máxima basada en `dvh` y desplazamiento interno, sin modificar la composición de escritorio a 1200 x 800.
13. Verificar que el flujo no cambia la URL, el feed, las fixtures, las rutas de niños, los modales existentes ni los archivos de dependencias.

Cada paso debe conservar `npm run dev` funcional y no debe crear publicaciones, fotografías, persistencia ni solicitudes de red.

## Criterios de aceptación

- [x] Visitar `/` conserva el contenido, las tres publicaciones y el shell visual definidos en SPEC 01.
- [x] El composer del feed está habilitado y abre Nueva publicación sin cambiar la URL.
- [x] El botón Nueva publicación del sidebar está habilitado en `/` y abre el mismo modal.
- [x] El botón más de la cabecera móvil está habilitado en `/` y abre el mismo modal.
- [x] Los accesos de Nueva publicación permanecen deshabilitados en `/kids` y `/kids/[id]`.
- [x] Al abrir el modal, el feed permanece visible detrás de un fondo semitransparente difuminado que bloquea su interacción.
- [x] El modal usa un `<dialog>` con nombre accesible `Nueva publicación` y coloca el foco en el primer destinatario.
- [x] A 1200 x 800, el modal reproduce la composición, proporciones, tipografía, paleta, bordes, radios, sombras e iconografía de `referencias/pantallas/crear-publicacion.dc.html`, salvo el fondo modal acordado y diferencias inevitables de antialiasing.
- [x] El formulario muestra PARA, TIPO, DESCRIPCIÓN y FOTOS en ese orden.
- [x] PARA muestra exactamente los ocho niños de `kidsData.children` y el botón Toda la sala.
- [x] El formulario comienza sin ningún destinatario seleccionado.
- [x] Pulsar un niño inactivo lo activa sin desactivar otros niños seleccionados.
- [x] Pulsar un niño activo lo desactiva sin modificar los demás.
- [x] Seleccionar manualmente los ocho niños mantiene activos los ocho chips individuales y no activa Toda la sala.
- [x] Pulsar Toda la sala con niños seleccionados desactiva visualmente todos los chips individuales y deja activo únicamente Toda la sala.
- [x] Pulsar Toda la sala cuando ya está activa deja la audiencia vacía.
- [x] Pulsar un niño mientras Toda la sala está activa desactiva Toda la sala y deja activo únicamente ese niño.
- [x] Cada chip de audiencia comunica su estado mediante `aria-pressed` y puede operarse con teclado.
- [x] TIPO ofrece exactamente `Comida`, `Siesta`, `Actividad`, `Logro`, `Ánimo`, `Foto` y `Anuncio`.
- [x] Actividad comienza seleccionada y únicamente un tipo puede permanecer activo.
- [x] Pulsar el tipo activo no lo desactiva.
- [x] Cada tipo comunica su estado mediante `aria-pressed` y puede operarse con teclado.
- [x] DESCRIPCIÓN comienza con el texto de témperas acordado y permite editarlo o borrarlo.
- [x] FOTOS muestra el placeholder y Agregar con la apariencia de la referencia.
- [x] Agregar foto está deshabilitado, no abre un selector de archivos y no recibe foco.
- [x] Intentar publicar sin destinatarios mantiene el modal abierto y muestra un error asociado con PARA.
- [x] Una descripción vacía o compuesta únicamente por espacios se considera inválida y muestra un error asociado con DESCRIPCIÓN.
- [x] Si audiencia y descripción son inválidas, el primer control de PARA recibe foco después de intentar publicar.
- [x] Si únicamente la descripción es inválida, el textarea recibe foco después de intentar publicar.
- [x] Después del primer intento, cada error desaparece cuando su campo corregido pasa a ser válido.
- [x] Cambiar de tipo no introduce errores porque siempre existe exactamente una selección.
- [x] Cancelar cierra el modal, conserva audiencia, tipo y descripción, limpia los errores y devuelve el foco al disparador utilizado.
- [x] Reabrir después de cancelar recupera el borrador conservado sin mostrar errores anteriores.
- [x] Presionar Escape no cierra el modal ni modifica el borrador.
- [x] Hacer clic directamente sobre el fondo no cierra el modal ni modifica el borrador.
- [x] Hacer clic dentro de la tarjeta no cierra el modal salvo que se active Cancelar o se complete una publicación válida.
- [x] Publicar un formulario válido cierra el modal, restaura el foco y reinicia el formulario.
- [x] Reabrir después de una publicación válida muestra audiencia vacía, Actividad seleccionada y el texto inicial de referencia.
- [x] Una publicación válida no agrega tarjetas, no cambia contadores, no modifica fixtures y no produce solicitudes de red.
- [x] Después de una publicación válida no aparece un aviso de confirmación.
- [x] `ModalDialog` permite bloquear Escape y fondo para Nueva publicación sin duplicar el comportamiento base del diálogo.
- [x] Agregar niño y Vincular padre conservan sus mecanismos de cierre, restauración de foco y demás comportamientos aprobados.
- [x] A 390 x 844, la tarjeta mantiene márgenes respecto del viewport, permite desplazar su contenido y no presenta scroll horizontal ni controles recortados.
- [x] El modal aparece por encima de la cabecera, el sidebar y la navegación móvil.
- [x] La animación de apertura se desactiva o reduce cuando el sistema solicita movimiento reducido.
- [x] La paleta permanece fiel a las referencias independientemente de la preferencia de tema del sistema.
- [x] La consola del navegador no muestra errores ni advertencias producidos al abrir, seleccionar, validar, publicar o cancelar.
- [x] `npm run lint -- app components data types lib` finaliza correctamente.
- [x] `npx tsc --noEmit` finaliza correctamente.
- [x] `npm run build` finaliza correctamente.
- [x] `package.json` y `package-lock.json` no incorporan nuevas dependencias.

## Decisiones

- **Sí:** SPEC 06 depende de SPEC 01, SPEC 02 y SPEC 05. Habilita controles del feed, consume los niños existentes y reutiliza el patrón de modal compartido.
- **Sí:** Nueva publicación es un modal local de `/`. No se crea `/posts/new` ni se modifica la URL.
- **Sí:** los tres disparadores de `/` comparten un único controlador y una única instancia del modal.
- **No:** habilitar los disparadores globales en rutas de niños. Permanecen no disponibles hasta que otra spec defina ese alcance.
- **Sí:** `kidsData.children` es la única fuente de destinatarios. No se duplica la lista de Mateo, Sofía y Benjamín de la referencia.
- **Sí:** la audiencia usa una unión discriminada. Toda la sala se representa de forma explícita y no como una copia de ocho identificadores.
- **Sí:** seleccionar individualmente los ocho niños permanece visual y semánticamente distinto de pulsar Toda la sala.
- **Sí:** los niños usan selección múltiple y Toda la sala es exclusiva.
- **Sí:** el tipo usa selección única obligatoria y comienza en Actividad. Pulsar la opción activa no deja el formulario sin tipo.
- **Sí:** la descripción conserva el contenido demostrativo de la referencia en la primera apertura.
- **Sí:** audiencia y descripción son obligatorias y se validan después del intento de envío. No se deshabilita Publicar preventivamente.
- **Sí:** los errores se actualizan durante la corrección y el primer campo inválido recibe foco.
- **Sí:** Cancelar conserva el borrador en memoria, pero limpia errores antiguos antes de reabrir.
- **No:** persistir el borrador al recargar o abandonar el feed. Su ciclo de vida pertenece únicamente a la instancia montada.
- **Sí:** Escape y el fondo no cierran Nueva publicación por decisión explícita. Cancelar es el único cierre manual.
- **Sí:** `ModalDialog` recibe una opción configurable con el comportamiento actual como valor predeterminado. Los modales existentes no deben cambiar.
- **Sí:** una publicación válida cierra y reinicia el formulario, pero no muta el feed ni muestra confirmación.
- **No:** añadir temporalmente una tarjeta al feed. Comunicaría una mutación que la demostración no realiza.
- **No:** carga o preview de fotografías. Agregar permanece visible y semánticamente deshabilitado.
- **No:** nuevas dependencias o un runner automatizado. La validación acordada combina navegador, lint, TypeScript y build.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Ampliar `ModalDialog` puede cambiar accidentalmente el cierre de Agregar niño o Vincular padre. | Mantener el comportamiento actual como valor predeterminado y verificar nuevamente Escape, fondo, acciones y foco de ambos modales. |
| Seleccionar los ocho niños y elegir Toda la sala representan destinatarios equivalentes con estados distintos. | Conservar la diferencia acordada: selección manual mantiene ocho chips activos y solo el botón Toda la sala produce la variante `room`. |
| Conservar el borrador al cancelar puede parecer persistencia permanente. | Limitarlo a la instancia montada del feed y reiniciar al publicar, recargar o abandonar `/`. |
| Bloquear Escape y fondo puede sorprender a personas acostumbradas a diálogos descartables. | Mantener Cancelar visible, enfocable y como primera acción del encabezado; la restricción responde a una decisión explícita del flujo. |
| Los ocho destinatarios y el resto del formulario pueden superar la altura móvil. | Usar altura máxima basada en `dvh`, márgenes mínimos y desplazamiento dentro de la tarjeta. |
| La navegación fija podría cubrir el modal. | Reutilizar la capa superior nativa de `<dialog>` y verificar la presentación en ambos viewports. |

## Qué **no** incluye esta spec

- Una ruta propia o cambios de URL para Nueva publicación.
- Persistencia del borrador o de la publicación.
- Mutaciones del feed, sus fixtures o sus contadores.
- API, base de datos, Server Actions o Route Handlers.
- Selección, preview, almacenamiento o visualización de fotografías reales.
- Apertura del modal desde rutas de niños.
- Edición de publicaciones existentes.
- Confirmación de publicación exitosa.
- Pruebas automatizadas o dependencias nuevas.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
