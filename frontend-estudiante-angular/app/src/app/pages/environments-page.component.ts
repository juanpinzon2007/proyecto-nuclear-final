import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="GALERÍA DE ENTORNOS" time="14:00" /><div class="content">
      <p class="eyebrow green">MÓDULO: ENTORNOS</p><h1>Entornos de simulación</h1><p class="intro">Seleccione un nodo para revisar los casos disponibles. Cada entorno evalúa competencias específicas en psicología clínica y social.</p>
      <div class="stack envs">@for (item of envs; track item.title; let index = $index) {
        <article class="panel env"><div class="env-art" [class.police]="index === 1" [class.community]="index === 2"><span class="tag">{{ item.status }}</span></div><div class="panel-pad stack"><h2>{{ item.title }}</h2><p>{{ item.body }}</p><div class="tags">@for (tag of item.tags; track tag) { <span class="tag dim">{{ tag }}</span> }</div><a class="btn full center" [routerLink]="item.link">{{ item.action }} >></a></div></article>
      }</div>
    </div><app-bottom-nav /></main>
  `,
  styles: [`
    .intro{margin-top:8px}.envs{margin-top:24px}.env-art{height:210px;position:relative;background:linear-gradient(180deg,rgba(0,229,244,.1),rgba(0,0,0,.72)),repeating-linear-gradient(90deg,#142d38 0 5px,#08141b 5px 64px)}.env-art.police{background:linear-gradient(180deg,rgba(255,184,0,.08),rgba(0,0,0,.75)),repeating-linear-gradient(90deg,#2e2c2a 0 5px,#111315 5px 88px)}.env-art.community{background:linear-gradient(180deg,rgba(0,232,148,.08),rgba(0,0,0,.7)),repeating-linear-gradient(90deg,#1d332b 0 4px,#0b1615 4px 76px)}.env-art .tag{position:absolute;top:16px;right:16px}.tags{display:flex;flex-wrap:wrap;gap:7px}.center{display:grid;place-items:center}
  `]
})
export class EnvironmentsPageComponent {
  readonly envs = [
    { title: 'Centro hospitalario: ala oeste', status: 'ESTADO: OPERATIVO', body: 'Simulación de triaje psicológico y gestión de crisis en entornos de alta presión médica.', tags: ['MANEJO DE CRISIS', 'EMPATÍA CLÍNICA'], action: 'VER CASOS', link: '/student/cases' },
    { title: 'Unidad policial', status: 'DIFICULTAD: ALTA', body: 'Entorno de apoyo a víctimas, valoración de veracidad y contención emocional inmediata.', tags: ['PROTOCOLO LEGAL', 'EVALUACIÓN'], action: 'VER CASOS', link: '/student/cases' },
    { title: 'Centro comunitario', status: 'ÉTICA SOCIAL', body: 'Intervención en grupos vulnerables, mediación de conflictos y análisis de dinámicas de grupo.', tags: ['MEDIACIÓN', 'RED DE APOYO'], action: 'VER CASOS', link: '/student/cases' }
  ];
}
