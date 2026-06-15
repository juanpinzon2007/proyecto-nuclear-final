import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiAttempt, ApiCase, ApiCaseStructure, ApiDecision, ApiFeedback, ApiLoginResponse,
  ApiPage, ApiResource, ApiScene, ApiTool, ApiToolLink, ApiUser, GregoryCapabilities, GregoryResponse, ToolUseDraft
} from './backend.models';

function resolveApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  const { hostname, port } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port.startsWith('42')) return 'http://localhost:8001/api';
  return '/api';
}

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  private readonly http = inject(HttpClient);
  readonly base = resolveApiBase();

  async login(correo: string, password: string): Promise<ApiLoginResponse> {
    return firstValueFrom(this.http.post<ApiLoginResponse>(`${this.base}/auth/login/`, { correo, password }));
  }

  async changePassword(correo: string, claveActual: string, nuevaClave: string, confirmarClave: string): Promise<{ detail: string }> {
    return firstValueFrom(this.http.post<{ detail: string }>(`${this.base}/auth/cambiar-clave/`, {
      correo,
      clave_actual: claveActual,
      nueva_clave: nuevaClave,
      confirmar_clave: confirmarClave
    }));
  }

  async getGregoryCapabilities(): Promise<GregoryCapabilities> {
    return firstValueFrom(this.http.get<GregoryCapabilities>(`${this.base}/administrativo/gregory/`));
  }

  async askGregory(message: string, dryRun: boolean): Promise<GregoryResponse> {
    return firstValueFrom(this.http.post<GregoryResponse>(`${this.base}/administrativo/gregory/`, { message, dry_run: dryRun }));
  }

  async listCases(): Promise<ApiCase[]> {
    return this.list<ApiCase>(`${this.base}/simulador/casos/`, { estado: 'PUBLICADO' });
  }

  async getCaseStructure(caseId: string): Promise<ApiCaseStructure> {
    return firstValueFrom(this.http.get<ApiCaseStructure>(`${this.base}/simulador/casos/${caseId}/estructura/`));
  }

  async listAttempts(studentId: string, caseId?: string): Promise<ApiAttempt[]> {
    return this.list<ApiAttempt>(`${this.base}/simulador/intentos/`, { estudiante: studentId, ...(caseId ? { caso: caseId } : {}) });
  }

  async createAttempt(payload: Partial<ApiAttempt>): Promise<ApiAttempt> {
    return firstValueFrom(this.http.post<ApiAttempt>(`${this.base}/simulador/intentos/`, payload));
  }

  async patchAttempt(id: string, payload: Partial<ApiAttempt>): Promise<ApiAttempt> {
    return firstValueFrom(this.http.patch<ApiAttempt>(`${this.base}/simulador/intentos/${id}/`, payload));
  }

  async listDecisions(sceneId: string): Promise<ApiDecision[]> {
    return this.list<ApiDecision>(`${this.base}/simulador/decisiones/`, { escena_origen: sceneId, activa: 'true' });
  }

  async recordDecision(attempt: ApiAttempt, scene: ApiScene, decision: ApiDecision, justificacion: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/simulador/respuestas-decisiones/`, {
      intento: attempt.id, escena: scene.id, decision: decision.id, justificacion,
      puntaje_obtenido: decision.puntaje, confirmada: true
    }));
  }

  async createProgress(attemptId: string, sceneId: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/simulador/progreso-escenas/`, { intento: attemptId, escena: sceneId, completada: false }));
  }

  async listTools(caseId?: string): Promise<{ tools: ApiTool[]; links: ApiToolLink[] }> {
    const [tools, links] = await Promise.all([
      this.list<ApiTool>(`${this.base}/simulador/herramientas-profesionales/`, { activa: 'true' }),
      caseId ? this.list<ApiToolLink>(`${this.base}/simulador/herramientas-por-caso/`, { caso: caseId }) : Promise.resolve([])
    ]);
    return { tools, links };
  }

  async listResources(): Promise<ApiResource[]> {
    return this.list<ApiResource>(`${this.base}/simulador/recursos/`, { activo: 'true' });
  }

  async recordToolUse(attempt: ApiAttempt, toolId: string, draft: ToolUseDraft): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/simulador/uso-herramientas/`, {
      intento: attempt.id,
      herramienta: toolId,
      escena: attempt.escena_actual,
      datos_entrada_json: {
        fuente: 'frontend_estudiante_angular',
        objetivo: draft.objetivo,
        observaciones: draft.observaciones
      },
      resultado_json: {
        registrado: true,
        hallazgos: draft.hallazgos,
        acciones: draft.acciones
      },
      observaciones: draft.observaciones || 'Consulta registrada desde el frontend del estudiante.'
    }));
  }

  async saveReflection(attempt: ApiAttempt, student: ApiUser, reflexion: string, aprendizaje: string, autocuidado: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/simulador/bitacoras-reflexivas/`, {
      intento: attempt.id, estudiante: student.id, escena: attempt.escena_actual,
      reflexion, aprendizaje_clave: aprendizaje, consideraciones_eticas: 'Registro realizado durante el cierre reflexivo.',
      autocuidado
    }));
  }

  async getFeedback(attemptId: string): Promise<ApiFeedback | null> {
    const items = await this.list<ApiFeedback>(`${this.base}/simulador/retroalimentaciones/`, { intento: attemptId });
    return items[0] ?? null;
  }

  async createFeedback(attempt: ApiAttempt): Promise<ApiFeedback> {
    return firstValueFrom(this.http.post<ApiFeedback>(`${this.base}/simulador/retroalimentaciones/`, {
      intento: attempt.id,
      resumen: 'Simulación finalizada. Revise sus decisiones, la bitácora y las recomendaciones formativas.',
      aciertos: 'Se registró la ruta de análisis y la reflexión ética del estudiante.',
      errores: 'Contraste las decisiones tomadas con los marcos normativos y técnicos asociados al caso.',
      recomendaciones: 'Refuerce valoración de riesgo, activación de rutas, comunicación de malas noticias y medidas de protección.',
      indicadores_json: { puntaje_total: Number(attempt.puntaje_total) }
    }));
  }

  private async list<T>(url: string, values: Record<string, string>): Promise<T[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) params = params.set(key, value);
    const page = await firstValueFrom(this.http.get<ApiPage<T> | T[]>(url, { params }));
    return Array.isArray(page) ? page : page.results;
  }
}
