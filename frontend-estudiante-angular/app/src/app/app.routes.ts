import { Routes } from '@angular/router';
import { AccessPageComponent } from './pages/access-page.component';
import { AchievementsPageComponent } from './pages/achievements-page.component';
import { BiometricPageComponent } from './pages/biometric-page.component';
import { BriefingPageComponent } from './pages/briefing-page.component';
import { CasesPageComponent } from './pages/cases-page.component';
import { ChangePasswordPageComponent } from './pages/change-password-page.component';
import { CompetenciesPageComponent } from './pages/competencies-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { EnvironmentsPageComponent } from './pages/environments-page.component';
import { OnboardingPageComponent } from './pages/onboarding-page.component';
import { PinguinoPageComponent } from './pages/pinguino-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';
import { RecoveryPageComponent } from './pages/recovery-page.component';
import { ReferenceArchivePageComponent } from './pages/reference-archive-page.component';
import { ReferenceViewPageComponent } from './pages/reference-view-page.component';
import { ReflectionPageComponent } from './pages/reflection-page.component';
import { ResultsPageComponent } from './pages/results-page.component';
import { SimulationPageComponent } from './pages/simulation-page.component';
import { ToolkitPageComponent } from './pages/toolkit-page.component';
import { WarningPageComponent } from './pages/warning-page.component';

export const routes: Routes = [
  { path: 'login', component: AccessPageComponent },
  { path: 'change-password', component: ChangePasswordPageComponent },
  { path: 'recover', component: RecoveryPageComponent },
  { path: 'biometric', component: BiometricPageComponent },
  { path: 'dashboard', redirectTo: 'student/dashboard', pathMatch: 'full' },
  { path: 'student', redirectTo: 'student/dashboard', pathMatch: 'full' },
  { path: 'student/onboarding/:step', component: OnboardingPageComponent },
  { path: 'student/dashboard', component: DashboardPageComponent },
  { path: 'student/profile', component: ProfilePageComponent },
  { path: 'student/achievements', component: AchievementsPageComponent },
  { path: 'student/cases', component: CasesPageComponent },
  { path: 'student/case/:id', component: BriefingPageComponent },
  { path: 'student/simulation/:id/consent', component: WarningPageComponent },
  { path: 'student/simulation/:id/:scene', component: SimulationPageComponent },
  { path: 'student/toolkit', component: ToolkitPageComponent },
  { path: 'student/toolkit/:section', component: ToolkitPageComponent },
  { path: 'student/reflection/:id', component: ReflectionPageComponent },
  { path: 'student/results/:id', component: ResultsPageComponent },
  { path: 'student/competencies', component: CompetenciesPageComponent },
  { path: 'student/environments', component: EnvironmentsPageComponent },
  { path: 'student/reference', component: ReferenceArchivePageComponent },
  { path: 'student/reference/:screen', component: ReferenceViewPageComponent },
  { path: 'admin/ia', component: PinguinoPageComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
