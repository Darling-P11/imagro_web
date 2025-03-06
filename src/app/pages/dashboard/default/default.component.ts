import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.css']
})
export class DefaultComponent implements OnInit {
  userName: string = "Cargando...";
  userRole: string = "Cargando...";
  userId: string = "";

  // Datos del usuario autenticado
  pendingContributions: number = 0;
  approvedContributions: number = 0;
  rejectedContributions: number = 0;

  // Datos generales de Imagro (solo "aceptado")
  totalAcceptedContributions: number = 0;
  totalUsers: number = 0;
  totalModels: number = 0;

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit() {
    this.getUserData();
  }

  // 🔹 Obtiene los datos del usuario autenticado desde Firestore
  getUserData() {
    user(this.auth).subscribe((userData) => {
      if (userData) {
        this.userId = userData.uid;
        console.log("User ID autenticado:", this.userId);

        // Obtener datos del usuario directamente por ID
        const userRef = doc(this.firestore, `/users/${this.userId}`);

        docData(userRef).subscribe((data: any) => {
          console.log("Datos del usuario obtenido:", data);
          if (data) {
            this.userName = data?.name || "Usuario";
            this.userRole = data?.role || "Sin rol";
          }
          this.getUserContributions(); // 🔹 Ahora sí llamamos a las contribuciones después de obtener el ID
        });
      }
    });

    // Cargar datos generales de Imagro
    this.getAcceptedContributions();
    this.getUsersCount();
    this.getModelsCount();
  }

  // 🔹 Obtiene TODAS las contribuciones y las filtra manualmente comparando `usuario === userId`
  getUserContributions() {
    const estados = ['enviado', 'aceptado', 'rechazado'];

    estados.forEach(estado => {
      const collectionPath = `/historialContribuciones/PRWCxyVh65dsy7mwDFqVMvJF6di1/${estado}`;
      const collectionRef = collection(this.firestore, collectionPath);

      collectionData(collectionRef).subscribe((data: any[]) => {
        console.log(`Todas las contribuciones (${estado}):`, data);

        // 🔹 Filtramos correctamente por `usuario === userId`
        const userContributions = data.filter(contribution => contribution.usuario === this.userId);
        
        console.log(`Contribuciones (${estado}) del usuario:`, userContributions);

        switch (estado) {
          case 'enviado':
            this.pendingContributions = userContributions.length || 0;
            break;
          case 'aceptado':
            this.approvedContributions = userContributions.length || 0;
            break;
          case 'rechazado':
            this.rejectedContributions = userContributions.length || 0;
            break;
        }
      });
    });
  }

  // 🔹 Obtiene las contribuciones aceptadas en general (para "Datos de Imagro")
  getAcceptedContributions() {
    const collectionPath = `/historialContribuciones/PRWCxyVh65dsy7mwDFqVMvJF6di1/aceptado`;
    const collectionRef = collection(this.firestore, collectionPath);

    collectionData(collectionRef).subscribe((data) => {
      console.log("Contribuciones aceptadas globales:", data);
      this.totalAcceptedContributions = data.length || 0;
    });
  }

  // 🔹 Obtiene la cantidad total de usuarios
  getUsersCount() {
    const usersCollection = collection(this.firestore, '/users');
    collectionData(usersCollection).subscribe((data) => {
      console.log("Usuarios obtenidos:", data);
      this.totalUsers = data.length || 0;
    });
  }

  // 🔹 Obtiene la cantidad total de modelos generados
  getModelsCount() {
    const modelsCollection = collection(this.firestore, '/modelsGenerate');
    collectionData(modelsCollection).subscribe((data) => {
      console.log("Modelos obtenidos:", data);
      this.totalModels = data.length || 0;
    });
  }

  // 🔹 Formatea el rol del usuario
  getFormattedRole(): string {
    return this.userRole.replace(/_/g, ' ') 
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
