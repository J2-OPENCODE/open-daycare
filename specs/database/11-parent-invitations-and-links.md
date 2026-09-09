# SPEC 11 — Invitaciones y vínculos entre padres y niños

> **Estado:** Borrador
> **Depende de:** SPEC 08, SPEC 09
> **Fecha:** 2026-09-08
> **Objetivo:** Crear el modelo persistente y las fronteras de seguridad necesarias para invitar y vincular de forma atómica una cuenta parent con un niño de su misma guardería.

## Por qué existe esta spec

SPEC 08 creó los perfiles de aplicación y su aprovisionamiento desde Supabase Auth, mientras que SPEC 09 creó salas y niños con aislamiento por guardería. El flujo visual de SPEC 05 todavía simula la invitación y no existe una relación persistente que determine qué padre está vinculado con qué niño.

La página pública de activación no justifica exponer las filas de invitación a `anon`. Esas filas contienen identidad personal, contexto del niño y secretos de un solo uso, por lo que la verificación se realizará desde Next.js mediante una credencial administrativa que nunca llega al navegador.

## Alcance

**Incluye:**

- Crear `public.parent_children` como relación muchos-a-muchos entre perfiles parent y niños.
- Crear `public.invitations` para representar la invitación desde su emisión hasta su aceptación, vencimiento o cancelación.
- Persistir `daycare_id` en ambas tablas para aplicar y verificar aislamiento multi-tenant mediante restricciones declarativas.
- Exigir que el padre, el niño, el invitador y la invitación pertenezcan a la misma guardería.
- Permitir varios padres por niño y varios niños por padre dentro de una misma guardería.
- Evitar más de un vínculo entre el mismo padre y niño.
- Evitar más de una invitación `pending` para el mismo niño y email normalizado.
- Almacenar únicamente digests HMAC-SHA256 del token opaco y del código de invitación.
- No almacenar el token ni el código en texto plano.
- Registrar hasta diez intentos inválidos por invitación y cancelarla al alcanzar el límite.
- Mantener una vigencia de siete días calculada por la aplicación al crear la invitación.
- Registrar el identificador de Resend, la fecha de envío, la persona que aceptó y la fecha de aceptación.
- Conservar invitaciones `expired` y `cancelled` para auditoría.
- Activar RLS en ambas tablas desde su creación.
- Mantener `anon` sin privilegios ni políticas sobre ambas tablas.
- Permitir que staff y admin activos consulten vínculos e invitaciones de su guardería.
- Permitir que un parent activo consulte únicamente sus propios vínculos.
- Permitir que staff y admin activos consulten perfiles de otros usuarios de su guardería para mostrar padres vinculados.
- Mantener todas las escrituras de invitaciones y vínculos detrás de operaciones administrativas controladas por Next.js.
- Crear funciones transaccionales ejecutables únicamente por `service_role` para reemplazar, verificar y aceptar invitaciones.
- Extender `private.handle_new_user()` para consumir una invitación durante el alta de un nuevo parent.
- Crear perfil, vínculo y aceptación dentro de la misma transacción que inserta la identidad nueva en `auth.users`.
- Admitir la aceptación por una cuenta parent existente de la misma guardería mediante una operación transaccional separada.
- Rechazar cuentas existentes pertenecientes a otra guardería.
- Rechazar perfiles existentes cuyo rol no sea `parent` o cuyo estado no sea `active`.
- Aplicar el cambio mediante una migración remota llamada `create_parent_invitations_and_links`.
- Generar nuevamente los tipos TypeScript después de aplicar la migración.
- Ejecutar los asesores de seguridad y rendimiento de Supabase después de la migración.

**Fuera de alcance (para specs futuras):**

