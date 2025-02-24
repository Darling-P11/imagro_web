import { Component, OnInit } from '@angular/core';
import { ContributionService } from '../../../services/contribution.service';
import { getAuth } from 'firebase/auth';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-contributions',
  standalone: true, // ✅ Asegurar standalone para usar pipes
  imports: [CommonModule, DatePipe, JsonPipe],
  templateUrl: './contributions.component.html',
  styleUrls: ['./contributions.component.css'],
})
export class ContributionsComponent implements OnInit {
  contributions: any[] = [];
  isLoading: boolean = true;
  selectedContribution: any = null;

  constructor(private contributionService: ContributionService) {}

  ngOnInit(): void {
    this.loadPendingContributions(); // ✅ Eliminar parámetro userId
  }

  // 🔄 Cargar contribuciones pendientes de todos los usuarios
  loadPendingContributions(): void {
    this.contributionService.getPendingContributions().subscribe((data) => {
      this.contributions = data;
      this.isLoading = false;
    });
  }

  // 📄 Seleccionar una contribución para mostrar detalles
  selectContribution(contribution: any): void {
    this.selectedContribution = contribution;
  }

  // ✅ Actualizar estado de una contribución (aceptar o rechazar)
  async updateStatus(contribution: any, status: string): Promise<void> {
    await this.contributionService.updateContributionStatus(
      contribution.usuarioId,
      contribution.configId,
      status
    );
    this.loadPendingContributions(); // 🔄 Actualizar la lista completa
  }

  // 🔍 Visualizar configuración
  viewConfiguration(contribution: any): void {
    console.log('Ver configuración de:', contribution);
    // Aquí agregaremos la lógica para abrir el detalle de configuración
  }

  // 📄 Visualizar contribución
  viewContribution(contribution: any): void {
    console.log('Visualizando contribución:', contribution);
    // Aquí se podría abrir un modal o una nueva vista
  }
}
