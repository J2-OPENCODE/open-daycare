# SPEC 10 — Persistencia del listado y perfiles de niños

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 04, SPEC 05, SPEC 09
> **Fecha:** 2026-09-08
> **Objetivo:** Conectar `/kids`, el modal Agregar niño y `/kids/[slug]` con Supabase para crear, buscar, listar y consultar niños persistentes por sala.

## Por qué existe esta spec

SPEC 02 construyó el listado y los perfiles con fixtures, y SPEC 04 simuló un alta que descartaba los datos después de validar. SPEC 09 define las tablas, permisos y salas necesarias para reemplazar esa simulación por un flujo persistente sin rediseñar las pantallas aprobadas.

## Alcance

**Incluye:**

- Sustituir las fixtures como fuente de `/kids` por consultas autenticadas a `public.rooms` y `public.children`.
- Mantener `data/kids.ts` únicamente para Nueva publicación, activación de cuenta y otras demostraciones que quedan fuera de esta migración.
- Exigir un usuario activo con rol `staff` o `admin` para visitar `/kids`, visitar `/kids/[slug]` o ejecutar el alta.
- Redirigir a `/` cualquier perfil activo con rol `parent` que intente visitar esas rutas administrativas.
- Conservar las redirecciones actuales a `/login` para sesiones anónimas o perfiles inactivos.
- Obtener las tres salas persistidas para la guardería del usuario y presentarlas en el orden de `rooms.position`.
- Mostrar en el selector `Sala Soles`, `Sala Lunas` y `Sala Estrellas`, aunque `rooms.name` almacene Soles, Lunas y Estrellas.
- Iniciar el selector sin una sala elegida y enviar el UUID de la sala, no su nombre visible.
- Obtener únicamente niños `active` de la guardería actual.
- Agrupar los niños por sala y ocultar grupos que no contengan resultados visibles.
- Ordenar los niños alfabéticamente por nombre completo dentro de cada sala.
- Mostrar `No hay niños registrados` cuando la guardería no tenga niños activos.
- Conservar la búsqueda en cliente por cualquier fragmento del nombre completo, ignorando mayúsculas, minúsculas y diacríticos.
- Mostrar `No encontramos niños` cuando una búsqueda activa no tenga coincidencias.
- Mantener los valores, máscara y validaciones del modal definidos por SPEC 04, salvo las ampliaciones explícitas de esta spec.
- Limitar Nombre completo a 120 caracteres y Notas médicas a 2000 caracteres.
- Interpretar Alergias como una lista separada por comas que admite únicamente Maní, Lactosa y Gluten, sin distinguir mayúsculas, minúsculas ni diacríticos.
- Traducir Maní a `peanut`, Lactosa a `lactose` y Gluten a `gluten` antes de persistir.
- Retirar espacios exteriores, eliminar valores vacíos y deduplicar alergias conservando el orden de la primera aparición.
- Mostrar un error asociado con Alergias si existe al menos un término desconocido.
- Convertir Fecha de nacimiento de `dd/mm/aaaa` a una fecha ISO antes de insertar.
- Usar la fecha local del navegador en el momento del envío como `enrolled_at`.
- Dejar que la base de datos aplique `photo_consent=true` y `status=active`.
- Convertir Notas médicas vacías o compuestas únicamente por espacios a `NULL`.
- Crear el niño mediante una Server Action dedicada y sin introducir un Route Handler.
- Tratar la Server Action como una entrada no confiable y repetir en servidor todas las validaciones relevantes.
- Derivar `daycare_id`, identidad y rol desde la sesión y el perfil persistido, nunca desde datos enviados por el cliente.
- Verificar en servidor que `room_id` corresponde a una sala de la guardería actual.
- Generar un slug kebab-case ASCII desde el nombre completo.
- Usar el slug base cuando esté libre y añadir sufijos `-2`, `-3` y siguientes cuando exista una colisión dentro de la misma guardería.
- Respetar el máximo de 120 caracteres del slug al añadir sufijos.
- Recuperarse de colisiones concurrentes detectando la violación única y probando el siguiente sufijo.
- Deshabilitar Guardar y Cancelar, bloquear Escape y fondo y mostrar `Guardando…` mientras el alta está pendiente.
- Impedir envíos duplicados durante la operación pendiente.
- Mantener abierto el modal y conservar todos los valores cuando falle una validación de servidor o Supabase.
- Mostrar un error general accesible cuando el alta no pueda completarse por una causa no asociada con un campo.
- Cerrar y reiniciar el modal únicamente después de confirmar el insert.
- Limpiar la búsqueda activa después de un alta exitosa para que el nuevo niño quede visible en su sala.
- Revalidar `/kids` en la Server Action para incluir el listado actualizado en la misma respuesta.
- Mostrar `Niño agregado correctamente` durante tres segundos después del cierre exitoso mediante `SuccessNotice`.
- Mantener el aviso ausente cuando el insert falle o el modal se cancele.
- Renombrar el segmento dinámico de `app/kids/[id]` a `app/kids/[slug]`.
- Resolver el perfil mediante `children.slug` y `daycare_id`, sin usar fixtures ni `generateStaticParams`.
- Devolver la página 404 de Next.js para un slug inexistente, de otro tenant o correspondiente a un niño `archived`.
- Formatear `birth_date` e `enrolled_at` como fechas de calendario sin conversiones de zona horaria que cambien el día.
- Calcular la edad en años cumplidos a partir de `birth_date`, con singular y plural correctos y `0 años` para menores de un año.
- Calcular iniciales y colores de avatar determinísticos desde los datos del niño usando la paleta existente, sin persistir atributos visuales.
- Mostrar en la tarjeta la primera alergia traducida y en mayúsculas cuando exista.
- Mostrar la insignia VINCULAR cuando el niño no tenga alergias ni padres vinculados.
- Combinar en el perfil las alergias traducidas y `medical_notes` dentro del bloque Alergias y notas.
- Conservar el estado neutro `Sin alergias ni notas registradas` cuando ambos valores estén vacíos.
- Mostrar cero padres y `Sin padres vinculados` para todos los niños persistentes en esta etapa.
- Conservar el modal Vincular padre y su confirmación como la simulación existente, sin persistir invitaciones.
- Generar tipos TypeScript desde el esquema desplegado y tipar los clientes Supabase.
- Mantener el diseño responsive, foco, cierres, aviso y lenguaje visual aprobados por SPEC 02, SPEC 04 y SPEC 05.
- Validar manualmente el flujo a 1200 x 800 y 390 x 844.

