import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, setDoc, collection as fsCollection} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Storage, getStorage, ref, listAll, getDownloadURL, deleteObject, uploadBytes } from '@angular/fire/storage';
import { nanoid } from 'nanoid';



@Injectable({
  providedIn: 'root',
})
export class ContributionService {
  private firestore = inject(Firestore);
  private storage = getStorage();// ✅ Firebase Storage

  // 🔍 Obtener todas las configuraciones pendientes de todos los usuarios
  getPendingContributions(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'users');

    return new Observable((observer) => {
      collectionData(usersCollection, { idField: 'userId' }).subscribe(async (users: any[]) => {
        const contributions = [];

        for (const user of users) {
          const userId = user.userId;

          // 🔗 Leer el nombre del usuario desde Firestore
          const userDoc = doc(this.firestore, `users/${userId}`);
          const userSnapshot = await getDoc(userDoc);
          const userData = userSnapshot.exists() ? userSnapshot.data() : null;
          const nombreUsuario = userData ? userData['name'] : 'Usuario Desconocido';

          // 📥 Leer todas las configuraciones enviadas por cada usuario
          const configPath = `historialConfiguracion/${userId}/enviado`;
          const configCollection = collection(this.firestore, configPath);
          const configSnapshots = await getDocs(configCollection);

          for (const configDoc of configSnapshots.docs) {
            const configData = configDoc.data();

            if (configData['estado'] === 'enviado') {
              const contributionId = configData['contribucion_id'];
              const contributionPath = `historialContribuciones/${userId}/enviado/${contributionId}`;
              const contributionDoc = doc(this.firestore, contributionPath);
              const contributionSnapshot = await getDoc(contributionDoc);

              if (contributionSnapshot.exists()) {
                const contributionData = contributionSnapshot.data();

                contributions.push({
                  id: configDoc.id,
                  usuarioId: userId,
                  nombreUsuario: nombreUsuario, // ✅ Asigna el nombre extraído de Firestore
                  contributionDetails: contributionData, // 🔗 Enlace con la contribución
                  configuracionCompleta: configData,
                });
              }
            }
          }
        }

        observer.next(contributions);
        observer.complete();
      });
    });
  }

  // 🔄 Actualizar el estado de una contribución a 'aceptado'
  async updateContributionStatus(userId: string, configId: string, newStatus: string): Promise<void> {
    const configRef = doc(this.firestore, `historialConfiguracion/${userId}/enviado/${configId}`);
    await updateDoc(configRef, { estado: newStatus });
  }

  // ✅ Obtener configuración específica desde Firestore
  // 🔍 Obtener configuración específica de una contribución
  getSpecificContribution(userId: string, configId: string): Observable<any> {
    const configPath = `historialConfiguracion/${userId}/enviado/${configId}`;
    const configDoc = doc(this.firestore, configPath);
    return from(getDoc(configDoc).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.data(); // ✅ Devuelve la configuración específica
      } else {
        throw new Error('Configuración no encontrada');
      }
    }));
  }

  // 🔄 Mover contribución rechazada
  // 🔄 Mover contribución y configuración a la colección rechazado
  async rejectContribution(userId: string, contributionId: string, configId: string): Promise<void> {
    try {
        // 🔍 Obtener referencias de Firestore
        const contributionRef = doc(this.firestore, `historialContribuciones/${userId}/enviado/${contributionId}`);
        const configRef = doc(this.firestore, `historialConfiguracion/${userId}/enviado/${configId}`);

        // 📥 Obtener los datos de las contribuciones
        const contributionSnapshot = await getDoc(contributionRef);
        const configSnapshot = await getDoc(configRef);

        if (!contributionSnapshot.exists() || !configSnapshot.exists()) {
            throw new Error('❌ Contribución o configuración no encontrada');
        }

        let contributionData = contributionSnapshot.data();
        let configData = configSnapshot.data();

        // ✅ Definir rutas de imágenes
        const baseImageFolderPath = `contribuciones_por_aprobar/${userId}/${contributionId}`;
        const rejectedFolderPath = `contribuciones_rechazadas/${userId}/${contributionId}`;

        console.log(`🔍 Explorando imágenes en: ${baseImageFolderPath}`);

        // ✅ Obtener todas las imágenes dentro de las subcarpetas
        let updatedImageObjects: any[] = [];
        await this.recursivelyMoveImages(
            baseImageFolderPath, 
            rejectedFolderPath, 
            contributionData['imagenes'], 
            updatedImageObjects
        );

        if (updatedImageObjects.length === 0) {
            console.warn(`⚠️ No se encontraron imágenes para mover.`);
            return;
        }

        // ✅ Actualizar Firestore con las nuevas URLs y conservar metadatos
        contributionData['imagenes'] = updatedImageObjects;
        configData['estado'] = 'rechazado';
        configData['fecha_rechazo'] = new Date().toISOString();

        // ✅ Mover la contribución a 'rechazado'
        const rejectedContributionRef = doc(this.firestore, `historialContribuciones/${userId}/rechazado/${contributionId}`);
        const rejectedConfigRef = doc(this.firestore, `historialConfiguracion/${userId}/rechazado/${configId}`);

        await setDoc(rejectedContributionRef, contributionData);
        await setDoc(rejectedConfigRef, configData);

        // ❌ Eliminar los documentos originales en 'enviado'
        await deleteDoc(contributionRef);
        await deleteDoc(configRef);

        console.log('✅ Contribución rechazada y movida correctamente');

    } catch (error) {
        console.error('❌ Error al rechazar la contribución:', error);
        throw error;
    }
}

