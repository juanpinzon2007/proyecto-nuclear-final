import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines dashboard-bg"><app-neuro-header />
      <div class="content">
        <section class="panel panel-pad hero">
          <div class="spread"><div><h2>Panel de Control</h2><p>Bienvenido de nuevo,<br>{{ state.studentName() }}</p></div><div class="level"><small>ACTIVOS</small><b>{{ state.studentStats().activeAttempts }}</b></div></div>
          <div class="spread xp"><span class="mono">PROGRESO DE XP</span><b class="mono">{{ state.xp() }} / 15,000</b></div>
          <div class="meter"><span style="--value:83%"></span></div><p class="session">+450 XP <small>Última sesión</small></p>
        </section>
        <section class="panel panel-pad stats stack">
          <p class="eyebrow">Estadísticas del estudiante</p><div class="spread"><span>Intentos finalizados</span><b>{{ state.studentStats().completedAttempts }}</b></div><div class="spread"><span>Puntaje promedio</span><b>{{ state.studentStats().averageScore }}/100</b></div><div class="spread"><span>Mejor puntaje</span><b>{{ state.studentStats().bestScore }}/100</b></div><div class="spread"><span>Intentos en progreso</span><b>{{ state.studentStats().activeAttempts }}</b></div>
          <a class="btn full center" routerLink="/student/profile">VER PERFIL COMPLETO</a>
        </section>

        <div class="spread section-title-wrap"><h2 class="section-title">Casos activos</h2><span class="mono">Caso disponible</span></div>
        <div class="grid desktop-2 stagger">
          @for (clinicalCase of state.displayCases(); track clinicalCase.id; let index = $index) {
            <article class="panel case-card">
              <div class="case-art" [class.alt]="index > 0"><span>Caso</span></div>
              <div class="grow stack-mini"><span class="tag" [class.amber]="index === 0">{{ index === 0 ? 'Prioridad alta' : 'Pendiente' }}</span><h3>{{ clinicalCase.name }}</h3><div class="spread"><span class="dim mono">{{ clinicalCase.reference }}</span><a [routerLink]="['/student/case', clinicalCase.id]" class="mono cyan">{{ index === 0 ? 'Continuar' : 'Iniciar' }}</a></div></div>
            </article>
          }
        </div>
        <div class="quick grid desktop-2">
          <a class="panel" routerLink="/student/toolkit"><b>Herr.</b><span>Herramientas</span></a><a class="panel" routerLink="/student/achievements"><b>Log.</b><span>Logros</span></a>
          <a class="panel" routerLink="/student/environments"><b>Ent.</b><span>Entornos</span></a><a class="panel" routerLink="/student/profile"><b>Perfil</b><span>Configuración</span></a>
        </div>
      </div><app-bottom-nav />
    </main>
  `,
  styles: [`
    .dashboard-bg{background:linear-gradient(90deg,rgba(4,8,13,.94),rgba(4,8,13,.76) 48%,rgba(4,8,13,.95)),linear-gradient(180deg,rgba(0,229,244,.12),rgba(4,8,13,.86)),url('/assets/onboarding-background.png') center/cover no-repeat fixed}.dashboard-bg .content{position:relative;z-index:4}.hero{display:grid;gap:14px;backdrop-filter:blur(10px)}.hero p{font-size:19px}.level{width:102px;padding:12px 18px;border:1px solid rgba(184,211,214,.4);background:#292e35;font:18px var(--mono)}.level small,.level b{display:block}.xp{margin-top:20px}.session{color:var(--green);font:22px var(--mono)}.session small{color:var(--muted);font-size:13px}.stats{margin-top:14px;backdrop-filter:blur(10px)}.center{display:grid;place-items:center}.section-title-wrap .section-title{margin-bottom:14px}.section-title-wrap>span{font-size:14px}.case-card{display:flex;gap:16px;padding:18px;backdrop-filter:blur(10px)}.case-art{width:112px;min-width:112px;display:grid;place-items:center;background:radial-gradient(circle,#036875,#041a24 36%,#060c12 72%);color:var(--cyan);font:24px var(--display);text-transform:uppercase;letter-spacing:1px}.case-art.alt{background:radial-gradient(circle,#673f20,#10202b 28%,#060c12 72%)}.stack-mini{display:grid;gap:9px}.case-card h3{font-size:21px}.case-card a{font-size:13px;text-transform:uppercase}.quick{gap:14px;margin-top:28px}.quick a{height:110px;display:grid;place-items:center;align-content:center;gap:14px;font:13px var(--mono);letter-spacing:1px;text-transform:uppercase;backdrop-filter:blur(10px)}.quick b{color:#c6faff;font-size:18px}
    @media(max-width:540px){.case-card{gap:12px;padding:13px}.case-art{width:92px;min-width:92px}.case-card h3{font-size:19px}}
  `]
})
export class DashboardPageComponent {
  readonly state = inject(StudentStateService);
  constructor() { void this.state.refreshBackendData(); }
}
