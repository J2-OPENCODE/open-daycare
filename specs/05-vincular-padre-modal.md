# SPEC 05 — Modal para vincular padre

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 04
> **Fecha:** 2026-09-04
> **Objetivo:** Implementar en `/kids/[id]` un modal responsive para validar y simular la invitación de otro padre, con confirmación visual y sin persistencia ni envío real.

## Por qué existe esta spec

SPEC 02 dejó Vincular otro padre visible pero deshabilitado porque no existía un contrato para el formulario ni su comportamiento. SPEC 04 incorporó un patrón accesible de modal y aviso de éxito que esta funcionalidad debe reutilizar sin duplicar responsabilidades.

## Alcance

**Incluye:**

- Habilitar el botón Vincular otro padre de cada perfil `/kids/[id]` para abrir un modal sobre el perfil existente.
- Usar `referencias/pantallas/vincular-padre.dc.html` como fuente de verdad para el contenido, la jerarquía, la tipografía, la paleta y las proporciones del formulario.
- Mostrar el título `Vincular padre` y el nombre completo del niño resuelto desde `kid.name`.
- Incluir el aviso informativo, Nombre del padre/madre, Email, Parentesco, el código de invitación y la acción Enviar invitación de la referencia.
- Marcar Nombre del padre/madre y Email como campos obligatorios mediante semántica HTML y validación controlada.
- Considerar válido cualquier nombre que contenga al menos un carácter después de retirar espacios exteriores.
- Validar Email después de retirar espacios exteriores mediante un formato web práctico que exija contenido antes y después de `@`, un punto en el dominio y ausencia de espacios.
- Mostrar errores después de intentar enviar un formulario inválido y volver a validar cada campo mientras se corrige.
- Enfocar el primer campo inválido después de intentar enviar.
- Permitir elegir exactamente `Mamá`, `Papá` o `Tutor/a` y comenzar con `Mamá` seleccionada.
- Mantener el código fijo `7K4P9` y el texto `Vence en 7 días` como contenido de demostración.
- Cerrar el modal mediante el botón X, la tecla Escape o un clic directo sobre el fondo exterior.
- Descartar sin confirmación todos los valores y errores al cerrar por cualquier mecanismo.
- Cerrar y reiniciar el formulario después de un envío válido.
- Mostrar `Invitación enviada` durante tres segundos sobre el perfil después de un envío válido.
- Restaurar el foco al botón Vincular otro padre cuando se cierre el modal.
- Extraer primitivas reutilizables para el diálogo y el aviso de éxito.
- Migrar Agregar niño a las primitivas compartidas sin cambiar su comportamiento, contenido ni apariencia.
- Adaptar el modal a móvil como una tarjeta con márgenes y contenido desplazable.
- Validar manualmente la interacción a 1200 x 800 y 390 x 844.

**Fuera de alcance (para specs futuras):**

- Enviar un correo o código de invitación real.
- Agregar un padre pendiente o activo a las fixtures o a la tarjeta de padres vinculados.
- Persistir el formulario o la invitación en memoria compartida, `localStorage`, una API o una base de datos.
- Generar códigos únicos o calcular una fecha de vencimiento real.
- Validar si el email ya pertenece a otro usuario o si tiene una invitación pendiente.
- Incorporar Server Actions, Route Handlers o solicitudes de red.
- Crear, modificar o ampliar `KidParent` para admitir `Tutor/a` como dato persistente.
- Añadir límites de longitud o reglas culturales adicionales para el nombre.
- Una suite de pruebas automatizadas o nuevas dependencias.
- Cambios en rutas distintas de los perfiles y la migración interna del modal Agregar niño.

## Modelo de datos

`lib/link-parent-form.ts` define el estado efímero del formulario, sus opciones y los datos estáticos de demostración.

