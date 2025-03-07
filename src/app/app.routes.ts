import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { RedirectIfLoggedInGuard } from './guards/redirect-if-logged-in.guard';
import { ContributionsComponent } from './pages/admin/contributions/contributions.component';
import { DefaultComponent } from './pages/dashboard/default/default.component';
import { DatasetsComponent } from './pages/dashboard/datasets/datasets.component';
import { GenerarModeloComponent } from './pages/dashboard/generate-models/generate-models.component';


import { GeoreferenceComponent } from './pages/dashboard/georeference/georeference.component';
import { TagManagementComponent } from './pages/admin/tag-management/tag-management.component';

export const routes: Routes = [
  // Página de inicio y autenticación
  { path: '', component: HomeComponent, canActivate: [RedirectIfLoggedInGuard] },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [RedirectIfLoggedInGuard]
  },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Ruta protegida con diseño de dashboard
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'default', pathMatch: 'full' }, // Redirección a Inicio
      { path: 'default', component: DefaultComponent, canActivate: [AuthGuard] },
      { path: 'datasets', component: DatasetsComponent, canActivate: [AuthGuard] },
      { path: 'generate-models', component: GenerarModeloComponent, canActivate: [AuthGuard] }, // ✅ Usando el nombre correcto

      { path: 'georeference', component: GeoreferenceComponent, canActivate: [AuthGuard] },
      
      // Rutas exclusivas para administradores
      { path: 'contributions', component: ContributionsComponent, canActivate: [AuthGuard] },
      { path: 'tag-management', component: TagManagementComponent, canActivate: [AuthGuard] },
    ]
  },

  // Ruta comodín
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

export const appRoutingProviders = [provideRouter(routes)];
