import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="login-page scanlines">
      <div class="login-wrap">
        <section class="brand-card">
          <img src="/assets/humboldt-logo.png" alt="Logo Universidad Alexander von Humboldt">
          <div>
            <p class="module">Módulo estudiante</p>
            <h1>Simulador psicosocial</h1>
            <small>Universidad Alexander von Humboldt</small>
          </div>
        </section>

        <section class="panel auth-card">
          <span class="tag green">Acceso exclusivo para estudiantes</span>
          <p>Ingrese con su correo institucional para comenzar la simulación.</p>
          <label><span>Correo institucional</span><div class="input-wrap"><i>✉</i><input class="field" [(ngModel)]="email" autocomplete="email" placeholder="estudiante.demo@cue.edu.co"></div></label>
          <label><span>Contraseña</span><div class="input-wrap"><i>⌘</i><input class="field" [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Ingrese su contraseña"><button type="button" (click)="showPassword = !showPassword">{{ showPassword ? 'Ocultar' : 'Ver' }}</button></div></label>
          @if (state.error()) { <div class="error mono">{{ state.error() }}</div> }
          <button class="btn full" [disabled]="state.loading()" (click)="login()">{{ state.loading() ? 'Conectando...' : 'Iniciar sesión' }}</button>
          <a class="forgot mono" routerLink="/recover">¿Olvidó su contraseña?</a>
          <div class="secure mono"><i></i><span>Conexión segura · datos de simulación local</span></div>
        </section>
      </div>
    </main>
  `,
  styles: [`
    .login-page{min-height:100vh;display:grid;place-items:center;background:linear-gradient(90deg,rgba(3,7,12,.9),rgba(3,7,12,.58) 48%,rgba(3,7,12,.92)),url('/assets/login-background.png') center/cover fixed no-repeat}.login-wrap{width:min(100%,520px);padding:24px 20px 38px}.brand-card{display:grid;grid-template-columns:106px 1fr;gap:18px;align-items:center;margin-bottom:18px;padding:18px 20px;border:1px solid rgba(0,229,244,.4);border-bottom:3px solid var(--cyan);background:rgba(255,255,255,.96);color:#10212a;box-shadow:0 18px 44px rgba(0,0,0,.3)}.brand-card img{width:100%;height:82px;object-fit:contain}.module{color:#00727e;font:12px var(--mono);letter-spacing:2px;text-transform:uppercase}.brand-card h1{color:#0d3038;font-size:34px;line-height:.96}.brand-card small{display:block;margin-top:5px;color:#536069;font:12px var(--mono)}.auth-card{display:grid;gap:15px;padding:22px 28px 26px;background:rgba(9,15,22,.95)}.auth-card p{font-size:13px}.auth-card label{display:grid;gap:8px;color:#aab7ba;font:12px var(--mono);letter-spacing:.9px;text-transform:uppercase}.input-wrap{position:relative;display:flex;align-items:center;border:1px solid rgba(184,211,214,.18);background:#05070a}.input-wrap i{width:42px;text-align:center;color:var(--cyan);font-style:normal}.field{border:0!important;background:transparent!important;color:#fff!important}.field:-webkit-autofill{-webkit-text-fill-color:#fff;box-shadow:0 0 0 1000px #05070a inset}.input-wrap button{margin-right:8px;padding:4px 8px;border:1px solid rgba(0,229,244,.55);border-radius:5px;color:var(--cyan);background:rgba(0,229,244,.08);font:11px var(--mono)}.btn.full{margin-top:2px}.forgot{text-align:center;color:var(--cyan);font-size:13px}.secure{display:flex;justify-content:center;align-items:center;gap:8px;color:#56656a;font-size:10px}.secure i{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green)}.error{padding:10px;border:1px solid rgba(232,67,81,.55);color:var(--coral);font-size:12px;line-height:1.4}@media(max-width:520px){.brand-card{grid-template-columns:1fr;text-align:center}.brand-card img{height:76px}}
  `]
})
export class AccessPageComponent {
  private readonly router = inject(Router);
  readonly state = inject(StudentStateService);
  email = 'estudiante.demo@cue.edu.co';
  password = 'estudiante123';
  showPassword = false;
  async login(): Promise<void> {
    if (!await this.state.login(this.email, this.password)) return;
    const role = this.state.apiUser()?.rol;
    void this.router.navigate(role === 'ESTUDIANTE' ? ['/student/onboarding', 'analysis'] : ['/admin/ia']);
  }
}
