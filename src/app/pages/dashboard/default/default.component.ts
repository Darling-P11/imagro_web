import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.css']
})
export class DefaultComponent {
  userName: string = "Kevin Ponce"; 
  userRole: string = "administrador_cultivo"; 

  pendingContributions: number = 8;
  approvedContributions: number = 15;
  rejectedContributions: number = 3;
  totalContributions: number = this.pendingContributions + this.approvedContributions + this.rejectedContributions;

  totalModels: number = 5;
  totalUsers: number = 120; // Número total de usuarios registrados en la app

  // Verifica si el usuario tiene el rol de "administrador_cultivo"
  isAdminCultivo(): boolean {
    return this.userRole === "administrador_cultivo";
  }

  // Formatea el rol reemplazando "_" por espacios y capitalizando cada palabra
  getFormattedRole(): string {
    return this.userRole.replace(/_/g, ' ') // Reemplazar guiones bajos por espacios
      .split(' ') // Separar palabras
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizar cada palabra
      .join(' '); // Unir palabras
  }
}
