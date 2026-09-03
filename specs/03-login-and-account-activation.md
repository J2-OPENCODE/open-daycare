# SPEC 03 — Login y activación de cuenta

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-02
> **Objetivo:** Implementar `/login` y `/activate-account` como réplicas responsive y únicamente visuales de las referencias, reutilizando los patrones y componentes existentes.

## Por qué existe esta spec

Las pantallas actuales representan únicamente el área autenticada de OpenDayCare. Esta spec incorpora las vistas de acceso y activación como demostraciones visuales navegables sin anticipar la autenticación, las validaciones ni los destinos familiares que todavía no existen.

## Alcance

**Incluye:**

- Crear `app/(auth)/login/page.tsx`, accesible mediante `/login` sin incluir el route group en la URL.
- Crear `app/(auth)/activate-account/page.tsx`, accesible mediante `/activate-account` sin incluir el route group en la URL.
- Reproducir el contenido, la jerarquía, los colores, las medidas, los bordes, las sombras y la iconografía de `referencias/pantallas/login.dc.html` y `referencias/pantallas/activar-cuenta.dc.html`.
- Omitir por completo del login el rótulo `INGRESO COMO` y los botones Personal y Familia.
- Mantener el email inicial `caro@opendaycare.com` y el placeholder de contraseña de la referencia del login.
- Mantener en activación el código `7K4P9`, el email `lucia.fernandez@gmail.com`, la contraseña precargada, el consentimiento marcado y la invitación de Mateo en Sala Soles.
- Permitir editar los inputs y alternar el consentimiento mediante comportamiento nativo, sin validación ni envío.
- Permitir navegar entre `/login` y `/activate-account` mediante los enlaces secundarios y `next/link`.
- Mantener Iniciar sesión, Activar mi cuenta y recuperación de contraseña visibles, pero sin acción ni navegación.
- Reutilizar Fredoka, Nunito, `SunIcon`, `Avatar`, las fixtures de niños, los tokens visuales y las convenciones Tailwind existentes.
- Crear componentes compartidos para la marca de acceso, los campos y la acción principal en lugar de duplicarlos entre pantallas.
- Ocultar el panel coral del login por debajo de 768 px y mostrar una marca compacta junto al formulario.
- Adaptar la activación a móvil conservando toda la información en una sola columna.
- Validar manualmente ambas pantallas a 1200 x 800 y 390 x 844.

**Fuera de alcance (para specs futuras):**

- Autenticación, autorización, sesión real y cierre de sesión.
- Validaciones, mensajes de error o comprobación de credenciales y códigos.
- Redirecciones al feed o a cualquier destino autenticado.
- API, base de datos, Server Actions, carga remota o persistencia local.
- Recuperación de contraseña.
- Protección de rutas o middleware.
- Implementación del feed familiar.
- Una suite de pruebas automatizadas o la incorporación de Playwright.
- La implementación de otras pantallas de `referencias/pantallas/`.

## Modelo de datos

`types/auth.ts` define los datos estáticos de presentación de ambas pantallas.

```ts
type LoginDemoData = {
  email: string;
  passwordPlaceholder: string;
};

type AccountActivationDemoData = {
  kidId: string;
  childLabel: string;
  roomLabel: string;
  invitationCode: string;
  email: string;
  password: string;
  consentText: string;
};

type AuthDemoData = {
  login: LoginDemoData;
  activation: AccountActivationDemoData;
};
```

`data/auth.ts` conserva los valores literales de las referencias. La activación usa `kidId: "mateo-fernandez"` para resolver y reutilizar el avatar de Mateo desde `data/kids.ts`; `childLabel: "Mateo"` conserva el texto abreviado de la referencia sin modificar el modelo compartido de niños.

No se introduce un modelo persistente ni un contrato de autenticación.

## Archivos

**Archivos existentes que cambian:**

- `app/globals.css`
- `components/icons.tsx`
- `components/ui/avatar.tsx`

**Archivos nuevos:**

- `app/(auth)/login/page.tsx`
- `app/(auth)/activate-account/page.tsx`
- `components/auth/auth-brand.tsx`
- `components/auth/auth-field.tsx`
- `components/auth/auth-primary-action.tsx`
- `components/auth/login-panel.tsx`
- `components/auth/login-form.tsx`
- `components/auth/account-activation-form.tsx`
- `data/auth.ts`
- `types/auth.ts`

