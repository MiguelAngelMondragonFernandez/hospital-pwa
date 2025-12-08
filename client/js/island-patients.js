import { logout } from './island/utils.js';
import {  loadPatients } from './island/patients.js';

// DOM Elements
const btnLogout = document.getElementById('btn-logout');

// Initialize on page load
addEventListener('load', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Iniciando Panel de Isla - Pacientes...');
    
    // Initialize logout button
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    } else {
        console.warn('⚠️ Botón de logout no encontrado');
    }
    
    // Load initial data
    loadPatients();
    
    console.log('✅ Panel de Pacientes inicializado correctamente');
}