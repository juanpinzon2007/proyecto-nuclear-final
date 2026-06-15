from django.conf import settings
from django.db import models

from apps.administrativo.models import GrupoAcademico
from apps.core.models import UUIDModel


class NivelDificultad(models.TextChoices):
    BASICO = "BASICO", "Básico"
    INTERMEDIO = "INTERMEDIO", "Intermedio"
    AVANZADO = "AVANZADO", "Avanzado"


class EstadoCaso(models.TextChoices):
    BORRADOR = "BORRADOR", "Borrador"
    PUBLICADO = "PUBLICADO", "Publicado"
    ARCHIVADO = "ARCHIVADO", "Archivado"


class EstadoIntento(models.TextChoices):
    EN_PROGRESO = "EN_PROGRESO", "En progreso"
    FINALIZADO = "FINALIZADO", "Finalizado"
    PENDIENTE_CIERRE = "PENDIENTE_CIERRE", "Pendiente de cierre"
    CANCELADO = "CANCELADO", "Cancelado"


class TipoEscena(models.TextChoices):
    INTRODUCCION = "INTRODUCCION", "Introducción"
    DESARROLLO = "DESARROLLO", "Desarrollo"
    DECISION = "DECISION", "Decisión"
    USO_HERRAMIENTA = "USO_HERRAMIENTA", "Uso de herramienta"
    RETROALIMENTACION = "RETROALIMENTACION", "Retroalimentación"
    FINAL = "FINAL", "Final"


class TipoDecision(models.TextChoices):
    ADECUADA = "ADECUADA", "Adecuada"
    RIESGOSA = "RIESGOSA", "Riesgosa"
    INADECUADA = "INADECUADA", "Inadecuada"
    NEUTRA = "NEUTRA", "Neutra"


class TipoRecurso(models.TextChoices):
    TEORIA = "TEORIA", "Teoría"
    GUIA = "GUIA", "Guía"
    LECTURA = "LECTURA", "Lectura"
    VIDEO = "VIDEO", "Video"
    INSTRUMENTO = "INSTRUMENTO", "Instrumento"
    OTRO = "OTRO", "Otro"


class TipoAlerta(models.TextChoices):
    BAJO_DESEMPENO = "BAJO_DESEMPENO", "Bajo desempeño"
    EVENTO_CRITICO = "EVENTO_CRITICO", "Evento crítico"
    RIESGO_ALTO = "RIESGO_ALTO", "Riesgo alto"
    INACTIVIDAD = "INACTIVIDAD", "Inactividad"


class EstadoAlerta(models.TextChoices):
    ABIERTA = "ABIERTA", "Abierta"
    REVISADA = "REVISADA", "Revisada"
    CERRADA = "CERRADA", "Cerrada"


class TipoEventoAuditoria(models.TextChoices):
    INICIO_SESION = "INICIO_SESION", "Inicio de sesión"
    CIERRE_SESION = "CIERRE_SESION", "Cierre de sesión"
    CREACION = "CREACION", "Creación"
    ACTUALIZACION = "ACTUALIZACION", "Actualización"
    ELIMINACION_LOGICA = "ELIMINACION_LOGICA", "Eliminación lógica"
    CAMBIO_ESTADO = "CAMBIO_ESTADO", "Cambio de estado"
    EXPORTACION = "EXPORTACION", "Exportación"
    CONSULTA_IA = "CONSULTA_IA", "Consulta IA"
    ACCESO_DENEGADO = "ACCESO_DENEGADO", "Acceso denegado"


class Competencia(UUIDModel):
    codigo = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=160)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "competencias"

    def __str__(self):
        return self.nombre


class Tematica(UUIDModel):
    nombre = models.CharField(max_length=160, unique=True)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "tematicas"

    def __str__(self):
        return self.nombre


