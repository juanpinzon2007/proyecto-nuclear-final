# Simulador Interactivo Gamificado de Psicologia Social

Proyecto Django para la Universidad Alexander von Humboldt Armenia. Incluye:

- Panel superadmin y docente en `/admin/`.
- Panel estudiante en `/estudiante/`.
- API REST documentada en `/api/docs/`.
- PostgreSQL con Docker.
- Datos semilla para probar todo el flujo.

## Opcion recomendada: Docker

Requisitos:

- Docker Desktop instalado y corriendo.
- Git.

Pasos:

```bash
git clone <URL_DEL_REPOSITORIO>
cd psicologia
docker compose up --build
```

Cuando termine, abre:

```text
Admin / Docente:
http://127.0.0.1:8001/admin/

Panel estudiante:
http://127.0.0.1:8001/estudiante/login/

API Swagger:
http://127.0.0.1:8001/api/docs/
```

Docker levanta:

- PostgreSQL en `localhost:5433`.
- Django en `localhost:8001`.
- Frontend Angular del estudiante en `localhost:4200`.
- Migraciones automaticas.
- Usuario superadmin.
- Datos demo completos.

Frontend visual estudiante:

```text
http://localhost:4200/login
```

El frontend usa Nginx y proxy interno `/api/` hacia el servicio Django, por lo que login, casos, intentos, decisiones, herramientas, bitacoras y retroalimentacion se conectan al backend existente.

## Despliegue en Google Cloud Run desde GitHub

La aplicacion esta preparada para desplegarse como dos servicios de Cloud Run conectados al mismo repositorio:

- Backend Django: ruta de origen `backend`, Dockerfile `backend/Dockerfile`, puerto `8080`.
- Frontend Angular: ruta de origen `frontend-estudiante-angular/app`, Dockerfile `frontend-estudiante-angular/app/Dockerfile`, puerto `8080`.

### 1. Backend

Al crear el servicio de Cloud Run desde el repositorio de GitHub, selecciona el Dockerfile del backend y configura estas variables:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<secreto-largo>
DJANGO_ALLOWED_HOSTS=.run.app
CSRF_TRUSTED_ORIGINS=https://*.run.app
CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.run\.app$
DB_ENGINE=postgres
POSTGRES_DB=<base>
POSTGRES_USER=<usuario>
POSTGRES_PASSWORD=<clave>
POSTGRES_HOST=<host-postgres-o-cloud-sql>
POSTGRES_PORT=5432
ADMIN_EMAIL=ficho@cue.edu.co
ADMIN_PASSWORD=<clave-admin-inicial>
OPENAI_API_KEY=<llave-openai-desde-secret-manager>
OPENAI_MODEL=gpt-5.2
OPENAI_TIMEOUT_SECONDS=45
```

Para produccion, guarda `DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD` y `OPENAI_API_KEY` en Secret Manager, no como texto plano. Pingüino IA requiere `OPENAI_API_KEY`; si no está configurada, el sistema solo mostrará el modo local de análisis y bloqueará ejecuciones reales.

Si prefieres montar el secreto como archivo en Cloud Run, usa:

```env
OPENAI_API_KEY_FILE=/secrets/openai-api-key
OPENAI_MODEL=gpt-5.2
```

### 2. Frontend

Despues de desplegar el backend, copia la URL publica del servicio Django y crea el servicio frontend con estas variables:

```env
PORT=8080
API_UPSTREAM=https://URL-DEL-BACKEND.run.app
```

`API_UPSTREAM` no debe terminar en `/`. El frontend llama a `/api/...`; Nginx reenvia esas peticiones al backend. Asi el login, los casos, el simulador, los intentos, las decisiones, las herramientas y la retroalimentacion quedan conectados en Cloud Run.

### 3. Base de datos

Cloud Run no incluye PostgreSQL persistente. Usa Cloud SQL para PostgreSQL o una base PostgreSQL externa. Si usas Cloud SQL, configura el conector/instancia en el servicio backend y deja `POSTGRES_HOST` con el valor que corresponda a tu conexion.

### 4. Verificacion rapida

Backend:

```text
https://URL-DEL-BACKEND.run.app/health/
https://URL-DEL-BACKEND.run.app/api/docs/
```

Frontend:

```text
https://URL-DEL-FRONTEND.run.app/login
```

Prueba con el usuario estudiante demo despues de que el backend ejecute migraciones y datos semilla.

## Despliegue en Railway desde GitHub

Railway debe desplegar este repositorio como monorepo con tres servicios:

- `Postgres`: base de datos PostgreSQL creada desde Railway.
- `backend`: root directory `/backend`, config file `/backend/railway.json`.
- `frontend`: root directory `/frontend-estudiante-angular/app`, config file `/frontend-estudiante-angular/app/railway.json`.

Railway permite definir un root directory por servicio en monorepos y usar config-as-code con `railway.json`; si configuras una ruta custom, debe ser absoluta dentro del repo, por ejemplo `/backend/railway.json`.

### 1. Backend en Railway

Variables del servicio `backend`:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<secreto-largo>
DJANGO_ALLOWED_HOSTS=.up.railway.app,.railway.app,healthcheck.railway.app
CSRF_TRUSTED_ORIGINS=https://*.up.railway.app
CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.up\.railway\.app$
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_EMAIL=ficho@cue.edu.co
ADMIN_PASSWORD=<clave-admin-inicial>
OPENAI_API_KEY=<llave-openai>
OPENAI_MODEL=gpt-5.2
OPENAI_TIMEOUT_SECONDS=45
FRONTEND_STUDENT_LOGIN_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}/login
```

