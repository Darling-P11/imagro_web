import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged, // Importante para verificar el estado de autenticación
  User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {
    // ✅ Configurar persistencia de sesión en el almacenamiento local
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        console.log('Persistencia habilitada correctamente');
      })
      .catch((error) => {
        console.error('Error al configurar la persistencia:', error);
      });
  }

  // 🔒 Verificar si el usuario está autenticado
  isLoggedIn(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      onAuthStateChanged(this.auth, (user: User | null) => {
        if (user) {
          observer.next(true); // Usuario autenticado
        } else {
          observer.next(false); // No autenticado
        }
      });
    });
  }

  // 🔹 Inicio de sesión con correo y contraseña
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // 🔹 Inicio de sesión con Google
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  // 🔹 Cerrar sesión
  logout() {
    const auth = getAuth();
    return signOut(auth);
  }

  // 🔹 Registro con Google y almacenamiento en Firestore
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      // Guardar datos en Firestore
      await setDoc(doc(this.firestore, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber || '', // Google puede no proporcionar el número
        photoURL: user.photoURL, // Foto de perfil de Google
        role: 'usuario',
        createdAt: new Date(),
      });

      return user;
    } catch (error) {
      console.error('Error al registrar con Google:', error);
      throw error;
    }
  }

  // 🔹 Reseteo de contraseña
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  // ✅ Registro de usuario con validación y almacenamiento en Firestore
  async register(userData: any): Promise<void> {
    const { email, password, name, phoneNumber, photo } = userData;
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('No se pudo crear el usuario');
      }

      await updateProfile(user, {
        displayName: name,
        photoURL: photo,
      });

      const userRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email,
        name,
        phoneNumber,
        photoURL: photo,
        role: 'usuario',
        createdAt: new Date(),
      });

      console.log('Datos guardados en Firestore correctamente.');
    } catch (error) {
      console.error('Error al registrar el usuario en Firestore:', error);
      throw error;
    }
  }
}
