![Banner](https://imgur.com/2BEXRlN.png)

---

**Imagro web** es una plataforma que complementa la aplicación móvil de imagro. Esta interfaz web permite visualizar y administrar el dataset generado desde la app móvil, visualizar geográficamente las contribuciones aprobadas y generar modelos de inteligencia artificial basados en imágenes reales de cultivos.

El sistema está diseñado para investigadores, docentes, estudiantes y productores agrícolas, facilitando el análisis visual, el entrenamiento de modelos y la toma de decisiones basadas en datos reales.

---

## ⚙️ Tecnologías utilizadas

| Herramienta         | Versión         |
|---------------------|-----------------|
| Angular             | 19.1.7          |
| Firebase            | Auth, Firestore, Storage |
| Google Maps API     | Última versión  |
| TensorFlow.js       | Integración personalizada |
| Librerías UI        | TailwindCSS, Remix Icons |

---

## 🚀 Instalación y primeros pasos

### 📦 **Instala las dependencias**

```bash
npm install
```

### 🧪 **Inicia el entorno de desarrollo**

```bash
ng serve
```

---

### 🔧 **Configuración de Firebase**

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/) o usa el mismo de la app móvil.
2. Agrega la configuración en el archivo `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

3. Asegúrate de habilitar:

   - Firebase Authentication (Email/Password)  
   - Cloud Firestore  
   - Firebase Storage

---

### 🌐 **Despliegue en Producción**

La aplicación web se encuentra desplegada y accesible desde:

➡️ [https://imagroweb.netlify.app](https://imagroweb.netlify.app)

---

### 🧩 **Módulos principales**

- **Visualización de contribuciones georreferenciadas**  
- **Exploración de datasets con imágenes verificadas**  
- **Generación y descarga de modelos IA (MobileNet v1)**  
- **Gestión de etiquetas y control de calidad de datos**  
- **Panel administrativo por rol (usuario/admin)**

---

### 🤝 **¿Cómo contribuir?**

1. Haz un fork del repositorio.
2. Crea una nueva rama basada en `main`:

```bash
git checkout -b feature/nueva-funcionalidad
```

3. Realiza tus cambios y haz commit:

```bash
git commit -m "Agrega nueva funcionalidad"
```

4. Haz push a tu rama:

```bash
git push origin feature/nueva-funcionalidad
```

5. Abre una Pull Request describiendo los cambios realizados.

📄 Consulta la guía completa en `CONTRIBUTING.md`.

---

### 📄 **Licencia**

Este repositorio está licenciado bajo la **GNU General Public License v3.0**. Consulta el archivo `LICENSE` para más detalles.

---

### ✉️ **Contacto**

**Desarrollado por:** Kevin Darling Ponce Rivera  
📧 **Correo:** kevinponce2001@hotmail.com