El backend ya acepta `DATABASE_URL` de Railway. Tambien puede usar `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` y `PGDATABASE` si prefieres configurar variables individuales.

### 2. Frontend en Railway

Variables del servicio `frontend`:

```env
PORT=8080
API_UPSTREAM=http://backend.railway.internal:8080
```

`API_UPSTREAM` no debe terminar en `/`. En Railway debe apuntar al dominio privado del servicio backend para evitar ciclos 508: si el servicio se llama `backend`, usa `http://backend.railway.internal:8080`. Si le pusiste otro nombre al servicio, cambia `backend` por el nombre real del servicio.

Nginx recibe `/api/...` desde Angular y lo reenvia al backend por la red privada de Railway. Esto mantiene conectados login, casos, intentos, decisiones, herramientas, bitacoras, retroalimentacion y Pingüino IA.

No uses el dominio del frontend en `API_UPSTREAM`; eso hace que `/api/auth/login/` vuelva al mismo frontend y Railway responda `508`.

### 3. Verificacion en Railway

Backend:

```text
https://BACKEND.up.railway.app/health/
https://BACKEND.up.railway.app/api/docs/
```

Frontend:

```text
https://FRONTEND.up.railway.app/login
```

Si Pingüino muestra "Falta llave OpenAI", falta configurar `OPENAI_API_KEY` en el servicio `backend` o redeployar ese servicio despues de agregar la variable.

## Claves de prueba

```text
Superadmin:
correo: ficho@cue.edu.co
clave: admin123

Docente:
correo: docente.psicosocial@cue.edu.co
clave: docente123

Estudiante:
correo: estudiante.demo@cue.edu.co
clave: estudiante123
```

## Comandos utiles Docker

Apagar sin borrar datos:

```bash
docker compose down
```

Borrar contenedores y base de datos:

```bash
docker compose down -v
```

Volver a crear datos semilla:

```bash
docker compose exec api python manage.py seed_admin
docker compose exec api python manage.py seed_demo
```

Ver logs:

```bash
docker compose logs -f api
```

## Opcion local sin Docker

Requisitos:

- Python 3.13+

Pasos:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo "DB_ENGINE=sqlite" >> .env
python manage.py migrate
python manage.py seed_admin
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8002
```

URLs locales:

```text
Admin / Docente:
http://127.0.0.1:8002/admin/

Panel estudiante:
http://127.0.0.1:8002/estudiante/login/

API Swagger:
http://127.0.0.1:8002/api/docs/
```

## Como compartir el proyecto

Recomendado:

1. Subir el proyecto a GitHub/GitLab.
2. Compartir la URL del repositorio.
3. La otra persona ejecuta `docker compose up --build`.

Si lo compartes como ZIP, no incluyas:

- `backend/.venv/`
- `backend/db.sqlite3`
- `backend/.env`
- `__pycache__/`
- `.idea/`

Estos archivos ya quedan ignorados por `.gitignore`.
## Pingüino IA con OpenAI

Pingüino está disponible para docentes y administradores desde el frontend Angular en:

```text
http://localhost:4200/admin/ia
```

El frontend se conecta al backend por `/api/administrativo/gregory/`. Para habilitar ejecución real con OpenAI:

1. Copia `.env.example` como `.env` en la raíz del proyecto.
2. Agrega tu llave en `OPENAI_API_KEY`.
3. Reinicia los servicios con `docker compose up -d --build api frontend-estudiante`.

Configuración:

```env
OPENAI_API_KEY=<tu_clave_nueva>
OPENAI_MODEL=gpt-5.2
OPENAI_TIMEOUT_SECONDS=45
```

Sin `OPENAI_API_KEY`, Pingüino solo permite analizar instrucciones; no ejecuta cambios. No subas `.env` al repositorio. Si una clave fue compartida en un chat, rótala desde el panel de OpenAI antes de usarla en producción.
