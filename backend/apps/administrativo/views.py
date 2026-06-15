from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods
import json
from rest_framework import permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.administrativo.forms import LoginPasswordChangeForm
from apps.administrativo.gregory import ALLOWED_ACTIONS, process_gregory_request
from apps.administrativo.models import EstudianteGrupo, GrupoAcademico, RolUsuario
from apps.administrativo.serializers import (
    EstudianteGrupoSerializer,
    GrupoAcademicoSerializer,
    LoginSerializer,
    UsuarioSerializer,
)
from apps.simulador.models import AuditoriaEvento, InteraccionIA, TipoEventoAuditoria

Usuario = get_user_model()


def _resolve_post_login_redirect(request, user):
    next_url = (request.POST.get("next") or request.GET.get("next") or "").strip()
    if user.rol == RolUsuario.ESTUDIANTE:
        if next_url.startswith("/admin/"):
            messages.info(request, "Tu perfil estudiante fue redirigido al panel correspondiente.")
        return redirect("student_dashboard")
    if next_url:
        return redirect(next_url)
    return redirect("/admin/")


def global_login(request):
    if request.user.is_authenticated:
        return _resolve_post_login_redirect(request, request.user)

    form = AuthenticationForm(request, data=request.POST or None)
    next_url = request.GET.get("next") or request.POST.get("next") or ""
    if request.method == "POST" and form.is_valid():
        user = form.get_user()
        login(request, user)
        return _resolve_post_login_redirect(request, user)

    return render(
        request,
        "student/login.html",
        {
            "form": form,
            "next_url": next_url,
            "global_access": True,
            "role_pills": [
                {"label": "ESTUDIANTE", "description": "Casos, simulación y retroalimentación"},
            ],
        },
    )


def global_logout(request):
    if request.user.is_authenticated:
        logout(request)
        messages.success(request, "Sesión cerrada correctamente.")
    return redirect("global_login")


