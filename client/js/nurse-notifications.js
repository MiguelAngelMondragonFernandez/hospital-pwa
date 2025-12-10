import { url } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getMessaging, getToken, deleteToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js";

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

export async function initNotifications(onMessageCallback) {
    // 1. Subscribe (Get Token)
    await subscribeToPush();

    // 2. Listen for Foreground Messages
    onMessage(messaging, (payload) => {
        console.log('🔔 [Foreground] Message received:', payload);
        handleNotification(payload, onMessageCallback);
    });

    // 3. Listen for Background Broadcasts
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BACKGROUND_MSG_RECEIVED') {
            console.log("⚡ [Background Broadcast] Received:", event.data.payload);
            handleNotification(event.data.payload, onMessageCallback);
        }
    });

    console.log("✅ Notifications Initialized");
}

export async function disableNotifications() {
    try {
        const result = await deleteToken(messaging);
        if (result) {
            console.log('🔕 Notifications disabled (Token deleted).');
        } else {
            console.log('No active token to delete.');
        }
    } catch (err) {
        console.error('Error disabling notifications:', err);
    }
}

async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const token = await getToken(messaging, { serviceWorkerRegistration: registration });
            if (token) {
                console.log("FCM Token:", token);
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    await fetch(url + '/notifications/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ token: token, userId: user.id }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error subscribing to push:', err);
    }
}

function handleNotification(payload, callback) {
    const title = payload.notification ? payload.notification.title : (payload.data ? payload.data.title : 'Notificación');
    const body = payload.notification ? payload.notification.body : (payload.data ? payload.data.body : '');

    // Play Sound
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.warn("Audio blocked:", e));
    } catch (e) { console.error(e); }

    // Show Toast
    showToast(title, body);

    // Refresh Data
    if (callback && typeof callback === 'function') {
        callback();
    }
}

function showToast(title, body) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 flex items-start gap-3 animate-slide-in';

    // Explicit styles for fallback
    Object.assign(toast.style, {
        position: 'fixed', top: '20px', right: '20px', backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '16px',
        zIndex: '9999', display: 'flex', gap: '12px', minWidth: '300px'
    });

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
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}
