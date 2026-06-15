import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.core.models import UUIDModel


class RolUsuario(models.TextChoices):
    ESTUDIANTE = "ESTUDIANTE", "Estudiante"
    DOCENTE = "DOCENTE", "Docente"
    ADMINISTRADOR = "ADMINISTRADOR", "Docente-administrador"


class EstadoUsuario(models.TextChoices):
    ACTIVO = "ACTIVO", "Activo"
    INACTIVO = "INACTIVO", "Inactivo"
    RETIRADO = "RETIRADO", "Retirado"
    BLOQUEADO = "BLOQUEADO", "Bloqueado"


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError("El correo es obligatorio.")
        correo = self.normalize_email(correo).lower()
        user = self.model(correo=correo, email=correo, username=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault("rol", RolUsuario.ADMINISTRADOR)
        extra_fields.setdefault("estado", EstadoUsuario.ACTIVO)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("nombres", "Administrador")
        extra_fields.setdefault("apellidos", "Principal")
        return self.create_user(correo, password, **extra_fields)


class Usuario(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombres = models.CharField(max_length=120)
    apellidos = models.CharField(max_length=120)
    correo = models.EmailField(max_length=180, unique=True)
    rol = models.CharField(max_length=20, choices=RolUsuario.choices)
    estado = models.CharField(max_length=20, choices=EstadoUsuario.choices, default=EstadoUsuario.ACTIVO)
    documento_identidad = models.CharField(max_length=50, blank=True)
    telefono = models.CharField(max_length=40, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    creado_por = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL)
    actualizado_en = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "correo"
    REQUIRED_FIELDS = []
    objects = UsuarioManager()

    class Meta:
        db_table = "usuarios"
        indexes = [
            models.Index(fields=["rol"]),
            models.Index(fields=["estado"]),
            models.Index(fields=["apellidos", "nombres"]),
        ]

    def save(self, *args, **kwargs):
        self.correo = self.correo.lower()
        self.email = self.correo
        self.username = self.correo
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombres} {self.apellidos} <{self.correo}>"


class GrupoAcademico(UUIDModel):
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    periodo_academico = models.CharField(max_length=50, blank=True)
    docente = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name="grupos_docente")
    estudiantes = models.ManyToManyField(Usuario, through="EstudianteGrupo", related_name="grupos_estudiante")
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "grupos_academicos"
        unique_together = ("nombre", "periodo_academico")
        indexes = [models.Index(fields=["docente"])]

    def __str__(self):
        return f"{self.nombre} - {self.periodo_academico}"


class EstudianteGrupo(models.Model):
    estudiante = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    grupo = models.ForeignKey(GrupoAcademico, on_delete=models.CASCADE)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "estudiantes_grupos"
        unique_together = ("estudiante", "grupo")

    def __str__(self):
        return f"{self.estudiante.nombres} {self.estudiante.apellidos} - {self.grupo.nombre}"
