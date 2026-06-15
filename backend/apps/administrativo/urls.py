from rest_framework.routers import DefaultRouter
from django.urls import path

from apps.administrativo.views import (
    EstudianteGrupoViewSet,
    GrupoAcademicoViewSet,
    UsuarioViewSet,
    gregory_api,
)

router = DefaultRouter()
router.register("usuarios", UsuarioViewSet)
router.register("grupos-academicos", GrupoAcademicoViewSet)
router.register("estudiantes-grupos", EstudianteGrupoViewSet)

urlpatterns = [
    path("gregory/", gregory_api, name="api_gregory"),
    *router.urls,
]
