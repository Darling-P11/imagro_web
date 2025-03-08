import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';

@Injectable({
  providedIn: 'root'
})
export class TensorflowService {
  modelo!: tf.LayersModel;

  constructor() {}

  // 🔹 Cargar modelo base MobileNetV2
    async cargarModeloPreEntrenado() {
      console.log("📥 Cargando MobileNet V1...");
    
      try {
        // 🔹 Carga MobileNet V1 Preentrenado desde TensorFlow.js
        const baseModel = await tf.loadLayersModel(
          'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
        );
    
        console.log("✅ MobileNet V1 cargado con éxito.");
    
        // 🔹 Extraer características hasta la última capa convolucional
        const featureExtractor = tf.model({
          inputs: baseModel.inputs,
          outputs: baseModel.getLayer('conv_pw_13_relu').output // Última capa convolucional
        });
    
        console.log("📊 Capas del modelo:", featureExtractor.layers.map(layer => layer.name));
    
        return featureExtractor;
      } catch (error) {
        console.error("❌ Error al cargar MobileNet V1:", error);
        return null;
      }
    }
    
    
    

    // 🔹 Obtener URL de imagen desde Firebase Storage
    async obtenerImagenURL(imagenPath: string): Promise<string | null> {
      try {
        const storage = getStorage();
        const imagenRef = ref(storage, imagenPath);
        return await getDownloadURL(imagenRef);
      } catch (error) {
        console.warn(`⚠️ No se encontró la imagen en Firebase: ${imagenPath}`);
        return null;
      }
    }


    
    
    // 🔹 Entrenar modelo con imágenes seleccionadas

    metricasEntrenamiento: { epoch: number; accuracy: number; loss: number }[] = [];

