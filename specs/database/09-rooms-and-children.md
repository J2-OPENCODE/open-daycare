# SPEC 09 — Salas y niños persistentes

> **Estado:** Implementado
> **Depende de:** SPEC 07, SPEC 08
> **Fecha:** 2026-09-08
> **Objetivo:** Crear `public.rooms` y `public.children` con datos iniciales de salas, integridad multi-tenant y acceso RLS de lectura y alta para staff y admin activos.

## Por qué existe esta spec

Las guarderías y los perfiles de usuario ya existen, pero el proyecto todavía no puede representar salas ni niños persistentes. La aplicación necesita estas estructuras antes de sustituir las fixtures de `/kids`, poblar el selector del modal y guardar nuevos niños sin romper el aislamiento entre guarderías.

## Alcance

**Incluye:**

- Crear `public.rooms` y `public.children` en el proyecto Supabase conectado.
- Aplicar el cambio mediante una única migración remota llamada `create_rooms_and_children` con `supabase_apply_migration`.
- Conservar los campos de `rooms` y `children` definidos por el esquema de referencia.
- Añadir `rooms.position` para persistir un orden explícito dentro de cada guardería.
- Añadir `children.daycare_id` para expresar directamente el tenant del niño.
- Añadir `children.slug` para resolver perfiles mediante `/kids/[slug]` sin exponer el UUID como ruta pública.
- Impedir mediante una clave foránea compuesta que un niño apunte a una sala de otra guardería.
- Exigir UUID, fechas, estados y valores predeterminados consistentes con las convenciones existentes.
- Limitar el nombre completo a 120 caracteres y las notas médicas a 2000 caracteres después de retirar espacios exteriores.
- Restringir `allergy_tags` a `peanut`, `lactose` y `gluten`.
- Activar RLS desde la creación de ambas tablas.
- Permitir que perfiles activos con rol `staff` o `admin` lean las salas y los niños de su propia guardería.
- Permitir que perfiles activos con rol `staff` o `admin` creen niños únicamente en su propia guardería.
- Mantener bloqueadas para la aplicación las operaciones de crear salas, actualizar niños y eliminar salas o niños.
- Mantener bloqueado todo acceso para `anon` y para perfiles `parent`, `pending` o pertenecientes a otra guardería.
- Conceder explícitamente los privilegios mínimos de Data API a `authenticated`.
- Crear exactamente Soles, Lunas y Estrellas para la guardería cuyo nombre exacto es `Sala Soles`.
- Persistir las posiciones 1, 2 y 3 para Soles, Lunas y Estrellas respectivamente.
- Resolver el UUID de la guardería mediante consulta y fallar si no existe exactamente una coincidencia.
- Dejar `public.children` sin filas iniciales.
- Mantener `children.updated_at` automáticamente mediante un trigger en `private`.
- Verificar estructura, restricciones, índices, trigger, RLS, privilegios, datos e historial después de la migración.
- Ejecutar los asesores de seguridad y rendimiento de Supabase después de migrar.

**Fuera de alcance (para specs futuras):**

- Integrar estas tablas con Next.js o modificar `/kids`.
- Insertar los ocho niños de `data/kids.ts` o cualquier otro niño inicial.
- Crear `parent_children`, `invitations`, publicaciones, resúmenes diarios u otras tablas del esquema de referencia.
- Persistir padres, invitaciones o fotografías.
- Crear, editar, reordenar o eliminar salas desde la aplicación.
- Actualizar, archivar, restaurar o eliminar niños desde la aplicación.
- Permitir acceso de padres a niños vinculados antes de que exista `parent_children`.
- Generar automáticamente el slug dentro de PostgreSQL.
- Normalizar alergias desde etiquetas españolas dentro de PostgreSQL.
- Inicializar un proyecto local de Supabase o crear archivos bajo `supabase/`.
- Generar tipos TypeScript o modificar clientes Supabase.
- Crear una migración de reversión.

## Modelo de datos

### `public.rooms`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | `NOT NULL`, FK a `public.daycares(id)` con `ON DELETE CASCADE` |
| `name` | `text` | `NOT NULL` |
| `position` | `smallint` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |

La tabla incorpora estas restricciones:

