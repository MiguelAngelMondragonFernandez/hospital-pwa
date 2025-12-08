import { logout } from './island/utils.js';
import { initializeNurses, loadNurses } from './island/nurses.js';

// DOM Elements
const btnLogout = document.getElementById('btn-logout');

// Initialize on page load
addEventListener('load', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Iniciando Panel de Isla - Enfermeros...');
    
    // Initialize logout button
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    } else {
        console.warn('⚠️ Botón de logout no encontrado');
    }
    
    // Initialize nurses module
    initializeNurses();
    
    // Load initial data
    loadNurses();
    
    console.log('✅ Panel de Enfermeros inicializado correctamente');
}