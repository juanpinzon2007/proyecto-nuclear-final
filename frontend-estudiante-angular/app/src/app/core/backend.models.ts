export interface ApiPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiUser {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: 'ESTUDIANTE' | 'DOCENTE' | 'ADMINISTRADOR';
  estado: string;
}

export interface ApiLoginResponse {
  access: string;
  refresh: string;
  usuario: ApiUser;
}

export interface ApiCase {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  contexto: string;
  objetivos_aprendizaje: string;
  advertencia_contenido: string;
  nivel: string;
  estado: string;
  max_intentos: number;
}

export interface ApiScene {
  id: string;
  caso: string;
  codigo: string;
  titulo: string;
  contenido: string;
  tipo: string;
  orden: number;
  es_inicial: boolean;
  es_final: boolean;
  activa: boolean;
}

export interface ApiDecision {
  id: string;
  escena_origen: string;
  escena_destino: string | null;
  texto_decision: string;
  consecuencia: string;
  tipo: string;
  puntaje: string;
  requiere_justificacion: boolean;
  orden: number;
}

export interface ApiAttempt {
  id: string;
  estudiante: string;
  caso: string;
  numero_intento: number;
  estado: string;
  escena_actual: string | null;
  puntaje_total: string;
  duracion_segundos: number;
  iniciado_en?: string;
  finalizado_en?: string | null;
  actualizado_en?: string;
}

export interface ApiTool {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  instrucciones: string;
}

export interface ApiToolLink {
  id: string;
  caso: string;
  herramienta: string;
  escena: string | null;
  obligatoria: boolean;
  condicion_uso: string;
}

export interface ApiResource {
  id: string;
  titulo: string;
  tipo: string;
  resumen: string;
  contenido: string;
  url_externa?: string;
  referencia_bibliografica?: string;
}

export interface ToolUseDraft {
  objetivo: string;
  hallazgos: string;
  acciones: string;
  observaciones: string;
}

export interface ApiFeedback {
  id: string;
  intento: string;
  resumen: string;
  aciertos: string;
  errores: string;
  recomendaciones: string;
  indicadores_json: Record<string, number>;
}

export interface ApiCaseStructure {
  caso: ApiCase;
  escenas: ApiScene[];
}

export interface GregoryOperation {
  action: string;
  lookup_json: string;
  payload_json: string;
  reason: string;
}

export interface GregoryExecution {
  action: string;
  created: boolean;
  id: string;
  label: string;
}

export interface GregoryResponse {
  assistant_message: string;
  operations: GregoryOperation[];
  executed: GregoryExecution[];
  errors: { operation: GregoryOperation | null; error: string }[];
  dry_run: boolean;
  model: string;
  requires_confirmation: boolean;
  confidence: number;
}

export interface GregoryCapabilities {
  agent: string;
  model: string;
  openai_ready: boolean;
  mode: 'openai' | 'missing_key';
  setup_hint: string;
  allowed_actions: string[];
}
