# SPEC 14 — Publicación de entradas con fotos y feed persistente

> **Estado:** Aprobado
> **Depende de:** SPEC 06, SPEC 10, SPEC 13
> **Fecha:** 2026-09-10
> **Objetivo:** Convertir Nueva publicación en un flujo real que guarde la entrada, su audiencia y sus fotos en Supabase, y mostrar en `/` el feed persistente de la guardería.

## Por qué existe esta spec

SPEC 06 implementó el modal completo, pero descarta los datos después de validar y deja Agregar foto deshabilitado. SPEC 10 estableció el patrón de Server Action, revalidación y aviso de éxito para el alta de niños. SPEC 13 aporta las tablas, el bucket privado y las políticas necesarias para reemplazar la simulación sin rediseñar la pantalla aprobada.

## Alcance

**Incluye:**

- Mantener el modal Nueva publicación dentro de `/` y conservar su identidad visual aprobada.
- Sustituir las fixtures como fuente de las publicaciones del feed por consultas autenticadas a `public.posts`, `public.post_children` y `public.post_photos`.
- Mantener `data/feed.ts` únicamente para las etiquetas visuales que no provienen de la base de datos.
- Exigir un usuario activo con rol `staff` o `admin` para visitar `/` y para ejecutar la publicación.
- Conservar las redirecciones actuales a `/login` para sesiones anónimas o perfiles inactivos.
- Alimentar PARA con los niños `active` de la guardería obtenidos de `public.children` y enviar sus UUID.
- Ordenar los niños de PARA alfabéticamente por nombre completo.
- Mostrar un selector de sala cuando Toda la sala esté activa, con las salas de la guardería en el orden de `rooms.position`.
- Mostrar en ese selector `Sala Soles`, `Sala Lunas` y `Sala Estrellas`, aunque `rooms.name` almacene Soles, Lunas y Estrellas.
- Iniciar el selector de sala sin una sala elegida y enviar el UUID de la sala, no su nombre visible.
- Exigir una sala elegida cuando la audiencia sea Toda la sala.
- Iniciar DESCRIPCIÓN vacía con el placeholder `Compartí un momento…` en lugar del texto de demostración de SPEC 06.
- Habilitar Agregar en FOTOS para elegir archivos desde el dispositivo.
- Aceptar como máximo cuatro fotos por publicación, de hasta 5.242.880 bytes cada una y de tipo `image/jpeg`, `image/png` o `image/webp`.
- Mostrar una miniatura por archivo elegido, con su nombre y un control para quitarlo antes de publicar.
- Liberar las URL de objeto de las miniaturas al quitar un archivo, al cerrar el modal y al desmontar el componente.
- Permitir publicar sin ninguna foto.
- Rechazar el envío, en cliente y en servidor, cuando la publicación lleve fotos y algún niño etiquetado tenga `photo_consent = false`, con un error que nombre a ese niño.
- Permitir fotos con cualquier tipo de publicación, sin obligar al tipo `Foto`.
- Enviar la publicación mediante una Server Action dedicada que reciba `FormData`, sin introducir un Route Handler.
- Tratar todos los argumentos de la acción como entrada no confiable y repetir en servidor cada validación de cliente.
- Derivar `daycare_id`, identidad y rol desde la sesión y el perfil persistido, nunca desde datos enviados por el cliente.
- Verificar en servidor que cada niño enviado pertenece a la guardería actual y está `active`.
- Verificar en servidor que la sala enviada pertenece a la guardería actual.
- Traducir los tipos visibles a `meal`, `nap`, `activity`, `achievement`, `mood`, `photo` y `announcement`.
- Persistir `author_id` con el identificador de la sesión y `published_at` con la hora del servidor.
- Guardar `title` nulo y dejar que la tarjeta derive su encabezado de la audiencia persistida.
- Subir cada foto al bucket privado `post-photos` con la ruta `{daycare_id}/{post_id}/{uuid}.{ext}`.
- Asignar `position` según el orden en que el staff eligió las fotos.
- Persistir `storage_path`, `content_type` y `size_bytes` de cada foto.
- Eliminar del bucket los objetos ya subidos cuando falle cualquier paso posterior de la publicación.
- Deshabilitar Publicar y Cancelar, bloquear Escape y fondo y mostrar `Publicando…` mientras el envío está pendiente.
- Impedir envíos duplicados durante la operación pendiente.
- Mantener abierto el modal y conservar todos los valores cuando falle una validación de servidor o Supabase.
- Mostrar un error general accesible cuando la publicación no pueda completarse por una causa no asociada con un campo.
- Cerrar y reiniciar el modal únicamente después de confirmar la escritura.
- Revalidar `/` en la Server Action para incluir la publicación nueva en la misma respuesta.
- Mostrar `Publicación creada` durante tres segundos después del cierre exitoso mediante `SuccessNotice`.
- Mantener el aviso ausente cuando la publicación falle o el modal se cancele.
- Listar en `/` las publicaciones de la guardería ordenadas por `published_at` descendente con un límite fijo de 50.
- Mostrar `Todavía no hay publicaciones` cuando la guardería no tenga ninguna.
- Derivar el encabezado de cada tarjeta: el nombre del niño cuando hay uno, los nombres cuando hay varios y `Anuncio general` cuando la audiencia es una sala.
- Derivar la audiencia de cada tarjeta: `familia de {nombre}`, `familias de {nombres}` o `toda la {sala}`.
- Mostrar `vos` como autor cuando la publicación es del usuario actual y el nombre del autor en el resto de los casos.
- Formatear `published_at` como hora local de veinticuatro horas, igual que el diseño aprobado.
- Mostrar la primera foto de la publicación con `next/image` y una URL firmada de una hora generada en servidor.
- Indicar en la tarjeta cuántas fotos adicionales tiene la publicación cuando hay más de una.
- Conservar el recuadro de foto actual únicamente para publicaciones sin fotos que lo necesiten por diseño.
- Mostrar contadores de reacciones y comentarios en 0 y conservar sus controles deshabilitados.
- Calcular `childCount` de la cabecera con los niños `active` de la guardería.
- Calcular `dateLabel` de la cabecera con la fecha actual en español.
- Regenerar `types/database.ts` desde el esquema desplegado por SPEC 13.
- Validar manualmente el flujo a 1200 x 800 y 390 x 844.

