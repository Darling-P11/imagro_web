import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ContributionsService {
  constructor(private firestore: Firestore) {}

  // ✅ Obtener contribuciones en estado "enviado"
  async getPendingContributions() {
    const contribucionesRef = collection(this.firestore, 'historialContribuciones');
    const q = query(contribucionesRef, where('estado', '==', 'enviado'));
    const querySnapshot = await getDocs(q);

    const contribuciones = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      contribuciones.push({
        id: docSnap.id,
        userId: data['userId'],
        userName: data['userName'],
        fechaEnvio: data['fechaEnvio'].toDate(), // Convertir timestamp
        cantidadCultivos: data['cultivos']?.length || 0,
        estado: data['estado'],
        cantidadImagenes: data['imagenes']?.length || 0
      });
    }

    return contribuciones;
  }

  // ✅ Obtener configuración asociada a una contribución
  async getContributionConfig(userId: string, configId: string) {
    const configRef = doc(this.firestore, `historialConfiguracion/${userId}/enviado/${configId}`);
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      return configSnap.data();
    } else {
      return null;
    }
  }
}
