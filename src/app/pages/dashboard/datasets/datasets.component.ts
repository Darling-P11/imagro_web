import { Component, OnInit } from '@angular/core';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


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
  imagenesCargando: boolean = false;
  carpetasCargando: boolean = false;
  opcionesDescargaAbiertas: boolean = false;
  descargandoCarpeta: boolean = false;
  cargandoModalManual: boolean = false;





  

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
    
    this.imagenesCargando = true;
    const storage = getStorage();
    const carpetaRef = ref(storage, ruta);
    this.carpetasCargando = true;
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
      finally {
      this.imagenesCargando = false; //  Desactivar loading
      this.carpetasCargando = false;
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
    this.opcionesDescargaAbiertas = true
    this.modalAbierto = false;

    
  }
  abrirModalManual() {
  this.modalAbierto = true;             // ahora sí abre el modal real
  this.opcionesDescargaAbiertas = false; // cierra el modal de opciones
  this.cargarEstructuraDescarga();  
  this.cargandoModalManual = true; 
  this.cargarEstructuraDescarga().then(() => {
    this.cargandoModalManual = false; //  desactiva loading cuando termina
  });   // carga el arbol de carpetas
}


  cerrarOpcionesDescarga() {
  this.opcionesDescargaAbiertas = false;
}
async descargarCarpetaActual() {
  this.opcionesDescargaAbiertas = false;
  this.descargandoCarpeta = true;

  try {
    const zip = new JSZip();
    const archivos = await this.obtenerArchivosDeCarpeta(this.rutaActual);

    if (archivos.length === 0) {
      alert(" No se encontraron archivos en esta carpeta.");
      return;
    }

    const cantidad = await this.agregarArchivosAlZip(archivos, zip);

    if (cantidad === 0) {
      alert(" No se pudieron agregar archivos al ZIP.");
      return;
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'carpeta_actual.zip');

    console.log(" Carpeta actual descargada.");
  } catch (error) {
    console.error(" Error al descargar carpeta actual:", error);
    alert(" Hubo un error al descargar la carpeta actual.");
  } finally {
    this.descargandoCarpeta = false; //  Ocultar loading
  }
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

  async confirmarDescarga() {
    let seleccionados = this.obtenerSeleccionados(this.elementosDescarga);
  
    if (seleccionados.length === 0) {
      alert("⚠ No has seleccionado ningún archivo para descargar.");
      return;
    }
  
    console.log("📥 Descargando elementos seleccionados:", seleccionados);
    this.descargandoCarpeta = true; // Mostrar modal de carga

    try {
      const zip = new JSZip();
      let archivosFinales: string[] = [];
  
      // 🔹 Verificar si la ruta es una carpeta y buscar archivos dentro
      for (const ruta of seleccionados) {
        if (!ruta.includes('.')) { // Solo procesar si NO es un archivo (posible carpeta)
          const archivosDentro = await this.obtenerArchivosDeCarpeta(ruta);
          archivosFinales.push(...archivosDentro);
        } else {
          archivosFinales.push(ruta); // Si ya es un archivo, lo agregamos directamente
        }
      }
  
      console.log(" Archivos reales que se descargarán:", archivosFinales);
  
      if (archivosFinales.length === 0) {
        alert("⚠ No se encontraron archivos en las rutas seleccionadas.");
        return;
      }
  
      const archivosDescargados = await this.agregarArchivosAlZip(archivosFinales, zip);
  
      if (archivosDescargados === 0) {
        alert(" No se pudieron agregar archivos al ZIP.");
        return;
      }
  
      // 🔹 Generar y descargar el ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'datasets_seleccionados.zip');
  
      console.log(" ZIP generado y descargado con éxito.");
      this.cerrarModal();
    } catch (error) {
      console.error(" Error al generar el ZIP:", error);
      alert(" Ocurrió un error al generar el ZIP. Revisa la consola para más detalles.");
    }finally {
    this.descargandoCarpeta = false; // Ocultar modal de carga
  }
  }
  
  
  
  async obtenerArchivosDeCarpeta(rutaCarpeta: string): Promise<string[]> {
    const storage = getStorage();
    const carpetaRef = ref(storage, rutaCarpeta);
    let archivos: string[] = [];
  
    try {
      const listado = await listAll(carpetaRef);
  
      // 🔹 Agregar archivos que tengan extensión válida (.jpg, .png, .txt, etc.)
      for (const item of listado.items) {
        if (item.fullPath.includes('.')) { // Solo agregamos archivos reales
          archivos.push(item.fullPath);
        }
      }
  
      // 🔹 Buscar dentro de subcarpetas
      for (const subFolder of listado.prefixes) {
        const archivosSubCarpeta = await this.obtenerArchivosDeCarpeta(subFolder.fullPath);
        archivos.push(...archivosSubCarpeta);
      }
  
      console.log(`📂 Archivos encontrados en ${rutaCarpeta}:`, archivos);
      return archivos;
    } catch (error) {
      console.error(`❌ Error obteniendo archivos en la carpeta ${rutaCarpeta}:`, error);
      return [];
    }
  }
  

  async agregarArchivosAlZip(archivos: string[], zip: JSZip) {
    const storage = getStorage();
    let archivosAgregados = 0;
  
    for (const ruta of archivos) {
      try {
        const archivoRef = ref(storage, ruta);
        const url = await getDownloadURL(archivoRef);
  
        console.log(`⬇ Descargando archivo: ${ruta} - URL: ${url}`);
  
        // 🔹 Descargar el archivo
        const respuesta = await fetch(url);
        const blob = await respuesta.blob();
  
        // 🔹 Agregar al ZIP manteniendo la estructura de carpetas
        zip.file(ruta, blob);
        archivosAgregados++;
  
      } catch (error) {
        console.error(`❌ Error al descargar el archivo ${ruta}:`, error);
      }
    }
  
    return archivosAgregados;
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