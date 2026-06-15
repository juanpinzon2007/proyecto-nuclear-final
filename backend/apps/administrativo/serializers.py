from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.administrativo.models import EstudianteGrupo, GrupoAcademico

Usuario = get_user_model()


class LoginSerializer(TokenObtainPairSerializer):
    username_field = "correo"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["usuario"] = UsuarioSerializer(self.user).data
        return data


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "nombres",
            "apellidos",
            "correo",
            "password",
            "rol",
            "estado",
            "documento_identidad",
            "telefono",
            "fecha_registro",
            "ultimo_acceso",
            "creado_por",
        ]
        read_only_fields = ["id", "fecha_registro", "ultimo_acceso"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = Usuario(**validated_data)
        user.set_password(password or "Cambiar123")
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class GrupoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrupoAcademico
        fields = "__all__"


class EstudianteGrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstudianteGrupo
        fields = "__all__"
