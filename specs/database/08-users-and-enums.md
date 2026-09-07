# SPEC 08 — Usuarios y enumeraciones de dominio

> **Estado:** Implementado
> **Depende de:** SPEC 07
> **Fecha:** 2026-09-07
> **Objetivo:** Crear las enumeraciones del dominio y `public.users`, proteger el acceso por pertenencia a una guardería y provisionar un perfil staff activo para Juan Collantes.

## Por qué existe esta spec

`public.daycares` ya existe como entidad raíz, pero la aplicación todavía no puede representar qué usuario autenticado pertenece a cada guardería. Esta spec introduce el perfil de dominio vinculado a Supabase Auth y establece la primera política multi-tenant que permite a un usuario activo acceder únicamente a su propio perfil y guardería.

## Alcance

**Incluye:**

- Crear las seis enumeraciones de dominio `user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type` y `child_status` en `public`.
- Añadir `mood` a `post_type` para alinear la persistencia futura con el tipo Ánimo que ya existe en la UI.
- Crear `public.users` como tabla de perfiles de aplicación vinculada uno a uno con `auth.users`.
- Exigir que cada perfil pertenezca a una guardería y permitir que una guardería tenga varios usuarios.
- Eliminar el perfil automáticamente cuando desaparezca su cuenta de Auth.
- Eliminar los perfiles de dominio de una guardería cuando la guardería se elimine, sin eliminar sus cuentas de Auth.
- Indexar `users.daycare_id` para las consultas y operaciones de la clave foránea.
- Exigir un nombre completo no vacío y mantener valores predeterminados para estado, preferencias y fechas.
- Mantener `users.updated_at` automáticamente mediante un trigger.
- Crear un trigger `AFTER INSERT` sobre `auth.users` para provisionar futuros perfiles.
- Leer `role` y `daycare_id` únicamente desde `raw_app_meta_data` administrada por un entorno confiable.
- Leer `full_name` desde `raw_user_meta_data` y rechazar el alta si falta o está vacío.
- Crear el esquema no expuesto `private` para alojar las funciones de trigger.
- Fijar un `search_path` vacío en la función `SECURITY DEFINER` y revocar su ejecución directa a roles públicos.
- Activar RLS en `public.users` desde su creación.
- Permitir que un usuario autenticado con estado `active` lea su propio perfil.
- Permitir que un usuario autenticado con estado `active` actualice únicamente su nombre, avatar y preferencias.
- Impedir que un usuario cambie mediante Data API su identidad, guardería, rol, estado o fechas.
- Permitir que un usuario autenticado con estado `active` lea únicamente la guardería vinculada a su perfil.
- Mantener bloqueado todo acceso para `anon`.
- Crear el perfil `Juan Collantes` con rol `staff`, estado `active` y pertenencia a `Sala Soles` para la cuenta Auth confirmada `juan@collantes.ec`.
- Resolver por consulta los UUID de la cuenta Auth y de `Sala Soles`, sin escribir identificadores generados en la migración.
- Aplicar todo el cambio mediante una única migración remota llamada `create_users_and_enums` con `supabase_apply_migration`.
- Verificar estructura, restricciones, índices, funciones, triggers, RLS, privilegios, datos e historial después de aplicar la migración.
- Ejecutar los asesores de seguridad y rendimiento de Supabase después de la migración.

**Fuera de alcance (para specs futuras):**

- Crear tablas distintas de `public.users` o `public.daycares` que consuman las enumeraciones nuevas.
- Crear `rooms`, `children`, `parent_children`, `invitations`, `posts` o cualquier otra tabla del esquema de referencia.
- Hacer funcionales `/login` o `/activate-account`.
- Instalar clientes de Supabase, implementar sesiones, proteger rutas o conectar Next.js con la base de datos.
- Crear flujos de invitación, alta pública, activación, recuperación de contraseña o administración de usuarios.
- Permitir que staff o admin consulten perfiles de otros usuarios de su guardería.
- Permitir que un perfil `pending` lea o modifique datos mediante Data API.
- Sincronizar `role` o `daycare_id` con JWT, custom claims o `raw_user_meta_data`.
- Eliminar una cuenta de Auth cuando se elimine su guardería o su perfil público.
- Añadir valores futuros a las enumeraciones fuera del conjunto acordado.
- Generar tipos TypeScript o crear archivos locales de Supabase.
- Crear una migración de reversión.

## Modelo de datos

### Enumeraciones

