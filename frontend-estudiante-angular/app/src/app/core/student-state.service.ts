import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiAttempt, ApiCase, ApiCaseStructure, ApiDecision, ApiFeedback, ApiResource, ApiScene, ApiTool, ApiUser, ToolUseDraft } from './backend.models';
import { CASES, SCENARIOS } from './mock-data';
import { ClinicalCase, Reflection } from './models';
import { StudentApiService } from './student-api.service';

@Injectable({ providedIn: 'root' })
export class StudentStateService {
  private readonly api = inject(StudentApiService);
  readonly cases = CASES;
  readonly scenarios = SCENARIOS;
  readonly loggedIn = signal(Boolean(localStorage.getItem('neurocommand_access_token')));
  readonly onboarded = signal(false);
  readonly consentAccepted = signal(false);
  readonly selectedCaseId = signal(CASES[0].id);
  readonly decisions = signal<Record<string, string>>({});
  readonly reflection = signal<Reflection>({ analysis: '', improvement: '', cognitiveLoad: 50, tags: ['Ética y no revictimización'] });
  readonly activeScenario = signal('hospital');
  readonly xp = signal(12450);
  readonly backendOnline = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly apiUser = signal<ApiUser | null>(this.readStoredUser());
  readonly apiCases = signal<ClinicalCase[]>([]);
  readonly apiCaseStructure = signal<ApiCaseStructure | null>(null);
  readonly apiAttempt = signal<ApiAttempt | null>(null);
  readonly apiDecisions = signal<ApiDecision[]>([]);
  readonly apiTools = signal<ApiTool[]>([]);
  readonly apiResources = signal<ApiResource[]>([]);
  readonly apiFeedback = signal<ApiFeedback | null>(null);
  readonly apiAttempts = signal<ApiAttempt[]>([]);
  readonly simulationPaused = signal(localStorage.getItem('neurocommand_simulation_paused') === '1');
  readonly attemptActive = signal(localStorage.getItem('neurocommand_attempt_active') === '1');
  readonly attemptCounts = signal<Record<string, number>>(this.readAttemptCounts());
  readonly displayCases = computed(() => this.apiCases().length ? this.apiCases() : this.cases);
  readonly selectedCase = computed(() => this.displayCases().find(item => item.id === this.selectedCaseId()) ?? this.displayCases()[0] ?? this.cases[0]);
  readonly attemptsUsed = computed(() => this.attemptCounts()[this.selectedCaseId()] ?? 0);
  readonly attemptsLabel = computed(() => this.attemptsUsed() ? `${this.attemptsUsed()} realizados` : 'Sin intentos previos');
  readonly score = computed(() => this.apiAttempt() ? Math.min(100, Math.round(Number(this.apiAttempt()!.puntaje_total))) : 76 + Object.keys(this.decisions()).length * 4);
  readonly studentName = computed(() => {
    const user = this.apiUser();
    return user ? `${user.nombres} ${user.apellidos}`.trim() : 'Estudiante';
  });
  readonly studentInitials = computed(() => {
    const user = this.apiUser();
    if (!user) return 'ES';
    return `${user.nombres?.[0] ?? ''}${user.apellidos?.[0] ?? ''}`.toUpperCase() || 'ES';
  });
  readonly studentStats = computed(() => {
    const attempts = this.apiAttempts();
    const completed = attempts.filter(item => item.estado === 'FINALIZADO');
    const active = attempts.filter(item => item.estado === 'EN_PROGRESO');
    const average = completed.length
      ? Math.round(completed.reduce((total, item) => total + Number(item.puntaje_total || 0), 0) / completed.length)
      : 0;
    const best = attempts.length ? Math.max(...attempts.map(item => Number(item.puntaje_total || 0))) : 0;
    return {
      totalAttempts: attempts.length,
      completedAttempts: completed.length,
      activeAttempts: active.length,
      averageScore: Math.max(0, Math.min(100, average)),
      bestScore: Math.max(0, Math.min(100, Math.round(best))),
    };
  });

