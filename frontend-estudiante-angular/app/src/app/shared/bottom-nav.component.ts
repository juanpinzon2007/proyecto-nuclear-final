import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/student/dashboard" routerLinkActive="active"><b>Panel</b><span>Inicio</span></a>
      <a routerLink="/student/cases" routerLinkActive="active"><b>Caso</b><span>Casos activos</span></a>
      <a routerLink="/student/toolkit" routerLinkActive="active"><b>Guía</b><span>Herramientas</span></a>
      <a routerLink="/student/competencies" routerLinkActive="active"><b>Notas</b><span>Resultados</span></a>
    </nav>
  `,
  styles: [`
    .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:30;height:72px;display:flex;justify-content:center;background:#090c12;border-top:1px solid rgba(184,211,214,.22)}
    a{width:min(25%,150px);display:grid;place-items:center;align-content:center;gap:4px;color:#7e898d;font-family:var(--mono);font-size:10px;text-transform:uppercase;transition:.2s}
    b{font-size:12px;font-weight:700}a:hover,a.active{color:var(--cyan);background:rgba(0,229,244,.08);box-shadow:inset 0 3px var(--cyan)}
  `]
})
export class BottomNavComponent {}