class Etiqueta(UUIDModel):
    nombre = models.CharField(max_length=120, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table = "etiquetas"

    def __str__(self):
        return self.nombre


class Caso(UUIDModel):
    codigo = models.CharField(max_length=50, unique=True)
    titulo = models.CharField(max_length=220)
    descripcion = models.TextField()
    contexto = models.TextField(blank=True)
    objetivos_aprendizaje = models.TextField(blank=True)
    advertencia_contenido = models.TextField(blank=True)
    nivel = models.CharField(max_length=20, choices=NivelDificultad.choices, default=NivelDificultad.BASICO)
    estado = models.CharField(max_length=20, choices=EstadoCaso.choices, default=EstadoCaso.BORRADOR)
    max_intentos = models.PositiveIntegerField(default=2)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="casos_creados")
    publicado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="casos_publicados"
    )
    tematicas = models.ManyToManyField(Tematica, through="CasoTematica", blank=True)
    etiquetas = models.ManyToManyField(Etiqueta, through="CasoEtiqueta", blank=True)
    competencias = models.ManyToManyField(Competencia, through="CasoCompetencia", blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_publicacion = models.DateTimeField(null=True, blank=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "casos"
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["nivel"]),
            models.Index(fields=["creado_por"]),
        ]

    def __str__(self):
        return self.titulo


class CasoTematica(models.Model):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE)
    tematica = models.ForeignKey(Tematica, on_delete=models.PROTECT)

    class Meta:
        db_table = "casos_tematicas"
        unique_together = ("caso", "tematica")

    def __str__(self):
        return f"{self.caso.codigo} - {self.tematica.nombre}"


class CasoEtiqueta(models.Model):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE)
    etiqueta = models.ForeignKey(Etiqueta, on_delete=models.PROTECT)

    class Meta:
        db_table = "casos_etiquetas"
        unique_together = ("caso", "etiqueta")

    def __str__(self):
        return f"{self.caso.codigo} - {self.etiqueta.nombre}"


class CasoCompetencia(models.Model):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE)
    competencia = models.ForeignKey(Competencia, on_delete=models.PROTECT)
    peso = models.DecimalField(max_digits=5, decimal_places=2, default=1)

    class Meta:
        db_table = "casos_competencias"
        unique_together = ("caso", "competencia")

    def __str__(self):
        return f"{self.caso.codigo} - {self.competencia.nombre} ({self.peso})"


class AsignacionCaso(UUIDModel):
    caso = models.ForeignKey(Caso, on_delete=models.PROTECT)
    grupo = models.ForeignKey(GrupoAcademico, null=True, blank=True, on_delete=models.CASCADE)
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    asignado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="asignaciones_hechas")
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "asignaciones_casos"
        indexes = [models.Index(fields=["caso"]), models.Index(fields=["grupo"]), models.Index(fields=["estudiante"])]

    def __str__(self):
        destino = self.grupo.nombre if self.grupo else str(self.estudiante)
        return f"{self.caso.codigo} asignado a {destino}"


class ActorCaso(UUIDModel):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE, related_name="actores")
    nombre = models.CharField(max_length=160)
    rol_en_caso = models.CharField(max_length=160, blank=True)
    descripcion = models.TextField(blank=True)
    es_sensible = models.BooleanField(default=False)

    class Meta:
        db_table = "actores_caso"
        indexes = [models.Index(fields=["caso"])]

    def __str__(self):
        return f"{self.nombre} - {self.caso.codigo}"


class Escena(UUIDModel):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE, related_name="escenas")
    codigo = models.CharField(max_length=50)
    titulo = models.CharField(max_length=220)
    contenido = models.TextField()
    tipo = models.CharField(max_length=30, choices=TipoEscena.choices)
    orden = models.PositiveIntegerField(default=1)
    es_inicial = models.BooleanField(default=False)
    es_final = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "escenas"
        unique_together = ("caso", "codigo")
        ordering = ("caso", "orden")
        indexes = [models.Index(fields=["caso"]), models.Index(fields=["tipo"])]

    def __str__(self):
        return f"{self.caso.codigo} - {self.codigo}: {self.titulo}"


class Decision(UUIDModel):
    escena_origen = models.ForeignKey(Escena, on_delete=models.CASCADE, related_name="decisiones")
    escena_destino = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    texto_decision = models.TextField()
    consecuencia = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, choices=TipoDecision.choices, default=TipoDecision.NEUTRA)
    puntaje = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    requiere_justificacion = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=1)
    competencias = models.ManyToManyField(Competencia, through="DecisionCompetencia", blank=True)

    class Meta:
        db_table = "decisiones"
        ordering = ("escena_origen", "orden")
        indexes = [models.Index(fields=["escena_origen"]), models.Index(fields=["escena_destino"])]

    def __str__(self):
        texto = self.texto_decision[:70]
        return f"{self.escena_origen.codigo} -> {texto}"


