# SPEC 15 — Consulta de existencia de cuenta de autenticación

> **Estado:** Borrador
> **Depende de:** SPEC 08, SPEC 11
> **Fecha:** 2026-09-14
> **Objetivo:** Crear una función ejecutable únicamente por `service_role` que responda, a partir de un email normalizado, si existe una cuenta en `auth.users`, sin exponer ningún otro dato de esa cuenta.

## Por qué existe esta spec

La página de activación de SPEC 12 decide qué formulario mostrar únicamente por el estado de sesión, de modo que a todo visitante anónimo le pide crear una contraseña. Un padre invitado que ya tiene cuenta recibe entonces el formulario de alta, gasta un intento del código y deja un claim de alta huérfano.

Para enrutar correctamente, la activación necesita saber si el email invitado ya tiene identidad. SPEC 11 establece de forma explícita que `public.users` no almacena email: el email canónico vive en `auth.users` y en la fila de invitación. `auth.users` no es legible por el invocador de la aplicación y `supabase-js` no ofrece búsqueda de usuario por email —`auth.admin.listUsers()` es paginado y su coste crece con el padrón—, así que la consulta necesita una función propia en la base de datos.

## Alcance

**Incluye:**

- Crear `public.auth_account_exists(p_email text) returns boolean` en el proyecto Supabase conectado.
- Declararla `SECURITY DEFINER` porque debe cruzar desde `public` hacia el esquema `auth`.
- Fijar `search_path = ''` y calificar por esquema todas las referencias, incluidas las funciones de `pg_catalog`.
- Normalizar el parámetro con `btrim()` y minúsculas antes de comparar, igual que la restricción de `invitations.email` de SPEC 11.
- Devolver `false` para un parámetro nulo o vacío, sin consultar la tabla.
- Revocar `EXECUTE` a `PUBLIC`, `anon` y `authenticated`, y concederlo solo a `service_role`.
- Aplicar el cambio mediante una única migración remota llamada `create_auth_account_existence_probe` con `supabase_apply_migration`.
- Generar nuevamente los tipos TypeScript después de aplicar la migración.
- Ejecutar los asesores de seguridad y rendimiento de Supabase después de la migración.

**Fuera de alcance (para specs futuras):**

- Devolver rol, estado, guardería, identificador o cualquier otro dato de la cuenta encontrada.
- Exponer la función a `anon` o `authenticated`, directamente o a través de otra función.
- Copiar el email a `public.users`.
- Modificar `auth.users`, sus triggers o sus políticas.
- Cambiar `private.handle_new_user()` o cualquiera de las cuatro operaciones de SPEC 11.
- Implementar el enrutamiento de la activación, que es materia del cambio de aplicación que consume esta función.

## Modelo de datos

Esta spec no crea ni modifica tablas, enums, índices ni políticas. Su único artefacto es una función de lectura.

### `public.auth_account_exists(p_email text) returns boolean`

- Es `SECURITY DEFINER` con `SET search_path TO ''`.
- Recibe un único parámetro de texto y no acepta identificadores ni filtros adicionales.
- Normaliza el parámetro con `pg_catalog.lower(pg_catalog.btrim(...))`.
- Devuelve `false` cuando el parámetro es nulo o queda vacío tras normalizar, sin leer `auth.users`.
- Devuelve `true` cuando existe al menos una fila de `auth.users` cuyo email normalizado coincide, y `false` en cualquier otro caso.
- No distingue cuentas confirmadas de no confirmadas, ni activas de inactivas: la aplicación no necesita ese matiz para enrutar, y cada distinción adicional sería superficie de fuga.
- No devuelve identificadores, marcas de tiempo, metadata ni recuentos.
- No escribe, no registra intentos y no produce efectos observables.

`SECURITY DEFINER` es una excepción justificada frente a las cuatro operaciones `SECURITY INVOKER` de SPEC 11: aquellas operan sobre tablas de `public` que `service_role` ya puede leer, mientras que esta debe cruzar al esquema `auth`, que ningún rol de la aplicación alcanza. La excepción se acota con `search_path = ''`, retorno booleano y ejecución concedida a un solo rol.

### Privilegios

La función revoca `EXECUTE` a `PUBLIC`, `anon` y `authenticated`, y concede ejecución explícita solo a `service_role`, replicando el patrón de privilegios de las cuatro operaciones de SPEC 11. No constituye una API pública para el navegador: solo Next.js, con la credencial administrativa aislada en servidor, puede invocarla.

## Artefactos

**Objetos remotos nuevos:**

- `public.auth_account_exists(text)` con sus privilegios.

**Objetos remotos modificados:**

- Ninguno.

**Archivos locales posteriores a la migración:**

- `types/database.ts`, generado desde el esquema desplegado.

## Plan de implementación

