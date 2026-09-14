## Purpose

Define cómo un padre invitado convierte el enlace de activación recibido por correo en un vínculo con el niño, distinguiendo entre quien todavía no tiene cuenta y quien ya la tiene, sin revelar la existencia de cuentas a terceros.

## ADDED Requirements

### Requirement: Enrutamiento de la activación según la existencia de la cuenta invitada

Al abrir un enlace de activación vigente sin sesión iniciada, el sistema SHALL determinar si el email invitado corresponde a una cuenta de autenticación existente y presentar el camino correspondiente: alta de cuenta cuando no existe, o inicio de sesión cuando existe. Esta determinación SHALL ocurrir después de validar el token y SHALL NOT consumir intentos de código de la invitación.

#### Scenario: Invitado sin cuenta abre el enlace sin sesión

- **WHEN** un visitante anónimo abre un enlace de activación vigente cuyo email invitado no tiene cuenta
- **THEN** el sistema muestra el formulario de alta con código, contraseña y confirmación de contraseña
- **AND** muestra el email invitado enmascarado sin permitir editarlo

#### Scenario: Invitado con cuenta abre el enlace sin sesión

- **WHEN** un visitante anónimo abre un enlace de activación vigente cuyo email invitado ya tiene cuenta
- **THEN** el sistema lo envía a iniciar sesión en lugar de pedirle crear una contraseña
- **AND** conserva como destino de retorno esa misma activación

#### Scenario: El enlace inválido no revela existencia de cuenta

- **WHEN** un visitante abre un enlace de activación ausente, mal formado, inexistente, vencido, cancelado o sin envío confirmado
- **THEN** el sistema muestra el mismo estado genérico de invitación no disponible
- **AND** no consulta ni revela si el email invitado tiene cuenta

### Requirement: Retorno a la activación después del inicio de sesión

Cuando el sistema envía a un invitado a iniciar sesión desde una activación en curso, SHALL conservar únicamente el retorno canónico a esa activación y SHALL rechazar cualquier otro destino recibido como entrada.

#### Scenario: El invitado con cuenta completa el vínculo tras iniciar sesión

- **WHEN** el invitado enviado a iniciar sesión se autentica con éxito con la cuenta del email invitado
- **THEN** el sistema lo devuelve a la activación de origen
- **AND** le solicita únicamente el código de la invitación, sin volver a pedir contraseña

#### Scenario: Destino de retorno manipulado

- **WHEN** la pantalla de inicio de sesión recibe un destino de retorno que no es la activación canónica de un token bien formado
- **THEN** el sistema descarta ese destino
- **AND** completa el inicio de sesión en el destino predeterminado de la aplicación

#### Scenario: La cuenta existente no corresponde a la invitación

- **WHEN** la sesión iniciada pertenece a otro email, a otro rol, a otra guardería o a un perfil inactivo
- **THEN** el sistema no vincula al niño
- **AND** muestra un mensaje genérico con una salida que conserva el retorno a esa misma activación

### Requirement: Consulta de existencia restringida al servidor

La consulta que resuelve si un email tiene cuenta SHALL ejecutarse exclusivamente en el servidor con credenciales administrativas, SHALL devolver únicamente si existe o no una cuenta, y SHALL NOT exponer rol, estado, guardería ni ningún otro dato de esa cuenta. Un fallo de la consulta SHALL fallar cerrado sin mostrar el formulario de alta.

#### Scenario: La consulta no es alcanzable desde el cliente

- **WHEN** un cliente autenticado o anónimo intenta ejecutar la consulta de existencia directamente
- **THEN** la base de datos rechaza la ejecución por falta de privilegios

#### Scenario: La consulta de existencia falla

- **WHEN** la consulta de existencia devuelve un error al resolver un enlace de activación vigente
- **THEN** el sistema no muestra el formulario de alta
- **AND** muestra un estado de error genérico sin revelar la causa

### Requirement: El alta de cuenta nueva no deja reservas huérfanas

El sistema SHALL comprobar de nuevo la existencia de la cuenta al procesar el alta, antes de reservar cualquier identificador o claim de alta, y SHALL detener el alta cuando la cuenta ya exista.

#### Scenario: La cuenta nace entre la carga de la página y el envío del formulario

- **WHEN** el invitado envía el formulario de alta y su email ya tiene cuenta en ese momento
- **THEN** el sistema detiene el alta sin reservar identificador ni claim
- **AND** muestra un mensaje que ofrece iniciar sesión conservando el retorno a esa activación

### Requirement: El staff no recibe señales sobre cuentas existentes

El envío de una invitación SHALL comportarse igual sea cual sea la existencia de una cuenta para el email invitado, y el resultado mostrado al staff SHALL NOT permitir deducirla.

#### Scenario: Staff invita a un email que ya tiene cuenta

- **WHEN** un staff o admin envía una invitación a un email que ya tiene cuenta en la plataforma
- **THEN** el sistema envía la invitación y muestra la misma confirmación que para cualquier otro email
- **AND** el niño muestra la misma insignia de invitación pendiente
