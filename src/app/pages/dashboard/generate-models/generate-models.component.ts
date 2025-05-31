import { Component, OnInit } from '@angular/core';
import { getStorage, ref, listAll } from 'firebase/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TensorflowService } from '../../../services/tensorflow.service';

interface ElementoDescarga {
  nombre: string;
  ruta: string;
  seleccionado: boolean;
  subelementos?: ElementoDescarga[];
  abierto?: boolean;
}

@Component({
  selector: 'app-generar-modelo',
  standalone: true,
  templateUrl: './generate-models.component.html',
  styleUrls: ['./generate-models.component.css'],
  imports: [CommonModule, FormsModule]
})
export class GenerarModeloComponent implements OnInit {
  elementosDescarga: ElementoDescarga[] = [];
  rutaBase: string = 'contribuciones_aceptadas/';
  cargandoModelo: boolean = false;
  modeloEntrenado: any = null;
  progresoEntrenamiento: number = 0; // ✅ Inicializa en 0%
  cargandoCarpetas: boolean = true;
  notificacion: string | null = null; 
  resumenEntrenamiento: any = null;
  mostrarResumenModal: boolean = false;
  descargandoPDF: boolean = false;
  descargandoModelo: boolean = false;

  

  constructor(private tensorflowService: TensorflowService) {}

  ngOnInit() {
    this.cargarEstructura();
  }