**Fuera de alcance (para specs futuras):**

- Editar, archivar o eliminar publicaciones.
- Reaccionar o comentar publicaciones.
- Vista de foto a pantalla completa o galería con navegación.
- Feed del rol `parent` y su filtrado por `post_children`.
- Notificar a las familias cuando se publica una entrada.
- Paginación incremental, filtros por tipo, por sala o por niño.
- Búsqueda de publicaciones.
- Redimensionar, comprimir o recortar imágenes en el navegador o en el servidor.
- Registrar `width` y `height` de las fotos.
- Borradores persistentes entre sesiones.
- Publicar desde `/kids` o `/kids/[slug]`.
- Cambiar la sala mostrada en la cabecera del feed o asignar sala al staff.
- Incorporar una suite automatizada o nuevas dependencias.

## Modelo de aplicación

Esta spec no crea tablas, columnas, políticas ni funciones PostgreSQL. Reutiliza `public.posts`, `public.post_children`, `public.post_photos` y el bucket `post-photos` implementados por SPEC 13.

### Estado del formulario

`lib/create-post-form.ts` amplía el estado definido en SPEC 06:

```ts
type CreatePostAudience =
  | { kind: "kids"; kidIds: readonly string[] }
  | { kind: "room"; roomId: string | null };

type CreatePostPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type CreatePostFormValues = {
  audience: CreatePostAudience;
  type: CreatePostType;
  description: string;
  photos: readonly CreatePostPhoto[];
};

type RequiredCreatePostField = "audience" | "room" | "description" | "photos";

const MAX_POST_PHOTOS = 4;
const MAX_POST_PHOTO_BYTES = 5_242_880;
const ALLOWED_POST_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
```

`kidIds` pasa a contener UUID de `public.children` en lugar de los identificadores de la fixture. `previewUrl` proviene de `URL.createObjectURL` y se revoca siempre que la foto sale del estado.

### Contrato de la Server Action

`app/actions/posts.ts` expone `createPost(formData: FormData)`. La acción lee `type`, `description`, `audienceKind`, `kidIds`, `roomId` y los archivos bajo la clave `photos`, y devuelve un resultado discriminado con errores por campo o un error general. La acción nunca devuelve rutas de Storage ni identificadores internos que la interfaz no necesite.

El orden de las operaciones es:

1. Autorizar la sesión y cargar el perfil activo `staff` o `admin`.
2. Validar tipos, longitudes, audiencia, consentimiento fotográfico y archivos.
3. Reservar el UUID de la publicación en servidor para construir las rutas del bucket.
4. Subir las fotos al bucket.
5. Insertar `posts`, `post_children` y `post_photos` en una única operación.
6. Eliminar los objetos subidos si el paso 5 falla, y devolver un error general.
7. Revalidar `/`.

### Lectura del feed