def login_password_change(request):
    form = LoginPasswordChangeForm(request, data=request.POST or None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Clave actualizada correctamente. Inicia sesión con tu nueva clave.")
        return redirect(settings.FRONTEND_STUDENT_LOGIN_URL)

    return render(request, "student/change_password.html", {"form": form})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def api_login_password_change(request):
    form = LoginPasswordChangeForm(request, data=request.data)
    if not form.is_valid():
        return Response({"detail": "No fue posible actualizar la contraseña.", "errors": form.errors}, status=400)
    if form.user.rol != RolUsuario.ESTUDIANTE:
        return Response({"detail": "Este cambio de contraseña está habilitado únicamente para estudiantes."}, status=403)
    form.save()
    return Response({"detail": "Contraseña actualizada correctamente."})


def role_home(request):
    if not request.user.is_authenticated:
        return redirect("global_login")
    return _resolve_post_login_redirect(request, request.user)


def _gregory_allowed(user):
    return bool(user and user.is_authenticated and user.rol in {RolUsuario.ADMINISTRADOR, RolUsuario.DOCENTE})


@require_http_methods(["GET", "POST"])
def gregory_admin(request):
    if not _gregory_allowed(request.user):
        if request.method == "POST":
            return JsonResponse({"detail": "Pingüino está disponible solo para docentes y administradores."}, status=403)
        messages.error(request, "Pingüino está disponible solo para docentes y administradores.")
        return redirect("global_login")

    if request.method == "GET":
        return render(
            request,
            "admin/gregory.html",
            {
                "title": "Pingüino",
                "subtitle": "Agente IA administrativo",
                "openai_model": getattr(settings, "OPENAI_MODEL", "gpt-5.2"),
                "openai_ready": bool(getattr(settings, "OPENAI_API_KEY", "")),
            },
        )

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Solicitud JSON inválida."}, status=400)

    message = (payload.get("message") or "").strip()
    dry_run = bool(payload.get("dry_run", True))
    if not message:
        return JsonResponse({"detail": "Escriba una instrucción para Pingüino."}, status=400)

    try:
        result = process_gregory_request(message, request.user, dry_run=dry_run)
    except Exception as exc:
        InteraccionIA.objects.create(
            usuario=request.user,
            pregunta=message,
            respuesta=str(exc),
            dentro_alcance=False,
            metadatos_json={"agente": "Pingüino", "dry_run": dry_run, "error": True},
        )
        return JsonResponse({"detail": str(exc)}, status=502)

    InteraccionIA.objects.create(
        usuario=request.user,
        pregunta=message,
        respuesta=result.assistant_message,
        dentro_alcance=True,
        metadatos_json={
            "agente": "Pingüino",
            "modelo": result.model,
            "dry_run": result.dry_run,
            "operations": result.operations,
            "executed": result.executed,
            "errors": result.errors,
            "requires_confirmation": result.requires_confirmation,
            "confidence": result.confidence,
        },
    )
    AuditoriaEvento.objects.create(
        usuario=request.user,
        tipo_evento=TipoEventoAuditoria.CONSULTA_IA,
        entidad="Pingüino",
        descripcion=f"Consulta a Pingüino con {len(result.operations)} operación(es). Ejecución: {not result.dry_run}.",
        datos_despues={"executed": result.executed, "errors": result.errors},
    )
    return JsonResponse(
        {
            "assistant_message": result.assistant_message,
            "operations": result.operations,
            "executed": result.executed,
            "errors": result.errors,
            "dry_run": result.dry_run,
            "model": result.model,
            "requires_confirmation": result.requires_confirmation,
            "confidence": result.confidence,
        }
    )


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def gregory_api(request):
    if not _gregory_allowed(request.user):
        return Response({"detail": "Pingüino está disponible solo para docentes y administradores."}, status=403)

    if request.method == "GET":
        openai_ready = bool(getattr(settings, "OPENAI_API_KEY", ""))
        return Response(
            {
                "agent": "Pingüino",
                "model": getattr(settings, "OPENAI_MODEL", "gpt-5.2"),
                "openai_ready": openai_ready,
                "mode": "openai" if openai_ready else "missing_key",
                "setup_hint": (
                    "OpenAI conectado. Las ejecuciones usan la Responses API."
                    if openai_ready
                    else "Falta OPENAI_API_KEY. Cree un .env desde .env.example, agregue la llave y reinicie el backend."
                ),
                "allowed_actions": sorted(ALLOWED_ACTIONS),
            }
        )

    message = (request.data.get("message") or "").strip()
    dry_run = bool(request.data.get("dry_run", True))
    if not message:
        return Response({"detail": "Escriba una instrucción para Pingüino."}, status=400)

    try:
        result = process_gregory_request(message, request.user, dry_run=dry_run)
    except Exception as exc:
        InteraccionIA.objects.create(
            usuario=request.user,
            pregunta=message,
            respuesta=str(exc),
            dentro_alcance=False,
            metadatos_json={"agente": "Pingüino", "dry_run": dry_run, "error": True, "canal": "api"},
        )
        return Response({"detail": str(exc)}, status=502)

    InteraccionIA.objects.create(
        usuario=request.user,
        pregunta=message,
        respuesta=result.assistant_message,
        dentro_alcance=True,
        metadatos_json={
            "agente": "Pingüino",
            "modelo": result.model,
            "dry_run": result.dry_run,
            "operations": result.operations,
            "executed": result.executed,
            "errors": result.errors,
            "requires_confirmation": result.requires_confirmation,
            "confidence": result.confidence,
            "canal": "api",
        },
    )
    AuditoriaEvento.objects.create(
        usuario=request.user,
        tipo_evento=TipoEventoAuditoria.CONSULTA_IA,
        entidad="Pingüino",
        descripcion=f"Consulta API a Pingüino con {len(result.operations)} operación(es). Ejecución: {not result.dry_run}.",
        datos_despues={"executed": result.executed, "errors": result.errors},
    )
    return Response(
        {
            "assistant_message": result.assistant_message,
            "operations": result.operations,
            "executed": result.executed,
            "errors": result.errors,
            "dry_run": result.dry_run,
            "model": result.model,
            "requires_confirmation": result.requires_confirmation,
            "confidence": result.confidence,
        }
    )


class IsDocenteAdministrador(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol in {RolUsuario.ADMINISTRADOR, RolUsuario.DOCENTE}
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by("apellidos", "nombres")
    serializer_class = UsuarioSerializer
    permission_classes = [IsDocenteAdministrador]
    filterset_fields = ["rol", "estado"]
    search_fields = ["nombres", "apellidos", "correo", "documento_identidad"]
    ordering_fields = ["apellidos", "nombres", "fecha_registro", "ultimo_acceso"]

    @action(detail=False, methods=["get"])
    def docentes(self, request):
        data = self.get_serializer(self.get_queryset().filter(rol=RolUsuario.DOCENTE), many=True).data
        return Response(data)

    @action(detail=False, methods=["get"])
    def estudiantes(self, request):
        data = self.get_serializer(self.get_queryset().filter(rol=RolUsuario.ESTUDIANTE), many=True).data
        return Response(data)

    @action(detail=True, methods=["post"])
    def inactivar(self, request, pk=None):
        user = self.get_object()
        user.estado = "INACTIVO"
        user.is_active = False
        user.save(update_fields=["estado", "is_active", "actualizado_en"])
        return Response(self.get_serializer(user).data)


class GrupoAcademicoViewSet(viewsets.ModelViewSet):
    queryset = GrupoAcademico.objects.select_related("docente").all().order_by("nombre")
    serializer_class = GrupoAcademicoSerializer
    permission_classes = [IsDocenteAdministrador]
    filterset_fields = ["docente", "periodo_academico", "activo"]
    search_fields = ["nombre", "descripcion", "periodo_academico"]


class EstudianteGrupoViewSet(viewsets.ModelViewSet):
    queryset = EstudianteGrupo.objects.select_related("estudiante", "grupo").order_by("grupo__nombre", "estudiante__apellidos", "estudiante__nombres")
    serializer_class = EstudianteGrupoSerializer
    permission_classes = [IsDocenteAdministrador]
    filterset_fields = ["estudiante", "grupo", "activo"]



