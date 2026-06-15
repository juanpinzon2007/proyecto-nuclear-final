import json
import re
import socket
import urllib.error
import urllib.request
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.administrativo.models import EstadoUsuario, EstudianteGrupo, GrupoAcademico, RolUsuario
from apps.simulador import models


Usuario = get_user_model()


ALLOWED_ACTIONS = {
    "create_user",
    "create_group",
    "enroll_student",
    "create_case",
    "publish_case",
    "create_actor",
    "create_scene",
    "create_decision",
    "create_resource",
    "attach_resource_to_case",
    "create_tool",
    "attach_tool_to_case",
    "assign_case",
    "create_rubric",
    "create_rubric_criterion",
    "create_teacher_comment",
    "create_feedback",
    "create_evaluation",
    "create_evaluation_criterion",
    "create_performance_indicator",
    "create_performance_alert",
    "create_performance_report",
}

MIN_EXECUTION_CONFIDENCE = 0.65


@dataclass
class GregoryResult:
    assistant_message: str
    operations: list[dict[str, Any]]
    executed: list[dict[str, Any]]
    errors: list[dict[str, Any]]
    dry_run: bool
    model: str
    requires_confirmation: bool
    confidence: float


def _normalize_text(value: str) -> str:
    replacements = str.maketrans("áéíóúüñÁÉÍÓÚÜÑ", "aeiouunAEIOUUN")
    return value.translate(replacements).lower()


def _extract_email(value: str) -> str | None:
    match = re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", value)
    return match.group(0).lower() if match else None


def _extract_case_code(value: str) -> str | None:
    match = re.search(r"\bCASO[-_A-Z0-9]*\d+[A-Z0-9_-]*\b", value, re.IGNORECASE)
    return match.group(0).upper() if match else None


def _extract_scene_code(value: str) -> str | None:
    match = re.search(r"\b(?:ESC|ESCENA|E)[-_ ]?([A-Z0-9]{1,8})\b", value, re.IGNORECASE)
    if not match:
        return None
    return f"ESC-{match.group(1).upper()}"


def _extract_period(value: str) -> str:
    match = re.search(r"\b20\d{2}[- ][1-2]\b", value)
    return match.group(0).replace(" ", "-") if match else ""


def _quoted_or_default(value: str, default: str) -> str:
    quoted = re.findall(r"[\"'“”](.*?)[\"'“”]", value)
    return quoted[0].strip() if quoted else default


def _operation(action: str, payload: dict[str, Any], reason: str, lookup: dict[str, Any] | None = None) -> dict[str, str]:
    return {
        "action": action,
        "lookup_json": json.dumps(lookup or {}, ensure_ascii=False),
        "payload_json": json.dumps(payload, ensure_ascii=False),
        "reason": reason,
    }


def _local_case_code() -> str:
    return f"CASO-IA-{timezone.now().strftime('%Y%m%d%H%M%S')}"


def _local_tool_code(name: str) -> str:
    slug = re.sub(r"[^A-Z0-9]+", "-", _normalize_text(name).upper()).strip("-")
    return f"HIA-{slug[:24] or 'HERRAMIENTA'}"


