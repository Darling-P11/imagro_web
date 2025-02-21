import { Routes } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', component: RegisterComponent }, // ✅ Mover la ruta aquí
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' } // ✅ Ruta comodín al final
];

export const appRoutingProviders = [provideRouter(routes)];