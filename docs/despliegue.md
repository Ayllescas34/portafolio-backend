# Despliegue en AWS

El portafolio se publica en un solo servidor para mantener un costo bajo. La plantilla
[`deploy/infra.yml`](../deploy/infra.yml) define toda la infraestructura.

```
Visitante ── HTTPS ──> CloudFront ─┬─ sitio ─────────> S3 (privado)
                                   └─ /api, /uploads ─> EC2: nginx > NestJS > PostgreSQL
                                                         └─ copia diaria ─> S3 (privado)
```

| Pieza | Decisión |
|---|---|
| Servidor | EC2 `t4g.micro` con Ubuntu 24.04, 20 GB y CPU en modo `standard` para evitar cargos por uso sostenido |
| Base de datos | PostgreSQL 18 en el mismo servidor |
| Acceso | Systems Manager, sin SSH; el puerto 80 solo acepta tráfico de CloudFront |
| Secretos | Se generan en el servidor, en `/etc/portafolio`, y no salen de ahí |
| Copias | Base y archivos subidos a S3 cada día, con vencimiento a los 30 días |
| Seguridad del sitio | CSP sin scripts en línea, HSTS y buckets privados |

## Limitación conocida

Sin dominio propio, el tramo entre CloudFront y el servidor usa HTTP. Al agregar un dominio hay que
instalar un certificado en el servidor y cambiar el origen `api` a HTTPS.

## Crear la infraestructura

```bash
aws cloudformation deploy --stack-name portafolio --template-file deploy/infra.yml --capabilities CAPABILITY_IAM --parameter-overrides ImageId=<ami> VpcId=<vpc> SubnetId=<subnet> CloudFrontPrefixListId=<pl>
```

Los valores de salida se consultan con:

```bash
aws cloudformation describe-stacks --stack-name portafolio --query "Stacks[0].Outputs"
```

## Preparar el servidor

En una sesión de Systems Manager:

```bash
git clone https://github.com/Ayllescas34/portafolio-backend.git /tmp/portafolio-deploy
```

```bash
SITE_ORIGIN=https://xxxx.cloudfront.net BACKUP_BUCKET=<bucket> bash /tmp/portafolio-deploy/deploy/server-setup.sh
```

## Publicar cambios

- **API:** `sudo bash /opt/portafolio/api/deploy/update.sh`, en el servidor.
- **Sitio:** `SITE_BUCKET=<bucket> DISTRIBUTION_ID=<id> bash deploy/publish.sh`, en `portafolio-front`.

## Restaurar una copia

```bash
aws s3 cp s3://<bucket>/db/<fecha>.dump /tmp/portafolio.dump
```

```bash
sudo -u postgres pg_restore --clean --if-exists --no-owner --role=portafolio --dbname=portafolio /tmp/portafolio.dump
```

## Antes de que venza el plan gratuito

La cuenta se cierra el 17 de abril de 2027 o al agotar los créditos, lo que ocurra primero. Para
mantener el sitio hay que pasar al plan de pago antes de esa fecha. Si no se va a continuar, hay que
descargar una copia de la base y de los archivos.