**Fuera de alcance (para specs futuras):**

- Migrar los ocho niños de `data/kids.ts` a Supabase.
- Sustituir las fixtures usadas por Nueva publicación, feed, login o activación de cuenta.
- Persistir padres, vínculos o invitaciones.
- Crear `parent_children` o `invitations`.
- Dar acceso a perfiles parent antes de que exista el modelo de vínculos.
- Editar, archivar, restaurar o eliminar niños.
- Crear, editar, reordenar o eliminar salas desde la aplicación.
- Permitir elegir `photo_consent` o `status` desde el modal.
- Permitir editar `enrolled_at` desde el modal.
- Cargar o persistir fotografías de niños.
- Ampliar el catálogo de alergias más allá de Maní, Lactosa y Gluten.
- Buscar por sala, edad, alergia, estado, notas o padres.
- Añadir filtros, paginación u ordenamiento configurable.
- Modificar el comportamiento persistente del feed o del modal Nueva publicación.
- Incorporar una suite de pruebas automatizadas o nuevas dependencias.

## Modelo de datos

### Datos de presentación

`types/kids.ts` amplía el contrato de presentación para distinguir la identidad interna del slug público y admitir cualquier edad o sala persistida.

```ts
type Kid = {
  id: string;
  slug: string;
  name: string;
  ageYears: number;
  birthDateLabel: string;
  roomName: string;
  enrollmentLabel: string;
  avatar: InitialsAvatar;
  listBadge: KidListBadge;
  medicalNotes: KidMedicalNotes;
  parents: readonly KidParent[];
};

type KidRoom = {
  id: string;
  name: string;
  label: string;
  position: number;
  children: readonly Kid[];
};

type KidsDirectoryData = {
  rooms: readonly KidRoom[];
};
```

Para datos persistentes, `Kid.id` contiene el UUID de `children.id` y `Kid.slug` contiene la ruta pública. Las fixtures existentes incorporan un `slug` igual a su identificador demostrativo sin cambiar el comportamiento de sus consumidores actuales.

