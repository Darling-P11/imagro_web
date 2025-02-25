import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, getDocs, updateDoc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContributionService {
  private firestore = inject(Firestore); // ✅ Inyección correcta de Firestore

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
  getSpecificContribution(userId: string, configId: string): Observable<any> {
    const configPath = `historialConfiguracion/${userId}/enviado/${configId}`;
    const configDoc = doc(this.firestore, configPath);
    return from(getDoc(configDoc).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        throw new Error('Configuración no encontrada');
      }
    }));
  }

  // 🔄 Mover contribución rechazada
  // 🔄 Mover contribución y configuración a la colección rechazado
  async rejectContribution(userId: string, contributionId: string, configId: string): Promise<void> {
    try {
      // 🔍 Referencias a los documentos originales
      const contributionRef = doc(this.firestore, `historialContribuciones/${userId}/enviado/${contributionId}`);
      const configRef = doc(this.firestore, `historialConfiguracion/${userId}/enviado/${configId}`);
  
      // 📥 Obtener los datos de los documentos
      const contributionSnapshot = await getDoc(contributionRef);
      const configSnapshot = await getDoc(configRef);
  
      if (contributionSnapshot.exists() && configSnapshot.exists()) {
        let contributionData = contributionSnapshot.data();
        let configData = configSnapshot.data();
  
        // ✅ Actualizar el estado y agregar la fecha de rechazo
        const fechaRechazo = new Date().toISOString(); // Fecha en formato ISO
        configData = {
          ...configData,
          estado: 'rechazado',
          fecha_rechazo: fechaRechazo
        };
  
        // ✅ Mover los documentos a la colección 'rechazado'
        const rejectedContributionRef = doc(this.firestore, `historialContribuciones/${userId}/rechazado/${contributionId}`);
        const rejectedConfigRef = doc(this.firestore, `historialConfiguracion/${userId}/rechazado/${configId}`);
  
        await setDoc(rejectedContributionRef, contributionData);
        await setDoc(rejectedConfigRef, configData);
  
        // ❌ Eliminar los documentos de 'enviado'
        await deleteDoc(contributionRef);
        await deleteDoc(configRef);
      } else {
        throw new Error('Contribución o configuración no encontrada');
      }
    } catch (error) {
      console.error('❌ Error al rechazar la contribución:', error);
      throw error;
    }
  }
  
  
}
