import { Component, OnInit } from '@angular/core';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Carpeta {
  nombre: string;
  ruta: string;
  abierta: boolean;
  seleccionado: boolean;
  subcarpetas: Carpeta[];
  subelementos?: ElementoDescarga[]; // Para cultivos, variedades, enfermedades, etc.
  abierto?: boolean; // Controla si se despliega la sublista
  
}
// ✅ Definir la estructura jerárquica del modal de descarga
interface ElementoDescarga {
  nombre: string;
  ruta: string;
  seleccionado: boolean;
  subelementos?: ElementoDescarga[];
  abierto?: boolean;
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
  imagenes: any[] = [];
  rutaBase: string = 'contribuciones_aceptadas/';
  rutaActual: string = this.rutaBase;
  lastUpdated: string = 'a year ago';
  totalArchivos: number = 0;
  totalGB: number = 0;
  exploradorAbierto: boolean = true;
  modalDescargaAbierto: boolean = false;
  modalAbierto: boolean = false;
  elementosDescarga: ElementoDescarga[] = [];
  

  constructor() {}

  ngOnInit() {
    this.cargarCarpetas(this.rutaActual);
    this.calcularResumenTotal(); // 🔹 Calcular la cantidad de archivos y tamaño total
    this.cargarEstructuraDescarga();
  }

  async cargarCarpetas(ruta: string) {
    this.totalArchivos = 0;
    this.totalGB = 0;
    this.imagenes = [];
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

      if (listado.items.length > 0) {
        const archivos = await Promise.all(
          listado.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);
            return { 
              nombre: item.name, 
              url,
              size: metadata.size || 0 // 🔹 Tamaño real del archivo
            };
          })
        );

        this.imagenes = archivos;
        this.totalArchivos = archivos.length;
        this.totalGB = this.convertirBytesAGB(archivos.reduce((acc, img) => acc + img.size, 0));
      }

    } catch (error) {
      console.error("❌ Error cargando carpetas e imágenes:", error);
    }
  }

  async calcularResumenTotal() {
    this.totalArchivos = 0;
    this.totalGB = 0;
    const storage = getStorage();
    const carpetaRef = ref(storage, this.rutaBase);

    try {
      const listado = await listAll(carpetaRef);
      let totalSize = 0;
      let totalFiles = 0;

      for (const item of listado.items) {
        const metadata = await getMetadata(item);
        totalSize += metadata.size || 0;
        totalFiles++;
      }

      // 🔹 Asignamos los valores calculados al resumen
      this.totalArchivos = totalFiles;
      this.totalGB = this.convertirBytesAGB(totalSize);
    } catch (error) {
      console.error("❌ Error calculando resumen total:", error);
    }
  }

  convertirBytesAGB(bytes: number): number {
    return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2)); // 🔹 Convierte bytes a GB con 2 decimales
  }

  navegar(ruta: string) {
    this.rutaActual = ruta;
    this.cargarCarpetas(ruta);
  }

  regresar() {
    if (this.rutaActual !== this.rutaBase) {
      const partes = this.rutaActual.split('/');
      partes.pop();
      this.rutaActual = partes.join('/') + '/';
      this.cargarCarpetas(this.rutaActual);
    }
  }

  toggleCarpeta(carpeta: Carpeta) {
    carpeta.abierta = true;
    this.navegar(carpeta.ruta);
  }

  toggleExplorador() {
    this.exploradorAbierto = !this.exploradorAbierto;
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

  // 🔹 Simulación de estructura de Firebase Storage (aquí puedes usar listAll si ya está conectado a Firebase)
  async cargarEstructuraDescarga() {
    this.elementosDescarga = []; // Resetear estructura antes de cargar
  
    const storage = getStorage();
    const baseRef = ref(storage, this.rutaBase);
  
    try {
      const listado = await listAll(baseRef);
  
      this.elementosDescarga = await Promise.all(listado.prefixes.map(async (folderRef) => {
        const subCarpetas = await this.obtenerSubcarpetas(folderRef.fullPath);
        return {
          nombre: folderRef.name,
          ruta: folderRef.fullPath,
          seleccionado: false,
          abierto: false,
          subelementos: subCarpetas,
        };
      }));
    } catch (error) {
      console.error("❌ Error cargando estructura de descarga:", error);
    }
  }
  
  // 🔹 Obtiene subcarpetas y archivos de una carpeta específica
  async obtenerSubcarpetas(ruta: string): Promise<ElementoDescarga[]> {
    const storage = getStorage();
    const carpetaRef = ref(storage, ruta);
    let subelementos: ElementoDescarga[] = [];
  
    try {
      const listado = await listAll(carpetaRef);
  
      subelementos = await Promise.all(listado.prefixes.map(async (subFolderRef) => {
        const subSubCarpetas = await this.obtenerSubcarpetas(subFolderRef.fullPath);
        return {
          nombre: subFolderRef.name,
          ruta: subFolderRef.fullPath,
          seleccionado: false,
          abierto: false,
          subelementos: subSubCarpetas,
        };
      }));
  
      listado.items.forEach((item) => {
        subelementos.push({
          nombre: item.name,
          ruta: item.fullPath,
          seleccionado: false,
        });
      });
    } catch (error) {
      console.error("❌ Error obteniendo subcarpetas:", error);
    }
  
    return subelementos;
  }
  

  abrirModal() {
    this.modalAbierto = true;
    this.cargarEstructuraDescarga(); // 🔹 Cargar datos en tiempo real
  }
  

  cerrarModal() {
    this.modalAbierto = false;
  }

  // ✅ Expande/cierra carpetas al hacer clic en el checkbox, nombre o ícono
  toggleExpandir(elemento: ElementoDescarga) {
    elemento.abierto = !elemento.abierto;
  }

  // ✅ Si se selecciona un elemento, se seleccionan sus subelementos
  toggleSeleccion(elemento: ElementoDescarga) {
    elemento.seleccionado = !elemento.seleccionado;
    if (elemento.subelementos) {
      elemento.subelementos.forEach(sub => sub.seleccionado = elemento.seleccionado);
    }
  }

  confirmarDescarga() {
    const seleccionados = this.obtenerSeleccionados(this.elementosDescarga);
    console.log("📥 Elementos seleccionados para descarga:", seleccionados);
    this.cerrarModal();
  }

  obtenerSeleccionados(elementos: ElementoDescarga[]): string[] {
    let seleccionados: string[] = [];
    elementos.forEach(el => {
      if (el.seleccionado) {
        seleccionados.push(el.ruta);
      }
      if (el.subelementos) {
        seleccionados.push(...this.obtenerSeleccionados(el.subelementos));
      }
    });
    return seleccionados;
  }

  // 🔹 Función para obtener elementos seleccionados
  

  

  
} 