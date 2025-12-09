importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');
// Config imported manually or not needed if only for background handling

// Initialize Firebase app in the service worker
// Note: We need to import the config. But wait, config.js is a module, importScripts might fail if not careful.
// Ideally, we should hardcode or fetch config here.
// For now, let's assume the user provides the config object here or we load it.

// Placeholder config - User must fill this or we read from shared location if possible.
// Since service workers have different scope, let's look for a way to share config.
// Simplest way for now: Hardcode placeholders and ask user to fill.

const firebaseConfig = {
    apiKey: "AIzaSyCZgu1E_xrpOIaaSPExLzehHb9PwL1nNhA",
    authDomain: "authfluttertwitterclone.firebaseapp.com",
    projectId: "authfluttertwitterclone",
    storageBucket: "authfluttertwitterclone.firebasestorage.app",
    messagingSenderId: "485188841768",
    appId: "1:485188841768:web:eae53681a3930b7a4fa01d"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png' // Optional
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});
