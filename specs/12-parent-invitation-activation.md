# SPEC 12 — Invitación y activación de cuentas parent

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 10, SPEC 11
> **Fecha:** 2026-09-08
> **Objetivo:** Convertir la vinculación simulada en un flujo completo que envíe una invitación con Resend, active o autentique al parent y muestre su vínculo persistente con el niño.

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
- Configurar siete días de vigencia desde el instante de creación.
- Reemplazar una invitación pendiente del mismo email y niño con token y código nuevos.
- Enviar el correo con el SDK Node.js de Resend ya instalado.
- Usar el UUID de la invitación como base de la clave de idempotencia de Resend.
- Guardar `resend_email_id` y `sent_at` después de una respuesta exitosa.
- Cancelar la invitación y mostrar un error si Resend devuelve un error.
- Mantener abierto el modal y conservar sus valores cuando falle validación, Supabase o Resend.
- No devolver ni mostrar al staff el código o token después del envío.
- Mostrar `Invitación enviada` únicamente después de persistencia y respuesta exitosa de Resend.
- Consultar padres activos e invitaciones pendientes desde Supabase en `/kids` y `/kids/[slug]`.
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
- Solicitar código, contraseña y confirmación de contraseña para una cuenta nueva.
- Exigir una contraseña de al menos ocho caracteres sin reglas arbitrarias de composición.
- Comparar contraseña y confirmación únicamente durante el envío y no persistirlas en estado de aplicación.
- Crear cuentas nuevas mediante `auth.admin.createUser()` exclusivamente desde servidor.
- Establecer `email_confirm: true` porque el acceso al correo se prueba mediante la invitación.
- Pasar `daycare_id`, `role = parent` e `invitation_id` mediante `app_metadata` administrativa.
- Pasar `full_name` mediante `user_metadata` descriptiva.
- Iniciar sesión con la contraseña creada después del alta atómica.
- Redirigir a `/` después de crear y vincular la cuenta.
- Permitir que una cuenta parent existente inicie sesión y vuelva a la invitación.
- Preservar únicamente un destino interno validado durante el login para evitar redirecciones abiertas.
- Permitir a una cuenta parent existente de la misma guardería aceptar otro niño.
- Usar el nombre existente de `public.users` después de aceptar.
- Rechazar una sesión con email distinto, otro rol, estado inactivo u otra guardería.
- Cancelar la invitación al alcanzar diez códigos incorrectos.
- Conservar el proxy de refresco de sesión y sus cookies y cabeceras actuales.
- Añadir metadata `noindex` y una política de referrer que no propague el token a destinos externos.
- Crear una versión HTML y otra de texto plano del correo.
- Reproducir en el correo el lenguaje visual cálido de OpenDayCare sin recursos remotos obligatorios.
- Probar el envío inicial con `OpenDayCare <onboarding@resend.dev>` y `delivered@resend.dev`.
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

## Modelo de aplicación

### Configuración de servidor

`.env.template` documenta:

```text
RESEND_API_KEY=...
RESEND_FROM_EMAIL=OpenDayCare <onboarding@resend.dev>
APP_URL=http://localhost:3000
INVITATION_HASH_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Ninguna de estas variables usa el prefijo `NEXT_PUBLIC_`. `INVITATION_HASH_SECRET` debe contener al menos 32 bytes aleatorios y su rotación invalida invitaciones pendientes anteriores.

`utils/supabase/admin.ts` importa `server-only`, usa `SUPABASE_SERVICE_ROLE_KEY` y desactiva persistencia y refresco de sesión. Este cliente no recibe cookies del visitante y no se importa desde componentes de cliente.

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
  | { status: "invalid"; errors: Partial<Record<"parentName" | "email", string>> }
  | { status: "conflict"; message: string }
  | { status: "error"; message: string };
```

El resultado nunca incluye código, token, digests, email completo, identificadores internos ni respuestas crudas de Supabase o Resend.

### Secretos de invitación

