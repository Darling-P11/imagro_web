import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { RedirectIfLoggedInGuard } from './guards/redirect-if-logged-in.guard';
import { ContributionsComponent } from './pages/admin/contributions/contributions.component';



export const routes: Routes = [
  // Mostrar Home en la ruta raíz, redirigir si el usuario está logueado
  { path: '', component: HomeComponent, canActivate: [RedirectIfLoggedInGuard] },

  // Rutas de autenticación
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
      { path: '', redirectTo: 'contributions', pathMatch: 'full' }, // Ruta por defecto
      { path: 'contributions', component: ContributionsComponent, canActivate: [AuthGuard] },
      // Aquí puedes agregar más rutas anidadas si es necesario
    ]
  },

  // Ruta comodín
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

export const appRoutingProviders = [provideRouter(routes)];
