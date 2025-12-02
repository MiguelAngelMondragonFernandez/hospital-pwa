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
            // Assuming the API returns a list, we check if there's any non-attended one
            // Or if we need to filter client-side. 
            // Based on backend changes, findAllByStretcherId returns all. 
            // We should probably filter for the latest active one or the backend should have given us just the active one.
            // Let's filter here for now.
            const requests = data.data;
            const activeRequest = requests.find(r => r.status !== 'Atendida');

            if (activeRequest) {
                showActiveState(activeRequest);
            } else {
                showInactiveState();
            }
        } else {
            showInactiveState();
        }
    } catch (error) {
        console.error("Error checking status", error);
    }
}

function showActiveState(request) {
    btnRequest.style.display = 'none';
    btnMarkAttended.style.display = 'block';
    statusContainer.style.display = 'block';
    statusText.textContent = request.status;
    btnMarkAttended.onclick = () => markAsAttended(request.id);
}

function showInactiveState() {
    btnRequest.style.display = 'block';
    btnMarkAttended.style.display = 'none';
    statusContainer.style.display = 'none';
}

async function markAsAttended(id) {
    try {
        const response = await fetch(url + "/attention/markAsAttended/" + id, {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            checkActiveRequest();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Error al marcar como atendida");
    }
}

btnRequest.addEventListener('click', async () => {
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
