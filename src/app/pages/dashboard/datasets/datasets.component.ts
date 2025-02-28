import { Component, OnInit } from '@angular/core';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Carpeta {
  nombre: string;
  ruta: string;
  abierta: boolean;
  seleccionado: boolean;
  subcarpetas: Carpeta[];
}

@Component({
  selector: 'app-datasets',
  standalone: true,
  templateUrl: './datasets.component.html',
  styleUrls: ['./datasets.component.css'],
  imports: [CommonModule, FormsModule]
})
export class DatasetsComponent implements OnInit {
  datasets: any[] = [];
  carpetas: Carpeta[] = [];
  estructuraExplorador: Carpeta[] = [];
  imagenes: any[] = []; // 🔹 Nuevo array para almacenar imágenes en la carpeta actual
  rutaActual: string = 'contribuciones/';
  lastUpdated: string = 'a year ago';
  totalArchivos: number = 0;
  totalGB: number = 0;

  constructor() {}

  ngOnInit() {
    this.cargarCarpetas(this.rutaActual);
  }

  async cargarCarpetas(ruta: string) {
    this.totalArchivos = 0;
    this.totalGB = 0;
    this.imagenes = []; // 🔹 Limpiar imágenes al cambiar de carpeta
    const storage = getStorage();
    const carpetaRef = ref(storage, ruta);

    try {
      const listado = await listAll(carpetaRef);

      let nuevasCarpetas = listado.prefixes.map(folderRef => ({
        nombre: folderRef.name,
        ruta: folderRef.fullPath,
        abierta: false,
        seleccionado: false,
        subcarpetas: []
      }));

      this.estructuraExplorador = [];
      this.actualizarEstructuraExplorador(ruta.split('/'), nuevasCarpetas);
      this.carpetas = nuevasCarpetas;

      // 🔹 Obtener imágenes dentro de la carpeta actual
      if (listado.items.length > 0) {
        const archivos = await Promise.all(
          listado.items.map(async (item) => {
            const url = await getDownloadURL(item);
            return { nombre: item.name, url };
          })
        );
        this.imagenes = archivos.map(imagen => ({
          nombre: imagen.nombre ? imagen.nombre : 'Imagen sin nombre',
          url: imagen.url
        }));
         // 🔹 Guardamos las imágenes
      }

    } catch (error) {
      console.error("❌ Error cargando carpetas e imágenes:", error);
    }
  }

  navegar(ruta: string) {
    this.rutaActual = ruta;
    this.cargarCarpetas(ruta);
  }

  toggleSeleccion(carpeta: Carpeta) {
    if (!carpeta.seleccionado) {
      this.desactivarSubcarpetas(carpeta);
      this.cerrarYCambiarVista(carpeta);
    }
  }

  desactivarSubcarpetas(carpeta: Carpeta) {
    carpeta.abierta = false;
    carpeta.seleccionado = false;

    if (carpeta.subcarpetas && carpeta.subcarpetas.length > 0) {
      carpeta.subcarpetas.forEach(subcarpeta => {
        this.desactivarSubcarpetas(subcarpeta);
      });
    }
  }

  cerrarYCambiarVista(carpeta: Carpeta) {
    if (this.rutaActual.startsWith(carpeta.ruta)) {
      this.regresar();
    }
  }

  regresar() {
    if (this.rutaActual !== 'contribuciones/') {
      const partes = this.rutaActual.split('/');
      partes.pop();
      this.rutaActual = partes.join('/') + '/';
      this.cargarCarpetas(this.rutaActual);
    }
  }

  actualizarEstructuraExplorador(rutaDividida: string[], carpetas: Carpeta[]) {
    let estructura = this.estructuraExplorador;
    let rutaParcial = '';
    let carpetaExistente: Carpeta | null = null;

    for (let segmento of rutaDividida) {
      if (!segmento) continue;

      rutaParcial += (rutaParcial ? '/' : '') + segmento;
      let carpetaIndex = estructura.findIndex(c => c.nombre === segmento);

      if (carpetaIndex === -1) {
        carpetaExistente = {
          nombre: segmento,
          ruta: rutaParcial,
          abierta: true,
          seleccionado: true,
          subcarpetas: []
        };
        estructura.push(carpetaExistente);
      } else {
        carpetaExistente = estructura[carpetaIndex];
        carpetaExistente.abierta = true;
        carpetaExistente.seleccionado = true;
      }

      estructura = carpetaExistente.subcarpetas;
    }

    if (carpetaExistente) {
      carpetaExistente.subcarpetas = [...carpetas];
    }

    this.estructuraExplorador = [...this.estructuraExplorador]; 
  }

  toggleCarpeta(carpeta: Carpeta) {
    carpeta.abierta = true;
    this.navegar(carpeta.ruta);
  }
}
