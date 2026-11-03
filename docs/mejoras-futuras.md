# Mejoras futuras

## Contenido pendiente de confirmar (desde el panel)

- Logros verificables en **Canella**, si se pueden mencionar.
- Nivel de **inglés** (cualitativo o certificado) y publicarlo.
- Enlace al repositorio de **Control de Gastos** cuando el código público esté al día.
- Año de inicio de la carrera en la Universidad Mariano Gálvez.
- Foto de perfil, capturas de proyectos y una versión pública del CV en PDF.
- Certificaciones o cursos, si existen.

## Producción (fase siguiente)

1. Hosting: frontend estático (CDN) y API en contenedor; PostgreSQL gestionado con copias de seguridad.
2. Variables de producción: `NODE_ENV=production`, `COOKIE_SECURE=true`, `JWT_SECRET` nuevo,
   `CORS_ORIGINS` con el dominio real, `SWAGGER_ENABLED=false` o protegido.
3. Mismo dominio para frontend y API (proxy inverso) para mantener `SameSite=Strict`.
4. Almacenamiento de archivos en un servicio de objetos (S3 o similar) en lugar de `uploads/`.
5. Rate limiting con almacenamiento compartido si hay varias instancias.
6. CSP con *hash* para el script de tema de `index.html`; HSTS.
7. Envío real de notificaciones de contacto (correo transaccional), con consentimiento.
8. Dominio, certificado TLS y monitoreo de disponibilidad.

## Producto

- Versión en inglés (tablas de traducción + `en.ts`) y selector de idioma.
- Prerenderizado (SSR/SSG) para SEO y para compartir enlaces con vista previa.
- Ordenar arrastrando en el panel, además de los botones subir y bajar.
- Historial de cambios (auditoría por usuario) y papelera para recuperar borrados.
- Migrar a Prisma 7+ con `prisma.config.ts` y a Nest 12.
- Pruebas automáticas de accesibilidad con axe-core.
