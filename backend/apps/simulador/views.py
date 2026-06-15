from django.db.models import Avg, Count, Sum
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.administrativo.models import RolUsuario
from apps.simulador import models, serializers


class IsAuthenticatedAndActive(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class DocenteAdministradorWriteMixin:
    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsDocenteAdministrador()]
        return [IsAuthenticatedAndActive()]


class IsDocenteAdministrador(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.rol in {RolUsuario.ADMINISTRADOR, RolUsuario.DOCENTE}


class CompetenciaViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Competencia.objects.all().order_by("codigo")
    serializer_class = serializers.CompetenciaSerializer
    filterset_fields = ["activa"]
    search_fields = ["codigo", "nombre", "descripcion"]


class TematicaViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Tematica.objects.all().order_by("nombre")
    serializer_class = serializers.TematicaSerializer
    filterset_fields = ["activa"]
    search_fields = ["nombre", "descripcion"]


class EtiquetaViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Etiqueta.objects.all().order_by("nombre")
    serializer_class = serializers.EtiquetaSerializer
    search_fields = ["nombre", "descripcion"]


class CasoViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Caso.objects.select_related("creado_por", "publicado_por").prefetch_related(
        "tematicas", "etiquetas", "competencias", "escenas"
    ).order_by("codigo")
    serializer_class = serializers.CasoSerializer
    filterset_fields = ["estado", "nivel", "tematicas", "etiquetas", "competencias"]
    search_fields = ["codigo", "titulo", "descripcion", "contexto"]
    ordering_fields = ["fecha_creacion", "fecha_publicacion", "titulo"]

    @action(detail=True, methods=["get"])
    def estructura(self, request, pk=None):
        caso = self.get_object()
        return Response(
            {
                "caso": serializers.CasoSerializer(caso).data,
                "actores": serializers.ActorCasoSerializer(caso.actores.all(), many=True).data,
                "escenas": serializers.EscenaSerializer(caso.escenas.all(), many=True).data,
            }
        )


class ActorCasoViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.ActorCaso.objects.select_related("caso").order_by("caso__codigo", "nombre")
    serializer_class = serializers.ActorCasoSerializer
    filterset_fields = ["caso", "es_sensible"]
    search_fields = ["nombre", "rol_en_caso", "descripcion"]


class EscenaViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Escena.objects.select_related("caso").all()
    serializer_class = serializers.EscenaSerializer
    filterset_fields = ["caso", "tipo", "es_inicial", "es_final", "activa"]
    search_fields = ["codigo", "titulo", "contenido"]


class DecisionViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Decision.objects.select_related("escena_origen", "escena_destino").all()
    serializer_class = serializers.DecisionSerializer
    filterset_fields = ["escena_origen", "escena_destino", "tipo", "activa"]
    search_fields = ["texto_decision", "consecuencia"]


class AsignacionCasoViewSet(viewsets.ModelViewSet):
    queryset = models.AsignacionCaso.objects.select_related("caso", "grupo", "estudiante", "asignado_por").order_by("-creado_en")
    serializer_class = serializers.AsignacionCasoSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["caso", "grupo", "estudiante", "asignado_por", "activo"]


class HerramientaProfesionalViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.HerramientaProfesional.objects.all().order_by("nombre")
    serializer_class = serializers.HerramientaProfesionalSerializer
    filterset_fields = ["activa"]
    search_fields = ["codigo", "nombre", "descripcion"]


class HerramientaPorCasoViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.HerramientaPorCaso.objects.select_related("caso", "herramienta", "escena").order_by("caso__codigo", "herramienta__nombre")
    serializer_class = serializers.HerramientaPorCasoSerializer
    filterset_fields = ["caso", "herramienta", "escena", "obligatoria"]


class RecursoViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.Recurso.objects.all().order_by("titulo")
    serializer_class = serializers.RecursoSerializer
    filterset_fields = ["tipo", "activo"]
    search_fields = ["titulo", "resumen", "contenido", "referencia_bibliografica"]


class RecursoCasoViewSet(DocenteAdministradorWriteMixin, viewsets.ModelViewSet):
    queryset = models.RecursoCaso.objects.select_related("recurso", "caso", "escena", "competencia").order_by("caso__codigo", "recurso__titulo")
    serializer_class = serializers.RecursoCasoSerializer
    filterset_fields = ["recurso", "caso", "escena", "competencia"]


class IntentoViewSet(viewsets.ModelViewSet):
    queryset = models.Intento.objects.select_related("estudiante", "caso", "escena_actual").order_by("-iniciado_en")
    serializer_class = serializers.IntentoSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["estudiante", "caso", "estado", "asignacion"]
    ordering_fields = ["iniciado_en", "finalizado_en", "puntaje_total", "duracion_segundos"]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated, IsDocenteAdministrador])
    def analiticas(self, request):
        data = (
            self.get_queryset()
            .values("caso__titulo", "estado")
            .annotate(total=Count("id"), promedio=Avg("puntaje_total"), duracion=Avg("duracion_segundos"))
            .order_by("caso__titulo")
        )
        return Response(list(data))


