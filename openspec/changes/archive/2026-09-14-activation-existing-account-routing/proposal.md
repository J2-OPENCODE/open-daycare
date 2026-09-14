## Why

Un padre invitado que ya tiene cuenta en OpenDayCare recibe hoy la misma pantalla que un padre nuevo: `/activate-account` decide qué formulario mostrar únicamente por el estado de sesión, así que a todo visitante anónimo le pide crear una contraseña. El invitado escribe una contraseña que no puede usarse, gasta uno de los diez intentos de código de la invitación, deja un claim de alta huérfano y recibe un error genérico cuyo enlace de login pierde el retorno a la activación, de modo que debe volver al correo y reabrir el enlace por su cuenta.

## What Changes

- La página de activación resuelve, con el token ya validado y antes de elegir formulario, si el email invitado corresponde a una cuenta de Auth existente.
- Un visitante anónimo cuyo email invitado no tiene cuenta sigue viendo el formulario de alta con código, contraseña y confirmación. Su comportamiento no cambia.
- Un visitante anónimo cuyo email invitado ya tiene cuenta es enviado a iniciar sesión conservando el retorno canónico a esa misma activación, y al volver completa la vinculación con el código solo.
- Se añade una función de base de datos ejecutable únicamente por `service_role` que responde la existencia de una cuenta a partir del email normalizado, porque `public.users` no almacena email por diseño.
- El enlace de inicio de sesión del formulario de activación conserva el retorno a la activación en curso.
- La acción de alta vuelve a comprobar la existencia antes de reservar el identificador de Auth, para no dejar un claim huérfano cuando la cuenta nace entre la carga de la página y el envío del formulario.
- La creación y el envío de la invitación no cambian, y el staff no recibe ninguna señal nueva sobre la existencia de la cuenta invitada.

## Capabilities

### New Capabilities
- `parent-activation`: activación de la invitación de vinculación desde el enlace del correo, incluyendo el enrutamiento entre alta de cuenta nueva y autorización de una cuenta existente.

### Modified Capabilities

## Impact

- `app/(auth)/activate-account/page.tsx`: la rama de visitante anónimo deja de asumir cuenta nueva.
- `app/(auth)/activate-account/actions.ts`: comprobación previa en la acción de alta.
- `components/auth/account-activation-form.tsx`: el enlace de inicio de sesión conserva el retorno.
- `components/auth/activation-unavailable.tsx`: componente nuevo con el estado de error cerrado que se muestra cuando la consulta de existencia falla, separado del enlace no disponible porque el fallo es transitorio y no debe pedir una invitación nueva.
- `lib/invitations.ts`: nueva consulta de existencia junto a las utilidades de invitación existentes.
- Base de datos: función nueva sobre `auth.users`, con privilegios restringidos a `service_role`, documentada bajo `specs/database/`.
- Sin cambios en `createParentInvitation`, en el correo de invitación ni en el modal de staff.
