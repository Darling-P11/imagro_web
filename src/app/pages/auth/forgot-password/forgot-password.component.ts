import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onResetPassword() {
    if (!this.email || !this.email.includes('@')) {
      this.showAlert('Correo electrónico inválido.', 'error');
      return;
    }

    this.authService.resetPassword(this.email)
      .then(() => {
        this.showAlert('Correo de recuperación enviado. Revisa tu bandeja.', 'success');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      })
      .catch(() => {
        this.showAlert('Error al enviar el correo. Intenta de nuevo.', 'error');
      });
  }

  showAlert(message: string, type: 'success' | 'error') {
    this.message = message;
    this.error = type === 'error' ? message : '';
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
