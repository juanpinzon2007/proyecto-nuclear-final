from django.contrib import admin
from django import forms
from django.db.models import Avg, Count
from django.http import HttpResponse
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.administrativo.admin import filter_user_queryset
from apps.administrativo.models import GrupoAcademico, Usuario
from apps.simulador import models


class ReporteFechaForm(forms.Form):
    fecha_inicio = forms.DateField(label="Fecha inicial", required=False, widget=forms.DateInput(attrs={"type": "date"}))
    fecha_fin = forms.DateField(label="Fecha final", required=False, widget=forms.DateInput(attrs={"type": "date"}))


def build_bar_chart(title, labels, values, color):
    drawing = Drawing(17 * cm, 7 * cm)
    drawing.add(String(20, 180, title, fontSize=11, fontName="Helvetica-Bold"))
    chart = VerticalBarChart()
    chart.x = 45
    chart.y = 35
    chart.height = 130
    chart.width = 420
    chart.data = [values or [0]]
    chart.categoryAxis.categoryNames = labels or ["Sin datos"]
    chart.categoryAxis.labels.angle = 30
    chart.categoryAxis.labels.dy = -12
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(values or [1]) + 1
    chart.bars[0].fillColor = color
    drawing.add(chart)
    return drawing


class RoleRestrictedAdmin(admin.ModelAdmin):
    docente_can_add = True
    docente_can_change = True
    docente_can_delete = False
    docente_can_view = True

    def is_admin_role(self, request):
        return bool(request.user.is_superuser or getattr(request.user, "rol", None) == "ADMINISTRADOR")

    def is_docente_role(self, request):
        return getattr(request.user, "rol", None) == "DOCENTE"

    def has_module_permission(self, request):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_view

    def has_view_permission(self, request, obj=None):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_view

    def has_add_permission(self, request):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_add

    def has_change_permission(self, request, obj=None):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_change

    def has_delete_permission(self, request, obj=None):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_delete

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.remote_field.model is Usuario:
            kwargs["queryset"] = filter_user_queryset(Usuario.objects.all(), db_field.name).order_by("apellidos", "nombres")
        elif db_field.remote_field.model is GrupoAcademico and self.is_docente_role(request) and not self.is_admin_role(request):
            kwargs["queryset"] = GrupoAcademico.objects.filter(docente=request.user).order_by("nombre")
        elif self.is_docente_role(request) and not self.is_admin_role(request):
            related_model = db_field.remote_field.model
            if related_model is models.Caso:
                kwargs["queryset"] = models.Caso.objects.filter(creado_por=request.user).order_by("codigo")
            elif related_model is models.Escena:
                kwargs["queryset"] = models.Escena.objects.filter(caso__creado_por=request.user).order_by("caso__codigo", "orden")
            elif related_model is models.Intento:
                kwargs["queryset"] = models.Intento.objects.filter(caso__creado_por=request.user).order_by("-iniciado_en")
            elif related_model is models.AsignacionCaso:
                kwargs["queryset"] = models.AsignacionCaso.objects.filter(asignado_por=request.user).order_by("-creado_en")
            elif related_model is models.Rubrica:
                kwargs["queryset"] = models.Rubrica.objects.filter(caso__creado_por=request.user).order_by("caso__codigo", "nombre")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(models.Caso)
class CasoAdmin(RoleRestrictedAdmin):
    list_display = ("codigo", "titulo", "nivel", "estado", "fecha_creacion")
    exclude = ("max_intentos",)
    list_filter = ("estado", "nivel", "creado_por", "tematicas", "competencias")
    search_fields = ("codigo", "titulo", "descripcion", "contexto")
    autocomplete_fields = ("creado_por", "publicado_por")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if self.is_docente_role(request) and not self.is_admin_role(request):
            return queryset.filter(creado_por=request.user)
        return queryset

    def save_model(self, request, obj, form, change):
        if self.is_docente_role(request) and not self.is_admin_role(request):
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(models.Escena)
class EscenaAdmin(RoleRestrictedAdmin):
    list_display = ("codigo", "titulo", "caso", "tipo", "orden", "es_inicial", "es_final", "activa")
    list_filter = ("tipo", "es_inicial", "es_final", "activa", "caso")
    search_fields = ("codigo", "titulo", "contenido", "caso__titulo")
    autocomplete_fields = ("caso",)


@admin.register(models.Decision)
class DecisionAdmin(RoleRestrictedAdmin):
    list_display = ("escena_origen", "tipo", "puntaje", "requiere_justificacion", "activa", "orden")
    list_filter = ("tipo", "requiere_justificacion", "activa", "escena_origen__caso")
    search_fields = ("texto_decision", "consecuencia", "escena_origen__titulo")
    autocomplete_fields = ("escena_origen", "escena_destino")