/**
 * 🔄 Función recursiva para mover imágenes dentro de subcarpetas y conservar metadatos
 */
private async recursivelyMoveImages(
    sourcePath: string,
    targetPath: string,
    originalImageObjects: any[],
    updatedImageObjects: any[]
): Promise<void> {
    try {
        const folderRef = ref(this.storage, sourcePath);
        const folderContents = await listAll(folderRef);

        for (const item of folderContents.items) {
            const imageName = item.name;
            const oldImageRef = ref(this.storage, `${sourcePath}/${imageName}`);
            const newImageRef = ref(this.storage, `${targetPath}/${imageName}`);

            let imageBlob: Blob | null = null;

            try {
                // 📥 Intentar descargar la imagen original
                const response = await fetch(await getDownloadURL(oldImageRef));
                if (!response.ok) throw new Error("Error en la respuesta de la imagen");
                imageBlob = await response.blob();
            } catch (error) {
                console.error(`❌ Error al descargar la imagen ${imageName}:`, error);
                continue;
            }

            if (imageBlob) {
                // 📤 Subir la imagen a la nueva carpeta
                await uploadBytes(newImageRef, imageBlob);

                // ✅ Obtener la nueva URL
                const newImageUrl = await getDownloadURL(newImageRef);

                // 🔍 Buscar la información original de esta imagen en el array de imágenes
                let originalImageData = originalImageObjects.find(img => img.url.includes(imageName));

                if (originalImageData) {
                    // 🔄 Crear un nuevo objeto con la misma información, pero con la URL actualizada
                    updatedImageObjects.push({
                        ...originalImageData,
                        url: newImageUrl
                    });
                } else {
                    console.warn(`⚠️ No se encontró información previa para la imagen ${imageName}.`);
                    updatedImageObjects.push({ url: newImageUrl });
                }

                // ❌ Eliminar la imagen original después de moverla
                await deleteObject(oldImageRef);
            }
        }

        // 🔄 Recursividad: Buscar más subcarpetas dentro del folder
        for (const folder of folderContents.prefixes) {
            const newSourcePath = `${sourcePath}/${folder.name}`;
            const newTargetPath = `${targetPath}/${folder.name}`;
            await this.recursivelyMoveImages(newSourcePath, newTargetPath, originalImageObjects, updatedImageObjects);
        }

    } catch (error) {
        console.error(`❌ Error al mover imágenes en ${sourcePath}:`, error);
    }
}




  
  