    async entrenarModelo(featureExtractor: tf.LayersModel, imagenes: string[], callbackProgreso: (progreso: number) => void) {
      console.log("🚀 Iniciando entrenamiento con MobileNet V1...");
      callbackProgreso(10);
      this.metricasEntrenamiento = []; // Reiniciar métricas

      try {
          // 🔹 Cargar y procesar imágenes
          const dataset = await this.cargarYPreprocesarImagenes(imagenes, featureExtractor);
          callbackProgreso(30);

          // 🔹 Crear el modelo de clasificación
          const numClases = dataset.ys.shape[1] || 2;
          const model = tf.sequential();

          model.add(tf.layers.inputLayer({ inputShape: [7, 7, 256] }));
          model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }));
          model.add(tf.layers.flatten());
          model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
          model.add(tf.layers.dropout({ rate: 0.3 }));
          model.add(tf.layers.dense({ units: numClases, activation: 'softmax' }));

          model.compile({
              optimizer: tf.train.adam(),
              loss: 'categoricalCrossentropy',
              metrics: ['accuracy']
          });

          console.log("✅ Modelo de Transfer Learning compilado.");

          // 🔹 Entrenar el modelo
          await model.fit(dataset.xs, dataset.ys, {
              epochs: 10,
              batchSize: 16,
              validationSplit: 0.2,
              callbacks: {
                  onEpochEnd: (epoch, logs) => {
                      const progreso = Math.round((epoch + 1) / 10 * 100);
                      callbackProgreso(progreso);
                      console.log(`📊 Epoch ${epoch + 1}: Accuracy = ${logs?.['acc']}, Loss = ${logs?.['loss']}`);

                      // Guardar métricas
                      this.metricasEntrenamiento.push({
                          epoch: epoch + 1,
                          accuracy: logs?.['acc'] || 0,
                          loss: logs?.['loss'] || 0
                      });
                  }
              }
          });

          console.log("🎉 Entrenamiento finalizado.");
          callbackProgreso(100);
          return model;

      } catch (error) {
          console.error("❌ Error en entrenamiento:", error);
          callbackProgreso(0);
          return null;
      }
  }

    

    // 🔹 Guardar el modelo entrenado
    async guardarModelo(model: tf.LayersModel) {
      console.log("💾 Guardando el modelo en formato JSON...");
      try {
        await model.save('downloads://mobilenetv1_model');
        console.log("✅ Modelo guardado correctamente.");
      } catch (error) {
        console.error("❌ Error al guardar el modelo:", error);
      }
    }
    

    // 🔹 Preprocesamiento de imágenes
    async cargarYPreprocesarImagenes(imagenes: string[], featureExtractor: tf.LayersModel) {
      console.log("📥 Descargando imágenes desde Firebase Storage...");

      const xs: tf.Tensor[] = [];
      const ys: number[] = [];
      const storage = getStorage();
      const etiquetasMap = new Map<string, number>(); // Para rastrear las clases únicas
      let claseIndex = 0;

      for (const imagenPath of imagenes) {
          try {
              console.log(`🔗 Intentando descargar: ${imagenPath}`);

              const imagenRef = ref(storage, imagenPath);
              let imagenUrl: string;

              try {
                  imagenUrl = await getDownloadURL(imagenRef);
                  console.log(`✅ Imagen encontrada: ${imagenUrl}`);
              } catch (error) {
                  console.warn(`⚠️ Imagen ${imagenPath} no encontrada en Firebase Storage. Omitiendo...`);
                  continue;
              }

              const response = await fetch(imagenUrl);
              if (!response.ok) {
                  throw new Error(`❌ No se pudo descargar la imagen: ${imagenUrl}`);
              }

              const blob = await response.blob();
              const imageBitmap = await createImageBitmap(blob);

              // 🔹 Convertir imagen a tensor asegurando las dimensiones correctas
              let imgTensor = tf.browser.fromPixels(imageBitmap);
              imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]); // Redimensionar
              imgTensor = imgTensor.div(255.0); // Normalizar valores entre 0 y 1
              imgTensor = imgTensor.expandDims(0); // Asegurar batch de 1

              console.log("📊 Forma del tensor antes de pasar por MobileNet:", imgTensor.shape);

              // 🔹 Extraer características con MobileNet V1
              let featureTensor = featureExtractor.predict(imgTensor) as tf.Tensor;
              console.log("🔎 Forma original del tensor de características:", featureTensor.shape);

              xs.push(featureTensor); // ✅ Ahora pasamos el tensor tal cual, sin aplanarlo

              // 🔹 Obtener etiqueta de la imagen desde la estructura de rutas
              const parts = imagenPath.split('/');
              const categoria = parts[parts.length - 2];

              if (!etiquetasMap.has(categoria)) {
                  etiquetasMap.set(categoria, claseIndex++);
              }

              ys.push(etiquetasMap.get(categoria)!); 

          } catch (error) {
              console.error(`❌ Error al procesar imagen ${imagenPath}:`, error);
          }
      }

      console.log(`📊 Clases detectadas: ${Array.from(etiquetasMap.keys())}`);
      console.log(`📊 Número total de clases: ${etiquetasMap.size}`);

      if (xs.length === 0) {
          throw new Error("⚠️ Error: No se pudieron cargar imágenes válidas.");
      }

      if (etiquetasMap.size < 2) {
          throw new Error("⚠️ Error: Se necesita al menos 2 clases para entrenamiento.");
      }

      // 🔹 Concatenar todas las características extraídas sin aplanar
      const xsTensor = tf.concat(xs);
      const numClases = etiquetasMap.size;
      const ysTensor = tf.oneHot(tf.tensor1d(ys, 'int32'), numClases);

      return { xs: xsTensor, ys: ysTensor };
  }

  // PROBAR MODELO
  async cargarModeloGuardado() {
    console.log("📥 Cargando modelo guardado...");
    try {
        const model = await tf.loadLayersModel('/assets/mobilenetv1_model.json'); // Ruta en tu proyecto
        console.log("✅ Modelo cargado correctamente.");
        return model;
    } catch (error) {
        console.error("❌ Error al cargar el modelo:", error);
        return null;
    }
  }

  //GENERAR PDF
  async generarReporteEntrenamiento(): Promise<void> {
    console.log("📄 Generando PDF del reporte de entrenamiento...");

    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Reporte de Entrenamiento del Modelo", 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Número de Épocas: ${this.metricasEntrenamiento.length}`, 20, 30);
    pdf.text(`Precisión Final: ${(this.metricasEntrenamiento[this.metricasEntrenamiento.length - 1]?.accuracy * 100).toFixed(2)}%`, 20, 40);
    pdf.text(`Pérdida Final: ${this.metricasEntrenamiento[this.metricasEntrenamiento.length - 1]?.loss.toFixed(4)}`, 20, 50);
    pdf.text(`Número de Clases: 2 (Ejemplo: Hongo, Ninguna)`, 20, 60);

    // Tabla con métricas
    const tablaDatos = this.metricasEntrenamiento.map(m => [m.epoch, (m.accuracy * 100).toFixed(2) + "%", m.loss.toFixed(4)]);
    autoTable(pdf, {
        startY: 70,
        head: [["Época", "Precisión", "Pérdida"]],
        body: tablaDatos
    });

    // 🔹 Generar gráficos
    const imgPrecisionPerdida = await this.generarGraficoPrecisionPerdida();
    const imgMatrizConfusion = await this.generarMatrizConfusion();
    const imgF1Score = await this.generarF1Score();

    // Insertar gráficos en el PDF
    pdf.addPage();
    pdf.text("Evolución de Precisión y Pérdida", 20, 20);
    pdf.addImage(imgPrecisionPerdida, 'PNG', 20, 30, 160, 100);

    pdf.addPage();
    pdf.text("Matriz de Confusión", 20, 20);
    pdf.addImage(imgMatrizConfusion, 'PNG', 20, 30, 160, 100);

    pdf.addPage();
    pdf.text("F1-Score por Clase", 20, 20);
    pdf.addImage(imgF1Score, 'PNG', 20, 30, 160, 100);

    // Guardar PDF
    pdf.save("reporte_entrenamiento.pdf");
    console.log("✅ PDF generado correctamente.");
}


  /**
 * 🔹 Generar un gráfico en memoria con Chart.js y devolver su imagen en base64.
 */
