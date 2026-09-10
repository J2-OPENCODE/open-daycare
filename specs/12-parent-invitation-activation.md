# SPEC 12 — Invitación y activación de cuentas parent

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 10, SPEC 11
> **Fecha:** 2026-09-09
> **Objetivo:** Convertir la vinculación simulada en un flujo completo que envíe una invitación con Resend, active o autentique al parent, muestre el vínculo persistente y termine en una confirmación segura.

## Por qué existe esta spec

SPEC 05 implementó el modal con valores fijos y una confirmación puramente visual. SPEC 10 conectó los niños con Supabase, pero conserva `parents: []`, y la activación pública sigue usando fixtures con un botón deshabilitado. SPEC 11 aporta el modelo seguro para sustituir esas simulaciones sin exponer invitaciones a usuarios anónimos.

## Alcance

**Incluye:**

- Mantener el modal Vincular padre dentro de `/kids/[slug]` y conservar su identidad visual aprobada.
- Enviar nombre, email y parentesco mediante una Server Action real.
- Tratar todos los argumentos de la acción como entrada no confiable.
- Autorizar nuevamente en la acción que el actor sea staff o admin activo.
- Comprobar que el niño está activo y pertenece a la guardería del actor.
- Normalizar el email con `trim()` y minúsculas antes de persistir o comparar.
- Traducir Mamá, Papá y Tutor/a a `mother`, `father` y `guardian`.
- Generar un código aleatorio de seis caracteres con el alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Aceptar el código sin distinguir mayúsculas de minúsculas.
- Generar un token opaco de 32 bytes codificado como base64url.
- Calcular los digests HMAC-SHA256 de ambos secretos con `INVITATION_HASH_SECRET`.
- Capturar un único `issuedAt` en servidor y configurar siete días de vigencia desde ese instante.
- Reemplazar una invitación pendiente del mismo email y niño con token y código nuevos.
- Detectar en servidor cuando el email ya corresponde a un parent vinculado con el niño y no crear ni enviar otra invitación.
- Enviar el correo con el SDK Node.js de Resend ya instalado.
- Usar el UUID de la invitación como base de la clave de idempotencia de Resend.
- Limitar a tres invitaciones creadas por el mismo actor durante una hora móvil.
- Limitar a tres invitaciones para el mismo niño y email normalizado durante una hora móvil.
- Guardar `resend_email_id` y `sent_at` después de una respuesta exitosa.
- Cancelar la invitación y mostrar un error si Resend devuelve un error.
- Cancelar también la invitación si Resend acepta el correo pero no puede persistirse la confirmación del envío.
- Mantener abierto el modal y conservar sus valores cuando falle validación, Supabase o Resend.
- No devolver ni mostrar al staff el código o token después del envío.
- Mostrar `Invitación enviada` únicamente después de persistencia y respuesta exitosa de Resend.
- Consultar padres activos e invitaciones pendientes desde Supabase en `/kids` y `/kids/[slug]`.
- Considerar visible y utilizable solo una invitación pending con `resend_email_id` y `sent_at` presentes.
- Mostrar una invitación vigente como `PENDIENTE` y un vínculo aceptado como `ACTIVA`.
- Usar el nombre de la invitación mientras está pendiente y el nombre canónico de `public.users` cuando está activa.
- Mostrar Tutor/a además de Mamá y Papá cuando corresponda.
- Mantener invitaciones expired y cancelled fuera de la tarjeta visible.
- Mantener `/activate-account` como ruta pública y canónica.
- Enviar un enlace `/activate-account?token={token}` dentro del correo.
- No incluir el código, email ni UUID de la invitación en la URL.
- Resolver en servidor un DTO mínimo de activación a partir del token.
- Mostrar nombre del niño, sala y email enmascarado sin entregar la fila completa al cliente.
- Mostrar un estado genérico cuando el token sea inexistente, inválido, vencido, cancelado o aceptado por otra cuenta.
- Retirar el campo de email editable; el email canónico proviene exclusivamente de la invitación y solo se muestra enmascarado.
- Solicitar código, contraseña y confirmación de contraseña para una cuenta nueva.
- Exigir una contraseña de al menos ocho caracteres sin reglas arbitrarias de composición.
- Comparar contraseña y confirmación únicamente durante el envío y no persistirlas en estado de aplicación.
- Crear cuentas nuevas mediante `auth.admin.createUser()` exclusivamente desde servidor.
- Establecer `email_confirm: true` porque el acceso al correo se prueba mediante la invitación.
- Generar en servidor el UUID de Auth y preparar su claim privado mediante `prepare_parent_signup(...)` antes de crear la identidad.
- Pasar `daycare_id`, `role = parent` e `invitation_id` mediante `app_metadata` administrativa.
- Pasar `full_name` mediante `user_metadata` descriptiva.
- Iniciar sesión con la contraseña creada después del alta atómica.
- Redirigir a `/activate-account/success` después de crear o vincular la cuenta con una sesión parent activa.
- Mostrar en la confirmación una acción voluntaria `Ir al inicio` hacia `/`.
- Permitir que una cuenta parent existente inicie sesión y vuelva a la invitación.
- Preservar únicamente un destino interno validado durante el login para evitar redirecciones abiertas.
- Aplicar `noindex` y `no-referrer` también al login cuando su retorno contiene un token de activación.
- Permitir a una cuenta parent existente de la misma guardería aceptar otro niño.
- Usar el nombre existente de `public.users` después de aceptar.
- Rechazar una sesión con email distinto, otro rol, estado inactivo u otra guardería.
- Cancelar la invitación al alcanzar diez códigos incorrectos.
- Conservar el proxy de refresco de sesión y sus cookies y cabeceras actuales.
- Añadir metadata `noindex` y una política de referrer que no propague el token a destinos externos.
- Proteger `/activate-account/success` para que solo un parent activo y autenticado pueda visitarla.
- Crear una versión HTML y otra de texto plano del correo.
- Reproducir en el correo el lenguaje visual cálido de OpenDayCare sin recursos remotos obligatorios.
- Probar el envío inicial con `OpenDayCare <onboarding@resend.dev>` y `delivered@resend.dev`.
- Eliminar la identidad Auth y todas las filas técnicas creadas por la prueba sandbox después de verificar el flujo.
- Documentar que un dominio verificado será obligatorio antes de enviar a destinatarios reales.

