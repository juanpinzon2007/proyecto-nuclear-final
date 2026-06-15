import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GregoryCapabilities, GregoryOperation, GregoryResponse } from '../core/backend.models';
import { StudentApiService } from '../core/student-api.service';
import { StudentStateService } from '../core/student-state.service';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="PINGÜINO IA" time="ADMIN" />
      <div class="content ai-shell">
        <section class="panel panel-pad ai-hero">
          <div class="hero-copy">
            <p class="eyebrow cyan">Agente docente y administrativo</p>
            <h1>Pingüino ejecuta funciones del sistema</h1>
            <p>Prepara y ejecuta operaciones sobre usuarios, grupos, casos, escenas, decisiones, recursos, herramientas, asignaciones, rúbricas, evaluaciones, comentarios, alertas y reportes.</p>
            <div class="status-row">
              <span class="tag green">{{ state.apiUser()?.rol || 'SIN SESIÓN' }}</span>
              <span class="tag" [class.green]="capabilities?.openai_ready" [class.amber]="capabilities && !capabilities.openai_ready">
                {{ capabilities?.openai_ready ? 'OpenAI conectado' : 'Falta llave OpenAI' }}
              </span>
              <span class="tag">{{ capabilities?.model || 'Modelo no cargado' }}</span>
            </div>
          </div>
          <div class="penguin-core" aria-hidden="true">
            <span class="ring ring-a"></span>
            <span class="ring ring-b"></span>
            <span class="mascot">🐧</span>
            <span class="spark s1"></span>
            <span class="spark s2"></span>
            <span class="spark s3"></span>
          </div>
        </section>

        @if (!isAllowed()) {
          <section class="panel panel-pad warning">
            <h2>Acceso restringido</h2>
            <p>Esta IA solo puede operar con cuentas de docente o administrador. Inicie sesión con un rol autorizado.</p>
            <a class="btn" routerLink="/login">Volver al login</a>
          </section>
        } @else {
          <section class="quick-grid">
            @for (item of quickActions; track item.title) {
              <button class="quick-card" type="button" (click)="useTemplate(item.text)">
                <span class="quick-icon">{{ item.icon }}</span>
                <b>{{ item.title }}</b>
                <small>{{ item.description }}</small>
              </button>
            }
          </section>

          <section class="panel panel-pad command-card">
            @if (capabilities?.setup_hint) {
              <div class="setup-note" [class.ready]="capabilities?.openai_ready">
                <b>{{ capabilities?.openai_ready ? 'Conexión activa' : 'Configuración requerida' }}</b>
                <span>{{ capabilities?.setup_hint }}</span>
              </div>
            }
            <label>
              <span class="mono">Instrucción para Pingüino</span>
              <textarea class="field prompt" [(ngModel)]="message" placeholder="Ejemplo: crea un caso publicado sobre intervención en crisis y asígnalo al grupo &quot;Psicología 2026-1&quot;."></textarea>
            </label>
            <div class="actions">
              <button class="btn secondary" type="button" [disabled]="loading || !message.trim()" (click)="send(true)">{{ loading && dryRunMode ? 'Analizando...' : 'Analizar sin ejecutar' }}</button>
              <button class="btn" type="button" [disabled]="loading || !message.trim() || !capabilities?.openai_ready" (click)="send(false)">{{ loading && !dryRunMode ? 'Ejecutando...' : 'Ejecutar cambios' }}</button>
            </div>
            <p class="hint">Use primero el análisis para revisar operaciones. La ejecución completa requiere <code>OPENAI_API_KEY</code> configurada en el backend y queda auditada.</p>
          </section>

          @if (error) { <section class="panel notice error">{{ error }}</section> }

          @if (result) {
            <section class="panel panel-pad result-card">
              <div class="result-head">
                <div>
                  <p class="eyebrow">Respuesta</p>
                  <h2>{{ result.assistant_message }}</h2>
                </div>
                <div class="status-row result-tags">
                  <span class="tag">{{ result.model }}</span>
                  <span class="tag" [class.green]="!result.dry_run" [class.amber]="result.dry_run">{{ result.dry_run ? 'Previsualización' : 'Ejecutado' }}</span>
                </div>
              </div>
              <div class="metrics">
                <span>Confianza: {{ percent(result.confidence) }}</span>
                <span>Operaciones: {{ result.operations.length }}</span>
                <span>Ejecutadas: {{ result.executed.length }}</span>
                <span>Errores: {{ result.errors.length }}</span>
              </div>
            </section>

            @if (result.operations.length) {
              <section class="grid desktop-2 cards">
                @for (operation of result.operations; track operation.action + operation.reason + $index) {
                  <article class="panel operation">
                    <div class="operation-top">
                      <span class="op-icon">{{ operationIcon(operation.action) }}</span>
                      <span class="tag green">{{ operation.action }}</span>
                    </div>
                    <p>{{ operation.reason }}</p>
                    <button class="mini" type="button" (click)="toggleOperation(operation)">{{ openedOperation === operation ? 'Ocultar JSON' : 'Ver JSON' }}</button>
                    @if (openedOperation === operation) {
                      <pre>{{ formatOperation(operation) }}</pre>
                    }
                  </article>
                }
              </section>
            }

            @if (result.executed.length) {
              <section class="panel panel-pad executed">
                <p class="eyebrow green">Cambios aplicados</p>
                @for (item of result.executed; track item.id) {
                  <div class="row"><b>{{ item.action }}</b><span>{{ item.label }}</span><small>{{ item.created ? 'Creado' : 'Actualizado/existente' }}</small></div>
                }
              </section>
            }

            @if (result.errors.length) {
              <section class="panel panel-pad notice error">
                <p class="eyebrow">Errores</p>
                @for (item of result.errors; track item.error + $index) { <p>{{ item.error }}</p> }
              </section>
            }
          }

          <section class="panel panel-pad capabilities">
            <p class="eyebrow">Funciones habilitadas</p>
            <div class="chips">
              @for (action of capabilities?.allowed_actions ?? []; track action) { <span>{{ action }}</span> }
            </div>
          </section>
        }
      </div>
    </main>
  `,
  styles: [`
    .ai-shell{padding-bottom:80px}.ai-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:18px;align-items:center;margin-bottom:14px;overflow:hidden;background:radial-gradient(circle at 88% 20%,rgba(255,184,0,.2),transparent 28%),linear-gradient(135deg,rgba(0,229,244,.14),rgba(0,0,0,.18)),#0a1017}.ai-hero:before{content:'';position:absolute;inset:auto -80px -120px auto;width:260px;height:260px;border-radius:50%;background:rgba(0,232,148,.1);filter:blur(6px)}.hero-copy{position:relative;z-index:1;display:grid;gap:12px}.ai-hero h1{font-size:clamp(36px,6vw,62px);line-height:.9}.penguin-core{position:relative;z-index:1;height:190px;display:grid;place-items:center}.mascot{position:relative;z-index:2;font-size:76px;filter:drop-shadow(0 0 20px rgba(0,229,244,.45));animation:float 3.2s ease-in-out infinite}.ring{position:absolute;border:1px solid rgba(0,229,244,.45);border-radius:50%;animation:spin 10s linear infinite}.ring-a{width:158px;height:158px}.ring-b{width:112px;height:112px;border-color:rgba(255,184,0,.42);animation-direction:reverse}.spark{position:absolute;width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 14px var(--cyan);animation:pulse 1.8s ease-in-out infinite}.s1{top:30px;right:34px}.s2{bottom:42px;left:28px;background:var(--amber);box-shadow:0 0 14px var(--amber);animation-delay:.4s}.s3{bottom:22px;right:60px;background:var(--green);box-shadow:0 0 14px var(--green);animation-delay:.8s}.status-row,.actions,.metrics,.chips{display:flex;gap:10px;flex-wrap:wrap}.result-tags{justify-content:flex-end}.quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}.quick-card{display:grid;gap:8px;text-align:left;padding:14px;border:1px solid rgba(184,211,214,.18);color:var(--text);background:linear-gradient(145deg,rgba(21,26,33,.94),rgba(5,8,13,.92));transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}.quick-card:hover{transform:translateY(-3px);border-color:rgba(0,229,244,.55);box-shadow:0 0 22px rgba(0,229,244,.12)}.quick-icon{font-size:28px}.quick-card b{font-family:var(--display);font-size:22px;text-transform:uppercase;line-height:1}.quick-card small{color:var(--muted);font:12px var(--mono);line-height:1.35}.command-card{display:grid;gap:14px}.setup-note{display:grid;gap:5px;padding:12px 14px;border:1px solid rgba(255,184,0,.38);background:rgba(255,184,0,.08);font:12px var(--mono);color:var(--amber)}.setup-note.ready{border-color:rgba(0,232,148,.42);background:rgba(0,232,148,.08);color:var(--green)}.setup-note span{color:var(--muted)}.command-card label{display:grid;gap:10px;color:var(--muted);font-size:12px}.prompt{min-height:150px;font-size:16px;line-height:1.5}.hint{color:var(--muted);font:12px var(--mono)}.notice{margin-top:14px;padding:13px 15px;font:13px var(--mono)}.notice.error,.warning{border-color:rgba(232,67,81,.55);color:var(--coral)}.result-card{margin-top:14px;display:grid;gap:14px}.result-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.result-head h2{font-size:26px}.metrics span{padding:8px 10px;border:1px solid rgba(184,211,214,.2);background:#111820;color:#cbd6d8;font:12px var(--mono)}.cards{gap:12px;margin-top:14px}.operation{display:grid;gap:10px;padding:16px}.operation-top{display:flex;align-items:center;gap:10px}.op-icon{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,184,0,.35);background:rgba(255,184,0,.08);font-size:22px}.operation p{font-size:14px}.mini{justify-self:start;border:1px solid rgba(0,229,244,.45);background:transparent;color:var(--cyan);font:12px var(--mono);padding:8px 10px}pre{max-height:260px;overflow:auto;padding:12px;background:#05070a;color:#d8faff;border:1px solid rgba(184,211,214,.18);font:12px var(--mono);white-space:pre-wrap}.executed{margin-top:14px}.row{display:grid;grid-template-columns:190px 1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid rgba(184,211,214,.14)}.row b{color:var(--cyan);font:12px var(--mono)}.row small{color:var(--green);font:12px var(--mono)}.capabilities{margin-top:14px}.chips span{padding:7px 9px;border:1px solid rgba(184,211,214,.22);color:#cbd6d8;background:#151b22;font:11px var(--mono)}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:700px){.actions,.quick-grid{display:grid;grid-template-columns:1fr}.result-head,.row{display:grid;grid-template-columns:1fr}.result-tags{justify-content:flex-start}.ai-hero{grid-template-columns:1fr}.penguin-core{height:132px}.ai-hero h1{font-size:38px}}
  `]
})
export class PinguinoPageComponent {
  private readonly api = inject(StudentApiService);
  private readonly router = inject(Router);
  readonly state = inject(StudentStateService);
  capabilities: GregoryCapabilities | null = null;
  result: GregoryResponse | null = null;
  openedOperation: GregoryOperation | null = null;
  message = '';
  error = '';
  loading = false;
  dryRunMode = true;
  readonly quickActions = [
    {
      icon: '👤',
      title: 'Crear usuario',
      description: 'Estudiante, docente o administrador.',
      text: 'Crea un usuario estudiante llamado Laura Gómez con correo laura.gomez@cue.edu.co.'
    },
    {
      icon: '🧩',
      title: 'Crear caso',
      description: 'Caso publicado con dos intentos.',
      text: 'Crea un caso publicado llamado "Intervención en crisis familiar" sobre valoración de riesgo, rutas de atención y comunicación ética.'
    },
    {
      icon: '🧭',
      title: 'Crear escena',
      description: 'Nodo narrativo para un caso.',
      text: 'Crea una escena inicial para el caso CASO-IA-001 llamada "Primer contacto" con orientación para evaluar riesgo inmediato.'
    },
    {
      icon: '🃏',
      title: 'Crear decisión',
      description: 'Opción ramificada evaluable.',
      text: 'Crea una decisión para el caso CASO-IA-001 en la escena ESC-1 llamada "Activar ruta de protección" con consecuencia formativa.'
    },
    {
      icon: '📚',
      title: 'Crear recurso',
      description: 'Guía o material académico.',
      text: 'Crea un recurso llamado "Guía de primeros auxilios psicológicos" con pautas de contención, escucha activa y derivación responsable.'
    },
    {
      icon: '🎯',
      title: 'Asignar caso',
      description: 'A grupo o estudiante específico.',
      text: 'Asigna el caso CASO-IA-001 al grupo "Psicología 2026-1".'
    }
  ];

  constructor() {
    if (!this.state.loggedIn()) void this.router.navigate(['/login']);
    else if (!this.isAllowed()) void this.router.navigate(['/student/dashboard']);
    void this.loadCapabilities();
  }

  isAllowed(): boolean {
    const role = this.state.apiUser()?.rol;
    return role === 'DOCENTE' || role === 'ADMINISTRADOR';
  }

  async loadCapabilities(): Promise<void> {
    if (!this.isAllowed()) return;
    try {
      this.capabilities = await this.api.getGregoryCapabilities();
    } catch (error) {
      this.error = this.readError(error, 'No fue posible cargar las capacidades de Pingüino.');
    }
  }

  async send(dryRun: boolean): Promise<void> {
    if (!this.message.trim()) return;
    this.loading = true;
    this.dryRunMode = dryRun;
    this.error = '';
    try {
      this.result = await this.api.askGregory(this.message, dryRun);
    } catch (error) {
      this.error = this.readError(error, 'No fue posible comunicarse con Pingüino.');
    } finally {
      this.loading = false;
    }
  }

  toggleOperation(operation: GregoryOperation): void {
    this.openedOperation = this.openedOperation === operation ? null : operation;
  }

  useTemplate(text: string): void {
    this.message = text;
    this.result = null;
    this.error = '';
  }

  operationIcon(action: string): string {
    const icons: Record<string, string> = {
      create_user: '👤',
      create_group: '👥',
      enroll_student: '🧑‍🎓',
      create_case: '🧩',
      publish_case: '🚀',
      create_actor: '🎭',
      create_scene: '🧭',
      create_decision: '🃏',
      create_resource: '📚',
      attach_resource_to_case: '🔗',
      create_tool: '🛠️',
      attach_tool_to_case: '🧰',
      assign_case: '🎯',
      create_rubric: '📏',
      create_rubric_criterion: '✅',
      create_teacher_comment: '💬',
      create_feedback: '🧠',
      create_evaluation: '📝',
      create_evaluation_criterion: '🔎',
      create_performance_indicator: '📈',
      create_performance_alert: '⚠️',
      create_performance_report: '📊'
    };
    return icons[action] || '⚙️';
  }

  formatOperation(operation: GregoryOperation): string {
    return JSON.stringify({ action: operation.action, lookup: this.parseJson(operation.lookup_json), payload: this.parseJson(operation.payload_json) }, null, 2);
  }

  percent(value: number): string {
    return `${Math.round((value || 0) * 100)}%`;
  }

  private parseJson(value: string): unknown {
    try { return JSON.parse(value || '{}'); } catch { return value; }
  }

  private readError(error: unknown, fallback: string): string {
    const candidate = error as { error?: { detail?: string }; message?: string };
    return candidate?.error?.detail || candidate?.message || fallback;
  }
}
