# SPEC 04 — Modal para agregar niño

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-03
> **Objetivo:** Implementar en `/kids` un modal responsive para completar y validar los datos de un nuevo niño, con confirmación visual y sin persistencia.

## Por qué existe esta spec

SPEC 02 dejó Agregar niño visible pero deshabilitado porque todavía no existía un contrato para el formulario ni para sus validaciones. Esta spec habilita esa interacción como una demostración de frontend sin anticipar la base de datos ni la mutación definitiva del listado.

## Alcance

**Incluye:**

- Habilitar el botón Agregar niño de `/kids` para abrir un modal sobre el listado existente.
- Usar `referencias/pantallas/agregar-nino.dc.html` como fuente de verdad para el contenido, la jerarquía, la tipografía, la paleta y las proporciones del formulario.
- Mejorar la presentación de la referencia con un fondo semitransparente difuminado, una entrada visual sutil, estados de foco claros y estados de error integrados con el lenguaje visual existente.
- Implementar el modal con un elemento `<dialog>` y conservar el listado visible detrás de su fondo.
- Incluir los campos Nombre completo, Fecha de nacimiento, Sala, Alergias y Notas médicas.
- Marcar Nombre completo, Fecha de nacimiento y Sala con un asterisco visible y semántico como campos obligatorios.
- Identificar Alergias y Notas médicas como campos opcionales.
- Iniciar Sala sin selección y ofrecer únicamente `Sala 1`, `Sala 2` y `Sala 3` como opciones hardcodeadas.
- Implementar Fecha de nacimiento como un campo de texto numérico guiado por una máscara `dd/mm/aaaa` que inserta las barras y limita la entrada a ocho dígitos.
- Validar que la fecha use el formato completo, exista en el calendario y no sea posterior a la fecha local actual.
- Considerar válido cualquier Nombre completo que contenga al menos un carácter después de retirar espacios exteriores.
- Aceptar Alergias como texto libre sin convertir su contenido en etiquetas visuales.
- Aceptar Notas médicas como texto libre multilínea.
- Mostrar errores después de intentar guardar un formulario inválido y volver a validar cada campo mientras se corrige.
- Cerrar el modal mediante Cancelar, la tecla Escape o un clic directo sobre el fondo exterior.
- Descartar sin confirmación todos los valores al cerrar el modal por cualquier mecanismo.
- Cerrar y reiniciar el formulario después de un envío válido.
- Mostrar temporalmente el mensaje `Niño agregado correctamente` sobre `/kids` después de un envío válido.
- Mantener sin cambios las ocho fixtures, el contador, las tarjetas y los perfiles de SPEC 02 después del envío.
- Restaurar el foco al botón Agregar niño cuando se cierre el modal.
- Adaptar el formulario a móvil como una tarjeta con márgenes, contenido desplazable y Fecha de nacimiento y Sala apiladas.
- Validar manualmente la interacción a 1200 x 800 y 390 x 844.

**Fuera de alcance (para specs futuras):**

- Agregar el nuevo niño al listado, al contador o a los resultados de búsqueda.
- Crear un perfil o una ruta dinámica para los datos ingresados.
- Persistir el formulario en memoria después de cerrarlo, `localStorage`, una API o una base de datos.
- Implementar una Server Action, un Route Handler o cualquier envío por red.
- Obtener las salas desde una base de datos o servicio remoto.
- Convertir alergias separadas por comas en chips, insignias o etiquetas.
- Validar una edad mínima o máxima para el niño.
- Validar longitudes máximas, exigir apellido o detectar nombres duplicados.
- Pedir confirmación antes de descartar un formulario incompleto.
- Incorporar un selector de fecha nativo o un calendario personalizado.
- Una suite de pruebas automatizadas o nuevas dependencias.
- Cambios en los perfiles, el feed, el login o la activación de cuenta.

## Modelo de datos

`lib/add-kid-form.ts` define el estado efímero del formulario y las opciones temporales de sala.

```ts
type AddKidRoom = "" | "Sala 1" | "Sala 2" | "Sala 3";

type AddKidFormValues = {
  fullName: string;
  birthDate: string;
  room: AddKidRoom;
  allergies: string;
  medicalNotes: string;
};

type RequiredAddKidField = "fullName" | "birthDate" | "room";

type AddKidFormErrors = Partial<Record<RequiredAddKidField, string>>;

const ADD_KID_ROOM_OPTIONS = ["Sala 1", "Sala 2", "Sala 3"] as const;
```

