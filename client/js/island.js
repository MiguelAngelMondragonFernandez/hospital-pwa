import { logout } from './island/utils.js';
import { initializeHistory } from './island/history.js';
import { initializeNurses } from './island/nurses.js';
import { initializePatients } from './island/patients.js';
import { initializeBeds } from './island/beds.js';

const btnLogout = document.getElementById('btn-logout');

addEventListener('load', () => {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Iniciando Panel de Isla...');
    
    // Initialize global event listeners
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
    
    // Detectar qué módulos están disponibles e inicializar solo esos
    if (document.getElementById('requests-table-body')) {
        console.log('📋 Inicializando módulo de historial...');
        initializeHistory();
    }
    
    if (document.getElementById('nurses-table-body')) {
        console.log('👨‍⚕️ Inicializando módulo de enfermeros...');
        initializeNurses();
    }
    
    if (document.getElementById('patients-table-body')) {
        console.log('🏥 Inicializando módulo de pacientes...');
        initializePatients();
    }
    
    if (document.getElementById('beds-table-body')) {
        console.log('🛏️ Inicializando módulo de camas...');
        initializeBeds();
    }
    
    console.log('✅ Panel de Isla inicializado correctamente');
}