  async cargarEstructura() {
    this.elementosDescarga = [];
    const storage = getStorage();
    this.cargandoCarpetas = true;
    // Lógica de carga
    
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
      console.error("❌ Error cargando estructura:", error);
      this.cargandoCarpetas = false;
    }
    this.cargandoCarpetas = false;
  }

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
      console.error(`❌ Error obteniendo subcarpetas en ${ruta}:`, error);
    }

    return subelementos;
  }

  toggleExpandir(elemento: ElementoDescarga, event: Event) {
    event.stopPropagation();
    elemento.abierto = !elemento.abierto;
  }
  
  toggleSeleccion(elemento: ElementoDescarga, event: Event) {
    event.stopPropagation();
    //elemento.seleccionado = !elemento.seleccionado;
  
    if (elemento.subelementos) {
      elemento.subelementos.forEach(sub => this.actualizarEstadoSubelementos(sub, elemento.seleccionado));
    }
    this.actualizarEstadoPadres();
  }
  

  actualizarEstadoSubelementos(elemento: ElementoDescarga, estado: boolean) {
    elemento.seleccionado = estado;
    if (elemento.subelementos) {
      elemento.subelementos.forEach(sub => this.actualizarEstadoSubelementos(sub, estado));
    }
  }
  
  actualizarEstadoPadres() {
    function verificarEstadoPadre(elemento: ElementoDescarga) {
      if (elemento.subelementos && elemento.subelementos.length > 0) {
        const seleccionados = elemento.subelementos.filter(sub => sub.seleccionado).length;
        if (seleccionados === 0) {
          elemento.seleccionado = false;
        } else if (seleccionados === elemento.subelementos.length) {
          elemento.seleccionado = true;
        } else {
          elemento.seleccionado = false; // O podrías agregar un estado de "indeterminado"
        }
      }
    }
  
    this.elementosDescarga.forEach(verificarEstadoPadre);
  }
  
  tieneSeleccionadas(): boolean {
    return this.elementosDescarga.some(el => el.seleccionado || (el.subelementos?.some(sub => sub.seleccionado)));
  }

    obtenerSeleccionados(elementos: ElementoDescarga[]): string[] {
      let seleccionados: string[] = [];
      let categoriasSet = new Set<string>();

      elementos.forEach(el => {
          if (el.seleccionado) {
              seleccionados.push(el.ruta);

              // Agregar la categoría a la lista
              const parts = el.ruta.split('/');
              const categoria = parts[parts.length - 2];
              categoriasSet.add(categoria);
          }
          if (el.subelementos) {
              seleccionados.push(...this.obtenerSeleccionados(el.subelementos));
          }
      });

      console.log(`📊 Categorías seleccionadas: ${Array.from(categoriasSet)}`);

      return seleccionados;
  }

    // 🔹 Entrenamiento del modelo con TensorFlow.js
    iniciarEntrenamiento() {
      if (!this.tieneMinimoDosClases()) {
          this.mostrarNotificacion("⚠️ Debes seleccionar al menos 2 clases para entrenar el modelo.");
          return;
      }

      this.cargandoModelo = true;
      this.progresoEntrenamiento = 10; // 🔹 Inicia en 10%

      console.log("⏳ Iniciando carga de modelo...");
      
      const intervaloProgreso = setInterval(() => {
          if (this.progresoEntrenamiento < 90) { 
              this.progresoEntrenamiento += Math.random() * 5; // 🔹 Incremento gradual
          } else {
              clearInterval(intervaloProgreso); // 🔹 Detiene el avance al 90%
          }
      }, 2000); // 🔹 Cada 2 segundos sube un poco

      this.tensorflowService.cargarModeloPreEntrenado()
          .then(modeloBase => {
              if (!modeloBase) {
                  throw new Error("❌ No se pudo cargar el modelo preentrenado.");
              }

              console.log("✅ Modelo cargado, listo para entrenamiento.");
              const imagenesSeleccionadas = this.obtenerSeleccionados(this.elementosDescarga);
              console.log("📂 Imágenes seleccionadas para entrenamiento:", imagenesSeleccionadas);

              return this.tensorflowService.entrenarModelo(
                  modeloBase,
                  imagenesSeleccionadas,
                  (progreso) => {
                      this.progresoEntrenamiento = progreso;
                  }
              );
          })
          .then(modeloEntrenado => {
              if (modeloEntrenado) {
                  console.log("💾 Entrenamiento finalizado. Puedes descargar el modelo.");
                  this.modeloEntrenado = modeloEntrenado;
                  this.progresoEntrenamiento = 100;
                  this.mostrarNotificacion("✅ ¡Modelo generado con éxito!");
              }
          })
          .catch(error => console.error("❌ Error durante el entrenamiento:", error))
          .finally(() => {
              this.cargandoModelo = false;
              clearInterval(intervaloProgreso);
          });
  }
    async descargarModelo() {
      if (!this.modeloEntrenado) {
        console.error("❌ No hay modelo entrenado para guardar.");
        return;
      }

      this.descargandoModelo = true;
      try {
        await this.tensorflowService.guardarModelo(this.modeloEntrenado);
      } catch (error) {
        console.error("❌ Error guardando el modelo:", error);
      }
      this.descargandoModelo = false;
    }


    //ALERTA DE NOTIFICACIONES
      mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success') {
    this.notificacion = mensaje;
    const toast = document.querySelector('.toast-message') as HTMLElement;
    if (toast) {
      toast.style.background = tipo === 'error' ? '#dc3545' : tipo === 'warning' ? '#ffc107' : '#0ba27f';
    }
    setTimeout(() => this.notificacion = "", 4000);
  }



    tieneMinimoDosClases(): boolean {
      const seleccionadas = this.obtenerSeleccionados(this.elementosDescarga);
      const categoriasUnicas = new Set(seleccionadas.map(ruta => {
          const partes = ruta.split('/');
          return partes[partes.length - 2]; // 🔹 Extrae la categoría desde la ruta
      }));

      if (categoriasUnicas.size < 2) {
          this.notificacion = "⚠️ Selecciona al menos 2 clases para continuar.";
          setTimeout(() => this.notificacion = "", 4000);
          return false;
      }

      return true;
  }

  //funcion al boton de generar pdf
  async descargarReporteEntrenamiento() {
  this.descargandoPDF = true;
  try {
    await this.tensorflowService.generarReporteEntrenamiento();
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
  }
  this.descargandoPDF = false;
}


  //MODAL CON RESUMEN TE LA PRE CONFIGURACION
  async prepararResumenEntrenamiento() {
  const imagenesSeleccionadas = this.obtenerSeleccionados(this.elementosDescarga);
  const resumen: Record<string, number> = {};

  imagenesSeleccionadas.forEach(ruta => {
    const partes = ruta.split('/');
    const clase = partes[partes.length - 2];
    resumen[clase] = (resumen[clase] || 0) + 1;
  });

  const clases = Object.keys(resumen);
  const totalImagenes = imagenesSeleccionadas.length;

  this.resumenEntrenamiento = {
    clases,
    resumen,
    total: totalImagenes,
    duracion: clases.length >= 4 ? '3-5 min' : '2-3 min',
    epochs: 10,
    batch: 16,
    validation: '20%'
  };

  this.mostrarResumenModal = true;
}
  
confirmarEntrenamiento() {
  this.mostrarResumenModal = false;
  this.iniciarEntrenamiento(); // Ya lo tienes implementado
}

obtenerFaseEntrenamiento(progreso: number): string {
  if (progreso <= 10) return "Cargando modelo base...";
  if (progreso <= 20) return "Cargando imágenes...";
  if (progreso <= 30) return "Preprocesando imágenes...";
  if (progreso < 100) return "Entrenando modelo...";
  return "Entrenamiento completado.";
}



} 