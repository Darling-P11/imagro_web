import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

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
export class HomeComponent {

  constructor(private router: Router) {}

  goToLogin() {
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500); // Sincroniza con la animación
  }
}
