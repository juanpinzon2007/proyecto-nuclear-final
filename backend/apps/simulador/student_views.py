import math
import unicodedata
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.administrativo.models import EstudianteGrupo, RolUsuario
from apps.simulador import models


def estudiante_login(request):
    if request.user.is_authenticated:
        return redirect("student_dashboard")
    form = AuthenticationForm(request, data=request.POST or None)
    if request.method == "POST" and form.is_valid():
        login(request, form.get_user())
        if form.get_user().rol == RolUsuario.ESTUDIANTE:
            return redirect("student_dashboard")
        return redirect("/admin/")
    return render(request, "student/login.html", {"form": form})


def estudiante_required(view_func):
    @login_required(login_url="student_login")
    def wrapper(request, *args, **kwargs):
        if getattr(request.user, "rol", None) != RolUsuario.ESTUDIANTE:
            messages.error(request, "Este panel está disponible solo para estudiantes.")
            return redirect("/admin/")
        return view_func(request, *args, **kwargs)

    return wrapper


def _casos_disponibles(user):
    grupos_ids = EstudianteGrupo.objects.filter(estudiante=user, activo=True).values_list("grupo_id", flat=True)
    asignados = models.AsignacionCaso.objects.filter(activo=True).filter(grupo_id__in=grupos_ids) | models.AsignacionCaso.objects.filter(
        activo=True, estudiante=user
    )
    casos_ids = asignados.values_list("caso_id", flat=True)
    return (
        models.Caso.objects.filter(estado=models.EstadoCaso.PUBLICADO)
        .filter(id__in=casos_ids)
        .prefetch_related("tematicas", "competencias")
        .distinct()
    )


def _safe_decimal(value):
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _normalize_text(value):
    normalized = unicodedata.normalize("NFKD", value or "")
    return "".join(char for char in normalized if not unicodedata.combining(char)).lower()


def _best_score_for_case(caso):
    total = Decimal("0")
    for escena in caso.escenas.filter(activa=True).prefetch_related("decisiones"):
        mejor = max((_safe_decimal(decision.puntaje) for decision in escena.decisiones.filter(activa=True)), default=Decimal("0"))
        total += max(mejor, Decimal("0"))
    return total


def _attempt_progress(intento):
    total_escenas = intento.caso.escenas.filter(activa=True).count() or 1
    visitadas = intento.progreso.values("escena_id").distinct().count()
    completadas = intento.progreso.filter(completada=True).values("escena_id").distinct().count()
    respondidas = intento.respuestas.values("escena_id").distinct().count()
    referencia = max(visitadas, completadas, respondidas)
    porcentaje = 100 if intento.estado == models.EstadoIntento.FINALIZADO else int((referencia / total_escenas) * 100)
    porcentaje = min(100, max(6 if referencia else 0, porcentaje))
    escena_actual_orden = intento.escena_actual.orden if intento.escena_actual else total_escenas
    return {
        "total_escenas": total_escenas,
        "visitadas": visitadas,
        "completadas": completadas,
        "respondidas": respondidas,
        "porcentaje": porcentaje,
        "escena_actual_orden": min(escena_actual_orden, total_escenas),
    }


def _case_summary(caso, intento=None):
    progreso = _attempt_progress(intento) if intento else None
    mejor_ruta = _best_score_for_case(caso)
    return {
        "caso": caso,
        "intento": intento,
        "progreso": progreso,
        "mejor_ruta": mejor_ruta,
        "theme": _case_theme(caso),
        "escenas_total": caso.escenas.filter(activa=True).count(),
        "decisiones_total": models.Decision.objects.filter(escena_origen__caso=caso, activa=True).count(),
        "herramientas_total": models.HerramientaPorCaso.objects.filter(caso=caso).count(),
        "recursos_total": models.RecursoCaso.objects.filter(caso=caso).count(),
    }


