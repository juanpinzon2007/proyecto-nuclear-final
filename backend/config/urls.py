from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.administrativo.views import (
    LoginView,
    api_login_password_change,
    gregory_admin,
    global_login,
    global_logout,
    login_password_change,
    role_home,
)

urlpatterns = [
    path("health/", lambda request: JsonResponse({"status": "ok"}), name="health"),
    path("", role_home, name="root_home"),
    path("login/", global_login, name="global_login"),
    path("cambiar-clave/", login_password_change, name="login_password_change"),
    path("salir/", global_logout, name="global_logout"),
    path("admin/login/", global_login, name="admin_login"),
    path("admin/logout/", global_logout, name="admin_logout"),
    path("admin/gregory/", gregory_admin, name="admin_gregory"),
    path("admin/", admin.site.urls),
    path("estudiante/", include("apps.simulador.student_urls")),
    path("api/auth/login/", LoginView.as_view(), name="token_obtain_pair"),
    path("api/auth/cambiar-clave/", api_login_password_change, name="api_login_password_change"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/administrativo/", include("apps.administrativo.urls")),
    path("api/simulador/", include("apps.simulador.urls")),
]