**Fuera de alcance (para specs futuras):**

- Crear o verificar un dominio de envío en Resend.
- Enviar invitaciones reales a direcciones arbitrarias mientras se use el sandbox.
- Implementar webhooks de delivered, bounced, complained o suppressed.
- Reenviar o revocar invitaciones desde una interfaz dedicada.
- Mostrar códigos al staff o permitir copiarlos manualmente.
- Crear un Route Handler o una API pública alternativa.
- Usar Supabase Auth OTP, magic links o correos de confirmación adicionales.
- Renombrar la ruta a `/activate`.
- Crear una ruta `/signup` separada.
- Implementar un feed parent persistente y filtrado.
- Dar acceso Data API de parent a `children`, `rooms` o publicaciones.
- Modificar `children.photo_consent` durante la activación.
- Modelar consentimiento individual por tutor.
- Permitir cuentas vinculadas con varias guarderías.
- Mostrar invitaciones vencidas o canceladas en la tarjeta.
- Incorporar una suite automatizada o nuevas dependencias.
- Persistir el harness efímero usado para inyectar fallos durante la verificación.

## Modelo de aplicación

Esta spec no crea tablas, columnas, políticas ni funciones PostgreSQL. Reutiliza `public.invitations`, `public.parent_children`, `private.parent_signup_claims` y los cuatro RPC administrativos implementados por SPEC 11.

### Configuración de servidor

`.env.template` documenta:

```text
RESEND_API_KEY=...
RESEND_FROM_EMAIL=OpenDayCare <onboarding@resend.dev>
APP_URL=http://localhost:3000
INVITATION_HASH_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Ninguna de estas variables usa el prefijo `NEXT_PUBLIC_`. `INVITATION_HASH_SECRET` contiene exactamente 32 bytes aleatorios codificados como base64url sin padding: 43 caracteres de `[A-Za-z0-9_-]`. Se genera con una fuente criptográfica, se decodifica antes de usar y cualquier formato o longitud distinta produce un error controlado.

`APP_URL` debe representar únicamente un origen absoluto `http:` o `https:` sin credenciales, path distinto de `/`, query ni fragment. El enlace se construye con `new URL("/activate-account", appUrl)` y añade únicamente `token`. La rotación de `INVITATION_HASH_SECRET` invalida las invitaciones pendientes anteriores.

`utils/supabase/admin.ts` importa `server-only`, usa `SUPABASE_SERVICE_ROLE_KEY` y desactiva persistencia, refresco y detección de sesión. Este cliente no recibe cookies del visitante y no se importa desde componentes de cliente. `lib/invitations.ts` valida de forma diferida las variables privadas cuando una operación las necesita para no romper el build por ausencia de secretos en fases que no ejecutan el flujo.

### Contrato de creación

```ts
type CreateParentInvitationInput = {
  childId: string;
  parentName: string;
  email: string;
  relationship: "Mamá" | "Papá" | "Tutor/a";
};

type CreateParentInvitationResult =
  | { status: "success" }
  | {
      status: "invalid";
      errors: Partial<Record<"parentName" | "email" | "relationship", string>>;
    }
  | { status: "conflict"; message: string }
  | { status: "rate_limited"; message: string }
  | { status: "error"; message: string };
```

El resultado nunca incluye código, token, digests, email completo, identificadores internos ni respuestas crudas de Supabase o Resend. Un conflicto significa que el email ya está vinculado con ese niño; no se usa para revelar si existe una cuenta Auth. `rate_limited` muestra `Alcanzaste el límite de invitaciones. Intentá de nuevo más tarde.` y conserva el formulario.

La acción exige `childId` con sintaxis UUID, nombre con 1 a 120 caracteres después de `trim()`, email válido de hasta 254 caracteres y parentesco perteneciente al conjunto cerrado. Un `childId` sintácticamente inválido, inexistente, archived o de otro tenant devuelve el mismo error general de niño no disponible. No se llama a Supabase ni Resend cuando los campos visibles son inválidos.

Antes de reemplazar la invitación, el servidor consulta los vínculos del niño y resuelve con `auth.admin.getUserById()` los pocos `parent_id` vinculados. Si alguno tiene el mismo email normalizado en ese instante, devuelve `conflict` sin generar secretos ni llamar a Resend. Cualquier error al resolver una cuenta falla cerrado. Esa comparación nunca se ejecuta desde el navegador ni añade email a `public.users`.

Antes de generar secretos, el cliente administrativo cuenta filas de `public.invitations` con `created_at >= now - 1 hora`. Rechaza la solicitud cuando el mismo `invited_by` ya creó tres filas en esa ventana o cuando ya existen tres filas para el mismo `child_id` y email normalizado. Todos los estados cuentan, incluidos accepted, expired y cancelled, para que reemplazar filas no evada el límite. Un error de consulta falla cerrado y no llama a Resend.

Estos límites viven en la Server Action y reducen abuso ordinario, pero no constituyen una cuota transaccional ante solicitudes paralelas para objetivos distintos. Una limitación estricta requeriría ampliar el RPC o añadir infraestructura de rate limiting y queda fuera de esta spec.

### Secretos de invitación

El código usa exactamente seis símbolos elegidos con `crypto.randomBytes()` y muestreo sin sesgo sobre `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Se excluyen `0`, `O`, `1` e `I` para reducir errores de lectura.

