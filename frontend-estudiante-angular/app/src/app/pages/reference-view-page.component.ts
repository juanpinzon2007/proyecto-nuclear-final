import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { REFERENCE_FILES } from './reference-archive-page.component';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<main class="viewer"><a routerLink="/student/reference">← VOLVER_AL_ARCHIVO</a><img [src]="src()" [alt]="src()"></main>`,
  styles: [`.viewer{min-height:100vh;padding:18px;text-align:center;background:#06080c}a{display:block;margin-bottom:16px;color:var(--cyan);font:15px var(--mono)}img{max-width:100%;height:auto;border:1px solid var(--line)}`]
})
export class ReferenceViewPageComponent {
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => Number(params.get('screen') ?? 1))), { initialValue: 1 });
  readonly src = computed(() => `/assets/mockups/student/${REFERENCE_FILES[Math.max(0, Math.min(45, this.id() - 1))]}`);
}