El mapper de `lib/kids-data.ts` devuelve únicamente los campos que la interfaz necesita. No entrega filas crudas de Supabase ni columnas de autorización a componentes de cliente.

### Formulario y resultado

`lib/add-kid-form.ts` sustituye el tipo hardcodeado `AddKidRoom` por un UUID recibido desde las salas persistidas y amplía errores y validación.

```ts
type AddKidRoomOption = {
  id: string;
  label: string;
};

type AddKidFormValues = {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergies: string;
  medicalNotes: string;
};

type AddKidField =
  | "fullName"
  | "birthDate"
  | "roomId"
  | "allergies"
  | "medicalNotes";

type AddKidActionResult =
  | { status: "success"; slug: string }
  | { status: "invalid"; errors: Partial<Record<AddKidField, string>> }
  | { status: "error"; message: string };
```

El formulario conserva los cinco valores mientras la acción está pendiente o falla. Un éxito devuelve únicamente el slug necesario para confirmar el registro, no la fila completa de base de datos.

### Catálogo de alergias

| Entrada UI canónica | Variantes aceptadas | Valor persistido |
| --- | --- | --- |
| `Maní` | Diferencias de mayúsculas o ausencia de tilde | `peanut` |
| `Lactosa` | Diferencias de mayúsculas | `lactose` |
| `Gluten` | Diferencias de mayúsculas | `gluten` |

La interfaz vuelve a traducir esos códigos para tarjeta y perfil. La primera alergia corresponde al primer código válido después de deduplicar la entrada.

### Slug

La generación del slug aplica estas reglas en orden:

1. Retirar espacios exteriores del nombre.
2. Normalizar Unicode y retirar marcas diacríticas.
3. Convertir a minúsculas.
4. Sustituir secuencias no alfanuméricas ASCII por un guion.
5. Retirar guiones iniciales y finales.
6. Usar `nino` si el resultado queda vacío.
7. Truncar sin dejar un guion final para respetar el máximo de 120 caracteres.
8. Intentar el slug base y continuar con `-2`, `-3` y siguientes ante colisiones.

El sufijo forma parte del límite. El slug no cambia después del alta porque esta spec no implementa edición de nombre.

### Fechas y edad

`birth_date` y `enrolled_at` se tratan como fechas de calendario sin hora. El mapper separa año, mes y día de la representación ISO para evitar desplazamientos por UTC al formatear.

La edad usa años completos: resta los años y descuenta uno si el cumpleaños del año actual todavía no ocurrió. La interfaz muestra `1 año` y usa `años` para cualquier otro valor.

### Estado del directorio

`KidsDirectory` conserva como estado local la consulta, apertura, envío y aviso. Las salas y los niños permanecen como props obtenidas en el servidor.

Después de un éxito, la Server Action revalida `/kids`; Next.js entrega el árbol actualizado en la misma respuesta y el cliente limpia la consulta. Después de un error, no se revalida ni se cambia la consulta.

## Archivos

**Archivos existentes que cambian:**

- `app/kids/page.tsx`
- `components/kids/add-kid-modal.tsx`
- `components/kids/kids-directory.tsx`
- `components/kids/kid-card.tsx`
- `components/kids/kid-profile-header.tsx`
- `data/kids.ts`
- `lib/add-kid-form.ts`
- `lib/auth.ts`
- `types/kids.ts`
- `utils/supabase/client.ts`
- `utils/supabase/server.ts`

**Archivo existente que se mueve y cambia:**

- `app/kids/[id]/page.tsx` a `app/kids/[slug]/page.tsx`

**Archivos nuevos:**

- `app/kids/actions.ts`
- `lib/kids-data.ts`
- `types/database.ts`

No se modifica `app/page.tsx`, `components/feed/`, `components/auth/`, el contenido demostrativo de `data/kids.ts`, `package.json` ni `package-lock.json`. `data/kids.ts` solo recibe el campo `slug` necesario para satisfacer el contrato ampliado sin cambiar nombres, identificadores, perfiles o avatares.

## Plan de implementación