`lib/posts.ts` resuelve el feed en servidor: consulta las publicaciones de la guardería con sus niños etiquetados, su sala, su autor y sus fotos, firma la primera foto de cada publicación por una hora y devuelve un DTO listo para `FeedList`. Las URL firmadas se generan por petición y no se almacenan.

## Archivos

**Archivos existentes que cambian:**

- `app/page.tsx`
- `data/feed.ts`
- `types/feed.ts`
- `types/database.ts`
- `lib/create-post-form.ts`
- `components/feed/feed-experience.tsx`
- `components/feed/feed-header.tsx`
- `components/feed/feed-list.tsx`
- `components/feed/post-card.tsx`
- `components/feed/create-post-modal.tsx`
- `components/feed/post-audience-selector.tsx`
- `app/globals.css`
- `next.config.ts`

**Archivos nuevos:**

- `app/actions/posts.ts`
- `lib/posts.ts`
- `components/feed/post-photo-picker.tsx`
- `components/feed/post-room-selector.tsx`

No se crean rutas nuevas y no se modifican `package.json` ni `package-lock.json`.

## Plan de implementación

1. Regenerar `types/database.ts` desde el esquema desplegado por SPEC 13 y confirmar que aparecen las tres tablas y el enum `post_type`.
2. Ampliar `lib/create-post-form.ts` con la sala de la audiencia, las fotos, los límites, los tipos permitidos y los validadores puros correspondientes.
3. Crear `components/feed/post-room-selector.tsx` con las salas de la guardería, etiqueta `Sala {nombre}`, estado inicial vacío y error asociado.
4. Crear `components/feed/post-photo-picker.tsx` con el control Agregar habilitado, la selección de archivos, las miniaturas, el control para quitar y la revocación de las URL de objeto.
5. Actualizar `components/feed/post-audience-selector.tsx` para consumir los niños persistidos, exponer el consentimiento fotográfico de cada niño y mostrar el selector de sala cuando Toda la sala esté activa.
6. Actualizar `components/feed/create-post-modal.tsx` con la descripción vacía, las validaciones nuevas, el estado pendiente, el bloqueo de envíos duplicados y el error general accesible.
7. Crear `lib/posts.ts` con la consulta del feed, la derivación de encabezado y audiencia, el formato de hora y la firma de la primera foto.
8. Crear `app/actions/posts.ts` con la autorización, la validación de servidor, la reserva del UUID, la subida al bucket, la escritura única, la limpieza de objetos huérfanos y la revalidación de `/`.
9. Actualizar `app/page.tsx` para cargar en servidor las publicaciones, los niños, las salas y el contador de niños, y entregarlos a `FeedExperience`.
10. Actualizar `types/feed.ts`, `data/feed.ts`, `components/feed/feed-header.tsx`, `components/feed/feed-list.tsx` y `components/feed/post-card.tsx` para representar publicaciones persistidas, fotos reales, estado vacío, contador y fecha.
11. Conectar `SuccessNotice` en `components/feed/feed-experience.tsx` con el mensaje `Publicación creada` durante tres segundos.
12. Configurar en `next.config.ts` el host de Supabase Storage como origen remoto permitido para `next/image`.
13. Ampliar `app/globals.css` únicamente con los estilos que falten para las miniaturas, el selector de sala, el estado vacío y el estado pendiente.
14. Verificar el flujo completo en el navegador a 1200 x 800 y 390 x 844, incluidas las publicaciones con y sin fotos.

Cada paso debe conservar `npm run dev` funcional y no debe introducir dependencias nuevas.

## Criterios de aceptación

