import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen scanlines"><app-neuro-header status="CONFIGURACIÓN DE USUARIO" /><div class="content narrow">
      <p class="eyebrow">PERFIL DE USUARIO</p><h1>Configuración personal</h1>

      <section class="panel panel-pad profile stack">
        <div class="avatar">{{ state.studentInitials() }}</div>
        <h2>{{ state.studentName() }}</h2>
        <p class="mono cyan">{{ state.apiUser()?.correo || 'Sesión local' }}</p>
        <div class="profile-grid">
          <div><small>Rol</small><b>{{ state.apiUser()?.rol || 'ESTUDIANTE' }}</b></div>
          <div><small>Estado</small><b>{{ state.apiUser()?.estado || 'ACTIVO' }}</b></div>
        </div>
      </section>

      <section class="panel panel-pad stack metrics">
        <h3>Resumen académico</h3>
        <div class="metric-row"><span>Intentos registrados</span><b>{{ state.studentStats().totalAttempts }}</b></div>
        <div class="metric-row"><span>Intentos finalizados</span><b>{{ state.studentStats().completedAttempts }}</b></div>
        <div class="metric-row"><span>Puntaje promedio</span><b>{{ state.studentStats().averageScore }}/100</b></div>
        <div class="metric-row"><span>Intentos activos</span><b>{{ state.studentStats().activeAttempts }}</b></div>
      </section>

      <section class="panel panel-pad stack actions">
        <h3>Acciones disponibles</h3>
        <a class="action-link" routerLink="/change-password"><b>Cambiar contraseña</b><span>Actualizar la clave de acceso del estudiante.</span></a>
        <button class="action-link" type="button" (click)="refresh()"><b>Actualizar datos</b><span>Sincronizar casos, intentos y recursos desde el servidor.</span></button>
        <button class="action-link" type="button" (click)="clearProgress()"><b>Limpiar progreso local</b><span>Borrar contadores guardados en este navegador sin eliminar intentos del servidor.</span></button>
        <a class="action-link" routerLink="/student/cases"><b>Ver casos asignados</b><span>Volver a la lista de casos disponibles.</span></a>
        <button class="action-link danger" type="button" (click)="logout()"><b>Cerrar sesión</b><span>Salir del panel estudiantil.</span></button>
      </section>

      @if (message) { <p class="saved mono">{{ message }}</p> }
    </div><app-bottom-nav /></main>
  `,
  styles: [`
    .profile{margin-top:22px;text-align:center}.avatar{width:88px;height:88px;display:grid;place-items:center;margin:auto;border:1px solid var(--line-strong);border-radius:12px;color:var(--cyan);font:30px var(--mono)}.profile-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.profile-grid div,.metric-row{padding:12px;border:1px solid rgba(184,211,214,.12);background:#0a1117}.profile-grid small,.metric-row span{display:block;color:var(--muted);font:12px var(--mono);text-transform:uppercase}.profile-grid b,.metric-row b{color:#eaffff;font:16px var(--mono)}.metrics,.actions{margin-top:18px}.metrics h3,.actions h3{font-size:20px}.metric-row{display:flex;justify-content:space-between;align-items:center;gap:12px}.action-link{display:grid;gap:4px;width:100%;padding:14px 16px;border:1px solid rgba(184,211,214,.16);color:var(--text);background:#0a1117;text-align:left;text-decoration:none}.action-link b{color:var(--cyan);font:15px var(--mono);text-transform:uppercase}.action-link span{color:var(--muted);font-size:13px}.action-link:hover{border-color:var(--cyan);background:rgba(0,229,244,.08)}.action-link.danger b{color:var(--coral)}.saved{margin-top:14px;color:var(--green);text-align:center;font-size:12px}@media(max-width:520px){.profile-grid{grid-template-columns:1fr}.metric-row{align-items:flex-start;flex-direction:column}}
  `]
})
export class ProfilePageComponent {
  readonly state = inject(StudentStateService);
  private readonly router = inject(Router);
  message = '';

  async refresh(): Promise<void> {
    await this.state.refreshBackendData();
    this.message = 'Datos actualizados desde el servidor.';
  }

  clearProgress(): void {
    this.state.clearLocalProgress();
    this.message = 'Progreso local limpiado en este navegador.';
  }

  logout(): void {
    this.state.logout();
    void this.router.navigate(['/login']);
  }
}
