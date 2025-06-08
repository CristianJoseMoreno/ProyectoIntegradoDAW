# 📚 **Proyecto Final DAW - Aplicación Web de Referencias Bibliográficas**

## 📝 **Introducción**

Este proyecto tiene como objetivo desarrollar una aplicación web para gestionar referencias bibliográficas de manera sencilla, con generación automática de citas en múltiples formatos como APA, MLA, Chicago, entre otros.

**Características principales:**
Editor de texto con generación automática de citas.
Almacenamiento en la nube (Google Drive API).
Autenticación con Google.
CRUD para gestión de referencias bibliográficas.

> **Orientado a estudiantes e investigadores** que necesitan una herramienta eficiente para gestionar citas y documentos.

---

## 🔧 **Funcionalidades de la versión 1.0**

### ✍️ **Editor de Texto con Generación Automática de Citas**

- Creación de documentos con citas en los formatos deseados.
- Formateo de referencias con **citeproc** y **CSL**.
- Inserción de citas directamente en el texto.

### ☁️ **Almacenamiento y Sincronización en la Nube**

- Uso de **Google Drive API** para guardar y sincronizar archivos.
- Vinculación de referencias a documentos almacenados en la nube.

### 🔐 **Autenticación de Usuario**

- Inicio de sesión con **Google OAuth** para una gestión segura de documentos.

### 📂 **CRUD para Referencias Bibliográficas**

- Creación, lectura, actualización y eliminación de citas desde la interfaz web.

---

## 🛠️ **Tecnologías usadas**

### 🎨 **Frontend**

- ️**React.js** – UI interactiva y moderna.
- **Tailwind** – Diseño responsivo y estilizado.
- **ReactQuill** – Editor de texto interactivo.
- **React Router** – Gestión de navegación.
- **@react-oauth/google** – Autenticación con Google.
- **axios** – Cliente HTTP para peticiones a la API.
- **citation-js** – Para la generación de citas.
- **file-saver** – Para guardar archivos generados.
- **html-to-docx** – Para convertir HTML a documentos Word.
- **jwt-decode** – Para decodificar JSON Web Tokens.
- **mammoth** – Para leer documentos Word.
- **react-hot-toast** – Para notificaciones.

### 🖥️ **Backend**

- **Node.js + Express** – API y servidor web.
- **MongoDB Atlas** – Base de datos en la nube.
- **JWT (JSON Web Token)** – Autenticación segura.
- **Google Drive API** – Almacenamiento en la nube.

## 🛠️ **Herramientas de Desarrollo**

- **Git & GitHub** – Control de versiones y colaboración en el desarrollo del proyecto.
- **Visual Studio Code** – Editor de código recomendado para trabajar en el proyecto.

---

## 🚀 **Cómo desplegar el proyecto**

Para desplegar este proyecto, necesitarás configurar tanto el frontend como el backend.

### **Backend**

1.  **Clona el repositorio del backend:**
    ```bash
    git clone <URL_DEL_REPOSITORIO_BACKEND>
    cd <CARPETA_DEL_REPOSITORIO_BACKEND>
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables (ejemplo):

    ```
    MONGO_URI=tu_cadena_de_conexion_mongodb_atlas
    GOOGLE_CLIENT_ID=tu_id_cliente_google
    GOOGLE_CLIENT_SECRET=tu_secret_cliente_google
    JWT_SECRET=tu_secret_jwt
    DRIVE_REDIRECT_URI=tu_url_redireccion_drive
    ```

4.  **Inicia el servidor:**
    ```bash
    npm start
    ```

### **Frontend**

1.  **Clona el repositorio del frontend:**
    ```bash
    git clone <URL_DEL_REPOSITORIO_FRONTEND>
    cd <CARPETA_DEL_REPOSITORIO_FRONTEND>
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade la URL de tu API backend (ejemplo):

    ```
    REACT_APP_API_URL=http://localhost:5000 # o la URL de tu backend desplegado
    REACT_APP_GOOGLE_CLIENT_ID=tu_id_cliente_google_frontend
    ```

4.  **Inicia la aplicación:**
    ```bash
    npm start
    ```
