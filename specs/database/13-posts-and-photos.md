# SPEC 13 — Publicaciones, etiquetado y fotos

> **Estado:** Implementado
> **Depende de:** SPEC 08, SPEC 09
> **Fecha:** 2026-09-10
> **Objetivo:** Crear `public.posts`, `public.post_children`, `public.post_photos` y un bucket privado de fotos con integridad multi-tenant y acceso RLS de lectura y alta para staff y admin activos.

## Por qué existe esta spec

SPEC 06 dejó el modal Nueva publicación validado pero sin persistencia, sin fotografías y sin contrato de backend. SPEC 09 y SPEC 11 establecieron el patrón multi-tenant que deben seguir las tablas nuevas. Esta spec aporta las estructuras y el almacenamiento que la aplicación necesita antes de publicar entradas reales, sin tocar todavía el código de Next.js.

## Alcance

**Incluye:**

- Crear `public.posts`, `public.post_children` y `public.post_photos` en el proyecto Supabase conectado.
- Aplicar el cambio mediante una única migración remota llamada `create_posts_and_photos` con `supabase_apply_migration`.
- Crear el enum `post_type` con `meal`, `nap`, `activity`, `achievement`, `mood`, `photo` y `announcement`.
- Conservar los campos de `posts`, `post_children` y `post_photos` definidos por el esquema de referencia, salvo las diferencias documentadas en Decisiones.
- Añadir `posts.daycare_id`, `post_children.daycare_id` y `post_photos.daycare_id` para expresar directamente el tenant de cada fila.
- Impedir mediante claves foráneas compuestas que una publicación apunte a un autor, una sala, un niño o una foto de otra guardería.
- Permitir `posts.room_id` nulo para publicaciones dirigidas a niños etiquetados.
- Exigir que una publicación tenga sala o al menos un niño etiquetado, nunca ambos y nunca ninguno.
- Limitar `posts.title` a 120 caracteres y `posts.body` a 2000 caracteres después de retirar espacios exteriores.
- Guardar en `post_photos` la ruta del objeto en Storage, no una URL pública.
- Limitar cada publicación a cuatro fotos mediante `position` entre 1 y 4 y unicidad por publicación.
- Restringir `post_photos.content_type` a `image/jpeg`, `image/png` y `image/webp`.
- Restringir `post_photos.size_bytes` a un máximo de 5.242.880 bytes.
- Crear el bucket privado `post-photos` con límite de tamaño y tipos MIME permitidos equivalentes.
- Definir la convención de ruta `{daycare_id}/{post_id}/{uuid}.{ext}` para los objetos del bucket.
- Activar RLS desde la creación de las tres tablas.
- Permitir que perfiles activos con rol `staff` o `admin` lean las publicaciones, el etiquetado y las fotos de su propia guardería.
- Permitir que perfiles activos con rol `staff` o `admin` creen publicaciones, etiquetado y fotos únicamente en su propia guardería.
- Exigir que `posts.author_id` sea igual a `auth.uid()` al insertar.
- Permitir que el autor lea, suba y elimine objetos del bucket únicamente bajo el prefijo de su guardería.
- Mantener bloqueadas para la aplicación las operaciones de actualizar y eliminar publicaciones, etiquetado y fotos.
- Mantener bloqueado todo acceso para `anon` y para perfiles `parent`, `pending` o pertenecientes a otra guardería.
- Conceder explícitamente los privilegios mínimos de Data API a `authenticated`.
- Mantener `posts.updated_at` automáticamente mediante un trigger en `private`.
- Crear índices para las claves foráneas y para la consulta del feed por guardería y fecha de publicación descendente.
- Verificar estructura, restricciones, índices, trigger, RLS, privilegios, bucket e historial después de la migración.
- Ejecutar los asesores de seguridad y rendimiento de Supabase después de migrar.

**Fuera de alcance (para specs futuras):**

