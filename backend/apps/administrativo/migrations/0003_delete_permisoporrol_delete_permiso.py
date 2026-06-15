from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("administrativo", "0002_alter_permisoporrol_rol_alter_usuario_rol"),
    ]

    operations = [
        migrations.DeleteModel(
            name="PermisoPorRol",
        ),
        migrations.DeleteModel(
            name="Permiso",
        ),
    ]