def _case_theme(caso):
    descriptors = " ".join(
        [
            caso.titulo,
            caso.descripcion,
            caso.contexto,
            " ".join(caso.tematicas.values_list("nombre", flat=True)),
            " ".join(caso.etiquetas.values_list("nombre", flat=True)),
        ]
    )
    text = _normalize_text(descriptors)
    themes = [
        {
            "slug": "group-pressure",
            "keywords": ["grupo", "presion", "conformidad", "influencia", "exclusion", "aula"],
            "label": "Social Pressure",
            "mood": "Tensión social controlada",
            "accent": "cyan",
            "animation": "pulse-grid",
        },
        {
            "slug": "family-crisis",
            "keywords": ["familia", "feminicidio", "violencia", "hogar", "pareja"],
            "label": "Family Crisis",
            "mood": "Alerta psicosocial alta",
            "accent": "danger",
            "animation": "warning-wave",
        },
        {
            "slug": "hospital",
            "keywords": ["hospital", "clinico", "paciente", "salud", "trauma"],
            "label": "Clínical Scene",
            "mood": "Contención y precisión",
            "accent": "teal",
            "animation": "scan-sweep",
        },
        {
            "slug": "community",
            "keywords": ["comunidad", "barrio", "colectivo", "territorio", "intervención social"],
            "label": "Community Field",
            "mood": "Territorio en movimiento",
            "accent": "green",
            "animation": "drift-field",
        },
    ]
    for theme in themes:
        if any(keyword in text for keyword in theme["keywords"]):
            return theme
    return {
        "slug": "neural-default",
        "label": "Neural Default",
        "mood": "Simulación académica activa",
        "accent": "cyan",
        "animation": "scan-sweep",
    }


def _scene_mode(escena, caso):
    theme = _case_theme(caso)
    if not escena:
        return {"slug": "final", "label": "Cierre", "animation": "calm-fade"}
    mapping = {
        models.TipoEscena.INTRODUCCION: {"slug": "briefing", "label": "Briefing", "animation": "scan-sweep"},
        models.TipoEscena.DESARROLLO: {"slug": "analysis", "label": "Análisis", "animation": "drift-field"},
        models.TipoEscena.DECISION: {"slug": "decision", "label": "Decisión", "animation": "decision-beat"},
        models.TipoEscena.USO_HERRAMIENTA: {"slug": "tools", "label": "Toolkit", "animation": "tool-spark"},
        models.TipoEscena.RETROALIMENTACION: {"slug": "feedback", "label": "Feedback", "animation": "calm-fade"},
        models.TipoEscena.FINAL: {"slug": "final", "label": "Cierre", "animation": "calm-fade"},
    }
    mode = mapping.get(escena.tipo, {"slug": "analysis", "label": "Escena", "animation": theme["animation"]})
    mode["theme"] = theme
    return mode


def _filter_case_queryset(queryset, request):
    search = request.GET.get("q", "").strip()
    tematica_id = request.GET.get("tematica", "").strip()
    competencia_id = request.GET.get("competencia", "").strip()
    nivel = request.GET.get("nivel", "").strip()
    if search:
        queryset = queryset.filter(
            Q(titulo__icontains=search)
            | Q(codigo__icontains=search)
            | Q(descripcion__icontains=search)
            | Q(contexto__icontains=search)
            | Q(etiquetas__nombre__icontains=search)
            | Q(tematicas__nombre__icontains=search)
        )
    if tematica_id:
        queryset = queryset.filter(tematicas__id=tematica_id)
    if competencia_id:
        queryset = queryset.filter(competencias__id=competencia_id)
    if nivel:
        queryset = queryset.filter(nivel=nivel)
    return queryset.distinct()


def _catalog_filters(user, cases_queryset):
    case_ids = list(cases_queryset.values_list("id", flat=True))
    tematicas = (
        models.Tematica.objects.filter(caso__id__in=case_ids)
        .distinct()
        .order_by("nombre")
    )
    competencias = (
        models.Competencia.objects.filter(caso__id__in=case_ids)
        .distinct()
        .order_by("nombre")
    )
    return {
        "tematicas": tematicas,
        "competencias": competencias,
        "niveles": [
            {"value": value, "label": label}
            for value, label in models.NivelDificultad.choices
        ],
        "estado_intento": [
            {"value": "TODOS", "label": "Todos"},
            {"value": "SIN_INICIAR", "label": "Sin iniciar"},
            {"value": "EN_PROGRESO", "label": "En progreso"},
            {"value": "FINALIZADO", "label": "Finalizado"},
        ],
        "ordenes": [
            {"value": "titulo", "label": "Título"},
            {"value": "progreso_desc", "label": "Mayor progreso"},
            {"value": "puntaje_desc", "label": "Mayor puntaje"},
            {"value": "nivel", "label": "Nivel"},
        ],
    }