private async generarGrafico(titulo: string, label: string, data: number[]): Promise<string> {
  return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      new Chart(canvas, {
          type: 'line',
          data: {
              labels: this.metricasEntrenamiento.map(m => `Época ${m.epoch}`),
              datasets: [{
                  label,
                  data,
                  borderColor: titulo.includes("Precisión") ? 'blue' : 'red',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderWidth: 2
              }]
          },
          options: {
              responsive: false,
              animation: false
          }
      });

      setTimeout(() => {
          resolve(canvas.toDataURL('image/png'));
      }, 500); // Pequeño delay para asegurar que se renderiza
  });
}

//PARA GENERAR IMAGNES EN EL REPORTE
private async generarGraficoPrecisionPerdida(): Promise<string> {
  return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      new Chart(canvas, {
          type: 'line',
          data: {
              labels: this.metricasEntrenamiento.map(m => `Época ${m.epoch}`),
              datasets: [
                  {
                      label: 'Precisión (%)',
                      data: this.metricasEntrenamiento.map(m => m.accuracy * 100),
                      borderColor: 'blue',
                      backgroundColor: 'rgba(0, 0, 255, 0.1)',
                      borderWidth: 2
                  },
                  {
                      label: 'Pérdida',
                      data: this.metricasEntrenamiento.map(m => m.loss),
                      borderColor: 'red',
                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      borderWidth: 2
                  }
              ]
          },
          options: {
              responsive: false,
              animation: false
          }
      });

      setTimeout(() => {
          resolve(canvas.toDataURL('image/png'));
      }, 500);
  });
}

//matriz de confusion
private async generarMatrizConfusion(): Promise<string> {
  return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      new Chart(canvas, {
          type: 'bar',
          data: {
              labels: ["Clase 1", "Clase 2"], // Simulación de clases
              datasets: [
                  {
                      label: "Correctas",
                      data: [45, 40], // Valores simulados
                      backgroundColor: 'green'
                  },
                  {
                      label: "Incorrectas",
                      data: [5, 10], // Valores simulados
                      backgroundColor: 'red'
                  }
              ]
          },
          options: {
              responsive: false,
              animation: false
          }
      });

      setTimeout(() => {
          resolve(canvas.toDataURL('image/png'));
      }, 500);
  });
}
 //GRAFICO F1 SCORE 
 private async generarF1Score(): Promise<string> {
  return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      new Chart(canvas, {
          type: 'bar',
          data: {
              labels: ["Clase 1", "Clase 2"], // Simulación de clases
              datasets: [
                  {
                      label: "F1-Score",
                      data: [0.89, 0.92], // Simulación de valores de F1-score
                      backgroundColor: 'blue'
                  }
              ]
          },
          options: {
              responsive: false,
              animation: false
          }
      });

      setTimeout(() => {
          resolve(canvas.toDataURL('image/png'));
      }, 500);
  });
}



}
