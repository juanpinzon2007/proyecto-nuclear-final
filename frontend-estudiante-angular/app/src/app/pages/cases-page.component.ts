import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="CASO ACTIVO: 1" time="CASO-PS-001" />
      <div class="content">
        <p class="eyebrow amber">Módulo estudiante</p>
        <h1>Casos de simulación</h1>
        <p class="intro">Actualmente hay un único caso disponible. Revise el contexto, acepte la advertencia de contenido y responda las preguntas de los dos escenarios.</p>
        <div class="stack stagger subjects">
          @for (item of state.displayCases(); track item.id) {
            <article class="panel subject">
              <div class="subject-photo"><img src="/assets/humboldt-logo.png" alt="Logo Humboldt"></div><div class="grow">
                <span class="tag" [class.amber]="item.status === 'volatile'" [class.green]="item.status !== 'volatile'">{{ item.status === 'volatile' ? 'Alta sensibilidad' : 'Disponible' }}</span><h2>{{ item.name }}</h2>
                <p class="mono complexity">COMPLEJIDAD: <b>{{ bars(item.complexity) }}</b></p>
              </div><span class="mono dim ref">{{ item.reference }}</span>
              <p class="summary">{{ item.summary }}</p><button class="btn full" (click)="select(item.id)">Revisar caso e iniciar</button>
            </article>
          }
        </div>
      </div><app-bottom-nav />
    </main>
  `,
  styles: [`
    .intro{margin-top:12px;font-size:18px}.subjects{margin-top:30px}.subject{position:relative;display:grid;grid-template-columns:112px 1fr;gap:16px;padding:18px}.subject-photo{display:grid;place-items:center;height:112px;border:1px solid rgba(184,211,214,.25);background:#fff}.subject-photo img{width:92%;height:92%;object-fit:contain}.subject h2{margin-top:7px}.ref{position:absolute;right:15px;top:14px;font-size:11px}.complexity{margin-top:16px;font-size:13px}.complexity b{color:var(--green);letter-spacing:3px}.summary{grid-column:1/-1;padding-top:14px;border-top:1px solid rgba(184,211,214,.1);font-style:italic}.btn{grid-column:1/-1}
    @media (max-width:560px){.subject{grid-template-columns:1fr}.ref{position:static}.subject-photo{height:96px}}
  `]
})
export class CasesPageComponent {
  readonly state = inject(StudentStateService);
  private readonly router = inject(Router);
  bars(value: number): string { return '■'.repeat(value) + '□'.repeat(Math.max(0, 4 - value)); }
  constructor() { void this.state.refreshBackendData(); }
  async select(id: string): Promise<void> { await this.state.selectCase(id); void this.router.navigate(['/student/case', id]); }
}
