import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="PROGRESIÓN ACADÉMICA" />
      <div class="content">
        <section class="panel panel-pad stack"><div class="spread"><div><p class="eyebrow dim">ESTADO DEL PRACTICANTE</p><h1>Nivel 14: Analista</h1></div><div class="rank"><span>RANK</span><b>A+</b></div></div><div class="spread mono"><span>PROGRESIÓN FORMATIVA</span><b>84%</b></div><div class="meter segmented">@for (item of segments; track item) { <i [class.on]="item < 9"></i> }</div></section>
        <div class="grid desktop-2 mini"><div class="panel"><span>CASOS CON ÉXITO</span><b>42</b></div><div class="panel"><span>COMPETENCIAS</span><b class="green">12</b></div></div>
        <h2 class="section-title">Insignias de competencia</h2>
        <div class="stack stagger">@for (badge of badges; track badge.title) { <article class="panel badge" [class.locked]="badge.locked"><div class="badge-icon">{{ badge.icon }}</div><div><span class="tag" [class.dim]="badge.locked">{{ badge.locked ? 'BLOQUEADO' : 'DESBLOQUEADO' }}</span><h3>{{ badge.title }}</h3><p>{{ badge.body }}</p></div></article> }</div>
        <section class="panel panel-pad spread milestone"><div><p class="eyebrow amber">PRÓXIMO HITO</p><h3>Certificación Senior de Campo</h3></div><a class="btn center" routerLink="/student/competencies">INICIAR PRUEBA</a></section>
      </div><app-bottom-nav />
    </main>
  `,
  styles: [`
    .rank{padding:9px 18px;border:1px solid rgba(184,211,214,.3);background:#282d34;text-align:center;font-family:var(--mono)}.rank span{display:block;color:var(--cyan)}.rank b{font-size:23px}.mini{margin-top:18px}.mini>div{display:grid;gap:7px;padding:22px;border-left:4px solid var(--cyan);font:16px var(--mono)}.mini b{font-size:24px}.badge{display:grid;grid-template-columns:82px 1fr;gap:16px;padding:18px;border-right:4px solid var(--cyan)}.badge-icon{display:grid;place-items:center;border:1px solid var(--line-strong);border-radius:12px;color:var(--cyan);font-size:30px}.badge h3{margin:7px 0 3px}.locked{opacity:.35;border-right-color:#596368}.milestone{margin-top:28px}.milestone h3{margin-top:9px}.milestone .btn{font-size:12px}.center{display:grid;place-items:center;text-align:center}
  `]
})
export class AchievementsPageComponent {
  readonly segments = Array.from({ length: 10 }, (_, index) => index);
  readonly badges = [
    { icon: 'A+', title: 'Maestro de la desescalada', body: 'Manejo de conflictos de alta volatilidad sin intervención externa.', locked: false },
    { icon: 'ET', title: 'Ética inquebrantable', body: 'Mantenimiento de protocolos ante simulaciones de corrupción sistémica.', locked: false },
    { icon: 'DX', title: 'Diagnóstico flash', body: 'Identificación de riesgo crítico en los primeros 180 segundos.', locked: true },
    { icon: 'EQ', title: 'Sintonía empática', body: 'Sincronización empática superior al 95% con el sujeto.', locked: true }
  ];
}
