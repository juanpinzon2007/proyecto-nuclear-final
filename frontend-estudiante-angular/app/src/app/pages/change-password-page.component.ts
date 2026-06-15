import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StudentApiService } from '../core/student-api.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="password-page scanlines">
      <div class="password-wrap">
        <section class="brand-card">
          <img src="/assets/humboldt-logo.png" alt="Logo Universidad Alexander von Humboldt">
          <div>
            <p class="eyebrow">Módulo estudiante</p>
            <h1>Cambiar contraseña</h1>
          </div>
        </section>

        <section class="panel password-card">
          <label><span class="mono">Correo institucional</span><input class="field" [(ngModel)]="correo" autocomplete="email" placeholder="estudiante.demo@cue.edu.co"></label>
          <label><span class="mono">Contraseña actual</span><input class="field" [(ngModel)]="claveActual" type="password" autocomplete="current-password" placeholder="Ingrese su contraseña actual"></label>
          <label><span class="mono">Nueva contraseña</span><input class="field" [(ngModel)]="nuevaClave" type="password" autocomplete="new-password" placeholder="Ingrese la nueva contraseña"></label>
          <label><span class="mono">Confirmar nueva contraseña</span><input class="field" [(ngModel)]="confirmarClave" type="password" autocomplete="new-password" placeholder="Repita la nueva contraseña"></label>
          @if (message) { <div class="message mono" [class.error]="messageType === 'error'">{{ message }}</div> }
          <button class="btn full" [disabled]="loading" (click)="submit()">{{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}</button>
          <a class="back mono" routerLink="/login">Volver al login del estudiante</a>
        </section>
      </div>
    </main>
  `,
  styles: [`
    .password-page{min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,rgba(3,7,12,.84),rgba(3,7,12,.58) 42%,rgba(3,7,12,.92)),url('/assets/login-background.png') center/cover fixed no-repeat}.password-wrap{width:min(100%,560px);padding:24px 20px 38px}.brand-card{display:grid;grid-template-columns:112px 1fr;gap:18px;align-items:center;margin-bottom:24px;padding:18px;border:1px solid rgba(184,211,214,.18);background:rgba(255,255,255,.96);color:#10141b}.brand-card img{width:100%;height:86px;object-fit:contain}.brand-card h1{color:#0d3038;font-size:34px}.brand-card .eyebrow{color:#00606b}.password-card{display:grid;gap:16px;padding:24px 28px 28px}.password-card label{color:#d2d9da;font-size:12px}.field{background:#05070a!important;color:#fff!important}.field:-webkit-autofill{-webkit-text-fill-color:#fff;box-shadow:0 0 0 1000px #05070a inset}.message{padding:10px;border:1px solid rgba(0,232,148,.45);color:var(--green);font-size:12px;line-height:1.4}.message.error{border-color:rgba(232,67,81,.55);color:var(--coral)}.back{display:block;text-align:center;color:var(--cyan);font-size:13px}@media(max-width:520px){.brand-card{grid-template-columns:1fr;text-align:center}.brand-card img{height:76px}}
  `]
})
export class ChangePasswordPageComponent {
  private readonly api = inject(StudentApiService);
  private readonly router = inject(Router);
  correo = 'estudiante.demo@cue.edu.co';
  claveActual = '';
  nuevaClave = '';
  confirmarClave = '';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  async submit(): Promise<void> {
    this.message = '';
    if (!this.correo || !this.claveActual || !this.nuevaClave || !this.confirmarClave) {
      this.showError('Complete todos los campos.');
      return;
    }
    if (this.nuevaClave !== this.confirmarClave) {
      this.showError('Las contraseñas nuevas no coinciden.');
      return;
    }
    this.loading = true;
    try {
      const response = await this.api.changePassword(this.correo, this.claveActual, this.nuevaClave, this.confirmarClave);
      this.messageType = 'success';
      this.message = response.detail || 'Contraseña actualizada correctamente.';
      setTimeout(() => void this.router.navigate(['/login']), 900);
    } catch (error: any) {
      const detail = error?.error?.detail;
      const errors = error?.error?.errors;
      this.showError(detail || this.firstError(errors) || 'No fue posible actualizar la contraseña.');
    } finally {
      this.loading = false;
    }
  }

  private showError(value: string): void {
    this.messageType = 'error';
    this.message = value;
  }

  private firstError(errors: unknown): string {
    if (!errors || typeof errors !== 'object') return '';
    const values = Object.values(errors as Record<string, unknown>);
    const first = values[0];
    return Array.isArray(first) ? String(first[0] ?? '') : String(first ?? '');
  }
}