El código usa exactamente seis símbolos elegidos con `crypto.randomBytes()` y muestreo sin sesgo sobre `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. Se excluyen `0`, `O`, `1` e `I` para reducir errores de lectura.

El token usa 32 bytes aleatorios y codificación base64url. La URL contiene únicamente el token original. La base recibe `HMAC-SHA256(INVITATION_HASH_SECRET, normalizedSecret)` en hexadecimal.

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

Resend se invoca con una idempotency key derivada del UUID de invitación. Durante sandbox, el remitente es `OpenDayCare <onboarding@resend.dev>` y la verificación end-to-end usa como email invitado `delivered@resend.dev`.

### DTO de activación

```ts
type ActivationInvitation = {
  kidName: string;
  roomLabel: string;
  maskedEmail: string;
  expiresAtLabel: string;
};
```

La página nunca recibe `email`, `code_digest`, `token_digest`, `invited_by` ni la fila completa. Un token inválido produce un estado visual genérico sin confirmar si existió una invitación.

### Alta nueva

```ts
type ActivateNewParentState = {
  attempt: number;
  fieldErrors: Partial<Record<"code" | "password" | "passwordConfirmation", string>>;
  formError?: string;
};
```

La Server Action vuelve a verificar token y código, llama a `auth.admin.createUser()` con email confirmado y metadata administrativa, deja que `private.handle_new_user()` cree el vínculo y después usa el cliente SSR para `signInWithPassword()`. El redirect a `/` ocurre fuera del bloque que captura errores.

Si el email ya pertenece a una cuenta, la acción no revela detalles adicionales y dirige al camino `Ya tenés cuenta? Iniciar sesión`.

### Cuenta existente

El enlace de login conserva un parámetro interno que vuelve exclusivamente a `/activate-account?token={token}`. `login()` valida el destino contra ese patrón exacto antes de redirigir y descarta cualquier URL absoluta, host externo o ruta no permitida.

Después del login:

- Una sesión parent con el mismo email ve el niño, email enmascarado y campo de código.
- La contraseña no vuelve a solicitarse en la pantalla de activación.
- La Server Action verifica nuevamente sesión, token, código, email, rol, estado y tenant.
- La operación transaccional de SPEC 11 crea el vínculo y acepta la invitación.
- Un éxito redirige a `/`.
- Una sesión incorrecta recibe un mensaje genérico y una acción para cerrar sesión.

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
```

Un parent active proviene de `parent_children` y `users`. Un parent pending proviene de una invitación vigente. El directorio cuenta únicamente vínculos activos, pero no muestra VINCULAR como estado vacío cuando existe al menos una invitación pendiente vigente.

## Archivos

**Archivos nuevos:**

- `utils/supabase/admin.ts`
- `lib/invitations.ts`
- `lib/email/parent-invitation-email.ts`
- `app/(auth)/activate-account/actions.ts`
- `types/invitations.ts`

**Archivos existentes que cambian:**

- `.env.template`
- `app/kids/actions.ts`
- `app/actions/auth.ts`
- `app/(auth)/activate-account/page.tsx`
- `components/auth/account-activation-form.tsx`
- `components/auth/login-form.tsx`
- `components/kids/kid-profile.tsx`
- `components/kids/parent-linking.tsx`
- `components/kids/link-parent-modal.tsx`
- `components/kids/linked-parents-card.tsx`
- `lib/kids-data.ts`
- `lib/link-parent-form.ts`
- `types/auth.ts`
- `types/kids.ts`
- `types/database.ts`
- `data/auth.ts`

`utils/supabase/middleware.ts` conserva `/activate-account` como ruta pública y mantiene intacta la validación con `getClaims()`, la propagación de cookies y las cabeceras de seguridad de caché. Solo se modificará si la implementación demuestra que el retorno autenticado necesita ajustar una comparación exacta existente.

No se modifica `package.json` ni `package-lock.json`: `resend@6.26.0` ya está instalado y el correo usará HTML directo.

