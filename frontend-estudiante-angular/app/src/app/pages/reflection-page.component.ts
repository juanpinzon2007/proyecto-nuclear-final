import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [FormsModule, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="BITÁCORA REFLEXIVA" time="CASO-PS-001" /><div class="content narrow">
      <p class="eyebrow">Cierre del intento</p><h1>Reflexión clínica y ética</h1><p class="intro">Registre su análisis del caso, la decisión que ajustaría y las acciones de autocuidado profesional.</p>
      <section class="panel panel-pad stack form-section"><h3><span>1</span> Análisis de la situación</h3><textarea class="field" [(ngModel)]="analysis" placeholder="Explique su razonamiento frente a la urgencia, la familia y la protección de derechos..."></textarea></section>
      <section class="panel panel-pad stack form-section"><h3><span class="green">2</span> Competencias trabajadas</h3><div class="tags">@for (tag of tags; track tag) { <button [class.active]="selectedTags.includes(tag)" (click)="toggle(tag)">{{ tag }}</button> }</div></section>
      <section class="panel panel-pad stack form-section"><h3><span class="amber">3</span> Carga cognitiva percibida</h3><div class="spread mono"><small>Baja</small><small>Media</small><small>Alta</small></div><input class="range" type="range" min="0" max="100" [(ngModel)]="cognitiveLoad"></section>
      <section class="panel panel-pad stack form-section"><h3><span>4</span> Acciones de mejora</h3><textarea class="field short" [(ngModel)]="improvement" placeholder="¿Qué cambiaría en una intervención similar?"></textarea></section>
      @if (state.error()) { <p class="amber mono">{{ state.error() }}</p> }
      <button class="btn full" [disabled]="!analysis || !improvement" (click)="finish()">Finalizar bitácora</button>
    </div></main>
  `,
  styles: [`
    .intro{margin-top:10px;font-size:18px}.form-section{margin-top:28px}.form-section h3{display:flex;gap:12px;font:16px var(--mono);letter-spacing:1.2px}.form-section h3 span{color:var(--cyan)}.tags{display:flex;gap:8px;flex-wrap:wrap}.tags button{padding:5px 13px;border:1px solid rgba(184,211,214,.16);border-radius:20px;color:#bdc8ca;background:transparent;font:13px var(--mono)}.tags button.active{border-color:var(--cyan);color:var(--cyan);background:rgba(0,229,244,.1)}.range{accent-color:var(--cyan);width:100%}.short{min-height:76px}.btn{margin-top:28px}
  `]
})
export class ReflectionPageComponent {
  readonly state = inject(StudentStateService);
  private readonly router = inject(Router);
  analysis = this.state.reflection().analysis;
  improvement = this.state.reflection().improvement;
  cognitiveLoad = this.state.reflection().cognitiveLoad;
  selectedTags = [...this.state.reflection().tags];
  readonly tags = ['Primeros Auxilios Psicológicos', 'Marco normativo', 'Valoración del riesgo', 'Ética profesional', 'No revictimización'];
  toggle(tag: string): void { this.selectedTags = this.selectedTags.includes(tag) ? this.selectedTags.filter(value => value !== tag) : [...this.selectedTags, tag]; }
  async finish(): Promise<void> { await this.state.saveReflection({ analysis: this.analysis, improvement: this.improvement, cognitiveLoad: this.cognitiveLoad, tags: this.selectedTags }); void this.router.navigate(['/student/results', this.state.selectedCaseId()]); }
}