class DecisionCompetencia(models.Model):
    decision = models.ForeignKey(Decision, on_delete=models.CASCADE)
    competencia = models.ForeignKey(Competencia, on_delete=models.PROTECT)
    impacto = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    class Meta:
        db_table = "decisiones_competencias"
        unique_together = ("decision", "competencia")

    def __str__(self):
        return f"{self.competencia.nombre}: {self.impacto}"


class HerramientaProfesional(UUIDModel):
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=180)
    descripcion = models.TextField(blank=True)
    instrucciones = models.TextField(blank=True)
    plantilla_json = models.JSONField(default=dict, blank=True)
    activa = models.BooleanField(default=True)
    creada_por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "herramientas_profesionales"
        indexes = [models.Index(fields=["activa"])]

    def __str__(self):
        return self.nombre


class HerramientaPorCaso(UUIDModel):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE)
    herramienta = models.ForeignKey(HerramientaProfesional, on_delete=models.PROTECT)
    escena = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.CASCADE)
    obligatoria = models.BooleanField(default=False)
    condicion_uso = models.TextField(blank=True)
    parametros_json = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "herramientas_por_caso"
        unique_together = ("caso", "herramienta", "escena")

    def __str__(self):
        escena = f" en {self.escena.codigo}" if self.escena else ""
        return f"{self.herramienta.nombre} - {self.caso.codigo}{escena}"


class Recurso(UUIDModel):
    titulo = models.CharField(max_length=220)
    tipo = models.CharField(max_length=20, choices=TipoRecurso.choices)
    resumen = models.TextField(blank=True)
    contenido = models.TextField(blank=True)
    url_externa = models.URLField(blank=True)
    referencia_bibliografica = models.TextField(blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recursos"

    def __str__(self):
        return self.titulo


class RecursoCaso(models.Model):
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE)
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE)
    escena = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL)
    competencia = models.ForeignKey(Competencia, null=True, blank=True, on_delete=models.SET_NULL)
    visible_antes = models.BooleanField(default=True)
    visible_durante = models.BooleanField(default=True)
    visible_despues = models.BooleanField(default=True)

    class Meta:
        db_table = "recursos_casos"
        unique_together = ("recurso", "caso")

    def __str__(self):
        return f"{self.recurso.titulo} - {self.caso.codigo}"


class Intento(UUIDModel):
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="intentos")
    caso = models.ForeignKey(Caso, on_delete=models.PROTECT)
    asignacion = models.ForeignKey(AsignacionCaso, null=True, blank=True, on_delete=models.SET_NULL)
    numero_intento = models.PositiveIntegerField()
    estado = models.CharField(max_length=30, choices=EstadoIntento.choices, default=EstadoIntento.EN_PROGRESO)
    escena_actual = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL)
    puntaje_total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    iniciado_en = models.DateTimeField(auto_now_add=True)
    finalizado_en = models.DateTimeField(null=True, blank=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    duracion_segundos = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "intentos"
        unique_together = ("estudiante", "caso", "numero_intento")
        indexes = [models.Index(fields=["estudiante"]), models.Index(fields=["caso"]), models.Index(fields=["estado"])]

    def __str__(self):
        return f"{self.estudiante.nombres} {self.estudiante.apellidos} - {self.caso.codigo} intento {self.numero_intento}"


class ProgresoEscena(UUIDModel):
    intento = models.ForeignKey(Intento, on_delete=models.CASCADE, related_name="progreso")
    escena = models.ForeignKey(Escena, on_delete=models.PROTECT)
    fecha_entrada = models.DateTimeField(auto_now_add=True)
    fecha_salida = models.DateTimeField(null=True, blank=True)
    duracion_segundos = models.PositiveIntegerField(default=0)
    completada = models.BooleanField(default=False)

    class Meta:
        db_table = "progreso_escenas"

    def __str__(self):
        return f"{self.intento} - {self.escena.codigo} ({self.duracion_segundos}s)"


class RespuestaDecision(UUIDModel):
    intento = models.ForeignKey(Intento, on_delete=models.CASCADE, related_name="respuestas")
    escena = models.ForeignKey(Escena, on_delete=models.PROTECT)
    decision = models.ForeignKey(Decision, on_delete=models.PROTECT)
    justificacion = models.TextField(blank=True)
    puntaje_obtenido = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    confirmada = models.BooleanField(default=True)
    respondida_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "respuestas_decisiones"
        unique_together = ("intento", "escena", "decision")

    def __str__(self):
        return f"{self.intento} - respuesta en {self.escena.codigo}"


class UsoHerramientaIntento(UUIDModel):
    intento = models.ForeignKey(Intento, on_delete=models.CASCADE)
    herramienta = models.ForeignKey(HerramientaProfesional, on_delete=models.PROTECT)
    escena = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL)
    datos_entrada_json = models.JSONField(default=dict, blank=True)
    resultado_json = models.JSONField(default=dict, blank=True)
    observaciones = models.TextField(blank=True)
    usada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "uso_herramientas_intento"

    def __str__(self):
        return f"{self.herramienta.nombre} usada en {self.intento}"