1. Generar `types/database.ts` desde el proyecto Supabase después de implementar SPEC 09 y actualizar ambos factories de `utils/supabase/` para usar `Database` sin cambiar cookies, claves ni comportamiento SSR.
2. Ampliar `lib/auth.ts` para obtener `daycareId` y `role` desde `public.users`, conservar los estados actuales y añadir un guard reutilizable que redirija perfiles parent activos a `/` en las rutas administrativas de niños.
3. Ampliar `types/kids.ts` con `slug`, edades y salas no literales, `KidRoom`, `KidsDirectoryData` y los tipos del formulario; añadir a las fixtures su slug existente sin migrarlas ni cambiar sus consumidores.
4. Crear `lib/kids-data.ts` como módulo `server-only` con consultas tenant-aware para salas, listado activo y detalle por slug, además de mappers limitados a los campos de presentación.
5. Implementar en `lib/kids-data.ts` el orden de salas, orden de niños, etiquetas de sala, fechas sin desplazamiento, años cumplidos, avatar determinístico, traducción de alergias, insignia y estado médico combinado.
6. Actualizar `app/kids/page.tsx` para exigir staff/admin, consultar salas e hijos persistentes y entregar los grupos a `KidsDirectory` sin importar `kidsData`.
7. Actualizar `lib/add-kid-form.ts` para usar `roomId`, límites de 120 y 2000 caracteres, parseo del catálogo de alergias, conversión de fecha y validadores compartidos entre cliente y servidor.
8. Crear `app/kids/actions.ts` con `"use server"`, autenticación y autorización propias, validación completa, comprobación tenant-aware de la sala, fecha local de ingreso recibida y un resultado discriminado limitado.
9. Implementar en la Server Action la generación de slug, el insert con los campos permitidos y la recuperación ante colisiones `children_daycare_slug_key` mediante sufijos incrementales.
10. Hacer que la Server Action ejecute `revalidatePath("/kids")` únicamente después de un insert confirmado y devuelva el slug creado.
11. Actualizar `AddKidModal` para recibir las salas, enviar valores reales, mostrar límites y errores de servidor, conservar datos ante fallo y representar el estado pendiente con `Guardando…`.
12. Bloquear Cancelar, Guardar, Escape y clic sobre el fondo durante el envío usando la capacidad `dismissible` existente de `ModalDialog`, sin cambiar el comportamiento predeterminado de los otros modales.
13. Actualizar `KidsDirectory` para invocar la Server Action dentro de una transición, cerrar solo ante éxito, limpiar la búsqueda, esperar el cierre y mostrar el aviso actual durante tres segundos.
14. Adaptar `KidsDirectory` para filtrar por nombre en todas las salas, agrupar resultados, distinguir el estado inicial vacío del estado sin coincidencias y conservar el orden recibido del servidor.
15. Actualizar `KidCard` para enlazar mediante `kid.slug` y `KidProfileHeader` para presentar correctamente `1 año` frente a `años`.
16. Mover la ruta dinámica a `app/kids/[slug]/page.tsx`, retirar `generateStaticParams`, exigir staff/admin, consultar el niño activo por tenant y slug y conservar `notFound()` ante ausencia.
17. Verificar que el perfil existente recibe únicamente el view model persistente, muestra padres vacíos y mantiene el modal Vincular padre como simulación sin solicitudes nuevas.
18. Ejecutar consultas de verificación con el usuario staff para confirmar el insert, la relación de sala, los códigos de alergia, defaults, slug y persistencia después de recargar.
19. Ejecutar `npm run lint -- app components data types lib utils`, `npx tsc --noEmit` y `npm run build`.
20. Validar manualmente alta, error, búsqueda, agrupación, perfil, 404, foco y responsive a 1200 x 800 y 390 x 844.

Cada paso debe mantener la aplicación ejecutable y no debe migrar fixtures, padres, invitaciones ni publicaciones.

## Criterios de aceptación

