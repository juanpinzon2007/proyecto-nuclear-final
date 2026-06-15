import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Decision } from '../core/models';
import { StudentStateService } from '../core/student-state.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen simulation scanlines" [class.paused]="state.simulationPaused()">
      <app-neuro-header [status]="scenario().label" />
      <div class="content sim-content">
        <section class="mission-strip panel">
          <div class="mission-progress">
            <span class="eyebrow">Progreso del caso</span>
            <div class="progress-steps" aria-label="Progreso de preguntas">
              @for (item of state.scenarios; track item.id) {
                <i
                  [class.done]="isSceneDone(item.id)"
                  [class.current]="item.id === scenario().id"
                ></i>
              }
            </div>
          </div>
          <div class="sim-controls">
            <div class="sim-stats mono" aria-label="Estado de la simulación">
              <span class="stat-item">
                <small>Intentos</small>
                <b>{{ state.attemptsUsed() }}</b>
              </span>
              <span class="stat-item">
                <small>Pregunta</small>
                <b>{{ currentQuestionNumber() }}/{{ state.scenarios.length }}</b>
              </span>
            </div>
            <button class="pause-btn" type="button" (click)="togglePause()">
              {{ state.simulationPaused() ? 'Reanudar' : 'Pausar' }}
            </button>
          </div>
        </section>

        <div
          class="scene-frame"
          [attr.data-scene]="scenario().id"
          [class.comisaria]="scenario().id.startsWith('comisaria')"
        >
          <span class="tag scene-tag">{{ scenario().location }}</span>
          <div class="fx-orb o1"></div>
          <div class="fx-orb o2"></div>
          <div class="fx-orb o3"></div>

          @switch (scenario().id) {
            @case ('hospital-q1') {
              <div
                class="stage hospital-crisis"
                aria-label="Urgencia hospitalaria y crisis familiar"
              >
                <div class="rain"></div>
                <div class="moon"></div>
                <div class="triage-ring"></div>
                <div class="heart-monitor"><i></i></div>
                <div class="hospital"><b>URGENCIAS</b><i></i><i></i><i></i><i></i><em></em></div>
                <div class="ambulance"><span></span><b></b><i></i><i></i></div>
                <div class="family"><span></span><span></span><span></span></div>
                <div class="pulse-line"></div>
                <div class="scene-note">
                  <b>Hospital de urgencias</b><small>Crisis vital y atención inmediata</small>
                </div>
              </div>
            }
            @case ('hospital-q2') {
              <div class="stage legal-map" aria-label="Marco normativo hospitalario">
                <div class="desk"></div>
                <div class="scanner"></div>
                <div class="legal-holo"><i></i><i></i><i></i></div>
                <div class="law-card c1"><b>Resolución 459</b><small>Atención integral</small></div>
                <div class="law-card c2"><b>Ley 1257</b><small>Protección a mujeres</small></div>
                <div class="law-card c3"><b>Ruta clínica</b><small>Salud y protección</small></div>
                <div class="beam b1"></div>
                <div class="beam b2"></div>
                <div class="scene-note">
                  <b>Marco normativo</b><small>Selecciona la ruta técnica completa</small>
                </div>
              </div>
            }
            @case ('hospital-q3') {
              <div
                class="stage epicee-room"
                aria-label="Comunicación de malas noticias con protocolo EPICEE"
              >
                <div class="room-light"></div>
                <div class="dialogue-beacon"></div>
                <div class="clinician"><i></i><b></b></div>
                <div class="family-group"><span></span><span></span><span></span></div>
                <div class="message-card">
                  <b>EPICEE</b><small>Preparar, escuchar y comunicar</small>
                </div>
                <div class="calm-wave w1"></div>
                <div class="calm-wave w2"></div>
                <div class="scene-note">
                  <b>Comunicación crítica</b><small>PAP, escucha y no revictimización</small>
                </div>
              </div>
            }
            @case ('comisaria-q1') {
              <div
                class="stage protection-risk"
                aria-label="Valoración de riesgo y medidas de protección"
              >
                <div class="safe-door"></div>
                <div class="person protected"></div>
                <div class="risk-meter"><span></span></div>
                <div class="warning-grid"><i></i><i></i><i></i><i></i></div>
                <div class="shield">PROTECCIÓN</div>
                <div class="path"></div>
                <div class="scene-note">
                  <b>Medidas urgentes</b><small>Riesgo de feminicidio y derechos</small>
                </div>
              </div>
            }
            @case ('comisaria-q2') {
              <div class="stage law-building" aria-label="Normas para Comisaría de Familia">
                <div class="building">
                  <div class="roof"></div>
                  <div class="cols"><i></i><i></i><i></i><i></i></div>
                  <div class="steps"></div>
                </div>
                <div class="justice-orbit"><i></i></div>
                <div class="law-pill p1">Ley 2126</div>
                <div class="law-pill p2">Ley 1098</div>
                <div class="law-pill p3">Ley 1257</div>
                <div class="stamp">COMISARÍA</div>
                <div class="scene-note">
                  <b>Marco institucional</b><small>Familia, infancia y mujer</small>
                </div>
              </div>
            }
            @default {
              <div
                class="stage care-network"
                aria-label="Valoración integral y activación de rutas"
              >
                <div class="node victim">Víctima</div>
                <div class="node rights">Derechos</div>
                <div class="node health">Salud</div>
                <div class="node mental">Salud mental</div>
                <div class="node risk">Riesgo</div>
                <div class="net l1"></div>
                <div class="net l2"></div>
                <div class="net l3"></div>
                <div class="net l4"></div>
                <div class="route-dot"></div>
                <div class="network-scan"></div>
                <div class="scene-note">
                  <b>Valoración integral</b><small>Dependientes, riesgo y rutas</small>
                </div>
              </div>
            }
          }
        </div>

        <section class="panel panel-pad situation">
          <div class="eyebrow">{{ scenario().title }}</div>
          <p>{{ scenario().body }}</p>
        </section>

        <div class="spread meta-row mono">
          <span
            >Volatilidad: <b class="amber">{{ scenario().volatility }}</b></span
          >
          <span
            >Estrés estimado: <b class="cyan">{{ scenario().stress }}%</b></span
          >
        </div>

        <section class="coach panel">
          <div class="coach-orb">🧠</div>
          <div>
            <span class="eyebrow">Coach neuro</span>
            <p>Cada carta abre un camino distinto. ¿Cuál encaja mejor?</p>
          </div>
        </section>

        <section class="deck-shell">
          <div class="spread deck-head">
            <div>
              <span class="eyebrow">Mazo de instintos clínicos</span>
              <h1>Elige tu carta de acción</h1>
            </div>
            <span class="tag">{{ scenario().decisions.length }} cartas</span>
          </div>
          <p class="deck-help">Desliza el mazo, toca una carta y lánzala cuando estés listo.</p>

          <div
            class="card-rail"
            [class.locked]="!!selectedDecision()"
            role="listbox"
            aria-label="Cartas de respuesta clínica"
          >
            @for (decision of scenario().decisions; track decision.id; let index = $index) {
              <button
                class="action-card"
                type="button"
                role="option"
                [attr.aria-selected]="isActive(decision.id)"
                [class.selected]="isActive(decision.id)"
                [class.launched]="selected() === decision.id"
                [style.--tilt]="cardTilt(index)"
                [disabled]="state.simulationPaused()"
                (click)="pick(decision.id)"
              >
                <span
                  class="mode-pill"
                  [class.good]="decision.tone === 'green'"
                  [class.warn]="decision.tone === 'amber'"
                  >{{ cardMode(decision) }}</span
                >
                <span class="card-symbol">{{ cardIcon(decision, index) }}</span>
                <span class="card-kicker">{{ cardKicker(decision) }}</span>
                <strong>{{ decision.title }}</strong>
                <em>{{ decision.body }}</em>
                <div class="stats">
                  <label
                    >Empatía
                    <i><span [style.width.%]="attributeScore(decision, 'empathy')"></span></i
                  ></label>
                  <label
                    >Protocolo
                    <i><span [style.width.%]="attributeScore(decision, 'protocol')"></span></i
                  ></label>
                  <label
                    >Riesgo <i><span [style.width.%]="attributeScore(decision, 'risk')"></span></i
                  ></label>
                </div>
                <small class="touch-label">{{
                  selected() === decision.id
                    ? '✓ Carta lanzada'
                    : isActive(decision.id)
                      ? '● Seleccionada'
                      : 'Tocar para elegir'
                }}</small>
              </button>
            }
          </div>
        </section>

        @if (!selectedDecision()) {
          <section class="launch-pad panel">
            <div class="selected-brief">
              <span class="card-symbol small">{{
                activeDecision() ? cardIcon(activeDecision()!, activeDecisionIndex()) : '◇'
              }}</span>
              <div>
                <small>{{ activeDecision() ? cardMode(activeDecision()!) : 'Sin carta' }}</small
                ><b>{{ activeDecision() ? activeDecision()!.title : 'Seleccione una carta' }}</b>
              </div>
            </div>
            <button
              class="btn grow"
              type="button"
              [disabled]="!activeDecision() || state.simulationPaused()"
              (click)="launch()"
            >
              🚀 Lanzar carta
            </button>
          </section>
        }

        @if (selectedDecision()) {
          <section class="panel panel-pad feedback">
            <div class="spread">
              <span class="eyebrow green">🎉 Gran instinto clínico</span
              ><span class="tag green">+{{ selectedDecision()!.xp }} XP</span>
            </div>
            <p>{{ selectedDecision()!.feedback }}</p>
            <div class="meter stress"><span [style.--value.%]="scenario().stress"></span></div>
            <div class="spread mono">
              <span>Nivel de estrés del escenario</span
              ><b class="amber">{{ scenario().stress }}%</b>
            </div>
          </section>
          <div class="action-row">
            <a class="btn secondary" routerLink="/student/toolkit">Herramientas</a
            ><button
              class="btn grow"
              type="button"
              [disabled]="state.simulationPaused()"
              (click)="next()"
            >
              Siguiente escena →
            </button>
          </div>
        }
      </div>
      @if (state.simulationPaused()) {
        <section class="pause-overlay">
          <div class="panel pause-card">
            <span class="eyebrow amber">Simulación pausada</span>
            <h2>El caso está detenido</h2>
            <p>Las animaciones, cartas y avance quedan bloqueados hasta reanudar.</p>
            <button class="btn full" type="button" (click)="togglePause()">
              Despausar simulación
            </button>
          </div>
        </section>
      }
      <app-bottom-nav />
    </main>
  `,
  styles: [
    `
      .simulation {
        background:
          radial-gradient(circle at 18% 35%, rgba(0, 229, 244, 0.16), transparent 32%),
          radial-gradient(circle at 85% 60%, rgba(0, 232, 148, 0.1), transparent 30%), var(--bg);
      }
      .sim-content {
        width: min(100%, 920px);
      }
      .mission-strip {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 18px;
        margin-bottom: 12px;
        padding: 14px 18px;
        background: rgba(8, 15, 22, 0.9);
      }
      .mission-progress {
        min-width: 0;
      }
      .progress-steps {
        display: grid;
        grid-template-columns: repeat(6, minmax(28px, 1fr));
        gap: 7px;
        margin-top: 8px;
        width: clamp(210px, 38vw, 370px);
        max-width: 100%;
      }
      .progress-steps i {
        height: 6px;
        background: #273039;
        border-radius: 99px;
      }
      .progress-steps i.done,
      .progress-steps i.current {
        background: var(--cyan);
        box-shadow: 0 0 12px rgba(0, 229, 244, 0.35);
      }
      .progress-steps i.current {
        background: var(--green);
      }
      .scene-frame {
        height: 330px;
        position: relative;
        overflow: hidden;
        margin-bottom: 14px;
        border: 1px solid var(--line);
        background:
          radial-gradient(circle at 70% 14%, rgba(0, 229, 244, 0.2), transparent 24%),
          linear-gradient(180deg, #08141d, #05080e);
      }
      .scene-frame.comisaria {
        background:
          radial-gradient(circle at 70% 14%, rgba(255, 184, 0, 0.2), transparent 24%),
          linear-gradient(180deg, #171309, #06080d);
      }
      .scene-frame:before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 229, 244, 0.08) 1px, transparent 1px);
        background-size:
          4px 4px,
          54px 54px;
      }
      .scene-tag {
        position: absolute;
        z-index: 5;
        top: 18px;
        left: 18px;
      }
      .stage {
        position: absolute;
        inset: 0;
      }
      .scene-note {
        position: absolute;
        right: 18px;
        bottom: 18px;
        z-index: 4;
        width: 250px;
        padding: 12px 14px;
        border: 1px solid rgba(184, 211, 214, 0.28);
        background: rgba(3, 7, 12, 0.76);
        backdrop-filter: blur(6px);
      }
      .scene-note b,
      .scene-note small {
        display: block;
      }
      .scene-note b {
        color: #effdff;
        font: 17px var(--display);
        text-transform: uppercase;
      }
      .scene-note small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
      }
      .rain {
        position: absolute;
        inset: -40% 0 0;
        background: repeating-linear-gradient(
          115deg,
          transparent 0 16px,
          rgba(155, 239, 255, 0.22) 17px 18px,
          transparent 19px 35px
        );
        animation: rain 1.1s linear infinite;
      }
      .moon {
        position: absolute;
        right: 70px;
        top: 34px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: #dffcff;
        box-shadow: 0 0 34px rgba(0, 229, 244, 0.55);
        animation: floatScene 5s ease-in-out infinite;
      }
      .hospital {
        position: absolute;
        left: 50%;
        bottom: 58px;
        width: 242px;
        height: 150px;
        transform: translateX(-50%);
        border: 1px solid rgba(0, 229, 244, 0.42);
        background: linear-gradient(180deg, #122738, #08111a);
        box-shadow: 0 0 32px rgba(0, 229, 244, 0.18);
      }
      .hospital b {
        position: absolute;
        left: 50%;
        top: -34px;
        transform: translateX(-50%);
        padding: 8px 18px;
        color: #00161b;
        background: var(--cyan);
        font: 13px var(--mono);
        letter-spacing: 2px;
      }
      .hospital i {
        position: relative;
        display: inline-block;
        margin: 46px 8px 0 20px;
        width: 30px;
        height: 24px;
        background: #7ef7ff;
        box-shadow: 0 0 18px rgba(0, 229, 244, 0.45);
        animation: blink 3s ease-in-out infinite;
      }
      .hospital i:nth-child(2n) {
        animation-delay: 0.8s;
      }
      .hospital em {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 50px;
        height: 56px;
        transform: translateX(-50%);
        background: #03070c;
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      .ambulance {
        position: absolute;
        left: 60px;
        bottom: 42px;
        width: 154px;
        height: 54px;
        animation: drive 6s ease-in-out infinite;
      }
      .ambulance span {
        position: absolute;
        left: 30px;
        bottom: 12px;
        width: 112px;
        height: 36px;
        background: #f5feff;
        border-radius: 8px;
      }
      .ambulance b {
        position: absolute;
        left: 78px;
        bottom: 50px;
        width: 22px;
        height: 10px;
        background: #e84351;
        border-radius: 8px 8px 0 0;
        box-shadow: 0 0 22px #e84351;
        animation: siren 0.55s linear infinite;
      }
      .ambulance i {
        position: absolute;
        bottom: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #05070a;
        border: 4px solid #5f6f76;
      }
      .ambulance i:first-of-type {
        left: 44px;
      }
      .ambulance i:last-of-type {
        right: 8px;
      }
      .family {
        position: absolute;
        left: 36px;
        bottom: 90px;
        display: flex;
        gap: 8px;
      }
      .family span {
        width: 28px;
        height: 54px;
        border-radius: 18px 18px 6px 6px;
        background: #b8d3d6;
        opacity: 0.75;
        animation: shake 1.8s ease-in-out infinite;
      }
      .family span:nth-child(2) {
        height: 66px;
        animation-delay: 0.3s;
      }
      .family span:nth-child(3) {
        height: 46px;
        animation-delay: 0.6s;
      }
      .pulse-line {
        position: absolute;
        left: 20px;
        right: 20px;
        bottom: 20px;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--cyan), transparent);
        filter: drop-shadow(0 0 8px var(--cyan));
        animation: sweep 2s linear infinite;
      }
      .desk {
        position: absolute;
        left: 70px;
        right: 70px;
        bottom: 58px;
        height: 72px;
        background: #111a22;
        border-top: 1px solid var(--line);
      }
      .scanner {
        position: absolute;
        left: 50%;
        top: 54px;
        width: 150px;
        height: 150px;
        border: 1px solid var(--cyan);
        border-radius: 50%;
        transform: translateX(-50%);
        animation: spin 7s linear infinite;
      }
      .law-card {
        position: absolute;
        width: 150px;
        padding: 14px;
        border: 1px solid rgba(0, 229, 244, 0.42);
        background: rgba(6, 14, 22, 0.88);
        box-shadow: 0 0 18px rgba(0, 229, 244, 0.12);
        animation: floatingCard 3.4s ease-in-out infinite;
      }
      .law-card b,
      .law-card small {
        display: block;
      }
      .law-card b {
        color: var(--cyan);
        font: 15px var(--display);
      }
      .law-card small {
        color: var(--muted);
        font-size: 12px;
      }
      .c1 {
        left: 58px;
        top: 82px;
      }
      .c2 {
        right: 58px;
        top: 98px;
        animation-delay: 0.7s;
      }
      .c3 {
        left: 50%;
        bottom: 92px;
        transform: translateX(-50%);
        animation-delay: 1.1s;
      }
      .beam {
        position: absolute;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--cyan), transparent);
        animation: sweep 2.2s linear infinite;
      }
      .b1 {
        left: 120px;
        right: 120px;
        top: 154px;
      }
      .b2 {
        left: 160px;
        right: 160px;
        top: 208px;
        animation-delay: 0.6s;
      }
      .room-light {
        position: absolute;
        left: 50%;
        top: 22px;
        width: 280px;
        height: 220px;
        transform: translateX(-50%);
        background: radial-gradient(circle, rgba(255, 255, 255, 0.16), transparent 65%);
        animation: floatScene 4s ease-in-out infinite;
      }
      .clinician,
      .family-group {
        position: absolute;
        bottom: 78px;
        display: flex;
        gap: 10px;
      }
      .clinician {
        left: 110px;
      }
      .family-group {
        right: 116px;
      }
      .clinician i,
      .family-group span {
        width: 36px;
        height: 76px;
        border-radius: 20px 20px 8px 8px;
        background: #dffcff;
      }
      .clinician b {
        width: 46px;
        height: 92px;
        border-radius: 24px 24px 8px 8px;
        background: #fff;
      }
      .family-group span {
        background: #ffc86a;
        opacity: 0.8;
        animation: shake 2.2s ease-in-out infinite;
      }
      .message-card {
        position: absolute;
        left: 50%;
        top: 78px;
        width: 170px;
        padding: 14px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        transform: translateX(-50%);
        background: rgba(3, 7, 12, 0.72);
        text-align: center;
        animation: floatingCard 3s ease-in-out infinite;
      }
      .message-card b {
        color: var(--green);
        font: 24px var(--display);
      }
      .message-card small {
        display: block;
        color: var(--muted);
      }
      .calm-wave {
        position: absolute;
        left: 50%;
        top: 132px;
        width: 80px;
        height: 80px;
        border: 1px solid var(--green);
        border-radius: 50%;
        transform: translateX(-50%);
        animation: wave 2s ease-out infinite;
      }
      .w2 {
        animation-delay: 1s;
      }
      .safe-door {
        position: absolute;
        right: 96px;
        bottom: 58px;
        width: 112px;
        height: 170px;
        border: 1px solid rgba(255, 184, 0, 0.5);
        background: #17120a;
        box-shadow: 0 0 28px rgba(255, 184, 0, 0.2);
      }
      .person {
        position: absolute;
        left: 120px;
        bottom: 76px;
        width: 50px;
        height: 90px;
        border-radius: 28px 28px 10px 10px;
        background: #e9f7f8;
        animation: floatScene 3.2s ease-in-out infinite;
      }
      .risk-meter {
        position: absolute;
        left: 48px;
        top: 92px;
        width: 190px;
        height: 18px;
        background: #2a1818;
      }
      .risk-meter span {
        display: block;
        height: 100%;
        width: 82%;
        background: linear-gradient(90deg, var(--amber), #e84351);
        animation: meterMove 2.2s ease-in-out infinite;
      }
      .shield {
        position: absolute;
        left: 48%;
        top: 88px;
        padding: 12px 18px;
        color: #171000;
        background: var(--amber);
        font: 14px var(--mono);
        box-shadow: 0 0 24px rgba(255, 184, 0, 0.34);
        animation: pulseScale 2s ease-in-out infinite;
      }
      .path {
        position: absolute;
        left: 140px;
        right: 120px;
        bottom: 60px;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--amber), transparent);
        animation: sweep 2.4s linear infinite;
      }
      .building {
        position: absolute;
        left: 50%;
        bottom: 62px;
        width: 260px;
        transform: translateX(-50%);
      }
      .roof {
        height: 48px;
        background: #c9962b;
        clip-path: polygon(50% 0, 100% 100%, 0 100%);
      }
      .cols {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        height: 82px;
        padding: 0 30px;
        background: #11161c;
        border: 1px solid rgba(255, 184, 0, 0.28);
      }
      .cols i {
        margin-top: 8px;
        background: linear-gradient(180deg, #f0c25b, #6c4b12);
      }
      .steps {
        height: 18px;
        background: repeating-linear-gradient(180deg, #2a2418 0 5px, #17140f 6px 9px);
      }
      .law-pill {
        position: absolute;
        padding: 9px 14px;
        border: 1px solid rgba(255, 184, 0, 0.45);
        background: rgba(3, 7, 12, 0.72);
        color: var(--amber);
        font: 13px var(--mono);
        animation: floatingCard 3s ease-in-out infinite;
      }
      .p1 {
        left: 62px;
        top: 72px;
      }
      .p2 {
        right: 70px;
        top: 90px;
        animation-delay: 0.6s;
      }
      .p3 {
        left: 50%;
        bottom: 58px;
        transform: translateX(-50%);
        animation-delay: 1s;
      }
      .stamp {
        position: absolute;
        left: 50%;
        top: 42px;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: var(--amber);
        color: #171000;
        font: 13px var(--mono);
      }
      .node {
        position: absolute;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 86px;
        height: 52px;
        border: 1px solid rgba(0, 229, 244, 0.45);
        background: rgba(3, 7, 12, 0.78);
        color: #e8fdff;
        font: 12px var(--mono);
        text-align: center;
        animation: nodeGlow 2.6s ease-in-out infinite;
      }
      .victim {
        left: 50%;
        top: 72px;
        transform: translateX(-50%);
      }
      .rights {
        left: 60px;
        top: 154px;
      }
      .health {
        right: 70px;
        top: 150px;
      }
      .mental {
        left: 120px;
        bottom: 54px;
      }
      .risk {
        right: 116px;
        bottom: 58px;
      }
      .net {
        position: absolute;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--cyan), transparent);
        animation: sweep 2s linear infinite;
      }
      .l1 {
        left: 145px;
        right: 145px;
        top: 154px;
      }
      .l2 {
        left: 105px;
        width: 190px;
        top: 214px;
        transform: rotate(24deg);
      }
      .l3 {
        right: 108px;
        width: 184px;
        top: 214px;
        transform: rotate(-22deg);
      }
      .l4 {
        left: 170px;
        right: 170px;
        bottom: 82px;
      }
      .route-dot {
        position: absolute;
        left: 50%;
        top: 148px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--cyan);
        box-shadow: 0 0 18px var(--cyan);
        animation: orbit 5s linear infinite;
      }
      .situation p {
        margin-top: 15px;
        color: #e1e5e6;
        font-size: 19px;
      }
      .meta-row {
        margin: 12px 0 20px;
        color: var(--muted);
      }
      .coach {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 8px 0 18px;
        padding: 16px 18px;
        border-radius: 18px;
        background: linear-gradient(90deg, rgba(0, 229, 244, 0.08), rgba(0, 232, 148, 0.04));
      }
      .coach-orb {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: #0c121a;
        border: 1px solid rgba(0, 229, 244, 0.28);
        font-size: 28px;
      }
      .deck-shell {
        padding: 10px 0 0;
      }
      .deck-head h1 {
        margin-top: 6px;
        font-size: 34px;
      }
      .card-rail {
        display: flex;
        gap: 24px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 18px 12px 28px;
        scroll-snap-type: x mandatory;
        scrollbar-color: var(--cyan) transparent;
      }
      .card-rail.locked .action-card:not(.launched) {
        opacity: 0.48;
        filter: saturate(0.55);
      }
      .action-card {
        position: relative;
        flex: 0 0 286px;
        min-height: 430px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 22px 20px;
        border: 1px solid rgba(184, 211, 214, 0.16);
        border-radius: 20px;
        color: var(--text);
        background: linear-gradient(155deg, rgba(23, 27, 35, 0.98), rgba(8, 12, 18, 0.98));
        box-shadow: 0 24px 45px rgba(0, 0, 0, 0.34);
        text-align: left;
        scroll-snap-align: center;
        transform: rotate(var(--tilt));
        transition:
          transform 0.22s ease,
          border-color 0.22s ease,
          box-shadow 0.22s ease;
      }
      .action-card:hover,
      .action-card.selected {
        border-color: var(--cyan-soft);
        box-shadow:
          0 0 0 2px rgba(168, 248, 255, 0.22),
          0 26px 46px rgba(0, 0, 0, 0.45);
        transform: translateY(-10px) rotate(0deg);
      }
      .action-card.launched {
        border-color: var(--green);
        box-shadow: 0 0 0 2px rgba(0, 232, 148, 0.28);
      }
      .mode-pill {
        width: max-content;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--cyan-soft);
        color: #062026;
        font: 12px var(--mono);
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }
      .mode-pill.good {
        background: #8dffd2;
      }
      .mode-pill.warn {
        background: var(--amber);
      }
      .card-symbol {
        font-size: 42px;
        line-height: 1;
      }
      .card-symbol.small {
        font-size: 32px;
      }
      .card-kicker {
        color: var(--cyan-soft);
        font: 12px var(--mono);
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      .action-card strong {
        color: #fff;
        font: 700 24px/1.1 var(--display);
      }
      .action-card em {
        color: #d5dddf;
        font-size: 16px;
        line-height: 1.42;
        font-style: normal;
      }
      .stats {
        display: grid;
        gap: 8px;
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px dashed rgba(184, 211, 214, 0.18);
      }
      .stats label {
        display: grid;
        grid-template-columns: 74px 1fr;
        align-items: center;
        gap: 8px;
        color: #8e9ca0;
        font: 13px var(--mono);
      }
      .stats i {
        height: 8px;
        overflow: hidden;
        border-radius: 99px;
        background: #252b32;
      }
      .stats span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          var(--cyan-soft),
          var(--green),
          var(--amber),
          var(--red)
        );
      }
      .touch-label {
        margin-top: 6px;
        color: var(--amber);
        font: 14px var(--mono);
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }
      .action-card.selected .touch-label,
      .action-card.launched .touch-label {
        color: var(--cyan-soft);
      }
      .launch-pad {
        display: grid;
        grid-template-columns: 1fr minmax(220px, 1.1fr);
        align-items: center;
        gap: 16px;
        margin-top: 2px;
        padding: 14px 16px;
        border-style: dashed;
        border-radius: 18px;
      }
      .selected-brief {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .selected-brief small,
      .selected-brief b {
        display: block;
      }
      .selected-brief small {
        color: var(--dim);
        font: 12px var(--mono);
        text-transform: uppercase;
      }
      .selected-brief b {
        color: #fff;
        font: 22px var(--display);
      }
      .feedback {
        display: grid;
        gap: 13px;
        margin-top: 20px;
        border-color: rgba(0, 232, 148, 0.55);
        box-shadow: inset 0 0 32px rgba(0, 232, 148, 0.04);
      }
      .feedback p {
        color: #f0f8f8;
        font-size: 22px;
        line-height: 1.42;
      }
      .stress {
        height: 18px;
        border-radius: 4px;
      }
      .stress span {
        background: linear-gradient(90deg, var(--amber) 0 96%, rgba(255, 255, 255, 0.16) 96%);
      }
      .action-row {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      .sim-controls {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 14px;
        min-width: fit-content;
        text-align: right;
      }
      .sim-stats {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 6px 16px;
        min-width: 0;
      }
      .stat-item {
        display: inline-flex;
        align-items: baseline;
        gap: 6px;
        white-space: nowrap;
        line-height: 1.1;
      }
      .stat-item small {
        color: var(--muted);
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .stat-item b {
        color: #effdff;
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0.8px;
      }
      .pause-btn {
        flex: 0 0 auto;
        min-height: 36px;
        padding: 0 13px;
        border: 1px solid var(--amber);
        color: #171000;
        background: var(--amber);
        font: 12px var(--mono);
        text-transform: uppercase;
      }
      .paused .stage *,
      .paused .fx-orb,
      .paused .action-card {
        animation-play-state: paused !important;
      }
      .pause-overlay {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(3, 7, 12, 0.72);
        backdrop-filter: blur(6px);
      }
      .pause-card {
        width: min(100%, 430px);
        display: grid;
        gap: 14px;
        padding: 26px;
        border-color: rgba(255, 184, 0, 0.62);
        text-align: center;
      }
      .pause-card p {
        font-size: 16px;
      }
      .fx-orb {
        position: absolute;
        z-index: 1;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--cyan);
        box-shadow: 0 0 22px currentColor;
        animation: drift 7s ease-in-out infinite;
      }
      .o1 {
        left: 14%;
        top: 72%;
        color: #00e5f4;
      }
      .o2 {
        right: 17%;
        top: 26%;
        color: #ffb800;
        animation-delay: 1s;
      }
      .o3 {
        left: 58%;
        top: 18%;
        color: #00e894;
        animation-delay: 2s;
      }
      .scene-frame[data-scene='hospital-q1'] {
        background:
          radial-gradient(circle at 20% 80%, rgba(232, 67, 81, 0.28), transparent 28%),
          radial-gradient(circle at 78% 22%, rgba(0, 229, 244, 0.35), transparent 26%),
          linear-gradient(180deg, #08141d, #05080e);
      }
      .scene-frame[data-scene='hospital-q2'] {
        background:
          radial-gradient(circle at 22% 26%, rgba(255, 184, 0, 0.28), transparent 28%),
          radial-gradient(circle at 74% 66%, rgba(0, 229, 244, 0.28), transparent 32%),
          linear-gradient(180deg, #111008, #05080e);
      }
      .scene-frame[data-scene='hospital-q3'] {
        background:
          radial-gradient(circle at 50% 40%, rgba(0, 232, 148, 0.24), transparent 30%),
          radial-gradient(circle at 82% 22%, rgba(168, 248, 255, 0.22), transparent 26%),
          linear-gradient(180deg, #06151a, #05080e);
      }
      .scene-frame[data-scene='comisaria-q1'] {
        background:
          radial-gradient(circle at 26% 38%, rgba(232, 67, 81, 0.28), transparent 25%),
          radial-gradient(circle at 72% 72%, rgba(255, 184, 0, 0.28), transparent 34%),
          linear-gradient(180deg, #171309, #06080d);
      }
      .scene-frame[data-scene='comisaria-q2'] {
        background:
          radial-gradient(circle at 50% 20%, rgba(255, 184, 0, 0.36), transparent 32%),
          radial-gradient(circle at 80% 70%, rgba(0, 229, 244, 0.18), transparent 28%),
          linear-gradient(180deg, #151007, #06080d);
      }
      .scene-frame[data-scene='comisaria-q3'] {
        background:
          radial-gradient(circle at 50% 50%, rgba(0, 232, 148, 0.28), transparent 28%),
          radial-gradient(circle at 18% 76%, rgba(0, 229, 244, 0.26), transparent 30%),
          linear-gradient(180deg, #071810, #05080e);
      }
      .triage-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 210px;
        height: 210px;
        margin: -105px;
        border: 2px solid rgba(232, 67, 81, 0.55);
        border-radius: 50%;
        box-shadow: 0 0 35px rgba(232, 67, 81, 0.32);
        animation: radarPulse 2.6s linear infinite;
      }
      .heart-monitor {
        position: absolute;
        left: 28px;
        top: 74px;
        width: 180px;
        height: 58px;
        border: 1px solid rgba(0, 232, 148, 0.5);
        background: rgba(0, 0, 0, 0.35);
      }
      .heart-monitor i {
        display: block;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0 18%,
          var(--green) 19% 22%,
          transparent 23% 34%,
          var(--green) 35% 38%,
          transparent 39%
        );
        animation: sweep 1.8s linear infinite;
      }
      .legal-holo {
        position: absolute;
        left: 50%;
        top: 44px;
        width: 220px;
        height: 220px;
        transform: translateX(-50%);
        border-radius: 50%;
        background: conic-gradient(
          from 90deg,
          transparent,
          var(--amber),
          transparent,
          var(--cyan),
          transparent
        );
        filter: blur(0.2px);
        opacity: 0.32;
        animation: spinFlat 8s linear infinite;
      }
      .legal-holo i {
        position: absolute;
        inset: 34px;
        border: 1px dashed rgba(255, 255, 255, 0.38);
        border-radius: 50%;
      }
      .dialogue-beacon {
        position: absolute;
        left: 50%;
        top: 118px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 30px var(--green);
        animation: beacon 1.8s ease-in-out infinite;
      }
      .warning-grid {
        position: absolute;
        left: 26px;
        bottom: 38px;
        width: 190px;
        height: 110px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .warning-grid i {
        border: 1px solid rgba(232, 67, 81, 0.45);
        background: rgba(232, 67, 81, 0.12);
        animation: tile 1.4s ease-in-out infinite;
      }
      .warning-grid i:nth-child(2n) {
        animation-delay: 0.4s;
      }
      .justice-orbit {
        position: absolute;
        left: 50%;
        bottom: 36px;
        width: 300px;
        height: 210px;
        margin-left: -150px;
        border: 1px solid rgba(255, 184, 0, 0.35);
        border-radius: 50%;
        animation: spinFlat 9s linear infinite;
      }
      .justice-orbit i {
        position: absolute;
        left: 50%;
        top: -7px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--amber);
        box-shadow: 0 0 22px var(--amber);
      }
      .network-scan {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 260px;
        height: 260px;
        margin: -130px;
        border-radius: 50%;
        background: conic-gradient(transparent, rgba(0, 229, 244, 0.45), transparent 28%);
        animation: spinFlat 4.5s linear infinite;
      }
      .action-card:disabled {
        cursor: not-allowed;
      }
      .action-card:nth-child(1) {
        background: linear-gradient(155deg, rgba(42, 34, 22, 0.98), rgba(9, 12, 18, 0.98));
      }
      .action-card:nth-child(2) {
        background: linear-gradient(155deg, rgba(16, 43, 45, 0.98), rgba(8, 12, 18, 0.98));
      }
      .action-card:nth-child(3) {
        background: linear-gradient(155deg, rgba(40, 22, 28, 0.98), rgba(8, 12, 18, 0.98));
      }
      .action-card:nth-child(4) {
        background: linear-gradient(155deg, rgba(20, 38, 29, 0.98), rgba(8, 12, 18, 0.98));
      }
      @keyframes drift {
        50% {
          transform: translate(28px, -24px) scale(1.35);
        }
      }
      @keyframes radarPulse {
        to {
          transform: scale(1.45);
          opacity: 0;
        }
      }
      @keyframes spinFlat {
        to {
          transform: translateX(-50%) rotate(360deg);
        }
      }
      @keyframes beacon {
        50% {
          transform: scale(1.9);
          opacity: 0.45;
        }
      }
      @keyframes tile {
        50% {
          filter: brightness(1.8);
          transform: scale(0.94);
        }
      }
      @keyframes rain {
        to {
          transform: translateY(38%);
        }
      }
      @keyframes floatScene {
        50% {
          transform: translateY(8px);
        }
      }
      @keyframes blink {
        50% {
          opacity: 0.35;
        }
      }
      @keyframes siren {
        50% {
          background: #00e5f4;
          box-shadow: 0 0 28px #00e5f4;
        }
      }
      @keyframes drive {
        50% {
          transform: translateX(42px);
        }
      }
      @keyframes shake {
        50% {
          transform: translateY(-6px);
        }
      }
      @keyframes sweep {
        to {
          transform: translateX(28%);
        }
      }
      @keyframes spin {
        to {
          transform: translateX(-50%) rotate(360deg);
        }
      }
      @keyframes floatingCard {
        50% {
          transform: translateY(-10px);
        }
      }
      @keyframes wave {
        to {
          transform: translateX(-50%) scale(2.4);
          opacity: 0;
        }
      }
      @keyframes meterMove {
        50% {
          width: 96%;
        }
      }
      @keyframes pulseScale {
        50% {
          transform: scale(1.06);
        }
      }
      @keyframes nodeGlow {
        50% {
          filter: brightness(1.4);
        }
      }
      @keyframes orbit {
        to {
          transform: rotate(360deg) translateX(90px) rotate(-360deg);
        }
      }
      @media (max-width: 720px) {
        .mission-strip {
          grid-template-columns: 1fr;
          align-items: flex-start;
        }
        .progress-steps {
          width: 100%;
        }
        .sim-controls {
          width: 100%;
          justify-content: space-between;
          text-align: left;
        }
        .sim-stats {
          flex: 1;
          justify-content: flex-start;
        }
        .stat-item b {
          font-size: 13px;
        }
        .scene-frame {
          height: 360px;
        }
        .scene-note {
          left: 16px;
          right: 16px;
          bottom: 16px;
          width: auto;
        }
        .hospital,
        .building {
          transform: translateX(-50%) scale(0.82);
        }
        .ambulance {
          left: 12px;
        }
        .law-card {
          width: 130px;
        }
        .c1 {
          left: 18px;
        }
        .c2 {
          right: 18px;
        }
        .clinician {
          left: 48px;
        }
        .family-group {
          right: 48px;
        }
        .safe-door {
          right: 42px;
        }
        .person {
          left: 68px;
        }
        .shield {
          left: 36px;
        }
        .node {
          width: 74px;
        }
        .deck-head {
          align-items: flex-start;
          flex-direction: column;
        }
        .card-rail {
          gap: 18px;
          padding-left: 2px;
        }
        .action-card {
          flex-basis: min(82vw, 300px);
          min-height: 450px;
        }
        .launch-pad {
          grid-template-columns: 1fr;
        }
        .feedback p {
          font-size: 19px;
        }
        .action-row {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SimulationPageComponent {
  readonly state = inject(StudentStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pendingDecision = signal<string | null>(null);
  private readonly sceneId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('scene') ?? 'hospital-q1')),
    { initialValue: 'hospital-q1' },
  );
  readonly scenario = computed(
    () =>
      this.state.scenarios.find((item) => item.id === this.sceneId()) ?? this.state.scenarios[0],
  );
  readonly selected = computed(() => this.state.decisions()[this.scenario().id]);
  readonly selectedDecision = computed(() =>
    this.scenario().decisions.find((item) => item.id === this.selected()),
  );
  readonly activeDecision = computed(() => {
    const decisions = this.scenario().decisions;
    const selected = this.selected();
    const pending = this.pendingDecision();
    return (
      decisions.find((item) => item.id === selected) ??
      decisions.find((item) => item.id === pending) ??
      decisions[Math.min(1, decisions.length - 1)] ??
      null
    );
  });

  constructor() {
    void this.ensureBackendAttempt();
  }

  pick(decision: string): void {
    if (this.selectedDecision() || this.state.simulationPaused()) return;
    this.pendingDecision.set(decision);
  }

  async launch(): Promise<void> {
    const decision = this.activeDecision();
    if (!decision || this.selectedDecision() || this.state.simulationPaused()) return;
    await this.state.chooseDecision(this.scenario().id, decision.id);
  }

  next(): void {
    if (this.state.simulationPaused()) return;
    this.pendingDecision.set(null);
    const next = this.scenario().next;
    if (next === 'reflection')
      void this.router.navigate(['/student/reflection', this.state.selectedCaseId()]);
    else void this.router.navigate(['/student/simulation', this.state.selectedCaseId(), next]);
  }

  togglePause(): void {
    this.state.setSimulationPaused(!this.state.simulationPaused());
  }
  isActive(decision: string): boolean {
    return this.activeDecision()?.id === decision;
  }
  isSceneDone(scene: string): boolean {
    return Boolean(this.state.decisions()[scene]);
  }
  currentQuestionNumber(): number {
    return Math.max(
      1,
      this.state.scenarios.findIndex((item) => item.id === this.scenario().id) + 1,
    );
  }
  activeDecisionIndex(): number {
    return Math.max(
      0,
      this.scenario().decisions.findIndex((item) => item.id === this.activeDecision()?.id),
    );
  }
  cardTilt(index: number): string {
    return `${[-4, 1.5, 4, -2][index % 4]}deg`;
  }

  cardMode(decision: Decision): string {
    if (
      decision.title.toLowerCase().includes('ley') ||
      decision.title.toLowerCase().includes('resolución')
    )
      return 'Modo ley';
    if (
      decision.title.toLowerCase().includes('riesgo') ||
      decision.title.toLowerCase().includes('protección')
    )
      return 'Modo escudo';
    if (
      decision.title.toLowerCase().includes('pap') ||
      decision.title.toLowerCase().includes('epicee')
    )
      return 'Modo detective';
    return decision.tone === 'green' ? 'Modo clínico' : 'Modo impulso';
  }

  cardIcon(decision: Decision, index = 0): string {
    const icons: Record<string, Record<string, string>> = {
      'hospital-q1': { a: '📣', b: '🫶', c: '🚨' },
      'hospital-q2': { a: '📜', b: '⚖️', c: '🧭' },
      'hospital-q3': { a: '🧩', b: '💬', c: '🌀', d: '🛟' },
      'comisaria-q1': { a: '🕊️', b: '🛡️', c: '🪞' },
      'comisaria-q2': { a: '🏛️', b: '📚', c: '🔎' },
      'comisaria-q3': { a: '🧠', b: '🩺', c: '🌐' },
    };
    const mapped = icons[this.scenario().id]?.[decision.id];
    if (mapped) return mapped;
    const title = decision.title.toLowerCase();
    if (title.includes('ley') || title.includes('resolución')) return '⚖️';
    if (title.includes('riesgo') || title.includes('protección') || title.includes('ruta'))
      return '🛡️';
    if (title.includes('interrogar')) return '⚠️';
    if (title.includes('pap') || title.includes('epicee') || title.includes('escucha')) return '🔎';
    if (title.includes('notificar')) return '📣';
    return ['◇', '✦', '✧', '✹'][index % 4];
  }

  cardKicker(decision: Decision): string {
    if (decision.tone === 'green') return 'Instinto clínico recomendado';
    if (decision.xp <= 8) return 'Riesgo de daño';
    return 'Ruta incompleta';
  }

  private async ensureBackendAttempt(): Promise<void> {
    const caseId = this.route.snapshot.paramMap.get('id');
    if (caseId) await this.state.selectCase(caseId);
    await this.state.startAttempt();
    await this.state.syncAttemptToVisualScene(this.sceneId());
  }

  attributeScore(decision: Decision, attribute: 'empathy' | 'protocol' | 'risk'): number {
    const base = decision.tone === 'green' ? 86 : decision.xp >= 20 ? 68 : 42;
    const text = `${decision.title} ${decision.body}`.toLowerCase();
    const boosts = {
      empathy:
        text.includes('escucha') || text.includes('contención') || text.includes('pap')
          ? 14
          : text.includes('interrogar')
            ? -20
            : 0,
      protocol:
        text.includes('ley') ||
        text.includes('resolución') ||
        text.includes('epicee') ||
        text.includes('ruta')
          ? 16
          : 0,
      risk:
        text.includes('riesgo') || text.includes('protección') || text.includes('feminicidio')
          ? 18
          : text.includes('perdón')
            ? -22
            : 0,
    };
    return Math.max(18, Math.min(100, base + boosts[attribute]));
  }
}
