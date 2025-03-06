import { Component } from '@angular/core';

@Component({
  selector: 'app-generate-models',
  templateUrl: './generate-models.component.html',
  styleUrls: ['./generate-models.component.css']
})
export class GenerateModelsComponent {
  
  constructor() {}

  // Acción cuando el usuario elige cargar un archivo ZIP
  seleccionarZip() {
    console.log("Opción ZIP seleccionada");
    // Aquí podríamos abrir un input file para la carga del ZIP
  }

  // Acción cuando el usuario elige configurar manualmente el modelo
  configuracionManual() {
    console.log("Opción de configuración manual seleccionada");
    // Aquí podríamos navegar a otra pantalla o abrir un modal
  }
}
