from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.administrativo.models import EstadoUsuario, EstudianteGrupo, GrupoAcademico, RolUsuario
from apps.simulador import models


CASE_CODE = "CASO-PS-001"

CASE_CONTEXT = (
    "Son las 11 de la noche en un barrio con alta vulnerabilidad social. Un hombre de aproximadamente 28 años "
    "entra al domicilio donde vive con su pareja de 22 años y la hija de ella, de 3 años. Horas antes había ejercido "
    "maltrato psicológico, chantaje emocional y acusaciones de infidelidad. Al llegar, la mujer le reclama su ausencia; "
    "él saca una navaja, causa la muerte inmediata de la niña y luego hiere gravemente a la mujer con múltiples lesiones cortopunzantes."
)

SCENES = [
    (
        "H01",
        "Hospital: intervención inmediata",
        "La sobreviviente está en shock hipovolémico y emocional. La familia llega alterada y exige ver a la niña fallecida.",
        "¿En qué centrar la intervención inmediata?",
        [
            ("Notificar a la madre y la familia sobre la muerte de la niña de inmediato.", "Informar sin preparación puede aumentar la crisis. Debe hacerse con contención y protocolo.", models.TipoDecision.RIESGOSA, "12.00"),
            ("Contención emocional, acompañamiento en duelo inicial y estabilización de crisis mediante Primeros Auxilios Psicológicos.", "Respuesta adecuada: prioriza estabilización, contención y preparación para comunicar información crítica.", models.TipoDecision.ADECUADA, "28.00"),
            ("Interrogar a la víctima herida para obtener detalles del agresor antes de que entre a cirugía.", "Inadecuado: revictimiza y desplaza la prioridad médica y psicológica inmediata.", models.TipoDecision.INADECUADA, "8.00"),
        ],
    ),
    (
        "H02",
        "Hospital: marco normativo",
        "El caso exige protocolos de atención integral y normas de protección frente a violencia basada en género.",
        "¿Qué marco normativo y técnico debe seguir?",
        [
            ("Resolución 459 de 2012.", "Pertinente, pero incompleta frente al marco de protección de mujeres víctimas de violencia.", models.TipoDecision.RIESGOSA, "14.00"),
            ("Resolución 459 de 2012 y Ley 1257 de 2008.", "Respuesta adecuada: integra atención en salud y protección frente a violencia contra las mujeres.", models.TipoDecision.ADECUADA, "28.00"),
            ("Resolución 459 de 2012 y Ley 1448 de 2011.", "No es el eje normativo principal de este escenario hospitalario.", models.TipoDecision.RIESGOSA, "10.00"),
        ],
    ),
    (
        "H03",
        "Hospital: actuación técnica y ética",
        "La intervención debe proteger a la sobreviviente, contener a la familia y preparar la comunicación del fallecimiento de la niña.",
        "¿Qué se debe hacer y qué se debe evitar?",
        [
            ("Escucha activa sin juicios, intervenir disonancia cognitiva, preguntar antecedentes de la relación y activar psicología clínica y psiquiatría.", "Tiene elementos útiles, pero omite duelo traumático familiar y comunicación protocolizada del fallecimiento.", models.TipoDecision.RIESGOSA, "12.00"),
            ("Primeros Auxilios Psicológicos para la familia, escucha activa a la víctima cuando esté consciente y protocolo EPICEE para informar el fallecimiento.", "Pertinente, aunque queda corta frente a la valoración psicosocial e intervención interdisciplinar.", models.TipoDecision.RIESGOSA, "20.00"),
            ("PAP, escucha activa, protocolo EPICEE, preguntas sobre antecedentes para determinar ciclo de violencia y manejo interdisciplinar.", "Buena ruta, pero los antecedentes deben explorarse sin desplazar el duelo y la seguridad familiar.", models.TipoDecision.RIESGOSA, "22.00"),
            ("PAP para la familia, escucha activa sin juicios a la víctima cuando esté consciente, protocolo EPICEE, evaluación psicosocial de factores protectores y de riesgo, y manejo interdisciplinar.", "Respuesta más completa: integra crisis, duelo, seguridad, no revictimización y decisiones interdisciplinarias.", models.TipoDecision.ADECUADA, "32.00"),
        ],
    ),
    (
        "C01",
        "Comisaría: prioridad psicosocial",
        "Han pasado 15 días. La mujer fue dada de alta, presenta secuelas físicas y trauma complejo. Se debe definir medida de protección y apoyo psicológico a largo plazo.",
        "¿Cuál es la prioridad en la asesoría psicosocial?",
        [
            ("Instar a la mujer para que escuche al agresor en pro de la unión familiar y el perdón.", "Inadecuado: la mediación puede aumentar el riesgo y responsabilizar a la víctima.", models.TipoDecision.INADECUADA, "4.00"),
            ("Valoración del riesgo de feminicidio, activación de medidas de protección y asesoría sobre derechos económicos y de justicia.", "Respuesta adecuada: prioriza seguridad, protección, derechos y continuidad de atención.", models.TipoDecision.ADECUADA, "30.00"),
            ("Realizar psicoterapia para encontrar patrones de infancia que desencadenan su elección de pareja.", "Inadecuado: desplaza la responsabilidad hacia la víctima y no activa protección.", models.TipoDecision.INADECUADA, "6.00"),
        ],
    ),
    (
        "C02",
        "Comisaría: marco normativo",
        "La Comisaría debe orientar medidas de protección, restablecimiento de derechos y respuesta frente a violencia contra la mujer.",
        "¿Qué marco normativo y técnico debe seguir?",
        [
            ("Ley 2126 de 2021, Ley 1098 de 2006 y Ley 1257 de 2008.", "Respuesta adecuada: integra funciones de Comisarías, niñez y violencia contra las mujeres.", models.TipoDecision.ADECUADA, "30.00"),
            ("Ley 1098 de 2006 y Ley 1257 de 2008.", "Pertinente, pero incompleta porque omite Ley 2126 de 2021 sobre Comisarías de Familia.", models.TipoDecision.RIESGOSA, "18.00"),
            ("Ley 1098 de 2006, Ley 1257 de 2008 y Ley 1148 de 2011.", "No es la combinación normativa más precisa para este escenario.", models.TipoDecision.RIESGOSA, "8.00"),
        ],
    ),
    (
        "C03",
        "Comisaría: actuación técnica y ética",
        "La asesoría debe valorar estado emocional, dependientes, personas vulnerables, riesgo de vulneración de derechos y rutas de atención.",
        "¿Qué se debe hacer y qué se debe evitar?",
        [
            ("Escucha activa sin juicios, intervenir disonancia cognitiva, explorar antecedentes, valorar riesgo de feminicidio y activar psicología clínica y psiquiatría.", "Contiene elementos útiles, pero reduce la ruta a salud mental y no desarrolla suficientemente restablecimiento de derechos.", models.TipoDecision.RIESGOSA, "20.00"),
            ("Realizar valoración psicológica y emocional de la víctima y personas dependientes, escucha activa, explorar antecedentes y activar salud y salud mental si es necesario.", "Pertinente, pero falta establecer riesgo de vulneración de derechos y riesgo de feminicidio.", models.TipoDecision.RIESGOSA, "22.00"),
            ("Valorar psicológica y emocionalmente a la víctima y dependientes, establecer riesgo de vulneración de derechos, aplicar valoración de riesgo de feminicidio y activar rutas de salud y salud mental.", "Respuesta más completa: integra valoración psicosocial, derechos, riesgo de feminicidio y rutas de atención sin revictimizar.", models.TipoDecision.ADECUADA, "32.00"),
        ],
    ),
]


