import { logout } from './island/utils.js';
import { initializeBeds, loadBeds } from './island/beds.js';

// DOM Elements
const btnLogout = document.getElementById('btn-logout');

// Initialize on page load
addEventListener('load', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Iniciando Panel de Isla - Camas...');
    
    // Initialize logout button
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    } else {
        console.warn('⚠️ Botón de logout no encontrado');
    }
    
    // Initialize beds module
    initializeBeds();
    
    // Load initial data
    loadBeds();
    
    console.log('✅ Panel de Camas inicializado correctamente');
}