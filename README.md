# Portafolio profesional: API

[![CI](https://github.com/Ayllescas34/portafolio-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayllescas34/portafolio-backend/actions/workflows/ci.yml)

API REST del portafolio y hoja de vida interactiva de Alejandro Flores Yllescas. Todo el contenido
profesional vive en PostgreSQL y se edita desde un panel propio, sin tocar código.

El sitio y el panel están en [portafolio-front](https://github.com/Ayllescas34/portafolio-front).

> **Estado:** funciona en entorno local. Todavía no está desplegado.

## Stack

| Área | Tecnología |
|---|---|
| API | NestJS 11, TypeScript, REST, Swagger/OpenAPI, class-validator |
| Datos | PostgreSQL 18, Prisma 6 (migraciones y seed) |
| Seguridad | Argon2id, JWT en cookie httpOnly con revocación, Helmet, rate limiting, guard global que niega por defecto |
| Pruebas | Jest y Supertest, con integración contra PostgreSQL real |

## Estructura

```
├── src/         módulos de la API
├── prisma/      esquema, migraciones y seed
├── test/        pruebas de integración
├── scripts/     servidor aislado para las pruebas E2E del frontend
├── database/    creación del rol y las bases locales (local/ es privado)
├── docs/        manual y documentación técnica
└── uploads/     archivos subidos desde el panel (fuera de Git)
```

## Documentación

- [Manual de uso y operación](docs/MANUAL.md)
- [Arquitectura](docs/arquitectura.md)
- [Modelo de datos](docs/modelo-de-datos.md)
- [API](docs/api.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Mejoras futuras](docs/mejoras-futuras.md)

## Instalación

Requisitos: Node.js 22, npm 10 y PostgreSQL 18.

```bash
npm install
```

1. **Base de datos.** Crea el rol `portafolioayllescas` y las bases `portafolio_ayllescas` y
   `portafolio_ayllescas_test`. El script pide la contraseña de `postgres`:
   ```bash
   powershell -ExecutionPolicy Bypass -File .\database\scripts\setup-local-db.ps1
   ```
2. **Variables de entorno.** Copia `.env.example` a `.env` y complétalo. Las URLs generadas quedan
   en `database/local/credentials.local.env`.

   | Variable | Descripción |
   |---|---|
   | `DATABASE_URL`, `TEST_DATABASE_URL` | Conexiones de desarrollo y pruebas (la de pruebas debe terminar en `_test`) |
   | `JWT_SECRET` | 32 o más caracteres aleatorios |
   | `JWT_EXPIRES_IN` | Duración de la sesión, por ejemplo `2h` |
   | `CORS_ORIGINS` | Orígenes permitidos, por ejemplo `http://localhost:4200` |
   | `COOKIE_SECURE`, `SWAGGER_ENABLED`, `RATE_LIMIT_ENABLED`, `UPLOADS_DIR` | Ver `.env.example` |

   La API valida estas variables al arrancar y no inicia si alguna es inválida.
3. **Migraciones y datos iniciales:**
   ```bash
   npm run db:deploy
   ```
   ```bash
   npm run db:seed
   ```
4. **Administrador.** Pide la contraseña sin mostrarla y guarda solo el hash:
   ```bash
   npm run admin:create
   ```

## Comandos

| Comando | Uso |
|---|---|
| `npm run start:dev` | API en http://localhost:3000/api y Swagger en http://localhost:3000/api/docs |
| `npm test` | Pruebas unitarias |
| `npm run test:integration` | Pruebas de integración sobre la base `*_test` |
| `npm run lint`, `npm run typecheck` | Calidad de código |
| `npm run build` | Compilación de producción |

Las pruebas de integración recrean su base desde las migraciones y no se ejecutan contra una base
cuyo nombre no termine en `_test`.

## Flujo de trabajo

- `main` siempre debe estar estable.
- Cada cambio se trabaja en una rama `feat/...` o `fix/...` y entra por pull request.
- La integración continua ejecuta lint, compilación y pruebas en cada push a `main` y en cada pull
  request.

## Decisiones importantes

- El contenido no confirmado se guarda como borrador oculto; nada se inventa.
- Los datos privados del CV (teléfono, dirección y referencias) no están en este repositorio. El
  teléfono se administra desde el panel y permanece oculto salvo que se publique de forma explícita.
- Las credenciales locales quedan fuera de Git.

## Problemas conocidos

- Prisma 6 advierte que la clave `package.json#prisma` desaparecerá en Prisma 7. No afecta al
  funcionamiento.
- `npm audit` reporta vulnerabilidades moderadas en dependencias de desarrollo de los CLI. No se
  forzaron actualizaciones mayores para no romper versiones compatibles.
