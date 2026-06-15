from django.db import migrations


def drop_attempt_limit_trigger(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("DROP TRIGGER IF EXISTS trg_validar_maximo_intentos ON intentos;")
        cursor.execute("DROP FUNCTION IF EXISTS validar_maximo_intentos();")


class Migration(migrations.Migration):

    dependencies = [
        ("simulador", "0002_alter_alertadesempeno_tipo_and_more"),
    ]

    operations = [
        migrations.RunPython(drop_attempt_limit_trigger, migrations.RunPython.noop),
    ]
