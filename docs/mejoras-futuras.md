# Mejoras futuras

## Contenido pendiente de confirmar (desde el panel)

- Logros verificables en **Canella**, si se pueden mencionar.
- Nivel de **inglés** (cualitativo o certificado) y publicarlo.
- Enlace al repositorio de **Control de Gastos** cuando el código público esté al día.
- Año de inicio de la carrera en la Universidad Mariano Gálvez.
- Foto de perfil, capturas de proyectos y una versión pública del CV en PDF.
- Certificaciones o cursos, si existen.

## Producción

La arquitectura actual está en [despliegue.md](despliegue.md). Quedan pendientes:

1. Dominio propio, con HTTPS también entre CloudFront y el servidor.
2. Monitoreo de disponibilidad y alertas.
3. Envío real de notificaciones de contacto (correo transaccional), con consentimiento.
4. Base de datos gestionada y archivos en S3, si el tráfico o el valor de los datos lo justifican.
5. Rate limiting con almacenamiento compartido si hay varias instancias.

## Producto

- Versión en inglés (tablas de traducción + `en.ts`) y selector de idioma.
- Prerenderizado (SSR/SSG) para SEO y para compartir enlaces con vista previa.
- Ordenar arrastrando en el panel, además de los botones subir y bajar.
- Historial de cambios (auditoría por usuario) y papelera para recuperar borrados.
- Migrar a Prisma 7+ con `prisma.config.ts`, a Nest 12 y a `@nestjs/swagger` 12; esto resuelve los
  avisos restantes de `npm audit`.