  async login(correo: string, password: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await this.api.login(correo, password);
      localStorage.setItem('neurocommand_access_token', response.access);
      localStorage.setItem('neurocommand_refresh_token', response.refresh);
      localStorage.setItem('neurocommand_user', JSON.stringify(response.usuario));
      localStorage.setItem('neurocommand_session_started_at', String(Date.now()));
      this.apiUser.set(response.usuario);
      this.loggedIn.set(true);
      this.backendOnline.set(true);
      if (response.usuario.rol === 'ESTUDIANTE') await this.refreshBackendData();
      return true;
    } catch {
      this.error.set('No fue posible iniciar sesión. Verifique el correo, la contraseña y que el backend esté activo.');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async refreshBackendData(): Promise<void> {
    if (!this.apiUser()) return;
    try {
      const [cases, resources, toolData, attempts] = await Promise.all([
        this.api.listCases(),
        this.api.listResources(),
        this.api.listTools(this.isBackendId(this.selectedCaseId()) ? this.selectedCaseId() : undefined),
        this.api.listAttempts(this.apiUser()!.id)
      ]);
      this.apiCases.set(cases.map(item => this.mapCase(item)));
      this.apiResources.set(resources);
      this.apiTools.set(toolData.tools);
      this.apiAttempts.set(attempts);
      this.backendOnline.set(true);
      if (this.apiCases().length && !this.apiCases().some(item => item.id === this.selectedCaseId())) this.selectedCaseId.set(this.apiCases()[0].id);
    } catch {
      this.backendOnline.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem('neurocommand_access_token');
    localStorage.removeItem('neurocommand_refresh_token');
    localStorage.removeItem('neurocommand_user');
    localStorage.removeItem('neurocommand_session_started_at');
    this.loggedIn.set(false);
    this.apiUser.set(null);
    this.apiAttempt.set(null);
    this.apiAttempts.set([]);
    this.apiDecisions.set([]);
    this.apiFeedback.set(null);
    this.decisions.set({});
    this.consentAccepted.set(false);
    this.attemptActive.set(false);
    this.setSimulationPaused(false);
    localStorage.removeItem('neurocommand_attempt_active');
  }

  finishOnboarding(): void { this.onboarded.set(true); }

  async selectCase(id: string): Promise<void> {
    if (!this.apiCases().length && this.apiUser()) await this.refreshBackendData();
    const backendId = this.resolveBackendCaseId(id);
    this.selectedCaseId.set(backendId ?? id);
    this.activeScenario.set('hospital');
    this.decisions.set({});
    this.consentAccepted.set(false);
    this.setSimulationPaused(false);
    this.apiFeedback.set(null);
    if (!backendId) return;
    try {
      this.apiCaseStructure.set(await this.api.getCaseStructure(backendId));
      const tools = await this.api.listTools(backendId);
      this.apiTools.set(tools.tools);
      this.backendOnline.set(true);
    } catch {
      this.error.set('No fue posible cargar la estructura del caso desde el servidor.');
    }
  }

  async startAttempt(): Promise<void> {
    const user = this.apiUser();
    if (!this.apiCases().length && user) await this.refreshBackendData();
    const selected = this.selectedCase();
    const backendId = this.resolveBackendCaseId(selected.id) ?? selected.backendId;
    if (!user || !backendId) return;
    if (backendId && this.selectedCaseId() !== backendId) this.selectedCaseId.set(backendId);
    if (!backendId) return;
    const structure = this.apiCaseStructure() ?? await this.api.getCaseStructure(backendId);
    this.apiCaseStructure.set(structure);
    const attempts = await this.api.listAttempts(user.id, backendId);
    let attempt = attempts.find(item => item.estado === 'EN_PROGRESO') ?? null;
    if (!attempt) {
      const firstScene = structure.escenas.find(item => item.es_inicial) ?? [...structure.escenas].sort((a, b) => a.orden - b.orden)[0];
      attempt = await this.api.createAttempt({
        estudiante: user.id, caso: backendId, numero_intento: attempts.length + 1,
        estado: 'EN_PROGRESO', escena_actual: firstScene?.id ?? null, puntaje_total: '0', duracion_segundos: 0
      });
      if (firstScene) await this.api.createProgress(attempt.id, firstScene.id);
    }
    this.apiAttempt.set(attempt);
    await this.loadCurrentApiDecisions();
  }

  acceptConsent(): void { this.consentAccepted.set(true); }

  canBeginSimulationAttempt(): boolean {
    return true;
  }

  beginSimulationAttempt(): boolean {
    if (!this.attemptActive()) {
      const caseId = this.selectedCaseId();
      const nextCounts = { ...this.attemptCounts(), [caseId]: this.attemptsUsed() + 1 };
      this.attemptCounts.set(nextCounts);
      localStorage.setItem('neurocommand_attempt_counts', JSON.stringify(nextCounts));
      localStorage.setItem('neurocommand_attempt_active', '1');
      this.attemptActive.set(true);
    }
    this.error.set('');
    this.acceptConsent();
    this.setSimulationPaused(false);
    return true;
  }

  setSimulationPaused(value: boolean): void {
    this.simulationPaused.set(value);
    localStorage.setItem('neurocommand_simulation_paused', value ? '1' : '0');
  }

  async chooseDecision(scene: string, decision: string): Promise<void> {
    this.decisions.update(current => ({ ...current, [scene]: decision }));
    this.xp.update(value => value + 24);
    if (!this.apiAttempt()) await this.startAttempt();
    await this.syncAttemptToVisualScene(scene);
    const attempt = this.apiAttempt();
    const currentScene = this.currentApiScene();
    const available = this.apiDecisions();
    if (!attempt || !currentScene || !available.length) return;
    const visualIndex = Math.max(0, this.scenarios.find(item => item.id === scene)?.decisions.findIndex(item => item.id === decision) ?? 0);
    const apiDecision = available[Math.min(visualIndex, available.length - 1)];
    try {
      await this.api.recordDecision(attempt, currentScene, apiDecision, 'Decisión registrada desde la simulación visual del estudiante.');
      const localScenario = this.scenarios.find(item => item.id === scene);
      const simulationFinished = localScenario?.next === 'reflection';
      const patched = await this.api.patchAttempt(attempt.id, {
        escena_actual: apiDecision.escena_destino ?? attempt.escena_actual,
        puntaje_total: String(Number(attempt.puntaje_total) + Number(apiDecision.puntaje)),
        estado: simulationFinished ? 'FINALIZADO' : 'EN_PROGRESO'
      });
      this.apiAttempt.set(patched);
      if (apiDecision.escena_destino) await this.api.createProgress(attempt.id, apiDecision.escena_destino);
      await this.loadCurrentApiDecisions();
    } catch {
      this.error.set('La decisión se guardó localmente, pero el servidor no aceptó un registro duplicado.');
    }
  }

  async syncAttemptToVisualScene(sceneId: string): Promise<void> {
    if (!this.apiAttempt()) await this.startAttempt();
    const attempt = this.apiAttempt();
    const structure = this.apiCaseStructure();
    if (!attempt || !structure) return;
    const targetCode = this.backendSceneCode(sceneId);
    if (!targetCode) return;
    const targetScene = structure.escenas.find(item => item.codigo === targetCode);
    if (!targetScene || attempt.escena_actual === targetScene.id) {
      await this.loadCurrentApiDecisions();
      return;
    }
    const patched = await this.api.patchAttempt(attempt.id, {
      escena_actual: targetScene.id,
      estado: 'EN_PROGRESO'
    });
    this.apiAttempt.set(patched);
    try { await this.api.createProgress(attempt.id, targetScene.id); } catch { /* El progreso puede existir si se reanudó el caso. */ }
    await this.loadCurrentApiDecisions();
  }

  async recordToolUse(toolId: string, draft: ToolUseDraft): Promise<{ ok: boolean; synced: boolean; message: string }> {
    this.error.set('');
    const tool = this.apiTools().find(item => item.id === toolId);
    if (!tool) {
      return { ok: true, synced: false, message: 'Consulta registrada localmente. Esta herramienta no está vinculada al servidor.' };
    }

    try {
      if (!this.apiAttempt()) await this.startAttempt();
      const attempt = this.apiAttempt();
      if (!attempt) {
        return { ok: true, synced: false, message: 'Consulta registrada localmente. Inicie un caso para sincronizarla con el servidor.' };
      }
      await this.api.recordToolUse(attempt, tool.id, draft);
      this.backendOnline.set(true);
      return { ok: true, synced: true, message: `Consulta de ${tool.nombre} registrada en el intento ${attempt.numero_intento}.` };
    } catch {
      this.backendOnline.set(false);
      this.error.set('No fue posible sincronizar la herramienta con el servidor.');
      return { ok: false, synced: false, message: 'No fue posible sincronizar. Revise la sesión, el intento activo y la conexión con Django.' };
    }
  }

  async saveReflection(value: Reflection): Promise<void> {
    this.reflection.set(value);
    await this.finalizeBackendAttempt();
    this.finishLocalAttempt();
    const attempt = this.apiAttempt();
    const user = this.apiUser();
    if (!attempt || !user) return;
    try {
      await this.api.saveReflection(attempt, user, value.analysis, value.improvement, `Carga cognitiva percibida: ${value.cognitiveLoad}%.`);
      this.apiFeedback.set(await this.api.getFeedback(attempt.id));
    } catch {
      this.error.set('La bitácora quedó guardada localmente, pero no se pudo sincronizar con el servidor.');
    }
  }

  async finalizeBackendAttempt(): Promise<void> {
    const attempt = this.apiAttempt();
    const structure = this.apiCaseStructure();
    if (!attempt || !structure || attempt.estado === 'FINALIZADO') return;
    const finalScene = [...structure.escenas].sort((a, b) => b.orden - a.orden).find(item => item.es_final) ?? null;
    const patched = await this.api.patchAttempt(attempt.id, {
      escena_actual: finalScene?.id ?? attempt.escena_actual,
      estado: 'FINALIZADO'
    });
    this.apiAttempt.set(patched);
    if (finalScene) {
      try { await this.api.createProgress(attempt.id, finalScene.id); } catch { /* El progreso puede existir si se reanuda el caso. */ }
    }
    const feedback = await this.api.getFeedback(attempt.id);
    this.apiFeedback.set(feedback ?? await this.api.createFeedback(patched));
  }

  async loadFeedback(): Promise<void> {
    const attempt = this.apiAttempt();
    if (!attempt) return;
    try { this.apiFeedback.set(await this.api.getFeedback(attempt.id)); } catch { this.apiFeedback.set(null); }
  }

  resetSimulation(): void {
    this.decisions.set({});
    this.consentAccepted.set(false);
    this.activeScenario.set('hospital');
    this.apiAttempt.set(null);
    this.apiDecisions.set([]);
    this.finishLocalAttempt();
  }

  clearLocalProgress(): void {
    this.attemptCounts.set({});
    this.attemptActive.set(false);
    this.setSimulationPaused(false);
    localStorage.removeItem('neurocommand_attempt_counts');
    localStorage.removeItem('neurocommand_attempt_active');
  }

  private finishLocalAttempt(): void {
    this.attemptActive.set(false);
    this.setSimulationPaused(false);
    localStorage.removeItem('neurocommand_attempt_active');
  }

  private async loadCurrentApiDecisions(): Promise<void> {
    const scene = this.currentApiScene();
    this.apiDecisions.set(scene ? await this.api.listDecisions(scene.id) : []);
  }

  private currentApiScene(): ApiScene | null {
    const sceneId = this.apiAttempt()?.escena_actual;
    return this.apiCaseStructure()?.escenas.find(item => item.id === sceneId) ?? null;
  }

  private backendSceneCode(sceneId: string): string | null {
    const map: Record<string, string> = {
      'hospital-q1': 'H01',
      'hospital-q2': 'H02',
      'hospital-q3': 'H03',
      'comisaria-q1': 'C01',
      'comisaria-q2': 'C02',
      'comisaria-q3': 'C03',
    };
    return map[sceneId] ?? null;
  }

  private mapCase(item: ApiCase): ClinicalCase {
    const objectives = item.objetivos_aprendizaje.split(/[.;]\s*/).filter(Boolean);
    return {
      id: item.id, backendId: item.id, reference: item.codigo, name: item.titulo,
      subject: item.codigo.replace('CASO-', 'SUJETO_'), status: item.nivel === 'AVANZADO' ? 'volatile' : 'stable',
      complexity: item.nivel === 'AVANZADO' ? 4 : item.nivel === 'INTERMEDIO' ? 3 : 1,
      location: 'Entorno académico de simulación', summary: item.contexto || item.descripcion,
      objectives: objectives.length ? objectives : ['Analizar la situación desde un enfoque psicosocial.'],
      warning: item.advertencia_contenido
    };
  }

  private isBackendId(id: string): boolean { return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id); }
  private resolveBackendCaseId(id: string): string | null {
    if (this.isBackendId(id)) return id;
    const cases = this.apiCases();
    const localCase = this.cases.find(item => item.id === id);
    const byReference = localCase ? cases.find(item => item.reference === localCase.reference) : null;
    return byReference?.backendId ?? cases[0]?.backendId ?? null;
  }
  private readStoredUser(): ApiUser | null {
    try { return JSON.parse(localStorage.getItem('neurocommand_user') ?? 'null') as ApiUser | null; } catch { return null; }
  }

  private readAttemptCounts(): Record<string, number> {
    try { return JSON.parse(localStorage.getItem('neurocommand_attempt_counts') ?? '{}') as Record<string, number>; } catch { return {}; }
  }
}


