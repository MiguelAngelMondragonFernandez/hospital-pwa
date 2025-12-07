// ==================== MAIN INITIALIZATION ====================

import { logout } from './island/utils.js';
import { initializeTabs } from './island/tabs.js';
import { initializeHistory } from './island/history.js';
import { initializeNurses } from './island/nurses.js';
import { initializePatients } from './island/patients.js';
import { initializeBeds } from './island/beds.js';

// DOM Elements
const btnLogout = document.getElementById('btn-logout');

// Initialize on page load
addEventListener('load', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Iniciando Panel de Isla...');
    
    // Initialize global event listeners
    btnLogout.addEventListener('click', logout);
    
    // Initialize all modules
    initializeTabs();
    initializeHistory();
    initializeNurses();
    initializePatients();
    initializeBeds();
    
    console.log('✅ Panel de Isla inicializado correctamente');
}