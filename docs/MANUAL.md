# Manual del portafolio

Guía para levantar, usar y mantener el portafolio en tu computadora.
**Todas las credenciales** (usuarios, contraseñas, nombres de bases de datos) están en
[`CREDENCIALES.local.md`](../CREDENCIALES.local.md), en la raíz del proyecto. Ese archivo no se
sube a Git ni a ningún servicio: guárdalo en un lugar seguro (por ejemplo, tu gestor de contraseñas).

---

## 1. Qué hay en cada carpeta

```
C:\proyectos-portafolio\portafolio
├── backend\     API (NestJS + Prisma). Puerto 3000.
├── frontend\    Sitio y panel (Angular + Three.js). Puerto 4200.
├── database\    Scripts para crear la base. database\local\ = credenciales privadas.
├── docs\        Esta guía y la documentación técnica.
├── CREDENCIALES.local.md   (privado, no versionado)
└── README.md
```

| Servicio | Dirección |
|---|---|
| Sitio público | http://localhost:4200 |
| Hoja de vida imprimible | http://localhost:4200/cv |
| Panel de administración | http://localhost:4200/admin |
| API | http://localhost:3000/api |
| Swagger (documentación de la API) | http://localhost:3000/api/docs |
| Estado de la API | http://localhost:3000/api/health |

---

## 2. Levantar el proyecto (uso diario)

Necesitas **dos terminales** de PowerShell.

**a) PostgreSQL.** Es un servicio de Windows que normalmente ya está iniciado. Para comprobarlo:

```bash
Get-Service postgresql-x64-18
```

Si aparece `Stopped`, inícialo desde una terminal **como administrador**:

```bash
Start-Service postgresql-x64-18
```

**b) API (terminal 1):**

```bash
cd C:\proyectos-portafolio\portafolio\backend
```

```bash
npm run start:dev
```

Espera el mensaje `API lista en http://localhost:3000/api`.

**c) Sitio (terminal 2):**

```bash
cd C:\proyectos-portafolio\portafolio\frontend
```

```bash
npm start
```

Cuando diga `Local: http://localhost:4200/`, abre esa dirección en el navegador.

Para detener cualquiera de los dos: `Ctrl + C` en su terminal.

---

## 3. Instalación desde cero (otra computadora o tras borrar la base)

Requisitos: Node.js 22, PostgreSQL 18 y Git. Chrome solo para las pruebas E2E.

1. **Dependencias** (una vez):
   ```bash
   cd C:\proyectos-portafolio\portafolio\backend; npm install
   ```
   ```bash
   cd C:\proyectos-portafolio\portafolio\frontend; npm install
   ```
2. **Usuario y bases de datos.** Desde `C:\proyectos-portafolio\portafolio`. Pide la contraseña
   del superusuario `postgres` y crea el usuario de la app con la contraseña guardada en
   `database\local\credentials.local.env`:
   ```bash
   powershell -ExecutionPolicy Bypass -File .\database\scripts\setup-local-db.ps1
   ```