No se modifica `AppShell`, no se agregan assets a `public/` y no se incorporan dependencias a `package.json`.

## Plan de implementación

1. Crear `types/auth.ts` con `LoginDemoData`, `AccountActivationDemoData` y `AuthDemoData` sin conectar todavía esos tipos a las rutas existentes.
2. Crear `data/auth.ts` con el email del login, los datos de activación y la referencia estable a `mateo-fernandez`.
3. Ampliar `app/globals.css` únicamente con los tokens de fondo, bordes, placeholder y consentimiento que las referencias requieren y que todavía no existen.
4. Añadir `CheckIcon` a `components/icons.tsx` siguiendo el componente base de SVG existente; añadir a `Avatar` una medida de 44 px con texto de 19 px sin alterar las variantes consumidas por el feed y Niños.
5. Crear `components/auth/auth-brand.tsx`, `auth-field.tsx` y `auth-primary-action.tsx` para compartir la marca basada en `SunIcon`, los campos etiquetados y la acción principal visualmente deshabilitada.
6. Crear `components/auth/login-panel.tsx` con el gradiente, los círculos decorativos, la marca, el mensaje principal y el nombre de la guardería de `login.dc.html`.
7. Crear `components/auth/login-form.tsx` con los campos editables, la recuperación no disponible, la acción sin efecto y el enlace real a `/activate-account`, sin incorporar el selector de rol.
8. Crear `app/(auth)/login/page.tsx`, componer el panel y el formulario, y aplicar el layout de dos columnas desde 768 px y la variante móvil con el panel oculto.
9. Crear `components/auth/account-activation-form.tsx`, resolver el avatar de Mateo desde la fixture existente y representar los campos editables, el consentimiento nativo inicialmente marcado, la acción sin efecto y el enlace real a `/login`.
10. Crear `app/(auth)/activate-account/page.tsx` y aplicar el contenedor centrado y la adaptación responsive de una sola columna.
11. Verificar que ambas rutas preservan las pantallas existentes, no usan `AppShell`, no navegan desde sus acciones principales y no producen errores de consola.

Cada paso debe conservar `npm run dev` funcional y no debe crear enlaces a rutas distintas de `/login` y `/activate-account`.

## Criterios de aceptación

- [x] Visitar `/login` muestra la pantalla de acceso de OpenDayCare sin sidebar, cabecera móvil ni navegación inferior del área autenticada.
- [x] Visitar `/activate-account` muestra la pantalla de activación sin sidebar, cabecera móvil ni navegación inferior del área autenticada.
- [x] Las rutas viven en `app/(auth)/` y sus URLs públicas no incluyen el segmento `(auth)`.
- [x] A 1200 x 800, `/login` reproduce la estructura, medidas, espaciado, paleta, bordes, radios, sombras, tipografía e iconografía de `login.dc.html`, salvo la eliminación acordada del selector de rol y diferencias inevitables de antialiasing.
- [x] `/login` no muestra el rótulo `INGRESO COMO`, el botón Personal ni el botón Familia.
- [x] El login muestra `caro@opendaycare.com` como email inicial y `••••••••` como placeholder de contraseña.
- [x] El email y la contraseña del login pueden editarse sin disparar validaciones ni almacenar sus valores fuera del input.
- [x] Iniciar sesión conserva el estilo principal de la referencia, está semánticamente deshabilitado y no navega ni modifica estado.
- [x] ¿Olvidaste tu contraseña? permanece visible, se anuncia como no disponible y no navega.
- [x] Activá tu cuenta navega de `/login` a `/activate-account` mediante `next/link`.
- [x] A 1200 x 800, `/activate-account` reproduce la estructura, medidas, espaciado, paleta, bordes, radios, sombras, tipografía e iconografía de `activar-cuenta.dc.html`, salvo diferencias inevitables de antialiasing.
- [x] La activación muestra `Mateo · Sala Soles` y reutiliza el avatar de Mateo definido en `data/kids.ts`.
- [x] La activación muestra inicialmente el código `7K4P9`, el email `lucia.fernandez@gmail.com` y la contraseña precargada de la referencia.
- [x] Los tres inputs de activación pueden editarse sin disparar validaciones ni persistir sus valores.
- [x] El consentimiento comienza marcado y puede alternarse sin condicionar ninguna acción.
- [x] Activar mi cuenta conserva el estilo principal de la referencia, está semánticamente deshabilitado y no navega ni modifica estado.
- [x] Iniciar sesión navega de `/activate-account` a `/login` mediante `next/link`.
- [x] `AuthBrand`, `AuthField` y `AuthPrimaryAction` se reutilizan entre ambas pantallas y no existen implementaciones duplicadas de esas responsabilidades.
- [x] Las pantallas reutilizan Fredoka, Nunito, `SunIcon`, `Avatar` y los tokens existentes aplicables.
- [x] En anchos menores de 768 px, el login oculta el panel coral y muestra una marca compacta junto al formulario.
- [x] A 390 x 844, ambas pantallas conservan toda la información, no presentan scroll horizontal y ningún campo o enlace queda recortado.
- [x] La paleta permanece fiel a las referencias independientemente de la preferencia de tema del sistema.
- [x] La consola del navegador no muestra errores ni advertencias producidos por estas pantallas.
- [x] `npm run lint -- app components data types` finaliza correctamente.
- [x] `npx tsc --noEmit` finaliza correctamente.
- [x] `npm run build` finaliza correctamente.
- [x] `package.json` y `package-lock.json` no incorporan nuevas dependencias.