def _status_for_case_item(item):
    if not item["intento"]:
        return "SIN_INICIAR"
    return item["intento"].estado


def _apply_card_filters(case_cards, request):
    estado = request.GET.get("estado_intento", "TODOS").strip() or "TODOS"
    orden = request.GET.get("orden", "titulo").strip() or "titulo"
    filtered = list(case_cards)
    if estado != "TODOS":
        filtered = [item for item in filtered if _status_for_case_item(item) == estado]

    if orden == "progreso_desc":
        filtered.sort(key=lambda item: item["progreso"]["porcentaje"] if item["progreso"] else -1, reverse=True)
    elif orden == "puntaje_desc":
        filtered.sort(key=lambda item: float(item["intento"].puntaje_total) if item["intento"] else -1, reverse=True)
    elif orden == "nivel":
        order_map = {
            models.NivelDificultad.BASICO: 1,
            models.NivelDificultad.INTERMEDIO: 2,
            models.NivelDificultad.AVANZADO: 3,
        }
        filtered.sort(key=lambda item: (order_map.get(item["caso"].nivel, 99), item["caso"].titulo))
    else:
        filtered.sort(key=lambda item: item["caso"].titulo.lower())
    return filtered


def _dashboard_competencias(user, caso_activo=None):
    indicadores = list(
        models.IndicadorDesempeno.objects.filter(intento__estudiante=user)
        .select_related("competencia")
        .order_by("-calculado_en")[:5]
    )
    if indicadores:
        return [
            {
                "nombre": item.competencia.nombre if item.competencia else item.nombre_indicador,
                "valor": int(min(100, float(item.valor))),
                "xp": f"+{int(float(item.valor))}",
            }
            for item in indicadores
        ]

    if not caso_activo:
        return []

    competencias = list(caso_activo.casocompetencia_set.select_related("competencia").all()[:5])
    base = [82, 68, 57, 74, 63]
    return [
        {
            "nombre": item.competencia.nombre,
            "valor": base[index % len(base)],
            "xp": f"+{int(item.peso * 10)}",
        }
        for index, item in enumerate(competencias)
    ]


def _close_scene_progress(intento, escena, salida=None):
    if not escena:
        return
    salida = salida or timezone.now()
    progreso = (
        models.ProgresoEscena.objects.filter(intento=intento, escena=escena)
        .order_by("-fecha_entrada")
        .first()
    )
    if not progreso:
        return
    if progreso.fecha_salida:
        return
    progreso.fecha_salida = salida
    progreso.completada = True
    progreso.duracion_segundos = max(0, int((salida - progreso.fecha_entrada).total_seconds()))
    progreso.save(update_fields=["fecha_salida", "completada", "duracion_segundos"])


def _build_radar_metrics(intento, indicadores):
    indicadores = list(indicadores[:5])
    if indicadores:
        puntos = []
        for indicador in indicadores:
            valor = float(indicador.valor)
            puntos.append(
                {
                    "label": indicador.competencia.nombre if indicador.competencia else indicador.nombre_indicador,
                    "value": max(5, min(100, int(valor))),
                }
            )
    else:
        score = int(min(100, float(intento.puntaje_total)))
        puntos = [
            {"label": "Empatía", "value": max(35, score)},
            {"label": "Precisión", "value": max(28, min(100, score + 8))},
            {"label": "Decisión", "value": max(22, min(100, score - 6))},
            {"label": "Sintonía", "value": max(24, min(100, score - 10))},
            {"label": "Clínica", "value": max(30, min(100, score + 2))},
        ]

    total = len(puntos)
    radio = 36
    centro = 50
    axes = []
    polygon = []
    for index, punto in enumerate(puntos):
        angulo = -math.pi / 2 + (2 * math.pi * index / total)
        max_x = centro + radio * math.cos(angulo)
        max_y = centro + radio * math.sin(angulo)
        valor_radio = radio * (punto["value"] / 100)
        valor_x = centro + valor_radio * math.cos(angulo)
        valor_y = centro + valor_radio * math.sin(angulo)
        axes.append({"label": punto["label"], "x": round(max_x, 2), "y": round(max_y, 2)})
        polygon.append(f"{valor_x:.2f},{valor_y:.2f}")

    return {"items": puntos, "axes": axes, "polygon": " ".join(polygon)}