| Enum | Valores en orden |
| --- | --- |
| `public.user_role` | `staff`, `parent`, `admin` |
| `public.user_status` | `pending`, `active` |
| `public.relationship_type` | `father`, `mother`, `guardian` |
| `public.invitation_status` | `pending`, `accepted`, `expired`, `cancelled` |
| `public.post_type` | `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement` |
| `public.child_status` | `active`, `archived` |

Los valores persistidos permanecen en inglés. `mood` es una ampliación deliberada del esquema de referencia para representar el tipo Ánimo ya implementado en la UI.

### `public.users`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, FK a `auth.users(id)` con `ON DELETE CASCADE` |
| `daycare_id` | `uuid` | `NOT NULL`, FK a `public.daycares(id)` con `ON DELETE CASCADE` |
| `role` | `public.user_role` | `NOT NULL`, sin default |
| `status` | `public.user_status` | `NOT NULL`, default `active` |
| `full_name` | `text` | `NOT NULL` |
| `avatar_url` | `text` | Nullable, default `NULL` |
| `notify_on_post` | `boolean` | `NOT NULL`, default `true` |
| `daily_summary_enabled` | `boolean` | `NOT NULL`, default `true` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

La tabla incluye `users_full_name_not_blank`:

```sql
check (btrim(full_name) <> '')
```

`users_daycare_id_idx` indexa `daycare_id`. La clave primaria ya indexa `id` y no se crea un índice redundante.

La tabla no almacena email, contraseña, hash, confirmación ni proveedores. Esos datos permanecen bajo responsabilidad de Supabase Auth.

### Perfil inicial

| Campo | Valor |
| --- | --- |
| Cuenta Auth | Usuario cuyo email normalizado es `juan@collantes.ec` |
| Guardería | Única fila cuyo nombre exacto es `Sala Soles` |
| `role` | `staff` |
| `status` | `active` |
| `full_name` | `Juan Collantes` |
| `avatar_url` | `NULL` |
| Preferencias | Defaults `true` |
| Fechas | Defaults de base de datos |

La cuenta Auth fue creada y confirmada antes de redactar esta spec. La implementación debe volver a comprobarla inmediatamente antes de migrar y fallar si no existe exactamente una coincidencia. También debe fallar si no existe exactamente una guardería llamada `Sala Soles`.

### Aprovisionamiento futuro

`private.handle_new_user()` se ejecuta mediante `on_auth_user_created`, un trigger `AFTER INSERT` sobre `auth.users`.

La función usa:

- `NEW.id` como `public.users.id`.
- `NEW.raw_app_meta_data ->> 'daycare_id'` como UUID de guardería.
- `NEW.raw_app_meta_data ->> 'role'` como `public.user_role`.
- `NEW.raw_user_meta_data ->> 'full_name'` como nombre descriptivo.
- El default `active` para `status`.

La función debe fallar con un error explícito si `daycare_id`, `role` o `full_name` faltan, si sus formatos no son válidos, si el nombre queda vacío después de `btrim()` o si la guardería no existe. `role` y `daycare_id` nunca se leen desde metadata editable por el usuario.

La función se define como `SECURITY DEFINER` con `SET search_path = ''`, usa nombres completamente calificados y vive en `private`. Su privilegio `EXECUTE` se revoca a `PUBLIC`, `anon` y `authenticated`; solo el trigger debe usarla.

`private.set_users_updated_at()` asigna `now()` a `NEW.updated_at` antes de cada actualización de `public.users`. No necesita `SECURITY DEFINER`, no queda expuesta por Data API y tampoco admite ejecución directa por roles públicos.

### RLS y privilegios

`public.users` incorpora estas políticas para `authenticated`:

- `users_select_own_active`: permite `SELECT` cuando `id = auth.uid()` y `status = 'active'`.
- `users_update_own_active`: permite `UPDATE` con la misma identidad y estado tanto en `USING` como en `WITH CHECK`.

`authenticated` recibe `SELECT` sobre `public.users` y `UPDATE` únicamente sobre `full_name`, `avatar_url`, `notify_on_post` y `daily_summary_enabled`. No recibe `INSERT` ni `DELETE` y no puede actualizar `id`, `daycare_id`, `role`, `status`, `created_at` ni `updated_at`.

`public.daycares` incorpora `daycares_select_own_active`, que permite a `authenticated` leer una fila únicamente cuando existe su propio perfil `active` con el mismo `daycare_id`. `authenticated` recibe solo `SELECT` sobre `public.daycares`.

