import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { getStorage, ref, getDownloadURL } from "firebase/storage";

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
  async entrenarModelo(
    featureExtractor: tf.LayersModel,
    imagenes: string[],
    callbackProgreso: (progreso: number) => void
  ) {
    console.log("🚀 Iniciando entrenamiento con MobileNet V1...");
    callbackProgreso(10);
  
    try {
      // 🔹 Cargar y procesar imágenes
      const dataset = await this.cargarYPreprocesarImagenes(imagenes, featureExtractor);
      callbackProgreso(30);
  
      // 🔹 Crear el modelo de clasificación
      const numClases = dataset.ys.shape[1] || 2; // Mínimo 2 clases
      const model = tf.sequential();
  
      // ✅ Ajuste: No aplanar la entrada, sino usar la misma forma del feature extractor
      model.add(tf.layers.inputLayer({ inputShape: [7, 7, 256] })); // Usa la forma correcta
  
      model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }));
      model.add(tf.layers.flatten()); // 🔹 Ahora sí se aplana después de la convolución
      model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.3 })); // 🔹 Evitar sobreajuste
      model.add(tf.layers.dense({ units: numClases, activation: 'softmax' })); // 🔹 Clasificación
  
      // 🔹 Agregamos métricas adicionales
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy', 'precision', 'recall']
      });
  
      console.log("✅ Modelo de Transfer Learning compilado.");
  
      // 🔹 Entrenar el modelo
      await model.fit(dataset.xs, dataset.ys, {
        epochs: 10,
        batchSize: 16,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progreso = Math.round(((epoch + 1) / 10) * 100);
            callbackProgreso(progreso);
            console.log(`📊 Epoch ${epoch + 1}: Accuracy = ${logs?.['accuracy']}`);
            console.log(`📊 Precision: ${logs?.['precision']} | Recall: ${logs?.['recall']}`);
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




}
