import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn().pipe(
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true; // Permitir acceso si está autenticado
        } else {
          return this.router.createUrlTree(['/login']); // Redirigir al login si no está autenticado
        }
      })
    );
  }
}
