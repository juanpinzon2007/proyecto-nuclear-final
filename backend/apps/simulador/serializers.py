from rest_framework import serializers

from apps.simulador import models


class CompetenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Competencia
        fields = "__all__"


class TematicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tematica
        fields = "__all__"


class EtiquetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Etiqueta
        fields = "__all__"


class CasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Caso
        fields = "__all__"
        read_only_fields = ["fecha_creacion", "actualizado_en"]


class ActorCasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ActorCaso
        fields = "__all__"


class EscenaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Escena
        fields = "__all__"


class DecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Decision
        fields = "__all__"


class AsignacionCasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AsignacionCaso
        fields = "__all__"


class HerramientaProfesionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HerramientaProfesional
        fields = "__all__"


class HerramientaPorCasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.HerramientaPorCaso
        fields = "__all__"


class RecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Recurso
        fields = "__all__"


class RecursoCasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RecursoCaso
        fields = "__all__"


class IntentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Intento
        fields = "__all__"
        read_only_fields = ["iniciado_en", "actualizado_en"]


class ProgresoEscenaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ProgresoEscena
        fields = "__all__"


class RespuestaDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RespuestaDecision
        fields = "__all__"
        read_only_fields = ["respondida_en"]


class UsoHerramientaIntentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.UsoHerramientaIntento
        fields = "__all__"


class BitacoraReflexivaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BitacoraReflexiva
        fields = "__all__"
        read_only_fields = ["creada_en", "actualizada_en"]


class RubricaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Rubrica
        fields = "__all__"


class CriterioRubricaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CriterioRubrica
        fields = "__all__"


class EvaluacionIntentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.EvaluacionIntento
        fields = "__all__"


class EvaluacionCriterioSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.EvaluacionCriterio
        fields = "__all__"


class ComentarioDocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ComentarioDocente
        fields = "__all__"


class RetroalimentacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Retroalimentacion
        fields = "__all__"


class ComparacionIntentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ComparacionIntento
        fields = "__all__"


class IndicadorDesempenoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.IndicadorDesempeno
        fields = "__all__"


class AlertaDesempenoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AlertaDesempeno
        fields = "__all__"


class ReporteDesempenoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ReporteDesempeno
        fields = "__all__"


class InteraccionIASerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InteraccionIA
        fields = "__all__"


class AuditoriaEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AuditoriaEvento
        fields = "__all__"
