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

const btnLogout = document.getElementById('btn-logout');
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('user');
    localStorage.removeItem('stretcherId');
    window.location.href = 'index.html';
});

const btnRequest = document.getElementById('btn-request');
const btnMarkAttended = document.getElementById('btn-mark-attended');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');


async function checkActiveRequest() {
    try {
        const response = await fetch(url + "/attention/findAllByStretcherId/" + localStorage.getItem('stretcherId'));
        if (response.ok) {
            const data = await response.json();
            const requests = data.data;
            // Find the latest active request to show its status
            const activeRequest = requests.find(r => r.status !== 'Atendida');

            if (activeRequest) {
                statusContainer.style.display = 'block';
                statusText.textContent = activeRequest.status;
            } else {
                statusContainer.style.display = 'none';
            }
        } else {
            statusContainer.style.display = 'none';
        }
    } catch (error) {
        console.error("Error checking status", error);
    }
}

// Removed showActiveState/showInactiveState/markAsAttended as Stretcher shouldn't mark as attended.

btnRequest.addEventListener('click', async () => {
    // Disable button immediately
    btnRequest.disabled = true;

    // Re-enable after 5 seconds
    setTimeout(() => {
        btnRequest.disabled = false;
    }, 5000);

    const response = await fetch(url + "/attention/save", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dateTime: new Date().toLocaleString(),
            status: 'Pendiente',
            stretcherId: localStorage.getItem('stretcherId'),
        })
    });
    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        checkActiveRequest();
    } else {
        alert(data.message);
    }
});

addEventListener('load', async () => {
    checkActiveRequest();
});