El estado inicial usa cadenas vacías para los cinco campos. Los valores viven únicamente durante la apertura actual del modal y se reinician al cancelar o completar correctamente el formulario.

La máscara de fecha retira caracteres no numéricos, conserva como máximo ocho dígitos y presenta progresivamente los grupos `dd`, `mm` y `aaaa`. La validación analiza por separado día, mes y año para evitar que el ajuste automático de `Date` convierta una fecha inexistente en otra fecha válida.

Esta spec no crea un nuevo `Kid`, no modifica `types/kids.ts` y no introduce un modelo persistente ni un contrato de API.

## Archivos

**Archivos existentes que cambian:**

- `app/globals.css`
- `components/icons.tsx`
- `components/kids/kids-directory.tsx`
- `components/kids/kids-header.tsx`

**Archivos nuevos:**

- `components/kids/add-kid-modal.tsx`
- `lib/add-kid-form.ts`

No se modifica `app/kids/page.tsx`, `data/kids.ts`, `types/kids.ts`, `package.json` ni `package-lock.json`.

## Plan de implementación

1. Crear `lib/add-kid-form.ts` con `AddKidRoom`, `AddKidFormValues`, `AddKidFormErrors`, las tres opciones de sala, el estado inicial, la máscara numérica y validadores puros para los tres campos obligatorios.
2. Añadir `ChevronDownIcon` a `components/icons.tsx` y ampliar `app/globals.css` con los tokens y animaciones mínimos del modal, incluyendo una alternativa sin movimiento mediante `prefers-reduced-motion`.
3. Crear la estructura visual de `components/kids/add-kid-modal.tsx` con `<dialog>`, encabezado, botones Cancelar y Guardar, etiquetas, inputs, selector y textarea fieles a la referencia mejorada.
4. Incorporar en `AddKidModal` el estado controlado de los campos, la máscara `dd/mm/aaaa`, los mensajes de error, `aria-invalid`, `aria-describedby` y el foco sobre el primer campo inválido al intentar guardar.
5. Implementar en `AddKidModal` la apertura modal, el cierre con Cancelar, Escape y fondo, el reinicio del formulario y la restauración de foco sin cerrar cuando el clic se produzca dentro de la tarjeta.
6. Actualizar `components/kids/kids-header.tsx` para recibir `onAddKid` y convertir Agregar niño en un botón habilitado que conserve su apariencia actual.
7. Actualizar `components/kids/kids-directory.tsx` para controlar la apertura, recibir el envío válido, cerrar el modal y mostrar temporalmente `Niño agregado correctamente` mediante una región de estado accesible.
8. Adaptar el modal a 390 x 844 con márgenes exteriores, altura máxima, desplazamiento interno y campos Fecha de nacimiento y Sala apilados, manteniendo el diseño de dos columnas cuando exista espacio suficiente.
9. Verificar que abrir, validar y cerrar el modal no altera la búsqueda, las ocho fixtures, el contador, los enlaces a perfiles ni el comportamiento del shell de SPEC 02.

Cada paso debe conservar `npm run dev` funcional y no debe crear navegación, registros de niños ni persistencia implícita.

## Criterios de aceptación

