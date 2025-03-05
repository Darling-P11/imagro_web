import { Component, OnInit } from '@angular/core';
import { ContributionService } from '../../../services/contribution.service';
import { getAuth } from 'firebase/auth';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-contributions',
  standalone: true,
  imports: [CommonModule, DatePipe],
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
  rejectingContributionId: string | null = null; // ID de la contribución que está en proceso
currentAction: 'rechazado' | 'aceptado' | null = null; // Estado actual de la acción
selectedImages: any[] = []; // ✅ Lista de imágenes seleccionadas
isVisualizeModalVisible: boolean = false; // ✅ Control del modal de visualización


  

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
async updateStatus(contribution: any, status: string): Promise<void> {
  this.rejectingContributionId = contribution.id;
  this.currentAction = status as 'rechazado' | 'aceptado';

  try {
    const contributionId = contribution.configuracionCompleta.contribucion_id;

    if (status === 'rechazado') {
      await this.contributionService.rejectContribution(
        contribution.usuarioId,
        contributionId,
        contribution.id
      );
    } else if (status === 'aceptado') {
      await this.contributionService.acceptContribution(
        contribution.usuarioId,
        contributionId,
        contribution.id
      );
    }

    // 🔄 Recargar la lista de contribuciones
    await this.loadPendingContributions();
  } catch (error) {
    console.error(`❌ Error al actualizar el estado a ${status}:`, error);
  } finally {
    this.rejectingContributionId = null;
    this.currentAction = null;
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

  // ✅ Visualizar imágenes de la contribución seleccionada
viewContribution(contribution: any): void {
  const images = contribution.contributionDetails.imagenes;

  if (images && images.length > 0) {
    this.selectedImages = images; // ✅ Guardar las imágenes
    this.isVisualizeModalVisible = true; // ✅ Mostrar el modal de visualización
  } else {
    console.warn('No hay imágenes disponibles para esta contribución.');
  }
}
// ✅ Obtener cultivos únicos de las imágenes
getCultivosFromImages(): string[] {
  const cultivos = this.selectedImages.map((img) => img.cultivo);
  return [...new Set(cultivos)]; // Eliminar duplicados
}

// ✅ Obtener tipos únicos por cultivo
getTiposFromImages(cultivo: string): string[] {
  const tipos = this.selectedImages
    .filter((img) => img.cultivo === cultivo)
    .map((img) => img.tipo);
  return [...new Set(tipos)];
}

// ✅ Filtrar imágenes por cultivo y tipo
filterImagesByCultivoAndTipo(cultivo: string, tipo: string): any[] {
  return this.selectedImages.filter((img) => img.cultivo === cultivo && img.tipo === tipo);
}
// ✅ Obtener estados únicos por cultivo y tipo
getEstadosFromImages(cultivo: string, tipo: string): string[] {
  const estados = this.selectedImages
    .filter((img) => img.cultivo === cultivo && img.tipo === tipo)
    .map((img) => img.estado);
  return [...new Set(estados)];
}

// ✅ Obtener enfermedades únicas por cultivo, tipo y estado
getEnfermedadesFromImages(cultivo: string, tipo: string, estado: string): string[] {
  const enfermedades = this.selectedImages
    .filter((img) => img.cultivo === cultivo && img.tipo === tipo && img.estado === estado)
    .map((img) => img.enfermedad);
  return [...new Set(enfermedades)];
}

// ✅ Filtrar imágenes por cultivo, tipo, estado y enfermedad
filterImagesByCompleteCriteria(cultivo: string, tipo: string, estado: string, enfermedad: string): any[] {
  return this.selectedImages.filter(
    (img) => img.cultivo === cultivo && img.tipo === tipo && img.estado === estado && img.enfermedad === enfermedad
  );
}



// ✅ Cerrar el modal de visualización
closeVisualizeModal(): void {
  this.isVisualizeModalVisible = false;
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
