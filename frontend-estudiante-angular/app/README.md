# NeuroCommand - Frontend Estudiante Angular

Frontend Angular para la experiencia visual y funcional del estudiante. Mantiene la estética NeuroCommand y se conecta al backend Django existente por `/api/`.

## Ejecutar

Con Docker, desde la raíz del repositorio:

```bash
docker compose up --build
```

Abrir:

```text
http://localhost:4200/login
```

Credenciales de estudiante:

```text
correo: estudiante.demo@cue.edu.co
clave: estudiante123
```

Modo local de desarrollo:

```bash
npm install
npm start
```

Abrir `http://localhost:4200`. Para compilar:

```bash
npm run build
```

## Alcance

- Login simulado, recuperación de acceso y biometría.
- Onboarding y consolidación de perfil.
- Dashboard, perfil, logros y dossier de casos.
- Briefing, advertencia ética y consentimiento.
- Escenarios hospitalario, comisaría, comunitario, feedback en vivo y crisis aguda.
- Elección de decisiones con feedback y XP local.
- Toolkit DSM-5, protocolos legales y escalas psicométricas.
- Bitácora reflexiva, resultados y evolución de competencias.
- Galería de entornos.
- Archivo QA con las 46 capturas originales en `/student/reference`.

## Integración con backend

La aplicación consume:

- `POST /api/auth/login/`
- `GET /api/simulador/casos/`
- `GET /api/simulador/casos/{id}/estructura/`
- `GET/POST/PATCH /api/simulador/intentos/`
- `GET/POST /api/simulador/decisiones/` y `/api/simulador/respuestas-decisiones/`
- `GET/POST /api/simulador/herramientas-profesionales/`, `/herramientas-por-caso/` y `/uso-herramientas/`
- `POST /api/simulador/bitacoras-reflexivas/`
- `GET/POST /api/simulador/retroalimentaciones/`

Los datos mock quedan como respaldo visual si la API no responde.
