import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="screen scanlines"><div class="content narrow recovery">
      <div class="brand">Simulador psicosocial</div>
      <section class="panel panel-pad stack">
        <div class="lock pulse">⌁</div>
        <p class="eyebrow">Recuperación de acceso</p>
        <h1>Restablecer contraseña</h1>
        <p>Use el formulario seguro del estudiante para actualizar su contraseña. Si requiere soporte, contacte al área institucional correspondiente.</p>
        <label><span class="mono">Correo institucional</span><input class="field" [(ngModel)]="email" placeholder="estudiante.demo@cue.edu.co"></label>
        @if (sent) { <div class="success mono">Solicitud registrada para revisión institucional.</div> }
        <a class="btn full center" routerLink="/change-password">Cambiar contraseña</a>
        <button class="btn secondary full" (click)="sent = true">Solicitar soporte</button>
        <a class="mono cyan center" routerLink="/login">Volver al login</a>
      </section>
    </div></main>
  `,
  styles: [`
    .recovery{padding-top:80px}.brand{margin-bottom:28px;color:var(--cyan);font:700 16px var(--mono);letter-spacing:2px;text-align:center}.lock{font:52px var(--mono);color:var(--cyan);text-align:center}.center{text-align:center;font-size:13px;display:grid;place-items:center}.success{padding:12px;border:1px solid rgba(0,232,148,.4);color:var(--green);font-size:13px}label span{font-size:12px}
  `]
})
export class RecoveryPageComponent { email = ''; sent = false; }

