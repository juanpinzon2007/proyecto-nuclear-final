import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { COMPETENCIES } from '../core/mock-data';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="EVOLUCIÓN DE COMPETENCIAS" /><div class="content narrow">
      <p class="eyebrow">INFORME EVOLUTIVO // NIVEL 08</p><h1>Evolución de competencias</h1><p class="intro">Comparativo de desempeño basado en simulaciones clínicas completadas.</p>
      <div class="result-graph float"><i></i><i></i><i></i><i></i><span>84%</span></div>
      <div class="stack">@for (item of competencies; track item.name) { <div class="panel panel-pad competence"><div class="spread"><b>{{ item.name }}</b><span class="mono" [style.color]="item.color">{{ item.score }}%</span></div><div class="meter"><span [style.--value.%]="item.score" [style.--meter-color]="item.color"></span></div></div> }</div>
      <section class="panel panel-pad stack report"><p class="eyebrow green">PATRÓN FORMATIVO DETECTADO</p><p>Su precisión diagnóstica se mantiene estable. La siguiente fase debe reforzar intervención bajo crisis aguda.</p></section>
      <a class="btn full center" routerLink="/student/dashboard">VOLVER AL PANEL</a>
    </div><app-bottom-nav /></main>
  `,
  styles: [`
    .intro{margin-top:10px}.result-graph{height:210px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;align-items:end;padding:34px 28px 26px;border:1px solid rgba(0,229,244,.22);background:radial-gradient(circle at 50% 35%,rgba(0,232,148,.16),transparent 42%),rgba(5,8,13,.38);position:relative}.result-graph i{display:block;border:1px solid rgba(0,229,244,.35);background:linear-gradient(180deg,var(--cyan),rgba(0,229,244,.14));box-shadow:0 0 18px rgba(0,229,244,.18)}.result-graph i:nth-child(1){height:58%}.result-graph i:nth-child(2){height:76%;background:linear-gradient(180deg,var(--green),rgba(0,232,148,.12))}.result-graph i:nth-child(3){height:88%;background:linear-gradient(180deg,var(--amber),rgba(255,184,0,.12))}.result-graph i:nth-child(4){height:64%}.result-graph span{position:absolute;right:18px;top:14px;color:var(--green);font:28px var(--mono)}.competence{display:grid;gap:10px}.competence b{text-transform:uppercase;font:14px var(--mono)}.report{margin-top:20px}.center{display:grid;place-items:center;margin-top:16px}
  `]
})
export class CompetenciesPageComponent { readonly competencies = COMPETENCIES; }