1. Inspeccionar funciones, privilegios e historial remoto inmediatamente antes de migrar.
2. Preparar una única migración `create_auth_account_existence_probe` con la función y sus privilegios.
3. Aplicar la migración mediante `supabase_apply_migration` y no mediante DDL en `supabase_execute_sql`.
4. Verificar en los catálogos de PostgreSQL el nombre, la firma, el tipo de retorno, `prosecdef`, `proconfig` y los grants efectivos de `anon`, `authenticated` y `service_role`.
5. Comprobar la función con un email inexistente y con el email de una cuenta real, y confirmar `false` y `true` respectivamente.
6. Comprobar que la comparación es insensible a mayúsculas y a espacios en los extremos.
7. Generar nuevamente los tipos TypeScript y verificar que `npx tsc --noEmit` pasa.
8. Ejecutar los asesores de seguridad y rendimiento y documentar el aviso esperado por `SECURITY DEFINER`.

## Resultado de los asesores

Ejecutados tras aplicar `create_auth_account_existence_probe`:

- **Seguridad:** no aparece ningún hallazgo atribuible a esta migración. El lint `security_definer_view` solo aplica a vistas, y `function_search_path_mutable` no dispara porque la función fija `search_path = ''`. El único aviso presente, `auth_leaked_password_protection`, es una opción de configuración de Auth previa a este cambio y ajena a él.
- **Rendimiento:** solo `unused_index` en nivel informativo sobre cuatro índices de `invitations` y `posts`, todos anteriores a esta migración. La función no crea índices ni consulta tablas de `public`.

## Criterios de aceptación

- [x] La migración remota se llama `create_auth_account_existence_probe` y aparece una sola vez en el historial.
- [x] `public.auth_account_exists(text)` existe y devuelve `boolean`.
- [x] La función es `SECURITY DEFINER` y tiene `search_path = ''`.
- [x] Todas las referencias dentro del cuerpo están calificadas por esquema.
- [x] `PUBLIC`, `anon` y `authenticated` no tienen `EXECUTE` sobre la función.
- [x] `service_role` tiene `EXECUTE` sobre la función.
- [x] Un email inexistente devuelve `false`.
- [x] El email de una cuenta real devuelve `true`.
- [x] El mismo email con mayúsculas o espacios en los extremos devuelve el mismo resultado.
- [x] Un parámetro nulo o vacío devuelve `false`.
- [x] El resultado no incluye identificador, rol, estado, guardería ni ningún otro dato de la cuenta.
- [x] `npx tsc --noEmit` pasa con los tipos regenerados.
- [x] Los asesores no reportan problemas nuevos salvo el aviso esperado por `SECURITY DEFINER`, documentado con su justificación.

## Decisiones

- **Sí:** resolver la existencia con una función de base de datos. Es la única forma de consultar `auth.users` por email con coste constante.
- **No:** usar `auth.admin.listUsers()` paginado. Su coste crece con el padrón y su resultado es frágil frente a cambios de paginación.
- **No:** añadir email a `public.users`. Contradice SPEC 11 y duplica el dato que Auth posee.
- **No:** usar `generateLink` como sonda. Envía correo y produce efectos observables para el titular de la dirección.
- **Sí:** devolver únicamente un booleano. El enrutamiento no necesita más, y rol, estado y guardería ya se comprueban aguas abajo con los mecanismos de SPEC 12.
- **Sí:** aceptar `SECURITY DEFINER` como excepción acotada, porque ningún rol de la aplicación puede leer `auth.users` y `SECURITY INVOKER` no resolvería la consulta.
- **Sí:** normalizar dentro de la función además de en la aplicación, para que la comparación sea correcta aunque el llamador olvide normalizar.
- **No:** conceder ejecución a `authenticated`. Convertiría la función en un oráculo de enumeración de cuentas para cualquier sesión.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `SECURITY DEFINER` amplía los privilegios efectivos de quien la ejecuta. | `search_path = ''`, referencias calificadas, retorno booleano sin datos de la cuenta y ejecución concedida únicamente a `service_role`. |
| La función puede convertirse en un oráculo de enumeración de cuentas. | Mantener revocado `EXECUTE` a `PUBLIC`, `anon` y `authenticated`, y verificar los grants después de migrar y tras cualquier migración posterior. |
| Un `GRANT` por defecto sobre funciones nuevas puede reabrir el acceso. | Revocar explícitamente en la misma migración que crea la función y comprobar los grants efectivos en los catálogos. |
| Los asesores de seguridad marcan la función por ser `SECURITY DEFINER`. | Ejecutarlos tras aplicar la migración y documentar el hallazgo esperado con su justificación en esta spec. |
| Una comparación sensible a mayúsculas produciría falsos negativos. | Normalizar el parámetro y comparar contra el email de `auth.users` también normalizado. |

## Qué **no** incluye esta spec

- El enrutamiento de la activación entre alta de cuenta nueva y inicio de sesión.
- La segunda comprobación dentro de la acción de alta.
- Cualquier cambio en la creación, el envío o la presentación de invitaciones.
- Acceso de `anon` o `authenticated` a datos de `auth.users`.
