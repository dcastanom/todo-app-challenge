# Despliegue en AWS — paso a paso

Guía completa para llevar esta app a una instancia **EC2** real, usando las imágenes que
CI ya publica en GHCR (`docker-compose.aws.yml`, en la raíz del repo). Es el mismo
`docker-compose.prod.yml` que corrés en local — acá solo cambia *dónde* corre.

> Ejecutá estos comandos desde **Git Bash, WSL o AWS CloudShell** (no PowerShell — la
> sintaxis de `export`/`$()` es de bash). En la instancia EC2 (Ubuntu) todo es bash normal.

**Qué vamos a crear:** 1 instancia EC2 (`t3.small`), 1 Elastic IP, 1 Security Group.
**Costo aproximado:** ~US$17-20/mes corriendo 24/7 — ver [§11](#11-costo-aproximado) para
cómo pausarlo entre demos y pagar solo el storage (~US$1.6/mes).

---

## 0. Prerrequisitos

- Cuenta de AWS con una tarjeta válida (o créditos de estudiante/free tier).
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) instalado y configurado:
  ```bash
  aws configure   # Access Key, Secret Key, región (ej. us-east-1), output json
  ```
- Un usuario/rol de IAM con permisos de EC2 (`AmazonEC2FullAccess` alcanza para esta guía).
- Las imágenes ya publicadas en GHCR — las publica CI en cada push a `main`
  (`.github/workflows/ci.yml`, job `docker`). Verificá que existan:
  **https://github.com/dcastanom/todo-app-challenge/pkgs/container/todo-app-challenge-backend**

### Variables que vas a reusar en toda la guía

```bash
export AWS_REGION=us-east-1
export KEY_NAME=todo-app-key
export SG_NAME=todo-app-sg
export INSTANCE_NAME=todo-app-ec2
```

---

## 1. Par de llaves SSH

```bash
mkdir -p ~/.ssh
aws ec2 create-key-pair --region $AWS_REGION --key-name $KEY_NAME \
  --query 'KeyMaterial' --output text > ~/.ssh/$KEY_NAME.pem
chmod 400 ~/.ssh/$KEY_NAME.pem
```

## 2. Security Group