- `rooms_name_not_blank`: exige entre 1 y 120 caracteres después de aplicar `btrim()`.
- `rooms_position_positive`: exige `position > 0`.
- `rooms_daycare_name_key`: `UNIQUE (daycare_id, name)`.
- `rooms_daycare_position_key`: `UNIQUE (daycare_id, position)`.
- `rooms_id_daycare_id_key`: `UNIQUE (id, daycare_id)` para soportar la relación compuesta desde `children`.

Los índices únicos que comienzan por `daycare_id` cubren las consultas tenant-aware y evitan un índice simple redundante para esa columna.

### `public.children`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | `NOT NULL`, FK a `public.daycares(id)` con `ON DELETE CASCADE` |
| `room_id` | `uuid` | `NOT NULL`, parte de la FK compuesta a `public.rooms` |
| `slug` | `text` | `NOT NULL` |
| `full_name` | `text` | `NOT NULL` |
| `birth_date` | `date` | `NOT NULL` |
| `enrolled_at` | `date` | `NOT NULL` |
| `medical_notes` | `text` | Nullable, default `NULL` |
| `allergy_tags` | `text[]` | `NOT NULL`, default `'{}'::text[]` |
| `photo_consent` | `boolean` | `NOT NULL`, default `true` |
| `status` | `public.child_status` | `NOT NULL`, default `active` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

La tabla incorpora estas restricciones:

- `children_room_daycare_fkey`: `FOREIGN KEY (room_id, daycare_id) REFERENCES public.rooms(id, daycare_id) ON DELETE CASCADE`.
- `children_daycare_slug_key`: `UNIQUE (daycare_id, slug)`.
- `children_slug_format`: exige entre 1 y 120 caracteres y el patrón ASCII kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `children_full_name_length`: exige entre 1 y 120 caracteres después de aplicar `btrim()`.
- `children_birth_before_enrollment`: exige `birth_date <= enrolled_at`.
- `children_medical_notes_length`: permite `NULL` o exige entre 1 y 2000 caracteres después de aplicar `btrim()`.
- `children_allergy_tags_allowed`: exige que el array sea un subconjunto de `{peanut,lactose,gluten}` y que no contenga valores nulos.

`children_daycare_slug_key` cubre la búsqueda de detalle por guardería y slug. `children_daycare_status_name_idx` indexa `(daycare_id, status, full_name)` para el listado de niños activos ordenado por nombre. `children_room_daycare_idx` indexa `(room_id, daycare_id)` para la clave foránea compuesta y las agrupaciones por sala.

### Auditoría

`private.set_children_updated_at()` asigna `now()` a `NEW.updated_at` antes de cada actualización de `public.children`. La función usa `SECURITY INVOKER`, fija un `search_path` vacío, no queda expuesta por Data API y no admite ejecución directa por `PUBLIC`, `anon` ni `authenticated`.

Aunque esta spec no concede `UPDATE` a la aplicación, el trigger mantiene correcta la auditoría para futuras operaciones administrativas o migraciones.

### Datos iniciales

La migración resuelve dinámicamente la única fila de `public.daycares` cuyo nombre exacto es `Sala Soles` y crea estas salas:

| `name` | `position` | Etiqueta futura de UI |
| --- | --- | --- |
| `Soles` | `1` | `Sala Soles` |
| `Lunas` | `2` | `Sala Lunas` |
| `Estrellas` | `3` | `Sala Estrellas` |

Los UUID se generan mediante los defaults de PostgreSQL y no se escriben manualmente. No se insertan salas para las otras guarderías ni filas en `public.children`.

### RLS y privilegios

`public.rooms` incorpora `rooms_select_own_managed_daycare`, una política `SELECT TO authenticated`. La política exige que exista un perfil en `public.users` cuyo `id` sea `(select auth.uid())`, cuyo estado sea `active`, cuyo rol sea `staff` o `admin` y cuyo `daycare_id` coincida con la sala.

`public.children` incorpora estas políticas:

- `children_select_own_managed_daycare`: aplica la misma pertenencia, estado y rol para `SELECT TO authenticated`.
- `children_insert_own_managed_daycare`: aplica la misma pertenencia, estado y rol en `WITH CHECK` para `INSERT TO authenticated`.