def _local_gregory_content(message: str, user) -> tuple[dict[str, Any], str]:
    """Fallback deterministic agent used when OpenAI is not configured.

    It intentionally supports a conservative subset of operations. Ambiguous or
    destructive requests are returned as non-executable plans requiring review.
    """
    raw = message.strip()
    lowered = _normalize_text(raw)
    operations: list[dict[str, str]] = []
    missing: list[str] = []
    email = _extract_email(raw)
    case_code = _extract_case_code(raw)
    scene_code = _extract_scene_code(raw)
    period = _extract_period(raw)

    if any(token in lowered for token in ["usuario", "estudiante", "docente", "administrador"]) and email:
        role = RolUsuario.ESTUDIANTE
        if "administrador" in lowered or "admin" in lowered:
            role = RolUsuario.ADMINISTRADOR
        elif "docente" in lowered:
            role = RolUsuario.DOCENTE
        names = "Usuario"
        last_names = "Generado"
        name_match = re.search(r"(?:llamado|llamada|nombre)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,80})", raw)
        if name_match:
            parts = name_match.group(1).strip().split()
            names = " ".join(parts[:2]) or names
            last_names = " ".join(parts[2:]) or last_names
        operations.append(
            _operation(
                "create_user",
                {
                    "correo": email,
                    "nombres": names,
                    "apellidos": last_names,
                    "rol": role,
                    "password": "Cambiar123",
                    "estado": EstadoUsuario.ACTIVO,
                },
                f"Crear o preparar usuario con rol {role}.",
            )
        )

    if "grupo" in lowered:
        group_name = _quoted_or_default(raw, "Grupo generado por Pingüino")
        operations.append(
            _operation(
                "create_group",
                {
                    "nombre": group_name,
                    "descripcion": "Grupo académico creado desde Pingüino.",
                    "periodo_academico": period or timezone.now().strftime("%Y-1"),
                    "docente_correo": email if "docente" in lowered and email else user.correo,
                    "activo": True,
                },
                "Crear grupo académico para gestión docente.",
            )
        )

    if "matricula" in lowered or "matricular" in lowered or "inscribir" in lowered:
        if not email:
            missing.append("correo del estudiante")
        group_name = _quoted_or_default(raw, "")
        if not group_name:
            missing.append("nombre del grupo entre comillas")
        if email and group_name:
            operations.append(
                _operation(
                    "enroll_student",
                    {"estudiante_correo": email, "grupo_nombre": group_name, "periodo_academico": period},
                    "Matricular estudiante en grupo académico.",
                )
            )

    if "caso" in lowered:
        title = _quoted_or_default(raw, "Caso psicosocial generado por Pingüino")
        code = case_code or _local_case_code()
        operations.append(
            _operation(
                "create_case",
                {
                    "codigo": code,
                    "titulo": title,
                    "descripcion": "Caso creado desde una instrucción administrativa de Pingüino.",
                    "contexto": raw,
                    "objetivos_aprendizaje": "Analizar la situación, tomar decisiones éticas y activar rutas de atención.",
                    "advertencia_contenido": "Contenido sensible con propósito estrictamente académico.",
                    "nivel": models.NivelDificultad.INTERMEDIO,
                    "estado": models.EstadoCaso.PUBLICADO if "public" in lowered else models.EstadoCaso.BORRADOR,
                },
                "Crear caso base para simulación.",
            )
        )
        if "public" in lowered:
            operations.append(_operation("publish_case", {"caso_codigo": code}, "Publicar el caso para estudiantes."))

    if "escena" in lowered:
        if not case_code:
            missing.append("código del caso para crear la escena")
        if case_code:
            operations.append(
                _operation(
                    "create_scene",
                    {
                        "caso_codigo": case_code,
                        "codigo": scene_code or "ESC-IA",
                        "titulo": _quoted_or_default(raw, "Escena generada por Pingüino"),
                        "contenido": raw,
                        "tipo": models.TipoEscena.DECISION,
                        "orden": 1,
                        "es_inicial": "inicial" in lowered,
                        "es_final": "final" in lowered,
                        "activa": True,
                    },
                    "Crear escena del caso indicado.",
                )
            )

    if "decision" in lowered or "decisión" in raw.lower():
        if not case_code:
            missing.append("código del caso para crear decisión")
        if not scene_code:
            missing.append("código de escena origen para crear decisión")
        if case_code and scene_code:
            operations.append(
                _operation(
                    "create_decision",
                    {
                        "caso_codigo": case_code,
                        "escena_codigo": scene_code,
                        "texto_decision": _quoted_or_default(raw, "Decisión generada por Pingüino"),
                        "consecuencia": "Consecuencia pendiente de revisión docente.",
                        "tipo": models.TipoDecision.NEUTRA,
                        "puntaje": 0,
                        "requiere_justificacion": False,
                        "orden": 1,
                    },
                    "Crear una decisión para la escena indicada.",
                )
            )

    if "recurso" in lowered or "guia" in lowered or "guía" in raw.lower():
        title = _quoted_or_default(raw, "Recurso generado por Pingüino")
        operations.append(
            _operation(
                "create_resource",
                {
                    "titulo": title,
                    "tipo": models.TipoRecurso.GUIA,
                    "resumen": "Recurso académico preparado por Pingüino.",
                    "contenido": raw,
                    "activo": True,
                },
                "Crear recurso académico reusable.",
            )
        )

    if "herramienta" in lowered or "protocolo" in lowered:
        name = _quoted_or_default(raw, "Herramienta generada por Pingüino")
        operations.append(
            _operation(
                "create_tool",
                {
                    "codigo": _local_tool_code(name),
                    "nombre": name,
                    "descripcion": "Herramienta profesional creada desde Pingüino.",
                    "instrucciones": raw,
                    "activa": True,
                },
                "Crear herramienta profesional para el simulador.",
            )
        )

    if "asign" in lowered:
        group_name = _quoted_or_default(raw, "")
        if not case_code:
            missing.append("código del caso para asignar")
        if not group_name and not email:
            missing.append("grupo entre comillas o correo de estudiante")
        if case_code and (group_name or email):
            payload: dict[str, Any] = {"caso_codigo": case_code, "activo": True}
            if group_name:
                payload["grupo_nombre"] = group_name
                if period:
                    payload["periodo_academico"] = period
            if email:
                payload["estudiante_correo"] = email
            operations.append(_operation("assign_case", payload, "Asignar caso a grupo o estudiante."))

    requires_confirmation = bool(missing) or not operations
    message_text = (
        "Pingüino preparó una propuesta local porque OpenAI no está configurado."
        if operations
        else "Pingüino necesita más datos para preparar operaciones administrativas."
    )
    if missing:
        message_text += " Faltan datos: " + ", ".join(sorted(set(missing))) + "."
    return (
        {
            "assistant_message": message_text,
            "requires_confirmation": requires_confirmation,
            "confidence": 0.82 if operations and not missing else 0.45,
            "operations": operations,
        },
        "pingüino-local",
    )


