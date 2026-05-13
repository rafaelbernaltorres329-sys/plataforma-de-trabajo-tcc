# 🧠 Plataforma de Trabajo Colaborativo (TCC)

Aplicación web para la gestión de tareas y colaboración en equipo en tiempo real.
Permite crear tareas, asignarlas, gestionarlas y comunicarse mediante un sistema de mensajería en tiempo real.

---

## 🚀 Tecnologías utilizadas

### 🔹 Backend

* Node.js
* TypeScript
* Express
* MongoDB Atlas
* Mongoose
* Socket.io (tiempo real)
* Passport (autenticación)

### 🔹 Frontend

* React
* Vite
* TypeScript
* React Query
* Tailwind CSS / UI Components

---

## 📦 Instalación del proyecto

### 🔹 1. Clonar el repositorio

```bash
git clone https://github.com/LEONISPE/plataforma-de-trabajo-tcc.git
cd plataforma-de-trabajo-tcc
```

---

## ⚙️ Configuración del Backend

### 🔹 2. Ir a la carpeta del backend

```bash
cd backend
```

### 🔹 3. Instalar dependencias

```bash
npm install
```

### 🔹 4. Configurar variables de entorno

Renombra el archivo:

```bash
.env.example → .env
```

Y reemplaza los valores con los tuyos:

```env
PORT=8000
MONGO_URI=your_mongo_uri
SESSION_SECRET=your_secret
FRONTEND_ORIGIN=http://localhost:5173
```

---

### 🔹 5. Ejecutar backend

```bash
npm run dev
```

Servidor corriendo en:

```
http://localhost:8000
```

---

## 💻 Configuración del Frontend

### 🔹 6. Ir a la carpeta del frontend

```bash
cd ../frontend
```

### 🔹 7. Instalar dependencias

```bash
npm install
```

### 🔹 8. Configurar variables de entorno

Crear archivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

### 🔹 9. Ejecutar frontend

```bash
npm run dev
```

Aplicación disponible en:

```
http://localhost:5173
```

---

## ⚡ Funcionalidades principales

* ✅ Autenticación de usuarios
* ✅ Gestión de workspaces
* ✅ Creación y edición de tareas
* ✅ Asignación de tareas
* ✅ Eliminación de tareas
* ✅ Sistema de roles y permisos
* ✅ Mensajería en tiempo real (Socket.io)
* ✅ Historial de mensajes por tarea

---

## 🔌 Comunicación en tiempo real

El sistema implementa WebSockets con **Socket.io**, permitiendo:

* Envío de mensajes instantáneos
* Actualización en tiempo real sin recargar la página
* Comunicación directa entre usuarios dentro de un workspace

---



## 🧠 Notas importantes

* Asegúrate de tener MongoDB Atlas configurado correctamente.
* El backend usa sesiones (cookies), por lo que el frontend debe enviar:

  ```js
  credentials: "include"
  ```
* No subir archivos `.env` al repositorio.

---


Si te sirve este proyecto o lo usas como base, puedes darle una estrella ⭐ en el repositorio.