Reglas: SSH (22) solo desde tu IP, HTTP/HTTPS (80/443) abiertos al mundo.
El backend (4000), Postgres, Redis y el stack de observabilidad **no** se abren acá —
solo son alcanzables desde dentro de la instancia (o por túnel SSH, ver [§10](#10-opcional-observabilidad-prometheus-grafana-jaeger-loki)).

```bash
VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION \
  --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)

SG_ID=$(aws ec2 create-security-group --region $AWS_REGION \
  --group-name $SG_NAME --description "todo-app: SSH + HTTP/HTTPS" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

MY_IP="$(curl -s https://checkip.amazonaws.com)/32"

aws ec2 authorize-security-group-ingress --region $AWS_REGION --group-id $SG_ID \
  --protocol tcp --port 22 --cidr "$MY_IP"
aws ec2 authorize-security-group-ingress --region $AWS_REGION --group-id $SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --region $AWS_REGION --group-id $SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

## 3. Lanzar la instancia EC2

Ubuntu 24.04 LTS, resuelto vía el parámetro público de SSM (siempre la AMI vigente para tu
región, sin hardcodear un ID que cambia y se vuelve viejo):

```bash
AMI_ID=$(aws ssm get-parameters --region $AWS_REGION \
  --names /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
  --query 'Parameters[0].Value' --output text)

INSTANCE_ID=$(aws ec2 run-instances --region $AWS_REGION \
  --image-id "$AMI_ID" --instance-type t3.small \
  --key-name $KEY_NAME --security-group-ids $SG_ID \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3,Encrypted=true}' \
  --metadata-options 'HttpTokens=required' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
  --query 'Instances[0].InstanceId' --output text)

aws ec2 wait instance-running --region $AWS_REGION --instance-ids $INSTANCE_ID
echo "Instancia: $INSTANCE_ID"
```

`HttpTokens=required` fuerza IMDSv2 (evita el vector de robo de credenciales de IMDSv1);
`Encrypted=true` cifra el volumen EBS en reposo — ambos son gratis, sin motivo para no usarlos.

## 4. Elastic IP

```bash
ALLOC_ID=$(aws ec2 allocate-address --region $AWS_REGION --domain vpc \
  --query 'AllocationId' --output text)
aws ec2 associate-address --region $AWS_REGION \
  --instance-id $INSTANCE_ID --allocation-id $ALLOC_ID

PUBLIC_IP=$(aws ec2 describe-addresses --region $AWS_REGION \
  --allocation-ids $ALLOC_ID --query 'Addresses[0].PublicIp' --output text)
echo "IP pública: $PUBLIC_IP"
```

Una Elastic IP asociada a una instancia **corriendo** no cobra extra; si la instancia
está detenida, sí — tenelo en cuenta en [§11](#11-costo-aproximado).

## 5. Conectarse e instalar Docker

```bash
ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$PUBLIC_IP
```

Ya adentro de la instancia:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker            # aplica el grupo sin tener que reloguear
docker --version && docker compose version
```

## 6. Traer el proyecto

```bash
git clone --depth 1 https://github.com/dcastanom/todo-app-challenge.git ~/todo-app
cd ~/todo-app
```

(`--depth 1` porque en la instancia solo necesitás los archivos de compose y de
`observability/` — no el historial completo.)

## 7. Configurar `.env` de producción

```bash
cp .env.example .env
```

Editalo (`nano .env` o `vim .env`) y ajustá **como mínimo**:

| Variable | Valor |
|---|---|
| `POSTGRES_PASSWORD` | contraseña fuerte — no la del `.env.example` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` (otro valor distinto) |
| `CORS_ORIGIN` | `http://<PUBLIC_IP>` por ahora (a `https://tu-dominio.com` en [§9](#9-opcional-dominio--tls)) |
| `FRONTEND_PORT` | `80` (por defecto es 8080 — acá queremos el puerto HTTP estándar) |

```bash
sed -i "s#POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=$(openssl rand -hex 16)#" .env
sed -i "s#JWT_SECRET=.*#JWT_SECRET=$(openssl rand -hex 32)#" .env
sed -i "s#JWT_REFRESH_SECRET=.*#JWT_REFRESH_SECRET=$(openssl rand -hex 32)#" .env
sed -i "s#CORS_ORIGIN=.*#CORS_ORIGIN=http://$PUBLIC_IP#" .env
echo "FRONTEND_PORT=80" >> .env
echo "IMAGE_TAG=latest" >> .env
```

`IMAGE_TAG` es el tag que va a usar `docker-compose.aws.yml` — `latest` es lo último
publicado en `main`; para un deploy reproducible o un rollback, pineá un SHA corto
(ver [§13](#13-rollback)).

## 8. Traer y levantar el stack (sin buildear nada)

Las imágenes son públicas por defecto para un repo público (verificalo en el link de
[§0](#0-prerrequisitos) — si GitHub las marcó privadas, primero `docker login ghcr.io -u
<usuario> --password-stdin <<< <tu-PAT-con-scope-read:packages>`):

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml pull
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml up -d
```

Esto crea el proyecto de Compose `todo-prod` (fijado en `docker-compose.prod.yml`),
migra la base sola (el backend corre `migrate` antes de arrancar) y deja todo con
`restart: unless-stopped` — sobrevive un reboot de la instancia.

### Verificar

```bash
curl http://localhost/health              # liveness, vía nginx
curl http://localhost/api/v1/health       # ídem, por la ruta versionada
curl http://localhost/health/ready        # readiness: {"postgres":"up","redis":"up"}
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml ps
```

Desde tu máquina: `http://<PUBLIC_IP>` — pantalla de login. Cuenta demo: el seed **no**
corre en producción (a propósito, ver `docs/DEPLOYMENT.md`), así que registrate con una
cuenta real.

---

## 9. (Opcional) Dominio + TLS

Sin esto la app queda en `http://` — funcional, pero el browser la marca como no segura
y `localStorage` para los tokens JWT viaja en claro. Recomendado antes de compartir la URL.

**Route 53** (si tenés un dominio ahí): creá un registro `A` → `$PUBLIC_IP`.
Si no, cualquier proveedor de DNS sirve — apuntá un registro `A` a la Elastic IP.

**Certbot** — la app corre nginx *dentro* de un contenedor Docker en el puerto 80, así
que la forma más simple es un nginx del **host** (Ubuntu) por delante, terminando TLS y
reenviando al contenedor:

```bash
# liberar el 80/443 del host para el nginx del sistema:
sed -i "s#FRONTEND_PORT=80#FRONTEND_PORT=8080#" .env
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml up -d

sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/todo-app` (reenvía todo, incluido el WebSocket de Socket.IO):

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/todo-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d tu-dominio.com   # obtiene el cert, configura TLS y el redirect 80→443
```

Por último, actualizá `.env` y reiniciá el backend para que el CORS acepte el nuevo origen:

```bash
sed -i "s#CORS_ORIGIN=.*#CORS_ORIGIN=https://tu-dominio.com#" .env
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml up -d backend
```

---

## 10. (Opcional) Observabilidad: Prometheus, Grafana, Jaeger, Loki

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml \
  -f docker-compose.observability.yml up -d
```

Estos puertos (Grafana `:3001`, Prometheus `:9090`, Jaeger `:16686`) **no** están abiertos
en el Security Group a propósito — Grafana con `admin/admin` público es un problema de
seguridad real. Accedé por túnel SSH en vez de abrir el puerto:

```bash
# desde tu máquina, no desde la instancia:
ssh -i ~/.ssh/$KEY_NAME.pem -N \
  -L 3001:localhost:3001 -L 9090:localhost:9090 -L 16686:localhost:16686 \
  ubuntu@$PUBLIC_IP
# dejalo corriendo, y abrí http://localhost:3001 en tu browser
```

Si necesitás mostrarlo en vivo sin túnel (ej. durante la sustentación), abrí el puerto
**solo para tu IP**, nunca `0.0.0.0/0`:

```bash
aws ec2 authorize-security-group-ingress --region $AWS_REGION --group-id $SG_ID \
  --protocol tcp --port 3001 --cidr "$MY_IP"
```

---

## 11. Costo aproximado

| Recurso | Corriendo 24/7 | Detenido (instancia parada) |
|---|---|---|
| EC2 `t3.small` | ~US$15/mes | US$0 (solo compute) |
| EBS 20GB gp3 | ~US$1.6/mes | ~US$1.6/mes (persiste) |
| Elastic IP | gratis (asociada a instancia corriendo) | ~US$3.6/mes (si queda reservada sin instancia corriendo) |

Para pausar sin perder nada entre sesiones de prueba/demo:

```bash
aws ec2 stop-instances --region $AWS_REGION --instance-ids $INSTANCE_ID
# ...y para retomar:
aws ec2 start-instances --region $AWS_REGION --instance-ids $INSTANCE_ID
```

(La IP pública cambia al reiniciar salvo que uses la Elastic IP ya asociada — con
Elastic IP asociada, el `stop`/`start` la conserva.)

---

## 12. Actualizar a una versión nueva

```bash
cd ~/todo-app && git pull
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml pull
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml up -d
```

Como el backend migra solo al arrancar, un `up -d` alcanza — no hace falta un paso de
migración aparte (ver la advertencia sobre carreras entre réplicas si algún día esto pasa
a correr más de una instancia, en `infraestructura.md`/§5.2 nivel ECS).

## 13. Rollback

CI etiqueta cada imagen con el SHA corto del commit (además de `latest`). Para volver a
una versión anterior, pineá `IMAGE_TAG` a ese SHA:

```bash
# encontrar el SHA de un commit ya buildeado y publicado:
git log --oneline -10

sed -i "s#IMAGE_TAG=.*#IMAGE_TAG=<sha-corto>#" .env
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml pull
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml up -d
```

Las migraciones son aditivas (índices/columnas nuevas, nunca se borra nada), así que
retroceder una versión de imagen es seguro sin tocar el schema de la base.

## 14. Automatizarlo desde CI

El job `deploy` en `.github/workflows/ci.yml` hoy es un *stub* (solo hace `echo`). Para que
despliegue solo tras cada push a `main`, reemplazalo por algo como:

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [integration, e2e, docker]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  environment: staging
  steps:
    - uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.AWS_EC2_HOST }}       # la Elastic IP
        username: ubuntu
        key: ${{ secrets.AWS_EC2_SSH_KEY }}     # contenido del .pem
        script: |
          cd ~/todo-app
          git pull
          docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml pull
          docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml up -d
```

`AWS_EC2_HOST` y `AWS_EC2_SSH_KEY` van como GitHub Secrets del repo (nunca commiteados) —
`Settings → Secrets and variables → Actions`.

## 15. Apagar todo (cleanup completo)

```bash
# en la instancia, o por SSH:
docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml down -v

# desde tu máquina:
aws ec2 terminate-instances --region $AWS_REGION --instance-ids $INSTANCE_ID
aws ec2 wait instance-terminated --region $AWS_REGION --instance-ids $INSTANCE_ID
aws ec2 release-address --region $AWS_REGION --allocation-id $ALLOC_ID
aws ec2 delete-security-group --region $AWS_REGION --group-id $SG_ID
aws ec2 delete-key-pair --region $AWS_REGION --key-name $KEY_NAME
rm ~/.ssh/$KEY_NAME.pem
```

---

## 16. Checklist de seguridad antes de un uso real (no solo demo)

- [ ] `JWT_SECRET`/`JWT_REFRESH_SECRET`/`POSTGRES_PASSWORD` generados acá, no los de `.env.example`.
- [ ] TLS activo (§9) — sin esto los JWT viajan en claro.
- [ ] SSH restringido a tu IP (§2) — revisalo si tu IP cambió (`$MY_IP` quedó vieja).
- [ ] Grafana no expuesto públicamente sin cambiar `admin/admin` (§10).
- [ ] Secrets rotados fuera de este `.env` si el repo pasa a tener más de un colaborador con acceso a la instancia.
- [ ] Resto de la auditoría OWASP ya cubierta por el código en sí: [`docs/SECURITY.md`](SECURITY.md).

## 17. Siguiente nivel: escalar más allá de una sola instancia

Esta guía cubre **una** instancia — alcanza y sobra para una demo, un proyecto personal o
tráfico bajo. Si hiciera falta escalar (más de una réplica del backend, alta disponibilidad
de la base), el camino recomendado es:

- **RDS PostgreSQL** + **ElastiCache Redis** en vez de los contenedores `postgres`/`redis`
  de este compose (cambia solo `DATABASE_URL`/`REDIS_URL`, cero cambios de código).
- **ECS Fargate** en vez de una instancia EC2 fija — mismas imágenes de GHCR (o migradas a ECR),
  con un Application Load Balancer delante (TLS vía ACM, sticky sessions habilitadas —
  necesarias para que Socket.IO vuelva siempre a la misma task).
- El job `deploy` de CI pasa de SSH a `aws ecs update-service --force-new-deployment`.

Fuera del alcance de esta guía paso a paso — ver la comparación de arquitecturas en el
material de sustentación (`infraestructura.md`, no versionado en el repo).
