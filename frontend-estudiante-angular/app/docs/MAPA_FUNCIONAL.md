# Mapa funcional del estudiante

| Módulo | Rutas principales | Operación |
| --- | --- | --- |
| Acceso | `/login`, `/recover`, `/biometric` | Autenticación simulada, recuperación y biometría |
| Onboarding | `/student/onboarding/:step` | Análisis neural, perfil y protocolo académico |
| Panel personal | `/student/dashboard`, `/student/profile`, `/student/achievements` | XP, progreso, logros y preferencias |
| Casos | `/student/cases`, `/student/case/:id` | Dossier y briefing narrativo |
| Consentimiento | `/student/simulation/:id/consent` | Advertencia de contenido sensible |
| Simulación | `/student/simulation/:id/:scene` | Hospital, comisaría, comunidad, feedback y crisis |
| Herramientas | `/student/toolkit`, `/student/toolkit/:section` | DSM-5, protocolo legal y escalas |
| Cierre | `/student/reflection/:id`, `/student/results/:id`, `/student/competencies` | Bitácora, informe y evolución |
| Entornos | `/student/environments` | Galería de nodos de simulación |
| QA visual | `/student/reference`, `/student/reference/:screen` | Comparación con 46 mockups fuente |

## Estado local

`StudentStateService` centraliza sesión simulada, consentimiento, caso activo, decisiones, XP y bitácora. Está separado de cualquier integración HTTP para permitir conectar una API real posteriormente.
