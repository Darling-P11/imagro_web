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
  showModal: boolean = false; // ✅ Control de visibilidad del modal
  selectedConfigData: any = null; // ✅ Datos de configuración seleccionada
  isModalVisible: boolean = false;

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

  // ✅ Mostrar configuración en el modal
  // ✅ Mostrar la configuración de una contribución específica
// ✅ Mostrar la configuración específica de la contribución desde Firestore
viewConfiguration(contribution: any): void {
  this.contributionService.getSpecificContribution(contribution.usuarioId, contribution.id)
    .subscribe((configData) => {
      this.selectedConfigData = configData.configuracionCompleta; // ✅ Obtenemos la configuración exacta
      this.showModal = true; // ✅ Mostrar el modal con los datos
    }, (error) => {
      console.error('Error al obtener la configuración:', error);
    });
}


  // ❌ Cerrar el modal
  closeModal(): void {
    this.showModal = false;
  }

  // 📄 Visualizar contribución
  viewContribution(contribution: any): void {
    console.log('Visualizando contribución:', contribution);
  }
  


// ✅ Obtener lista de cultivos
// ✅ Obtener lista de cultivos de la contribución seleccionada
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
