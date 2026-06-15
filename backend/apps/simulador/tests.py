from django.test import TestCase
from django.urls import reverse

from apps.administrativo.models import EstadoUsuario, RolUsuario, Usuario
from apps.simulador import models


class StudentAttemptTests(TestCase):
    def setUp(self):
        self.docente = Usuario.objects.create_user(
            correo="docente.intentos@cue.edu.co",
            password="docente123",
            nombres="Docente",
            apellidos="Intentos",
            rol=RolUsuario.DOCENTE,
            estado=EstadoUsuario.ACTIVO,
        )
        self.estudiante = Usuario.objects.create_user(
            correo="estudiante.intentos@cue.edu.co",
            password="estudiante123",
            nombres="Estudiante",
            apellidos="Intentos",
            rol=RolUsuario.ESTUDIANTE,
            estado=EstadoUsuario.ACTIVO,
        )
        self.caso = models.Caso.objects.create(
            codigo="CASO-INTENTOS",
            titulo="Caso sin limite",
            descripcion="Caso para validar reintentos ilimitados.",
            estado=models.EstadoCaso.PUBLICADO,
            max_intentos=2,
            creado_por=self.docente,
        )
        models.Escena.objects.create(
            caso=self.caso,
            codigo="ESC-1",
            titulo="Inicio",
            contenido="Escena inicial.",
            tipo=models.TipoEscena.INTRODUCCION,
            orden=1,
            es_inicial=True,
        )
        models.AsignacionCaso.objects.create(
            caso=self.caso,
            estudiante=self.estudiante,
            asignado_por=self.docente,
        )
        for numero in (1, 2):
            models.Intento.objects.create(
                estudiante=self.estudiante,
                caso=self.caso,
                numero_intento=numero,
                estado=models.EstadoIntento.FINALIZADO,
            )

    def test_student_can_start_attempt_after_configured_limit(self):
        self.client.force_login(self.estudiante)

        response = self.client.get(reverse("student_iniciar_simulacion", args=[self.caso.id]))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(models.Intento.objects.filter(estudiante=self.estudiante, caso=self.caso).count(), 3)
        nuevo_intento = models.Intento.objects.get(estudiante=self.estudiante, caso=self.caso, numero_intento=3)
        self.assertEqual(nuevo_intento.estado, models.EstadoIntento.EN_PROGRESO)
