import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../../services/auth.service'; // Asegúrate de importar tu servicio de autenticación

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  constructor(private authService: AuthService, private router: Router) {
    // Verificar si el usuario está autenticado
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        this.router.navigate(['/login']); // Redirigir si no hay usuario logueado
      }
    });
  }

  // Cerrar sesión
  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']); // Redirigir al login después de cerrar sesión
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