- Enviar correos mediante Resend.
- Generar tokens, códigos o digests dentro de PostgreSQL.
- Implementar `/activate-account`, formularios o Server Actions.
- Permitir lectura directa de invitaciones a `anon`.
- Crear un RPC anónimo de consulta o activación.
- Implementar membresías de una misma identidad en varias guarderías.
- Dar al parent acceso directo a `children`, `rooms`, publicaciones o feeds.
- Implementar revocación, reenvío o historial de invitaciones desde la interfaz.
- Eliminar automáticamente invitaciones históricas.
- Cambiar el modelo actual de consentimiento de fotos.
- Crear tablas de publicaciones, comentarios, reacciones o resúmenes.

## Modelo de datos

### `public.parent_children`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | `NOT NULL`, FK compuesta de tenant |
| `parent_id` | `uuid` | `NOT NULL`, FK compuesta a `public.users` |
| `child_id` | `uuid` | `NOT NULL`, FK compuesta a `public.children` |
| `relationship` | `public.relationship_type` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |

La tabla incorpora `UNIQUE (parent_id, child_id)`. También incorpora FKs compuestas `(parent_id, daycare_id)` y `(child_id, daycare_id)` para impedir vínculos entre tenants incluso cuando una operación use una credencial que evita RLS.

Las tablas referenciadas reciben las claves únicas auxiliares `users_id_daycare_key` y `children_id_daycare_key` si no existe todavía una restricción equivalente. Estas restricciones no sustituyen sus claves primarias.

