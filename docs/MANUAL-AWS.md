# Manual de AWS

Guía para ver y operar el portafolio desde la consola de AWS, sin escribir código salvo donde se
indica. Los identificadores reales están en `CREDENCIALES.local.md`, que no se sube a ningún
repositorio.

> **Antes de empezar:** entra a https://console.aws.amazon.com y revisa que arriba a la derecha diga
> **Estados Unidos (Ohio)** / `us-east-2`. Si ves otra región, parecerá que no hay nada creado.
> CloudFront, S3 y Billing son globales: muestran lo mismo en cualquier región.

## 1. Qué hay y dónde verlo

| Quieres ver | Abre | Lo que encuentras |
|---|---|---|
| Todo lo creado, en una lista | **CloudFormation** → Pilas → `portafolio` | Recursos, identificadores y direcciones |
| La dirección pública y su tráfico | **CloudFront** → Distribuciones | Solicitudes, errores y caché |
| Si el servidor está encendido | **EC2** → Instancias | Estado y uso de CPU |
| Comandos dentro del servidor | **Systems Manager** → Session Manager | Terminal en el navegador |
| El sitio publicado | **S3** → bucket `portafolio-sitebucket-...` | Archivos del sitio |
| Las copias de seguridad | **S3** → bucket `portafolio-backupbucket-...` | Base (`db/`) y archivos (`uploads/`) |
| Créditos y gastos | **Billing and Cost Management** | Saldo, costo y fecha límite |

Usa el buscador de arriba de la consola para llegar rápido a cualquiera de estos servicios.

## 2. Empieza siempre por CloudFormation

1. Abre **CloudFormation → Pilas** y entra a `portafolio`.
2. **Salidas** muestra la dirección del sitio y los identificadores principales.
3. **Recursos** lista todo lo creado, con enlace a cada uno.
4. **Eventos** muestra qué cambió y cuándo.

El estado correcto es `CREATE_COMPLETE` o `UPDATE_COMPLETE`.

## 3. Ver el servidor

En **EC2 → Instancias** abre la instancia `portafolio`.

- **Estado de la instancia:** debe decir *En ejecución*.
- **Comprobaciones de estado:** deben aparecer aprobadas.
- **Supervisión:** muestra CPU, red y disco. El panel de **saldo de créditos de CPU** indica si el
  servidor se está quedando sin capacidad: si llega a cero, se vuelve lento, pero no genera cobros
  adicionales.

## 4. Entrar al servidor

No hay SSH ni contraseña de servidor.

1. En **EC2 → Instancias**, selecciona `portafolio` y pulsa **Conectar**.
2. Elige la pestaña **Session Manager** y pulsa **Conectar**.
3. Se abre una terminal en el navegador.

| Para ver | Comando |
|---|---|
| Si todo está activo | `systemctl is-active portafolio-api nginx postgresql` |
| Últimos registros de la API | `sudo journalctl -u portafolio-api -n 50 --no-pager` |
| Memoria | `free -h` |
| Disco | `df -h /` |
| Cuándo será la próxima copia | `systemctl list-timers portafolio-backup.timer` |
| Reiniciar la API | `sudo systemctl restart portafolio-api` |

> Nunca abras ni copies el contenido de `/etc/portafolio/api.env`: ahí están los secretos.

## 5. Ver el tráfico

En **CloudFront → Distribuciones** abre la tuya y entra a **Supervisión** para ver solicitudes, datos
transferidos y porcentaje de errores. Un aumento de errores `5xx` significa que la API no está
respondiendo.

## 6. Copias de seguridad

Se crean solas todos los días a las 09:30 UTC (3:30 a.m. en Guatemala) y se borran a los 30 días.

**Para descargar una:** entra a **S3**, abre el bucket `portafolio-backupbucket-...`, entra a `db/`,
marca la copia más reciente y pulsa **Descargar**.

Conviene guardar una copia en tu computadora de vez en cuando, y siempre antes de la fecha límite
del plan.

Para restaurar una copia, sigue [despliegue.md](despliegue.md#restaurar-una-copia).

## 7. Ver costos y créditos

| Dato | Dónde |
|---|---|
| Plan, saldo y fecha de vencimiento | **Billing and Cost Management** → página de inicio |
| Detalle de créditos | **Billing and Cost Management** → Créditos |
| Gasto por servicio | **Billing and Cost Management** → Cost Explorer |
| Uso de la capa gratuita | **Billing and Cost Management** → Capa gratuita |

El gasto tarda hasta un día en aparecer.

Desde una terminal puedes consultar el saldo con:

```bash
aws freetier get-account-plan-state
```

Si la sesión expiró, ejecuta primero `aws login`.

### Fecha límite

La cuenta **se cierra el 17 de abril de 2027**, o antes si se acaban los créditos. Para mantener el
sitio en línea:

1. Crea un presupuesto en **Billing and Cost Management → Presupuestos**, con la plantilla de costo
   mensual.
2. Antes de esa fecha, entra a **Billing and Cost Management** y elige **Actualizar plan**.

Desde ese momento AWS cobra a tu tarjeta lo que supere el saldo de créditos.

## 8. Publicar cambios

Los cambios se hacen en una rama y entran por pull request. Después:

**Sitio**, desde la carpeta `frontend` de tu computadora, con los valores de tu archivo de
credenciales:

```bash
SITE_BUCKET=<bucket> DISTRIBUTION_ID=<id> bash deploy/publish.sh
```

**API**, en la terminal de Session Manager:

```bash
sudo bash /opt/portafolio/api/deploy/update.sh
```

El contenido no se publica así: se edita desde el panel y se ve al instante.

## 9. Si algo falla

| Síntoma | Qué revisar |
|---|---|
| El sitio abre, pero sin contenido | Sección 3 y luego `systemctl is-active portafolio-api` |
| Error `502` o `504` | La API está caída: revisa sus registros y reiníciala |
| No encuentras tus recursos | La región: debe ser Ohio |
| `aws` dice que la sesión expiró | Ejecuta `aws login` |
| Olvidaste la contraseña del panel | En Session Manager, entra a la API y ejecuta `admin:create` con tu correo |
| Muy lento durante un rato | Saldo de créditos de CPU en la sección 3 |

## 10. Qué no tocar

- **Grupo de seguridad:** no abras puertos ni agregues `0.0.0.0/0`.
- **Buckets:** no desactives *Bloquear todo el acceso público*.
- **Elastic IP:** no la liberes; CloudFront la usa para llegar al servidor.
- **`db:seed` en producción:** reemplaza lo que editaste en el panel.
- **Eliminar la pila `portafolio`:** borra el servidor y su base. Los buckets se conservan, pero el
  sitio deja de funcionar.

## 11. Detener o eliminar

- **Detener la instancia** apaga la API. El disco y la IP siguen generando costo.
- **Eliminar todo:** descarga primero una copia, elimina la pila desde CloudFormation y vacía y borra
  los dos buckets desde S3.