El token usa 32 bytes aleatorios y codificación base64url sin padding, por lo que contiene exactamente 43 caracteres de `[A-Za-z0-9_-]`. La URL contiene únicamente el token original. El código se normaliza con `trim().toUpperCase()` antes del HMAC; el token no se transforma. La base recibe `HMAC-SHA256(INVITATION_HASH_SECRET, secret)` en hexadecimal.

La acción captura `issuedAt` una sola vez y calcula `expiresAt = issuedAt + 604800000` milisegundos. `public.invitations.created_at` continúa usando el reloj de PostgreSQL y puede diferir por la latencia de la solicitud; no se usa como origen del cálculo.

### Correo

`lib/email/parent-invitation-email.ts` genera HTML y texto plano sin incorporar `@react-email/render`. El HTML usa estilos inline y una composición compatible con clientes de correo:

- Fondo crema de OpenDayCare.
- Tarjeta blanca con bordes redondeados.
- Encabezado coral con la marca OpenDayCare.
- Saludo con el nombre invitado.
- Nombre del niño y sala.
- Código de seis caracteres como elemento principal.
- Texto `Vence en 7 días`.
- Botón coral `Activar mi cuenta` con URL absoluta basada en `APP_URL`.
- URL visible como alternativa al botón.
- Aviso para ignorar el correo si la invitación no era esperada.

El asunto es `Te invitaron a seguir a {childName} en OpenDayCare`. Los valores dinámicos se escapan antes de incorporarse al HTML.

Resend se invoca con `resend.emails.send(payload, options)` y `options.idempotencyKey` usa `parent-invitation/${invitationId}`. Se comprueban tanto excepciones de transporte como el campo `error` de la respuesta; nunca se registran el payload, el token ni el código. Durante sandbox, el remitente es `OpenDayCare <onboarding@resend.dev>` y la verificación end-to-end usa como email invitado `delivered@resend.dev`.

La idempotency key deduplica únicamente repeticiones de la solicitud correspondiente al mismo UUID. Un nuevo envío iniciado desde la interfaz reemplaza la invitación, obtiene otro UUID y puede producir otro correo; solo los secretos de la invitación más reciente continúan válidos.

Después de recibir `data.id`, la acción actualiza `resend_email_id` y `sent_at` únicamente si la invitación sigue `pending`. Un error, o una actualización que no afecte la invitación esperada, ejecuta una cancelación condicional best-effort y devuelve error. Si esa cancelación persiste, el correo que pudiera haber sido entregado queda inutilizable por estado.

Como PostgreSQL puede seguir inaccesible durante esa cancelación, la aplicación aplica una segunda barrera: todas las consultas de presentación y activación exigen simultáneamente `status = pending`, `resend_email_id IS NOT NULL` y `sent_at IS NOT NULL`. Las acciones de activación comprueban esa condición antes de llamar a `verify_parent_invitation(...)`. Por tanto, una fila de envío indeterminado no se muestra ni se activa aunque la cancelación best-effort no llegue a persistirse.

### DTO de activación

```ts
type ActivationInvitation = {
  status: "valid";
  kidName: string;
  roomLabel: string;
  maskedEmail: string;
  expiresAtLabel: string;
};
```

La carga inicial calcula el digest del token y realiza una consulta administrativa de solo lectura por `token_digest`, envío confirmado, vigencia y niño activo. También resuelve la sala de la misma guardería. No llama a `verify_parent_invitation(...)` sin código porque esa operación contabiliza intentos inválidos. La página nunca recibe `email`, `code_digest`, `token_digest`, `invited_by`, UUID internos ni la fila completa.

El email enmascarado conserva únicamente el primer carácter de la parte local, añade `***` y conserva el dominio; por ejemplo, `lucia@example.com` se muestra como `l***@example.com`. Un token ausente, mal formado, inexistente, vencido o cancelado produce el mismo estado visual genérico sin confirmar si la invitación existió.

Una invitación `accepted` también produce ese estado genérico salvo cuando existe una sesión parent activa cuyo UUID coincide con `accepted_by`. En ese único caso, la página redirige a `/activate-account/success`; esto recupera una respuesta perdida después del commit sin revelar la cuenta aceptante a otro visitante.

El Server Component vincula el token a las Server Actions con `bind`; no lo renderiza como campo oculto ni lo añade al estado devuelto por `useActionState`. El token sigue tratándose como entrada no confiable y su digest se vuelve a verificar dentro de cada acción.

### Alta nueva

```ts
type ActivateNewParentState = {
  attempt: number;
  fieldErrors: Partial<Record<"code" | "password" | "passwordConfirmation", string>>;
  formError?: string;
};
```

El formulario acepta un código de exactamente seis caracteres del alfabeto acordado y lo normaliza a mayúsculas. Primero valida forma, mínimo de ocho caracteres y coincidencia de contraseñas; solo después calcula el digest y consume un intento. Un código bien formado pero incorrecto incrementa el contador exactamente una vez. Contraseña y confirmación nunca forman parte del estado devuelto al cliente.

La Server Action vuelve a verificar token y código mediante `verify_parent_invitation(...)`. Cuando la invitación es válida, ejecuta este orden:

1. Genera `authUserId` con `crypto.randomUUID()`.
2. Ejecuta `prepare_parent_signup(invitationId, authUserId, invitedEmail)` con el cliente administrativo.
3. Llama a `auth.admin.createUser()` pasando `id = authUserId`, `email_confirm = true`, la contraseña, `app_metadata` con `daycare_id`, `role = parent` e `invitation_id`, y `user_metadata` con `full_name`.
4. Deja que `private.handle_new_user()` consuma el claim y cree perfil, vínculo y aceptación dentro de la transacción de Auth.
5. Inicia sesión mediante el cliente SSR y `signInWithPassword()` para escribir las cookies de sesión.
6. Revalida los datos afectados y ejecuta `redirect("/activate-account/success")` fuera del bloque que captura errores.

El navegador nunca envía ni elige `authUserId`, `daycare_id`, rol, `invitation_id`, email completo o nombre persistido. Todos se derivan en servidor desde la invitación verificada.

Si el email ya pertenece a una cuenta, la acción devuelve un mensaje genérico que no confirma ese hecho y muestra el camino `¿Ya tenés cuenta? Iniciar sesión`. Si Auth y el vínculo se crean pero falla el inicio de sesión local, no se revierte la identidad ya confirmada; se ofrece login con retorno exacto a `/activate-account/success` y no se muestra la página de éxito sin una sesión válida.

### Cuenta existente

El enlace de login conserva un parámetro `returnTo`. Solo se aceptan dos destinos reconstruidos por servidor: `/activate-account?token={token}`, con un token que cumpla `[A-Za-z0-9_-]{43}`, y `/activate-account/success` sin query. `LoginPage`, `LoginForm` y `login()` tratan el valor como no confiable y descartan URLs absolutas, URLs con host, backslashes, rutas codificadas alternativas, parámetros extra o cualquier otro pathname. La presencia de cualquier `returnTo`, incluso inválido, aplica `robots: noindex` y `referrer: no-referrer`; solo un valor válido controla el redirect.

Después del login:

- Una sesión parent con el mismo email ve el niño, email enmascarado y campo de código.
- La contraseña no vuelve a solicitarse en la pantalla de activación.
- La Server Action verifica nuevamente sesión, token, código, email, rol, estado y tenant.
- La operación transaccional de SPEC 11 crea el vínculo y acepta la invitación.
- `already_linked` se trata como éxito idempotente después de cancelar condicionalmente la invitación todavía pending.
- Un éxito redirige a `/activate-account/success` conservando la sesión.
- Una sesión incorrecta recibe un mensaje genérico y una acción para cerrar sesión que conserva únicamente el retorno canónico a esa activación.

### Confirmación final

`/activate-account/success` no recibe token, email, niño ni identificadores por query o props. Exige una sesión con perfil `parent` y `active`; una visita anónima vuelve a `/login` mediante el proxy y un staff/admin vuelve a `/`. La página muestra `Cuenta activada`, confirma que el vínculo está listo y ofrece `Ir al inicio` como enlace voluntario a `/`.

La confirmación es el final funcional de esta spec. El inicio actual continúa siendo una demostración con fixtures y no representa todavía un feed parent autorizado por el vínculo recién creado.

### Presentación de padres

`KidParent` admite:

```ts
type ParentStatus = "active" | "pending";

type KidParent = {
  id: string;
  name: string;
  relationship: "Mamá" | "Papá" | "Tutor/a";
  status: ParentStatus;
  avatar: InitialsAvatar;
};

type KidListBadge =
  | { kind: "medical"; label: string }
  | { kind: "pending"; label: "PENDIENTE" }
  | { kind: "link"; label: "VINCULAR" }
  | null;
```

Un parent active proviene de `parent_children` y `users`. Un parent pending proviene de una invitación vigente con envío confirmado. `Kid` añade `activeParentCount` y `hasPendingInvitation` para no inferir conteos desde `parents.length`.

El directorio muestra únicamente `activeParentCount`. La insignia médica mantiene prioridad; sin alergia, una invitación pendiente muestra `PENDIENTE`, la ausencia total de vínculos o invitaciones muestra `VINCULAR`, y un niño con al menos un vínculo activo no muestra una insignia de vínculo. El perfil usa `parents` para presentar las filas active y pending.

### Harness efímero de verificación

La implementación puede separar la orquestación de envío y activación detrás de dependencias mínimas para ejecutar un script local temporal sin añadir una suite ni una dependencia. El harness usa dobles controlados para cubrir:

- Respuesta `error` y excepción de transporte de Resend.
- Resend exitoso seguido por fallo al persistir `resend_email_id`.
- Fallo de cancelación posterior y bloqueo efectivo por ausencia de confirmación de envío.
- Cuarto envío dentro de cada límite horario.
- Dos aceptaciones y múltiples códigos incorrectos concurrentes.
- Variables privadas ausentes o mal formadas sin llamadas externas.

El script usa secretos canario, no imprime payloads sensibles, no se importa desde la aplicación y se elimina antes de revisar el diff final. La prueba real de sandbox se ejecuta aparte contra Resend y Supabase.

Antes del sandbox real se confirma que `delivered@resend.dev` no corresponde a una identidad o invitación preexistente que no pertenezca a la prueba; ante cualquier coincidencia ambigua, la verificación se detiene en vez de borrar datos. El harness conserva en memoria cada UUID creado. La limpieza elimina por esos UUID la invitación y luego la identidad Auth, deja que las cascadas retiren perfil, vínculo y claim, y confirma conteos cero. Esta limpieza técnica es una excepción explícita a la retención histórica de invitaciones reales definida por SPEC 11.