class ProgresoEscenaViewSet(viewsets.ModelViewSet):
    queryset = models.ProgresoEscena.objects.select_related("intento", "escena").order_by("fecha_entrada")
    serializer_class = serializers.ProgresoEscenaSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["intento", "escena", "completada"]


class RespuestaDecisionViewSet(viewsets.ModelViewSet):
    queryset = models.RespuestaDecision.objects.select_related("intento", "escena", "decision").order_by("respondida_en")
    serializer_class = serializers.RespuestaDecisionSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["intento", "escena", "decision", "confirmada"]


class UsoHerramientaIntentoViewSet(viewsets.ModelViewSet):
    queryset = models.UsoHerramientaIntento.objects.select_related("intento", "herramienta", "escena").order_by("usada_en")
    serializer_class = serializers.UsoHerramientaIntentoSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["intento", "herramienta", "escena"]


class BitacoraReflexivaViewSet(viewsets.ModelViewSet):
    queryset = models.BitacoraReflexiva.objects.select_related("intento", "estudiante", "escena").order_by("-creada_en")
    serializer_class = serializers.BitacoraReflexivaSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["intento", "estudiante", "escena"]
    search_fields = ["reflexion", "aprendizaje_clave", "consideraciones_eticas", "autocuidado"]


class RubricaViewSet(viewsets.ModelViewSet):
    queryset = models.Rubrica.objects.select_related("caso", "creada_por").order_by("caso__codigo", "nombre")
    serializer_class = serializers.RubricaSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["caso", "activa", "creada_por"]
    search_fields = ["nombre", "descripcion"]


class CriterioRubricaViewSet(viewsets.ModelViewSet):
    queryset = models.CriterioRubrica.objects.select_related("rubrica", "competencia").order_by("rubrica__nombre", "orden")
    serializer_class = serializers.CriterioRubricaSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["rubrica", "competencia"]


class EvaluacionIntentoViewSet(viewsets.ModelViewSet):
    queryset = models.EvaluacionIntento.objects.select_related("intento", "rubrica", "docente").order_by("-evaluada_en")
    serializer_class = serializers.EvaluacionIntentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["intento", "rubrica", "docente"]


class EvaluacionCriterioViewSet(viewsets.ModelViewSet):
    queryset = models.EvaluacionCriterio.objects.select_related("evaluacion", "criterio").order_by("evaluacion_id", "criterio__orden")
    serializer_class = serializers.EvaluacionCriterioSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["evaluacion", "criterio"]


class ComentarioDocenteViewSet(viewsets.ModelViewSet):
    queryset = models.ComentarioDocente.objects.select_related("intento", "docente", "escena").order_by("-creado_en")
    serializer_class = serializers.ComentarioDocenteSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["intento", "docente", "escena", "visible_estudiante"]


class RetroalimentacionViewSet(viewsets.ModelViewSet):
    queryset = models.Retroalimentacion.objects.select_related("intento").order_by("-generada_en")
    serializer_class = serializers.RetroalimentacionSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["intento"]


class ComparacionIntentoViewSet(viewsets.ModelViewSet):
    queryset = models.ComparacionIntento.objects.select_related("estudiante", "caso", "intento_a", "intento_b").order_by("-creada_en")
    serializer_class = serializers.ComparacionIntentoSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["estudiante", "caso", "intento_a", "intento_b"]


class IndicadorDesempenoViewSet(viewsets.ModelViewSet):
    queryset = models.IndicadorDesempeno.objects.select_related("intento", "competencia").order_by("-calculado_en")
    serializer_class = serializers.IndicadorDesempenoSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["intento", "competencia", "nombre_indicador"]


class AlertaDesempenoViewSet(viewsets.ModelViewSet):
    queryset = models.AlertaDesempeno.objects.select_related("estudiante", "docente", "intento", "competencia").order_by("-creada_en")
    serializer_class = serializers.AlertaDesempenoSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["estudiante", "docente", "intento", "competencia", "tipo", "estado"]


class ReporteDesempenoViewSet(viewsets.ModelViewSet):
    queryset = models.ReporteDesempeno.objects.select_related("intento", "estudiante", "generado_por").order_by("-generado_en")
    serializer_class = serializers.ReporteDesempenoSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["intento", "estudiante", "generado_por", "incluye_datos_sensibles"]


class InteraccionIAViewSet(viewsets.ModelViewSet):
    queryset = models.InteraccionIA.objects.select_related("usuario", "intento", "caso", "escena").order_by("-creada_en")
    serializer_class = serializers.InteraccionIASerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ["usuario", "intento", "caso", "escena", "dentro_alcance", "bloqueo_por_respuesta_correcta"]


class AuditoriaEventoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.AuditoriaEvento.objects.select_related("usuario").order_by("-creado_en")
    serializer_class = serializers.AuditoriaEventoSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteAdministrador]
    filterset_fields = ["usuario", "tipo_evento", "entidad", "entidad_id"]
    ordering_fields = ["creado_en"]