- [ ] Visitar `/` sin sesión redirige a `/login` y con un perfil inactivo mantiene el comportamiento aprobado.
- [ ] Un perfil activo `staff` o `admin` ve el feed con las publicaciones persistidas de su guardería.
- [ ] Las publicaciones aparecen ordenadas por `published_at` descendente y se limitan a 50.
- [ ] Una guardería sin publicaciones muestra `Todavía no hay publicaciones` y no tarjetas de ejemplo.
- [ ] El feed no muestra ninguna de las tres publicaciones fixture de SPEC 01.
- [ ] `childCount` de la cabecera coincide con los niños `active` de la guardería.
- [ ] `dateLabel` de la cabecera muestra la fecha actual en español.
- [ ] PARA lista los niños `active` de la guardería, ordenados alfabéticamente, y no la fixture de ocho niños.
- [ ] Activar Toda la sala muestra el selector de sala con `Sala Soles`, `Sala Lunas` y `Sala Estrellas`.
- [ ] El selector de sala inicia vacío y publicar sin elegir sala muestra un error asociado y mantiene el modal abierto.
- [ ] Desactivar Toda la sala oculta el selector de sala y limpia su error.
- [ ] DESCRIPCIÓN inicia vacía y muestra el placeholder `Compartí un momento…`.
- [ ] Publicar con la descripción vacía o compuesta solo por espacios muestra el error de SPEC 06 y no escribe nada.
- [ ] Agregar en FOTOS está habilitado, recibe foco y abre el selector de archivos.
- [ ] Elegir un archivo muestra su miniatura y su nombre con un control para quitarlo.
- [ ] Quitar una foto la retira del estado y revoca su URL de objeto.
- [ ] Elegir una quinta foto se rechaza con un error asociado con FOTOS.
- [ ] Un archivo de más de 5.242.880 bytes se rechaza con un error asociado con FOTOS.
- [ ] Un archivo con un tipo distinto de JPEG, PNG o WebP se rechaza con un error asociado con FOTOS.
- [ ] Publicar sin fotos crea la publicación correctamente.
- [ ] Publicar con fotos y un niño etiquetado con `photo_consent = false` se rechaza con un error que nombra a ese niño.
- [ ] Ese mismo caso se rechaza también cuando la petición se envía sin pasar por la validación de cliente.
- [ ] Adjuntar fotos con el tipo Actividad se acepta sin obligar al tipo Foto.
- [ ] Una publicación con niños etiquetados persiste `room_id` nulo y una fila por niño en `post_children`.
- [ ] Una publicación de sala persiste `room_id` y ninguna fila en `post_children`.
- [ ] `posts.author_id` es el identificador de la sesión y `published_at` proviene del servidor.
- [ ] Las fotos se guardan en `post-photos` bajo `{daycare_id}/{post_id}/` y con `position` 1 a 4 en el orden elegido.
- [ ] `content_type` y `size_bytes` persistidos coinciden con el archivo subido.
- [ ] Un fallo en la escritura de la base deja el bucket sin objetos huérfanos de esa publicación.
- [ ] Enviar el UUID de un niño de otra guardería o de un niño `archived` se rechaza en servidor.
- [ ] Enviar el UUID de una sala de otra guardería se rechaza en servidor.
- [ ] Enviar un tipo de publicación fuera de los siete valores permitidos se rechaza en servidor.
- [ ] Mientras la publicación está pendiente, Publicar y Cancelar están deshabilitados, el botón muestra `Publicando…` y Escape y el fondo no cierran el modal.
- [ ] Pulsar Publicar repetidas veces no crea publicaciones duplicadas.
- [ ] Un fallo de servidor mantiene el modal abierto, conserva audiencia, tipo, descripción y fotos y muestra un error general accesible.
- [ ] Una publicación exitosa cierra el modal, reinicia el formulario y devuelve el foco al control que lo abrió.
- [ ] Después de una publicación exitosa, la tarjeta nueva aparece primera en el feed sin recargar manualmente.
- [ ] `Publicación creada` aparece tres segundos después del cierre exitoso y no aparece al cancelar o fallar.
- [ ] Una publicación con un niño muestra su nombre como encabezado y `familia de {nombre}` como audiencia.
- [ ] Una publicación con varios niños muestra sus nombres y `familias de …` como audiencia.
- [ ] Una publicación de sala muestra `Anuncio general` y `toda la {sala}` como audiencia.
- [ ] Una publicación propia muestra `vos` como autor y una ajena muestra el nombre del autor.
- [ ] La hora de la tarjeta corresponde a `published_at` en formato de veinticuatro horas.
- [ ] La tarjeta muestra la primera foto real mediante una URL firmada y no un recuadro vacío.
- [ ] Una publicación con varias fotos indica cuántas fotos adicionales tiene.
- [ ] La URL firmada caduca y no queda persistida en la base ni en el HTML de una respuesta cacheada.
- [ ] Los contadores de reacciones y comentarios muestran 0 y sus controles siguen deshabilitados.
- [ ] A 390 x 844 el modal con cuatro miniaturas y el feed con fotos no producen scroll horizontal ni controles recortados.
- [ ] La consola del navegador no muestra errores ni advertencias al abrir, elegir fotos, validar, publicar o cancelar.
- [ ] `npm run lint -- app components data types lib utils` finaliza correctamente.
- [ ] `npx tsc --noEmit` finaliza correctamente.
- [ ] `npm run build` finaliza correctamente.
- [ ] `package.json` y `package-lock.json` no incorporan nuevas dependencias.

## Decisiones