class BitacoraReflexiva(UUIDModel):
    intento = models.ForeignKey(Intento, on_delete=models.CASCADE, related_name="bitacoras")
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    escena = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL)
    reflexion = models.TextField()
    aprendizaje_clave = models.TextField(blank=True)
    consideraciones_eticas = models.TextField(blank=True)
    autocuidado = models.TextField(blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bitacoras_reflexivas"

    def __str__(self):
        return f"Bitácora de {self.estudiante.nombres} - {self.intento.caso.codigo}"


class Rubrica(UUIDModel):
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=180)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    creada_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rubricas"

    def __str__(self):
        return f"{self.nombre} - {self.caso.codigo}"


class CriterioRubrica(UUIDModel):
    rubrica = models.ForeignKey(Rubrica, on_delete=models.CASCADE, related_name="criterios")
    competencia = models.ForeignKey(Competencia, null=True, blank=True, on_delete=models.SET_NULL)
    nombre = models.CharField(max_length=180)
    descripcion = models.TextField(blank=True)
    puntaje_maximo = models.DecimalField(max_digits=8, decimal_places=2)
    orden = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "criterios_rubrica"

    def __str__(self):
        return f"{self.rubrica.nombre} - {self.nombre}"


class EvaluacionIntento(UUIDModel):
    intento = models.OneToOneField(Intento, on_delete=models.CASCADE)
    rubrica = models.ForeignKey(Rubrica, null=True, blank=True, on_delete=models.SET_NULL)
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    puntaje_total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    observacion_general = models.TextField(blank=True)
    evaluada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "evaluaciones_intentos"

    def __str__(self):
        return f"Evaluación {self.intento} - {self.puntaje_total}"


class EvaluacionCriterio(UUIDModel):
    evaluacion = models.ForeignKey(EvaluacionIntento, on_delete=models.CASCADE, related_name="criterios")
    criterio = models.ForeignKey(CriterioRubrica, on_delete=models.PROTECT)
    puntaje_obtenido = models.DecimalField(max_digits=8, decimal_places=2)
    comentario = models.TextField(blank=True)

    class Meta:
        db_table = "evaluaciones_criterios"
        unique_together = ("evaluacion", "criterio")

    def __str__(self):
        return f"{self.criterio.nombre}: {self.puntaje_obtenido}"


class ComentarioDocente(UUIDModel):
    intento = models.ForeignKey(Intento, on_delete=models.CASCADE, related_name="comentarios_docente")
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    escena = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL)
    comentario = models.TextField()
    visible_estudiante = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comentarios_docente"

    def __str__(self):
        return f"Comentario de {self.docente.nombres} - {self.intento.caso.codigo}"


class Retroalimentacion(UUIDModel):
    intento = models.OneToOneField(Intento, on_delete=models.CASCADE)
    resumen = models.TextField()
    aciertos = models.TextField(blank=True)
    errores = models.TextField(blank=True)
    recomendaciones = models.TextField(blank=True)
    indicadores_json = models.JSONField(default=dict, blank=True)
    generada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "retroalimentaciones"

    def __str__(self):
        return f"Feedback - {self.intento}"


