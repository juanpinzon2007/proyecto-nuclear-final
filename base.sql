-- ============================================================
-- BASE DE DATOS POSTGRESQL
-- Sistema: Simulador Interactivo de Psicología Social
-- Idioma: Español
-- Motor: PostgreSQL 14+
-- ============================================================

-- Recomendado para UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE rol_usuario AS ENUM (
    'ESTUDIANTE',
    'DOCENTE',
    'ADMINISTRADOR'
);

CREATE TYPE estado_usuario AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'RETIRADO',
    'BLOQUEADO'
);

CREATE TYPE nivel_dificultad AS ENUM (
    'BASICO',
    'INTERMEDIO',
    'AVANZADO'
);

CREATE TYPE estado_caso AS ENUM (
    'BORRADOR',
    'PUBLICADO',
    'ARCHIVADO'
);

CREATE TYPE estado_intento AS ENUM (
    'EN_PROGRESO',
    'FINALIZADO',
    'PENDIENTE_CIERRE',
    'CANCELADO'
);

CREATE TYPE tipo_escena AS ENUM (
    'INTRODUCCION',
    'DESARROLLO',
    'DECISION',
    'USO_HERRAMIENTA',
    'RETROALIMENTACION',
    'FINAL'
);

CREATE TYPE tipo_decision AS ENUM (
    'ADECUADA',
    'RIESGOSA',
    'INADECUADA',
    'NEUTRA'
);

CREATE TYPE tipo_recurso AS ENUM (
    'TEORIA',
    'GUIA',
    'LECTURA',
    'VIDEO',
    'INSTRUMENTO',
    'OTRO'
);

CREATE TYPE tipo_alerta AS ENUM (
    'BAJO_DESEMPENO',
    'EVENTO_CRITICO',
    'RIESGO_ALTO',
    'INACTIVIDAD'
);

CREATE TYPE estado_alerta AS ENUM (
    'ABIERTA',
    'REVISADA',
    'CERRADA'
);

CREATE TYPE tipo_evento_auditoria AS ENUM (
    'INICIO_SESION',
    'CIERRE_SESION',
    'CREACION',
    'ACTUALIZACION',
    'ELIMINACION_LOGICA',
    'CAMBIO_ESTADO',
    'EXPORTACION',
    'CONSULTA_IA',
    'ACCESO_DENEGADO'
);

-- ============================================================
-- 2. SEGURIDAD, USUARIOS Y ROLES
-- ============================================================

CREATE TABLE usuarios (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          nombres VARCHAR(120) NOT NULL,
                          apellidos VARCHAR(120) NOT NULL,
                          correo VARCHAR(180) NOT NULL UNIQUE,
                          contrasena_hash TEXT NOT NULL,
                          rol rol_usuario NOT NULL,
                          estado estado_usuario NOT NULL DEFAULT 'ACTIVO',
                          documento_identidad VARCHAR(50),
                          telefono VARCHAR(40),
                          fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                          ultimo_acceso TIMESTAMPTZ,
                          creado_por UUID REFERENCES usuarios(id),
                          actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                          CHECK (correo = LOWER(correo))
);

CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_nombre ON usuarios(apellidos, nombres);

COMMENT ON TABLE usuarios IS 'Usuarios del simulador: estudiantes, docentes y administradores.';

CREATE TABLE permisos (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          codigo VARCHAR(80) NOT NULL UNIQUE,
                          nombre VARCHAR(150) NOT NULL,
                          descripcion TEXT
);

CREATE TABLE permisos_por_rol (
                                  rol rol_usuario NOT NULL,
                                  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
                                  PRIMARY KEY (rol, permiso_id)
);

CREATE TABLE grupos_academicos (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   nombre VARCHAR(120) NOT NULL,
                                   descripcion TEXT,
                                   periodo_academico VARCHAR(50),
                                   docente_id UUID NOT NULL REFERENCES usuarios(id),
                                   activo BOOLEAN NOT NULL DEFAULT TRUE,
                                   creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                   UNIQUE (nombre, periodo_academico)
);

CREATE INDEX idx_grupos_docente ON grupos_academicos(docente_id);

