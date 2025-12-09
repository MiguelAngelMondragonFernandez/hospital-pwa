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

const usernameInput = document.getElementById('username');
const formLogin = document.getElementById('form-login');
const passwordInput = document.getElementById('password');
const passwordContainer = document.getElementById('password-container');
const btnSubmit = document.getElementById('btn-submit');
const btnScanLogin = document.getElementById('btn-scan-login');

if (btnScanLogin) {
    btnScanLogin.addEventListener('click', () => {
        window.location.href = 'scan_login.html';
    });
}

formLogin.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (passwordContainer.style.display === 'none') {
        // Step 1: Check if authentication is needed
        try {
            const response = await fetch(`${url}/user/need-authentication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.data === true) {
                    // Auth needed: Show password field
                    passwordContainer.style.display = 'block';
                    btnSubmit.textContent = 'Iniciar sesión';
                    passwordInput.required = true;
                    passwordInput.focus();
                } else {
                    // Auth NOT needed: Attempt login directly
                    performLogin(username, null);
                }
            } else {
                alert(data.message || 'Error al verificar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    } else {
        // Step 2: Login with password
        performLogin(username, password);
    }
});

async function performLogin(username, password) {
    try {
        const response = await fetch(`${url}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Inicio de sesión exitoso: ' + data.message);
            console.log('User:', data.data);
            localStorage.setItem('user', JSON.stringify(data.data)); // Save full user info

            //Validamos el rol
            switch (data.data.role) {
                case 'island': {
                    window.location.href = 'island.html';
                    break;
                }
                case 'nurse': {
                    window.location.href = 'nurse.html';
                    break;
                }
                case 'stretcher': {
                    localStorage.setItem('stretcherId', data.data.id);
                    window.location.href = 'stretcher.html';
                    break;
                }
                default: {
                    alert('Error de inicio de sesión: ' + data.message);
                    break;
                }
            }
            // Redirect or update UI here
        } else {
            alert('Error de inicio de sesión: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al iniciar sesión');
    }
}