### Referencias visuales

- `referencias/pantallas/vincular-padre.dc.html` para el modal base, sin conservar el bloque de código demostrativo.
- `referencias/pantallas/perfil-nino.dc.html` para filas pending y active.
- `referencias/pantallas/activar-cuenta.dc.html` para composición, tipografía y jerarquía de activación, sustituyendo email editable y consentimiento por los campos reales de esta spec.

La confirmación final reutiliza el lenguaje de `activar-cuenta.dc.html`, pero presenta únicamente marca, título, explicación breve y `Ir al inicio`.

## Archivos

**Archivos nuevos:**

- `utils/supabase/admin.ts`
- `lib/invitations.ts`
- `lib/email/parent-invitation-email.ts`
- `app/(auth)/activate-account/actions.ts`
- `app/(auth)/activate-account/success/page.tsx`
- `types/invitations.ts`

**Archivos existentes que cambian:**

- `.env.template`
- `app/kids/actions.ts`
- `app/actions/auth.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/activate-account/page.tsx`
- `components/auth/account-activation-form.tsx`
- `components/auth/login-form.tsx`
- `components/kids/kid-profile.tsx`
- `components/kids/kid-card.tsx`
- `components/kids/parent-linking.tsx`
- `components/kids/link-parent-modal.tsx`
- `components/kids/linked-parents-card.tsx`
- `lib/kids-data.ts`
- `lib/link-parent-form.ts`
- `types/auth.ts`
- `types/kids.ts`
- `types/database.ts`
- `data/auth.ts`

`utils/supabase/middleware.ts` conserva únicamente `/activate-account` como ruta pública. `/activate-account/success` permanece protegida por la comparación exacta existente. La validación con `getClaims()`, la propagación de cookies y las cabeceras de seguridad de caché no cambian.

No se modifica `package.json` ni `package-lock.json`: `resend@6.26.0` ya está instalado y el correo usará HTML directo.

## Plan de implementación

1. Confirmar que SPEC 11 permanece implementada y que existen `prepare_parent_signup(...)`, las operaciones de invitación y sus grants exclusivos para `service_role`.
2. Regenerar `types/database.ts` desde el esquema desplegado y resolver únicamente incompatibilidades reales de tipos.
3. Crear el cliente administrativo `server-only` sin cookies ni persistencia y validar en inicio diferido las variables privadas requeridas.
4. Crear `types/invitations.ts` y ampliar `types/kids.ts` con Tutor/a, resultados discriminados y DTOs mínimos.
5. Actualizar `lib/link-parent-form.ts` para retirar el código fijo, mantener validadores compartidos y traducir parentescos a valores persistidos.
6. Crear en `lib/invitations.ts` la generación criptográfica, normalización, HMAC, consultas administrativas y mappers de resultados.
7. Crear la plantilla HTML/texto de OpenDayCare con escape de valores, URL absoluta y contenido de siete días.
8. Implementar en `app/kids/actions.ts` autenticación, autorización, validación tenant-aware, detección de vínculo existente, límites horarios, reemplazo transaccional, envío idempotente, confirmación condicional de envío y cancelación ante cualquier fallo.
9. Adaptar `LinkParentModal` y `ParentLinking` para representar pending, bloquear cierres durante el envío, conservar valores ante error y cerrar únicamente después de éxito.
10. Retirar el bloque de código demostrativo del modal porque el secreto se entrega únicamente por correo.
11. Ampliar `lib/kids-data.ts` para consultar en paralelo padres activos e invitaciones pending vigentes con envío confirmado y mapear únicamente datos de presentación.
12. Actualizar `KidProfile`, `KidCard`, `LinkedParentsCard` y el directorio para mostrar active, pending, Tutor/a y conteos persistentes.
13. Reemplazar fixtures de activación por una consulta administrativa server-only de solo lectura basada en el token de `searchParams` asíncrono, sin contabilizar intentos antes de recibir un código.
14. Añadir estados válido e inválido indistinguible a `/activate-account`, junto con `robots: noindex`, referrer `no-referrer` y tratamiento específico para sesión parent o sesión incorrecta.
15. Convertir `AccountActivationForm` en un formulario funcional con `useActionState`, errores asociados, pending y variantes para cuenta nueva o sesión existente.
16. Implementar la acción de cuenta nueva con verificación de invitación, contraseña mínima, confirmación, UUID Auth generado en servidor, `prepare_parent_signup(...)`, `auth.admin.createUser()`, login SSR y redirect seguro.
17. Implementar la acción de cuenta existente con sesión verificada, aceptación transaccional, recuperación de `already_linked` y redirect seguro.
18. Ampliar `LoginPage`, `login()`, `logout()` y `LoginForm` para conservar únicamente los retornos internos validados, aplicar metadata segura y evitar open redirects.
19. Retirar de `data/auth.ts` y `types/auth.ts` la contraseña, código, email y niño demostrativos que dejen de usarse en activación.
20. Crear `/activate-account/success` con guard parent activo, confirmación sin datos sensibles y enlace voluntario al inicio.
21. Crear, ejecutar y eliminar el harness efímero para fallos externos, configuración, límites y concurrencia.
22. Verificar el envío con `delivered@resend.dev`, inspeccionar HTML y texto en Resend y completar ambos caminos de activación.
23. Ejecutar consultas de verificación de filas, estados, vínculo y aislamiento después de cada camino y eliminar todas las fixtures Auth y de dominio del sandbox.
24. Ejecutar lint dirigido, TypeScript y build.
25. Validar modal, activación, login de retorno, confirmación final, estados de error, foco y responsive a 1200 x 800 y 390 x 844.

