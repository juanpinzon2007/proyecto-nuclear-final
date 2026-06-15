import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="screen scanlines"><div class="content narrow biometric">
      <p class="eyebrow center">CONFIGURACIÓN DE ACCESO</p><h1 class="center">Seguridad Biométrica</h1>
      <p class="center">Sincronice su firma neural para habilitar el acceso protegido al entorno clínico.</p>
      <div class="fingerprint pulse">◉</div>
      <section class="panel panel-pad stack">
        <div class="spread"><span class="mono">LECTURA_BIOMÉTRICA</span><span class="green mono">VALIDADA</span></div>
        <div class="meter"><span style="--value:100%;--meter-color:var(--green)"></span></div>
        <div class="spread mono"><span class="dim">COINCIDENCIA</span><b class="green">98.7%</b></div>
      </section>
      <button class="btn full" (click)="continue()">CONTINUAR_CON_BIO_SYNC</button>
      <a class="mono cyan center" routerLink="/login">USAR_CÓDIGO_DE_ACCESO</a>
    </div></main>
  `,
  styles: [`
    .biometric{display:grid;gap:18px;padding-top:70px}.center{text-align:center}.fingerprint{width:170px;height:170px;display:grid;place-items:center;margin:20px auto;border:1px solid var(--line-strong);border-radius:50%;color:var(--cyan);font:90px var(--mono);box-shadow:0 0 34px rgba(0,229,244,.2)}a{font-size:13px}
  `]
})
export class BiometricPageComponent {
  private readonly router = inject(Router);
  continue(): void { void this.router.navigate(['/student/onboarding', 'analysis']); }
}