class Command(BaseCommand):
    help = "Crea datos demo para el caso único de violencia familiar y tentativa de feminicidio."

    def handle(self, *args, **options):
        User = get_user_model()
        admin = self.ensure_user(
            correo="ficho@cue.edu.co",
            password="admin123",
            nombres="Ficho",
            apellidos="Administrador",
            rol=RolUsuario.ADMINISTRADOR,
            is_staff=True,
            is_superuser=True,
        )
        docente = self.ensure_user(
            correo="docente.psicosocial@cue.edu.co",
            password="docente123",
            nombres="Laura",
            apellidos="Montoya",
            rol=RolUsuario.DOCENTE,
            is_staff=True,
            creado_por=admin,
        )
        estudiante = self.ensure_user(
            correo="estudiante.demo@cue.edu.co",
            password="estudiante123",
            nombres="Valentina",
            apellidos="Ríos",
            rol=RolUsuario.ESTUDIANTE,
            documento_identidad="1000123456",
            telefono="3105550101",
            creado_por=docente,
        )

        grupo, _ = GrupoAcademico.objects.update_or_create(
            nombre="Psicología social - Grupo A",
            periodo_academico="2026-1",
            defaults={"descripcion": "Grupo demo para simulación psicosocial.", "docente": docente, "activo": True},
        )
        EstudianteGrupo.objects.get_or_create(estudiante=estudiante, grupo=grupo, defaults={"activo": True})

        competencies = self.create_competencies()
        tematica, _ = models.Tematica.objects.update_or_create(
            nombre="Violencia basada en género",
            defaults={"descripcion": "Atención psicosocial, protección y rutas normativas.", "activa": True},
        )
        etiqueta, _ = models.Etiqueta.objects.update_or_create(
            nombre="Tentativa de feminicidio",
            defaults={"descripcion": "Caso sensible con urgencia vital y restablecimiento de derechos."},
        )

        models.Caso.objects.exclude(codigo=CASE_CODE).update(estado=models.EstadoCaso.ARCHIVADO)
        caso, _ = models.Caso.objects.update_or_create(
            codigo=CASE_CODE,
            defaults={
                "titulo": "Violencia familiar y tentativa de feminicidio",
                "descripcion": "Caso único para entrenar intervención psicosocial en hospital y Comisaría de Familia.",
                "contexto": CASE_CONTEXT,
                "objetivos_aprendizaje": "Priorizar PAP; reconocer marco normativo; valorar riesgo de feminicidio; evitar revictimización; activar rutas de protección.",
                "advertencia_contenido": "Violencia familiar, tentativa de feminicidio, muerte de una niña, duelo traumático y lesiones graves.",
                "nivel": models.NivelDificultad.AVANZADO,
                "estado": models.EstadoCaso.PUBLICADO,
                "max_intentos": 3,
                "creado_por": docente,
                "publicado_por": admin,
                "fecha_publicacion": timezone.now(),
            },
        )
        models.CasoTematica.objects.get_or_create(caso=caso, tematica=tematica)
        models.CasoEtiqueta.objects.get_or_create(caso=caso, etiqueta=etiqueta)
        for competency in competencies:
            models.CasoCompetencia.objects.update_or_create(caso=caso, competencia=competency, defaults={"peso": Decimal("1.00")})

        self.create_actors(caso)
        scenes = self.create_scenes_and_decisions(caso, competencies)
        self.create_tools_and_resources(caso, scenes, docente)

        asignacion, _ = models.AsignacionCaso.objects.update_or_create(
            caso=caso,
            grupo=grupo,
            estudiante=None,
            defaults={"asignado_por": docente, "fecha_inicio": timezone.now(), "activo": True},
        )
        intento, _ = models.Intento.objects.update_or_create(
            estudiante=estudiante,
            caso=caso,
            numero_intento=1,
            defaults={
                "asignacion": asignacion,
                "estado": models.EstadoIntento.FINALIZADO,
                "escena_actual": scenes["C03"],
                "puntaje_total": Decimal("88.00"),
                "finalizado_en": timezone.now(),
                "duracion_segundos": 1800,
            },
        )
        models.Retroalimentacion.objects.update_or_create(
            intento=intento,
            defaults={
                "resumen": "Ruta adecuada con énfasis en contención, marco normativo y protección de derechos.",
                "aciertos": "Priorizó PAP, comunicación cuidadosa, valoración de riesgo y rutas de protección.",
                "errores": "Debe reforzar el momento clínico para explorar antecedentes sin desplazar la urgencia.",
                "recomendaciones": "Profundizar en EPICEE, Ley 2126 de 2021 y valoración estructurada del riesgo de feminicidio.",
                "indicadores_json": {"pap": 88, "normativa": 84, "riesgo": 91, "etica": 94},
            },
        )

        self.stdout.write(self.style.SUCCESS("Datos demo del caso único creados/actualizados correctamente."))
        self.stdout.write("Estudiante demo: estudiante.demo@cue.edu.co / estudiante123")
        self.stdout.write("Docente demo: docente.psicosocial@cue.edu.co / docente123")

    def ensure_user(self, correo, password, **defaults):
        User = get_user_model()
        user, _ = User.objects.update_or_create(
            correo=correo,
            defaults={**defaults, "estado": EstadoUsuario.ACTIVO, "is_active": True},
        )
        user.set_password(password)
        user.save()
        return user

    def create_competencies(self):
        data = [
            ("PAP", "Primeros Auxilios Psicológicos", "Estabiliza crisis y acompaña duelo inicial."),
            ("NORM", "Marco normativo", "Reconoce normas y rutas institucionales."),
            ("RIESGO", "Valoración del riesgo", "Identifica riesgo de feminicidio y vulneración de derechos."),
            ("ETICA", "Ética y no revictimización", "Evita daño adicional, culpabilización y exposición innecesaria."),
        ]
        result = []
        for codigo, nombre, descripcion in data:
            comp, _ = models.Competencia.objects.update_or_create(
                codigo=f"VF-{codigo}", defaults={"nombre": nombre, "descripcion": descripcion, "activa": True}
            )
            result.append(comp)
        return result

    def create_actors(self, caso):
        actors = [
            ("Sobreviviente", "Mujer de 22 años", "Víctima directa con lesiones graves y trauma complejo.", True),
            ("Niña fallecida", "Hija de 3 años", "Víctima fatal del ataque.", True),
            ("Familia materna", "Madre y hermanos", "Llegan al hospital en crisis y requieren contención.", False),
            ("Agresor", "Pareja actual", "Hombre de 28 años señalado como agresor.", True),
        ]
        for nombre, rol, descripcion, sensible in actors:
            models.ActorCaso.objects.update_or_create(
                caso=caso,
                nombre=nombre,
                defaults={"rol_en_caso": rol, "descripcion": descripcion, "es_sensible": sensible},
            )

    def create_scenes_and_decisions(self, caso, competencies):
        valid_codes = [item[0] for item in SCENES]
        models.Escena.objects.filter(caso=caso).exclude(codigo__in=valid_codes).update(activa=False, es_inicial=False, es_final=False)
        scenes = {}
        for index, (code, title, content, question, _options) in enumerate(SCENES, start=1):
            scene, _ = models.Escena.objects.update_or_create(
                caso=caso,
                codigo=code,
                defaults={
                    "titulo": title,
                    "contenido": f"{content}\n\n{question}",
                    "tipo": models.TipoEscena.DECISION,
                    "orden": index,
                    "es_inicial": index == 1,
                    "es_final": index == len(SCENES),
                    "activa": True,
                },
            )
            scenes[code] = scene

        for index, (code, _title, _content, _question, options) in enumerate(SCENES):
            origin = scenes[code]
            destination = scenes[SCENES[index + 1][0]] if index + 1 < len(SCENES) else None
            models.Decision.objects.filter(escena_origen=origin).update(activa=False)
            for order, (text, consequence, kind, score) in enumerate(options, start=1):
                decision, _ = models.Decision.objects.update_or_create(
                    escena_origen=origin,
                    texto_decision=text,
                    defaults={
                        "escena_destino": destination,
                        "consecuencia": consequence,
                        "tipo": kind,
                        "puntaje": Decimal(score),
                        "requiere_justificacion": True,
                        "activa": True,
                        "orden": order,
                    },
                )
                if kind == models.TipoDecision.ADECUADA:
                    for comp in competencies:
                        models.DecisionCompetencia.objects.update_or_create(
                            decision=decision, competencia=comp, defaults={"impacto": Decimal("8.00")}
                        )
        return scenes

    def create_tools_and_resources(self, caso, scenes, docente):
        tools = [
            ("HP-PAP", "Guía de Primeros Auxilios Psicológicos", "Organiza seguridad, calma, conexión, información y derivación."),
            ("HP-RF", "Valoración de riesgo de feminicidio", "Lista factores de riesgo, protección y acciones inmediatas."),
            ("HP-EPICEE", "Protocolo EPICEE/SPIKES", "Apoya la comunicación ética de noticias altamente dolorosas."),
        ]
        for code, name, description in tools:
            tool, _ = models.HerramientaProfesional.objects.update_or_create(
                codigo=code,
                defaults={
                    "nombre": name,
                    "descripcion": description,
                    "instrucciones": "Use esta herramienta para orientar su respuesta técnica sin entregar respuestas automáticas.",
                    "plantilla_json": {"campos": ["riesgos", "factores_protectores", "acciones"]},
                    "activa": True,
                    "creada_por": docente,
                },
            )
            models.HerramientaPorCaso.objects.update_or_create(
                caso=caso,
                herramienta=tool,
                escena=scenes["H01"],
                defaults={"obligatoria": False, "condicion_uso": "Disponible durante todo el caso.", "parametros_json": {}},
            )

        resources = [
            ("Resolución 459 de 2012", models.TipoRecurso.GUIA, "Protocolo de atención integral en salud para violencias sexuales y basadas en género."),
            ("Ley 1257 de 2008", models.TipoRecurso.LECTURA, "Norma para prevención, sanción y protección frente a violencia contra las mujeres."),
            ("Ley 2126 de 2021", models.TipoRecurso.LECTURA, "Fortalece y regula funciones de las Comisarías de Familia."),
            ("Ley 1098 de 2006", models.TipoRecurso.LECTURA, "Código de Infancia y Adolescencia para restablecimiento de derechos."),
        ]
        for title, resource_type, summary in resources:
            resource, _ = models.Recurso.objects.update_or_create(
                titulo=title,
                defaults={
                    "tipo": resource_type,
                    "resumen": summary,
                    "contenido": summary,
                    "url_externa": "https://www.uavh.edu.co/",
                    "referencia_bibliografica": "Material de apoyo académico para simulación psicosocial.",
                    "creado_por": docente,
                    "activo": True,
                },
            )
            models.RecursoCaso.objects.update_or_create(
                recurso=resource,
                caso=caso,
                defaults={"escena": scenes["H01"], "competencia": None, "visible_antes": True, "visible_durante": True, "visible_despues": True},
            )