## Criterios de aceptación

- [ ] Solo staff y admin activos pueden ejecutar la creación de invitaciones.
- [ ] La Server Action vuelve a autenticar y autorizar aunque el perfil ya esté protegido.
- [ ] Un UUID de niño de otro tenant es rechazado.
- [ ] Nombre, email y parentesco se validan nuevamente en servidor.
- [ ] El nombre recortado admite entre 1 y 120 caracteres y el email no supera 254.
- [ ] Un parentesco fuera del conjunto cerrado devuelve un error asociado y no llega al RPC.
- [ ] El email se persiste recortado y en minúsculas.
- [ ] Mamá, Papá y Tutor/a se guardan como mother, father y guardian.
- [ ] Cada invitación genera un token aleatorio de 32 bytes.
- [ ] Cada invitación genera seis caracteres del alfabeto acordado.
- [ ] El ingreso del código no distingue mayúsculas de minúsculas.
- [ ] Token y código solo se guardan como HMAC-SHA256.
- [ ] El código nunca aparece en la URL ni vuelve al navegador staff.
- [ ] El token no se entrega como prop a componentes que no lo necesitan.
- [ ] `expiresAt` está exactamente 604800000 milisegundos después del `issuedAt` capturado por la acción.
- [ ] Reinvitar el mismo email al mismo niño cancela la invitación pendiente anterior.
- [ ] Reinvitar genera código y token nuevos.
- [ ] La cuarta invitación del mismo actor dentro de una hora móvil es rechazada antes de generar secretos.
- [ ] La cuarta invitación para el mismo niño y email dentro de una hora móvil es rechazada aunque cambie el actor.
- [ ] Accepted, expired y cancelled también cuentan para ambos límites.
- [ ] Una cuenta ya vinculada con el niño produce un conflicto claro y no envía correo.
- [ ] La detección del vínculo compara emails Auth únicamente en servidor y no añade email a `public.users`.
- [ ] El envío usa el SDK Resend desde código server-only.
- [ ] La solicitud usa una idempotency key derivada de la invitación.
- [ ] Una respuesta exitosa guarda `resend_email_id` y `sent_at`.
- [ ] Un error de Resend cancela la invitación nueva.
- [ ] Un fallo al guardar la confirmación después de enviar intenta una cancelación condicional y devuelve error sin anunciar éxito.
- [ ] Una invitación pending sin `resend_email_id` o `sent_at` no se muestra ni puede activar una cuenta.
- [ ] Un error mantiene abierto el modal y conserva nombre, email y parentesco.
- [ ] El modal no muestra éxito si falla persistencia o correo.
- [ ] Durante el envío no se aceptan duplicados ni se puede cerrar el modal.
- [ ] Después de éxito el modal se limpia, se cierra y anuncia `Invitación enviada` durante tres segundos.
- [ ] El correo tiene versiones HTML y texto plano.
- [ ] El correo muestra marca, invitado, niño, sala, código, vencimiento y botón de activación.
- [ ] Los valores dinámicos no pueden inyectar HTML en el correo.
- [ ] El botón usa una URL absoluta basada en `APP_URL`.
- [ ] El sandbox envía correctamente a `delivered@resend.dev` y registra el evento en Resend.
- [ ] `/activate-account` continúa accesible sin sesión.
- [ ] La página lee `searchParams` mediante la API asíncrona de Next.js 16.
- [ ] La página no usa fixtures de `data/auth.ts` ni `data/kids.ts`.
- [ ] Un token válido muestra únicamente niño, sala, email enmascarado y vencimiento.
- [ ] Consultar inicialmente un token válido no incrementa `failed_attempts`.
- [ ] Un token inválido, vencido, cancelado o ajeno produce un estado genérico.
- [ ] Un token ya aceptado redirige a éxito solo cuando `accepted_by` coincide con la sesión parent activa.
- [ ] La ruta incluye metadata noindex y no propaga el token mediante referrer externo.
- [ ] La cuenta nueva solicita código, contraseña y confirmación.
- [ ] La activación no permite editar ni enviar un email; usa el email canónico resuelto en servidor.
- [ ] Una contraseña menor de ocho caracteres es rechazada antes de llamar a Auth.
- [ ] Contraseñas distintas muestran un error asociado y no crean una identidad.
- [ ] Un código incorrecto no devuelve datos adicionales ni distingue si falló el código, el estado o la existencia de la invitación.
- [ ] Cada código bien formado pero incorrecto incrementa el contador una sola vez.
- [ ] El décimo intento incorrecto cancela la invitación.
- [ ] Una cuenta nueva se crea con email confirmado y rol parent administrado.
- [ ] La acción genera el UUID Auth en servidor y ejecuta `prepare_parent_signup(...)` antes de `auth.admin.createUser()`.
- [ ] El navegador nunca puede elegir `daycare_id`, rol o `invitation_id` administrativos.
- [ ] `auth.admin.createUser()` recibe el mismo UUID preparado y persiste `daycare_id`, rol e invitación en `app_metadata`.
- [ ] Crear la cuenta produce perfil, vínculo y aceptación atómicos mediante el trigger.
- [ ] Después del alta, `signInWithPassword()` crea la sesión y redirige a `/activate-account/success`.
- [ ] Un email ya registrado muestra un mensaje genérico y el camino de inicio de sesión sin crear duplicados.
- [ ] El login solo acepta una URL interna de activación con token sintácticamente válido o `/activate-account/success` sin query.
- [ ] Una URL absoluta o ruta distinta no puede controlar el redirect de login.
- [ ] El login con retorno de activación usa `noindex` y `no-referrer`.
- [ ] Si falla la sesión después de crear Auth, el login exitoso retorna a `/activate-account/success`.
- [ ] Cerrar una sesión incorrecta conserva únicamente el retorno canónico a la activación.
- [ ] Una cuenta parent existente del mismo email y guardería puede aceptar la invitación.
- [ ] Una cuenta existente usa su `users.full_name` y no sobrescribe su nombre con la invitación.
- [ ] Una cuenta de otro email, rol, estado o guardería no puede aceptar.
- [ ] Una cuenta parent puede aceptar invitaciones para varios niños de su guardería.
- [ ] Una aceptación repetida no crea vínculos duplicados.
- [ ] Ambos caminos exitosos terminan en `/activate-account/success` sin token ni datos personales en la URL.
- [ ] La confirmación exige un parent activo, muestra `Cuenta activada` y ofrece `Ir al inicio` hacia `/`.
- [ ] Una visita anónima a la confirmación vuelve a `/login` y un staff/admin vuelve a `/`.
- [ ] `/kids/[slug]` muestra la invitación vigente como pending inmediatamente después del envío.
- [ ] Después de aceptar, el mismo perfil muestra el parent como active.
- [ ] La tarjeta admite Mamá, Papá y Tutor/a.
- [ ] Invitaciones expired y cancelled no aparecen en la tarjeta.
- [ ] El directorio cuenta únicamente vínculos active.
- [ ] Un niño sin alergias, vínculos ni invitaciones muestra `VINCULAR`.
- [ ] Un niño sin alergias y con invitación pending confirmada muestra `PENDIENTE`, no `VINCULAR`.
- [ ] Una insignia médica conserva prioridad sobre los estados de vínculo.
- [ ] La confirmación final declara terminado el flujo; `Ir al inicio` conduce a la demostración actual sin presentarla como feed parent persistente.
- [ ] El checkbox demostrativo de consentimiento de fotos desaparece de la activación real.
- [ ] Ningún secreto privado usa el prefijo `NEXT_PUBLIC_`.
- [ ] Los valores de `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `INVITATION_HASH_SECRET` no aparecen en `.next/static`, chunks cliente, props, RSC payloads ni respuestas de Server Actions inspeccionadas.
- [ ] Código y contraseña no aparecen en consola ni en logs de Next.js o Supabase durante la ventana de prueba; el token solo aparece donde el contrato lo exige: URL de activación y cuerpo almacenado por Resend.
- [ ] `APP_URL` inválida y secretos privados ausentes producen un error controlado sin intentar enviar correo.
- [ ] `APP_URL` con credenciales, path, query o fragment es rechazada; el enlace final contiene solo origen, `/activate-account` y `token`.
- [ ] `INVITATION_HASH_SECRET` solo acepta base64url sin padding que decodifica exactamente 32 bytes.
- [ ] A 1200 x 800, modal, perfil y activación conservan el lenguaje visual aprobado.
- [ ] A 390 x 844 no hay scroll horizontal, campos recortados ni acciones inaccesibles.
- [ ] Se revisan modal idle/pending/error/success, activación válida/inválida/cuenta existente y confirmación final contra las tres referencias declaradas.
- [ ] Errores y éxitos se anuncian mediante regiones accesibles y el foco llega al primer campo inválido.
- [ ] La consola no muestra errores producidos por los flujos cubiertos.
- [ ] El harness efímero cubre fallos de Resend, persistencia posterior, cancelación, configuración, límites y concurrencia, y no queda en el worktree final.
- [ ] La prueba sandbox termina sin identidades Auth, perfiles, vínculos, invitaciones o claims técnicos residuales.
- [ ] `npm run lint -- app components data types lib utils` finaliza correctamente.
- [ ] `npx tsc --noEmit` finaliza correctamente.
- [ ] `npm run build` finaliza correctamente.
- [ ] `package.json` y `package-lock.json` no cambian.

## Decisiones

- **Sí:** dividir persistencia/seguridad y aplicación/correo en SPEC 11 y SPEC 12.
- **Sí:** mantener emisión, correo y activación dentro de una sola SPEC 12 para verificar el recorrido completo, aunque abarque varias áreas de aplicación.
- **Sí:** conservar `/activate-account` porque ya es la ruta pública implementada y enlazada.
- **No:** añadir `/activate` o una ruta de registro independiente.
- **Sí:** usar enlace con token opaco y pedir además un código corto.
- **No:** resolver una invitación solo por código y email.
- **Sí:** seis caracteres en mayúsculas sin símbolos visualmente ambiguos y siete días de vigencia.
- **Sí:** limitar a tres invitaciones por actor y tres por niño/email durante una hora móvil usando el historial persistido.
- **No:** añadir infraestructura o una migración para una cuota estrictamente transaccional en esta etapa.
- **Sí:** aceptar minúsculas normalizando antes de verificar.
- **Sí:** entregar el código únicamente por correo.
- **No:** devolver el secreto al modal staff.
- **Sí:** usar Server Actions para mutaciones originadas por formularios propios de la aplicación.
- **No:** crear Route Handlers porque no existe un consumidor externo.
- **Sí:** aislar el cliente administrativo en un módulo `server-only` y mantener la ruta pública sin grants anónimos.
- **Sí:** crear y confirmar administrativamente la cuenta después de demostrar acceso a la invitación.
- **Sí:** generar el UUID Auth y preparar un claim privado antes de `createUser()` porque el servicio alojado aplica `app_metadata` después del insert que dispara el trigger.
- **No:** copiar rol, guardería o invitación a `user_metadata`; es editable por el usuario y no constituye una frontera de autorización.
- **No:** enviar un segundo correo de confirmación de Supabase Auth.
- **Sí:** iniciar sesión y redirigir a `/activate-account/success` después del alta o aceptación.
- **No:** redirigir automáticamente al inicio; `Ir al inicio` queda como acción voluntaria mientras no existe un feed parent persistente.
- **No:** añadir un marcador flash de activación; `Cuenta activada` sigue siendo verdadero para cualquier perfil parent activo que abra directamente la confirmación.
- **No:** ampliar ahora el feed familiar persistente.
- **Sí:** una cuenta existente inicia sesión y acepta la invitación sin crear otra identidad.
- **Sí:** usar el nombre persistido de una cuenta existente como identidad canónica.
- **No:** aceptar cuentas existentes de otra guardería mientras `users.daycare_id` sea singular.
- **Sí:** contraseña mínima de ocho caracteres y confirmación coincidente.
- **No:** imponer mayúsculas, números o símbolos obligatorios que penalicen frases de contraseña.
- **Sí:** cancelar una invitación nueva cuando Resend responde con error y permitir otro intento completo.
- **Sí:** cancelar también cuando el correo fue aceptado pero no puede persistirse su identificador; un enlace entregado no debe quedar válido sin trazabilidad.
- **Sí:** usar idempotencia de Resend para deduplicar repeticiones del mismo UUID de invitación.
- **No:** asumir que esa clave deduplica una reinvitación; una fila nueva usa una clave nueva y el correo anterior queda inválido.
- **Sí:** usar HTML directo y texto plano con la dependencia ya instalada.
- **No:** añadir `@react-email/render` o una biblioteca de plantillas.
- **Sí:** retirar el consentimiento de fotos de este flujo porque el modelo actual no representa decisiones por tutor.
- **Sí:** probar inicialmente con `delivered@resend.dev`.
- **Sí:** eliminar todas las fixtures Auth y de dominio después de la prueba sandbox.
- **No:** considerar el sandbox apto para producción; un dominio verificado es requisito previo al envío real.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una clave administrativa importada desde cliente expondría toda la base. | Encapsularla en `utils/supabase/admin.ts` con `server-only`, no prefijarla con `NEXT_PUBLIC_` y revisar bundles y props. |
| El token puede aparecer en historial o logs de infraestructura. | Usar alta entropía, digest en base, un solo uso, siete días, `no-referrer`, no incluir recursos externos y no colocar el código en la URL. |
| Un código de seis caracteres puede atacarse por fuerza bruta. | Exigir también el token de 32 bytes, limitar a diez intentos y devolver errores genéricos. |
| Resend y PostgreSQL no comparten una transacción distribuida. | Persistir primero, enviar con idempotencia y cancelar la invitación cuando la API devuelve error. |
| Una respuesta de red ambigua puede haber enviado el correo aunque la aplicación reciba un fallo. | Mantener una idempotency key estable para esa fila, ocultar invitaciones sin confirmación persistida y hacer inválida la fila cancelada aunque llegue un correo tardío. |
| Dos operadores pueden reemplazar simultáneamente la misma invitación mientras uno de los correos está en tránsito. | Confirmar el envío solo si la invitación sigue pending; cualquier correo de una fila reemplazada apunta a una invitación inválida y la acción no anuncia éxito. |
| Solicitudes paralelas para objetivos distintos pueden superar el límite consultado por la aplicación. | Fallar cerrado al contar, conservar el límite como mitigación inicial y reservar una cuota transaccional para una spec de endurecimiento si aparece abuso real. |
| Rotar `INVITATION_HASH_SECRET` invalida invitaciones pendientes. | Documentar la rotación como revocación global y emitir invitaciones nuevas después de cambiarlo. |
| El sandbox no entrega invitaciones a usuarios reales arbitrarios. | Verificar con `delivered@resend.dev` y exigir dominio verificado antes del despliegue productivo. |
| El login con retorno puede convertirse en open redirect. | Aceptar únicamente la ruta local exacta de activación y reconstruir el destino en servidor. |
| Un claim preparado puede quedar después de un fallo de Auth. | Mantener su expiración de diez minutos y dejar que un nuevo intento para la misma invitación lo reemplace. |
| Un error después de crear Auth podría dejar una cuenta sin sesión. | Hacer atómicos perfil/vínculo/aceptación en el trigger, no mostrar la confirmación y ofrecer login normal si solo falla la sesión local. |
| La confirmación podría usarse como una ruta pública engañosa. | Exigir un perfil parent activo y no recibir estado de éxito mediante query parameters controlables por el visitante. |
| Consultar padres e invitaciones puede añadir N+1 al listado. | Cargar conjuntos por tenant en consultas agrupadas y mapearlos por `child_id` en memoria. |
| Comprobar el email Auth de cada parent ya vinculado añade llamadas administrativas por vínculo. | Limitar la consulta al niño actual, resolver en paralelo, fallar cerrado y mover la comprobación a PostgreSQL si la cardinalidad deja de ser pequeña. |

## Qué **no** incluye esta spec

- Dominio verificado, webhooks o monitoreo de entregabilidad de Resend.
- Lectura anónima de tablas o RPCs de activación públicos.
- Supabase Auth OTP, magic links o correo de confirmación adicional.
- Ruta `/activate`, `/signup` o API externa.
- Feed parent persistente o autorización de lectura sobre niños y publicaciones.
- Consentimiento de fotos por parent.
- Cuentas multi-guardería.
- Reenvío, revocación o historial visible de invitaciones.
- Pruebas automatizadas o dependencias nuevas.

Cada capacidad excluida requiere una spec posterior antes de implementarse.
