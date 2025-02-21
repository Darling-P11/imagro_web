import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isPasswordVisible: boolean = false;
  isLoading: boolean = false; // Estado de carga
  defaultPhoto: string = 'assets/icons/default-profile.png';
  alertMessage: string = '';
  alertType: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(16),
        Validators.pattern('^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*\\d).{8,16}$')
      ]],
      name: ['', [Validators.required, Validators.pattern('^([A-Za-z]+\\s){1,3}[A-Za-z]+$')]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      termsAccepted: [false, Validators.requiredTrue], // Términos y condiciones
      
      photo: [this.defaultPhoto]
    });
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  restrictToLetters(event: KeyboardEvent) {
    if (!/^[a-zA-Z\s]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  restrictToNumbers(event: KeyboardEvent) {
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  limitPhoneNumber() {
    const phoneNumberControl = this.registerForm.get('phoneNumber');
    if (phoneNumberControl && phoneNumberControl.value.length > 10) {
      phoneNumberControl.setValue(phoneNumberControl.value.slice(0, 10));
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true; // Iniciar loading
      const userData = this.registerForm.value;
      this.authService.register(userData)
        .then(() => {
          this.showAlert('¡Registro exitoso!', 'success');
          this.isLoading = false; // Finalizar loading
          setTimeout(() => this.router.navigate(['/login']), 3000);
        })
        .catch(error => {
          this.showAlert('Error de registro. Intenta nuevamente.', 'error');
          this.isLoading = false; // Finalizar loading
          console.error('Error de registro:', error);
          this.scrollToTop();
        });
    } else {
      this.showAlert('Por favor, completa todos los campos correctamente.', 'error');
      this.scrollToTop();
    }
  }

  showAlert(message: string, type: 'success' | 'error') {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      this.alertMessage = '';
    }, 3000);
  }
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  signInWithGoogle() {
    this.isLoading = true; // Mostrar carga
    this.authService.signInWithGoogle()
      .then((result) => {
        this.showAlert('¡Registro exitoso con Google!', 'success');
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/home']), 3000);
      })
      .catch((error) => {
        this.showAlert('Error al registrarse con Google. Intenta nuevamente.', 'error');
        this.isLoading = false;
        this.scrollToTop(); // Mover al inicio si ocurre error
      });
  }
}
