import { Component } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { collection, getDocs, deleteDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-tag-management',
  standalone: true,
  templateUrl: './tag-management.component.html',
  styleUrls: ['./tag-management.component.css'],
  imports: [FormsModule, CommonModule]
})
export class TagManagementComponent {
  estados: string[] = ['Sano', 'Enfermo', 'Mixto'];
  cultivoSeleccionado: string = '';
  tipoTemporal: string = '';
  tiposCultivo: string[] = [];
  estadoSeleccionado: string = '';
  enfermedadTemporal: string = '';
  enfermedadesSeleccionadas: string[] = [];
  cargando: boolean = false;
  mensajeExito: string = '';
  mostrarModal: boolean = false;
  configPendiente: any = null;
  formTocado: boolean = false;
  cultivos: any[] = [];
  cargandoListado: boolean = false;


  constructor(private firestore: Firestore) {}

  verificarEstado() {
    if (this.estadoSeleccionado !== 'Enfermo') {
      this.enfermedadesSeleccionadas = [];
    }
  }
  async ngOnInit() {
  await this.cargarCultivos();
}

  agregarTipo() {
    if (this.tipoTemporal.trim() && !this.tiposCultivo.includes(this.tipoTemporal)) {
      this.tiposCultivo.push(this.tipoTemporal.trim());
      this.tipoTemporal = '';
    }
  }

  eliminarTipo(tipo: string) {
    this.tiposCultivo = this.tiposCultivo.filter(t => t !== tipo);
  }

  agregarEnfermedad() {
    if (this.enfermedadTemporal.trim() && !this.enfermedadesSeleccionadas.includes(this.enfermedadTemporal)) {
      this.enfermedadesSeleccionadas.push(this.enfermedadTemporal.trim());
      this.enfermedadTemporal = '';
    }
  }

  eliminarEnfermedad(enfermedad: string) {
    this.enfermedadesSeleccionadas = this.enfermedadesSeleccionadas.filter(e => e !== enfermedad);
  }

  async confirmarGuardado() {
  this.mostrarModal = false;
  this.cargando = true;
  this.mensajeExito = '';

  const cultivoPath = `configuraciones/cultivos/cultivos/${this.configPendiente.cultivo}`;
  const cultivoDocRef = doc(this.firestore, cultivoPath);

  try {
    await setDoc(cultivoDocRef, this.configPendiente, { merge: true });
    this.mensajeExito = 'Configuración guardada correctamente.';
    this.cultivoSeleccionado = '';
    this.tiposCultivo = [];
    this.estadoSeleccionado = '';
    this.enfermedadesSeleccionadas = [];
    this.configPendiente = null;
  } catch (error) {
    console.error('Error al guardar:', error);
  }

  this.cargando = false;
}


  abrirModal() {
  if (!this.cultivoSeleccionado || this.tiposCultivo.length === 0 || !this.estadoSeleccionado) {
    this.formTocado = true;
    return;
  }

  this.configPendiente = {
    cultivo: this.cultivoSeleccionado,
    tipos: this.tiposCultivo,
    estado: this.estadoSeleccionado,
    enfermedades: this.estadoSeleccionado === 'Enfermo' ? this.enfermedadesSeleccionadas : []
  };

  this.mostrarModal = true;
}

cancelarGuardado() {
  this.mostrarModal = false;
  this.configPendiente = null;
}

async cargarCultivos() {
  this.cargandoListado = true;
  this.cultivos = [];

  const ref = collection(this.firestore, 'configuraciones/cultivos/cultivos');
  const snap = await getDocs(ref);

  snap.forEach(docSnap => {
    this.cultivos.push({ nombre: docSnap.id, ...docSnap.data() });
  });

  this.cargandoListado = false;
}

editarCultivo(cultivo: any) {
  // Cargar datos en los inputs
  this.cultivoSeleccionado = cultivo.nombre;
  this.tiposCultivo = cultivo.tipos || [];
  this.estadoSeleccionado = cultivo.estado;
  this.enfermedadesSeleccionadas = cultivo.enfermedades || [];

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async eliminarCultivo(cultivo: any) {
  const confirmacion = confirm(`¿Eliminar el cultivo "${cultivo.nombre}"?`);

  if (!confirmacion) return;

  const ref = doc(this.firestore, `configuraciones/cultivos/cultivos/${cultivo.nombre}`);
  await deleteDoc(ref);
  await this.cargarCultivos();
}
}
