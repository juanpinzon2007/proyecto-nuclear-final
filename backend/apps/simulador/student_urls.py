from django.urls import path
from django.views.generic import RedirectView

from apps.simulador import student_views

urlpatterns = [
    path("login/", RedirectView.as_view(pattern_name="global_login", permanent=False), name="student_login"),
    path("salir/", RedirectView.as_view(pattern_name="global_logout", permanent=False), name="student_logout"),
    path("", student_views.dashboard, name="student_dashboard"),
    path("casos/", student_views.casos, name="student_casos"),
    path("casos/<uuid:caso_id>/", student_views.caso_detalle, name="student_caso_detalle"),
    path("casos/<uuid:caso_id>/iniciar/", student_views.iniciar_simulacion, name="student_iniciar_simulacion"),
    path("simulacion/<uuid:intento_id>/", student_views.simulacion, name="student_simulacion"),
    path("simulacion/<uuid:intento_id>/responder/", student_views.responder_decision, name="student_responder_decision"),
    path("simulacion/<uuid:intento_id>/herramienta/", student_views.registrar_uso_herramienta, name="student_registrar_herramienta"),
    path("simulacion/<uuid:intento_id>/bitacora/", student_views.guardar_bitacora, name="student_guardar_bitacora"),
    path("simulacion/<uuid:intento_id>/retroalimentacion/", student_views.retroalimentacion, name="student_retroalimentacion"),
]
