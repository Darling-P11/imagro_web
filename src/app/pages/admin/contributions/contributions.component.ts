import { Component, OnInit } from '@angular/core';
import { ContributionService } from '../../../services/contribution.service';
import { getAuth } from 'firebase/auth';
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';


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
isVisualizeModalVisible: boolean = false; //  Control del modal de visualización
isLoadingConfiguration: boolean = false;
isLoadingImages: boolean = false;
isProcessingRejection: boolean = false; //  Para mostrar overlay mientras se rechaza
showRejectConfirmModal: boolean = false;
pendingRejectContribution: any = null;
isUpdatingTable: boolean = false;
showAcceptConfirmModal: boolean = false;
pendingAcceptContribution: any = null;
currentProcessingText: string = 'Procesando...';






  

  constructor(private contributionService: ContributionService) {}

  ngOnInit(): void {
    this.loadPendingContributions();
  }

  //  Cargar contribuciones pendientes de todos los usuarios
  loadPendingContributions(): void {
    this.contributionService.getPendingContributions().subscribe((data) => {
      this.contributions = data;
      this.isLoading = false;
    });
  }

  //  Seleccionar una contribución para mostrar detalles
  selectContribution(contribution: any): void {
    this.selectedContribution = contribution;
  }

//  Actualizar estado de una contribución (aceptar o rechazar)
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
    

    //  Recargar la lista de contribuciones
    await this.loadPendingContributions();
  } catch (error) {
    console.error(` Error al actualizar el estado a ${status}:`, error);
  } finally {
    this.rejectingContributionId = null;
    this.currentAction = null;
  }
}



  //  Mostrar configuración en el modal
  viewConfiguration(contribution: any): void {
  this.isLoadingConfiguration = true;

  this.contributionService.getSpecificContribution(contribution.usuarioId, contribution.id)
    .subscribe({
      next: (configData) => {
        this.selectedConfigData = configData.configuracionCompleta;
        this.showModal = true;
      },
      error: (error) => {
        console.error('Error al obtener la configuración:', error);
      },
      complete: () => {
        this.isLoadingConfiguration = false;
      }
    });
}



  //  Visualizar imágenes de la contribución seleccionada
viewContribution(contribution: any): void {
  this.isLoadingImages = true; //  Mostrar overlay de carga

  // Simulamos un pequeño delay para dar tiempo al spinner
  setTimeout(() => {
    const images = contribution.contributionDetails.imagenes;

    if (images && images.length > 0) {
      this.selectedImages = images.map((img: any) => ({ ...img, loaded: false }));

      //  Esperar un tiempo prudente para simular "carga" de imágenes
      setTimeout(() => {
        this.isVisualizeModalVisible = true; //  Mostrar modal
        this.isLoadingImages = false; //  Ocultar loading
      }, 600); // puedes ajustar este tiempo si quieres más fluidez
    } else {
      console.warn('No hay imágenes disponibles para esta contribución.');
      this.isLoadingImages = false;
    }
  }, 200); // pequeño delay para que alcance a mostrar el spinner
}
onImageLoad(img: any) {
  img.loaded = true;
}

onImageError(img: any) {
  img.loaded = true; // Evita spinner infinito si la imagen falla
}

// MODAL Al hacer click en "Rechazar"
openRejectConfirm(contribution: any): void {
  this.pendingRejectContribution = contribution;
  this.showRejectConfirmModal = true;
}

//  Si cancela el modal
cancelReject(): void {
  this.showRejectConfirmModal = false;
  this.pendingRejectContribution = null;
}

//  Si confirma el rechazo
async confirmReject(): Promise<void> {
  
  this.showRejectConfirmModal = false;
  this.isProcessingRejection = true;
  this.currentProcessingText = 'Rechazando contribución...';

  const contribution = this.pendingRejectContribution;
  this.rejectingContributionId = contribution.id;
  this.currentAction = 'rechazado';

  try {
    const contributionId = contribution.configuracionCompleta.contribucion_id;

    await this.contributionService.rejectContribution(
      contribution.usuarioId,
      contributionId,
      contribution.id
    );

    await this.contributionService.sendNotification(
    contribution.usuarioId,
    'Contribución rechazada',
    'Tu contribución ha sido revisada y lamentablemente ha sido rechazada. Te invitamos a intentarlo nuevamente.'
  );


    //  Esperar brevemente para simular la actualización (opcional)
    this.isUpdatingTable = true;

setTimeout(async () => {
  await this.loadPendingContributions();
  this.isProcessingRejection = false;
  this.isUpdatingTable = false;
}, 1000);

  } catch (error) {
    console.error(' Error al rechazar la contribución:', error);
    this.isProcessingRejection = false;
  } finally {
    this.rejectingContributionId = null;
    this.currentAction = null;
    this.pendingRejectContribution = null;
  }
}

