import { environment } from './environment.prod';
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';


// ✅ Inicializar Firebase con tu configuración
const app = initializeApp(environment.firebaseConfig);

// ✅ Configurar autenticación y persistencia local
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Persistencia habilitada correctamente');
  })
  .catch((error) => {
    console.error('Error al configurar la persistencia:', error);
  });

export { auth };
