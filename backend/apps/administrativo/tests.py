import json
from unittest.mock import patch

from django.test import override_settings
from rest_framework.test import APITestCase

from apps.administrativo.models import EstadoUsuario, RolUsuario, Usuario


class GregoryApiTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            correo="admin.test@cue.edu.co",
            password="admin123",
            nombres="Admin",
            apellidos="Prueba",
            rol=RolUsuario.ADMINISTRADOR,
            estado=EstadoUsuario.ACTIVO,
            is_staff=True,
        )
        self.docente = Usuario.objects.create_user(
            correo="docente.test@cue.edu.co",
            password="docente123",
            nombres="Docente",
            apellidos="Prueba",
            rol=RolUsuario.DOCENTE,
            estado=EstadoUsuario.ACTIVO,
            is_staff=True,
        )
        self.estudiante = Usuario.objects.create_user(
            correo="estudiante.test@cue.edu.co",
            password="estudiante123",
            nombres="Estudiante",
            apellidos="Prueba",
            rol=RolUsuario.ESTUDIANTE,
            estado=EstadoUsuario.ACTIVO,
        )

    def test_student_cannot_use_gregory(self):
        self.client.force_authenticate(self.estudiante)

        response = self.client.get("/api/administrativo/gregory/")

        self.assertEqual(response.status_code, 403)
        self.assertIn("docentes y administradores", response.data["detail"])

    @override_settings(OPENAI_API_KEY="")
    def test_teacher_can_preview_without_openai_key_but_not_execute(self):
        self.client.force_authenticate(self.docente)

        preview = self.client.post(
            "/api/administrativo/gregory/",
            {
                "message": "Crea un usuario estudiante llamado Laura Gómez con correo laura.gomez@cue.edu.co",
                "dry_run": True,
            },
            format="json",
        )
        execution = self.client.post(
            "/api/administrativo/gregory/",
            {
                "message": "Crea un usuario estudiante llamado Laura Gómez con correo laura.gomez@cue.edu.co",
                "dry_run": False,
            },
            format="json",
        )

        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview.data["model"], "pingüino-local")
        self.assertTrue(preview.data["dry_run"])
        self.assertEqual(preview.data["operations"][0]["action"], "create_user")
        self.assertEqual(execution.status_code, 200)
        self.assertTrue(execution.data["dry_run"])
        self.assertIn("OPENAI_API_KEY", execution.data["errors"][0]["error"])
        self.assertFalse(Usuario.objects.filter(correo="laura.gomez@cue.edu.co").exists())

    @override_settings(OPENAI_API_KEY="sk-test", OPENAI_MODEL="gpt-test")
    @patch("apps.administrativo.gregory._call_openai")
    def test_admin_executes_openai_generated_operation(self, mock_call_openai):
        self.client.force_authenticate(self.admin)
        mock_call_openai.return_value = (
            {
                "assistant_message": "Operación preparada con OpenAI.",
                "requires_confirmation": False,
                "confidence": 0.91,
                "operations": [
                    {
                        "action": "create_user",
                        "lookup_json": json.dumps({}),
                        "payload_json": json.dumps(
                            {
                                "correo": "camilo.rojas@cue.edu.co",
                                "nombres": "Camilo",
                                "apellidos": "Rojas",
                                "rol": "docente",
                                "password": "Cambiar123",
                                "estado": "activo",
                            }
                        ),
                        "reason": "Crear docente solicitado por administrador.",
                    }
                ],
            },
            "gpt-test",
        )

        response = self.client.post(
            "/api/administrativo/gregory/",
            {
                "message": "Crea un usuario docente llamado Camilo Rojas con correo camilo.rojas@cue.edu.co",
                "dry_run": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["model"], "gpt-test")
        self.assertFalse(response.data["dry_run"])
        self.assertEqual(response.data["errors"], [])
        self.assertTrue(Usuario.objects.filter(correo="camilo.rojas@cue.edu.co", rol=RolUsuario.DOCENTE).exists())