- [x] Visitar `/kids` conserva los ocho niños, el contador y el shell visual definidos en SPEC 02.
- [x] El botón Agregar niño está habilitado, puede recibir foco y abre el modal sin navegar a otra URL.
- [x] Al abrir el modal, `/kids` permanece visible detrás de un fondo semitransparente difuminado que bloquea la interacción con el resto de la página.
- [x] El modal usa un `<dialog>` con nombre accesible `Agregar niño` y coloca el foco dentro del formulario.
- [x] A 1200 x 800, el modal conserva la composición, proporciones, tipografía, paleta, bordes, radios y sombras de `referencias/pantallas/agregar-nino.dc.html`, además de las mejoras visuales acordadas.
- [x] El formulario muestra Nombre completo, Fecha de nacimiento, Sala, Alergias y Notas médicas en ese orden.
- [x] Nombre completo, Fecha de nacimiento y Sala muestran un asterisco y se anuncian como obligatorios.
- [x] Alergias y Notas médicas muestran el texto `(opcional)` y no son obligatorios.
- [x] Sala comienza con `Seleccioná una sala` y ofrece exactamente `Sala 1`, `Sala 2` y `Sala 3`.
- [x] El campo Fecha de nacimiento presenta el placeholder `dd/mm/aaaa`, solicita teclado numérico en dispositivos compatibles e inserta las barras mientras se escriben hasta ocho dígitos.
- [x] Intentar guardar los cinco campos vacíos mantiene el modal abierto y muestra errores para Nombre completo, Fecha de nacimiento y Sala.
- [x] Un Nombre completo compuesto únicamente por espacios se considera inválido.
- [x] Un Nombre completo con al menos un carácter no vacío se considera válido sin exigir apellido ni longitud mínima adicional.
- [x] Fechas con formato incompleto o distinto de `dd/mm/aaaa` se consideran inválidas.
- [x] Fechas inexistentes como `31/02/2024` se consideran inválidas.
- [x] Una fecha futura respecto del día local se considera inválida.
- [x] Una fecha real no futura, incluida una fecha bisiesta válida como `29/02/2024`, supera la validación.
- [x] Cada error está asociado semánticamente con su campo y desaparece cuando el valor corregido pasa a ser válido.
- [x] El primer campo inválido recibe foco después de intentar guardar.
- [x] Alergias acepta texto libre como `Maní, Lactosa` sin generar chips ni errores.
- [x] Notas médicas acepta texto multilínea y puede permanecer vacío.
- [x] Un formulario válido puede enviarse con Alergias y Notas médicas vacías.
- [x] Guardar un formulario válido cierra el modal, limpia los cinco campos y muestra temporalmente `Niño agregado correctamente` en una región anunciada sin interrumpir.
- [x] Después de un envío válido, el listado continúa mostrando exactamente ocho niños y no crea una tarjeta, un perfil ni una nueva ruta.
- [x] Reabrir el modal después de guardar muestra todos los campos vacíos y Sala sin selección.
- [x] Cancelar cierra el modal, descarta los valores y devuelve el foco al botón Agregar niño.
- [x] Presionar Escape cierra el modal, descarta los valores y devuelve el foco al botón Agregar niño.
- [x] Hacer clic directamente sobre el fondo cierra el modal y descarta los valores.
- [x] Hacer clic dentro de la tarjeta no cierra el modal salvo que se active Cancelar o se complete un envío válido.
- [x] Reabrir el modal después de cualquier cancelación no recupera el borrador descartado.
- [x] En anchos menores de 768 px, Fecha de nacimiento y Sala se apilan y conservan el orden de lectura.
- [x] A 390 x 844, la tarjeta mantiene márgenes respecto del viewport, permite desplazar su contenido y no presenta scroll horizontal ni campos recortados.
- [x] El modal y su aviso temporal aparecen por encima de la cabecera y la navegación móvil.
- [x] La animación de apertura se desactiva o reduce cuando el sistema solicita movimiento reducido.
- [x] Cerrar el modal no borra ni modifica la consulta activa del buscador de niños.
- [x] La paleta permanece fiel a las referencias independientemente de la preferencia de tema del sistema.
- [x] La consola del navegador no muestra errores ni advertencias producidos al abrir, validar, enviar o cerrar el modal.
- [x] `npm run lint -- app components data types lib` finaliza correctamente.
- [x] `npx tsc --noEmit` finaliza correctamente.
- [x] `npm run build` finaliza correctamente.
- [x] `package.json` y `package-lock.json` no incorporan nuevas dependencias.

## Decisiones