@admin.register(models.Intento)
class IntentoAdmin(RoleRestrictedAdmin):
    docente_can_add = False
    docente_can_change = False
    list_display = ("estudiante", "caso", "numero_intento", "estado", "puntaje_total", "duracion_segundos", "iniciado_en")
    list_filter = ("estado", "caso", "numero_intento")
    date_hierarchy = "iniciado_en"
    search_fields = ("estudiante__correo", "estudiante__nombres", "estudiante__apellidos", "caso__titulo")
    autocomplete_fields = ("estudiante", "caso", "asignacion", "escena_actual")
    change_list_template = "admin/simulador/intento/change_list.html"

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if self.is_docente_role(request) and not self.is_admin_role(request):
            return queryset.filter(caso__creado_por=request.user)
        return queryset

    def get_urls(self):
        return [
            path("seguimiento-vivo/", self.admin_site.admin_view(self.seguimiento_vivo), name="simulador_intento_seguimiento_vivo"),
            *super().get_urls(),
        ]

    def seguimiento_vivo(self, request):
        now = timezone.now()
        intentos = (
            self.get_queryset(request)
            .filter(estado=models.EstadoIntento.EN_PROGRESO)
            .select_related("estudiante", "caso", "escena_actual")
            .order_by("-actualizado_en", "-iniciado_en")
        )
        rows = []
        for intento in intentos:
            total_escenas = intento.caso.escenas.filter(activa=True).count() or 1
            escenas_visitadas = intento.progreso.values("escena_id").distinct().count()
            ultima_respuesta = intento.respuestas.select_related("decision", "escena").order_by("-respondida_en").first()
            ultimo_progreso = intento.progreso.select_related("escena").order_by("-fecha_entrada").first()
            ultimo_uso = models.UsoHerramientaIntento.objects.filter(intento=intento).select_related("herramienta").order_by("-usada_en").first()
            last_activity = max(
                value
                for value in [
                    intento.actualizado_en,
                    ultima_respuesta.respondida_en if ultima_respuesta else None,
                    ultimo_progreso.fecha_entrada if ultimo_progreso else None,
                    ultimo_uso.usada_en if ultimo_uso else None,
                ]
                if value
            )
            rows.append(
                {
                    "intento": intento,
                    "progress_percent": min(100, int((escenas_visitadas / total_escenas) * 100)),
                    "visited_scenes": escenas_visitadas,
                    "total_scenes": total_escenas,
                    "responses_count": intento.respuestas.count(),
                    "tools_count": models.UsoHerramientaIntento.objects.filter(intento=intento).count(),
                    "journals_count": intento.bitacoras.count(),
                    "latest_decision": ultima_respuesta.decision.texto_decision if ultima_respuesta else "Sin decisiones registradas",
                    "latest_scene": ultimo_progreso.escena.titulo if ultimo_progreso else (intento.escena_actual.titulo if intento.escena_actual else "Sin escena"),
                    "latest_tool": ultimo_uso.herramienta.nombre if ultimo_uso else "Sin herramientas usadas",
                    "last_activity": last_activity,
                    "minutes_active": int((now - intento.iniciado_en).total_seconds() // 60),
                }
            )
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Seguimiento en vivo de simulaciones",
            "rows": rows,
            "active_count": len(rows),
            "updated_at": now,
        }
        return TemplateResponse(request, "admin/simulador/intento/seguimiento_vivo.html", context)


@admin.register(models.AlertaDesempeno)
class AlertaDesempenoAdmin(RoleRestrictedAdmin):
    list_display = ("titulo", "estudiante", "docente", "tipo", "estado", "valor_observado", "creada_en")
    list_filter = ("tipo", "estado", "competencia")
    date_hierarchy = "creada_en"
    search_fields = ("titulo", "descripcion", "estudiante__correo", "docente__correo")
    autocomplete_fields = ("estudiante", "docente", "intento", "competencia")