`anon` no recibe privilegios sobre `public.users` ni `public.daycares`. El esquema `private` y sus funciones tampoco se conceden a `anon` ni `authenticated`.

## Artefactos

**Objetos remotos nuevos:**

- Tipos `public.user_role`, `public.user_status`, `public.relationship_type`, `public.invitation_status`, `public.post_type` y `public.child_status`.
- Esquema `private`.
- Tabla `public.users`.
- Restricciones `users_pkey`, `users_id_fkey`, `users_daycare_id_fkey` y `users_full_name_not_blank`.
- Índice `users_daycare_id_idx`.
- Funciones `private.handle_new_user()` y `private.set_users_updated_at()`.
- Triggers `on_auth_user_created` y `users_set_updated_at`.
- Políticas `users_select_own_active`, `users_update_own_active` y `daycares_select_own_active`.
- Perfil staff de Juan Collantes.
- Entrada versionada `create_users_and_enums` en el historial remoto de migraciones.

**Objetos remotos modificados:**

- `public.daycares` recibe una política RLS de lectura y privilegio `SELECT` para `authenticated`.

**Archivos locales de implementación:**

- Ninguno.

No se modifican archivos de `app/`, `components/`, `lib/`, `data/`, `types/`, `package.json` ni `package-lock.json`, y no se crea un directorio `supabase/`.

## Plan de implementación

1. Volver a consultar las tablas, tipos, funciones, triggers, políticas e historial remoto; detener la implementación si alguno de los nombres nuevos ya existe con una definición conflictiva.
2. Confirmar que existe exactamente una cuenta Auth con email normalizado `juan@collantes.ec`, que su correo está confirmado y que existe exactamente una guardería cuyo nombre es `Sala Soles`.
3. Preparar una única migración `create_users_and_enums` que cree los seis enums, el esquema `private`, `public.users`, sus restricciones, el índice, las funciones, los triggers, las políticas y los privilegios acordados.
4. Incluir en la migración un bloque que resuelva dinámicamente los UUID de la cuenta y la guardería, falle ante cero o varias coincidencias e inserte el perfil de Juan con los valores acordados.
5. Aplicar la migración mediante `supabase_apply_migration`, sin ejecutar DDL con `supabase_execute_sql`, sin modificar directamente `auth.users` y sin escribir UUID generados.
6. Consultar los catálogos de PostgreSQL para verificar enums y orden de valores, columnas, tipos, nulabilidad, defaults, restricciones, acciones de borrado, índice, RLS, funciones, configuración de seguridad y triggers.
7. Verificar que el perfil de Juan comparte el UUID de su cuenta Auth, pertenece a `Sala Soles`, tiene rol `staff`, estado `active`, avatar nulo, preferencias activas y fechas generadas.
8. Probar con contexto de `authenticated` que Juan puede leer su perfil y `Sala Soles`, pero no otras guarderías, y que un UUID autenticado distinto no puede leer esos datos.
9. Probar que Juan puede actualizar solo nombre, avatar y preferencias, que `updated_at` cambia automáticamente y que los campos protegidos no pueden modificarse mediante los privilegios de aplicación.
10. Probar dentro de transacciones revertidas que un perfil `pending` queda bloqueado, que eliminar una cuenta Auth elimina su perfil y que eliminar una guardería elimina sus perfiles pero conserva las cuentas Auth.
11. Confirmar que `anon` no tiene privilegios, que `authenticated` no puede ejecutar directamente las funciones privadas y que el historial contiene una única migración `create_users_and_enums`.
12. Ejecutar los asesores de seguridad y rendimiento y resolver cualquier aviso atribuible a esta migración antes de considerar la spec implementada.

La migración debe dejar funcional el acceso mínimo de un usuario activo sin anticipar permisos para consultar a otros miembros, flujos de onboarding ni integración con la aplicación.

## Criterios de aceptación

