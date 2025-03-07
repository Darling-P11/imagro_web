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

  constructor(private tensorflowService: TensorflowService) {}

  ngOnInit() {
    this.cargarEstructura();
  }

  async cargarEstructura() {
    this.elementosDescarga = [];
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
      console.error("❌ Error cargando estructura:", error);
    }
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
    elemento.seleccionado = !elemento.seleccionado;
  
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
    this.cargandoModelo = true;
    console.log("⏳ Iniciando carga de modelo...");
  
    this.tensorflowService.cargarModeloPreEntrenado()
      .then(modeloBase => {
        if (!modeloBase) {  // ✅ Verifica si el modelo no se cargó correctamente
          throw new Error("❌ No se pudo cargar el modelo preentrenado.");
        }
  
        console.log("✅ Modelo cargado, listo para entrenamiento.");
        const imagenesSeleccionadas = this.obtenerSeleccionados(this.elementosDescarga);
        console.log("📂 Imágenes seleccionadas para entrenamiento:", imagenesSeleccionadas);
  
        return this.tensorflowService.entrenarModelo(
          modeloBase,
          imagenesSeleccionadas,
          (progreso) => {  
            this.progresoEntrenamiento = progreso;  // ✅ Actualiza el progreso en la UI
          }
        );
        
      })
      .then(modeloEntrenado => {
        if (modeloEntrenado) {
          console.log("💾 Entrenamiento finalizado. Puedes descargar el modelo.");
          this.modeloEntrenado = modeloEntrenado;
        }
      })
      .catch(error => console.error("❌ Error durante el entrenamiento:", error))
      .finally(() => this.cargandoModelo = false);
  }
  

  descargarModelo() {
    if (this.modeloEntrenado) {
      this.tensorflowService.guardarModelo(this.modeloEntrenado);
    } else {
      console.error("❌ No hay un modelo entrenado para descargar.");
    }
  }
  
  
}
