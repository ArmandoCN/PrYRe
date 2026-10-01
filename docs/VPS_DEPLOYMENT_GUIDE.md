# Guía de Despliegue en VPS (Virtual Private Server)

Esta guía te guiará paso a paso para desplegar la plataforma Registros en un servidor VPS virgen (basado en Linux, preferentemente Ubuntu 22.04 o Debian 12).

## Paso 1: Preparación del Servidor e Instalación de Docker

Conéctate a tu servidor mediante SSH:
```bash
ssh root@IP_DE_TU_SERVIDOR
```

Actualiza el sistema e instala Docker y Git:
```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar utilidades básicas y Git
apt install -y git curl ufw

# Instalar Docker usando el script oficial automatizado
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Habilitar Docker para que inicie automáticamente con el servidor
systemctl enable --now docker
```

## Paso 2: Clonar el Proyecto

Clona tu repositorio desde GitHub y entra a la carpeta:
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git /opt/registros
cd /opt/registros
```
*(Recuerda sustituir la URL por la tuya)*.

## Paso 3: Configurar Variables de Entorno

El archivo `.env` no se sube a GitHub por seguridad, así que debes crearlo en el servidor:
```bash
nano backend/.env
```

Pega el siguiente contenido (cambia las contraseñas por unas más seguras):
```env
# Conexión a la base de datos dentro de la red de Docker
DATABASE_URL="postgresql://postgres:TU_CLAVE_SUPER_SECRETA@db:5432/registros?schema=public"

# Contraseña maestra de la base de datos
POSTGRES_PASSWORD="TU_CLAVE_SUPER_SECRETA"
POSTGRES_USER="postgres"
POSTGRES_DB="registros"

# Clave secreta para firmar los JWT (Cámbiala por una cadena larga y aleatoria)
JWT_SECRET="Cl4v3_S3cr3t4_P4r4_Pr0ducc1on_778899"

# Entorno
NODE_ENV="production"
PORT=80
```
Guarda y sal del editor (En Nano: `Ctrl+O`, `Enter`, `Ctrl+X`).

## Paso 4: Levantar los Contenedores

Ejecuta Docker Compose para construir y levantar la plataforma:
```bash
docker compose up -d --build
```

Este proceso tardará unos minutos la primera vez mientras compila el Frontend y el Backend.

## Paso 5: Siembra Inicial (Seed)

Dado que la base de datos es completamente nueva, debes ejecutar el script inicial para crear tu usuario administrador:
```bash
docker exec registros-app-1 node seed.js
```

## Paso 6: Configurar el Firewall (Opcional pero Recomendado)

Abre los puertos necesarios y activa el firewall:
```bash
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

¡Listo! Ya puedes abrir el navegador e ingresar la Dirección IP de tu servidor. La plataforma estará funcionando. 
**Nota:** Para ponerle un dominio (ej. `midominio.com`) y tener HTTPS (el candadito verde), se recomienda instalar un proxy reverso ligero como Caddy o Nginx proxy manager.
