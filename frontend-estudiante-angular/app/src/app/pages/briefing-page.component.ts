import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen briefing scanlines"><app-neuro-header status="PREPARACIÓN DEL CASO" time="CASO-PS-001" />
      <div class="content">
        <div class="spread"><div><span class="tag">{{ clinicalCase().reference }}</span><p class="eyebrow case-name">Caso único disponible</p></div><div class="right"><span>Estado</span><b>Listo</b></div></div>
        <div class="location"><div class="city"><img src="/assets/humboldt-logo.png" alt="Logo Humboldt"></div><b>{{ clinicalCase().location }}</b></div>
        <div class="grid desktop-2 fact-grid"><div class="panel"><small>Complejidad</small><strong class="cyan">Alta</strong></div><div class="panel"><small>Intentos</small><strong class="cyan">Ilimitados</strong></div></div>
        <section class="panel panel-pad stack clinical"><div class="spread"><h3 class="cyan">Situación del caso</h3><span class="mono dim">violencia basada en género</span></div><p>{{ clinicalCase().summary }}</p><div class="note">Nota ética: no se busca interrogar ni culpabilizar a la víctima. La prioridad es seguridad, contención, derechos y rutas de atención.</div></section>
        <h2 class="section-title">Lo que puede hacer el estudiante</h2>
        <div class="stack actions">
          <div class="objective"><b>01</b><p>Analizar el contexto de urgencia hospitalaria y Comisaría de Familia.</p></div>
          <div class="objective"><b>02</b><p>Responder seis preguntas con opciones técnicas y recibir retroalimentación inmediata.</p></div>
          <div class="objective"><b>03</b><p>Consultar recursos profesionales y registrar uso de herramientas si el backend está activo.</p></div>
          <div class="objective"><b>04</b><p>Guardar una bitácora reflexiva y revisar el informe final del intento.</p></div>
        </div>
        <h2 class="section-title">Objetivos de aprendizaje</h2><div class="stack">@for (objective of clinicalCase().objectives; track objective; let index = $index) { <div class="objective"><b>0{{ index + 1 }}</b><p>{{ objective }}</p></div> }</div>
        <button class="btn full start" (click)="start()">Iniciar simulación</button>
      </div><app-bottom-nav />
    </main>
  `,
  styles: [`
    .case-name{margin-top:8px;font-size:20px}.right{display:grid;text-align:right;color:var(--muted);font-family:var(--display);font-size:22px}.right b{color:var(--green)}.location{margin-top:26px;border:1px solid var(--line);overflow:hidden}.city{height:220px;display:grid;place-items:center;background:#fff}.city img{width:min(80%,320px);height:170px;object-fit:contain}.location b{display:block;padding:16px;font:22px var(--display);text-transform:uppercase}.fact-grid{gap:10px;margin-top:14px}.fact-grid>div{display:grid;gap:10px;padding:20px;font-family:var(--mono)}.fact-grid strong{font-size:22px}.clinical{margin-top:28px}.clinical p{font-size:19px}.note{padding:12px;border:1px solid rgba(184,211,214,.2);color:var(--amber);background:#242b31;font:14px var(--mono)}.objective{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:18px;background:#0a1117}.objective b{color:#d8fafd;font:16px var(--mono)}.objective p{font-size:17px}.limit{margin-top:20px;padding:14px;color:var(--coral);border-color:rgba(232,67,81,.55);font:13px var(--mono);text-align:center}.start{margin-top:30px}
  `]
})
export class BriefingPageComponent {
  readonly state = inject(StudentStateService);
  readonly clinicalCase = this.state.selectedCase;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.state.selectCase(id);
  }
  async start(): Promise<void> {
    await this.state.startAttempt();
    void this.router.navigate(['/student/simulation', this.clinicalCase().id, 'consent']);
  }
}
