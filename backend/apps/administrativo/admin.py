from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.administrativo.models import EstudianteGrupo, GrupoAcademico, RolUsuario, Usuario

admin.site.site_header = "Simulador Psicosocial CUE"
admin.site.site_title = "Simulador Psicosocial CUE"
admin.site.index_title = "Módulo administrativo de docente-administrador"


class RoleAdminMixin:
    docente_can_add = True
    docente_can_change = True
    docente_can_delete = False
    docente_can_view = True

    def is_admin_role(self, request):
        return bool(request.user.is_superuser or getattr(request.user, "rol", None) == "ADMINISTRADOR")

    def is_docente_role(self, request):
        return getattr(request.user, "rol", None) == "DOCENTE"

    def has_module_permission(self, request):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_view

    def has_view_permission(self, request, obj=None):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_view

    def has_add_permission(self, request):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_add

    def has_change_permission(self, request, obj=None):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_change

    def has_delete_permission(self, request, obj=None):
        if self.is_admin_role(request):
            return True
        return self.is_docente_role(request) and self.docente_can_delete


def filter_user_queryset(queryset, field_name):
    if field_name == "estudiante":
        return queryset.filter(rol=RolUsuario.ESTUDIANTE)
    if field_name == "docente":
        return queryset.filter(rol=RolUsuario.DOCENTE)
    if field_name in {"creado_por", "asignado_por", "publicado_por", "creada_por", "generado_por"}:
        return queryset.filter(rol__in=[RolUsuario.DOCENTE, RolUsuario.ADMINISTRADOR])
    return queryset


@admin.register(Usuario)
class UsuarioAdmin(RoleAdminMixin, UserAdmin):
    model = Usuario
    list_display = ("correo", "nombres", "apellidos", "rol", "estado", "is_staff")
    list_filter = ("rol", "estado")
    search_fields = ("correo", "nombres", "apellidos", "documento_identidad")
    ordering = ("apellidos", "nombres")
    fieldsets = (
        (None, {"fields": ("correo", "password")}),
        ("Informacion personal", {"fields": ("nombres", "apellidos", "documento_identidad", "telefono")}),
        ("Módulo administrativo", {"fields": ("rol", "estado", "creado_por", "ultimo_acceso")}),
        ("Permisos Django", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("correo", "nombres", "apellidos", "rol", "password1", "password2", "is_staff", "is_superuser"),
            },
        ),
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if self.is_docente_role(request) and not self.is_admin_role(request):
            return queryset.filter(rol="ESTUDIANTE")
        return queryset

    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        return filter_user_queryset(queryset, request.GET.get("field_name")), use_distinct

    def get_fieldsets(self, request, obj=None):
        if self.is_docente_role(request) and not self.is_admin_role(request):
            if obj is None:
                return (
                    (
                        None,
                        {
                            "classes": ("wide",),
                            "fields": ("correo", "nombres", "apellidos", "documento_identidad", "telefono", "password1", "password2"),
                        },
                    ),
                )
            return (
                (None, {"fields": ("correo", "password")}),
                ("Informacion del estudiante", {"fields": ("nombres", "apellidos", "documento_identidad", "telefono")}),
                ("Estado académico", {"fields": ("estado",)}),
            )
        return super().get_fieldsets(request, obj)

    def get_add_fieldsets(self, request):
        if self.is_docente_role(request) and not self.is_admin_role(request):
            return (
                (
                    None,
                    {
                        "classes": ("wide",),
                        "fields": ("correo", "nombres", "apellidos", "documento_identidad", "telefono", "password1", "password2"),
                    },
                ),
            )
        return super().get_add_fieldsets(request)

    def save_model(self, request, obj, form, change):
        if self.is_docente_role(request) and not self.is_admin_role(request):
            obj.rol = "ESTUDIANTE"
            obj.is_staff = False
            obj.is_superuser = False
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(GrupoAcademico)
class GrupoAcademicoAdmin(RoleAdminMixin, admin.ModelAdmin):
    list_display = ("nombre", "periodo_academico", "docente", "activo", "creado_en")
    list_filter = ("activo", "periodo_academico", "docente")
    search_fields = ("nombre", "descripcion", "periodo_academico", "docente__correo")
    autocomplete_fields = ("docente",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if self.is_docente_role(request) and not self.is_admin_role(request):
            return queryset.filter(docente=request.user)
        return queryset

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "docente":
            kwargs["queryset"] = Usuario.objects.filter(rol=RolUsuario.DOCENTE).order_by("apellidos", "nombres")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if self.is_docente_role(request) and not self.is_admin_role(request):
            obj.docente = request.user
        super().save_model(request, obj, form, change)


@admin.register(EstudianteGrupo)
class EstudianteGrupoAdmin(RoleAdminMixin, admin.ModelAdmin):
    list_display = ("estudiante", "grupo", "activo", "fecha_asignacion")
    list_filter = ("activo", "grupo")
    search_fields = ("estudiante__correo", "estudiante__nombres", "estudiante__apellidos", "grupo__nombre")
    autocomplete_fields = ("estudiante", "grupo")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if self.is_docente_role(request) and not self.is_admin_role(request):
            return queryset.filter(grupo__docente=request.user)
        return queryset

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "estudiante":
            kwargs["queryset"] = Usuario.objects.filter(rol=RolUsuario.ESTUDIANTE).order_by("apellidos", "nombres")
        elif db_field.name == "grupo" and self.is_docente_role(request) and not self.is_admin_role(request):
            kwargs["queryset"] = GrupoAcademico.objects.filter(docente=request.user).order_by("nombre")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