def _clean_json(value: str) -> dict[str, Any]:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _extract_response_text(response: dict[str, Any]) -> str:
    if response.get("output_text"):
        return str(response["output_text"])
    for item in response.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                return str(content["text"])
    raise ValueError("OpenAI no devolvió texto utilizable.")


def _openai_error_detail(raw: str) -> str:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return raw[:500] or "Error HTTP sin detalle."
    error = parsed.get("error", parsed)
    if isinstance(error, dict):
        return str(error.get("message") or error.get("detail") or error)[:500]
    return str(error)[:500]


def _schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "assistant_message": {"type": "string"},
            "requires_confirmation": {"type": "boolean"},
            "confidence": {"type": "number"},
            "operations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "action": {"type": "string", "enum": sorted(ALLOWED_ACTIONS)},
                        "lookup_json": {"type": "string"},
                        "payload_json": {"type": "string"},
                        "reason": {"type": "string"},
                    },
                    "required": ["action", "lookup_json", "payload_json", "reason"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["assistant_message", "requires_confirmation", "confidence", "operations"],
        "additionalProperties": False,
    }


def _system_prompt() -> str:
    return (
        "Eres Pingüino, un agente administrativo profesional para un simulador psicosocial universitario. "
        "Tu trabajo es transformar instrucciones de docentes y administradores en operaciones estructuradas "
        "seguras sobre usuarios, grupos, casos, escenas, decisiones, recursos, herramientas, rúbricas y asignaciones. "
        "No inventes IDs. Si necesitas relacionar objetos existentes usa lookup_json con código, correo, nombre o título. "
        "No modifiques datos de estudiantes fuera de operaciones administrativas explícitas. "
        "No crees contenido que revictimice; en casos sensibles usa lenguaje técnico, cuidadoso y académico. "
        "Devuelve solo JSON válido con el esquema solicitado. "
        "Usa requires_confirmation=true cuando falten datos obligatorios, haya ambigüedad o la acción pueda afectar muchos registros. Usa payload_json como un JSON serializado. Campos útiles: "
        "usuario: correo,nombres,apellidos,rol,password,documento_identidad,telefono; "
        "caso: codigo,titulo,descripcion,contexto,objetivos_aprendizaje,advertencia_contenido,nivel,estado; "
        "escena: caso_codigo,codigo,titulo,contenido,tipo,orden,es_inicial,es_final,activa; "
        "decision: escena_codigo,caso_codigo,escena_destino_codigo,texto_decision,consecuencia,tipo,puntaje,requiere_justificacion,orden; "
        "grupo: nombre,descripcion,periodo_academico,docente_correo; "
        "asignacion: caso_codigo,grupo_nombre,estudiante_correo,activo; "
        "recurso: titulo,tipo,resumen,contenido,url_externa,referencia_bibliografica; "
        "herramienta: codigo,nombre,descripcion,instrucciones,activa; "
        "rubrica: caso_codigo,nombre,descripcion; criterio: rubrica_nombre,caso_codigo,nombre,descripcion,puntaje_maximo,orden."
        "Funciones docentes adicionales: comentario: intento_id,estudiante_correo,caso_codigo,numero_intento,comentario,visible_estudiante; "
        "retroalimentacion: intento_id,resumen,aciertos,errores,recomendaciones,indicadores_json; "
        "evaluacion: intento_id,rubrica_nombre,caso_codigo,puntaje_total,observacion_general; "
        "evaluacion_criterio: intento_id,criterio_nombre,rubrica_nombre,caso_codigo,puntaje_obtenido,comentario; "
        "indicador: intento_id,competencia_codigo,nombre_indicador,valor,unidad,detalle_json; "
        "alerta: estudiante_correo,intento_id,competencia_codigo,tipo,titulo,descripcion,umbral_configurado,valor_observado; "
        "reporte: intento_id,estudiante_correo,titulo,contenido_json,incluye_datos_sensibles."
    )


