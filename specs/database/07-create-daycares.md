# SPEC 07 — Tabla de guarderías

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-09-06
> **Objetivo:** Crear mediante una migración remota la tabla raíz `public.daycares`, protegerla con RLS y cargar cinco guarderías iniciales.

## Por qué existe esta spec

El esquema de referencia define `daycares` como la entidad raíz de la que dependerán usuarios y salas. El proyecto remoto todavía no contiene tablas de dominio en `public`, por lo que esta spec establece el primer objeto persistente y el patrón inicial de migraciones mediante Supabase MCP.

## Alcance

**Incluye:**

- Crear `public.daycares` en el proyecto Supabase conectado.
- Aplicar el cambio mediante una única migración remota llamada `create_daycares` con `supabase_apply_migration`.
- Usar una clave primaria UUID generada por PostgreSQL.
- Exigir un nombre no nulo y rechazar nombres vacíos o compuestos únicamente por espacios.
- Registrar automáticamente la fecha de creación con zona horaria.
- Activar RLS desde la creación de la tabla.
- Mantener la tabla sin políticas RLS mientras no exista `public.users` para expresar pertenencia a una guardería.
- Revocar todos los privilegios sobre la tabla a `anon` y `authenticated`.
- Insertar cinco guarderías de demostración en la misma migración.
- Enumerar `Sala Soles` como el primer valor del `INSERT`, sin atribuir un orden persistente a las filas.
- Verificar estructura, restricciones, RLS, privilegios, datos e historial de migraciones después de aplicar el cambio.
- Ejecutar los asesores de seguridad y rendimiento de Supabase después de la migración.

**Fuera de alcance (para specs futuras):**

- Crear `public.users`, `public.rooms` o cualquier otra tabla del esquema de referencia.
- Añadir `updated_at` o un trigger de actualización.
- Añadir una restricción única sobre `name`.
- Normalizar, recortar o cambiar mayúsculas y minúsculas de los nombres almacenados.
- Añadir una columna de orden, una guardería predeterminada o una marca de guardería destacada.
- Crear políticas RLS basadas en usuarios, roles o pertenencia a una guardería.
- Conceder acceso a `anon` o `authenticated` mediante el Data API.
- Inicializar un proyecto local de Supabase o crear archivos bajo `supabase/`.
- Instalar Supabase CLI o paquetes JavaScript de Supabase.
- Generar tipos TypeScript o conectar la aplicación Next.js con la tabla.
- Crear una migración de reversión.

## Modelo de datos

### `public.daycares`

| Campo | Tipo | Restricciones y valor predeterminado |
| --- | --- | --- |
| `id` | `uuid` | PK, `NOT NULL`, default `gen_random_uuid()` |
| `name` | `text` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |

La tabla incluye la restricción `daycares_name_not_blank`:

```sql
check (btrim(name) <> '')
```

No existe una restricción `UNIQUE` sobre `name`. Dos guarderías pueden compartir nombre porque el modelo todavía no incluye una dirección ni un identificador legal que permita distinguirlas.

RLS queda habilitado sin políticas. Además, `anon` y `authenticated` no conservan privilegios sobre la tabla, por lo que la aplicación no puede leer ni modificar estas filas hasta que una spec posterior defina el modelo real de autorización.

### Datos iniciales

La migración usa un único `INSERT` de varias filas y deja que PostgreSQL genere los UUID y las fechas:

| Posición en el `INSERT` | `name` |
| --- | --- |
| 1 | `Sala Soles` |
| 2 | `Jardín Arcoíris` |
| 3 | `Pequeños Exploradores` |
| 4 | `Casita Feliz` |
| 5 | `Mundo de Colores` |

La posición del `INSERT` no es una propiedad del modelo. Las consultas no pueden asumir ese orden y deberán usar un `ORDER BY` explícito cuando una funcionalidad futura necesite ordenar guarderías.

## Artefactos

**Objetos remotos nuevos:**

- Tabla `public.daycares`.
- Restricción `daycares_pkey` creada por la clave primaria.
- Restricción `daycares_name_not_blank`.
- Entrada versionada `create_daycares` en el historial remoto de migraciones.
- Cinco filas de demostración en `public.daycares`.

**Archivos locales de implementación:**

- Ninguno.

No se modifican archivos de `app/`, `components/`, `lib/`, `data/`, `types/`, `package.json` ni `package-lock.json`, y no se crea un directorio `supabase/`.

## Plan de implementación

1. Volver a consultar las tablas de `public` y el historial remoto inmediatamente antes del cambio; detener la implementación si ya existe `public.daycares` o una migración de dominio conflictiva.
2. Preparar una única migración `create_daycares` que cree la tabla y sus restricciones, active RLS, revoque los privilegios de `anon` y `authenticated` e inserte las cinco filas acordadas como una sola unidad versionada.
3. Aplicar la migración al proyecto conectado mediante `supabase_apply_migration`, sin ejecutar DDL con `supabase_execute_sql` y sin crear identificadores UUID manuales.
4. Consultar los catálogos de PostgreSQL para verificar las tres columnas, sus tipos, nulabilidad, defaults, clave primaria, check constraint y estado de RLS.
5. Verificar que no existan políticas para `public.daycares` y que `anon` y `authenticated` no tengan privilegios sobre la tabla.
6. Consultar la tabla con un rol administrativo para confirmar que existen exactamente las cinco filas y que sus nombres coinciden con el conjunto acordado.
7. Confirmar que el historial remoto contiene `create_daycares` después de las dos migraciones técnicas de conexión ya existentes.
8. Ejecutar los asesores de seguridad y rendimiento y resolver cualquier aviso atribuible a esta migración antes de considerar la spec implementada.

La migración debe dejar el esquema íntegro y utilizable por roles administrativos. No debe abrir acceso de aplicación antes de que exista un modelo de autorización por guardería.