## Plan de implementación

1. Implementar y verificar SPEC 11 antes de cambiar el flujo de aplicación.
2. Regenerar `types/database.ts` desde el esquema desplegado y resolver únicamente incompatibilidades reales de tipos.
3. Crear el cliente administrativo `server-only` sin cookies ni persistencia y validar en inicio diferido las variables privadas requeridas.
4. Crear `types/invitations.ts` y ampliar `types/kids.ts` con Tutor/a, resultados discriminados y DTOs mínimos.
5. Actualizar `lib/link-parent-form.ts` para retirar el código fijo, mantener validadores compartidos y traducir parentescos a valores persistidos.
6. Crear en `lib/invitations.ts` la generación criptográfica, normalización, HMAC, consultas administrativas y mappers de resultados.
7. Crear la plantilla HTML/texto de OpenDayCare con escape de valores, URL absoluta y contenido de siete días.
8. Implementar en `app/kids/actions.ts` autenticación, autorización, validación tenant-aware, reemplazo transaccional, envío idempotente y cancelación ante error.
9. Adaptar `LinkParentModal` y `ParentLinking` para representar pending, bloquear cierres durante el envío, conservar valores ante error y cerrar únicamente después de éxito.
10. Retirar el bloque de código demostrativo del modal porque el secreto se entrega únicamente por correo.
11. Ampliar `lib/kids-data.ts` para consultar en paralelo padres activos e invitaciones pendientes vigentes y mapear únicamente datos de presentación.
12. Actualizar `KidProfile`, `LinkedParentsCard` y el directorio para mostrar active, pending, Tutor/a y conteos persistentes.
13. Reemplazar fixtures de activación por una consulta administrativa server-only basada en el token de `searchParams` asíncrono.
14. Añadir estados válido, inválido y ya consumido a `/activate-account`, junto con metadata noindex y referrer seguro.
15. Convertir `AccountActivationForm` en un formulario funcional con `useActionState`, errores asociados, pending y variantes para cuenta nueva o sesión existente.
16. Implementar la acción de cuenta nueva con verificación de invitación, contraseña mínima, confirmación, `auth.admin.createUser()`, login SSR y redirect.
17. Implementar la acción de cuenta existente con sesión verificada y aceptación transaccional.
18. Ampliar `login()` y `LoginForm` para conservar un retorno interno validado sin permitir open redirects.
19. Retirar de `data/auth.ts` y `types/auth.ts` la contraseña, código, email y niño demostrativos que dejen de usarse en activación.
20. Verificar el envío con `delivered@resend.dev`, inspeccionar el correo en Resend y completar ambos caminos de activación.
21. Ejecutar consultas de verificación de filas, estados, vínculo y aislamiento después de cada camino.
22. Ejecutar lint dirigido, TypeScript y build.
23. Validar modal, activación, login de retorno, estados de error, foco y responsive a 1200 x 800 y 390 x 844.

## Criterios de aceptación

