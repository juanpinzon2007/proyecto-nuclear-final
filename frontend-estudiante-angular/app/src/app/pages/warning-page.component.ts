import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';

@Component({
  standalone: true,
  template: `
    <main class="screen warning-page scanlines"><div class="content narrow">
      <section class="panel warning-card">
        <div class="warning-icon pulse">!</div><h1>Advertencia de contenido sensible</h1><div class="amber-line"></div>
        <p>Esta simulación aborda <b>{{ state.selectedCase().warning || 'violencia basada en género y duelo traumático' }}</b></p>
        <blockquote>El propósito es estrictamente académico. Si el contenido genera malestar, suspenda la actividad y solicite acompañamiento docente o institucional.</blockquote>
        <p>Al continuar, confirma que comprende el alcance académico, ético y emocional de la actividad.</p>
        <div class="attempt-box"><span>Intentos</span><b>Ilimitados</b></div>
        <label class="consent"><input type="checkbox" (change)="accepted = !accepted"><span>Acepto las condiciones de uso académico y ético</span></label>
        <button class="btn full amber-btn" [disabled]="!accepted" (click)="start()">Continuar a la simulación</button>
        <div class="spectrum"><i></i><i></i><i></i></div>
      </section><div class="spread footer mono"><span>Simulación activa</span><span>CASO-PS-001</span></div>
    </div></main>
  `,
  styles: [`
    .warning-page{display:grid;place-items:center}.warning-card{margin-top:56px;padding:26px 30px}.warning-icon{color:var(--amber);font:76px var(--display);text-align:center}.warning-card h1{color:var(--amber);font-family:Georgia,serif;font-size:38px;line-height:1.08;text-align:center;text-transform:uppercase;text-shadow:0 0 14px rgba(255,184,0,.35)}.amber-line{width:80px;height:1px;margin:20px auto 28px;background:var(--amber)}.warning-card p{color:#e4e3df;font-family:Georgia,serif}.warning-card b{color:var(--amber)}blockquote{margin:28px 0;padding-left:18px;border-left:3px solid #5d6366;color:#bec4c5;font:italic 16px/1.55 Georgia,serif}.attempt-box{display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding:12px 14px;border:1px solid rgba(255,184,0,.45);background:rgba(255,184,0,.08);font:13px var(--mono);text-transform:uppercase}.attempt-box b{font-size:18px}.limit{margin-top:10px;padding:10px;border:1px solid rgba(232,67,81,.55);color:var(--coral);font-size:12px}.consent{display:flex;gap:16px;margin:34px 0 24px;color:#dce4e5;font:15px Georgia,serif}.consent input{width:24px;height:24px;accent-color:var(--amber)}.spectrum{display:grid;grid-template-columns:1fr .3fr 2fr;margin-top:38px;gap:4px}.spectrum i{height:5px;background:var(--amber)}.spectrum i:nth-child(2){background:#475d5e}.spectrum i:nth-child(3){background:var(--coral)}.footer{padding:18px 4px;color:#6c7376;font-size:12px}
  `]
})
export class WarningPageComponent {
  readonly state = inject(StudentStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  accepted = false;
  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.state.selectCase(id);
  }
  async start(): Promise<void> {
    if (!this.state.beginSimulationAttempt()) return;
    await this.state.startAttempt();
    void this.router.navigate(['/student/simulation', this.route.snapshot.paramMap.get('id') ?? 'caso-violencia-familiar-001', 'hospital-q1']);
  }
}
