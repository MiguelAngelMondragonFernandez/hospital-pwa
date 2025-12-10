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
    localStorage.removeItem('patientId');
    localStorage.removeItem('bedId');
    localStorage.removeItem('patientName');
    localStorage.removeItem('role');
    localStorage.removeItem('token');

    window.location.href = 'index.html';
});

const btnRequest = document.getElementById('btn-request');
const btnMarkAttended = document.getElementById('btn-mark-attended');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');


async function checkActiveRequest() {
    try {
        const response = await fetch(url + "/attention/findAllByStretcherId/" + localStorage.getItem('bedId'));
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
    // Visual feedback: Disable button
    btnRequest.disabled = true;
    const originalClasses = btnRequest.className;
    btnRequest.className = "w-full bg-gray-400 cursor-not-allowed text-white font-bold py-6 px-4 rounded-2xl shadow-lg text-xl flex items-center justify-center gap-3";

    // Re-enable after 7 seconds
    setTimeout(() => {
        btnRequest.disabled = false;
        btnRequest.className = originalClasses;
    }, 7000);

    const response = await fetch(url + "/attention/save", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dateTime: new Date().toLocaleString(),
            status: 'Pendiente',
            stretcherId: localStorage.getItem('bedId'),
        })
    });
    const data = await response.json();
    if (response.ok) {
        // alert(data.message); // Quieter UX
        checkActiveRequest();
    } else {
        alert(data.message);
    }
});

addEventListener('load', async () => {
    checkActiveRequest();

    // Poll for status updates every 3 seconds
    setInterval(checkActiveRequest, 3000);
});
