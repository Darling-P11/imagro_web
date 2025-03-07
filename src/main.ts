import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http'; // ✅ Agregado aquí

bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // ✅ Inicializar Firebase
    provideAuth(() => getAuth()), // ✅ Proveer autenticación
    provideFirestore(() => getFirestore()), // ✅ Proveer Firestore
    provideRouter(routes), // ✅ Configurar rutas
    provideAnimations(), // ✅ Habilitar animaciones
    provideHttpClient(), // ✅ Proveer HttpClient para peticiones HTTP
  ]
}).catch((err) => console.error('Error al inicializar la aplicación:', err));