- [x] La cuenta Auth `juan@collantes.ec` existe una sola vez y tiene el correo confirmado inmediatamente antes de migrar.
- [x] La migración remota se llama `create_users_and_enums` y aparece una sola vez en el historial.
- [x] Existen exactamente los seis enums acordados en `public` con sus valores y orden definidos.
- [x] `public.post_type` incluye `mood` entre `achievement` y `photo`.
- [x] `public.users` contiene exactamente las diez columnas acordadas y no almacena email ni credenciales.
- [x] `users.id` es una PK UUID sin default y referencia `auth.users(id)` con `ON DELETE CASCADE`.
- [x] `users.daycare_id` es obligatorio, referencia `public.daycares(id)` con `ON DELETE CASCADE` y está cubierto por `users_daycare_id_idx`.
- [x] `role` y `status` usan sus enums, son obligatorios y únicamente `status` tiene default `active`.
- [x] `full_name` es obligatorio y `users_full_name_not_blank` rechaza valores vacíos o compuestos solo por espacios.
- [x] `avatar_url` admite `NULL`.
- [x] Las dos preferencias son obligatorias y usan default `true`.
- [x] `created_at` y `updated_at` son `timestamptz`, obligatorios y usan `now()` por default.
- [x] Actualizar una fila cambia `updated_at` automáticamente sin que el cliente pueda escribir esa columna.
- [x] `private.handle_new_user()` es `SECURITY DEFINER`, fija un `search_path` vacío y usa nombres completamente calificados.
- [x] `on_auth_user_created` ejecuta `private.handle_new_user()` después de insertar una fila en `auth.users`.
- [x] El aprovisionamiento futuro obtiene `role` y `daycare_id` de `raw_app_meta_data`, no de `raw_user_meta_data`.
- [x] El aprovisionamiento futuro obtiene `full_name` de `raw_user_meta_data` y rechaza nombres ausentes o vacíos.
- [x] Metadata administrativa ausente, inválida o referida a una guardería inexistente impide crear un perfil incompleto.
- [x] `PUBLIC`, `anon` y `authenticated` no pueden ejecutar directamente las funciones de `private`.
- [x] `public.users` tiene RLS habilitado.
- [x] Juan puede consultar únicamente su perfil mientras su estado es `active`.
- [x] Juan puede consultar `Sala Soles` y no puede consultar las otras cuatro guarderías.
- [x] Un perfil `pending` no puede leer ni actualizar su perfil ni consultar su guardería.
- [x] Un UUID autenticado distinto no puede leer ni actualizar el perfil de Juan ni consultar `Sala Soles` mediante su pertenencia.
- [x] Juan puede actualizar únicamente `full_name`, `avatar_url`, `notify_on_post` y `daily_summary_enabled`.
- [x] Juan no puede modificar mediante Data API `id`, `daycare_id`, `role`, `status`, `created_at` ni `updated_at`.
- [x] `authenticated` no puede insertar ni eliminar filas de `public.users`.
- [x] `anon` no tiene privilegios sobre `public.users` ni `public.daycares`.
- [x] El perfil inicial comparte el UUID de la cuenta Auth `juan@collantes.ec` sin que ese UUID esté escrito en la migración.
- [x] El perfil inicial pertenece a la única guardería llamada `Sala Soles` sin que su UUID esté escrito en la migración.
- [x] El perfil inicial contiene `Juan Collantes`, `staff`, `active`, avatar nulo y ambas preferencias activas.
- [x] Eliminar una cuenta Auth elimina su perfil público dentro de una prueba revertida.
- [x] Eliminar una guardería elimina sus perfiles públicos, pero conserva sus cuentas Auth, dentro de una prueba revertida.
- [x] Los asesores de seguridad y rendimiento no reportan avisos introducidos por esta migración.
- [x] No se crea ni modifica ningún archivo de aplicación ni se inicializa un directorio local `supabase/`.

## Decisiones