//PROCEDIMIENTO PARA ACEPTAR CONTRIBUCION CON MODALES 2.0
//  Abrir confirmación
openAcceptConfirm(contribution: any): void {
  this.pendingAcceptContribution = contribution;
  this.showAcceptConfirmModal = true;
}

//  Cancelar
cancelAccept(): void {
  this.showAcceptConfirmModal = false;
  this.pendingAcceptContribution = null;
}

//  Confirmar aceptación
async confirmAccept(): Promise<void> {
  this.showAcceptConfirmModal = false;
  this.isProcessingRejection = true; // Reutilizamos el overlay de "procesando"
  this.currentProcessingText = 'Aceptando contribución...';
  const contribution = this.pendingAcceptContribution;
  this.rejectingContributionId = contribution.id;
  this.currentAction = 'aceptado';

  try {
    const contributionId = contribution.configuracionCompleta.contribucion_id;

    await this.contributionService.acceptContribution(
      contribution.usuarioId,
      contributionId,
      contribution.id
    );
    await this.contributionService.sendNotification(
    contribution.usuarioId,
    'Contribución aceptada',
    'Tu contribución ha sido aceptada exitosamente. ¡Gracias por tu participación!'
  );


    this.isUpdatingTable = true;
    await Promise.resolve();

    await this.loadPendingContributions();
  } catch (error) {
    console.error('❌ Error al aceptar la contribución:', error);
  } finally {
    this.isProcessingRejection = false;
    this.isUpdatingTable = false;
    this.rejectingContributionId = null;
    this.currentAction = null;
    this.pendingAcceptContribution = null;
  }
}





//  Obtener cultivos únicos de las imágenes
getCultivosFromImages(): string[] {
  const cultivos = this.selectedImages.map((img) => img.cultivo);
  return [...new Set(cultivos)]; // Eliminar duplicados
}

//  Obtener tipos únicos por cultivo
getTiposFromImages(cultivo: string): string[] {
  const tipos = this.selectedImages
    .filter((img) => img.cultivo === cultivo)
    .map((img) => img.tipo);
  return [...new Set(tipos)];
}

//  Filtrar imágenes por cultivo y tipo
filterImagesByCultivoAndTipo(cultivo: string, tipo: string): any[] {
  return this.selectedImages.filter((img) => img.cultivo === cultivo && img.tipo === tipo);
}
//  Obtener estados únicos por cultivo y tipo
getEstadosFromImages(cultivo: string, tipo: string): string[] {
  const estados = this.selectedImages
    .filter((img) => img.cultivo === cultivo && img.tipo === tipo)
    .map((img) => img.estado);
  return [...new Set(estados)];
}

//  Obtener enfermedades únicas por cultivo, tipo y estado
getEnfermedadesFromImages(cultivo: string, tipo: string, estado: string): string[] {
  const enfermedades = this.selectedImages
    .filter((img) => img.cultivo === cultivo && img.tipo === tipo && img.estado === estado)
    .map((img) => img.enfermedad);
  return [...new Set(enfermedades)];
}

//  Filtrar imágenes por cultivo, tipo, estado y enfermedad
filterImagesByCompleteCriteria(cultivo: string, tipo: string, estado: string, enfermedad: string): any[] {
  return this.selectedImages.filter(
    (img) => img.cultivo === cultivo && img.tipo === tipo && img.estado === estado && img.enfermedad === enfermedad
  );
}



//  Cerrar el modal de visualización
closeVisualizeModal(): void {
  this.isVisualizeModalVisible = false;
}


  //  Cerrar el modal
  closeModal(): void {
    this.showModal = false;
  }

  //  Obtener lista de cultivos
  getCultivos(configData: any): string[] {
    return configData ? Object.keys(configData) : [];
  }

  //  Obtener tipos de cultivo por cada cultivo
  getTiposCultivo(cultivoData: any): string[] {
    return cultivoData ? Object.keys(cultivoData) : [];
  }

  //  Obtener el estado de un tipo de cultivo específico
  getEstado(cultivoData: any, tipo: string): string {
    return cultivoData[tipo]?.estado || 'No especificado';
  }

  //  Obtener las enfermedades de un tipo de cultivo específico
  getEnfermedades(cultivoData: any, tipo: string): string {
    return cultivoData[tipo]?.enfermedades?.join(', ') || 'Sin enfermedades';
  }

  
}
