/*
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
        console.log('Service Worker registrado con éxito:', registration);
    })
    .catch((error) => {
        console.error('Error al registrar Service Worker:', error);
    });
}
*/
import { url } from "./config.js";
const form = document.getElementById('form-login');
const usernameInput = document.getElementById('username');
const passwordContainer = document.getElementById('password-container');
const passwordInput = document.getElementById('password');
const btnSubmit = document.getElementById('btn-submit');
const alertMessage = document.getElementById('alert-message');

let needsPassword = false;
let checkingAuth = false;

// Mostrar alerta
function showAlert(message, type = 'error') {
    alertMessage.textContent = message;
    alertMessage.className = `p-4 rounded-lg mb-4 ${
        type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
    }`;
    alertMessage.classList.remove('hidden');
}

function hideAlert() {
    alertMessage.classList.add('hidden');
}

// Verificar si el usuario necesita contraseña (con debounce)
let authCheckTimeout;
usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim();
    
    // Limpiar timeout anterior
    clearTimeout(authCheckTimeout);
    
    if (!username || username.length < 3) {
        passwordContainer.style.display = 'none';
        passwordInput.required = false;
        return;
    }

    // Esperar 500ms después de que el usuario deje de escribir
    authCheckTimeout = setTimeout(async () => {
        await checkAuthentication(username);
    }, 500);
});

async function checkAuthentication(username) {
    if (checkingAuth) return;
    
    try {
        checkingAuth = true;
        const response = await fetch(`${url}/user/need-authentication`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            needsPassword = data.data;
            
            if (needsPassword) {
                passwordContainer.style.display = 'block';
                passwordInput.required = true;
                btnSubmit.textContent = 'Iniciar Sesión';
                // Auto-focus en contraseña
                setTimeout(() => passwordInput.focus(), 100);
            } else {
                passwordContainer.style.display = 'none';
                passwordInput.required = false;
                btnSubmit.textContent = 'Continuar';
            }
            hideAlert();
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        checkingAuth = false;
    }
}

// Manejar el submit del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
        showAlert('Por favor ingresa tu usuario');
        usernameInput.focus();
        return;
    }

    if (needsPassword && !password) {
        showAlert('Por favor ingresa tu contraseña');
        passwordInput.focus();
        return;
    }

    try {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Cargando...';
        hideAlert();

        const response = await fetch(`${url}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('✅ Login exitoso', 'success');
            
            // Guardar datos del usuario
            localStorage.setItem('user', JSON.stringify(data.data));
            localStorage.setItem('username', username);
            
            // Redirigir según el rol del usuario
            setTimeout(() => {
                switch (data.data.role) {
                    case 'island':
                        window.location.href = 'island.html';
                        break;
                    case 'nurse':
                        window.location.href = 'nurse.html';
                        break;
                    case 'stretcher':
                        localStorage.setItem('stretcherId', data.data.id);
                        window.location.href = 'stretcher.html';
                        break;
                    default:
                        showAlert('Rol no reconocido', 'error');
                        btnSubmit.disabled = false;
                        btnSubmit.textContent = needsPassword ? 'Iniciar Sesión' : 'Continuar';
                        break;
                }
            }, 800);
        } else {
            showAlert(data.message || 'Error al iniciar sesión');
            btnSubmit.disabled = false;
            btnSubmit.textContent = needsPassword ? 'Iniciar Sesión' : 'Continuar';
            
            // Focus en el campo correspondiente
            if (response.status === 401 && needsPassword) {
                passwordInput.focus();
                passwordInput.select();
            } else {
                usernameInput.focus();
                usernameInput.select();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error de conexión. Verifica tu internet.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = needsPassword ? 'Iniciar Sesión' : 'Continuar';
    }
});

// Auto-focus en el campo de usuario al cargar
window.addEventListener('load', () => {
    usernameInput.focus();
});