```ts
const LINK_PARENT_RELATIONSHIPS = ["Mamá", "Papá", "Tutor/a"] as const;

type LinkParentRelationship =
  (typeof LINK_PARENT_RELATIONSHIPS)[number];

type LinkParentFormValues = {
  parentName: string;
  email: string;
  relationship: LinkParentRelationship;
};

type RequiredLinkParentField = "parentName" | "email";

type LinkParentFormErrors = Partial<
  Record<RequiredLinkParentField, string>
>;

const INITIAL_LINK_PARENT_FORM_VALUES: LinkParentFormValues = {
  parentName: "",
  email: "",
  relationship: "Mamá",
};

const LINK_PARENT_INVITATION_CODE = "7K4P9";
const LINK_PARENT_INVITATION_EXPIRY = "Vence en 7 días";
```

Los valores viven únicamente durante la apertura actual del modal. Esta spec no crea ni modifica un `KidParent`, no cambia `types/kids.ts` y no introduce un contrato persistente o de red.

## Archivos

**Archivos existentes que cambian:**

- `app/globals.css`
- `components/icons.tsx`
- `components/kids/add-kid-modal.tsx`
- `components/kids/kids-directory.tsx`
- `components/kids/kid-profile.tsx`
- `components/kids/linked-parents-card.tsx`

**Archivos nuevos:**

- `components/ui/modal-dialog.tsx`
- `components/ui/success-notice.tsx`
- `components/kids/link-parent-modal.tsx`
- `components/kids/parent-linking.tsx`
- `lib/link-parent-form.ts`

No se modifica `app/kids/[id]/page.tsx`, `data/kids.ts`, `types/kids.ts`, `package.json` ni `package-lock.json`.

## Plan de implementación

1. Crear `components/ui/modal-dialog.tsx` con la sincronización de `<dialog>`, apertura modal, Escape, clic directo sobre el fondo, foco inicial y restauración del foco al disparador.
2. Generalizar en `app/globals.css` las clases de fondo, bloqueo de scroll y animación de SPEC 04 para que las consuman ambos modales, incluida la alternativa de movimiento reducido.
3. Crear `components/ui/success-notice.tsx` con la estructura visual, `CheckIcon`, `role="status"` y `aria-live="polite"` del aviso existente.
4. Migrar `components/kids/add-kid-modal.tsx` y `components/kids/kids-directory.tsx` a `ModalDialog` y `SuccessNotice` sin alterar sus validaciones, cierres, temporizador, texto ni presentación.
5. Crear `lib/link-parent-form.ts` con los tipos, opciones, constantes, estado inicial y validadores puros para nombre y email.
6. Añadir a `components/icons.tsx` los iconos reutilizables de cerrar, información y enviar que requiere la referencia.
7. Crear `components/kids/link-parent-modal.tsx` con el encabezado dinámico, aviso informativo, campos, errores asociados, selector de parentesco, código estático y acción principal de la referencia.
8. Incorporar en `LinkParentModal` el estado controlado, la validación al enviar, la revalidación al corregir, el foco sobre el primer campo inválido y el reinicio al cerrar o completar.
9. Actualizar `components/kids/linked-parents-card.tsx` para recibir un callback y convertir Vincular otro padre en un botón habilitado que conserve su apariencia.
10. Crear `components/kids/parent-linking.tsx` como frontera de cliente para controlar el modal, limpiar avisos anteriores al abrir y mostrar `Invitación enviada` durante tres segundos después de un envío válido.
11. Actualizar `components/kids/kid-profile.tsx` para componer `ParentLinking` con `kid.name` y `kid.parents` sin convertir el perfil completo en componente de cliente.
12. Adaptar el modal a 390 x 844 con márgenes exteriores, altura máxima y desplazamiento interno sin modificar la composición de escritorio a 1200 x 800.
13. Verificar que el flujo no modifica las fixtures, los padres vinculados, las demás secciones del perfil ni el comportamiento de Agregar niño.

Cada paso debe conservar `npm run dev` funcional y no debe crear navegación, invitaciones persistentes, nuevos padres ni solicitudes de red.

## Criterios de aceptación

