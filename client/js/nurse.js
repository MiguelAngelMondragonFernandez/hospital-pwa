import { url } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js";

const tableBody = document.getElementById('requests-table-body');
const noRequestsMsg = document.getElementById('no-requests-msg');
const btnRefresh = document.getElementById('btn-refresh');
const btnLogout = document.getElementById('btn-logout');

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCZgu1E_xrpOIaaSPExLzehHb9PwL1nNhA",
    authDomain: "authfluttertwitterclone.firebaseapp.com",
    projectId: "authfluttertwitterclone",
    storageBucket: "authfluttertwitterclone.firebasestorage.app",
    messagingSenderId: "485188841768",
    appId: "1:485188841768:web:eae53681a3930b7a4fa01d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
}

if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
        loadRequests();
    });
}

async function loadRequests() {
    if (!tableBody) return; // Guard

    try {
        const response = await fetch(url + "/attention/findAllUnattended");
        if (response.ok) {
            const data = await response.json();
            const requests = data.data;

            if (requests && requests.length > 0) {
                renderTable(requests);
                if (noRequestsMsg) noRequestsMsg.style.display = 'none';
                if (tableBody.parentElement) tableBody.parentElement.style.display = 'table';
            } else {
                tableBody.innerHTML = '';
                if (noRequestsMsg) noRequestsMsg.style.display = 'block';
                if (tableBody.parentElement) tableBody.parentElement.style.display = 'none';
            }
        } else {
            tableBody.innerHTML = '';
            if (noRequestsMsg) noRequestsMsg.style.display = 'block';
            if (tableBody.parentElement) tableBody.parentElement.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading requests", error);
    }
}

function renderTable(requests) {
    if (!tableBody) return;

    tableBody.innerHTML = '';
    requests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.id}</td>
            <td>${req.stretcherId}</td>
            <td>${req.dateTime}</td>
            <td><span class="badge bg-warning text-dark">${req.status}</span></td>
            <td>
                ${req.status !== 'Atendida' ? `<button class="btn-attend btn btn-primary btn-sm" data-id="${req.id}">Atender</button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.btn-attend').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            markAsAttended(id);
        });
    });
}

async function markAsAttended(id) {
    try {
        const response = await fetch(url + "/attention/markAsAttended/" + id, {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            loadRequests();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error marking as attended", error);
        alert("Error al marcar como atendida");
    }
}

async function subscribeToPush() {
    console.log("Attempting to subscribe to push..."); // DEBUG
    try {
        // 1. Register Service Worker Manually to specify path
        let registration;
        try {
            registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
            console.log("Service Worker registered with scope:", registration.scope);
        } catch (swError) {
            console.error("Service Worker registration failed:", swError);
            console.log("Trying absolute path /client/firebase-messaging-sw.js as fallback...");
            registration = await navigator.serviceWorker.register('/client/firebase-messaging-sw.js');
        }

        // Wait for Service Worker to be active to avoid "no active Service Worker" error
        if (!registration.active && (registration.installing || registration.waiting)) {
            const sw = registration.installing || registration.waiting;
            if (sw) {
                await new Promise((resolve) => {
                    if (sw.state === 'activated') {
                        resolve(null);
                        return;
                    }
                    const listener = () => {
                        if (sw.state === 'activated') {
                            sw.removeEventListener('statechange', listener);
                            resolve(null);
                        }
                    };
                    sw.addEventListener('statechange', listener);
                });
            }
        }

        console.log("Requesting permission..."); // DEBUG
        const permission = await Notification.requestPermission();
        console.log("Permission status:", permission); // DEBUG

        if (permission === 'granted') {
            console.log("Getting token..."); // DEBUG
            const token = await getToken(messaging, { serviceWorkerRegistration: registration });

            if (token) {
                console.log("FCM Token:", token);
                // Send token to backend
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    await fetch(url + '/notifications/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({
                            token: token,
                            userId: user.id
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log("Token sent to backend for user:", user.id);
                } else {
                    console.warn("No user found in localStorage to link token.");
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
    }
}

onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    const { title, body } = payload.notification;
    // Show toast or alert
    alert(`${title}: ${body}`);
    loadRequests(); // Reload table
});

addEventListener('load', () => {
    loadRequests();
    setInterval(loadRequests, 10000);
    subscribeToPush();
});