import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false; // ✅ Nueva variable para alternar visibilidad

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // ✅ Alterna entre mostrar y ocultar contraseña
  }
  

  onLogin() {
    if (this.loginForm.invalid) {
      this.errorMessage = "Por favor, completa los campos correctamente.";
      return;
    }

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password)
      .then(() => {
        this.successMessage = "Inicio de sesión exitoso.";
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      })
      .catch(error => {
        this.errorMessage = "Credenciales incorrectas.";
        console.error(error);
      });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle()
      .then(() => {
        this.successMessage = "Inicio de sesión con Google exitoso.";
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      })
      .catch(error => console.error(error));
  }
}
