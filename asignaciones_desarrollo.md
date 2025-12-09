# Asignación de Tareas de Desarrollo

Este documento detalla la distribución de las tareas pendientes para completar las funcionalidades del sistema hospitalario, incluyendo la nueva funcionalidad de **Login con QR**.

**Desarrolladores:**
*   Abraham
*   Axel

---

## Distribución de Tareas

Para garantizar una carga de trabajo equitativa, se han dividido las funcionalidades faltantes en 6 tareas principales (3 para cada uno):

### 👨‍💻 Abraham

1.  **Frontend: Interfaz de Asignación de Enfermeros**
    *   **Descripción:** Crear una vista en el módulo "Isla" que permita seleccionar un enfermero y asignarle una o varias camas disponibles.
    *   **Estado:** Pendiente.

2.  **Offline: Visualización de Datos (Caché)**
    *   **Descripción:** Implementar la lógica para que las vistas "Mis Camas" e "Información de Paciente" muestren datos cacheados cuando no haya conexión.
    *   **Estado:** Pendiente.

3.  **Backend: Endpoint Login QR**
    *   **Descripción:** Crear un endpoint `/api/user/login-qr` que acepte un ID de cama/usuario y autentique al usuario automáticamente (sin contraseña, según requerimiento).
    *   **Estado:** Pendiente.

### 👨‍💻 Axel

1.  **Frontend: Control de Turnos**
    *   **Descripción:** Agregar botones de "Iniciar Turno" y "Terminar Turno" en la vista del enfermero (`beds.html`), conectándolos con los endpoints existentes del backend.
    *   **Estado:** Pendiente.

2.  **Offline: Infraestructura (Service Worker)**
    *   **Descripción:** Configurar el `sw.js` para interceptar peticiones, cachear los assets estáticos (HTML, CSS, JS) y manejar el estado de conexión.
    *   **Estado:** Pendiente.

3.  **Frontend: Escáner Login QR**
    *   **Descripción:** Integrar la librería de escaneo QR en la pantalla de login (`index.html`) para leer el ID y llamar al nuevo endpoint de login.
    *   **Estado:** Pendiente.

---

## Resumen

*   **Abraham:** 3 tareas (1 UI compleja, 1 Lógica Offline, 1 Backend).
*   **Axel:** 3 tareas (1 UI media, 1 Infraestructura Offline, 1 Integración Hardware).

*Asignación actualizada para incluir Login con QR.*