@admin.register(models.ReporteDesempeno)
class ReporteDesempenoAdmin(RoleRestrictedAdmin):
    docente_can_add = False
    list_display = ("titulo", "estudiante", "generado_por", "incluye_datos_sensibles", "generado_en")
    list_filter = ("incluye_datos_sensibles",)
    date_hierarchy = "generado_en"
    search_fields = ("titulo", "estudiante__correo", "generado_por__correo")
    autocomplete_fields = ("intento", "estudiante", "generado_por")
    change_list_template = "admin/simulador/reportedesempeno/change_list.html"

    def has_add_permission(self, request):
        return False

    def get_urls(self):
        return [
            path("exportar-pdf/", self.admin_site.admin_view(self.exportar_pdf), name="simulador_reportedesempeno_exportar_pdf"),
            *super().get_urls(),
        ]

    def exportar_pdf(self, request):
        form = ReporteFechaForm(request.GET or None)
        if not form.is_valid() or "descargar" not in request.GET:
            context = {
                **self.admin_site.each_context(request),
                "opts": self.model._meta,
                "title": "Generar reporte PDF por fecha",
                "form": form,
            }
            return TemplateResponse(request, "admin/simulador/reportedesempeno/exportar_pdf.html", context)

        inicio = form.cleaned_data["fecha_inicio"]
        fin = form.cleaned_data["fecha_fin"]
        reportes = models.ReporteDesempeno.objects.select_related("estudiante", "generado_por").order_by("generado_en")
        intentos = models.Intento.objects.select_related("caso", "estudiante").order_by("iniciado_en")
        if inicio:
            reportes = reportes.filter(generado_en__date__gte=inicio)
            intentos = intentos.filter(iniciado_en__date__gte=inicio)
        if fin:
            reportes = reportes.filter(generado_en__date__lte=fin)
            intentos = intentos.filter(iniciado_en__date__lte=fin)

        por_fecha = list(reportes.values("generado_en__date").annotate(total=Count("id")).order_by("generado_en__date"))
        por_estado = list(intentos.values("estado").annotate(total=Count("id")).order_by("estado"))
        promedio = intentos.aggregate(valor=Avg("puntaje_total"))["valor"] or 0
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="reporte-psicosocial-por-fecha.pdf"'
        doc = SimpleDocTemplate(response, pagesize=letter, rightMargin=35, leftMargin=35, topMargin=35, bottomMargin=35)
        styles = getSampleStyleSheet()
        periodo = f"{inicio or 'Inicio'} a {fin or 'Hoy'}"
        story = [
            Paragraph("Simulador Psicosocial CUE", styles["Title"]),
            Paragraph("Reporte de desempeño por fecha", styles["Heading2"]),
            Paragraph(f"Periodo: {periodo}", styles["Normal"]),
            Spacer(1, 10),
            Table(
                [["Reportes generados", str(reportes.count())], ["Intentos registrados", str(intentos.count())], ["Puntaje promedio", f"{promedio:.2f}"]],
                colWidths=[7 * cm, 5 * cm],
                style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke), ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey), ("PADDING", (0, 0), (-1, -1), 7)]),
            ),
            Spacer(1, 14),
            build_bar_chart("Reportes generados por fecha", [str(row["generado_en__date"]) for row in por_fecha], [row["total"] for row in por_fecha], colors.HexColor("#2563eb")),
            Spacer(1, 8),
            build_bar_chart("Intentos por estado", [row["estado"] for row in por_estado], [row["total"] for row in por_estado], colors.HexColor("#059669")),
            Spacer(1, 14),
            Paragraph("Detalle de reportes", styles["Heading3"]),
        ]
        detail = [["Fecha", "Título", "Estudiante", "Generado por"]]
        for reporte in reportes:
            detail.append([
                timezone.localtime(reporte.generado_en).strftime("%Y-%m-%d"),
                reporte.titulo,
                reporte.estudiante.correo if reporte.estudiante else "-",
                reporte.generado_por.correo,
            ])
        if len(detail) == 1:
            detail.append(["-", "Sin reportes para el rango seleccionado", "-", "-"])
        story.append(Table(detail, repeatRows=1, colWidths=[2.5 * cm, 6 * cm, 4.5 * cm, 4.5 * cm], style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.4, colors.lightgrey), ("FONTSIZE", (0, 0), (-1, -1), 7), ("PADDING", (0, 0), (-1, -1), 5)])))
        doc.build(story)
        return response


@admin.register(models.AsignacionCaso)
class AsignacionCasoAdmin(RoleRestrictedAdmin):
    list_display = ("caso", "grupo", "estudiante", "asignado_por", "activo", "creado_en")
    list_filter = ("activo", "caso", "grupo")
    date_hierarchy = "creado_en"
    search_fields = ("caso__codigo", "caso__titulo", "grupo__nombre", "estudiante__correo", "asignado_por__correo")
    autocomplete_fields = ("caso", "grupo", "estudiante", "asignado_por")

    def save_model(self, request, obj, form, change):
        if self.is_docente_role(request) and not self.is_admin_role(request):
            obj.asignado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(models.Competencia)
class CompetenciaAdmin(RoleRestrictedAdmin):
    docente_can_add = False
    docente_can_change = False
    list_display = ("codigo", "nombre", "activa")
    list_filter = ("activa",)
    search_fields = ("codigo", "nombre", "descripcion")


for model in [
    models.Tematica,
    models.Etiqueta,
    models.CasoTematica,
    models.CasoEtiqueta,
    models.CasoCompetencia,
    models.ActorCaso,
    models.DecisionCompetencia,
    models.HerramientaProfesional,
    models.HerramientaPorCaso,
    models.Recurso,
    models.RecursoCaso,
    models.ProgresoEscena,
    models.RespuestaDecision,
    models.UsoHerramientaIntento,
    models.BitacoraReflexiva,
    models.Rubrica,
    models.CriterioRubrica,
    models.EvaluacionIntento,
    models.EvaluacionCriterio,
    models.ComentarioDocente,
    models.Retroalimentacion,
    models.ComparacionIntento,
    models.IndicadorDesempeno,
    models.InteraccionIA,
    models.AuditoriaEvento,
]:
    try:
        if model is models.AuditoriaEvento:
            class HiddenForDocenteAdmin(RoleRestrictedAdmin):
                docente_can_add = False
                docente_can_change = False
                docente_can_delete = False
                docente_can_view = False

            admin.site.register(model, HiddenForDocenteAdmin)
        else:
            admin.site.register(model, RoleRestrictedAdmin)
    except admin.sites.AlreadyRegistered:
        pass
