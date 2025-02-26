import { Component } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private firestore: Firestore) {}

  verificarEstado() {
    if (this.estadoSeleccionado !== 'Enfermo') {
      this.enfermedadesSeleccionadas = [];
    }
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

  async guardarConfiguracion() {
    if (!this.cultivoSeleccionado || this.tiposCultivo.length === 0 || !this.estadoSeleccionado) return;

    this.cargando = true;
    this.mensajeExito = '';

    const cultivoPath = `configuraciones/cultivos/cultivos/${this.cultivoSeleccionado}`;
    const cultivoDocRef = doc(this.firestore, cultivoPath);

    const nuevaConfig = {
      tipos: this.tiposCultivo,
      estado: this.estadoSeleccionado,
      enfermedades: this.estadoSeleccionado === 'Enfermo' ? this.enfermedadesSeleccionadas : []
    };

    try {
      await setDoc(cultivoDocRef, nuevaConfig, { merge: true });
      this.mensajeExito = 'Configuración guardada correctamente.';
      this.cultivoSeleccionado = '';
      this.tiposCultivo = [];
      this.estadoSeleccionado = '';
      this.enfermedadesSeleccionadas = [];
    } catch (error) {
      console.error('Error al guardar:', error);
    }

    this.cargando = false;
  }
}
