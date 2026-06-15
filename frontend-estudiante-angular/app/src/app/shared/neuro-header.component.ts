import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';

@Component({
  selector: 'app-neuro-header',
  standalone: true,
  template: `
    <header class="neuro-header">
      <div class="brand-mark"><img src="/assets/humboldt-logo.png" alt="Logo Humboldt"></div>
      <div class="brand">Humboldt Psicología</div>
      <div class="header-spacer"></div>
      <span class="session-time">Sesión: {{ elapsed }}</span>
      <button class="logout-btn" type="button" (click)="logout()">Cerrar sesión</button>
    </header>
  `,
  styles: [`
    .neuro-header{height:80px;display:flex;align-items:center;gap:14px;padding:0 20px;border-bottom:1px solid rgba(184,211,214,.17);background:rgba(9,12,18,.95);position:sticky;top:0;z-index:20}
    .brand-mark{width:54px;height:44px;display:grid;place-items:center;border:1px solid var(--line-strong);border-radius:12px;background:#fff;box-shadow:0 0 12px rgba(0,229,244,.1);overflow:hidden}.brand-mark img{width:92%;height:92%;object-fit:contain}
    .brand,.session-time{font-family:var(--mono);letter-spacing:1.5px;color:var(--cyan)}
    .brand{font-size:16px;font-weight:700}.session-time{font-size:14px;white-space:nowrap;color:var(--green)}.header-spacer{flex:1}
    .logout-btn{min-height:40px;padding:0 14px;border:1px solid rgba(255,184,0,.55);border-radius:0;color:#171000;background:var(--amber);font:13px var(--mono);letter-spacing:1px;text-transform:uppercase}
    .logout-btn:hover{filter:brightness(1.08)}
    @media(max-width:620px){.brand{display:none}.session-time{font-size:12px}.logout-btn{padding:0 10px;font-size:12px}}
  `]
})
export class NeuroHeaderComponent implements OnInit, OnDestroy {
  @Input() status = '';
  @Input() time = '';
  private readonly state = inject(StudentStateService);
  private readonly router = inject(Router);
  private timerId: number | null = null;
  elapsed = '00:00:00';

  ngOnInit(): void {
    if (!localStorage.getItem('neurocommand_session_started_at')) {
      localStorage.setItem('neurocommand_session_started_at', String(Date.now()));
    }
    this.updateElapsed();
    this.timerId = window.setInterval(() => this.updateElapsed(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
  }

  logout(): void {
    this.state.logout();
    void this.router.navigate(['/login']);
  }

  private updateElapsed(): void {
    const startedAt = Number(localStorage.getItem('neurocommand_session_started_at') ?? Date.now());
    const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    this.elapsed = `${hours}:${minutes}:${seconds}`;
  }
}