@estudiante_required
def dashboard(request):
    casos = _casos_disponibles(request.user)
    intentos = models.Intento.objects.filter(estudiante=request.user).select_related("caso", "escena_actual").order_by("-iniciado_en")
    alertas = models.AlertaDesempeno.objects.filter(estudiante=request.user, estado=models.EstadoAlerta.ABIERTA).select_related("competencia")
    caso_cards = []
    intento_por_caso = {intento.caso_id: intento for intento in intentos}
    for caso in casos:
        caso_cards.append(_case_summary(caso, intento_por_caso.get(caso.id)))

    total_xp = sum((intento.puntaje_total or Decimal("0")) for intento in intentos)
    finalizados = [intento for intento in intentos if intento.estado == models.EstadoIntento.FINALIZADO]
    caso_activo = next((item for item in caso_cards if item["intento"] and item["intento"].estado == models.EstadoIntento.EN_PROGRESO), None)
    xp_entero = int(total_xp)
    ciclo_xp = 150
    contexto = {
        "casos": casos,
        "caso_cards": caso_cards,
        "intentos": intentos[:5],
        "alertas": alertas[:4],
        "active_case": caso_activo,
        "dashboard_stats": {
            "xp_total": xp_entero,
            "nivel": max(1, int(total_xp // Decimal(str(ciclo_xp))) + 1),
            "casos_resueltos": len(finalizados),
            "precision": int(sum(float(intento.puntaje_total or 0) for intento in finalizados) / len(finalizados)) if finalizados else 0,
            "xp_cycle_current": xp_entero % ciclo_xp,
            "xp_cycle_total": ciclo_xp,
            "xp_cycle_percent": int(((xp_entero % ciclo_xp) / ciclo_xp) * 100) if ciclo_xp else 0,
        },
        "competencias_panel": _dashboard_competencias(request.user, caso_activo["caso"] if caso_activo else None),
    }
    return render(request, "student/dashboard.html", contexto)


@estudiante_required
def casos(request):
    casos_disponibles = _filter_case_queryset(_casos_disponibles(request.user), request)
    intentos = (
        models.Intento.objects.filter(estudiante=request.user, caso__in=casos_disponibles)
        .select_related("caso", "escena_actual")
        .order_by("-iniciado_en")
    )
    intento_por_caso = {intento.caso_id: intento for intento in intentos}
    caso_cards = [_case_summary(caso, intento_por_caso.get(caso.id)) for caso in casos_disponibles]
    caso_cards = _apply_card_filters(caso_cards, request)
    return render(
        request,
        "student/casos.html",
        {
            "caso_cards": caso_cards,
            "catalog_filters": _catalog_filters(request.user, casos_disponibles),
            "active_filters": {
                "q": request.GET.get("q", "").strip(),
                "tematica": request.GET.get("tematica", "").strip(),
                "competencia": request.GET.get("competencia", "").strip(),
                "nivel": request.GET.get("nivel", "").strip(),
                "estado_intento": request.GET.get("estado_intento", "TODOS").strip() or "TODOS",
                "orden": request.GET.get("orden", "titulo").strip() or "titulo",
            },
        },
    )


@estudiante_required
def caso_detalle(request, caso_id):
    caso = get_object_or_404(_casos_disponibles(request.user), id=caso_id)
    recursos = models.RecursoCaso.objects.filter(caso=caso, visible_antes=True).select_related("recurso", "competencia")
    intentos = models.Intento.objects.filter(estudiante=request.user, caso=caso).order_by("-numero_intento")
    actores = models.ActorCaso.objects.filter(caso=caso).order_by("nombre")
    herramientas = (
        models.HerramientaPorCaso.objects.filter(caso=caso)
        .select_related("herramienta", "escena")
        .order_by("escena__orden", "herramienta__nombre")
    )
    escenas = caso.escenas.filter(activa=True).order_by("orden")
    active_intent = intentos.filter(estado=models.EstadoIntento.EN_PROGRESO).first()
    return render(
        request,
        "student/caso_detalle.html",
        {
            "caso": caso,
            "recursos": recursos,
            "intentos": intentos,
            "actores": actores,
            "herramientas": herramientas,
            "escenas": escenas,
            "active_intent": active_intent,
            "case_summary": _case_summary(caso, active_intent or intentos.first()),
            "case_theme": _case_theme(caso),
        },
    )


@estudiante_required
def iniciar_simulacion(request, caso_id):
    caso = get_object_or_404(_casos_disponibles(request.user), id=caso_id)
    intento = (
        models.Intento.objects.filter(estudiante=request.user, caso=caso, estado=models.EstadoIntento.EN_PROGRESO)
        .select_related("escena_actual")
        .first()
    )
    if intento:
        return redirect("student_simulacion", intento_id=intento.id)

    total = models.Intento.objects.filter(estudiante=request.user, caso=caso).count()
    escena_inicial = caso.escenas.filter(es_inicial=True, activa=True).first() or caso.escenas.filter(activa=True).order_by("orden").first()
    intento = models.Intento.objects.create(
        estudiante=request.user,
        caso=caso,
        numero_intento=total + 1,
        estado=models.EstadoIntento.EN_PROGRESO,
        escena_actual=escena_inicial,
    )
    if escena_inicial:
        models.ProgresoEscena.objects.create(intento=intento, escena=escena_inicial)
    return redirect("student_simulacion", intento_id=intento.id)


@estudiante_required
def simulacion(request, intento_id):
    intento = get_object_or_404(
        models.Intento.objects.select_related("caso", "escena_actual"),
        id=intento_id,
        estudiante=request.user,
    )
    escena = intento.escena_actual
    decisiones = escena.decisiones.filter(activa=True).select_related("escena_destino") if escena else []
    recursos = models.RecursoCaso.objects.filter(caso=intento.caso, visible_durante=True).select_related("recurso", "competencia")
    herramientas = models.HerramientaPorCaso.objects.filter(caso=intento.caso).filter(escena__isnull=True) | models.HerramientaPorCaso.objects.filter(
        caso=intento.caso, escena=escena
    )
    respuestas = models.RespuestaDecision.objects.filter(intento=intento).select_related("decision", "escena").order_by("respondida_en")
    bitacoras = models.BitacoraReflexiva.objects.filter(intento=intento).order_by("-creada_en")
    uso_herramientas = (
        models.UsoHerramientaIntento.objects.filter(intento=intento)
        .select_related("herramienta", "escena")
        .order_by("-usada_en")
    )
    progreso = _attempt_progress(intento)
    return render(
        request,
        "student/simulacion.html",
        {
            "intento": intento,
            "escena": escena,
            "decisiones": decisiones,
            "recursos": recursos,
            "herramientas": herramientas.select_related("herramienta", "escena"),
            "respuestas": respuestas,
            "bitacoras": bitacoras,
            "uso_herramientas": uso_herramientas,
            "progreso": progreso,
            "escenas": intento.caso.escenas.filter(activa=True).order_by("orden"),
            "best_score": _best_score_for_case(intento.caso),
            "case_theme": _case_theme(intento.caso),
            "scene_mode": _scene_mode(escena, intento.caso),
        },
    )


@estudiante_required
@require_POST
def responder_decision(request, intento_id):
    intento = get_object_or_404(models.Intento.objects.select_related("escena_actual", "caso"), id=intento_id, estudiante=request.user)
    decision = get_object_or_404(models.Decision, id=request.POST.get("decision_id"), escena_origen=intento.escena_actual, activa=True)
    justificacion = request.POST.get("justificacion", "").strip()
    if decision.requiere_justificacion and not justificacion:
        messages.error(request, "Esta decisión requiere una justificación antes de continuar.")
        return redirect("student_simulacion", intento_id=intento.id)
    if models.RespuestaDecision.objects.filter(intento=intento, escena=intento.escena_actual).exists():
        messages.info(request, "La escena actual ya tiene una decisión registrada.")
        return redirect("student_simulacion", intento_id=intento.id)
    models.RespuestaDecision.objects.create(
        intento=intento,
        escena=intento.escena_actual,
        decision=decision,
        justificacion=justificacion,
        puntaje_obtenido=decision.puntaje,
        confirmada=True,
    )
    now = timezone.now()
    _close_scene_progress(intento, intento.escena_actual, salida=now)
    intento.puntaje_total = (intento.puntaje_total or Decimal("0")) + decision.puntaje
    intento.escena_actual = decision.escena_destino
    if not decision.escena_destino or decision.escena_destino.es_final:
        intento.estado = models.EstadoIntento.FINALIZADO
        intento.finalizado_en = now
        models.Retroalimentacion.objects.update_or_create(
            intento=intento,
            defaults={
                "resumen": "Simulación finalizada. Revisa tus decisiones, bitácora y recomendaciones.",
                "aciertos": "Identificaste elementos clave del caso y registraste tu ruta.",
                "errores": "Contrasta tu decisión con recursos y retroalimentación docente.",
                "recomendaciones": "Completa una reflexión final y consulta los recursos asociados.",
                "indicadores_json": {"puntaje_total": float(intento.puntaje_total)},
            },
        )
    intento.save()
    if intento.escena_actual:
        models.ProgresoEscena.objects.get_or_create(intento=intento, escena=intento.escena_actual)
    return redirect("student_simulacion", intento_id=intento.id)


@estudiante_required
@require_POST
def registrar_uso_herramienta(request, intento_id):
    intento = get_object_or_404(models.Intento.objects.select_related("escena_actual", "caso"), id=intento_id, estudiante=request.user)
    herramienta_caso = get_object_or_404(
        models.HerramientaPorCaso.objects.select_related("herramienta", "escena"),
        id=request.POST.get("herramienta_caso_id"),
        caso=intento.caso,
    )
    models.UsoHerramientaIntento.objects.create(
        intento=intento,
        herramienta=herramienta_caso.herramienta,
        escena=intento.escena_actual,
        datos_entrada_json={
            "fuente": "panel_estudiante",
            "herramienta_caso_id": str(herramienta_caso.id),
            "escena_actual_id": str(intento.escena_actual_id) if intento.escena_actual_id else None,
        },
        resultado_json={
            "condicion_uso": herramienta_caso.condicion_uso,
            "obligatoria": herramienta_caso.obligatoria,
        },
        observaciones=request.POST.get("observaciones", "").strip(),
    )
    messages.success(request, f"Herramienta registrada: {herramienta_caso.herramienta.nombre}.")
    return redirect("student_simulacion", intento_id=intento.id)


@estudiante_required
@require_POST
def guardar_bitacora(request, intento_id):
    intento = get_object_or_404(models.Intento.objects.select_related("escena_actual"), id=intento_id, estudiante=request.user)
    reflexion = request.POST.get("reflexion", "").strip()
    if reflexion:
        models.BitacoraReflexiva.objects.create(
            intento=intento,
            estudiante=request.user,
            escena=intento.escena_actual,
            reflexion=reflexion,
            aprendizaje_clave=request.POST.get("aprendizaje_clave", "").strip(),
            consideraciones_eticas=request.POST.get("consideraciones_eticas", "").strip(),
            autocuidado=request.POST.get("autocuidado", "").strip(),
        )
        messages.success(request, "Bitácora guardada.")
    return redirect("student_simulacion", intento_id=intento.id)


@estudiante_required
def retroalimentacion(request, intento_id):
    intento = get_object_or_404(models.Intento.objects.select_related("caso"), id=intento_id, estudiante=request.user)
    feedback = models.Retroalimentacion.objects.filter(intento=intento).first()
    comentarios = models.ComentarioDocente.objects.filter(intento=intento, visible_estudiante=True).select_related("docente", "escena")
    indicadores = list(models.IndicadorDesempeno.objects.filter(intento=intento).select_related("competencia"))
    respuestas = models.RespuestaDecision.objects.filter(intento=intento).select_related("decision", "escena").order_by("respondida_en")
    ruta_optima = _best_score_for_case(intento.caso)
    porcentaje_global = int((float(intento.puntaje_total) / float(ruta_optima)) * 100) if ruta_optima else int(min(100, float(intento.puntaje_total)))
    radar = _build_radar_metrics(intento, indicadores)
    return render(
        request,
        "student/retroalimentacion.html",
        {
            "intento": intento,
            "feedback": feedback,
            "comentarios": comentarios,
            "indicadores": indicadores,
            "respuestas": respuestas,
            "radar": radar,
            "porcentaje_global": min(100, max(0, porcentaje_global)),
            "ruta_optima": ruta_optima,
            "case_theme": _case_theme(intento.caso),
        },
    )
