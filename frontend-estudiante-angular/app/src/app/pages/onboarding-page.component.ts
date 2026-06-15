import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { StudentStateService } from '../core/student-state.service';

@Component({
  standalone: true,
  template: `
    <main class="screen scanlines onboarding-bg"><div class="content narrow onboard">
      <div class="spread"><span class="brand">Simulador psicosocial</span><span class="mono cyan">Paso {{ stepNumber() }}/3</span></div>
      @if (step() === 'analysis') {
        <section class="analysis stack">
          <p class="eyebrow">Preparación académica</p><h1>Antes de iniciar</h1>
          <div class="face float"><img src="/assets/humboldt-logo.png" alt="Logo Humboldt"></div>
          <div class="panel panel-pad stack alert"><b class="mono coral">Contenido sensible</b><p>El caso aborda violencia familiar, tentativa de feminicidio, muerte de una niña y duelo traumático.</p></div>
          <div class="panel panel-pad stack"><b class="mono green">Caso único detectado</b><div class="meter"><span style="--value:100%;--meter-color:var(--green)"></span></div></div>
          <button class="btn full" (click)="go('profile')">Continuar</button>
        </section>
      } @else if (step() === 'profile') {
        <section class="stack">
          <p class="eyebrow">Perfil del estudiante</p><h1>Validación académica</h1><p>Confirme que ingresará con su correo institucional al protocolo formativo.</p>
          <div class="id-card panel panel-pad stack">
            <figure class="avatar-shell" aria-label="Avatar del estudiante">
              <span class="avatar-ring"></span>
              <img class="student-avatar" [src]="studentAvatarUrl()" [alt]="studentAvatarAlt()">
            </figure>
            <h2 class="student-email">{{ studentEmail() }}</h2><p class="mono cyan">Psicología // Simulación psicosocial</p>
            <div class="grid desktop-2"><div><small>Caso activo</small><strong>1</strong></div><div><small>Estado</small><strong>Listo</strong></div></div>
          </div>
          <button class="btn full" (click)="go('protocol')">Validar y continuar</button>
        </section>
      } @else {
        <section class="stack">
          <p class="eyebrow">Protocolo estudiante</p><h1>Bienvenido al entrenamiento</h1>
          <p>El sistema registrará razonamiento técnico, criterios normativos y toma de decisiones en escenarios simulados.</p>
          <div class="protocol stagger">
            @for (item of protocol; track item.title; let index = $index) {
              <div class="panel panel-pad row"><b>0{{ index + 1 }}</b><div><h3>{{ item.title }}</h3><p>{{ item.body }}</p></div></div>
            }
          </div>
          <label class="accept"><input type="checkbox" (change)="ready = !ready"><span>Acepto el protocolo académico y el tratamiento local de datos de la simulación.</span></label>
          <button class="btn full" [disabled]="!ready" (click)="finish()">Ingresar al panel</button>
        </section>
      }
    </div></main>
  `,
  styles: [`
    .onboarding-bg{background:linear-gradient(90deg,rgba(4,8,13,.92),rgba(4,8,13,.72) 44%,rgba(4,8,13,.94)),linear-gradient(180deg,rgba(0,229,244,.18),rgba(4,8,13,.74)),url('/assets/onboarding-background.png') center/cover no-repeat fixed}.onboard{position:relative;z-index:4;padding-top:26px}.brand{color:var(--cyan);font:700 16px var(--mono);letter-spacing:2px;text-shadow:0 0 16px rgba(0,229,244,.55)}.analysis{padding-top:54px}.face{width:230px;height:230px;display:grid;place-items:center;margin:18px auto;border:1px solid var(--line);background:#fff;box-shadow:0 18px 70px rgba(0,0,0,.45)}.face img{width:86%;height:86%;object-fit:contain}.alert{border-left:4px solid var(--coral)}.id-card{text-align:center;backdrop-filter:blur(10px)}.student-email{font-size:clamp(22px,5vw,29px);overflow-wrap:anywhere}.avatar-shell{position:relative;width:116px;height:116px;display:grid;place-items:center;margin:0 auto 2px;padding:0;border:1px solid rgba(0,229,244,.58);border-radius:18px;background:radial-gradient(circle at 50% 20%,rgba(0,229,244,.18),rgba(7,11,18,.92) 56%);box-shadow:0 0 34px rgba(0,229,244,.16),inset 0 0 30px rgba(0,229,244,.08);overflow:hidden}.avatar-shell::before{content:"";position:absolute;inset:8px;border:1px solid rgba(255,255,255,.08);border-radius:14px}.avatar-shell::after{content:"ID";position:absolute;right:9px;bottom:7px;color:rgba(0,229,244,.78);font:700 10px var(--mono);letter-spacing:1px}.avatar-ring{position:absolute;inset:13px;border-radius:50%;border:1px dashed rgba(0,232,148,.45);animation:pulse 2.6s ease-in-out infinite}.student-avatar{position:relative;width:92px;height:92px;object-fit:contain;filter:drop-shadow(0 10px 20px rgba(0,0,0,.46)) drop-shadow(0 0 13px rgba(0,229,244,.22))}small{display:block;color:var(--dim);font:12px var(--mono)}strong{display:block;margin-top:8px;color:var(--green);font:23px var(--mono)}.protocol{display:grid;gap:12px}.protocol b{font:20px var(--mono);color:var(--cyan)}.accept{display:flex;gap:12px;color:var(--muted);font-size:14px;line-height:1.45}.accept input{accent-color:var(--cyan);width:20px;height:20px}
  `]
})
export class OnboardingPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = inject(StudentStateService);
  readonly step = toSignal(this.route.paramMap.pipe(map(params => params.get('step') ?? 'analysis')), { initialValue: 'analysis' });
  readonly stepNumber = computed(() => this.step() === 'analysis' ? '1' : this.step() === 'profile' ? '2' : '3');
  readonly studentEmail = computed(() => this.state.apiUser()?.correo ?? 'correo institucional');
  readonly studentAvatarAlt = computed(() => `Avatar académico de ${this.studentEmail()}`);
  readonly studentAvatarUrl = computed(() => this.buildAvatarDataUrl(this.state.apiUser()?.id ?? this.studentEmail()));
  ready = false;
  readonly protocol = [
    { title: 'Analice antes de actuar', body: 'Cada decisión debe proteger a la víctima y evitar daño adicional.' },
    { title: 'Use herramientas técnicas', body: 'Consulte normativa, protocolos y criterios de valoración de riesgo.' },
    { title: 'Registre su reflexión', body: 'La bitácora final consolida el aprendizaje formativo.' }
  ];
  go(step: string): void { void this.router.navigate(['/student/onboarding', step]); }
  finish(): void { this.state.finishOnboarding(); void this.router.navigate(['/student/dashboard']); }

  private buildAvatarDataUrl(seed: string): string {
    const palettes = [
      ['#00e5f4', '#00e894', '#102234', '#ffd166'],
      ['#2ef9ff', '#ff9f9b', '#151a2d', '#00e894'],
      ['#68f5c8', '#00b7ff', '#16202a', '#f8d36b'],
      ['#00e5f4', '#a8f8ff', '#182235', '#ffb800'],
      ['#14f1d9', '#7cc7ff', '#101927', '#ff7d7d']
    ];
    const hash = this.hashSeed(seed);
    const palette = palettes[hash % palettes.length];
    const skin = ['#f2c6a0', '#c98f6a', '#8f5e46', '#e2aa78'][hash % 4];
    const hair = ['#14171d', '#2c211d', '#08343b', '#3a2c4c'][Math.floor(hash / 5) % 4];
    const faceShape = Math.floor(hash / 13) % 3;
    const hairStyle = Math.floor(hash / 29) % 4;
    const suitTone = palette[2];
    const accent = palette[0];
    const secondary = palette[1];
    const visor = palette[3];
    const facePath = [
      '<path d="M64 42c16 0 27 12 27 30 0 20-12 34-27 34S37 92 37 72c0-18 11-30 27-30Z"',
      '<path d="M64 41c17 0 29 13 26 33-2 17-12 31-26 31S40 91 38 74c-3-20 9-33 26-33Z"',
      '<path d="M64 40c15 0 26 10 28 27 2 21-12 38-28 38S34 88 36 67c2-17 13-27 28-27Z"'
    ][faceShape];
    const hairPath = [
      '<path d="M36 63c2-20 15-31 30-31 14 0 27 10 28 31-9-8-21-10-34-8-10 1-17 4-24 8Z"',
      '<path d="M35 64c3-21 17-32 33-30 13 2 23 11 25 29-12-10-28-13-47-4l-11 5Z"',
      '<path d="M35 63c0-18 12-31 29-31 18 0 29 13 29 31-6-5-13-8-21-8-14 0-25 4-37 8Z"',
      '<path d="M36 63c1-19 14-31 29-31 9 0 18 4 24 11-13 1-24 5-33 13-8 1-14 3-20 7Z"'
    ][hairStyle];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
        <defs>
          <linearGradient id="bg" x1="16" y1="8" x2="112" y2="124" gradientUnits="userSpaceOnUse">
            <stop stop-color="${accent}" stop-opacity=".25"/>
            <stop offset=".55" stop-color="#0b111b"/>
            <stop offset="1" stop-color="${secondary}" stop-opacity=".26"/>
          </linearGradient>
          <linearGradient id="suit" x1="36" y1="84" x2="92" y2="124" gradientUnits="userSpaceOnUse">
            <stop stop-color="${suitTone}"/>
            <stop offset="1" stop-color="#05080d"/>
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect width="128" height="128" rx="20" fill="url(#bg)"/>
        <path d="M18 96h92M25 29h78M31 18v92M97 18v92" stroke="${accent}" stroke-opacity=".16"/>
        <circle cx="64" cy="66" r="47" fill="none" stroke="${secondary}" stroke-opacity=".18"/>
        <circle cx="64" cy="66" r="35" fill="none" stroke="${accent}" stroke-opacity=".22" stroke-dasharray="4 5"/>
        <path d="M25 123c4-24 19-38 39-38s35 14 39 38H25Z" fill="url(#suit)"/>
        <path d="M47 91l17 21 17-21" fill="none" stroke="${accent}" stroke-width="3" stroke-linejoin="round"/>
        ${facePath} fill="${skin}"/>
        ${hairPath} fill="${hair}"/>
        <path d="M45 70c11-5 27-6 39 0" fill="none" stroke="${visor}" stroke-width="4" stroke-linecap="round" filter="url(#glow)"/>
        <circle cx="53" cy="72" r="3" fill="#061015"/>
        <circle cx="75" cy="72" r="3" fill="#061015"/>
        <path d="M55 88c6 4 12 4 18 0" fill="none" stroke="#472a27" stroke-width="3" stroke-linecap="round" opacity=".55"/>
        <path d="M28 111h72" stroke="${accent}" stroke-width="2" stroke-opacity=".75"/>
        <path d="M101 36h10v17M27 92H17V75" fill="none" stroke="${secondary}" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `.trim();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  private hashSeed(value: string): number {
    return [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 2166136261);
  }
}
