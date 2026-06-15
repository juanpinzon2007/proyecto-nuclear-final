from django import forms
from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError


class LoginPasswordChangeForm(forms.Form):
    correo = forms.EmailField(label="Correo")
    clave_actual = forms.CharField(label="Clave actual", widget=forms.PasswordInput)
    nueva_clave = forms.CharField(label="Nueva clave", widget=forms.PasswordInput)
    confirmar_clave = forms.CharField(label="Confirmar nueva clave", widget=forms.PasswordInput)

    def __init__(self, request=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.request = request
        self.user = None

    def clean(self):
        cleaned_data = super().clean()
        correo = (cleaned_data.get("correo") or "").strip().lower()
        clave_actual = cleaned_data.get("clave_actual")
        nueva_clave = cleaned_data.get("nueva_clave")
        confirmar_clave = cleaned_data.get("confirmar_clave")

        if clave_actual and correo:
            self.user = authenticate(self.request, username=correo, password=clave_actual)
            if self.user is None:
                raise ValidationError("El correo o la clave actual no son correctos.")
            if not self.user.is_active:
                raise ValidationError("Este usuario no esta activo.")

        if nueva_clave and confirmar_clave and nueva_clave != confirmar_clave:
            self.add_error("confirmar_clave", "Las claves nuevas no coinciden.")

        if self.user and nueva_clave:
            password_validation.validate_password(nueva_clave, self.user)

        return cleaned_data

    def save(self):
        nueva_clave = self.cleaned_data["nueva_clave"]
        self.user.set_password(nueva_clave)
        self.user.save(update_fields=["password"])
        return self.user