## Decisiones

- **Sí:** ambas rutas viven bajo `app/(auth)/`. El route group organiza las vistas de acceso sin formar parte de sus URLs públicas.
- **Sí:** las URLs son `/login` y `/activate-account`. Conservan los nombres técnicos en inglés usados por el proyecto.
- **No:** selector Personal/Familia. La pantalla de login no diferencia roles en esta demo.
- **Sí:** los enlaces secundarios permiten recorrer las dos pantallas mediante `next/link`. Esta navegación no implica autenticación ni redirección al feed.
- **No:** acciones para Iniciar sesión, Activar mi cuenta y recuperar contraseña. Se mantienen solo para replicar la composición visual.
- **Sí:** los inputs permanecen editables mediante comportamiento nativo no controlado. No requieren estado React ni una frontera de cliente.
- **Sí:** el consentimiento es un checkbox nativo inicialmente marcado y estilizado como la referencia. Su valor no condiciona ninguna acción.
- **Sí:** los datos visibles permanecen fijos en `data/auth.ts`. No existe una fuente remota ni persistente en esta etapa.
- **Sí:** la invitación reutiliza el avatar de Mateo desde `data/kids.ts`. No se duplica su configuración visual.
- **Sí:** se crea una marca de autenticación sobre `SunIcon`. `Brand` no se reutiliza directamente porque enlaza al feed y exige el nombre de una sala autenticada.
- **No:** `AppShell` en rutas de autenticación. El shell actual representa el área autenticada y mostraría navegación ajena a las referencias.
- **Sí:** el panel coral se oculta en móvil y se sustituye por una marca compacta. La referencia no define una versión móvil y el formulario debe conservar prioridad.
- **No:** Playwright o un runner automatizado. La validación acordada combina navegador, lint, TypeScript y build.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las acciones principales pueden parecer funcionales por conservar el estilo de la referencia. | Usar semántica deshabilitada, impedir foco y navegación, y conservar la apariencia mediante los estados Tailwind existentes. |
| Los inputs editables pueden sugerir que el formulario se envía. | No asociar lógica de submit, mantener la acción principal deshabilitada y limitar el estado al comportamiento nativo del control. |
| No existen referencias visuales móviles para estas pantallas. | Aplicar el breakpoint de 768 px establecido por el proyecto y verificar ausencia de recortes y scroll horizontal a 390 x 844. |
| Ampliar `Avatar` puede alterar consumidores existentes. | Añadir una variante nueva para activación sin modificar las clases de tamaño actuales. |

## Qué **no** incluye esta spec

- Autenticación, autorización, sesión o cierre de sesión.
- Validación o envío de formularios.
- Redirección o navegación al feed.
- Recuperación de contraseña.
- Persistencia, API, base de datos o datos obtenidos por red.
- Protección de rutas o middleware.
- Feed familiar.
- Playwright, snapshots visuales automatizados o un runner de pruebas.
- Otras plantillas del directorio `referencias/pantallas/`.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