- [x] Visitar un perfil válido `/kids/[id]` conserva el contenido y el shell visual definidos en SPEC 02.
- [x] Vincular otro padre está habilitado, puede recibir foco y abre el modal sin navegar ni cambiar la URL.
- [x] Al abrir el modal, el perfil permanece visible detrás de un fondo semitransparente difuminado que bloquea la interacción con el resto de la página.
- [x] El modal usa un `<dialog>` con nombre accesible `Vincular padre` y coloca el foco en Nombre del padre/madre.
- [x] El encabezado muestra `Vincular padre` y `a {kid.name}` con el nombre del perfil actual.
- [x] A 1200 x 800, el modal reproduce la composición, proporciones, tipografía, paleta, bordes, radios, sombras e iconografía de `referencias/pantallas/vincular-padre.dc.html`, salvo el fondo modal y diferencias inevitables de antialiasing.
- [x] El formulario muestra el aviso informativo, Nombre del padre/madre, Email, Parentesco, Código de invitación y Enviar invitación en ese orden.
- [x] El aviso informa que se enviará un correo con un código y que la persona invitada solo verá el feed del niño actual.
- [x] Nombre del padre/madre y Email tienen etiquetas asociadas, semántica obligatoria y los placeholders de la referencia.
- [x] Parentesco ofrece exactamente `Mamá`, `Papá` y `Tutor/a`, comienza en `Mamá` y permite cambiar la opción seleccionada.
- [x] El bloque de invitación muestra exactamente `7K4P9` y `Vence en 7 días`.
- [x] Intentar enviar ambos campos vacíos mantiene el modal abierto y muestra un error asociado a cada campo.
- [x] Un nombre compuesto únicamente por espacios se considera inválido.
- [x] Un nombre con al menos un carácter no vacío se considera válido sin exigir apellido ni longitud mínima adicional.
- [x] Emails sin contenido antes de `@`, sin contenido después de `@`, sin punto en el dominio o con espacios se consideran inválidos.
- [x] Un email como `lucia.fernandez@gmail.com`, con o sin espacios exteriores, se considera válido.
- [x] Después del primer intento de envío, cada error desaparece cuando su campo corregido pasa a ser válido.
- [x] El primer campo inválido recibe foco después de intentar enviar.
- [x] Activar el botón X cierra el modal, descarta valores y errores y devuelve el foco a Vincular otro padre.
- [x] Presionar Escape cierra el modal, descarta valores y errores y devuelve el foco a Vincular otro padre.
- [x] Hacer clic directamente sobre el fondo cierra el modal y descarta valores y errores.
- [x] Hacer clic dentro de la tarjeta no cierra el modal salvo que se active X o se complete un envío válido.
- [x] Reabrir el modal después de cualquier cancelación muestra Nombre y Email vacíos, sin errores y con `Mamá` seleccionada.
- [x] Enviar un formulario válido cierra y limpia el modal y muestra `Invitación enviada` durante tres segundos en una región anunciada sin interrumpir.
- [x] Abrir nuevamente el modal antes de que finalicen los tres segundos oculta el aviso anterior.
- [x] Después de un envío válido, la tarjeta de padres conserva exactamente los mismos registros y estados.
- [x] Un envío válido no crea una ruta, no modifica fixtures y no produce ninguna solicitud de invitación por red.
- [x] `ModalDialog` es consumido por Agregar niño y Vincular padre, sin dos implementaciones independientes del comportamiento modal.
- [x] `SuccessNotice` es consumido por los avisos `Niño agregado correctamente` e `Invitación enviada`, sin duplicar su estructura visual y semántica.
- [x] El modal Agregar niño conserva sus campos, validaciones, mecanismos de cierre, foco, texto de confirmación y temporizador definidos en SPEC 04.
- [x] A 390 x 844, la tarjeta mantiene márgenes respecto del viewport, permite desplazar su contenido y no presenta scroll horizontal ni controles recortados.
- [x] Ambos modales y sus avisos aparecen por encima de la cabecera y la navegación móvil.
- [x] La animación de apertura se desactiva o reduce cuando el sistema solicita movimiento reducido.
- [x] La paleta permanece fiel a las referencias independientemente de la preferencia de tema del sistema.
- [x] La consola del navegador no muestra errores ni advertencias producidos al abrir, validar, cambiar parentesco, enviar o cerrar ninguno de los dos modales.
- [x] `npm run lint -- app components data types lib` finaliza correctamente.
- [x] `npx tsc --noEmit` finaliza correctamente.
- [x] `npm run build` finaliza correctamente.
- [x] `package.json` y `package-lock.json` no incorporan nuevas dependencias.

