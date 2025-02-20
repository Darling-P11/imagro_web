import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule]  // ✅ Importamos FormsModule para [(ngModel)]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.email, this.password)
      .then(() => this.router.navigate(['/dashboard'])) // ✅ Redirige al dashboard si inicia sesión correctamente
      .catch(error => {
        this.errorMessage = "Credenciales incorrectas";
        console.error(error);
      });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle()
      .then(() => this.router.navigate(['/dashboard'])) // ✅ Redirige al dashboard si inicia sesión con Google
      .catch(error => console.error(error));
  }
}
