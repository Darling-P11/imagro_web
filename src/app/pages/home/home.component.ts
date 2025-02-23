import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service'; // Importar el servicio de autenticación

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('0.5s ease-out', style({ opacity: 0, transform: 'translateX(-50px)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    this.authService.isLoggedIn().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']); // Redirigir automáticamente al dashboard si está autenticado
      }
    });
  }

  // Método para redirigir al login con una pequeña animación de retraso
  goToLogin() {
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500); // Sincroniza con la animación
  }
}