- **Sí:** SPEC 08 depende de SPEC 07 porque `users.daycare_id` referencia la tabla raíz ya implementada.
- **Sí:** crear ahora las seis enumeraciones del esquema de referencia, aunque cuatro todavía no tengan tablas consumidoras.
- **Sí:** añadir `mood` a `post_type`. La UI implementada ya representa Ánimo y no debe persistirlo como texto fuera del enum futuro.
- **Sí:** cada perfil debe pertenecer exactamente a una guardería. `daycare_id` no admite nulos y modela una relación de una guardería a muchos usuarios.
- **Sí:** `id` comparte el UUID con Supabase Auth. No se introduce un segundo identificador ni se duplican email o credenciales.
- **Sí:** borrar una cuenta Auth elimina su perfil público para evitar datos de dominio huérfanos.
- **Sí:** borrar una guardería elimina en cascada sus perfiles públicos por decisión explícita.
- **No:** borrar también las cuentas Auth en esa cascada. PostgreSQL no debe modificar tablas administradas por Supabase Auth desde esta relación.
- **Sí:** indexar `daycare_id`. PostgreSQL no crea automáticamente índices para claves foráneas y esta columna será el filtro tenant principal.
- **Sí:** mantener `updated_at` en base de datos. La fecha no depende de que cada cliente recuerde enviarla.
- **Sí:** usar un trigger para futuros usuarios porque el perfil debe existir junto con la identidad Auth.
- **Sí:** alojar la función privilegiada en `private`, fijar `search_path = ''` y revocar ejecución pública.
- **Sí:** confiar en `raw_app_meta_data` únicamente para `role` y `daycare_id`, porque no puede editarla el usuario desde las APIs normales.
- **No:** usar `raw_user_meta_data` para autorización. Solo aporta `full_name`, que es un dato descriptivo y editable.
- **Sí:** hacer fallar el alta si falta metadata requerida. Un fallo explícito evita perfiles activos incompletos o sin tenant.
- **Sí:** el estado por default es `active`, como define el esquema de referencia; cualquier flujo futuro que necesite `pending` deberá establecerlo administrativamente.
- **Sí:** bloquear mediante RLS todo acceso de perfiles `pending`.
- **Sí:** permitir únicamente lectura propia y actualización de campos descriptivos o preferencias.
- **No:** permitir que staff vea otros perfiles de la guardería. Ese permiso necesita casos de uso y una spec independiente.
- **Sí:** añadir una política a `public.daycares` para sustituir el bloqueo temporal documentado en SPEC 07 por lectura tenant-aware.
- **Sí:** usar la cuenta Auth confirmada `juan@collantes.ec` y crear para ella un perfil staff de Juan Collantes en `Sala Soles`.
- **No:** guardar la contraseña, el UUID de Auth o el UUID de la guardería en la spec o migración.
- **Sí:** resolver las relaciones por email y nombre dentro de la migración y fallar ante una cardinalidad distinta de uno.
- **Sí:** aplicar estructura, seguridad y perfil inicial en una única migración remota para que el contrato se confirme o revierta como una unidad.
- **No:** inicializar Supabase local, generar tipos o integrar el cliente. Esta spec define únicamente persistencia y acceso remoto.
- **No:** usar `CREATE TYPE IF NOT EXISTS` o esconder drift con bloques tolerantes. La migración debe detenerse ante objetos conflictivos.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un alta de Auth sin metadata administrativa válida fallará porque el perfil exige rol y guardería. | Reservar la creación de usuarios a un flujo administrativo que establezca `raw_app_meta_data` y probar ese contrato antes de implementar onboarding público. |
| Un error dentro del trigger de `auth.users` bloquea toda la operación de alta. | Validar explícitamente cada campo, producir errores claros, usar nombres calificados y revisar logs de Auth si una creación falla. |
| `SECURITY DEFINER` puede elevar privilegios de forma peligrosa. | Mantener la función en `private`, usar `search_path = ''`, revocar ejecución directa y limitarla a una sola inserción validada. |
| Borrar una guardería deja cuentas Auth sin perfil porque la cascada solo alcanza `public.users`. | Restringir el borrado de guarderías a operaciones administrativas y definir en otra spec la limpieza o reasignación de identidades Auth. |
| El nombre de `Sala Soles` no es único y una fila duplicada volvería ambiguo el seed. | Exigir exactamente una coincidencia y abortar la migración en vez de elegir una fila arbitraria. |
| Crear anticipadamente enums limita los valores disponibles para tablas futuras. | Registrar el conjunto exacto acordado y añadir nuevos valores únicamente mediante migraciones explícitas. |
| Las políticas que consultan `public.users` pueden introducir recursión si se amplían incorrectamente. | Mantener la política propia de `users` basada solo en `auth.uid()` y `status`; permitir que únicamente la política de `daycares` consulte esa tabla. |
| Una migración exclusivamente remota no deja un archivo SQL versionado en Git. | Conservar el cambio en el historial de Supabase y documentar el contrato completo y verificable en esta spec. |

## Qué **no** incluye esta spec

- Tablas de salas, niños, invitaciones, publicaciones u otras entidades futuras.
- Autenticación o sesión real en Next.js.
- Alta pública, activación de cuenta o administración de usuarios desde la aplicación.
- Lectura de otros perfiles por staff o admin.
- Autorización basada en metadata editable por el usuario.
- Sincronización de roles con JWT o custom claims.
- Eliminación automática de cuentas Auth al borrar una guardería.
- Archivos locales de Supabase, tipos TypeScript o dependencias nuevas.
- Cambios visuales o funcionales en las rutas existentes.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