3. **Variables de entorno:** copia `backend\.env.example` como `backend\.env` y completa
   `DATABASE_URL`, `TEST_DATABASE_URL` (están en `database\local\credentials.local.env`) y
   `JWT_SECRET`. Para generar `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
4. **Tablas y datos iniciales** (en `backend`):
   ```bash
   npm run db:deploy
   ```
   ```bash
   npm run db:seed
   ```
5. **Cuenta de administrador** (en `backend`). Pide nombre, correo y contraseña; la contraseña no
   se muestra al escribirla:
   ```bash
   npm run admin:create
   ```

---

## 4. Usar el sitio público

- **Inicio:** nombre, cargo, resumen para reclutadores (puesto actual, experiencia, ubicación,
  contacto y stack principal), botones a Proyectos, Experiencia y Hoja de vida.
- **Menú:** lleva a cada sección y marca la sección visible. En el teléfono se abre con el botón ☰.
- **Tema:** el botón de sol o luna cambia entre oscuro y claro, y recuerda tu elección.
- **Proyectos:** filtra por tecnología o categoría. La dirección cambia (por ejemplo
  `?tipo=PROFESSIONAL&tecnologia=nestjs`), así que puedes compartir el enlace ya filtrado.
  Los casos profesionales muestran una nota de confidencialidad.
- **Capacidades:** el flujo "Del desarrollo al despliegue" y las capacidades por área salen del
  panel (destacados de tipo *Etapa del ciclo de entrega* y categorías de habilidades).
- **Hoja de vida (`/cv`):** "Imprimir / Guardar PDF" abre el diálogo del navegador. Elige
  "Guardar como PDF" para obtener una versión pública. El PDF original con tus datos privados
  nunca se publica.
- **Contacto:** los mensajes se guardan en tu base de datos local y los lees en el panel. En esta
  fase no se envían correos.

---

## 5. Usar el panel de administración

Entra a **http://localhost:4200/admin** con el correo y la contraseña de `CREDENCIALES.local.md`.
El panel no aparece enlazado en el sitio público: se accede escribiendo la dirección.

| Sección | Para qué sirve |
|---|---|
| **Panel** | Totales, borradores ocultos y mensajes nuevos. |
| **Mensajes** | Leer (se marca como leído al abrirlo), responder por correo, archivar o eliminar. |
| **Perfil profesional** | Nombre, cargo, propuesta y texto complementario del inicio, presentación, ubicación, correo y teléfono públicos, foto y CV público en PDF. |
| **Perfil: destacados y flujo** | Forma de trabajo, aporte, intereses y las etapas de "Del desarrollo al despliegue". |
| **Enlaces sociales** | GitHub, LinkedIn, etc. |
| **Configuración del sitio** | Título y descripción para buscadores y redes, tema por defecto, activar o desactivar el formulario. |
| **Experiencia / Educación / Certificaciones** | Trayectoria. Las responsabilidades y los logros se agregan línea por línea. |
| **Categorías / Habilidades / Tecnologías** | Habilidades del CV (sin porcentajes) y etiquetas para los proyectos. |
| **Proyectos** | Casos con tipo (profesional, personal, académico, demostración), contexto, problema, solución, arquitectura, retos, resultado, rol, tecnologías, enlaces, portada y capturas, con vista previa de la tarjeta. |

Acciones comunes en los listados:

- **Nuevo:** botón arriba a la derecha.
- **Publicado / Oculto:** muestra u oculta el registro en el sitio público sin borrarlo.
- **↑ ↓:** cambian el orden en el sitio. Disponible sin búsqueda ni filtros activos.
- **✎** edita y **🗑** elimina. Siempre pide confirmación; eliminar no se puede deshacer.
- **Buscar** y filtrar por publicados u ocultos.

Al editar:

- Los campos con `*` son obligatorios y los errores aparecen junto a cada campo.
- Si sales con cambios sin guardar, el panel te avisa.
- **Subir** acepta PNG, JPEG o WebP de hasta 2 MB, y PDF de hasta 5 MB para el CV. Cada imagen
  necesita un texto alternativo.
- Una tecnología o categoría en uso no se puede borrar: primero quítala de donde se usa.

**Cuenta** (tu nombre, arriba a la derecha): cambia la contraseña. Al hacerlo se cierran todas las
sesiones. **Cerrar sesión** invalida la sesión en el servidor.

### Pendientes recomendados (contenido sin confirmar)

1. **Experiencia → Canella:** modalidad, ubicación y logros verificables (las responsabilidades ya están cargadas).
2. **Habilidades → Inglés:** escribe un nivel cualitativo y publícalo.
3. **Proyectos → Control de Gastos:** revisa el texto y publícalo si quieres mostrarlo.
4. **Enlaces sociales → GitHub:** confirma la URL y publícalo; agrega LinkedIn.
5. **Perfil:** foto, disponibilidad y, si lo deseas, un CV público en PDF.
6. **Educación → UMG:** semestre actual o año de inicio.

---

## 6. Pruebas

Ejecútalas en una terminal aparte. Las pruebas de integración y las E2E usan la base
`portafolio_ayllescas_test`, que **borran y recrean**; nunca tocan la base de desarrollo.

| Qué | Dónde | Comando |
|---|---|---|
| Unitarias de la API | `backend` | `npm test` |
| Integración de la API (PostgreSQL real) | `backend` | `npm run test:integration` |
| Unitarias del sitio | `frontend` | `npm test -- --watch=false` |
| End-to-end (Chrome) | `frontend` | `npx playwright test` |
| Reporte E2E | `frontend` | `npx playwright show-report` |
| Linter | `backend` y `frontend` | `npm run lint` |
| Compilación de producción | `backend` / `frontend` | `npm run build` |

Las E2E levantan solas una API en el puerto **3100** y un sitio en el **4300**, con un
administrador de prueba de contraseña aleatoria. No hace falta detener los servidores de desarrollo.

---

## 7. Comandos útiles (en `backend`)

| Comando | Efecto |
|---|---|
| `npm run db:seed` | Vuelve a cargar los datos iniciales sin duplicar nada (idempotente). |
| `npm run admin:create` | Crea otra cuenta o restablece la contraseña de una existente. |
| `npx prisma studio` | Abre un explorador visual de la base de datos en el navegador. |
| `npm run db:reset` | ⚠️ **Borra la base de desarrollo** y la recrea con el seed. Pierdes lo editado en el panel. |

---

## 8. Solución de problemas

| Síntoma | Causa probable / solución |
|---|---|
| El sitio dice "No hay conexión con el servidor" | La API no está corriendo: levántala (sección 2b). |
| La API no inicia: "Configuración de entorno inválida" | Falta o está mal una variable en `backend\.env` (el mensaje indica cuál). |
| La API no inicia: "Can't reach database server" | PostgreSQL detenido: `Start-Service postgresql-x64-18`. |
| `password authentication failed for user "portafolioayllescas"` | La contraseña de `DATABASE_URL` no coincide. Vuelve a ejecutar `setup-local-db.ps1`, que la restablece. |
| Puerto 3000 o 4200 ocupado | Cierra la otra terminal que lo usa, o reinicia la computadora. |
| "Demasiadas solicitudes" al iniciar sesión | Límite de 5 intentos por minuto. Espera un minuto. |
| Olvidé la contraseña del panel | En `backend`: `npm run admin:create` con el mismo correo. La restablece. |
| No se ve la animación 3D | Tu sistema tiene activado "reducir movimiento" o no hay WebGL. Se muestra una versión estática, a propósito. |
