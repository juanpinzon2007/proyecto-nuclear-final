import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ApiResource, ApiTool, ToolUseDraft } from '../core/backend.models';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

type ToolkitKind = 'tool' | 'resource' | 'protocol';
type ToolkitCategory = 'hospital' | 'legal' | 'risk' | 'academic';

type ToolkitCard = {
  id: string;
  kind: ToolkitKind;
  title: string;
  category: ToolkitCategory;
  summary: string;
  body: string;
  source: string;
  steps?: string[];
  tool?: ApiTool;
  resource?: ApiResource;
};

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="HERRAMIENTAS DEL CASO" [time]="state.selectedCase().reference" /><div class="content toolkit-page">
      <div class="tabs">
        @for (tab of tabs; track tab.id) {
          <a [routerLink]="tab.id ? ['/student/toolkit', tab.id] : ['/student/toolkit']" [class.active]="section() === tab.id">{{ tab.label }}</a>
        }
      </div>

      @if (notice) { <section class="panel notice" [class.error]="noticeTone === 'error'">{{ notice }}</section> }
      @if (state.error()) { <section class="panel notice error">{{ state.error() }}</section> }

      @if (detailCard()) {
        <section class="panel panel-pad stack detail">
          <p class="eyebrow" [class.amber]="detailCard()?.category === 'legal'" [class.green]="detailCard()?.category === 'risk'">{{ detailCard()?.source }}</p>
          <h1>{{ detailCard()?.title }}</h1>
          <p>{{ detailCard()?.body }}</p>
          <div class="divider"></div>
          <h3 class="cyan">Criterios de actuación</h3>
          @for (step of detailCard()?.steps ?? []; track step) {
            <div class="criterion" [class.amber-border]="detailCard()?.category === 'legal'">{{ step }}</div>
          }
          <button class="btn ghost full" type="button" (click)="openConsultation(detailCard()!)">Registrar consulta</button>
          <a class="btn full center" routerLink="/student/toolkit">Volver a recursos</a>
        </section>
      } @else {
        <div class="resource-grid">
          @for (card of visibleCards(); track card.id) {
            @if (card.kind === 'protocol') {
              <a class="panel resource" [class.featured]="card.category === 'hospital'" [class.danger]="card.id === 'revictimization'" [routerLink]="protocolLink(card)">
                <span class="tag" [class.amber]="card.category === 'legal'" [class.green]="card.category === 'risk'">{{ card.source }}</span>
                <b [class.amber]="card.category === 'legal'" [class.green]="card.category === 'risk'">{{ icon(card) }}</b>
                <h2>{{ card.title }}</h2>
                <p>{{ card.summary }}</p>
                <em>Acceder</em>
              </a>
            } @else {
              <article class="panel resource backend-tool">
                <span class="tag" [class.green]="card.kind === 'tool'">{{ card.source }}</span>
                <b [class.green]="card.kind === 'tool'">{{ icon(card) }}</b>
                <h3>{{ card.title }}</h3>
                <p>{{ card.summary }}</p>
                @if (selectedCard?.id === card.id) {
                  <div class="resource-detail">
                    <p>{{ card.body }}</p>
                    @if (card.resource?.referencia_bibliografica) { <small>{{ card.resource?.referencia_bibliografica }}</small> }
                  </div>
                }
                <div class="actions">
                  <button class="btn secondary" type="button" (click)="toggleDetail(card)">{{ selectedCard?.id === card.id ? 'Ocultar detalle' : 'Ver detalle' }}</button>
                  <button class="btn ghost" type="button" (click)="openConsultation(card)">{{ card.kind === 'resource' ? 'Registrar lectura' : 'Registrar consulta' }}</button>
                </div>
              </article>
            }
          } @empty {
            <section class="panel panel-pad empty"><h3>Sin coincidencias</h3><p>Ajuste la búsqueda o vuelva a la pestaña Todos.</p></section>
          }
        </div>
      }

      @if (consultingCard) {
        <section class="panel panel-pad consultation" id="consulta-herramienta">
          <div class="form-title"><div><p class="eyebrow">Registro</p><h2>{{ consultingCard.title }}</h2></div><button class="close" type="button" (click)="closeConsultation()">Cerrar</button></div>
          <div class="grid desktop-2 form-grid">
            <label><span>Objetivo de uso</span><textarea class="field short" [(ngModel)]="draft.objetivo" placeholder="¿Para qué consulta esta herramienta?"></textarea></label>
            <label><span>Hallazgos principales</span><textarea class="field short" [(ngModel)]="draft.hallazgos" placeholder="Riesgos, recursos, actores o datos clave..."></textarea></label>
            <label><span>Acciones definidas</span><textarea class="field short" [(ngModel)]="draft.acciones" placeholder="Siguientes pasos técnicos o rutas de atención..."></textarea></label>
            <label><span>Observaciones</span><textarea class="field short" [(ngModel)]="draft.observaciones" placeholder="Notas para bitácora o seguimiento..."></textarea></label>
          </div>
          <button class="btn full" type="button" [disabled]="saving || !draft.objetivo.trim()" (click)="submitConsultation()">{{ saving ? 'Registrando...' : 'Guardar consulta' }}</button>
        </section>
      }
    </div><app-bottom-nav /></main>
  `,
  styles: [`
    .toolkit-page{padding-bottom:100px}.tabs{display:flex;gap:8px;margin:0 0 20px;overflow:auto}.tabs a{padding:10px 14px;border:1px solid rgba(184,211,214,.25);color:#c6ced0;background:#20242b;font:12px var(--mono);white-space:nowrap}.tabs a.active{color:#00171c;background:var(--cyan)}.notice{padding:12px 14px;margin-bottom:14px;border-color:rgba(0,232,148,.45);color:var(--green);font:12px var(--mono)}.notice.error{border-color:rgba(232,67,81,.55);color:var(--coral)}.resource-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.resource{display:grid;gap:9px;padding:20px}.featured,.backend-tool,.danger{grid-column:1/-1}.resource>b{font-size:28px;color:var(--cyan)}.resource em{color:var(--cyan);font:14px var(--mono);text-align:right}.danger{border-color:rgba(232,67,81,.55)}.danger b,.danger h2,.danger h3{color:var(--coral)}.actions{display:flex;gap:10px;flex-wrap:wrap}.resource-detail{padding:12px;border-left:3px solid var(--cyan);background:#101821}.resource-detail p{font-size:14px}.resource-detail small{display:block;margin-top:8px;color:var(--muted);font:12px var(--mono)}.detail{max-width:640px}.detail h1{font-size:42px}.criterion{padding:13px;border-left:3px solid var(--green);color:#cbd6d8;background:#171d22}.amber-border{border-left-color:var(--amber)}.center{display:grid;place-items:center}.consultation{margin-top:16px;border-color:rgba(0,229,244,.45)}.form-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.form-grid{gap:12px}.form-grid label{display:grid;gap:8px;color:var(--muted);font:12px var(--mono);text-transform:uppercase}.short{min-height:82px}.close{border:1px solid rgba(184,211,214,.28);color:var(--cyan);background:transparent;font:12px var(--mono);padding:8px 12px}.empty{grid-column:1/-1}.btn:disabled{opacity:.55;cursor:not-allowed}@media(max-width:640px){.resource-grid{grid-template-columns:1fr}.actions{display:grid}}
  `]
})
export class ToolkitPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly state = inject(StudentStateService);
  loading = false;
  saving = false;
  notice = '';
  noticeTone: 'ok' | 'error' = 'ok';
  selectedCard: ToolkitCard | null = null;
  consultingCard: ToolkitCard | null = null;
  draft: ToolUseDraft = this.emptyDraft();
  readonly section = toSignal(this.route.paramMap.pipe(map(params => params.get('section') ?? '')), { initialValue: '' });
  readonly tabs = [{ id: '', label: 'Todos' }, { id: 'hospital', label: 'Hospital' }, { id: 'legal', label: 'Normativa' }, { id: 'risk', label: 'Riesgo' }];
  readonly protocols: ToolkitCard[] = [
    { id: 'hospital-care', kind: 'protocol', title: 'Atención hospitalaria', category: 'hospital', summary: 'Primeros Auxilios Psicológicos, crisis, duelo inicial y protocolo EPICEE.', body: 'Priorice seguridad, estabilización médica, contención emocional y comunicación de malas noticias con protocolo EPICEE/SPIKES.', source: 'Escenario 1', steps: ['Contener antes de comunicar noticias críticas.', 'Aplicar escucha activa sin juicios.', 'Esperar condiciones clínicas mínimas para hablar con la víctima.', 'Comunicar fallecimiento con protocolo EPICEE/SPIKES.'] },
    { id: 'legal-route', kind: 'protocol', title: 'Ruta de protección integral', category: 'legal', summary: 'Resolución 459, Ley 1257, Ley 2126 y Ley 1098.', body: 'Integre rutas sanitarias, protección frente a violencia basada en género, Comisaría de Familia y protección de niños, niñas y adolescentes.', source: 'Marco normativo', steps: ['Resolución 459 de 2012: atención integral en salud.', 'Ley 1257 de 2008: protección frente a violencia contra las mujeres.', 'Ley 2126 de 2021: funciones de Comisarías de Familia.', 'Ley 1098 de 2006: protección de niños, niñas y adolescentes.'] },
    { id: 'risk-protection', kind: 'protocol', title: 'Riesgo y protección', category: 'risk', summary: 'Valoración de riesgo de feminicidio y medidas de protección.', body: 'Evalúe amenazas, ataques previos, control coercitivo, armas, aislamiento, dependencia y rutas de protección inmediata.', source: 'Valoración de riesgo', steps: ['Identificar riesgo de feminicidio y señales de escalamiento.', 'Orientar medidas de alejamiento, protección policial y acceso a justicia.', 'Derivar a psicología clínica, psiquiatría y acompañamiento psicosocial.', 'Registrar red de apoyo y plan de seguridad.'] },
    { id: 'revictimization', kind: 'protocol', title: 'Evitar revictimización', category: 'risk', summary: 'No interrogar a la víctima en urgencia, no promover mediación con el agresor y no culpabilizar por la elección de pareja.', body: 'Intervenga sin exponer, juzgar ni forzar relatos innecesarios durante la atención inicial.', source: 'Cuidado ético', steps: ['Preguntar solo lo necesario para seguridad y atención.', 'Validar emociones sin emitir juicios.', 'Separar a agresor y víctima durante la atención.', 'Documentar con lenguaje técnico y cuidadoso.'] }
  ];

  constructor() { void this.reload(false); }

  async reload(showNotice = true): Promise<void> {
    this.loading = true;
    if (showNotice) this.notice = '';
    await this.state.refreshBackendData();
    this.loading = false;
    if (!showNotice) return;
    this.noticeTone = this.state.backendOnline() ? 'ok' : 'error';
    this.notice = this.state.backendOnline() ? 'Herramientas sincronizadas con Django.' : 'No se pudo conectar con Django. Puede consultar y registrar localmente.';
  }

  visibleCards(): ToolkitCard[] {
    return this.allCards();
  }

  detailCard(): ToolkitCard | null {
    const section = this.section();
    if (section === 'hospital') return this.protocols.find(card => card.category === 'hospital') ?? null;
    if (section === 'legal') return this.protocols.find(card => card.category === 'legal') ?? null;
    if (section === 'risk') return this.protocols.find(card => card.id === 'risk-protection') ?? null;
    return null;
  }

  protocolLink(card: ToolkitCard): string[] {
    if (card.category === 'legal') return ['/student/toolkit', 'legal'];
    if (card.category === 'risk') return ['/student/toolkit', 'risk'];
    return ['/student/toolkit', 'hospital'];
  }

  toggleDetail(card: ToolkitCard): void {
    this.selectedCard = this.selectedCard?.id === card.id ? null : card;
  }

  openConsultation(card: ToolkitCard): void {
    this.selectedCard = card;
    this.consultingCard = card;
    this.draft = this.emptyDraft(card);
    this.notice = '';
    setTimeout(() => document.getElementById('consulta-herramienta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  closeConsultation(): void {
    this.consultingCard = null;
    this.draft = this.emptyDraft();
  }

  async submitConsultation(): Promise<void> {
    if (!this.consultingCard || !this.draft.objetivo.trim()) return;
    this.saving = true;
    this.notice = '';
    if (this.consultingCard.kind === 'tool' && this.consultingCard.tool) {
      const result = await this.state.recordToolUse(this.consultingCard.tool.id, this.draft);
      this.noticeTone = result.ok ? 'ok' : 'error';
      this.notice = result.message;
    } else {
      localStorage.setItem(`toolkit_local_${Date.now()}`, JSON.stringify({ card: this.consultingCard.title, draft: this.draft, createdAt: new Date().toISOString() }));
      this.noticeTone = 'ok';
      this.notice = this.consultingCard.kind === 'resource' ? 'Lectura registrada localmente.' : 'Consulta de protocolo registrada localmente.';
    }
    this.saving = false;
    this.closeConsultation();
  }

  icon(card: ToolkitCard): string {
    if (card.kind === 'tool') return 'T';
    if (card.kind === 'resource') return 'R';
    return card.category === 'legal' ? 'L' : card.category === 'risk' ? 'R' : 'H';
  }

  private allCards(): ToolkitCard[] {
    const tools = this.state.apiTools().map(tool => ({
      id: `tool-${tool.id}`,
      kind: 'tool' as const,
      title: tool.nombre,
      category: 'academic' as const,
      summary: tool.descripcion || tool.instrucciones || 'Herramienta profesional disponible en el servidor.',
      body: tool.instrucciones || tool.descripcion || 'Registre su uso dentro del intento activo.',
      source: 'Servidor Django',
      tool
    }));
    const resources = this.state.apiResources().map(resource => ({
      id: `resource-${resource.id}`,
      kind: 'resource' as const,
      title: resource.titulo,
      category: 'academic' as const,
      summary: resource.resumen || resource.contenido || 'Recurso académico del caso.',
      body: resource.contenido || resource.resumen || 'Sin contenido extendido.',
      source: 'Recurso académico',
      resource
    }));
    return [...this.protocols, ...tools, ...resources];
  }

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private emptyDraft(card?: ToolkitCard): ToolUseDraft {
    return {
      objetivo: card ? `Consultar ${card.title} para el caso ${this.state.selectedCase().reference}.` : '',
      hallazgos: '',
      acciones: '',
      observaciones: ''
    };
  }
}
