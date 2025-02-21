import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // 🔹 Inicio de sesión con correo y contraseña
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // 🔹 Inicio de sesión con Google
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  
  // Registro con Google y almacenamiento en Firestore
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
        createdAt: new Date()
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
    const { email, password, name, phoneNumber, photo } = userData; // Usar 'name' directamente
    try {
      // ✅ Crear usuario con email y contraseña
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
  
      if (!user) {
        throw new Error('No se pudo crear el usuario');
      }
  
      // ✅ Actualizar perfil de usuario con nombre y foto
      await updateProfile(user, {
        displayName: name, // Guardar el nombre correctamente
        photoURL: photo
      });
  
      // ✅ Guardar datos adicionales en Firestore
      const userRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email,
        name, // Guardar el campo como 'name'
        phoneNumber,
        photoURL: photo,
        role: 'usuario', // Rol por defecto
        createdAt: new Date()
      });
  
      console.log('Datos guardados en Firestore correctamente.');
    } catch (error) {
      console.error('Error al registrar el usuario en Firestore:', error);
      throw error;
    }
  }
  
}
