from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("administrativo", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="permisoporrol",
            name="rol",
            field=models.CharField(
                choices=[
                    ("ESTUDIANTE", "Estudiante"),
                    ("DOCENTE", "Docente"),
                    ("ADMINISTRADOR", "Docente-administrador"),
                ],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="usuario",
            name="rol",
            field=models.CharField(
                choices=[
                    ("ESTUDIANTE", "Estudiante"),
                    ("DOCENTE", "Docente"),
                    ("ADMINISTRADOR", "Docente-administrador"),
                ],
                max_length=20,
            ),
        ),
    ]
