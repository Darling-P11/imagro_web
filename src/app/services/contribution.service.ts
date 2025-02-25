import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContributionService {
  constructor(private firestore: Firestore) {}

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

  // 🔄 Actualizar el estado de una contribución
  async updateContributionStatus(userId: string, configId: string, newStatus: string): Promise<void> {
    const configRef = doc(this.firestore, `historialConfiguracion/${userId}/enviado/${configId}`);
    await updateDoc(configRef, { estado: newStatus });
  }

  // ✅ Obtener la configuración específica de un usuario
  getConfiguration(userId: string, configId: string): Observable<any> {
    const configPath = `historialConfiguracion/${userId}/enviado/${configId}`;
    const configDoc = doc(this.firestore, configPath);
    return from(getDoc(configDoc).then((snapshot) => snapshot.data()));
  }
  // ✅ Obtener configuración específica desde Firestore
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
}