class ComparacionIntento(UUIDModel):
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    caso = models.ForeignKey(Caso, on_delete=models.PROTECT)
    intento_a = models.ForeignKey(Intento, on_delete=models.CASCADE, related_name="comparaciones_a")
    intento_b = models.ForeignKey(Intento, on_delete=models.CASCADE, related_name="comparaciones_b")
    diferencias_json = models.JSONField(default=dict, blank=True)
    recomendaciones = models.TextField(blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comparaciones_intentos"

    def __str__(self):
        return f"Comparativa {self.caso.codigo} - intentos {self.intento_a.numero_intento} y {self.intento_b.numero_intento}"


class IndicadorDesempeno(UUIDModel):
    intento = models.ForeignKey(Intento, on_delete=models.CASCADE)
    competencia = models.ForeignKey(Competencia, null=True, blank=True, on_delete=models.SET_NULL)
    nombre_indicador = models.CharField(max_length=180)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    unidad = models.CharField(max_length=40, blank=True)
    detalle_json = models.JSONField(default=dict, blank=True)
    calculado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "indicadores_desempeno"

    def __str__(self):
        return f"{self.nombre_indicador}: {self.valor}{self.unidad or ''}"


class AlertaDesempeno(UUIDModel):
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="alertas_estudiante")
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="alertas_docente"
    )
    intento = models.ForeignKey(Intento, null=True, blank=True, on_delete=models.CASCADE)
    competencia = models.ForeignKey(Competencia, null=True, blank=True, on_delete=models.SET_NULL)
    tipo = models.CharField(max_length=30, choices=TipoAlerta.choices)
    estado = models.CharField(max_length=20, choices=EstadoAlerta.choices, default=EstadoAlerta.ABIERTA)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    umbral_configurado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_observado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    revisada_en = models.DateTimeField(null=True, blank=True)
    cerrada_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "alertas_desempeno"

    def __str__(self):
        return f"{self.titulo} - {self.estudiante.nombres} {self.estudiante.apellidos}"


class ReporteDesempeno(UUIDModel):
    intento = models.ForeignKey(Intento, null=True, blank=True, on_delete=models.SET_NULL)
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    generado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reportes_generados")
    titulo = models.CharField(max_length=220)
    contenido_json = models.JSONField(default=dict, blank=True)
    ruta_archivo = models.TextField(blank=True)
    incluye_datos_sensibles = models.BooleanField(default=False)
    generado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reportes_desempeno"

    def __str__(self):
        return self.titulo


class InteraccionIA(UUIDModel):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    intento = models.ForeignKey(Intento, null=True, blank=True, on_delete=models.SET_NULL)
    caso = models.ForeignKey(Caso, null=True, blank=True, on_delete=models.SET_NULL)
    escena = models.ForeignKey(Escena, null=True, blank=True, on_delete=models.SET_NULL)
    pregunta = models.TextField()
    respuesta = models.TextField()
    dentro_alcance = models.BooleanField(default=True)
    bloqueo_por_respuesta_correcta = models.BooleanField(default=False)
    metadatos_json = models.JSONField(default=dict, blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "interacciones_ia"

    def __str__(self):
        return f"IA - {self.usuario.correo}: {self.pregunta[:60]}"


class AuditoriaEvento(UUIDModel):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    tipo_evento = models.CharField(max_length=40, choices=TipoEventoAuditoria.choices)
    entidad = models.CharField(max_length=120, blank=True)
    entidad_id = models.UUIDField(null=True, blank=True)
    descripcion = models.TextField(blank=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    datos_antes = models.JSONField(null=True, blank=True)
    datos_despues = models.JSONField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auditoria_eventos"
        indexes = [
            models.Index(fields=["usuario"]),
            models.Index(fields=["tipo_evento"]),
            models.Index(fields=["entidad", "entidad_id"]),
            models.Index(fields=["creado_en"]),
        ]

    def __str__(self):
        return f"{self.get_tipo_evento_display()} - {self.entidad or 'sistema'}"
