import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { NeuroHeaderComponent } from '../shared/neuro-header.component';

@Component({
  standalone: true,
  imports: [RouterLink, BottomNavComponent, NeuroHeaderComponent],
  template: `
    <main class="screen"><app-neuro-header status="QA_VISUAL_ARCHIVE" /><div class="content">
      <p class="eyebrow">VALIDACIÓN PIXEL-PERFECT</p><h1>Archivo Visual del Estudiante</h1><p>Las 46 capturas originales se conservan en el frontend para comparación visual durante QA.</p>
      <div class="archive">@for (file of files; track file; let index = $index) { <a class="panel" [routerLink]="['/student/reference', index + 1]"><b>{{ pad(index + 1) }}</b><span>{{ label(file) }}</span></a> }</div>
    </div><app-bottom-nav /></main>
  `,
  styles: [`
    .archive{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:22px}.archive a{display:grid;gap:8px;padding:14px;transition:.2s}.archive a:hover{border-color:var(--cyan);transform:translateY(-2px)}b{color:var(--cyan);font:18px var(--mono)}span{color:var(--muted);font-size:12px}
  `]
})
export class ReferenceArchivePageComponent {
  readonly files = REFERENCE_FILES;
  pad(value: number): string { return String(value).padStart(3, '0'); }
  label(value: string): string { return value.replace(/^\d+_/, '').replace(/\.png$/, '').replaceAll('_', ' '); }
}

export const REFERENCE_FILES = [
  '001_acceso_al_sistema_neurocommand_1.png','002_acceso_al_sistema_neurocommand_2.png','003_acceso_al_sistema_neurocommand_3.png','004_acceso_al_sistema_neurocommand_4.png','005_onboarding_analisis_neural.png','006_onboarding_consolidaci_n_de_perfil_1.png','007_onboarding_consolidaci_n_de_perfil_2.png','008_onboarding_estudiante_paso_1.png','009_onboarding_estudiante_paso_2.png','010_perfil_de_usuario_configuracion_personal.png','011_recuperacion_de_acceso_seguridad_1.png','012_recuperacion_de_acceso_seguridad_2.png','013_seguridad_biometrica_configuracion_acceso.png','014_centro_de_logros_progresion_academica_1.png','015_centro_de_logros_progresion_academica_2.png','016_panel_de_control_estudiante_1.png','017_panel_de_control_estudiante_2.png','018_panel_de_control_estudiante_3.png','019_salon_de_la_fama_lite_neural.png','020_briefing_del_caso_introducci_n_narrativa_1.png','021_briefing_del_caso_introducci_n_narrativa_2.png','022_briefing_del_caso_introducci_n_narrativa_3.png','023_dossier_de_sujetos_selecci_n_de_caso.png','024_advertencia_de_contenido_sensible_1.png','025_advertencia_de_contenido_sensible_2.png','026_advertencia_de_contenido_sensible_3.png','027_escenario_atencion_hospitalaria_1.png','028_escenario_atencion_hospitalaria_2.png','029_escenario_comisaria_de_familia.png','030_escenario_intervencion_comunitaria.png','031_retroalimentaci_n_de_dialogo_en_vivo.png','032_simulacion_estado_de_crisis_aguda.png','033_caja_de_herramientas_biblioteca_digital_1.png','034_caja_de_herramientas_biblioteca_digital_2.png','035_caja_de_herramientas_detalle_dsm_v.png','036_caja_de_herramientas_protocolos_legales.png','037_herramientas_detalle_dsm_v_avanzado.png','038_herramientas_escalas_psicometricas.png','039_evaluaci_n_competencias_transversales.png','040_informe_evolucion_de_competencias.png','041_informe_final_de_resultados_1.png','042_informe_final_de_resultados_2.png','043_informe_final_de_resultados_3.png','044_entorno_inmersion_en_unidad_de_trauma.png','045_galeria_de_entornos_de_simulacion_1.png','046_galeria_de_entornos_de_simulacion_2.png'
];
