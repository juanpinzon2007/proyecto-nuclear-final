from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.administrativo.models import EstadoUsuario, RolUsuario


class Command(BaseCommand):
    help = "Crea permisos base y el docente administrador inicial."

    def handle(self, *args, **options):
        email = getattr(settings, "ADMIN_EMAIL", None) or "ficho@cue.edu.co"
        password = getattr(settings, "ADMIN_PASSWORD", None) or "admin123"
        User = get_user_model()
        user, created = User.objects.update_or_create(
            correo=email,
            defaults={
                "email": email,
                "username": email,
                "nombres": "Ficho",
                "apellidos": "Administrador",
                "rol": RolUsuario.ADMINISTRADOR,
                "estado": EstadoUsuario.ACTIVO,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Administrador {'creado' if created else 'actualizado'}: {email}"))