- [ ] Solo staff y admin activos pueden ejecutar la creación de invitaciones.
- [ ] La Server Action vuelve a autenticar y autorizar aunque el perfil ya esté protegido.
- [ ] Un UUID de niño de otro tenant es rechazado.
- [ ] Nombre, email y parentesco se validan nuevamente en servidor.
- [ ] El email se persiste recortado y en minúsculas.
- [ ] Mamá, Papá y Tutor/a se guardan como mother, father y guardian.
- [ ] Cada invitación genera un token aleatorio de 32 bytes.
- [ ] Cada invitación genera seis caracteres del alfabeto acordado.
- [ ] El ingreso del código no distingue mayúsculas de minúsculas.
- [ ] Token y código solo se guardan como HMAC-SHA256.
- [ ] El código nunca aparece en la URL ni vuelve al navegador staff.
- [ ] El token no se entrega como prop a componentes que no lo necesitan.
- [ ] Una invitación vence exactamente siete días después de crearse.
- [ ] Reinvitar el mismo email al mismo niño cancela la invitación pendiente anterior.
- [ ] Reinvitar genera código y token nuevos.
- [ ] Una cuenta ya vinculada con el niño produce un conflicto claro y no envía correo.
- [ ] El envío usa el SDK Resend desde código server-only.
- [ ] La solicitud usa una idempotency key derivada de la invitación.
- [ ] Una respuesta exitosa guarda `resend_email_id` y `sent_at`.
- [ ] Un error de Resend cancela la invitación nueva.
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
- [ ] Un token inválido, vencido, cancelado o ajeno produce un estado genérico.
- [ ] La ruta incluye metadata noindex y no propaga el token mediante referrer externo.
- [ ] La cuenta nueva solicita código, contraseña y confirmación.
- [ ] Una contraseña menor de ocho caracteres es rechazada antes de llamar a Auth.
- [ ] Contraseñas distintas muestran un error asociado y no crean una identidad.
- [ ] Un código incorrecto no revela email, niño, estado ni existencia de la invitación.
- [ ] Cada código incorrecto incrementa el contador una sola vez.
- [ ] El décimo intento incorrecto cancela la invitación.
- [ ] Una cuenta nueva se crea con email confirmado y rol parent administrado.
- [ ] El navegador nunca puede elegir `daycare_id`, rol o `invitation_id` administrativos.
- [ ] Crear la cuenta produce perfil, vínculo y aceptación atómicos mediante el trigger.
- [ ] Después del alta, `signInWithPassword()` crea la sesión y redirige a `/`.
- [ ] Un email ya registrado dirige al camino de inicio de sesión sin crear duplicados.
- [ ] El login solo acepta retorno a la invitación interna actual.
- [ ] Una URL absoluta o ruta distinta no puede controlar el redirect de login.
- [ ] Una cuenta parent existente del mismo email y guardería puede aceptar la invitación.
- [ ] Una cuenta existente usa su `users.full_name` y no sobrescribe su nombre con la invitación.
- [ ] Una cuenta de otro email, rol, estado o guardería no puede aceptar.
- [ ] Una cuenta parent puede aceptar invitaciones para varios niños de su guardería.
- [ ] Una aceptación repetida no crea vínculos duplicados.
- [ ] `/kids/[slug]` muestra la invitación vigente como pending inmediatamente después del envío.
- [ ] Después de aceptar, el mismo perfil muestra el parent como active.
- [ ] La tarjeta admite Mamá, Papá y Tutor/a.
- [ ] Invitaciones expired y cancelled no aparecen en la tarjeta.
- [ ] El directorio cuenta únicamente vínculos active.
- [ ] Un niño con invitación pending no se presenta como completamente desvinculado.
- [ ] El inicio actual permanece como destino posterior sin implementar un feed parent persistente.
- [ ] El checkbox demostrativo de consentimiento de fotos desaparece de la activación real.
- [ ] Ningún secreto privado usa el prefijo `NEXT_PUBLIC_`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY` no aparecen en bundles, props, logs ni respuestas.
- [ ] A 1200 x 800, modal, perfil y activación conservan el lenguaje visual aprobado.
- [ ] A 390 x 844 no hay scroll horizontal, campos recortados ni acciones inaccesibles.
- [ ] Errores y éxitos se anuncian mediante regiones accesibles y el foco llega al primer campo inválido.
- [ ] La consola no muestra errores producidos por los flujos cubiertos.
- [ ] `npm run lint -- app components data types lib utils` finaliza correctamente.
- [ ] `npx tsc --noEmit` finaliza correctamente.
- [ ] `npm run build` finaliza correctamente.
- [ ] `package.json` y `package-lock.json` no cambian.

## Decisiones

- **Sí:** dividir persistencia/seguridad y aplicación/correo en SPEC 11 y SPEC 12.
- **Sí:** conservar `/activate-account` porque ya es la ruta pública implementada y enlazada.
- **No:** añadir `/activate` o una ruta de registro independiente.
- **Sí:** usar enlace con token opaco y pedir además un código corto.
- **No:** resolver una invitación solo por código y email.
- **Sí:** seis caracteres en mayúsculas sin símbolos visualmente ambiguos y siete días de vigencia.
- **Sí:** aceptar minúsculas normalizando antes de verificar.
- **Sí:** entregar el código únicamente por correo.
- **No:** devolver el secreto al modal staff.
- **Sí:** usar Server Actions para mutaciones originadas por formularios propios de la aplicación.
- **No:** crear Route Handlers porque no existe un consumidor externo.
- **Sí:** aislar el cliente administrativo en un módulo `server-only` y mantener la ruta pública sin grants anónimos.
- **Sí:** crear y confirmar administrativamente la cuenta después de demostrar acceso a la invitación.
- **No:** enviar un segundo correo de confirmación de Supabase Auth.
- **Sí:** iniciar sesión y redirigir al inicio actual después del alta.
- **No:** ampliar ahora el feed familiar persistente.
- **Sí:** una cuenta existente inicia sesión y acepta la invitación sin crear otra identidad.
- **Sí:** usar el nombre persistido de una cuenta existente como identidad canónica.
- **No:** aceptar cuentas existentes de otra guardería mientras `users.daycare_id` sea singular.
- **Sí:** contraseña mínima de ocho caracteres y confirmación coincidente.
- **No:** imponer mayúsculas, números o símbolos obligatorios que penalicen frases de contraseña.
- **Sí:** cancelar una invitación nueva cuando Resend responde con error y permitir otro intento completo.
- **Sí:** usar idempotencia de Resend para reducir duplicados durante reintentos de red.
- **Sí:** usar HTML directo y texto plano con la dependencia ya instalada.
- **No:** añadir `@react-email/render` o una biblioteca de plantillas.
- **Sí:** retirar el consentimiento de fotos de este flujo porque el modelo actual no representa decisiones por tutor.
- **Sí:** probar inicialmente con `delivered@resend.dev`.
- **No:** considerar el sandbox apto para producción; un dominio verificado es requisito previo al envío real.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una clave administrativa importada desde cliente expondría toda la base. | Encapsularla en `utils/supabase/admin.ts` con `server-only`, no prefijarla con `NEXT_PUBLIC_` y revisar bundles y props. |
| El token puede aparecer en historial o logs de infraestructura. | Usar alta entropía, digest en base, un solo uso, siete días, `no-referrer`, no incluir recursos externos y no colocar el código en la URL. |
| Un código de seis caracteres puede atacarse por fuerza bruta. | Exigir también el token de 32 bytes, limitar a diez intentos y devolver errores genéricos. |
| Resend y PostgreSQL no comparten una transacción distribuida. | Persistir primero, enviar con idempotencia y cancelar la invitación cuando la API devuelve error. |
| Una respuesta de red ambigua puede haber enviado el correo aunque la aplicación reciba un fallo. | Usar idempotency key estable y hacer que una invitación cancelada sea inválida aunque llegue un correo tardío. |
| Rotar `INVITATION_HASH_SECRET` invalida invitaciones pendientes. | Documentar la rotación como revocación global y emitir invitaciones nuevas después de cambiarlo. |
| El sandbox no entrega invitaciones a usuarios reales arbitrarios. | Verificar con `delivered@resend.dev` y exigir dominio verificado antes del despliegue productivo. |
| El login con retorno puede convertirse en open redirect. | Aceptar únicamente la ruta local exacta de activación y reconstruir el destino en servidor. |
| Un error después de crear Auth podría dejar una cuenta sin sesión. | Hacer atómicos perfil/vínculo/aceptación en el trigger; permitir login normal si solo falla la creación local de sesión. |
| Consultar padres e invitaciones puede añadir N+1 al listado. | Cargar conjuntos por tenant en consultas agrupadas y mapearlos por `child_id` en memoria. |

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