- **Sí:** SPEC 04 depende de SPEC 02. Habilita una acción que esa spec dejó visible y deshabilitada.
- **Sí:** el formulario vive en un modal sobre `/kids`. No se crea una ruta independiente para agregar niños.
- **Sí:** `agregar-nino.dc.html` guía el contenido y la identidad visual. El fondo difuminado, la animación sutil y los estados interactivos modernizan la referencia sin reemplazarla.
- **Sí:** se usa `<dialog>` para obtener semántica modal, gestión de foco y Escape sobre una base nativa.
- **Sí:** el modal cierra con Cancelar, Escape o clic directo sobre el fondo. Estos tres mecanismos descartan el borrador sin confirmación por decisión explícita.
- **Sí:** el foco vuelve a Agregar niño al cerrar. Esto conserva el contexto de navegación por teclado.
- **Sí:** el formulario usa estado React en cliente. La máscara, los errores, el ciclo del modal y el aviso temporal requieren interacción local.
- **Sí:** Nombre completo acepta cualquier contenido no vacío después de aplicar `trim()`. No se impone una estructura cultural específica de nombre y apellido.
- **Sí:** Fecha de nacimiento es texto numérico con máscara propia. Un `input type="date"` no garantiza el formato visible `dd/mm/aaaa` en todos los navegadores.
- **Sí:** una fecha válida debe existir y no ser futura. No se agrega una restricción de edad porque no fue solicitada.
- **Sí:** Sala comienza vacía. La persona debe elegir explícitamente una de las tres opciones obligatorias.
- **Sí:** `Sala 1`, `Sala 2` y `Sala 3` se mantienen como una constante aislada para facilitar su reemplazo posterior por datos remotos.
- **No:** reutilizar `Sala Soles` de las fixtures como opción. Las tres opciones acordadas son independientes del conjunto estático actual.
- **Sí:** Alergias y Notas médicas son texto libre opcional. No se interpreta ni transforma su contenido en esta etapa.
- **Sí:** los errores aparecen al intentar guardar y cada campo se vuelve a validar mientras se corrige. No se depende de los mensajes nativos variables del navegador.
- **Sí:** un envío válido muestra `Niño agregado correctamente` aunque no exista persistencia. Este texto fue elegido explícitamente para la demostración visual.
- **No:** añadir el niño temporalmente al listado. Una tarjeta nueva necesitaría resolver también identificador, avatar, edad, perfil, padres e ingreso, responsabilidades fuera de esta spec.
- **No:** `localStorage`, estado persistente, API o base de datos. El guardado definitivo se definirá cuando exista el contrato de backend.
- **Sí:** la tarjeta conserva márgenes en móvil y desplaza su propio contenido. No se convierte en una pantalla completa ni en una hoja inferior.
- **No:** una nueva dependencia para modal, máscara, validación o avisos. Las necesidades están acotadas y se resuelven con React, HTML y CSS existentes.
- **No:** Playwright o un runner automatizado. La validación acordada combina navegador, lint, TypeScript y build.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El mensaje `Niño agregado correctamente` puede sugerir persistencia aunque el listado no cambie. | Mantener esta limitación explícita en la spec y sustituir el comportamiento cuando una spec futura defina la mutación real. |
| El constructor de `Date` puede normalizar silenciosamente fechas inexistentes. | Comparar los componentes resultantes con día, mes y año ingresados antes de aceptar la fecha. |
| La fecha local actual puede diferir de UTC cerca de medianoche. | Comparar contra los componentes de la fecha local del navegador y no contra una cadena UTC. |
| El clic sobre el fondo puede descartar datos accidentalmente. | Limitar el cierre al clic cuyo objetivo sea el propio `<dialog>` y no cualquier elemento interno; este descarte fue aceptado explícitamente. |
| El shell usa navegación fija y contenedores con overflow que podrían cubrir el modal. | Usar la capa superior nativa de `<dialog>` y verificar los niveles visuales en escritorio y móvil. |
| El teclado móvil puede reducir considerablemente el viewport disponible. | Aplicar altura máxima basada en `dvh`, desplazamiento interno y márgenes mínimos alrededor de la tarjeta. |

## Qué **no** incluye esta spec

- Persistencia o mutación real de niños.
- Una tarjeta o perfil para los datos ingresados.
- API, base de datos, Server Actions o Route Handlers.
- Salas obtenidas por red.
- Etiquetas visuales para alergias.
- Calendario o selector de fecha nativo.
- Restricciones de edad, duplicados o longitudes máximas.
- Confirmación antes de descartar el borrador.
- Pruebas automatizadas o dependencias nuevas.
- Cambios fuera del flujo de `/kids`.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