## Criterios de aceptación

- [x] `public.daycares` existe en el proyecto Supabase conectado.
- [x] La tabla contiene exactamente `id`, `name` y `created_at`, sin `updated_at` ni columnas adicionales.
- [x] `id` es `uuid`, clave primaria, no admite nulos y usa `gen_random_uuid()` como default.
- [x] `name` es `text`, no admite nulos y no tiene una restricción única.
- [x] La restricción `daycares_name_not_blank` rechaza `''` y nombres compuestos únicamente por espacios.
- [x] La restricción `daycares_name_not_blank` acepta un nombre con al menos un carácter no vacío.
- [x] `created_at` es `timestamptz`, no admite nulos y usa `now()` como default.
- [x] Insertar una fila indicando únicamente `name` genera automáticamente un UUID y una fecha de creación.
- [x] RLS está habilitado para `public.daycares`.
- [x] No existen políticas RLS para `public.daycares`.
- [x] `anon` no tiene privilegios sobre `public.daycares`.
- [x] `authenticated` no tiene privilegios sobre `public.daycares`.
- [x] Un rol administrativo puede consultar las filas de `public.daycares`.
- [x] La tabla contiene exactamente cinco filas después de la migración.
- [x] Los nombres almacenados son exactamente `Sala Soles`, `Jardín Arcoíris`, `Pequeños Exploradores`, `Casita Feliz` y `Mundo de Colores`.
- [x] El `INSERT` de la migración enumera `Sala Soles` en primer lugar.
- [x] Ningún UUID del seed está escrito manualmente en la migración.
- [x] La migración remota se llama `create_daycares` y aparece una sola vez en el historial.
- [x] Las migraciones técnicas `create_connection_test_table` y `drop_connection_test_table` permanecen intactas en el historial.
- [ ] Los asesores de seguridad y rendimiento no reportan avisos introducidos por `public.daycares`.
- [x] No se crea ni modifica ningún archivo de la aplicación ni se inicializa un directorio local `supabase/`.

## Decisiones

- **Sí:** usar como fuente de verdad la definición específica de `daycares` del esquema de referencia. Por eso la tabla incluye `created_at`, pero no `updated_at`.
- **Sí:** conservar UUID con `gen_random_uuid()` para respetar la convención transversal del esquema y permitir identificadores no secuenciales expuestos en futuras relaciones.
- **Sí:** exigir que todos los campos sean no nulos y proporcionar defaults para `id` y `created_at`.
- **Sí:** rechazar nombres vacíos mediante `btrim(name) <> ''`. El valor se valida, pero no se transforma antes de almacenarlo.
- **No:** hacer `name` único. Dos entidades distintas pueden tener el mismo nombre y todavía no existe otro atributo de identidad comercial.
- **Sí:** aplicar estructura, seguridad y datos iniciales en una sola migración llamada `create_daycares`.
- **Sí:** insertar cinco guarderías de demostración porque formarán el conjunto inicial solicitado.
- **Sí:** enumerar `Sala Soles` primero en el SQL como decisión de legibilidad del seed.
- **No:** representar ese orden mediante una columna. PostgreSQL no garantiza orden de consulta sin `ORDER BY`.
- **Sí:** activar RLS desde el inicio y no crear políticas temporales. Todavía no existe `public.users` para expresar aislamiento entre guarderías.
- **Sí:** revocar explícitamente privilegios de `anon` y `authenticated`. RLS y privilegios cumplen responsabilidades distintas y se aplica mínimo privilegio en ambas capas.
- **No:** permitir lectura global a usuarios autenticados. Eso expondría todas las guarderías en un modelo multi-tenant.
- **Sí:** usar exclusivamente `supabase_apply_migration` para el DDL remoto y conservar una entrada en el historial administrado por Supabase.
- **No:** inicializar Supabase local en esta spec. El patrón elegido para este primer cambio de dominio es una migración remota mediante MCP.
- **No:** usar `CREATE TABLE IF NOT EXISTS`. Una migración versionada debe fallar ante drift en vez de ocultar una tabla incompatible.
- **No:** generar tipos o integrar el cliente todavía. Esta spec define únicamente persistencia y seguridad inicial.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| RLS sin políticas impide que la aplicación consulte las cinco filas. | Mantener este bloqueo deliberado hasta que una spec de usuarios defina pertenencia y políticas multi-tenant. |
| Una migración exclusivamente remota no deja un archivo SQL versionado en Git. | Conservar el cambio en el historial de migraciones de Supabase y documentar todo el contrato verificable en esta spec. |
| Interpretar `Sala Soles` como primera fila puede generar dependencia de un orden inexistente. | Documentar que solo ocupa la primera posición del `INSERT` y exigir `ORDER BY` en cualquier consulta futura que necesite orden. |
| Los nombres no únicos pueden resultar ambiguos cuando se muestren juntos. | Añadir dirección, código o identidad legal en una spec futura antes de imponer unicidad incorrecta. |
| Aplicar el cambio directamente al proyecto conectado puede afectar consumidores no identificados. | Confirmar inmediatamente antes de migrar que `public` continúa sin tablas y mantener bloqueado el acceso de aplicación. |

## Qué **no** incluye esta spec

- Tablas distintas de `public.daycares`.
- Edición o actualización automática de guarderías.
- Un orden persistente o una guardería predeterminada.
- Unicidad global de nombres.
- Políticas de acceso para usuarios de la aplicación.
- Exposición mediante Data API.
- Integración de Supabase en Next.js.
- Tipos TypeScript, fixtures nuevas o cambios visuales.
- Archivos locales de Supabase o una migración SQL dentro del repositorio.

Cada una de esas capacidades debe definirse en su propia spec antes de implementarse.
