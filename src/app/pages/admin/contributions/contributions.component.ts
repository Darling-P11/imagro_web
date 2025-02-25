import { Component, OnInit } from '@angular/core';
import { ContributionService } from '../../../services/contribution.service';
import { getAuth } from 'firebase/auth';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-contributions',
  standalone: true,
  imports: [CommonModule, DatePipe, JsonPipe],
  templateUrl: './contributions.component.html',
  styleUrls: ['./contributions.component.css'],
})
export class ContributionsComponent implements OnInit {
  contributions: any[] = [];
  isLoading: boolean = true;
  selectedContribution: any = null;
  showModal: boolean = false;
  selectedConfigData: any = null;
  isModalVisible: boolean = false;
  rejectingContributionId: string | null = null; // ✅ Estado de rechazo por contribución

  constructor(private contributionService: ContributionService) {}

  ngOnInit(): void {
    this.loadPendingContributions();
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
  // ✅ Actualizar estado de una contribución (aceptar o rechazar) con mensajes de confirmación
// ✅ Actualizar estado de una contribución (aceptar o rechazar)
async updateStatus(contribution: any, status: string): Promise<void> {
  if (status === 'rechazado') {
    this.rejectingContributionId = contribution.id; // ✅ Activar el loading específico

    try {
      const contributionId = contribution.configuracionCompleta.contribucion_id;

      await this.contributionService.rejectContribution(
        contribution.usuarioId,
        contributionId,
        contribution.id
      );

      // 🔄 Esperar a que la tabla se actualice antes de finalizar el loading
      await this.loadPendingContributions();
    } catch (error) {
      console.error('❌ Error al rechazar la contribución:', error);
    } finally {
      this.rejectingContributionId = null; // ✅ Desactivar el loading después de actualizar la tabla
    }
  } else if (status === 'aceptado') {
    this.rejectingContributionId = contribution.id; // ✅ Activar el loading para aceptar también

    try {
      await this.contributionService.updateContributionStatus(
        contribution.usuarioId,
        contribution.id,
        status
      );
      await this.loadPendingContributions();
    } catch (error) {
      console.error('❌ Error al aceptar la contribución:', error);
    } finally {
      this.rejectingContributionId = null; // ✅ Desactivar el loading después de actualizar
    }
  }
}



  // ✅ Mostrar configuración en el modal
  viewConfiguration(contribution: any): void {
    this.contributionService.getSpecificContribution(contribution.usuarioId, contribution.id)
      .subscribe((configData) => {
        this.selectedConfigData = configData.configuracionCompleta;
        this.showModal = true;
      }, (error) => {
        console.error('Error al obtener la configuración:', error);
      });
  }

  // ❌ Cerrar el modal
  closeModal(): void {
    this.showModal = false;
  }

  // ✅ Obtener lista de cultivos
  getCultivos(configData: any): string[] {
    return configData ? Object.keys(configData) : [];
  }

  // ✅ Obtener tipos de cultivo por cada cultivo
  getTiposCultivo(cultivoData: any): string[] {
    return cultivoData ? Object.keys(cultivoData) : [];
  }

  // ✅ Obtener el estado de un tipo de cultivo específico
  getEstado(cultivoData: any, tipo: string): string {
    return cultivoData[tipo]?.estado || 'No especificado';
  }

  // ✅ Obtener las enfermedades de un tipo de cultivo específico
  getEnfermedades(cultivoData: any, tipo: string): string {
    return cultivoData[tipo]?.enfermedades?.join(', ') || 'Sin enfermedades';
  }
}