## Decisiones

- **Sí:** SPEC 05 depende de SPEC 02 y SPEC 04. Habilita una acción diferida del perfil y reutiliza el patrón interactivo ya aprobado.
- **Sí:** el formulario vive en un modal sobre `/kids/[id]`. No se crea una ruta independiente para vincular padres.
- **Sí:** `vincular-padre.dc.html` guía el contenido y la identidad visual. El fondo modal reutiliza la mejora visual introducida por SPEC 04.
- **Sí:** se extrae `ModalDialog` y se migra Agregar niño. Mantener dos implementaciones de apertura, cierre y restauración de foco duplicaría una responsabilidad transversal.
- **Sí:** se extrae `SuccessNotice` y cada flujo conserva su propio estado y temporizador. La presentación es compartida, pero el ciclo de vida pertenece a la funcionalidad consumidora.
- **Sí:** `ParentLinking` constituye una frontera de cliente pequeña. `KidProfile` puede continuar como componente de servidor.
- **Sí:** el modal usa el `kid.name` resuelto por la ruta. No duplica nombres en datos de invitación.
- **Sí:** Nombre del padre/madre acepta cualquier contenido no vacío después de aplicar `trim()`. No se impone una estructura cultural de nombre y apellido.
- **Sí:** Email usa una regla práctica de interfaz que requiere `usuario@dominio.tld` y rechaza espacios. No pretende implementar por completo la gramática RFC de direcciones de correo.
- **Sí:** los errores aparecen al intentar enviar y cada campo se vuelve a validar mientras se corrige. No se depende de mensajes nativos variables del navegador.
- **Sí:** Parentesco comienza en `Mamá` y puede alternarse. No condiciona la validez porque siempre existe una selección.
- **Sí:** `Tutor/a` permanece en el estado efímero del formulario. No se amplía `KidParent` porque no se crea ningún registro.
- **Sí:** `7K4P9` y `Vence en 7 días` son valores fijos de demostración. No representan un código ni un vencimiento reales.
- **Sí:** X, Escape y clic directo sobre el fondo descartan el borrador sin confirmación y restauran el foco al disparador.
- **Sí:** un envío válido muestra `Invitación enviada` durante tres segundos aunque no exista persistencia.
- **No:** añadir un padre temporalmente a la tarjeta. Esto comunicaría una mutación que la demostración no realiza.
- **No:** correo, API, Server Action, Route Handler, base de datos o `localStorage`. El envío definitivo requiere un contrato de backend independiente.
- **No:** nuevas dependencias para modal, validación o avisos. React, HTML y CSS existentes cubren el alcance.
- **No:** un runner automatizado. La validación acordada combina navegador, lint, TypeScript y build.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `Invitación enviada` puede sugerir que salió un correo real. | Mantener explícita la naturaleza demostrativa y sustituir el comportamiento cuando exista un contrato de backend. |
| Extraer la base del modal puede introducir regresiones en Agregar niño. | Conservar su API funcional y verificar nuevamente todos sus cierres, foco, validaciones y aviso. |
| Una expresión de email demasiado estricta puede rechazar direcciones reales válidas. | Aplicar únicamente la regla práctica acordada y documentar que no pretende cubrir todo RFC 5322. |
| El contenido completo puede exceder la altura móvil. | Usar altura máxima basada en `dvh`, márgenes mínimos y desplazamiento dentro de la tarjeta. |
| La navegación fija podría cubrir el modal o el aviso. | Conservar la capa superior nativa de `<dialog>` y verificar los niveles visuales en ambos viewports. |

## Qué **no** incluye esta spec

- Envío real de correo o invitación.
- Persistencia, API, base de datos, Server Actions o Route Handlers.
- Creación o modificación de padres vinculados.
- Generación de códigos o vencimientos reales.
- Detección de usuarios o invitaciones duplicadas.
- Cambios persistentes al modelo `KidParent`.
- Pruebas automatizadas o dependencias nuevas.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
