# Contrato de la API

Documentación interactiva: **http://localhost:3000/api/docs** (Swagger UI) ·
esquema OpenAPI: `http://localhost:3000/api/docs/openapi.json`.

## Convenciones

| Prefijo | Acceso | Uso |
|---|---|---|
| `/api/public/...` | Público | Contenido publicado y formulario de contacto |
| `/api/auth/...` | Público (login) / sesión | Inicio y cierre de sesión |
| `/api/admin/...` | **Requiere sesión** | Administración de contenido |
| `/api/health` | Público | Estado del servicio y de la base de datos |

**Respuesta correcta:** `{ "data": ... }`; listados: `{ "data": [...], "meta": { page, pageSize, total, totalPages } }`.
**Respuesta de error:**

```json
{ "error": { "statusCode": 400, "code": "VALIDATION_ERROR", "message": "Los datos enviados no son válidos",
  "details": [{ "field": "email", "errors": ["debe ser un correo electrónico válido"] }],
  "path": "/api/public/contact", "timestamp": "2026-11-03T17:00:00.000Z" } }
```

Códigos: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`, `404 NOT_FOUND`, `409 CONFLICT`
(slug duplicado, registro en uso), `413 PAYLOAD_TOO_LARGE`, `429 TOO_MANY_REQUESTS`,
`503 SERVICE_UNAVAILABLE`, `500 INTERNAL_ERROR` (sin detalles internos).

## Autenticación

- `POST /api/auth/login` `{ email, password }` → establece la cookie `portfolio_session`
  (httpOnly, SameSite=Strict, Path=/api, 2 h). Límite: **5 intentos por minuto**.
- `GET /api/auth/me` → administrador actual.
- `POST /api/auth/logout` → borra la cookie y **revoca** todos los tokens (`token_version + 1`).
- `PATCH /api/admin/account/password` `{ currentPassword, newPassword }` → cambia la contraseña y cierra todas las sesiones.

No hay refresh token: con una sola persona administradora y sesiones de 2 horas, volver a iniciar
sesión es más simple y seguro que mantener tokens de larga duración.

## Público

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/public/portfolio` | Todo lo publicado (perfil, destacados, redes, experiencia, educación, habilidades, certificaciones, proyectos y filtros) en una respuesta |
| GET | `/api/public/projects?technology=<slug>&category=<CATEGORÍA>` | Proyectos publicados filtrados |
| GET | `/api/public/projects/:slug` | Detalle (404 si no existe o no está publicado) |
| POST | `/api/public/contact` | `{ name, email, subject, message, website }` → `202`. `website` es un campo trampa y debe ir vacío. Límite: **3 mensajes cada 10 minutos** |

El teléfono solo aparece si `isPhonePublic = true`. Nunca se exponen `passwordHash`, `isPublished`
ni datos de auditoría internos.

## Administración (`/api/admin`)

Recursos con el mismo patrón:

| Recurso | Ruta base |
|---|---|
| Destacados de "Sobre mí" | `/profile-highlights` |
| Experiencia | `/experiences` (incluye `responsibilities[]`, `achievements[]`, `technologyIds[]`) |
| Educación | `/education` |
| Certificaciones | `/certifications` |
| Categorías de habilidades | `/skill-categories` |
| Habilidades | `/skills` (`?categoryId=&isFeatured=`) |
| Tecnologías | `/technologies` (sin orden manual) |
| Proyectos | `/projects` (incluye `technologyIds[]`, `responsibilities[]`, `images[]`; `?category=&status=&isFeatured=`) |
| Enlaces sociales | `/social-links` |

Para cada uno: `GET /` (lista paginada), `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`
y `PUT /order` `{ ids: [...] }` (reordenar en una transacción).

Parámetros de listado: `page`, `pageSize` (máx. 100), `search`, `sortBy` (solo campos
permitidos; otro valor → 400), `sortOrder` (`asc`/`desc`), `isPublished`.

Singletons: `GET|PUT /api/admin/profile`, `GET|PUT /api/admin/site-settings`.

Mensajes: `GET /api/admin/contact-messages?status=NEW|READ|ARCHIVED`,
`GET /unread-count`, `GET /:id`, `PATCH /:id { status }`, `DELETE /:id`.

Archivos: `POST /api/admin/media?kind=image|document` (multipart, campo `file`). Imágenes
PNG/JPEG/WebP hasta 2 MB; PDF hasta 5 MB. Se identifican por su contenido (no por la extensión)
y se guardan como `/uploads/<uuid>.<ext>`.

Las operaciones que tocan varias tablas (crear o editar experiencia o proyecto con sus listas,
reordenar) se ejecutan dentro de una **transacción**: si algo falla, no queda nada a medias.