- **Sí:** SPEC 14 depende de SPEC 06, SPEC 10 y SPEC 13. Reutiliza el modal aprobado, el patrón de Server Action del alta de niños y las tablas nuevas.
- **Sí:** el feed pasa a ser persistente en la misma spec que la escritura. Sin lectura real no existe forma verificable de comprobar que la publicación se guardó.
- **Sí:** las fotos viajan a la Server Action dentro de `FormData`. El servidor valida tipo, tamaño y autorización antes de tocar el bucket y evita confiar en rutas enviadas por el cliente.
- **No:** subir desde el navegador directamente al bucket. Sería más rápido para archivos grandes, pero deja objetos huérfanos y traslada la validación al cliente.
- **Sí:** el bucket es privado y la tarjeta usa URLs firmadas de una hora generadas en servidor.
- **Sí:** Toda la sala exige elegir una sala en el modal. `public.users` no tiene sala asignada y ninguna otra fuente identifica la sala del staff.
- **No:** agregar `users.room_id`. Obligaría a poblar la columna a mano y a decidir el caso de admin y de staff con varias salas, sin beneficio para este flujo.
- **Sí:** PARA consume los niños persistidos. Los identificadores de la fixture no existen en la base y romperían las claves foráneas de `post_children`.
- **Sí:** `children.photo_consent` bloquea el envío cuando la publicación lleva fotos. Advertir sin bloquear no protegería nada y sería ambiguo de verificar.
- **Sí:** cualquier tipo de publicación admite fotos. El tipo describe el momento y el diseño ya muestra una Actividad con foto.
- **Sí:** el límite es de cuatro fotos de 5 MB en JPEG, PNG y WebP, validado en cliente y en servidor y respaldado por las restricciones de SPEC 13.
- **Sí:** la descripción inicia vacía. Publicar de verdad con el texto de demostración de SPEC 06 llenaría la base de contenido de ejemplo.
- **Sí:** encabezado y audiencia se derivan en cada lectura desde `post_children` y `rooms`. Persistirlos como texto los dejaría desincronizados si un niño cambia de nombre.
- **Sí:** el feed muestra las publicaciones de toda la guardería y no solo las del día ni solo las propias. `PUBLICADO HOY` es una etiqueta de diseño, no un filtro.
- **No:** paginación incremental, filtros ni búsqueda. El límite fijo de 50 cubre la demostración.
- **No:** vista a pantalla completa de las fotos. Necesita su propio componente y su propio conjunto de criterios.
- **No:** editar, eliminar, reaccionar ni comentar. Cada capacidad exige reglas de autoría o tablas que todavía no existen.
- **No:** nuevas dependencias ni runner automatizado. La validación combina navegador, lint, TypeScript y build, igual que las specs anteriores.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una subida parcial deja objetos en el bucket sin fila en `post_photos`. | Reservar el UUID de la publicación antes de subir, escribir las tres tablas en una sola operación y eliminar los objetos subidos cuando esa operación falle. |
| Cuatro archivos de 5 MB pueden superar el límite de cuerpo de una Server Action. | Verificar el límite efectivo durante la implementación y devolver un error general legible en lugar de un fallo sin mensaje. |
| Las URL firmadas caducan y podrían quedar cacheadas en una respuesta estática. | Generarlas por petición en un contexto dinámico y comprobar que la página del feed no se sirve desde caché estática. |
| Derivar encabezado y audiencia en cada lectura añade consultas al feed. | Resolver niños, sala, autor y fotos en una sola consulta anidada y mantener el límite de 50 publicaciones. |
| El consentimiento fotográfico validado solo en cliente sería fácil de evitar. | Repetir la comprobación en la Server Action contra `public.children` y probar el caso enviando la acción sin pasar por la interfaz. |
| Cambiar la fuente de PARA puede romper los criterios visuales verificados en SPEC 06. | Conservar el diseño de los chips y verificar de nuevo la selección múltiple, Toda la sala y los estados `aria-pressed`. |
| El bloqueo del envío pendiente puede dejar el modal atascado si la acción nunca responde. | Restablecer el estado pendiente en el caso de error y verificar el comportamiento con un fallo inducido. |

## Qué **no** incluye esta spec

- Edición, archivado o eliminación de publicaciones.
- Reacciones y comentarios funcionales.
- Vista de foto a pantalla completa o galería navegable.
- Feed del rol `parent` y su filtrado.
- Notificaciones a las familias.
- Paginación incremental, filtros o búsqueda de publicaciones.
- Procesamiento de imágenes o registro de dimensiones.
- Borradores persistentes entre sesiones.
- Publicación desde rutas de niños.
- Asignación de sala al staff o cambio de la sala mostrada en la cabecera.
- Pruebas automatizadas o dependencias nuevas.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