- [ ] Una sesión anónima que visita `/kids` o `/kids/[slug]` conserva la redirección a `/login`.
- [ ] Un perfil inactivo conserva la redirección a `/login?reason=inactive`.
- [ ] Un perfil activo con rol parent que visita `/kids` o `/kids/[slug]` es redirigido a `/`.
- [ ] Staff y admin activos pueden visitar ambas rutas únicamente con datos de su guardería.
- [ ] `/kids` obtiene salas y niños mediante el cliente Supabase SSR tipado y no desde `data/kids.ts`.
- [ ] Antes del primer alta, `/kids` muestra `No hay niños registrados` y el contador no presenta fixtures.
- [ ] El selector de sala obtiene tres opciones persistidas y las muestra como Sala Soles, Sala Lunas y Sala Estrellas en ese orden.
- [ ] El selector comienza sin selección y el formulario exige una sala.
- [ ] Los valores enviados usan el UUID de la sala y nunca confían en su nombre visible.
- [ ] Los grupos del listado aparecen en el orden Soles, Lunas y Estrellas cuando contienen resultados.
- [ ] Los niños se ordenan alfabéticamente por nombre dentro de cada sala.
- [ ] Las salas sin niños visibles no producen secciones vacías.
- [ ] La búsqueda sigue filtrando por cualquier fragmento del nombre completo.
- [ ] Escribir sin tildes encuentra nombres equivalentes con tildes y la comparación ignora mayúsculas.
- [ ] Una búsqueda sin coincidencias muestra `No encontramos niños`.
- [ ] Limpiar la búsqueda restaura todos los grupos y niños activos.
- [ ] Abrir y cancelar Agregar niño no modifica la consulta ni realiza inserts.
- [ ] Nombre completo conserva la validación no vacía y rechaza más de 120 caracteres.
- [ ] Fecha de nacimiento conserva la máscara `dd/mm/aaaa` y rechaza formatos incompletos, fechas inexistentes y fechas futuras.
- [ ] Sala se valida nuevamente en servidor y un UUID de otro tenant es rechazado.
- [ ] Alergias vacías son válidas y se guardan como un array vacío.
- [ ] `Maní, Lactosa, Gluten` se persiste como `{peanut,lactose,gluten}`.
- [ ] Las diferencias de mayúsculas y la ausencia de tilde en `mani` no cambian el código persistido.
- [ ] Valores repetidos se guardan una sola vez y conservan el orden de su primera aparición.
- [ ] Una alergia desconocida mantiene el modal abierto, conserva valores y muestra un error asociado con Alergias.
- [ ] Notas médicas vacías se guardan como `NULL` y notas válidas conservan su contenido recortado.
- [ ] Notas médicas de más de 2000 caracteres son rechazadas en cliente y servidor.
- [ ] La Server Action autentica y autoriza dentro de la propia función aunque la página ya esté protegida.
- [ ] La Server Action obtiene `daycare_id` y rol desde la sesión y `public.users`, no desde argumentos del cliente.
- [ ] Mientras el insert está pendiente aparece `Guardando…`, no se aceptan envíos duplicados y el modal no puede cerrarse.
- [ ] Un error inesperado mantiene abierto el modal, conserva todos los valores, reactiva sus controles y muestra un mensaje accesible.
- [ ] Un error no muestra el aviso `Niño agregado correctamente` ni añade una tarjeta optimista.
- [ ] Un alta válida usa la fecha local del navegador como `enrolled_at`.
- [ ] Un alta válida usa los defaults `photo_consent=true` y `status=active` sin enviarlos desde el formulario.
- [ ] El primer niño con un nombre usa el slug base normalizado.
- [ ] Un segundo niño con el mismo nombre recibe el sufijo `-2` y los siguientes continúan incrementalmente.
- [ ] Dos altas concurrentes con el mismo nombre no producen slugs duplicados ni sobrescriben filas.
- [ ] Ningún slug supera 120 caracteres ni termina con un guion antes del sufijo.
- [ ] Un alta confirmada cierra y reinicia el modal.
- [ ] Un alta confirmada limpia cualquier búsqueda activa.
- [ ] El listado actualizado muestra inmediatamente el niño nuevo dentro de la sala elegida sin una recarga manual.
- [ ] El aviso `Niño agregado correctamente` aparece durante tres segundos mediante `SuccessNotice` después del cierre.
- [ ] Recargar `/kids` conserva el niño creado y confirma que no era una actualización únicamente en memoria.
- [ ] La tarjeta usa la inicial y un color determinístico de la paleta existente en recargas posteriores.
- [ ] La tarjeta muestra años cumplidos con singular o plural correcto y cero padres vinculados.
- [ ] La primera allergy tag se muestra traducida y en mayúsculas como insignia médica.
- [ ] Un niño sin alergias muestra VINCULAR porque todavía no tiene padres persistidos.
- [ ] Cada tarjeta enlaza a `/kids/{slug}` y no expone el UUID en el `href`.
- [ ] `/kids/[slug]` consulta `children` y `rooms` mediante Supabase y no usa `findKidById`.
- [ ] El perfil muestra nombre, edad calculada, nacimiento, sala, ingreso, alergias y notas obtenidos desde la base de datos.
- [ ] Formatear fechas no cambia el día por diferencias de zona horaria.
- [ ] Alergias y notas se combinan en el bloque existente con etiquetas traducidas.
- [ ] Un niño sin alergias ni notas muestra `Sin alergias ni notas registradas`.
- [ ] El perfil muestra `Sin padres vinculados` y conserva disponible el modal simulado Vincular padre.
- [ ] Completar Vincular padre no crea filas ni cambia la sección de padres.
- [ ] Un slug inexistente, de otro tenant o archivado devuelve la página 404.
- [ ] La ruta no exporta `generateStaticParams` y admite niños creados después del build.
- [ ] Nueva publicación y activación de cuenta conservan sus fixtures y comportamiento previo.
- [ ] A 1200 x 800, listado, modal y perfil conservan el lenguaje visual aprobado.
- [ ] A 390 x 844, grupos, modal y perfil no tienen scroll horizontal ni controles recortados.
- [ ] El foco inicial, primer error, restauración de foco y anuncio de éxito mantienen el patrón accesible existente.
- [ ] La consola no muestra errores ni advertencias producidos por lectura, búsqueda, alta o navegación al perfil.
- [ ] `npm run lint -- app components data types lib utils` finaliza correctamente.
- [ ] `npx tsc --noEmit` finaliza correctamente.
- [ ] `npm run build` finaliza correctamente sin intentar prerenderizar slugs de fixtures.
- [ ] `package.json` y `package-lock.json` no incorporan nuevas dependencias.