//ACEPTACION DE LA CONTRIBUCION
async acceptContribution(userId: string, contributionId: string, configId: string): Promise<void> {
  try {
      // 🔍 Obtener referencias de Firestore
      const contributionRef = doc(this.firestore, `historialContribuciones/${userId}/enviado/${contributionId}`);
      const configRef = doc(this.firestore, `historialConfiguracion/${userId}/enviado/${configId}`);

      // 📥 Obtener los datos de las contribuciones
      const contributionSnapshot = await getDoc(contributionRef);
      const configSnapshot = await getDoc(configRef);

      if (!contributionSnapshot.exists() || !configSnapshot.exists()) {
          throw new Error('❌ Contribución o configuración no encontrada');
      }

      let contributionData = contributionSnapshot.data();
      let configData = configSnapshot.data();

      // ✅ Definir rutas de imágenes en la carpeta centralizada
      const year = new Date().getFullYear(); // Obtener el año actual
      const baseImageFolderPath = `contribuciones_por_aprobar/${userId}/${contributionId}`;
      const acceptedFolderPath = `contribuciones_aceptadas/${year}`;

      console.log(`🔍 Explorando imágenes en: ${baseImageFolderPath}`);

      // ✅ Obtener todas las imágenes dentro de las subcarpetas
      let updatedImageObjects: any[] = [];
      await this.recursivelyMoveImagesToAccepted(
          baseImageFolderPath, 
          acceptedFolderPath, 
          contributionData['imagenes'], 
          updatedImageObjects
      );

      if (updatedImageObjects.length === 0) {
          console.warn(`⚠️ No se encontraron imágenes para mover.`);
          return;
      }

      // ✅ Actualizar Firestore con las nuevas URLs y conservar metadatos
      contributionData['imagenes'] = updatedImageObjects;
      configData['estado'] = 'aceptado';
      configData['fecha_aceptacion'] = new Date().toISOString();

      // ✅ Mover la contribución a 'aceptado'
      const acceptedContributionRef = doc(this.firestore, `historialContribuciones/${userId}/aceptado/${contributionId}`);
      const acceptedConfigRef = doc(this.firestore, `historialConfiguracion/${userId}/aceptado/${configId}`);

      await setDoc(acceptedContributionRef, contributionData);
      await setDoc(acceptedConfigRef, configData);

      // ❌ Eliminar los documentos originales en 'enviado'
      await deleteDoc(contributionRef);
      await deleteDoc(configRef);

      console.log('✅ Contribución aceptada y movida correctamente');

  } catch (error) {
      console.error('❌ Error al aceptar la contribución:', error);
      throw error;
  }
}



/**
* 🔄 Función recursiva para mover imágenes dentro de subcarpetas y conservar su metadata
*/
/**
 * 🔄 Función recursiva para mover imágenes dentro de subcarpetas y conservar metadatos
 */
private async recursivelyMoveImagesToAccepted(
  sourcePath: string,
  targetBasePath: string,
  originalImageObjects: any[],
  updatedImageObjects: any[]
): Promise<void> {
  try {
      const folderRef = ref(this.storage, sourcePath);
      const folderContents = await listAll(folderRef);

      for (const item of folderContents.items) {
          const imageName = item.name;
          const oldImageRef = ref(this.storage, `${sourcePath}/${imageName}`);

          // 📤 Extraer los metadatos originales de la imagen
          let originalImageData = originalImageObjects.find(img => img.url.includes(imageName));

          if (!originalImageData) {
              console.warn(`⚠️ No se encontró información previa para la imagen ${imageName}.`);
              continue; // Evitar procesar imágenes sin información
          }

          // 📂 Construir la nueva ruta en `contribuciones_aceptadas`
          const newImageRef = ref(this.storage, 
              `${targetBasePath}/${originalImageData.cultivo}/${originalImageData.tipo}/${originalImageData.estado}/${originalImageData.enfermedad}/${imageName}`
          );

          let imageBlob: Blob | null = null;

          try {
              // 📥 Intentar descargar la imagen original
              const response = await fetch(await getDownloadURL(oldImageRef));
              if (!response.ok) throw new Error("Error en la respuesta de la imagen");
              imageBlob = await response.blob();
          } catch (error) {
              console.error(`❌ Error al descargar la imagen ${imageName}:`, error);
              continue;
          }

          if (imageBlob) {
              // 📤 Subir la imagen a la nueva carpeta
              await uploadBytes(newImageRef, imageBlob);

              // ✅ Obtener la nueva URL
              const newImageUrl = await getDownloadURL(newImageRef);

              // 🔄 Crear un nuevo objeto con la misma información, pero con la URL actualizada
              updatedImageObjects.push({
                  ...originalImageData,
                  url: newImageUrl
              });

              // ❌ Eliminar la imagen original después de moverla
              await deleteObject(oldImageRef);
          }
      }

      // 🔄 Recursividad: Buscar más subcarpetas dentro del folder
      for (const folder of folderContents.prefixes) {
          const newSourcePath = `${sourcePath}/${folder.name}`;
          await this.recursivelyMoveImagesToAccepted(newSourcePath, targetBasePath, originalImageObjects, updatedImageObjects);
      }

  } catch (error) {
      console.error(`❌ Error al mover imágenes en ${sourcePath}:`, error);
  }
}




  //RECHAZO DE IMAGEN Y RESTRUCTURACION EN FIRESTOREGE
  async sendNotification(userId: string, titulo: string, mensaje: string): Promise<void> {
  const notificacionRef = fsCollection(this.firestore, `notificaciones/${userId}/mensajes`);
  await addDoc(notificacionRef, {
    titulo,
    mensaje,
    fecha: new Date(),
    estado: 'nuevo',
  });
}
  
}
