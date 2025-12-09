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

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});


// Debug logic moved to load event

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
            // alert(data.message);
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

    // 1. Play Sound
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.warn("Audio play blocked (user must interact first):", e));
    } catch (e) {
        console.error("Audio error:", e);
    }

    // 2. Show Visual Toast
    showToast(title, body);

    // 3. Reload Table
    loadRequests();
});

function showToast(title, body) {
    // Create toast container
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 flex items-start gap-3 animate-slide-in';

    // Inject styles explicitly in case tailwind is missing
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = 'white';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.borderRadius = '8px';
    toast.style.padding = '16px';
    toast.style.zIndex = '9999';
    toast.style.display = 'flex';
    toast.style.gap = '12px';
    toast.style.minWidth = '300px';

    toast.innerHTML = `
        <div style="background-color: #3B82F6; padding: 8px; border-radius: 50%;">
            <svg style="width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        </div>
        <div>
            <h4 style="font-weight: bold; margin: 0; color: #1F2937;">${title}</h4>
            <p style="margin: 0; font-size: 14px; color: #4B5563;">${body}</p>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// Refresh when tab becomes visible
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        console.log("Tab active: Reloading requests...");
        loadRequests();
    }
});

addEventListener('load', () => {


    loadRequests();
    setInterval(loadRequests, 10000);
    subscribeToPush();

    // Listen for messages from Service Worker (Broadcast)
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BACKGROUND_MSG_RECEIVED') {
            console.log("⚡ [nurse.js] Received broadcast from SW:", event.data.payload);
            const payload = event.data.payload;
            const title = payload.notification ? payload.notification.title : (payload.data ? payload.data.title : 'Notificación');
            const body = payload.notification ? payload.notification.body : (payload.data ? payload.data.body : '');

            // Re-use logic: Play sound and show toast
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.warn("Audio play blocked:", e));
            } catch (e) { console.error(e); }

            showToast(title, body);
            loadRequests();
        }
    });
});