# Mejoras futuras

## Contenido pendiente de confirmar (desde el panel)

- Modalidad, ubicación y logros verificables en **Canella** (responsabilidades y tecnologías ya cargadas).
- Tecnologías específicas de Canella no confirmadas aún (lenguaje, base de datos, herramientas de CI/CD).
- Nivel de **inglés** (cualitativo o certificado) y publicarlo.
- Revisar y publicar el proyecto **Control de Gastos**, y su repositorio si es público.
- Confirmar y publicar el enlace de **GitHub**; agregar **LinkedIn**.
- Semestre actual y año de inicio de la carrera en la Universidad Mariano Gálvez.
- Foto de perfil, capturas de proyectos y una versión pública del CV en PDF.
- Certificaciones o cursos, si existen.

## Repositorio y producción (fase siguiente)

1. Crear el repositorio remoto y hacer el primer push (rama `main`).
2. CI: lint, pruebas unitarias, integración (PostgreSQL como servicio) y E2E en cada PR.
3. Hosting: frontend estático (CDN) y API en contenedor; PostgreSQL gestionado con copias de seguridad.
4. Variables de producción: `NODE_ENV=production`, `COOKIE_SECURE=true`, `JWT_SECRET` nuevo,
   `CORS_ORIGINS` con el dominio real, `SWAGGER_ENABLED=false` o protegido.
5. Mismo dominio para frontend y API (proxy inverso) para mantener `SameSite=Strict`.
6. Almacenamiento de archivos en un servicio de objetos (S3 o similar) en lugar de `backend/uploads`.
7. Rate limiting con almacenamiento compartido si hay varias instancias.
8. CSP con *hash* para el script de tema de `index.html`; HSTS.
9. Envío real de notificaciones de contacto (correo transaccional), con consentimiento.
10. Dominio, certificado TLS y monitoreo de disponibilidad.

## Producto

- Versión en inglés (tablas de traducción + `en.ts`) y selector de idioma.
- Prerenderizado (SSR/SSG) para SEO y para compartir enlaces con vista previa.
- Ordenar arrastrando en el panel, además de los botones subir y bajar.
- Historial de cambios (auditoría por usuario) y papelera para recuperar borrados.
- Migrar a Prisma 7+ con `prisma.config.ts` y a Nest 12.
- Pruebas automáticas de accesibilidad con axe-core.
