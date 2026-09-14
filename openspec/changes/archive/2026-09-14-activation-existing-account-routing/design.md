## Context

Ver `proposal.md` — Why para la motivación. Las restricciones que condicionan el diseño:

- `/activate-account` es ruta pública (`utils/supabase/middleware.ts`) y resuelve el token con una consulta administrativa de solo lectura en `resolveActivationContext` (`lib/invitations.ts`), que exige `status = pending`, `resend_email_id`, `sent_at` y vigencia. Esa lectura no llama a `verify_parent_invitation(...)` y por tanto no contabiliza intentos.
- La página elige formulario por estado de sesión: anónimo produce `variant="new"`; una sesión parent válida produce `variant="existing"`; cualquier otra sesión produce el aviso de sesión incorrecta.
- `public.users` no tiene columna de email. SPEC 11 y SPEC 12 lo establecen de forma explícita: el email canónico vive en `auth.users` y en la fila de invitación.
- `supabase-js` no ofrece búsqueda de usuario por email; `auth.admin.listUsers()` es paginado y no sirve como sonda.
- `buildActivationReturnTo(token)` y `resolveActivationReturnTo(value)` ya existen y ya son la única lista blanca de retorno aceptada por `login()` y por el aviso de sesión incorrecta.
- El resultado de `createParentInvitation` no debe permitir a un tercero deducir la existencia de una cuenta.

## Goals / Non-Goals

**Goals:**

- Que la decisión "existe cuenta" se tome con dato fresco en el momento en que el invitado abre el enlace.
- Reutilizar los mecanismos de sesión, tenant y retorno ya implementados en lugar de duplicarlos.
- Mantener la superficie de la sonda al mínimo: un booleano, en servidor, con privilegios de `service_role`.

**Non-Goals:**

- Diferenciar en el diseño los subcasos de cuenta existente (rol, guardería, estado). Aguas abajo ya existen ramas para todos ellos.
- Optimizar el número de saltos del invitado. Un salto a inicio de sesión y vuelta es aceptable.
- Reemplazar el mensaje genérico de `auth.admin.createUser` por uno explícito.

## Decisions

### La sonda vive en la apertura del enlace, no en el envío

El envío y la apertura están separados por hasta siete días. Una marca calculada al enviar y persistida en la fila de invitación queda obsoleta en cuanto la cuenta nace dentro de esa ventana, que es exactamente el caso que se quiere arreglar. La apertura es el único punto donde el dato es verdadero cuando se usa.

Alternativas descartadas:

- **Decidir al enviar y guardar el resultado**: más simple, pero deja el defecto vivo en la ventana de siete días.
- **Decidir solo en la acción de alta**: llega tarde. Para entonces el invitado ya escribió una contraseña y ya se consumió un intento en `verify_parent_invitation(...)`.

La comprobación en la acción de alta se conserva igualmente, pero como segunda barrera contra la carrera, no como punto de decisión.

### La sonda devuelve un booleano y nada más

Se consideró devolver rol, estado y guardería para elegir un mensaje específico por subcaso. Se descarta: el enrutamiento no lo necesita, porque después del inicio de sesión ya se ejecutan `isInvitedParentSession` (email, rol, tenant), el aviso de sesión incorrecta, y la comprobación de perfil activo de `login()`. Cada campo extra es superficie de fuga sin beneficio de comportamiento.

| Caso de cuenta existente | Resultado final | Mecanismo ya existente |
|---|---|---|
| parent activo de la misma guardería | formulario de solo código | `isInvitedParentSession` |
| parent de otra guardería | aviso de sesión incorrecta con cierre de sesión | aviso de sesión incorrecta |
| rol `staff` o `admin` | aviso de sesión incorrecta | aviso de sesión incorrecta |
| perfil `status = 'pending'` | expulsión desde el inicio de sesión con motivo inactivo | `login()` |

### Función de base de datos `SECURITY DEFINER` sobre `auth.users`

`auth.users` no es legible por el invocador de la aplicación y `public.users` no guarda email, así que la sonda necesita una función propia:

- `SECURITY DEFINER` con `search_path = ''` y referencias calificadas por esquema.
- `REVOKE EXECUTE FROM PUBLIC`, `anon` y `authenticated`; `GRANT EXECUTE` solo a `service_role`, replicando el patrón de privilegios de las cuatro RPC de SPEC 11.
- Parámetro de email y comparación en minúsculas. `invitations.email` ya se persiste normalizado por la restricción de SPEC 11.
- Retorno `boolean`.

Alternativas descartadas: `auth.admin.listUsers()` paginado (coste lineal y frágil), añadir email a `public.users` (contradice SPEC 11 y duplica el dato que Auth posee), y usar `generateLink` como sonda (envía correo y produce efectos).

`SECURITY DEFINER` es una excepción justificada frente a las RPC `SECURITY INVOKER` de SPEC 11: aquellas operan sobre tablas de `public` que `service_role` ya puede leer, y esta necesita cruzar a `auth`.

### La revelación va al portador del token, no al staff

El invitado que abre el enlace llegó a él por el buzón del email invitado, de modo que ya prueba control de esa dirección; decirle que su email tiene cuenta no le entrega información que no pudiera obtener probando el inicio de sesión. El staff, en cambio, es un tercero respecto de esa dirección, así que el flujo de envío no cambia y su resultado sigue sin distinguir el caso.

Por el mismo motivo la sonda se ejecuta solo después de validar el token: un enlace inválido nunca la dispara y no puede usarse para enumerar cuentas.

## Risks / Trade-offs

- **La sonda falla o la base de datos no responde** → falla cerrado: no se muestra el formulario de alta y se presenta un estado de error genérico. Mostrar el alta ante la duda reproduce el defecto actual.
- **Carrera entre la carga de la página y el envío del formulario** → segunda comprobación en la acción de alta antes de reservar identificador y claim, y el fallo de `auth.admin.createUser` permanece como última red.
- **Un salto adicional para el invitado con cuenta** → aceptado a cambio de no duplicar el inicio de sesión dentro de la pantalla de activación; el retorno canónico lo devuelve al punto exacto.
- **`SECURITY DEFINER` amplía privilegios efectivos** → mitigado con `search_path = ''`, retorno booleano, sin datos de la cuenta, y ejecución concedida únicamente a `service_role`.
- **Los advisors de seguridad de Supabase marcan funciones `SECURITY DEFINER`** → se ejecutan tras aplicar la migración y se documenta el hallazgo esperado con su justificación.

## Migration Plan

1. Aplicar la migración con la función y sus privilegios mediante la herramienta de migraciones de Supabase, y regenerar los tipos de base de datos.
2. Desplegar el código de aplicación. La rama nueva solo actúa cuando la sonda devuelve verdadero; con la función ausente la aplicación fallaría cerrado, de modo que la migración precede al despliegue.
3. Reversión: revertir el código de aplicación. La función puede permanecer sin efecto, porque ningún otro camino la invoca.