def _call_openai(message: str, user) -> tuple[dict[str, Any], str]:
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    model = getattr(settings, "OPENAI_MODEL", "gpt-5.2")
    timeout = getattr(settings, "OPENAI_TIMEOUT_SECONDS", 45)
    if not api_key:
        raise RuntimeError("Falta configurar OPENAI_API_KEY en el servidor.")

    payload = {
        "model": model,
        "instructions": _system_prompt(),
        "input": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            f"Usuario solicitante: {user.correo} ({user.rol}).\n"
                            f"Instrucción administrativa:\n{message}"
                        ),
                    }
                ],
            }
        ],
        "reasoning": {"effort": "low"},
        "text": {
            "verbosity": "low",
            "format": {
                "type": "json_schema",
                "name": "gregory_admin_action",
                "strict": True,
                "schema": _schema(),
            },
        },
        "store": False,
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        if exc.code == 429:
            raise RuntimeError(
                "OpenAI aceptó la clave, pero la cuenta o el proyecto no tiene cuota disponible. "
                "Revise el saldo, el plan de facturación o los límites del proyecto en OpenAI."
            ) from exc
        if exc.code == 401:
            raise RuntimeError("OpenAI rechazó la clave configurada. Genere una clave nueva y actualice el .env.") from exc
        raise RuntimeError(f"OpenAI rechazó la solicitud: {_openai_error_detail(detail)}") from exc
    except (urllib.error.URLError, TimeoutError, socket.timeout) as exc:
        raise RuntimeError("No fue posible conectar con OpenAI. Revise la red, la clave y vuelva a intentar.") from exc

    try:
        parsed = json.loads(raw)
        content = json.loads(_extract_response_text(parsed))
    except json.JSONDecodeError as exc:
        raise RuntimeError("OpenAI respondió con un formato JSON inválido para Pingüino.") from exc
    if not isinstance(content, dict):
        raise RuntimeError("OpenAI no devolvió una respuesta estructurada válida.")
    return content, model


def _bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "si", "sí", "on"}


def _normalize_user_role(value: Any) -> str:
    raw = str(value or RolUsuario.ESTUDIANTE).strip()
    normalized = raw.upper().replace("-", "_").replace(" ", "_")
    aliases = {
        "ESTUDIANTE": RolUsuario.ESTUDIANTE,
        "STUDENT": RolUsuario.ESTUDIANTE,
        "ALUMNO": RolUsuario.ESTUDIANTE,
        "DOCENTE": RolUsuario.DOCENTE,
        "PROFESOR": RolUsuario.DOCENTE,
        "TEACHER": RolUsuario.DOCENTE,
        "ADMIN": RolUsuario.ADMINISTRADOR,
        "ADMINISTRADOR": RolUsuario.ADMINISTRADOR,
        "DOCENTE_ADMINISTRADOR": RolUsuario.ADMINISTRADOR,
    }
    return aliases.get(normalized, RolUsuario.ESTUDIANTE)


def _normalize_user_status(value: Any) -> str:
    raw = str(value or EstadoUsuario.ACTIVO).strip()
    normalized = raw.upper().replace("-", "_").replace(" ", "_")
    aliases = {
        "ACTIVO": EstadoUsuario.ACTIVO,
        "ACTIVE": EstadoUsuario.ACTIVO,
        "INACTIVO": EstadoUsuario.INACTIVO,
        "INACTIVE": EstadoUsuario.INACTIVO,
        "RETIRADO": EstadoUsuario.RETIRADO,
        "BLOQUEADO": EstadoUsuario.BLOQUEADO,
        "BLOCKED": EstadoUsuario.BLOQUEADO,
    }
    return aliases.get(normalized, EstadoUsuario.ACTIVO)


def _decimal(value: Any, default: str = "0") -> Decimal:
    if value in {None, ""}:
        return Decimal(default)
    return Decimal(str(value))


def _get_case(payload: dict[str, Any], lookup: dict[str, Any]) -> models.Caso:
    codigo = payload.get("caso_codigo") or lookup.get("caso_codigo") or lookup.get("codigo")
    if codigo:
        return models.Caso.objects.get(codigo=str(codigo).strip())
    titulo = payload.get("caso_titulo") or lookup.get("caso_titulo") or lookup.get("titulo")
    if titulo:
        return models.Caso.objects.get(titulo__iexact=str(titulo).strip())
    raise ValueError("No se pudo identificar el caso.")


def _get_scene(payload: dict[str, Any], lookup: dict[str, Any], key: str = "escena_codigo") -> models.Escena:
    codigo = payload.get(key) or lookup.get(key) or lookup.get("codigo")
    caso = _get_case(payload, lookup)
    if not codigo:
        raise ValueError("No se pudo identificar la escena.")
    return models.Escena.objects.get(caso=caso, codigo=str(codigo).strip())


