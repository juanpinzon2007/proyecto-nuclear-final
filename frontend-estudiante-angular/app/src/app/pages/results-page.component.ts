import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { COMPETENCIES } from '../core/mock-data';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="SIMULACIÓN COMPLETADA" time="CASO-PS-001" /><div class="content">
      <section class="panel panel-pad result-head">
        <div class="spread"><div><p class="eyebrow dim">Estado: intento finalizado</p><h1>Informe final<br>de resultados</h1></div><span class="ref mono">{{ state.selectedCase().reference }}</span></div>
        <div class="score-layout">
          <div class="score-ring" [style.--score.%]="state.score()"><div class="score-value"><span>{{ state.score() }}</span><small>/100</small></div></div>
          <div class="score-copy">
            <div class="spread mono"><span>Índice de desempeño global</span><b>{{ state.score() }}/100</b></div>
            <div class="meter"><span [style.--value.%]="state.score()"></span></div>
            <p class="summary">{{ state.apiFeedback()?.resumen || 'El desempeño fue consolidado a partir de las decisiones y la reflexión clínica registradas durante la simulación.' }}</p>
          </div>
        </div>
      </section>

      <section class="panel panel-pad chart-card">
        <div class="spread"><div><p class="eyebrow green">Gráfico de resultados</p><h2>Competencias evaluadas</h2></div><span class="tag green">Notas</span></div>
        <div class="chart-bars">
          @for (item of competencies; track item.name) {
            <div class="chart-row">
              <span>{{ item.name }}</span>
              <i><b [style.--value.%]="item.score" [style.background]="item.color"></b></i>
              <strong>{{ item.score }}</strong>
            </div>
          }
        </div>
      </section>

      <div class="grid desktop-3 competencies">@for (item of competencies; track item.name) { <article class="panel competency"><h3>{{ item.name }}</h3><b>{{ item.score }}<small>/100</small></b><div class="meter"><span [style.--value.%]="item.score" [style.--meter-color]="item.color"></span></div></article> }</div>
      <section class="panel panel-pad recommendations"><h3>Recomendaciones de mejora</h3><p>{{ state.apiFeedback()?.recomendaciones || 'Refuerce valoración de riesgo, comunicación de malas noticias, activación de rutas, medidas de protección y autocuidado profesional.' }}</p></section>
      <section class="panel panel-pad next"><p class="eyebrow dim">Siguiente paso recomendado</p><h2>Revisar la ruta normativa y repetir el caso</h2><span class="tag amber">Complejidad: alta</span><button class="btn full" (click)="restart()">Iniciar nuevo intento</button></section>
      <a class="btn secondary full center" routerLink="/student/toolkit">Consultar herramientas del caso</a>
      <section class="panel events"><h3>Eventos clave del caso</h3>@for (event of events; track event.time) { <div><span class="mono">{{ event.time }}</span><p>{{ event.text }}</p><b [class.amber]="event.tone === 'warning'">{{ event.icon }}</b></div> }</section>
    </div><app-bottom-nav /></main>
  `,
  styles: [`
    .result-head{display:grid;gap:15px}.ref{padding:9px;border:1px solid rgba(184,211,214,.3);background:#293038;font-size:13px}.score-layout{display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center}.score-ring{--score:76%;width:142px;height:142px;display:grid;place-items:center;position:relative;border-radius:50%;background:conic-gradient(var(--green) var(--score),rgba(184,211,214,.14) 0);box-shadow:0 0 28px rgba(0,232,148,.14)}.score-ring:after{content:'';position:absolute;inset:14px;border-radius:50%;background:#0d1219;border:1px solid rgba(184,211,214,.12)}.score-value{position:relative;z-index:1;display:grid;place-items:center;gap:0;line-height:1;text-align:center;font-family:var(--mono)}.score-value span{color:var(--green);font-size:42px}.score-value small{margin-top:4px;color:var(--muted);font-size:13px}.score-copy{display:grid;gap:12px}.summary{padding-top:12px;border-top:1px solid rgba(184,211,214,.14)}.chart-card{margin-top:14px;display:grid;gap:16px;background:linear-gradient(145deg,rgba(0,229,244,.07),rgba(0,232,148,.05)),rgba(16,20,27,.94)}.chart-bars{display:grid;gap:12px}.chart-row{display:grid;grid-template-columns:1.1fr 1.6fr 42px;gap:10px;align-items:center}.chart-row span{font:12px var(--mono);text-transform:uppercase;color:#cbd6d8}.chart-row i{height:14px;border:1px solid rgba(184,211,214,.18);background:#05080d;overflow:hidden}.chart-row b{display:block;height:100%;width:var(--value);box-shadow:0 0 18px currentColor}.chart-row strong{color:var(--cyan);font:16px var(--mono);text-align:right}.competencies{margin-top:12px}.competency{display:grid;gap:11px;padding:16px}.competency h3{text-transform:uppercase;font:14px var(--mono)}.competency b{color:var(--cyan);font:30px var(--mono)}.competency small{font-size:13px}.recommendations,.next{margin-top:14px}.recommendations h3,.events h3{font:14px var(--mono);letter-spacing:1px;text-transform:uppercase}.next{display:grid;gap:10px}.next .btn{margin-top:8px}.center{display:grid;place-items:center;margin-top:12px}.events{margin-top:12px}.events h3{padding:16px}.events div{display:grid;grid-template-columns:62px 1fr 26px;gap:10px;padding:13px;border-top:1px solid rgba(184,211,214,.1);align-items:center}.events p{font-size:13px}.events b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;border:1px solid rgba(0,232,148,.45);color:var(--green);font:15px var(--mono)}.events b.amber{border-color:rgba(255,184,0,.55);color:var(--amber)}@media(max-width:700px){.score-layout,.chart-row{grid-template-columns:1fr}.score-ring{margin:auto}.chart-row strong{text-align:left}}
  `]
})
export class ResultsPageComponent {
  readonly state = inject(StudentStateService);
  private readonly router = inject(Router);
  readonly competencies = COMPETENCIES;
  readonly events = [
    { time: 'E1-P1', text: 'Priorización de contención y Primeros Auxilios Psicológicos.', icon: '✓', tone: 'ok' },
    { time: 'E1-P3', text: 'Comunicación del fallecimiento con protocolo EPICEE.', icon: '!', tone: 'warning' },
    { time: 'E2-P3', text: 'Valoración de riesgo de feminicidio y rutas de protección.', icon: '✓', tone: 'ok' }
  ];
  constructor() { void this.state.loadFeedback(); }
  restart(): void { this.state.resetSimulation(); void this.router.navigate(['/student/cases']); }
}
