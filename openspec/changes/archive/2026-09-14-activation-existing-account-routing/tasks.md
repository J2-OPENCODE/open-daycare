## 1. Base de datos

- [x] 1.1 Escribir la especificación de base de datos bajo `specs/database/` con la función de existencia, sus privilegios y su justificación, y verificar que describe `SECURITY DEFINER`, `search_path = ''`, retorno booleano y `EXECUTE` concedido solo a `service_role`
- [x] 1.2 Aplicar la migración con `supabase_apply_migration` y verificar con `supabase_execute_sql` que la función existe, que `anon` y `authenticated` no tienen `EXECUTE` y que `service_role` sí
- [x] 1.3 Comprobar la función con un email inexistente y con un email de una cuenta real, y verificar que devuelve `false` y `true` respectivamente
- [x] 1.4 Regenerar `types/database.ts` con `supabase_generate_typescript_types` y verificar que `npx tsc --noEmit` pasa
- [x] 1.5 Ejecutar los advisors de seguridad y rendimiento, y verificar que cualquier hallazgo nuevo corresponde al uso esperado de `SECURITY DEFINER` y queda documentado

## 2. Sonda en el servidor

- [x] 2.1 Añadir en `lib/invitations.ts` la función que consulta la existencia con el cliente administrativo, normaliza el email y propaga el error en lugar de devolver `false`, y verificar que ningún módulo de cliente la importa
- [x] 2.2 Verificar por revisión del código que la sonda nunca devuelve rol, estado, guardería ni identificadores de la cuenta

## 3. Enrutamiento de la activación

- [x] 3.1 En `app/(auth)/activate-account/page.tsx`, ejecutar la sonda en la rama de visitante anónimo después de resolver el contexto del token, y verificar que un token inválido o vencido no la dispara
- [x] 3.2 Redirigir con el retorno construido por `buildActivationReturnTo(token)` cuando la sonda devuelve verdadero, y verificar que el destino resultante es aceptado por `resolveActivationReturnTo`
- [x] 3.3 Tratar el fallo de la sonda como error cerrado que no muestra el formulario de alta, y verificar el comportamiento forzando un fallo temporal de la consulta
- [x] 3.4 Verificar que el visitante anónimo sin cuenta sigue viendo el formulario de alta sin cambios visuales ni de campos

## 4. Correcciones de la carrera y del retorno

- [x] 4.1 Hacer que el enlace `Iniciar sesión` de `components/auth/account-activation-form.tsx` conserve el retorno canónico de la activación, y verificar el destino renderizado en la variante de alta
- [x] 4.2 Ejecutar la sonda en `createParentAccount` antes de `generateAuthUserId()` y detener el alta cuando la cuenta exista, y verificar que no se crea el claim en `private.parent_signup_claims`
- [x] 4.3 Verificar que el mensaje genérico de `auth.admin.createUser` sigue presente como última barrera

## 5. Verificación de extremo a extremo

- [x] 5.1 Enviar una invitación a un email sin cuenta, completar el alta desde el enlace y verificar que termina con sesión parent activa en `/activate-account/success`
- [x] 5.2 Enviar una invitación a un email con cuenta parent existente de la misma guardería, abrir el enlace sin sesión y verificar que lleva al inicio de sesión con el retorno correcto y que tras autenticarse pide solo el código
- [x] 5.3 Verificar que ese segundo caso no incrementa `failed_attempts` de la invitación antes de introducir el código
- [x] 5.4 Repetir la apertura con sesión de otro rol y con sesión de otra guardería, y verificar que aparece el aviso de sesión incorrecta con salida que conserva el retorno
- [x] 5.5 Verificar que el resultado del envío en el modal de staff es idéntico en todos los casos anteriores
- [x] 5.6 Ejecutar `npm run lint -- app` y `npm run build`, y verificar que ambos terminan sin errores
- [x] 5.7 Eliminar las identidades y filas técnicas creadas durante la verificación y confirmar conteos en cero