def _get_user_by_email(email: str) -> Usuario:
    return Usuario.objects.get(correo=str(email).strip().lower())


def _get_group(payload: dict[str, Any], lookup: dict[str, Any]) -> GrupoAcademico:
    nombre = payload.get("grupo_nombre") or payload.get("nombre") or lookup.get("grupo_nombre") or lookup.get("nombre")
    periodo = payload.get("periodo_academico") or lookup.get("periodo_academico")
    if not nombre:
        raise ValueError("No se pudo identificar el grupo académico.")
    queryset = GrupoAcademico.objects.filter(nombre=str(nombre).strip())
    if periodo:
        queryset = queryset.filter(periodo_academico=str(periodo).strip())
    return queryset.get()


def _get_attempt(payload: dict[str, Any], lookup: dict[str, Any]) -> models.Intento:
    attempt_id = payload.get("intento_id") or lookup.get("intento_id") or payload.get("id") or lookup.get("id")
    if attempt_id:
        return models.Intento.objects.get(id=attempt_id)

    estudiante_correo = payload.get("estudiante_correo") or lookup.get("estudiante_correo")
    caso_codigo = payload.get("caso_codigo") or lookup.get("caso_codigo")
    numero_intento = payload.get("numero_intento") or lookup.get("numero_intento")
    if not estudiante_correo or not caso_codigo:
        raise ValueError("No se pudo identificar el intento. Use intento_id o estudiante_correo + caso_codigo.")

    queryset = models.Intento.objects.filter(
        estudiante=_get_user_by_email(estudiante_correo),
        caso__codigo=str(caso_codigo).strip(),
    ).order_by("-iniciado_en")
    if numero_intento:
        queryset = queryset.filter(numero_intento=int(numero_intento))
    return queryset.get()


def _get_competence(payload: dict[str, Any], lookup: dict[str, Any]) -> models.Competencia | None:
    codigo = payload.get("competencia_codigo") or lookup.get("competencia_codigo")
    nombre = payload.get("competencia_nombre") or lookup.get("competencia_nombre")
    if codigo:
        return models.Competencia.objects.get(codigo=str(codigo).strip())
    if nombre:
        return models.Competencia.objects.get(nombre__iexact=str(nombre).strip())
    return None


def _get_rubric(payload: dict[str, Any], lookup: dict[str, Any]) -> models.Rubrica:
    caso = _get_case(payload, lookup)
    nombre = payload.get("rubrica_nombre") or payload.get("nombre") or lookup.get("rubrica_nombre") or lookup.get("nombre")
    if not nombre:
        raise ValueError("No se pudo identificar la rúbrica.")
    return models.Rubrica.objects.get(caso=caso, nombre=str(nombre).strip())


def _json_payload(value: Any) -> dict[str, Any]:
    if value is None or value == "":
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        return _clean_json(value)
    return {}


