# Backend - Simulador Interactivo de Psicología Social

Backend Django para el simulador, basado en `base.sql` y los requisitos funcionales de `requisitos.xlsx`.

## Stack

- Python 3.13+
- Django 6.x
- Django REST Framework
- JWT con `djangorestframework-simplejwt`
- PostgreSQL con `psycopg`
- CORS, filtros, paginación y documentación OpenAPI con `drf-spectacular`

## Instalación

### Con Docker y PostgreSQL

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Esto levanta:

- PostgreSQL 18 en el puerto local `5433`.
- API Django en `http://127.0.0.1:8001`.
- Migraciones automáticas.
- Usuario administrador inicial.

Para ejecutar comandos dentro del contenedor:

```bash
docker compose exec api python manage.py seed_admin
docker compose exec api python manage.py seed_demo
docker compose exec api python manage.py createsuperuser
```

Para apagar:

```bash
docker compose down
```

Para borrar también los datos de PostgreSQL:

```bash
docker compose down -v
```

### Instalación local sin Docker

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py seed_admin
python manage.py seed_demo
python manage.py runserver
```

Usuario inicial del módulo administrativo:

```text
correo: ficho@cue.edu.co
clave: admin123
```

Usuarios demo adicionales:

```text
Docente:
correo: docente.psicosocial@cue.edu.co
clave: docente123

Estudiante:
correo: estudiante.demo@cue.edu.co
clave: estudiante123
```

Paneles:

```text
Admin/docente: /admin/
Estudiante: /estudiante/login/
Swagger: /api/docs/
```

## Documentacion interactiva

- Swagger: `GET /api/docs/`
- Redoc: `GET /api/redoc/`
- Schema OpenAPI: `GET /api/schema/`

## Autenticación

### `POST /api/auth/login/`

Inicia sesión y devuelve `access`, `refresh` y datos del usuario.

```json
{
  "correo": "ficho@cue.edu.co",
  "password": "admin123"
}
```

Usa el token en las demás peticiones:

```http
Authorization: Bearer <access>
```

### `POST /api/auth/refresh/`

Renueva el token de acceso.

```json
{
  "refresh": "<refresh>"
}
```

## Endpoints del módulo administrativo docente administrador

Todos cuelgan de `/api/administrativo/`.

| Endpoint | Metodos | Descripcion |
| --- | --- | --- |
| `/usuarios/` | GET, POST | Lista y crea usuarios. Soporta filtros por `rol`, `estado` y búsqueda por nombre, correo o documento. |
| `/usuarios/{id}/` | GET, PUT, PATCH, DELETE | Consulta o modifica un usuario. |
| `/usuarios/docentes/` | GET | Lista docentes. |
| `/usuarios/estudiantes/` | GET | Lista estudiantes. |
| `/usuarios/{id}/inactivar/` | POST | Inactiva usuario y bloquea nuevo acceso. |
| `/grupos-académicos/` | GET, POST | Gestiona grupos por docente y periodo académico. |
| `/estudiantes-grupos/` | GET, POST | Asigna estudiantes a grupos. |

## Endpoints del simulador

Todos cuelgan de `/api/simulador/`.

| Endpoint | Módulo funcional |
| --- | --- |
| `/competencias/` | Catálogo de competencias evaluables. |
| `/temáticas/` | Clasificación y filtrado de casos por temática. |
| `/etiquetas/` | Etiquetas de búsqueda y organización. |
| `/casos/` | Gestión de casos situacionales ramificados. |
| `/casos/{id}/estructura/` | Devuelve caso, actores y escenas para renderizar el flujo. |
| `/actores-caso/` | Actores involucrados en un caso. |
| `/escenas/` | Nodos del caso: introducción, desarrollo, decisión, herramienta, retroalimentación y final. |
| `/decisiones/` | Opciones ramificadas, consecuencias y puntajes. |
| `/asignaciones-casos/` | Asignación de casos a grupos o estudiantes. |
| `/herramientas-profesionales/` | Banco de herramientas profesionales. |
| `/herramientas-por-caso/` | Configuración de herramientas por caso o escena. |
| `/recursos/` | Recursos teoricos, guias, lecturas, videos e instrumentos. |
| `/recursos-casos/` | Asociacion de recursos a casos, escenas o competencias. |
| `/intentos/` | Intentos, reintentos, estado actual y puntaje. |
| `/intentos/analíticas/` | Resumen agregado por caso y estado. |
| `/progreso-escenas/` | Tiempos y avance por escena. |
| `/respuestas-decisiones/` | Registro de decisiones del estudiante. |
| `/uso-herramientas/` | Uso de herramientas dentro de un intento. |
| `/bitácoras-reflexivas/` | Bitácora reflexiva del estudiante. |
| `/rúbricas/` | Rúbricas por caso. |
| `/criterios-rubrica/` | Criterios y puntajes por competencia. |
| `/evaluaciones-intentos/` | Evaluaciones docentes de intentos. |
| `/evaluaciones-criterios/` | Desglose de evaluación por criterio. |
| `/comentarios-docente/` | Comentarios visibles o internos del docente. |
| `/retroalimentaciónes/` | Retroalimentación automatica final. |
| `/comparaciones-intentos/` | Comparación de rutas y resultados alternativos. |
| `/indicadores-desempeño/` | Indicadores por intento y competencia. |
| `/alertas-desempeño/` | Alertas por bajo desempeño, riesgo o inactividad. |
| `/reportes-desempeño/` | Reportes exportables y trazabilidad. |
| `/interacciones-ia/` | Registro de asistencia inteligente contextual. |
| `/auditoría-eventos/` | Auditoría de eventos relevantes. |

## Reglas de acceso

- `ADMINISTRADOR`: administra usuarios, catálogos, casos, evaluaciones, analíticas, reportes y auditoría.
- `DOCENTE`: gestiona estudiantes, grupos, casos, asignaciones, rúbricas, comentarios, analíticas y reportes.
- `ESTUDIANTE`: realiza simulaciones, registra decisiones, usa herramientas, escribe bitácora, consulta retroalimentación e IA.

## Archivos fuente relevantes

- `apps/administrativo/models.py`: usuarios, roles y grupos.
- `apps/simulador/models.py`: modelo completo del simulador.
- `apps/administrativo/views.py`: módulo administrativo de docente administrador.
- `apps/simulador/views.py`: API del simulador y analíticas.
- `apps/administrativo/management/commands/seed_admin.py`: usuario inicial.
## Pingüino IA con OpenAI

El frontend `/admin/ia` usa el endpoint `/api/administrativo/gregory/` para conectar docentes y administradores con la Responses API de OpenAI. Variables requeridas:

```env
OPENAI_API_KEY=<tu_clave_nueva>
OPENAI_MODEL=gpt-5.2
OPENAI_TIMEOUT_SECONDS=45
```

La clave debe vivir en `.env` o en variables de entorno del servidor. En Docker, copie `.env.example` como `.env` en la raíz del proyecto y reinicie `api` y `frontend-estudiante`. Sin llave, Pingüino solo analiza instrucciones y bloquea ejecución de cambios.

