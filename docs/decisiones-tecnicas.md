# Decisiones técnicas

| # | Decisión | Alternativas | Motivo |
|---|---|---|---|
| 1 | **Prisma 6.19** (no 7/8) | TypeORM, Prisma 7+ | Prisma es el ORM pedido. La versión 7+ cambia el cliente a ESM y exige adaptadores; la 6.x es estable con NestJS (CommonJS). Migrar es una mejora futura. |
| 2 | **NestJS 11** (no 12) | Nest 12 | El CLI instalado (11.0.10) genera Nest 11. Todas las dependencias `@nestjs/*` se fijaron a versiones compatibles. |
| 3 | **Angular 20** con componentes standalone y signals | Módulos NgModule | La versión instalada lo permite y reduce código. |
| 4 | **JWT en cookie httpOnly** + `SameSite=Strict` | Bearer en `localStorage` | JavaScript nunca puede leer el token (mitiga XSS). Como el frontend usa un proxy del mismo origen, `SameSite=Strict` evita CSRF. |
| 5 | **Revocación con `token_version`** | Lista negra de tokens | Cerrar sesión invalida los tokens en el servidor sin guardar estado por token. |
| 6 | **Sin refresh token** | Access + refresh | Una sola persona administradora; sesiones de 2 h. Menos superficie de ataque. |
| 7 | **Argon2id** (`@node-rs/argon2`, parámetros OWASP) | bcrypt | Recomendación actual; binarios precompilados para Windows. |
| 8 | **Guard global "denegar por defecto"** | `@UseGuards` en cada controlador | Un endpoint nuevo nunca queda expuesto por olvido. |
| 9 | **Rate limiting** con `@nestjs/throttler` (en memoria) | Redis | Suficiente para un solo proceso local. En producción con varias instancias: almacenamiento compartido. |
| 10 | **Proxy de Angular** para `/api` y `/uploads` | CORS directo | Mismo origen en desarrollo; CORS sigue limitado a `localhost:4200` como defensa adicional. |
| 11 | **Panel declarativo** (configuración + formulario y listado genéricos) | Una pantalla por recurso | Once recursos sin duplicar código; agregar un campo es una línea. |
| 12 | **PostgreSQL local** (no Docker) | Docker Compose | Docker no está instalado; no se impuso como requisito. |
| 13 | **Fuentes locales** (`@fontsource-variable`) | Google Fonts | Sin peticiones a terceros ni rastreo. |
| 14 | **Pruebas de integración contra PostgreSQL real** (`*_test`) | Mocks / SQLite | Verifican restricciones, transacciones y errores reales de la base. Protección: se niegan a correr si la base no termina en `_test`. |
| 15 | **Playwright con el Chrome instalado** (`channel: 'chrome'`) | Descargar navegadores | Sin descargas adicionales. |
| 16 | **Hoja de vida generada desde los datos** (`/cv` + `@media print`) | Publicar el PDF original | El PDF original contiene datos privados (dirección, referencias). |
| 17 | **Contenido no confirmado como borrador oculto** | Inventar o rellenar | Requisito del proyecto: no inventar datos. |

## Seguridad aplicada

- Contraseñas: Argon2id; el script `admin:create` pide la contraseña sin mostrarla y solo guarda el hash.
- Inicio de sesión con trabajo equivalente aunque el correo no exista (sin enumeración de usuarios) y mensaje genérico.
- Helmet (CSP, `nosniff`, etc.), `x-powered-by` desactivado, JSON limitado a 100 KB.
- Validación estricta: propiedades desconocidas → 400 (evita asignación masiva); texto sanitizado; URLs solo http(s).
- Ordenamiento solo por campos permitidos.
- Archivos validados por firma de bytes; SVG rechazado; nombres aleatorios; límites de tamaño.
- Logs sin cuerpos, cookies ni cabeceras; los errores 500 no devuelven detalles internos.
- `.env` y `database/local/` fuera de Git; `.env.example` sin secretos.
- Redirección tras login limitada a rutas `/admin` (sin redirecciones abiertas).