def _execute_operation(operation: dict[str, Any], user) -> dict[str, Any]:
    action = operation["action"]
    lookup = _clean_json(operation.get("lookup_json", ""))
    payload = _clean_json(operation.get("payload_json", ""))

    if action == "create_user":
        correo = str(payload["correo"]).strip().lower()
        rol = _normalize_user_role(payload.get("rol", RolUsuario.ESTUDIANTE))
        estado = _normalize_user_status(payload.get("estado", EstadoUsuario.ACTIVO))
        obj, created = Usuario.objects.get_or_create(
            correo=correo,
            defaults={
                "nombres": payload.get("nombres", "Usuario"),
                "apellidos": payload.get("apellidos", "Académico"),
                "rol": rol,
                "estado": estado,
                "documento_identidad": payload.get("documento_identidad", ""),
                "telefono": payload.get("telefono", ""),
                "creado_por": user,
                "is_staff": rol in {RolUsuario.DOCENTE, RolUsuario.ADMINISTRADOR},
            },
        )
        if created:
            obj.set_password(payload.get("password") or "Cambiar123")
            obj.save()
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.correo}

    if action == "create_group":
        docente = _get_user_by_email(payload.get("docente_correo") or lookup.get("docente_correo") or user.correo)
        obj, created = GrupoAcademico.objects.get_or_create(
            nombre=payload["nombre"],
            periodo_academico=payload.get("periodo_academico", ""),
            defaults={"descripcion": payload.get("descripcion", ""), "docente": docente, "activo": _bool(payload.get("activo"), True)},
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.nombre}

    if action == "enroll_student":
        estudiante = _get_user_by_email(payload["estudiante_correo"])
        grupo = _get_group(payload, lookup)
        obj, created = EstudianteGrupo.objects.get_or_create(estudiante=estudiante, grupo=grupo, defaults={"activo": True})
        return {"action": action, "created": created, "id": f"{obj.grupo_id}:{obj.estudiante_id}", "label": str(obj)}

    if action == "create_case":
        obj, created = models.Caso.objects.get_or_create(
            codigo=payload["codigo"],
            defaults={
                "titulo": payload["titulo"],
                "descripcion": payload.get("descripcion", ""),
                "contexto": payload.get("contexto", ""),
                "objetivos_aprendizaje": payload.get("objetivos_aprendizaje", ""),
                "advertencia_contenido": payload.get("advertencia_contenido", ""),
                "nivel": payload.get("nivel", models.NivelDificultad.BASICO),
                "estado": payload.get("estado", models.EstadoCaso.BORRADOR),
                "creado_por": user,
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.codigo}

    if action == "publish_case":
        caso = _get_case(payload, lookup)
        caso.estado = models.EstadoCaso.PUBLICADO
        caso.publicado_por = user
        caso.fecha_publicacion = timezone.now()
        caso.save(update_fields=["estado", "publicado_por", "fecha_publicacion", "actualizado_en"])
        return {"action": action, "created": False, "id": str(caso.id), "label": caso.codigo}

    if action == "create_actor":
        caso = _get_case(payload, lookup)
        obj, created = models.ActorCaso.objects.get_or_create(
            caso=caso,
            nombre=payload["nombre"],
            defaults={
                "rol_en_caso": payload.get("rol_en_caso", ""),
                "descripcion": payload.get("descripcion", ""),
                "es_sensible": _bool(payload.get("es_sensible"), False),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.nombre}

    if action == "create_scene":
        caso = _get_case(payload, lookup)
        obj, created = models.Escena.objects.update_or_create(
            caso=caso,
            codigo=payload["codigo"],
            defaults={
                "titulo": payload["titulo"],
                "contenido": payload.get("contenido", ""),
                "tipo": payload.get("tipo", models.TipoEscena.DESARROLLO),
                "orden": int(payload.get("orden") or 1),
                "es_inicial": _bool(payload.get("es_inicial"), False),
                "es_final": _bool(payload.get("es_final"), False),
                "activa": _bool(payload.get("activa"), True),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.codigo}

    if action == "create_decision":
        origen = _get_scene(payload, lookup, "escena_codigo")
        destino = None
        if payload.get("escena_destino_codigo"):
            destino = models.Escena.objects.get(caso=origen.caso, codigo=payload["escena_destino_codigo"])
        obj = models.Decision.objects.create(
            escena_origen=origen,
            escena_destino=destino,
            texto_decision=payload["texto_decision"],
            consecuencia=payload.get("consecuencia", ""),
            tipo=payload.get("tipo", models.TipoDecision.NEUTRA),
            puntaje=_decimal(payload.get("puntaje")),
            requiere_justificacion=_bool(payload.get("requiere_justificacion"), False),
            activa=_bool(payload.get("activa"), True),
            orden=int(payload.get("orden") or origen.decisiones.count() + 1),
        )
        return {"action": action, "created": True, "id": str(obj.id), "label": obj.texto_decision[:90]}

    if action == "create_resource":
        obj, created = models.Recurso.objects.get_or_create(
            titulo=payload["titulo"],
            defaults={
                "tipo": payload.get("tipo", models.TipoRecurso.GUIA),
                "resumen": payload.get("resumen", ""),
                "contenido": payload.get("contenido", ""),
                "url_externa": payload.get("url_externa", ""),
                "referencia_bibliografica": payload.get("referencia_bibliografica", ""),
                "creado_por": user,
                "activo": _bool(payload.get("activo"), True),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.titulo}

    if action == "attach_resource_to_case":
        caso = _get_case(payload, lookup)
        recurso = models.Recurso.objects.get(titulo=payload.get("recurso_titulo") or lookup.get("recurso_titulo"))
        obj, created = models.RecursoCaso.objects.get_or_create(
            caso=caso,
            recurso=recurso,
            defaults={
                "visible_antes": _bool(payload.get("visible_antes"), True),
                "visible_durante": _bool(payload.get("visible_durante"), True),
                "visible_despues": _bool(payload.get("visible_despues"), True),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": f"{recurso.titulo} -> {caso.codigo}"}

    if action == "create_tool":
        obj, created = models.HerramientaProfesional.objects.get_or_create(
            codigo=payload["codigo"],
            defaults={
                "nombre": payload["nombre"],
                "descripcion": payload.get("descripcion", ""),
                "instrucciones": payload.get("instrucciones", ""),
                "creada_por": user,
                "activa": _bool(payload.get("activa"), True),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.nombre}

    if action == "attach_tool_to_case":
        caso = _get_case(payload, lookup)
        herramienta = models.HerramientaProfesional.objects.get(codigo=payload.get("herramienta_codigo") or lookup.get("herramienta_codigo"))
        escena = None
        if payload.get("escena_codigo"):
            escena = models.Escena.objects.get(caso=caso, codigo=payload["escena_codigo"])
        obj, created = models.HerramientaPorCaso.objects.get_or_create(
            caso=caso,
            herramienta=herramienta,
            escena=escena,
            defaults={"obligatoria": _bool(payload.get("obligatoria"), False), "condicion_uso": payload.get("condicion_uso", "")},
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": f"{herramienta.codigo} -> {caso.codigo}"}

    if action == "assign_case":
        caso = _get_case(payload, lookup)
        grupo = None
        estudiante = None
        if payload.get("grupo_nombre") or lookup.get("grupo_nombre") or lookup.get("nombre"):
            grupo = _get_group(payload, lookup)
        if payload.get("estudiante_correo"):
            estudiante = _get_user_by_email(payload["estudiante_correo"])
        obj, created = models.AsignacionCaso.objects.get_or_create(
            caso=caso,
            grupo=grupo,
            estudiante=estudiante,
            defaults={"asignado_por": user, "activo": _bool(payload.get("activo"), True)},
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": str(obj)}

    if action == "create_rubric":
        caso = _get_case(payload, lookup)
        obj, created = models.Rubrica.objects.get_or_create(
            caso=caso,
            nombre=payload["nombre"],
            defaults={"descripcion": payload.get("descripcion", ""), "creada_por": user, "activa": _bool(payload.get("activa"), True)},
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.nombre}

    if action == "create_rubric_criterion":
        caso = _get_case(payload, lookup)
        rubrica = models.Rubrica.objects.get(caso=caso, nombre=payload.get("rubrica_nombre") or lookup.get("rubrica_nombre"))
        obj, created = models.CriterioRubrica.objects.get_or_create(
            rubrica=rubrica,
            nombre=payload["nombre"],
            defaults={
                "descripcion": payload.get("descripcion", ""),
                "puntaje_maximo": _decimal(payload.get("puntaje_maximo"), "10"),
                "orden": int(payload.get("orden") or 1),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": obj.nombre}

    if action == "create_teacher_comment":
        intento = _get_attempt(payload, lookup)
        escena = None
        if payload.get("escena_codigo"):
            escena = models.Escena.objects.get(caso=intento.caso, codigo=payload["escena_codigo"])
        obj = models.ComentarioDocente.objects.create(
            intento=intento,
            docente=user,
            escena=escena,
            comentario=payload["comentario"],
            visible_estudiante=_bool(payload.get("visible_estudiante"), True),
        )
        return {"action": action, "created": True, "id": str(obj.id), "label": obj.comentario[:90]}

    if action == "create_feedback":
        intento = _get_attempt(payload, lookup)
        obj, created = models.Retroalimentacion.objects.update_or_create(
            intento=intento,
            defaults={
                "resumen": payload["resumen"],
                "aciertos": payload.get("aciertos", ""),
                "errores": payload.get("errores", ""),
                "recomendaciones": payload.get("recomendaciones", ""),
                "indicadores_json": _json_payload(payload.get("indicadores_json")),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": f"Retroalimentación {intento}"}

    if action == "create_evaluation":
        intento = _get_attempt(payload, lookup)
        rubrica = None
        if payload.get("rubrica_nombre") or lookup.get("rubrica_nombre"):
            rubrica = _get_rubric({**payload, "caso_codigo": intento.caso.codigo}, lookup)
        obj, created = models.EvaluacionIntento.objects.update_or_create(
            intento=intento,
            defaults={
                "rubrica": rubrica,
                "docente": user,
                "puntaje_total": _decimal(payload.get("puntaje_total")),
                "observacion_general": payload.get("observacion_general", ""),
            },
        )
        return {"action": action, "created": created, "id": str(obj.id), "label": f"Evaluación {intento}"}

    if action == "create_evaluation_criterion":
        intento = _get_attempt(payload, lookup)
        rubrica = _get_rubric({**payload, "caso_codigo": intento.caso.codigo}, lookup)
        evaluacion, _ = models.EvaluacionIntento.objects.get_or_create(
            intento=intento,
            defaults={"rubrica": rubrica, "docente": user, "puntaje_total": 0, "observacion_general": ""},
        )
        criterio_nombre = payload.get("criterio_nombre") or payload.get("nombre") or lookup.get("criterio_nombre")
        if not criterio_nombre:
            raise ValueError("No se pudo identificar el criterio de evaluación.")
        criterio = models.CriterioRubrica.objects.get(rubrica=rubrica, nombre=str(criterio_nombre).strip())
        obj, created = models.EvaluacionCriterio.objects.update_or_create(
            evaluacion=evaluacion,
            criterio=criterio,
            defaults={
                "puntaje_obtenido": _decimal(payload.get("puntaje_obtenido")),
                "comentario": payload.get("comentario", ""),
            },
        )
        evaluacion.puntaje_total = sum(item.puntaje_obtenido for item in evaluacion.criterios.all())
        evaluacion.save(update_fields=["puntaje_total"])
        return {"action": action, "created": created, "id": str(obj.id), "label": criterio.nombre}

    if action == "create_performance_indicator":
        intento = _get_attempt(payload, lookup)
        obj = models.IndicadorDesempeno.objects.create(
            intento=intento,
            competencia=_get_competence(payload, lookup),
            nombre_indicador=payload["nombre_indicador"],
            valor=_decimal(payload.get("valor")),
            unidad=payload.get("unidad", ""),
            detalle_json=_json_payload(payload.get("detalle_json")),
        )
        return {"action": action, "created": True, "id": str(obj.id), "label": obj.nombre_indicador}

    if action == "create_performance_alert":
        intento = _get_attempt(payload, lookup) if (payload.get("intento_id") or lookup.get("intento_id")) else None
        estudiante = intento.estudiante if intento else _get_user_by_email(payload["estudiante_correo"])
        obj = models.AlertaDesempeno.objects.create(
            estudiante=estudiante,
            docente=user,
            intento=intento,
            competencia=_get_competence(payload, lookup),
            tipo=payload.get("tipo", models.TipoAlerta.BAJO_DESEMPENO),
            estado=payload.get("estado", models.EstadoAlerta.ABIERTA),
            titulo=payload["titulo"],
            descripcion=payload.get("descripcion", ""),
            umbral_configurado=_decimal(payload.get("umbral_configurado")) if payload.get("umbral_configurado") not in {None, ""} else None,
            valor_observado=_decimal(payload.get("valor_observado")) if payload.get("valor_observado") not in {None, ""} else None,
        )
        return {"action": action, "created": True, "id": str(obj.id), "label": obj.titulo}

    if action == "create_performance_report":
        intento = _get_attempt(payload, lookup) if (payload.get("intento_id") or lookup.get("intento_id")) else None
        estudiante = intento.estudiante if intento else (_get_user_by_email(payload["estudiante_correo"]) if payload.get("estudiante_correo") else None)
        obj = models.ReporteDesempeno.objects.create(
            intento=intento,
            estudiante=estudiante,
            generado_por=user,
            titulo=payload["titulo"],
            contenido_json=_json_payload(payload.get("contenido_json")),
            ruta_archivo=payload.get("ruta_archivo", ""),
            incluye_datos_sensibles=_bool(payload.get("incluye_datos_sensibles"), False),
        )
        return {"action": action, "created": True, "id": str(obj.id), "label": obj.titulo}

    raise ValueError(f"Acción no permitida: {action}")


def process_gregory_request(message: str, user, dry_run: bool = True) -> GregoryResult:
    openai_ready = bool(getattr(settings, "OPENAI_API_KEY", ""))
    if openai_ready:
        content, model = _call_openai(message, user)
    else:
        content, model = _local_gregory_content(message, user)
    operations = content.get("operations", [])
    requires_confirmation = bool(content.get("requires_confirmation", False))
    try:
        confidence = float(content.get("confidence", 0))
    except (TypeError, ValueError):
        confidence = 0.0
    executed: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    execution_blocked = (not openai_ready) or requires_confirmation or confidence < MIN_EXECUTION_CONFIDENCE

    if not dry_run and execution_blocked:
        if not openai_ready:
            block_reason = (
                "No se ejecutó porque falta configurar OPENAI_API_KEY. "
                "Agregue la llave en .env o en las variables de entorno del servidor y reinicie el backend."
            )
        else:
            block_reason = (
                "No se ejecutó porque Pingüino solicitó confirmación "
                "o la confianza de la respuesta fue baja."
            )
        errors.append(
            {
                "operation": None,
                "error": block_reason,
            }
        )
    elif not dry_run:
        with transaction.atomic():
            for operation in operations:
                try:
                    if operation.get("action") not in ALLOWED_ACTIONS:
                        raise ValueError("La acción solicitada no está permitida.")
                    executed.append(_execute_operation(operation, user))
                except Exception as exc:
                    errors.append({"operation": operation, "error": str(exc)})
            if errors:
                transaction.set_rollback(True)

    return GregoryResult(
        assistant_message=content.get("assistant_message", "Pingüino preparó la solicitud."),
        operations=operations,
        executed=executed,
        errors=errors,
        dry_run=dry_run or execution_blocked,
        model=model,
        requires_confirmation=requires_confirmation,
        confidence=confidence,
    )