CREATE TABLE estudiantes_grupos (
                                    estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                    grupo_id UUID NOT NULL REFERENCES grupos_academicos(id) ON DELETE CASCADE,
                                    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                    activo BOOLEAN NOT NULL DEFAULT TRUE,
                                    PRIMARY KEY (estudiante_id, grupo_id)
);

-- ============================================================
-- 3. CATÁLOGO DE COMPETENCIAS, TEMÁTICAS Y ETIQUETAS
-- ============================================================

CREATE TABLE competencias (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              codigo VARCHAR(40) NOT NULL UNIQUE,
                              nombre VARCHAR(160) NOT NULL,
                              descripcion TEXT,
                              activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tematicas (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           nombre VARCHAR(160) NOT NULL UNIQUE,
                           descripcion TEXT,
                           activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE etiquetas (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           nombre VARCHAR(120) NOT NULL UNIQUE,
                           descripcion TEXT
);

-- ============================================================
-- 4. CASOS SITUACIONALES RAMIFICADOS
-- ============================================================

CREATE TABLE casos (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       codigo VARCHAR(50) NOT NULL UNIQUE,
                       titulo VARCHAR(220) NOT NULL,
                       descripcion TEXT NOT NULL,
                       contexto TEXT,
                       objetivos_aprendizaje TEXT,
                       advertencia_contenido TEXT,
                       nivel nivel_dificultad NOT NULL DEFAULT 'BASICO',
                       estado estado_caso NOT NULL DEFAULT 'BORRADOR',
                       max_intentos INTEGER NOT NULL DEFAULT 2,
                       creado_por UUID NOT NULL REFERENCES usuarios(id),
                       publicado_por UUID REFERENCES usuarios(id),
                       fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       fecha_publicacion TIMESTAMPTZ,
                       actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       CHECK (max_intentos >= 1)
);

CREATE INDEX idx_casos_estado ON casos(estado);
CREATE INDEX idx_casos_nivel ON casos(nivel);
CREATE INDEX idx_casos_creado_por ON casos(creado_por);

CREATE TABLE casos_tematicas (
                                 caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                                 tematica_id UUID NOT NULL REFERENCES tematicas(id),
                                 PRIMARY KEY (caso_id, tematica_id)
);

CREATE TABLE casos_etiquetas (
                                 caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                                 etiqueta_id UUID NOT NULL REFERENCES etiquetas(id),
                                 PRIMARY KEY (caso_id, etiqueta_id)
);

CREATE TABLE casos_competencias (
                                    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                                    competencia_id UUID NOT NULL REFERENCES competencias(id),
                                    peso NUMERIC(5,2) NOT NULL DEFAULT 1.00,
                                    PRIMARY KEY (caso_id, competencia_id),
                                    CHECK (peso > 0)
);

CREATE TABLE asignaciones_casos (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    caso_id UUID NOT NULL REFERENCES casos(id),
                                    grupo_id UUID REFERENCES grupos_academicos(id),
                                    estudiante_id UUID REFERENCES usuarios(id),
                                    asignado_por UUID NOT NULL REFERENCES usuarios(id),
                                    fecha_inicio TIMESTAMPTZ,
                                    fecha_fin TIMESTAMPTZ,
                                    activo BOOLEAN NOT NULL DEFAULT TRUE,
                                    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                    CHECK (grupo_id IS NOT NULL OR estudiante_id IS NOT NULL),
                                    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_asignaciones_caso ON asignaciones_casos(caso_id);
CREATE INDEX idx_asignaciones_grupo ON asignaciones_casos(grupo_id);
CREATE INDEX idx_asignaciones_estudiante ON asignaciones_casos(estudiante_id);

-- ============================================================
-- 5. ESCENAS, ACTORES Y DECISIONES RAMIFICADAS
-- ============================================================

CREATE TABLE actores_caso (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                              nombre VARCHAR(160) NOT NULL,
                              rol_en_caso VARCHAR(160),
                              descripcion TEXT,
                              es_sensible BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_actores_caso ON actores_caso(caso_id);

CREATE TABLE escenas (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                         codigo VARCHAR(50) NOT NULL,
                         titulo VARCHAR(220) NOT NULL,
                         contenido TEXT NOT NULL,
                         tipo tipo_escena NOT NULL,
                         orden INTEGER NOT NULL DEFAULT 1,
                         es_inicial BOOLEAN NOT NULL DEFAULT FALSE,
                         es_final BOOLEAN NOT NULL DEFAULT FALSE,
                         activa BOOLEAN NOT NULL DEFAULT TRUE,
                         UNIQUE (caso_id, codigo),
                         CHECK (orden >= 1)
);

CREATE INDEX idx_escenas_caso ON escenas(caso_id);
CREATE INDEX idx_escenas_tipo ON escenas(tipo);

CREATE UNIQUE INDEX idx_una_escena_inicial_por_caso
    ON escenas(caso_id)
    WHERE es_inicial = TRUE;

CREATE TABLE decisiones (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            escena_origen_id UUID NOT NULL REFERENCES escenas(id) ON DELETE CASCADE,
                            escena_destino_id UUID REFERENCES escenas(id),
                            texto_decision TEXT NOT NULL,
                            consecuencia TEXT,
                            tipo tipo_decision NOT NULL DEFAULT 'NEUTRA',
                            puntaje NUMERIC(6,2) NOT NULL DEFAULT 0,
                            requiere_justificacion BOOLEAN NOT NULL DEFAULT FALSE,
                            activa BOOLEAN NOT NULL DEFAULT TRUE,
                            orden INTEGER NOT NULL DEFAULT 1,
                            CHECK (orden >= 1)
);

CREATE INDEX idx_decisiones_origen ON decisiones(escena_origen_id);
CREATE INDEX idx_decisiones_destino ON decisiones(escena_destino_id);

CREATE TABLE decisiones_competencias (
                                         decision_id UUID NOT NULL REFERENCES decisiones(id) ON DELETE CASCADE,
                                         competencia_id UUID NOT NULL REFERENCES competencias(id),
                                         impacto NUMERIC(6,2) NOT NULL DEFAULT 0,
                                         PRIMARY KEY (decision_id, competencia_id)
);

-- ============================================================
-- 6. HERRAMIENTAS PROFESIONALES Y CONFIGURACIÓN POR CASO
-- ============================================================

CREATE TABLE herramientas_profesionales (
                                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                            codigo VARCHAR(50) NOT NULL UNIQUE,
                                            nombre VARCHAR(180) NOT NULL,
                                            descripcion TEXT,
                                            instrucciones TEXT,
                                            plantilla_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                            activa BOOLEAN NOT NULL DEFAULT TRUE,
                                            creada_por UUID REFERENCES usuarios(id),
                                            creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_herramientas_activa ON herramientas_profesionales(activa);

CREATE TABLE herramientas_por_caso (
                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                       caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                                       herramienta_id UUID NOT NULL REFERENCES herramientas_profesionales(id),
                                       escena_id UUID REFERENCES escenas(id),
                                       obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
                                       condicion_uso TEXT,
                                       parametros_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                       UNIQUE (caso_id, herramienta_id, escena_id)
);

CREATE INDEX idx_herramientas_por_caso ON herramientas_por_caso(caso_id);
CREATE INDEX idx_herramientas_por_escena ON herramientas_por_caso(escena_id);

-- ============================================================
-- 7. RECURSOS TEÓRICOS Y GUÍAS
-- ============================================================

CREATE TABLE recursos (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          titulo VARCHAR(220) NOT NULL,
                          tipo tipo_recurso NOT NULL,
                          resumen TEXT,
                          contenido TEXT,
                          url_externa TEXT,
                          referencia_bibliografica TEXT,
                          creado_por UUID REFERENCES usuarios(id),
                          activo BOOLEAN NOT NULL DEFAULT TRUE,
                          creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recursos_casos (
                                recurso_id UUID NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
                                caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                                escena_id UUID REFERENCES escenas(id) ON DELETE SET NULL,
                                competencia_id UUID REFERENCES competencias(id) ON DELETE SET NULL,
                                visible_antes BOOLEAN NOT NULL DEFAULT TRUE,
                                visible_durante BOOLEAN NOT NULL DEFAULT TRUE,
                                visible_despues BOOLEAN NOT NULL DEFAULT TRUE,
                                PRIMARY KEY (recurso_id, caso_id)
);

-- ============================================================
-- 8. INTENTOS, PROGRESO Y TRAZABILIDAD DE SIMULACIÓN
-- ============================================================

CREATE TABLE intentos (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          estudiante_id UUID NOT NULL REFERENCES usuarios(id),
                          caso_id UUID NOT NULL REFERENCES casos(id),
                          asignacion_id UUID REFERENCES asignaciones_casos(id),
                          numero_intento INTEGER NOT NULL,
                          estado estado_intento NOT NULL DEFAULT 'EN_PROGRESO',
                          escena_actual_id UUID REFERENCES escenas(id),
                          puntaje_total NUMERIC(8,2) NOT NULL DEFAULT 0,
                          iniciado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                          finalizado_en TIMESTAMPTZ,
                          actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                          duracion_segundos INTEGER NOT NULL DEFAULT 0,
                          UNIQUE (estudiante_id, caso_id, numero_intento),
                          CHECK (numero_intento >= 1),
                          CHECK (duracion_segundos >= 0),
                          CHECK (finalizado_en IS NULL OR finalizado_en >= iniciado_en)
);

CREATE INDEX idx_intentos_estudiante ON intentos(estudiante_id);
CREATE INDEX idx_intentos_caso ON intentos(caso_id);
CREATE INDEX idx_intentos_estado ON intentos(estado);

CREATE TABLE progreso_escenas (
                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                  intento_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                  escena_id UUID NOT NULL REFERENCES escenas(id),
                                  fecha_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                  fecha_salida TIMESTAMPTZ,
                                  duracion_segundos INTEGER NOT NULL DEFAULT 0,
                                  completada BOOLEAN NOT NULL DEFAULT FALSE,
                                  UNIQUE (intento_id, escena_id, fecha_entrada),
                                  CHECK (duracion_segundos >= 0)
);

CREATE INDEX idx_progreso_intento ON progreso_escenas(intento_id);
CREATE INDEX idx_progreso_escena ON progreso_escenas(escena_id);

CREATE TABLE respuestas_decisiones (
                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                       intento_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                       escena_id UUID NOT NULL REFERENCES escenas(id),
                                       decision_id UUID NOT NULL REFERENCES decisiones(id),
                                       justificacion TEXT,
                                       puntaje_obtenido NUMERIC(8,2) NOT NULL DEFAULT 0,
                                       confirmada BOOLEAN NOT NULL DEFAULT TRUE,
                                       respondida_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                       UNIQUE (intento_id, escena_id, decision_id)
);

CREATE INDEX idx_respuestas_intento ON respuestas_decisiones(intento_id);
CREATE INDEX idx_respuestas_decision ON respuestas_decisiones(decision_id);

CREATE TABLE uso_herramientas_intento (
                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                          intento_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                          herramienta_id UUID NOT NULL REFERENCES herramientas_profesionales(id),
                                          escena_id UUID REFERENCES escenas(id),
                                          datos_entrada_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                          resultado_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                          observaciones TEXT,
                                          usada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uso_herramientas_intento ON uso_herramientas_intento(intento_id);
CREATE INDEX idx_uso_herramientas_herramienta ON uso_herramientas_intento(herramienta_id);

-- ============================================================
-- 9. BITÁCORA REFLEXIVA
-- ============================================================

CREATE TABLE bitacoras_reflexivas (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                      intento_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                      estudiante_id UUID NOT NULL REFERENCES usuarios(id),
                                      escena_id UUID REFERENCES escenas(id),
                                      reflexion TEXT NOT NULL,
                                      aprendizaje_clave TEXT,
                                      consideraciones_eticas TEXT,
                                      autocuidado TEXT,
                                      creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                      actualizada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bitacoras_intento ON bitacoras_reflexivas(intento_id);
CREATE INDEX idx_bitacoras_estudiante ON bitacoras_reflexivas(estudiante_id);

-- ============================================================
-- 10. RÚBRICAS, EVALUACIÓN Y COMENTARIOS DOCENTES
-- ============================================================

CREATE TABLE rubricas (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
                          nombre VARCHAR(180) NOT NULL,
                          descripcion TEXT,
                          activa BOOLEAN NOT NULL DEFAULT TRUE,
                          creada_por UUID NOT NULL REFERENCES usuarios(id),
                          creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE criterios_rubrica (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   rubrica_id UUID NOT NULL REFERENCES rubricas(id) ON DELETE CASCADE,
                                   competencia_id UUID REFERENCES competencias(id),
                                   nombre VARCHAR(180) NOT NULL,
                                   descripcion TEXT,
                                   puntaje_maximo NUMERIC(8,2) NOT NULL,
                                   orden INTEGER NOT NULL DEFAULT 1,
                                   CHECK (puntaje_maximo > 0),
                                   CHECK (orden >= 1)
);

CREATE TABLE evaluaciones_intentos (
                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                       intento_id UUID NOT NULL UNIQUE REFERENCES intentos(id) ON DELETE CASCADE,
                                       rubrica_id UUID REFERENCES rubricas(id),
                                       docente_id UUID NOT NULL REFERENCES usuarios(id),
                                       puntaje_total NUMERIC(8,2) NOT NULL DEFAULT 0,
                                       observacion_general TEXT,
                                       evaluada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluaciones_criterios (
                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                        evaluacion_id UUID NOT NULL REFERENCES evaluaciones_intentos(id) ON DELETE CASCADE,
                                        criterio_id UUID NOT NULL REFERENCES criterios_rubrica(id),
                                        puntaje_obtenido NUMERIC(8,2) NOT NULL,
                                        comentario TEXT,
                                        UNIQUE (evaluacion_id, criterio_id),
                                        CHECK (puntaje_obtenido >= 0)
);

CREATE TABLE comentarios_docente (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                     intento_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                     docente_id UUID NOT NULL REFERENCES usuarios(id),
                                     escena_id UUID REFERENCES escenas(id),
                                     comentario TEXT NOT NULL,
                                     visible_estudiante BOOLEAN NOT NULL DEFAULT TRUE,
                                     creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comentarios_intento ON comentarios_docente(intento_id);
CREATE INDEX idx_comentarios_docente ON comentarios_docente(docente_id);

-- ============================================================
-- 11. RETROALIMENTACIÓN AUTOMÁTICA Y COMPARACIÓN DE RUTAS
-- ============================================================

CREATE TABLE retroalimentaciones (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                     intento_id UUID NOT NULL UNIQUE REFERENCES intentos(id) ON DELETE CASCADE,
                                     resumen TEXT NOT NULL,
                                     aciertos TEXT,
                                     errores TEXT,
                                     recomendaciones TEXT,
                                     indicadores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                     generada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comparaciones_intentos (
                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                        estudiante_id UUID NOT NULL REFERENCES usuarios(id),
                                        caso_id UUID NOT NULL REFERENCES casos(id),
                                        intento_a_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                        intento_b_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                        diferencias_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                        recomendaciones TEXT,
                                        creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                        CHECK (intento_a_id <> intento_b_id)
);

-- ============================================================
-- 12. ANALÍTICAS, ALERTAS Y REPORTES
-- ============================================================

CREATE TABLE indicadores_desempeno (
                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                       intento_id UUID NOT NULL REFERENCES intentos(id) ON DELETE CASCADE,
                                       competencia_id UUID REFERENCES competencias(id),
                                       nombre_indicador VARCHAR(180) NOT NULL,
                                       valor NUMERIC(10,2) NOT NULL,
                                       unidad VARCHAR(40),
                                       detalle_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                       calculado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_indicadores_intento ON indicadores_desempeno(intento_id);
CREATE INDEX idx_indicadores_competencia ON indicadores_desempeno(competencia_id);

CREATE TABLE alertas_desempeno (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   estudiante_id UUID NOT NULL REFERENCES usuarios(id),
                                   docente_id UUID REFERENCES usuarios(id),
                                   intento_id UUID REFERENCES intentos(id) ON DELETE CASCADE,
                                   competencia_id UUID REFERENCES competencias(id),
                                   tipo tipo_alerta NOT NULL,
                                   estado estado_alerta NOT NULL DEFAULT 'ABIERTA',
                                   titulo VARCHAR(200) NOT NULL,
                                   descripcion TEXT,
                                   umbral_configurado NUMERIC(10,2),
                                   valor_observado NUMERIC(10,2),
                                   creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                   revisada_en TIMESTAMPTZ,
                                   cerrada_en TIMESTAMPTZ
);

CREATE INDEX idx_alertas_estudiante ON alertas_desempeno(estudiante_id);
CREATE INDEX idx_alertas_docente ON alertas_desempeno(docente_id);
CREATE INDEX idx_alertas_estado ON alertas_desempeno(estado);

CREATE TABLE reportes_desempeno (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    intento_id UUID REFERENCES intentos(id) ON DELETE SET NULL,
                                    estudiante_id UUID REFERENCES usuarios(id),
                                    generado_por UUID NOT NULL REFERENCES usuarios(id),
                                    titulo VARCHAR(220) NOT NULL,
                                    contenido_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                    ruta_archivo TEXT,
                                    incluye_datos_sensibles BOOLEAN NOT NULL DEFAULT FALSE,
                                    generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reportes_estudiante ON reportes_desempeno(estudiante_id);
CREATE INDEX idx_reportes_generado_por ON reportes_desempeno(generado_por);

-- ============================================================
-- 13. ASISTENTE DE INTELIGENCIA ARTIFICIAL CONTEXTUAL
-- ============================================================

CREATE TABLE interacciones_ia (
                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                  usuario_id UUID NOT NULL REFERENCES usuarios(id),
                                  intento_id UUID REFERENCES intentos(id) ON DELETE SET NULL,
                                  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
                                  escena_id UUID REFERENCES escenas(id) ON DELETE SET NULL,
                                  pregunta TEXT NOT NULL,
                                  respuesta TEXT NOT NULL,
                                  dentro_alcance BOOLEAN NOT NULL DEFAULT TRUE,
                                  bloqueo_por_respuesta_correcta BOOLEAN NOT NULL DEFAULT FALSE,
                                  metadatos_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                                  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interacciones_ia_usuario ON interacciones_ia(usuario_id);
CREATE INDEX idx_interacciones_ia_intento ON interacciones_ia(intento_id);
CREATE INDEX idx_interacciones_ia_caso ON interacciones_ia(caso_id);

-- ============================================================
-- 14. AUDITORÍA Y TRAZABILIDAD
-- ============================================================

CREATE TABLE auditoria_eventos (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   usuario_id UUID REFERENCES usuarios(id),
                                   tipo_evento tipo_evento_auditoria NOT NULL,
                                   entidad VARCHAR(120),
                                   entidad_id UUID,
                                   descripcion TEXT,
                                   ip_origen INET,
                                   user_agent TEXT,
                                   datos_antes JSONB,
                                   datos_despues JSONB,
                                   creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_usuario ON auditoria_eventos(usuario_id);
CREATE INDEX idx_auditoria_tipo ON auditoria_eventos(tipo_evento);
CREATE INDEX idx_auditoria_entidad ON auditoria_eventos(entidad, entidad_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_eventos(creado_en);

-- ============================================================
-- 15. FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_actualizado
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_casos_actualizado
    BEFORE UPDATE ON casos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_intentos_actualizado
    BEFORE UPDATE ON intentos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE OR REPLACE FUNCTION impedir_decision_no_confirmada_si_finaliza()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'FINALIZADO' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM bitacoras_reflexivas b
            WHERE b.intento_id = NEW.id
        ) THEN
            NEW.estado = 'PENDIENTE_CIERRE';
END IF;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_cierre_con_bitacora
    BEFORE UPDATE OF estado ON intentos
    FOR EACH ROW
    EXECUTE FUNCTION impedir_decision_no_confirmada_si_finaliza();

-- ============================================================
-- 16. VISTAS ÚTILES
-- ============================================================

CREATE VIEW vista_estudiantes_grupos AS
SELECT
    eg.grupo_id,
    g.nombre AS grupo,
    g.periodo_academico,
    u.id AS estudiante_id,
    u.nombres,
    u.apellidos,
    u.correo,
    u.estado
FROM estudiantes_grupos eg
         JOIN grupos_academicos g ON g.id = eg.grupo_id
         JOIN usuarios u ON u.id = eg.estudiante_id
WHERE eg.activo = TRUE;

CREATE VIEW vista_resumen_intentos AS
SELECT
    i.id AS intento_id,
    i.numero_intento,
    i.estado,
    i.puntaje_total,
    i.duracion_segundos,
    i.iniciado_en,
    i.finalizado_en,
    e.id AS estudiante_id,
    e.nombres || ' ' || e.apellidos AS estudiante,
    c.id AS caso_id,
    c.codigo AS codigo_caso,
    c.titulo AS caso,
    c.nivel
FROM intentos i
         JOIN usuarios e ON e.id = i.estudiante_id
         JOIN casos c ON c.id = i.caso_id;

CREATE VIEW vista_desempeno_por_competencia AS
SELECT
    i.estudiante_id,
    i.caso_id,
    ind.competencia_id,
    comp.nombre AS competencia,
    AVG(ind.valor) AS promedio_valor,
    COUNT(*) AS cantidad_indicadores
FROM indicadores_desempeno ind
         JOIN intentos i ON i.id = ind.intento_id
         LEFT JOIN competencias comp ON comp.id = ind.competencia_id
GROUP BY i.estudiante_id, i.caso_id, ind.competencia_id, comp.nombre;

-- ============================================================
-- 17. DATOS BASE DE PERMISOS
-- ============================================================

INSERT INTO permisos (codigo, nombre, descripcion) VALUES
                                                       ('USUARIOS_GESTIONAR', 'Gestionar usuarios', 'Crear, actualizar, inactivar y consultar usuarios.'),
                                                       ('CASOS_CREAR', 'Crear casos', 'Crear y editar casos situacionales.'),
                                                       ('CASOS_PUBLICAR', 'Publicar casos', 'Publicar casos para estudiantes.'),
                                                       ('CASOS_ASIGNAR', 'Asignar casos', 'Asignar casos a grupos o estudiantes.'),
                                                       ('SIMULACION_REALIZAR', 'Realizar simulaciones', 'Ejecutar intentos de casos asignados.'),
                                                       ('EVALUACION_GESTIONAR', 'Gestionar evaluaciones', 'Crear rúbricas, evaluar intentos y comentar desempeño.'),
                                                       ('ANALITICAS_VER', 'Ver analíticas', 'Consultar indicadores y alertas de desempeño.'),
                                                       ('REPORTES_EXPORTAR', 'Exportar reportes', 'Generar reportes de desempeño.'),
                                                       ('IA_CONSULTAR', 'Consultar asistente IA', 'Usar el asistente inteligente contextual.')
    ON CONFLICT (codigo) DO NOTHING;

INSERT INTO permisos_por_rol (rol, permiso_id)
SELECT 'ADMINISTRADOR', id FROM permisos
    ON CONFLICT DO NOTHING;

INSERT INTO permisos_por_rol (rol, permiso_id)
SELECT 'DOCENTE', id FROM permisos
WHERE codigo IN (
                 'CASOS_CREAR',
                 'CASOS_ASIGNAR',
                 'EVALUACION_GESTIONAR',
                 'ANALITICAS_VER',
                 'REPORTES_EXPORTAR',
                 'IA_CONSULTAR'
    )
    ON CONFLICT DO NOTHING;

INSERT INTO permisos_por_rol (rol, permiso_id)
SELECT 'ESTUDIANTE', id FROM permisos
WHERE codigo IN (
                 'SIMULACION_REALIZAR',
                 'IA_CONSULTAR'
    )
    ON CONFLICT DO NOTHING;

-- ============================================================
-- 18. COMENTARIOS GENERALES
-- ============================================================

COMMENT ON TABLE casos IS 'Casos situacionales ramificados del simulador.';
COMMENT ON TABLE escenas IS 'Escenas o nodos dentro de un caso ramificado.';
COMMENT ON TABLE decisiones IS 'Opciones de decisión que conectan escenas y generan consecuencias.';
COMMENT ON TABLE intentos IS 'Intentos de simulación realizados por estudiantes.';
COMMENT ON TABLE bitacoras_reflexivas IS 'Reflexiones del estudiante durante o después del intento.';
COMMENT ON TABLE retroalimentaciones IS 'Retroalimentación automática generada al finalizar un intento.';
COMMENT ON TABLE interacciones_ia IS 'Registro de consultas al asistente de inteligencia artificial contextual.';
COMMENT ON TABLE auditoria_eventos IS 'Trazabilidad de eventos importantes del sistema.';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