## Decisiones

- **Sí:** SPEC 10 depende de SPEC 02, SPEC 04, SPEC 05 y SPEC 09. Reemplaza las fuentes estáticas de dos pantallas, convierte la simulación existente y reutiliza el patrón compartido de modal y aviso.
- **Sí:** limitar esta integración a `/kids`, Agregar niño y `/kids/[slug]`.
- **No:** migrar ahora el feed, Nueva publicación o activación de cuenta. Sus fixtures siguen cumpliendo contratos demostrativos independientes.
- **Sí:** `/kids` comienza vacío. Los ocho niños actuales no se insertan en Supabase.
- **Sí:** agrupar por sala y ocultar grupos sin resultados. Una lista única perdería el dato operativo elegido en el alta.
- **Sí:** persistir el orden de salas y consumirlo desde la aplicación. No se duplica Soles, Lunas y Estrellas como una constante de orden en frontend.
- **Sí:** buscar en cliente sobre los datos ya autorizados que entrega el servidor. El volumen inicial no justifica búsqueda remota ni debounce.
- **Sí:** limpiar la consulta después del éxito. Esto garantiza que la tarjeta recién creada sea visible incluso si la búsqueda anterior no coincide.
- **Sí:** usar una Server Action. Es una mutación propia de la interfaz y Next.js puede devolver el resultado y el árbol revalidado en una sola respuesta.
- **No:** crear un Route Handler. No existe un consumidor externo ni una API pública adicional que lo necesite.
- **Sí:** autenticar, autorizar y validar dentro de la acción. Renderizar el modal solo para staff/admin no constituye una frontera de seguridad.
- **Sí:** enviar `roomId` y la fecha local de ingreso, pero derivar `daycare_id`, identidad y rol desde fuentes confiables del servidor.
- **Sí:** conservar la fecha local del navegador para `enrolled_at`. El formulario no solicita una fecha de ingreso distinta.
- **Sí:** bloquear todo cierre durante el envío. Permitir cancelar ocultaría una operación que puede finalizar después y produciría un estado ambiguo.
- **Sí:** cerrar y mostrar éxito únicamente después del insert. No se realiza una actualización optimista.
- **Sí:** conservar los valores ante error. La persona puede corregir o reintentar sin volver a llenar el formulario.
- **Sí:** mantener el mensaje y temporizador existentes. `Niño agregado correctamente` durante tres segundos ya constituye el patrón del proyecto.
- **Sí:** mantener Alergias como texto separado por comas para conservar la pantalla aprobada, pero aceptar únicamente un catálogo traducible y cerrado.
- **No:** persistir texto arbitrario en `allergy_tags`. Rompería la convención de códigos en inglés y haría imposible presentar traducciones consistentes.
- **Sí:** deduplicar alergias y conservar el orden de entrada. La primera etiqueta controla la insignia del listado.
- **Sí:** permitir nombres duplicados y resolver únicamente la identidad URL con sufijos.
- **Sí:** generar el slug en la aplicación y usar la restricción única como autoridad ante concurrencia.
- **No:** usar UUID en la URL. El usuario solicitó explícitamente `/kids/[slug]` y el UUID permanece interno.
- **Sí:** retirar `generateStaticParams`. Los slugs se crean en tiempo de ejecución y no pueden conocerse durante el build.
- **Sí:** los perfiles archived responden 404. No existe una vista administrativa de archivo en esta etapa.
- **Sí:** calcular edad, fechas, avatares e insignias como presentación derivada. No se añaden columnas visuales ni etiquetas preformateadas a la base de datos.
- **Sí:** combinar alergias y notas en el componente existente. No se rediseña el perfil en dos secciones.
- **Sí:** conservar padres vacíos y el modal de vínculo simulado. La persistencia real requiere `parent_children` e `invitations`.
- **Sí:** redirigir parent al feed además de aplicar RLS. La UI administrativa no debe mostrarse como un listado vacío engañoso.
- **Sí:** generar tipos desde el esquema real y usarlos en los clientes. Las nuevas consultas y mutaciones no deben depender de cadenas sin tipar.
- **No:** nuevas dependencias o un runner de pruebas. Las validaciones puras, React, Next.js, Supabase y las verificaciones existentes cubren este alcance.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La respuesta revalidada puede llegar mientras el directorio conserva estado local de búsqueda. | Limpiar la consulta solo después del resultado `success`; Next.js fusiona las props nuevas sin perder el límite de cliente. |
| Dos altas simultáneas pueden elegir el mismo slug candidato. | Confiar en `children_daycare_slug_key`, detectar `23505` y continuar con el siguiente sufijo sin sobrescribir datos. |
| Parsear una fecha ISO con `Date` puede moverla al día anterior según la zona horaria. | Tratar columnas `date` como componentes de calendario y no como instantes UTC. |
| El formulario envía la fecha local del navegador, que puede estar configurada incorrectamente. | Limitar el valor a una fecha ISO válida y documentar que representa el día local visible para la persona que registra. |
| Ampliar `Kid` con `slug` puede afectar consumidores de fixtures. | Añadir el slug existente sin cambiar `id`, nombres ni datos y verificar Nueva publicación y activación de cuenta. |
| Tipar globalmente los clientes Supabase puede revelar errores en consultas existentes. | Generar tipos desde el esquema desplegado, corregir únicamente incompatibilidades reales y ejecutar TypeScript antes del build. |
| Bloquear el cierre durante una red lenta puede dejar el modal aparentemente detenido. | Mostrar `Guardando…`, conservar el error recuperable y reactivar todos los cierres cuando la acción termine con fallo. |
| Un perfil parent podría conocer la URL administrativa aunque la UI no la enlace. | Aplicar guard de ruta y RLS independiente; ninguna de las dos capas depende de la otra. |
| El listado comienza vacío mientras otras pantallas siguen mostrando fixtures. | Mantener la separación explícita de alcance y no presentar las fixtures como registros persistentes dentro de `/kids`. |

## Qué **no** incluye esta spec

- Migración de los ocho niños de demostración.
- Persistencia del feed, publicaciones, padres o invitaciones.
- Acceso de perfiles parent a niños vinculados.
- Edición, archivo, restauración o eliminación de niños.
- Administración de salas.
- Fotografías o avatares persistentes.
- Alergias distintas de Maní, Lactosa y Gluten.
- Búsqueda avanzada, filtros, paginación u orden configurable.
- Route Handlers, dependencias nuevas o pruebas automatizadas.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