- Integrar estas tablas con Next.js, con el feed o con el modal Nueva publicación.
- Insertar publicaciones, etiquetado o fotos iniciales.
- Crear `reactions`, `comments`, `daily_summaries` u otras tablas del esquema de referencia.
- Dar acceso de lectura al rol `parent` sobre publicaciones, etiquetado o fotos.
- Editar, archivar o eliminar publicaciones desde la aplicación.
- Redimensionar, comprimir, transformar o analizar imágenes.
- Generar miniaturas o registrar `width` y `height` automáticamente en el servidor de base de datos.
- Emitir URLs firmadas desde PostgreSQL.
- Notificar a padres cuando se publica una entrada.
- Inicializar un proyecto local de Supabase o crear archivos bajo `supabase/`.
- Generar tipos TypeScript o modificar clientes Supabase.
- Crear una migración de reversión.

## Modelo de datos

### `post_type`

Enum con exactamente siete valores en este orden: `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`. Los siete corresponden a los chips aprobados en SPEC 06: Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio.

### `public.posts`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | `NOT NULL`, FK a `public.daycares(id)` con `ON DELETE CASCADE` |
| `author_id` | `uuid` | `NOT NULL`, FK compuesta `(author_id, daycare_id)` a `public.users(id, daycare_id)` |
| `room_id` | `uuid` | Nullable, FK compuesta `(room_id, daycare_id)` a `public.rooms(id, daycare_id)` |
| `type` | `post_type` | `NOT NULL` |
| `title` | `text` | Nullable |
| `body` | `text` | `NOT NULL` |
| `published_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

Restricciones e índices:

- `posts_body_length`: exige entre 1 y 2000 caracteres después de aplicar `btrim()`.
- `posts_title_length`: exige `title IS NULL` o entre 1 y 120 caracteres después de aplicar `btrim()`.
- `posts_id_daycare_id_key`: `UNIQUE (id, daycare_id)` para soportar las relaciones compuestas desde `post_children` y `post_photos`.
- `posts_daycare_published_at_idx`: índice sobre `(daycare_id, published_at DESC, id DESC)` para el feed.
- `posts_author_idx`: índice sobre `(author_id)`.
- `posts_room_idx`: índice parcial sobre `(room_id)` para filas con sala.
- Trigger `private.set_updated_at()` sobre `UPDATE`, siguiendo el patrón de `public.children`.

La exclusividad entre audiencia de sala y audiencia de niños no puede expresarse con un `CHECK` porque depende de `post_children`. Se garantiza con un trigger `AFTER INSERT` diferible descrito en Operaciones.

### `public.post_children`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `post_id` | `uuid` | `NOT NULL`, parte de la PK |
| `child_id` | `uuid` | `NOT NULL`, parte de la PK |
| `daycare_id` | `uuid` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |

Restricciones e índices:

- PK compuesta `(post_id, child_id)`.
- FK compuesta `(post_id, daycare_id)` a `public.posts(id, daycare_id)` con `ON DELETE CASCADE`.
- FK compuesta `(child_id, daycare_id)` a `public.children(id, daycare_id)` con `ON DELETE CASCADE`.
- `post_children_child_idx`: índice sobre `(child_id, daycare_id)` para el futuro feed del padre.

### `public.post_photos`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `post_id` | `uuid` | `NOT NULL` |
| `daycare_id` | `uuid` | `NOT NULL` |
| `storage_path` | `text` | `NOT NULL`, `UNIQUE` |
| `content_type` | `text` | `NOT NULL` |
| `size_bytes` | `integer` | `NOT NULL` |
| `width` | `integer` | Nullable |
| `height` | `integer` | Nullable |
| `position` | `smallint` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |

Restricciones e índices:

- FK compuesta `(post_id, daycare_id)` a `public.posts(id, daycare_id)` con `ON DELETE CASCADE`.
- `post_photos_position_range`: exige `position` entre 1 y 4.
- `post_photos_post_position_key`: `UNIQUE (post_id, position)`, que limita cada publicación a cuatro fotos.
- `post_photos_content_type_allowed`: exige `image/jpeg`, `image/png` o `image/webp`.
- `post_photos_size_range`: exige `size_bytes` entre 1 y 5.242.880.
- `post_photos_dimensions_positive`: exige que `width` y `height` sean nulos o mayores que cero.
- `post_photos_storage_path_shape`: exige que la ruta comience por `{daycare_id}/{post_id}/`.
- `post_photos_post_idx`: índice sobre `(post_id, position)`.

### Bucket `post-photos`

- Bucket privado, sin lectura pública.
- `file_size_limit` de 5.242.880 bytes.
- `allowed_mime_types` con `image/jpeg`, `image/png` y `image/webp`.
- Convención de ruta `{daycare_id}/{post_id}/{uuid}.{ext}`, donde el primer segmento identifica el tenant.

### Operaciones

`private.enforce_post_audience()` es un trigger `CONSTRAINT` diferido al final de la transacción sobre `public.posts` y `public.post_children`. Verifica que cada publicación cumple exactamente una de estas dos formas:

- `room_id IS NOT NULL` y ninguna fila en `post_children`.
- `room_id IS NULL` y al menos una fila en `post_children`.

Al diferir la comprobación, la Server Action puede insertar la publicación y su etiquetado dentro de la misma transacción sin orden artificial. Cualquier violación aborta la transacción completa.

### RLS y privilegios

`public.posts`:

- `posts_select_own_managed_daycare` permite `SELECT` a staff y admin activos cuando `daycare_id` coincide con su perfil.
- `posts_insert_own_managed_daycare` permite `INSERT` a staff y admin activos cuando `daycare_id` coincide con su perfil y `author_id = (select auth.uid())`.
- `authenticated` recibe únicamente `SELECT` e `INSERT`.
- `anon` no recibe privilegios ni políticas.

`public.post_children` y `public.post_photos`:

- Políticas equivalentes de `SELECT` e `INSERT` para staff y admin activos del mismo tenant, que además comprueban que la publicación referida pertenece a esa guardería.
- `authenticated` recibe únicamente `SELECT` e `INSERT`.
- `anon` no recibe privilegios ni políticas.

`storage.objects` para el bucket `post-photos`:

- `post_photos_objects_select_own_daycare` permite `SELECT` a staff y admin activos cuando el primer segmento de `name` es el `daycare_id` de su perfil.
- `post_photos_objects_insert_own_daycare` permite `INSERT` con la misma condición y con `owner = (select auth.uid())`.
- `post_photos_objects_delete_own_uploads` permite `DELETE` únicamente al propietario del objeto dentro del prefijo de su guardería, para limpiar objetos huérfanos cuando falle una publicación.
- No se concede `UPDATE`.
- `anon` no recibe políticas sobre este bucket.

Las políticas reproducen el predicado ya usado por `children_select_own_managed_daycare`: existencia de una fila en `public.users` con `id = (select auth.uid())`, `status = 'active'` y `role` en `staff` o `admin`.

## Artefactos

**Objetos remotos nuevos:**

- Enum `post_type`.
- `public.posts`, `public.post_children` y `public.post_photos` con sus restricciones, índices, políticas y privilegios.
- `private.enforce_post_audience()` y sus dos triggers de restricción diferida.
- Trigger de `updated_at` sobre `public.posts`.
- Bucket `post-photos` y sus políticas sobre `storage.objects`.

**Objetos remotos modificados:**

- Ninguno. Las tablas existentes ya exponen las claves únicas compuestas necesarias.

**Archivos locales posteriores a la migración:**

- `types/database.ts`, regenerado desde el esquema desplegado como parte de SPEC 14.

## Plan de implementación

1. Volver a inspeccionar tablas, restricciones, índices, enums, funciones, triggers, políticas, privilegios, buckets e historial remoto inmediatamente antes de migrar.
2. Preparar una única migración `create_posts_and_photos` con el enum, las tres tablas, las restricciones tenant-aware, los índices y los privilegios mínimos.
3. Añadir el trigger de `updated_at` y el trigger de restricción diferida que valida la audiencia.
4. Crear el bucket privado `post-photos` con su límite de tamaño y sus tipos MIME permitidos.
5. Crear las políticas de las tres tablas y las políticas de `storage.objects` acotadas al prefijo de guardería.
6. Aplicar la migración mediante `supabase_apply_migration` y no mediante DDL en `supabase_execute_sql`.
7. Verificar en los catálogos de PostgreSQL columnas, tipos, defaults, restricciones, acciones de borrado, índices, funciones, triggers, RLS y grants.
8. Probar en transacciones revertidas el alta de una publicación de sala, una publicación con varios niños y una publicación con cuatro fotos.
9. Probar que se rechazan una publicación sin sala y sin niños, una publicación con sala y niños a la vez, una quinta foto y un `content_type` no permitido.
10. Probar el aislamiento de tenant en las tres tablas y el rechazo de `author_id` distinto de `auth.uid()`.
11. Probar que `anon`, un perfil `parent` y un perfil de otra guardería no leen ni escriben nada, y que `authenticated` no puede actualizar ni eliminar filas.
12. Probar sobre `storage.objects` que un staff sube y lee dentro de su prefijo, elimina solo sus objetos y no accede al prefijo de otra guardería.
13. Ejecutar los asesores de seguridad y rendimiento y resolver cualquier aviso atribuible a esta migración.

## Criterios de aceptación

- [ ] La migración remota se llama `create_posts_and_photos` y aparece una sola vez en el historial.
- [ ] El enum `post_type` contiene exactamente `meal`, `nap`, `activity`, `achievement`, `mood`, `photo` y `announcement`.
- [ ] `public.posts`, `public.post_children` y `public.post_photos` existen con las columnas, tipos y valores predeterminados de esta spec.
- [ ] Las tres tablas tienen RLS habilitado.
- [ ] `posts.author_id` y `posts.room_id` usan claves foráneas compuestas que incluyen `daycare_id`.
- [ ] Etiquetar un niño de otra guardería falla por clave foránea.
- [ ] Publicar en una sala de otra guardería falla por clave foránea.
- [ ] Una publicación sin sala y sin niños etiquetados aborta la transacción.
- [ ] Una publicación con sala y con niños etiquetados a la vez aborta la transacción.
- [ ] Una publicación con sala y sin niños se confirma correctamente.
- [ ] Una publicación sin sala y con tres niños se confirma correctamente.
- [ ] `posts.body` vacío o compuesto solo por espacios se rechaza.
- [ ] `posts.body` con más de 2000 caracteres se rechaza.
- [ ] Insertar una quinta foto en la misma publicación se rechaza.
- [ ] Insertar dos fotos con la misma `position` en la misma publicación se rechaza.
- [ ] Insertar una foto con `content_type` distinto de los tres permitidos se rechaza.
- [ ] Insertar una foto de más de 5.242.880 bytes se rechaza.
- [ ] Insertar una foto cuya `storage_path` no comienza por `{daycare_id}/{post_id}/` se rechaza.
- [ ] Eliminar una publicación elimina en cascada su etiquetado y sus filas de fotos.
- [ ] `posts.updated_at` avanza automáticamente al actualizar una fila.
- [ ] Un staff activo lee únicamente las publicaciones, etiquetado y fotos de su guardería.
- [ ] Un staff activo inserta con `author_id = auth.uid()` y es rechazado con otro `author_id`.
- [ ] Un perfil `parent`, uno `pending` y uno de otra guardería no leen ni insertan en ninguna de las tres tablas.
- [ ] `anon` no tiene privilegios ni políticas sobre ninguna de las tres tablas.
- [ ] `authenticated` no tiene `UPDATE` ni `DELETE` sobre ninguna de las tres tablas.
- [ ] El bucket `post-photos` existe, es privado, limita a 5.242.880 bytes y admite solo los tres tipos MIME.
- [ ] Un staff activo sube un objeto bajo el prefijo de su guardería y lo lee.
- [ ] Un staff activo no sube ni lee objetos bajo el prefijo de otra guardería.
- [ ] Un staff activo elimina un objeto propio y no elimina el de otro usuario.
- [ ] `anon` no lee objetos del bucket sin una URL firmada.
- [ ] Existen índices para todas las columnas de clave foránea y para `(daycare_id, published_at DESC, id DESC)`.
- [ ] Los asesores de seguridad y rendimiento no reportan avisos nuevos atribuibles a esta migración.

## Decisiones

- **Sí:** SPEC 13 depende de SPEC 08 y SPEC 09. Reutiliza los enums, el perfil de usuario, las salas y los niños ya desplegados.
- **Sí:** se agrega `mood` al enum `post_type`. El esquema de referencia lista seis valores, pero el modal aprobado en SPEC 06 ofrece siete tipos e incluye Ánimo. La UI verificada manda sobre el documento de diseño.
- **Sí:** las tres tablas llevan `daycare_id` propio y claves foráneas compuestas. Es el mismo patrón multi-tenant de `children`, `parent_children` e `invitations`.
- **Sí:** la audiencia se modela con `room_id` nulo o presente más filas en `post_children`. Coincide con el driver del feed del padre descrito en el esquema de referencia.
- **No:** expandir Toda la sala a una fila por niño. Congelaría la audiencia en el momento de publicar y dejaría fuera a los niños que ingresen después.
- **Sí:** la exclusividad entre sala y niños se valida con un trigger de restricción diferida. Un `CHECK` no puede consultar otra tabla y validar solo en la aplicación dejaría la base sin garantía.
- **Sí:** `post_photos` guarda `storage_path` en lugar del campo `url` del esquema de referencia. El bucket es privado y las URLs firmadas caducan, así que persistir una URL sería incorrecto.
- **Sí:** el bucket es privado con políticas por prefijo de guardería. Son fotos de menores y una URL pública permanente no admite control de tenant.
- **Sí:** el límite de cuatro fotos se aplica en la base mediante `position` y unicidad, no solo en la aplicación.
- **Sí:** el autor puede eliminar sus propios objetos del bucket para limpiar subidas huérfanas cuando la publicación falla.
- **No:** conceder `UPDATE` o `DELETE` sobre las tres tablas. Editar y eliminar publicaciones necesita su propia spec con reglas de autoría y limpieza del bucket.
- **No:** dar acceso al rol `parent` en esta spec. El feed del padre es una spec propia con su pantalla y su filtrado.
- **No:** crear `reactions` y `comments` todavía. Serían DDL sin interfaz que los use.
- **No:** generar miniaturas, medir dimensiones o transformar imágenes en la base de datos. `width` y `height` quedan nullables para una spec posterior.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El trigger diferido puede rechazar altas legítimas si la Server Action inserta fuera de una transacción única. | Documentar en SPEC 14 que publicación, etiquetado y fotos viajan en una sola operación y probar el caso antes de cerrar la migración. |
| Las políticas de `storage.objects` son globales a la tabla y podrían afectar a otros buckets futuros. | Acotar cada política con `bucket_id = 'post-photos'` y verificar que ningún otro bucket queda alcanzado. |
| Un objeto subido cuya fila de `post_photos` nunca se inserta queda huérfano en el bucket. | Permitir al autor eliminar sus objetos y exigir en SPEC 14 la limpieza explícita cuando la transacción falle. |
| El límite de tamaño del bucket y el `CHECK` de `size_bytes` pueden divergir. | Fijar el mismo valor en ambos y verificarlo después de migrar. |
| Un `daycare_id` incoherente entre la ruta del objeto y la fila permitiría cruzar tenants al firmar URLs. | Exigir el prefijo mediante `post_photos_storage_path_shape` y validar el prefijo también en las políticas de Storage. |

## Qué **no** incluye esta spec

- Cambios en la aplicación Next.js, el feed o el modal Nueva publicación.
- Datos iniciales de publicaciones, etiquetado o fotos.
- Reacciones, comentarios y resúmenes diarios.
- Acceso de lectura para el rol `parent`.
- Edición, archivado o eliminación de publicaciones.
- Procesamiento, redimensionado o análisis de imágenes.
- Emisión de URLs firmadas desde PostgreSQL.
- Notificaciones a las familias.
- Generación de tipos TypeScript o una migración de reversión.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