`authenticated` recibe `SELECT` sobre ambas tablas. En `children` recibe `INSERT` únicamente sobre `daycare_id`, `room_id`, `slug`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes` y `allergy_tags`; los demás campos usan defaults protegidos. No recibe `INSERT` sobre `rooms` ni `UPDATE` o `DELETE` sobre ninguna tabla.

`anon` no recibe privilegios. Las políticas especifican `TO authenticated`, envuelven `auth.uid()` en un `SELECT` y se apoyan en índices existentes para evitar evaluaciones innecesarias por fila.

## Artefactos

**Objetos remotos nuevos:**

- Tabla `public.rooms`.
- Tabla `public.children`.
- Restricciones, claves foráneas, índices y políticas descritas en esta spec.
- Función `private.set_children_updated_at()`.
- Trigger `children_set_updated_at`.
- Tres filas iniciales en `public.rooms`.
- Entrada versionada `create_rooms_and_children` en el historial remoto de migraciones.

**Archivos locales de implementación:**

- Ninguno.

No se modifican archivos de `app/`, `components/`, `lib/`, `data/`, `types/`, `utils/`, `package.json` ni `package-lock.json`, y no se crea un directorio `supabase/`.

## Plan de implementación

1. Volver a consultar tablas, restricciones, índices, funciones, políticas, privilegios e historial remoto; detener la implementación ante objetos `rooms` o `children` conflictivos.
2. Confirmar que existen `public.daycares`, `public.users`, `public.child_status` y el esquema `private` con las definiciones esperadas por SPEC 07 y SPEC 08.
3. Confirmar que existe exactamente una guardería cuyo nombre exacto es `Sala Soles` y que el perfil staff activo existente pertenece a ella.
4. Preparar una única migración `create_rooms_and_children` con ambas tablas, restricciones, índices, trigger, RLS, políticas, privilegios y datos iniciales.
5. Resolver dentro de la migración el UUID de `Sala Soles`, fallar ante una cardinalidad distinta de uno e insertar Soles, Lunas y Estrellas sin UUID hardcodeados.
6. Aplicar la migración con `supabase_apply_migration`, sin ejecutar DDL con `supabase_execute_sql` y sin crear archivos locales de migración.
7. Consultar los catálogos de PostgreSQL para verificar columnas, tipos, nulabilidad, defaults, claves, checks, índices, trigger y configuración de RLS.
8. Verificar que `public.rooms` contiene exactamente las tres salas acordadas bajo `Sala Soles`, con posiciones 1, 2 y 3, y que `public.children` permanece vacía.
9. Probar dentro de transacciones revertidas que staff y admin activos pueden leer salas e insertar un niño válido de su guardería.
10. Probar dentro de transacciones revertidas que parent, perfiles pending, usuarios de otro tenant y `anon` no pueden leer ni insertar niños.
11. Probar dentro de transacciones revertidas que una sala de otro tenant, un slug duplicado, una fecha de nacimiento posterior al ingreso, textos demasiado largos o allergy tags desconocidos son rechazados.
12. Confirmar que `authenticated` no puede crear salas, modificar ni eliminar filas, ni escribir campos protegidos de `children`.
13. Confirmar que el historial contiene una sola migración `create_rooms_and_children` después de las migraciones de SPEC 07 y SPEC 08.
14. Ejecutar los asesores de seguridad y rendimiento y resolver cualquier aviso atribuible a esta migración antes de considerar la spec implementada.

Cada prueba que modifique datos debe ejecutarse dentro de una transacción revertida para conservar las tres salas y cero niños al finalizar esta spec.

## Criterios de aceptación

- [ ] La migración remota se llama `create_rooms_and_children` y aparece una sola vez en el historial.
- [ ] `public.rooms` contiene exactamente `id`, `daycare_id`, `name`, `position` y `created_at`.
- [ ] `rooms.id` es una PK UUID con default `gen_random_uuid()`.
- [ ] `rooms.daycare_id` es obligatorio, referencia `public.daycares(id)` y elimina las salas en cascada con la guardería.
- [ ] `rooms.name` exige entre 1 y 120 caracteres no vacíos después de `btrim()`.
- [ ] `rooms.position` es un `smallint` positivo y obligatorio.
- [ ] Una guardería no puede repetir el mismo nombre ni la misma posición de sala.
- [ ] `(rooms.id, rooms.daycare_id)` puede ser referenciado por la FK compuesta de `children`.
- [ ] `public.children` contiene exactamente las trece columnas acordadas.
- [ ] `children.id` es una PK UUID con default `gen_random_uuid()`.
- [ ] `children.daycare_id` es obligatorio y referencia `public.daycares(id)` con `ON DELETE CASCADE`.
- [ ] `children.room_id` y `children.daycare_id` deben coincidir con una misma fila de `rooms`.
- [ ] Una sala de otra guardería no puede asignarse a un niño aunque el solicitante conozca su UUID.
- [ ] `children.slug` usa kebab-case ASCII, admite como máximo 120 caracteres y es único dentro de cada guardería.
- [ ] Dos guarderías distintas pueden usar el mismo slug.
- [ ] `children.full_name` exige entre 1 y 120 caracteres después de `btrim()`.
- [ ] `birth_date` y `enrolled_at` son fechas obligatorias y el nacimiento no puede ser posterior al ingreso.
- [ ] `medical_notes` admite `NULL` y, cuando existe, contiene entre 1 y 2000 caracteres después de `btrim()`.
- [ ] `allergy_tags` usa un array no nulo con default vacío y solo admite `peanut`, `lactose` y `gluten` sin elementos nulos.
- [ ] `photo_consent` es obligatorio y usa `true` por default.
- [ ] `status` usa `public.child_status`, es obligatorio y usa `active` por default.
- [ ] `created_at` y `updated_at` son `timestamptz` obligatorios con default `now()`.
- [ ] Actualizar administrativamente un niño cambia `updated_at` mediante `children_set_updated_at`.
- [ ] Las claves foráneas y los filtros tenant/status usados por las consultas previstas están indexados.
- [ ] RLS está habilitado en `public.rooms` y `public.children`.
- [ ] Staff y admin activos pueden leer únicamente las salas y los niños de su guardería.
- [ ] Staff y admin activos pueden insertar únicamente niños de su guardería.
- [ ] Parent, perfiles pending y usuarios de otro tenant no pueden leer ni insertar salas o niños.
- [ ] `anon` no tiene privilegios sobre `public.rooms` ni `public.children`.
- [ ] `authenticated` no puede insertar salas, actualizar filas ni eliminar filas.
- [ ] `authenticated` no puede proporcionar `id`, `photo_consent`, `status`, `created_at` ni `updated_at` durante un insert mediante Data API.
- [ ] `private.set_children_updated_at()` no usa `SECURITY DEFINER`, fija un `search_path` vacío y no admite ejecución directa por roles públicos.
- [ ] Existen exactamente Soles, Lunas y Estrellas bajo la única guardería `Sala Soles`.
- [ ] Soles, Lunas y Estrellas tienen respectivamente las posiciones 1, 2 y 3.
- [ ] No existen salas iniciales para las otras cuatro guarderías.
- [ ] Ningún UUID del seed está escrito manualmente en la migración.
- [ ] `public.children` contiene cero filas después de completar las verificaciones.
- [ ] Los asesores de seguridad y rendimiento no reportan avisos introducidos por esta migración.
- [ ] No se crea ni modifica ningún archivo de la aplicación ni se inicializa un directorio local `supabase/`.

## Decisiones

- **Sí:** SPEC 09 depende de SPEC 07 y SPEC 08. Las salas necesitan guarderías y las políticas necesitan perfiles, roles, estados y `child_status`.
- **Sí:** conservar `rooms` y `children` como nombres en inglés. `childrens` no es una palabra inglesa válida ni el nombre definido por el esquema de referencia.
- **Sí:** añadir `rooms.position`. El orden Soles, Lunas y Estrellas debe ser explícito y no puede depender de `created_at` ni del orden físico de PostgreSQL.
- **Sí:** añadir `children.daycare_id`. La redundancia controlada permite RLS eficiente, filtros tenant-aware y unicidad de slug por guardería.
- **Sí:** proteger la consistencia redundante con una FK compuesta. No basta con confiar en que la aplicación elija una sala del tenant correcto.
- **Sí:** añadir un slug persistente y único por guardería. La URL solicitada es `/kids/[slug]`, mientras el UUID permanece como identidad interna.
- **No:** hacer el slug único globalmente. Guarderías distintas pueden inscribir niños con el mismo nombre sin coordinar sus URLs.
- **No:** generar slugs en un trigger de PostgreSQL. La aplicación controla normalización, sufijos y mensajes de validación; la base de datos solo impone formato y unicidad.
- **Sí:** permitir nombres duplicados. La colisión se resuelve en el slug con sufijos incrementales sin imponer una identidad falsa sobre `full_name`.
- **Sí:** limitar nombres a 120 caracteres y notas a 2000. La persistencia y las URLs necesitan límites verificables aunque el prototipo anterior no los exigiera.
- **Sí:** mantener `medical_notes` nullable y `allergy_tags` como array vacío por default. `NULL` distingue la ausencia de texto y el array representa correctamente cero o más etiquetas.
- **Sí:** restringir allergy tags al catálogo inicial del esquema: `peanut`, `lactose` y `gluten`.
- **No:** persistir `Maní`, `Lactosa` o `Gluten`. Esas son etiquetas de UI y la convención del proyecto exige códigos en inglés.
- **Sí:** usar `photo_consent=true` y `status=active` como defaults protegidos. El modal de esta primera versión no solicita esos valores.
- **Sí:** crear las tres salas únicamente para la guardería `Sala Soles`. Las otras guarderías todavía no tienen usuarios ni un caso de uso que justifique quince filas.
- **No:** sembrar los ocho niños de demostración. `/kids` comenzará vacío y la persistencia se demostrará mediante el modal.
- **Sí:** staff y admin activos pueden leer y crear. Parent necesita `parent_children` para expresar qué filas puede consultar y queda bloqueado hasta una spec posterior.
- **No:** conceder actualización o eliminación antes de que existan flujos y reglas de negocio para esas operaciones.
- **Sí:** conceder privilegios explícitos de Data API además de RLS. Ambas capas son necesarias y las tablas nuevas ya no deben depender de exposición automática.
- **Sí:** usar políticas directas contra el perfil propio en `public.users`. No se introduce una función `SECURITY DEFINER` para una condición que puede resolverse con el modelo RLS existente.
- **Sí:** aplicar estructura, seguridad y seed en una sola migración para confirmar o revertir el contrato como una unidad.
- **No:** inicializar Supabase local en esta spec. Se conserva el flujo remoto establecido por SPEC 07 y SPEC 08.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `children.daycare_id` duplica información derivable desde `rooms`. | Imponer una FK compuesta y probar explícitamente que una sala de otro tenant es rechazada. |
| Un slug calculado fuera de PostgreSQL puede colisionar por solicitudes concurrentes. | Imponer `UNIQUE (daycare_id, slug)` y exigir que la Server Action de SPEC 10 reintente con sufijos incrementales ante `23505`. |
| Las políticas consultan `public.users`, que también tiene RLS. | Consultar solo el perfil propio indexado por PK y verificar los cuatro roles/estados relevantes en transacciones revertidas. |
| Borrar una sala eliminaría sus niños por cascada. | No conceder `DELETE` a la aplicación y reservar la administración de salas para una spec que incluya confirmaciones y consecuencias explícitas. |
| El seed depende de un nombre de guardería que no es globalmente único por restricción. | Exigir exactamente una coincidencia para `Sala Soles` y abortar la migración ante cero o varias filas. |
| Una migración exclusivamente remota no deja SQL versionado en Git. | Mantener el contrato completo en esta spec y verificar la entrada administrada por Supabase en el historial remoto. |

## Qué **no** incluye esta spec

- Integración de Next.js, Server Actions o cambios en `/kids`.
- Niños iniciales o migración de fixtures.
- Padres, vínculos, invitaciones, fotografías o resúmenes diarios.
- Edición, archivo, restauración o eliminación de niños.
- Administración de salas desde la aplicación.
- Acceso de perfiles parent.
- Generación de slugs o traducción de alergias dentro de PostgreSQL.
- Tipos TypeScript, dependencias nuevas o archivos locales de Supabase.

Cada una de esas capacidades requiere esta spec como base o debe definirse en una spec posterior.