### `public.invitations`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | `NOT NULL`, FK compuesta de tenant |
| `child_id` | `uuid` | `NOT NULL`, FK compuesta a `public.children` |
| `invited_by` | `uuid` | `NOT NULL`, FK compuesta a `public.users` |
| `full_name` | `text` | `NOT NULL`, entre 1 y 120 caracteres después de `btrim()` |
| `email` | `text` | `NOT NULL`, normalizado con `trim()` y minúsculas antes de persistir |
| `relationship` | `public.relationship_type` | `NOT NULL` |
| `code_digest` | `text` | `NOT NULL`, HMAC-SHA256 hexadecimal de 64 caracteres |
| `token_digest` | `text` | `NOT NULL`, HMAC-SHA256 hexadecimal de 64 caracteres y `UNIQUE` |
| `status` | `public.invitation_status` | `NOT NULL`, default `pending` |
| `failed_attempts` | `smallint` | `NOT NULL`, default `0`, rango de 0 a 10 |
| `expires_at` | `timestamptz` | `NOT NULL` |
| `resend_email_id` | `text` | Nullable |
| `sent_at` | `timestamptz` | Nullable |
| `accepted_by` | `uuid` | Nullable, FK a `public.users(id)` |
| `accepted_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

`email` incluye una restricción que exige que el valor persistido ya esté recortado y en minúsculas. `code_digest` y `token_digest` incluyen restricciones de longitud y formato hexadecimal; la base no conoce `INVITATION_HASH_SECRET`.

Una restricción parcial única sobre `(child_id, email)` aplica únicamente a filas con `status = 'pending'`. Una invitación para otro niño sigue siendo válida y permite que una misma cuenta parent se vincule con varios niños.

Una invitación `accepted` exige `accepted_by` y `accepted_at`. Los demás estados mantienen ambos campos nulos. `failed_attempts = 10` no puede coexistir con `status = 'pending'`.

### Operaciones transaccionales

`public.replace_parent_invitation(...)`:

- Es `SECURITY INVOKER` y solo puede ejecutarla `service_role`.
- Valida que `invited_by` corresponda a staff o admin activo.
- Valida que el niño esté activo y pertenezca a la misma guardería.
- Cancela una invitación pendiente previa del mismo niño y email.
- Inserta la nueva invitación con sus digests y vencimiento.
- Devuelve únicamente el UUID creado.

`public.verify_parent_invitation(...)`:

- Es `SECURITY INVOKER` y solo puede ejecutarla `service_role`.
- Recibe `token_digest` y `code_digest`, nunca secretos en texto plano persistidos.
- Bloquea la fila candidata con `FOR UPDATE` para serializar intentos concurrentes.
- Devuelve un resultado discriminado y los datos mínimos de activación solamente cuando ambos digests coinciden.
- Cambia a `expired` cuando la vigencia terminó.
- Incrementa `failed_attempts` cuando el código no coincide.
- Cambia a `cancelled` al alcanzar diez intentos fallidos.
- Usa un resultado genérico para no distinguir token inexistente, código incorrecto, vencimiento o cancelación ante el cliente público.

`public.accept_parent_invitation(...)`:

- Es `SECURITY INVOKER` y solo puede ejecutarla `service_role`.
- Recibe el UUID de una invitación previamente verificada y el UUID de un parent autenticado.
- Bloquea la invitación y vuelve a comprobar `pending`, vencimiento y tenant dentro de la transacción.
- Comprueba que el perfil sea parent activo y pertenezca a la guardería de la invitación.
- Comprueba mediante datos confiables del servidor que el email autenticado coincide con el email invitado.
- Inserta `parent_children` y marca la invitación como `accepted` en una sola transacción.
- Es idempotente únicamente cuando la misma cuenta ya aceptó esa misma invitación.

Las tres funciones revocan `EXECUTE` a `PUBLIC`, `anon` y `authenticated`, y conceden ejecución explícita solo a `service_role`. No constituyen una API pública para el navegador.

### Aprovisionamiento de un parent nuevo

`private.handle_new_user()` conserva sin cambios el alta actual de staff y admin. Cuando `NEW.raw_app_meta_data` contenga `role = 'parent'`, también exige un `invitation_id` administrativo.

Para parent, la función:

1. Bloquea la invitación correspondiente.
2. Comprueba que continúa pendiente y vigente.
3. Comprueba que `NEW.email` normalizado coincide con `invitations.email`.
4. Comprueba que `daycare_id` administrativo coincide con la invitación.
5. Inserta el perfil `public.users` con rol parent y estado active.
6. Inserta `public.parent_children` usando el niño y parentesco de la invitación.
7. Marca la invitación como accepted con `accepted_by = NEW.id`.

Cualquier fallo aborta la inserción en `auth.users`, el perfil, el vínculo y la aceptación como una sola unidad.

### RLS y privilegios

`public.invitations`:

- `invitations_select_own_managed_daycare` permite `SELECT` a staff y admin activos cuando `daycare_id` coincide con su perfil.
- `authenticated` recibe únicamente `SELECT`.
- `anon` no recibe privilegios ni políticas.
- `authenticated` no recibe `INSERT`, `UPDATE` ni `DELETE`.

`public.parent_children`:

- `parent_children_select_own_managed_daycare` permite a staff y admin activos leer vínculos de su guardería.
- `parent_children_select_own_parent` permite a un parent activo leer filas donde `parent_id = auth.uid()`.
- `authenticated` recibe únicamente `SELECT`.
- `anon` no recibe privilegios ni políticas.
- `authenticated` no recibe `INSERT`, `UPDATE` ni `DELETE`.

`public.users` recibe `users_select_own_managed_daycare`, que permite a staff y admin activos consultar perfiles de su guardería. La política propia existente continúa permitiendo a cada usuario activo leer su perfil.

## Artefactos

**Objetos remotos nuevos:**

- `public.parent_children` y sus restricciones, índices, políticas y privilegios.
- `public.invitations` y sus restricciones, índices, políticas, trigger de `updated_at` y privilegios.
- `public.replace_parent_invitation(...)`.
- `public.verify_parent_invitation(...)`.
- `public.accept_parent_invitation(...)`.
- Índices para todas las columnas FK y para las búsquedas por tenant, estado, email y vencimiento.

**Objetos remotos modificados:**

- `public.users` recibe una clave única auxiliar y una política de lectura para staff/admin del mismo tenant.
- `public.children` recibe una clave única auxiliar si no existe una equivalente.
- `private.handle_new_user()` incorpora el alta atómica de parent por invitación.

**Archivos locales posteriores a la migración:**

- `types/database.ts`, generado desde el esquema desplegado como parte de SPEC 12.

## Plan de implementación

1. Volver a inspeccionar tablas, restricciones, índices, enums, funciones, triggers, políticas, privilegios e historial remoto inmediatamente antes de migrar.
2. Preparar una única migración `create_parent_invitations_and_links` con las dos tablas, restricciones tenant-aware, índices, trigger de actualización y privilegios mínimos.
3. Crear las tres operaciones transaccionales con nombres calificados, validaciones internas y ejecución exclusiva de `service_role`.
4. Extender `private.handle_new_user()` sin cambiar el contrato vigente para altas staff/admin y añadir la rama parent basada en metadata administrativa.
5. Aplicar la migración mediante `supabase_apply_migration` y no mediante DDL en `supabase_execute_sql`.
6. Verificar en los catálogos de PostgreSQL columnas, tipos, defaults, restricciones, acciones de borrado, índices, funciones, seguridad, triggers, RLS y grants.
7. Probar en transacciones revertidas el aislamiento de tenant, las políticas de lectura y el bloqueo de todas las escrituras directas de `authenticated` y `anon`.
8. Probar reemplazo de invitación pendiente, vencimiento, diez intentos fallidos y aceptación concurrente.
9. Probar el alta parent mediante una identidad temporal y confirmar que Auth, perfil, vínculo y aceptación se confirman o revierten juntos.
10. Probar la aceptación de una cuenta parent existente de la misma guardería y el rechazo de otro tenant, otro rol y otro email.
11. Confirmar que staff/admin puede leer los nombres vinculados de su guardería y no perfiles de otros tenants.
12. Ejecutar los asesores de seguridad y rendimiento y resolver cualquier aviso atribuible a esta migración.

## Criterios de aceptación

- [ ] La migración remota se llama `create_parent_invitations_and_links` y aparece una sola vez en el historial.
- [ ] `parent_children` e `invitations` tienen RLS habilitado desde su creación.
- [ ] `anon` no tiene privilegios ni políticas sobre ninguna de las dos tablas.
- [ ] No existe un RPC de invitaciones ejecutable por `anon`.
- [ ] No se almacena el código ni el token en texto plano.
- [ ] Ambos digests exigen 64 caracteres hexadecimales.
- [ ] Un padre y un niño de guarderías distintas no pueden vincularse aunque la operación evite RLS.
- [ ] Un invitador no puede crear una invitación para un niño de otra guardería.
- [ ] Un mismo parent puede vincularse con varios niños de su guardería.
- [ ] Un niño puede vincularse con varios parents de su guardería.
- [ ] El vínculo del mismo parent y niño no puede duplicarse.
- [ ] Solo existe una invitación pending por niño y email normalizado.
- [ ] Reemplazar una invitación cancela la anterior e inserta una nueva de forma atómica.
- [ ] Una invitación para otro niño no se considera duplicada.
- [ ] Una invitación aceptada registra `accepted_by` y `accepted_at`.
- [ ] Una invitación vencida cambia a `expired` al intentar verificarla.
- [ ] Un código incorrecto incrementa el contador sin revelar datos de la invitación.
- [ ] El décimo código incorrecto cancela la invitación.
- [ ] Intentos concurrentes no superan el límite ni aceptan dos veces la misma invitación.
- [ ] Staff y admin activos leen invitaciones y vínculos únicamente de su guardería.
- [ ] Un parent activo lee únicamente sus propios vínculos.
- [ ] Staff y admin pueden leer el nombre del parent vinculado dentro de su guardería.
- [ ] `authenticated` no puede insertar, actualizar ni eliminar directamente invitaciones o vínculos.
- [ ] Las funciones administrativas no son ejecutables por `PUBLIC`, `anon` ni `authenticated`.
- [ ] El alta de un parent nuevo exige `invitation_id` en metadata administrativa.
- [ ] El trigger compara el email Auth normalizado con la invitación.
- [ ] Una invitación inválida impide crear la identidad Auth y no deja perfiles huérfanos.
- [ ] Una invitación válida crea identidad, perfil, vínculo y aceptación en una sola transacción.
- [ ] El alta vigente de staff/admin continúa funcionando con su contrato anterior.
- [ ] Una cuenta parent existente de la misma guardería puede aceptar otro niño.
- [ ] Una cuenta de otra guardería, otro rol u otro email no puede aceptar la invitación.
- [ ] Las claves foráneas relevantes tienen índices de soporte.
- [ ] Los asesores de seguridad y rendimiento no reportan problemas introducidos por esta migración.

## Decisiones

- **Sí:** mantener `invitations` en `public` con RLS y grants mínimos porque las consultas staff actuales usan la Data API.
- **No:** conceder lectura a `anon`. Una ruta web pública no convierte datos personales y secretos en información pública.
- **Sí:** la activación anónima se resuelve en Next.js con una credencial administrativa aislada en servidor.
- **Sí:** almacenar digests HMAC-SHA256 calculados fuera de PostgreSQL para que una filtración de la base no exponga directamente códigos cortos reutilizables.
- **No:** almacenar códigos recuperables para reenviar el mismo valor. Cada reenvío reemplaza la invitación y crea secretos nuevos.
- **Sí:** usar un token opaco además del código de seis caracteres. El código corto nunca es un identificador global suficiente.
- **Sí:** persistir `daycare_id` en tablas relacionales para poder imponer tenant por FK y simplificar RLS.
- **Sí:** conservar el nombre de `public.users` como identidad canónica cuando la cuenta ya existe.
- **No:** persistir un alias por vínculo en esta etapa.
- **Sí:** una cuenta existente debe pertenecer a la misma guardería.
- **No:** rediseñar usuarios como membresías multi-guardería dentro de este alcance.
- **Sí:** crear el vínculo durante el trigger de un usuario nuevo para conservar atomicidad con Supabase Auth.
- **Sí:** usar una función transaccional para cuentas existentes porque no se dispara un alta de Auth.
- **Sí:** conservar estados históricos para auditoría y mostrar solamente active y pending en la aplicación.
- **No:** conceder acceso parent a niños o feeds antes de especificar qué campos puede leer ese rol.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una función administrativa puede convertirse accidentalmente en un endpoint privilegiado público. | Revocar `EXECUTE` a `PUBLIC`, `anon` y `authenticated`, concederlo solo a `service_role` y verificar grants después de migrar. |
| Una política sobre `users` puede causar recursión. | Basar la autorización del actor en una función privada o consulta no recursiva revisada y probar las políticas con identidades de distintos tenants. |
| Dos aceptaciones concurrentes pueden crear vínculos o estados inconsistentes. | Bloquear la invitación con `FOR UPDATE`, usar `UNIQUE (parent_id, child_id)` y confirmar vínculo y estado en una sola transacción. |
| Modificar `private.handle_new_user()` puede romper altas staff/admin existentes. | Mantener su rama actual, aislar el contrato parent y probar ambos caminos antes de aprobar la migración. |
| Un borrado en cascada puede eliminar historial necesario. | Usar cascada únicamente para dependencias sin entidad raíz y documentar la retención ligada a usuarios y niños existentes. |
| El modelo actual impide una identidad en varias guarderías. | Rechazar ese caso con un error explícito y reservar membresías multi-tenant para otra spec. |

## Qué **no** incluye esta spec

- Lectura anónima de invitaciones o vínculos.
- Correo de invitación, Resend o plantillas HTML.
- Interfaz staff, formulario público o login con retorno.
- Feed parent o acceso parent a datos del niño.
- Consentimiento de fotos por tutor.
- Membresías de usuarios en varias guarderías.
- Reenvío, revocación o historial visible desde la aplicación.

Cada una de esas capacidades debe definirse o implementarse en una spec de aplicación posterior.
