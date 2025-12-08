import { url } from '../config.js';
import { showSuccess, showError, logout } from './utils.js';

// DOM Elements
const nursesTableBody = document.getElementById('nurses-table-body');
const noNursesMsg = document.getElementById('no-nurses-msg');
const btnAddNurse = document.getElementById('btn-add-nurse');
const btnRefreshNurses = document.getElementById('btn-refresh-nurses');
const btnLogout = document.getElementById('btn-logout');
const nurseModal = document.getElementById('nurse-modal');
const btnCloseNurseModal = document.getElementById('btn-close-nurse-modal');
const formNurse = document.getElementById('form-nurse');

let editingNurse = null;


async function loadNurses() {
    try {
        const response = await fetch(url + "/nurse/all");
        
        if (response.ok) {
            const data = await response.json();
            const nurses = data.data || data;
            console.log('Enfermeros cargados:', nurses);

            if (nurses && nurses.length > 0) {
                renderNursesTable(nurses);
                noNursesMsg.style.display = 'none';
            } else {
                nursesTableBody.innerHTML = '';
                noNursesMsg.style.display = 'block';
            }
        } else {
            console.error('Error en respuesta:', response.status);
            nursesTableBody.innerHTML = '';
            noNursesMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading nurses:", error);
        showError('Error al cargar enfermeros');
        nursesTableBody.innerHTML = '';
        noNursesMsg.style.display = 'block';
    }
}

function renderNursesTable(nurses) {
    nursesTableBody.innerHTML = '';
    
    nurses.forEach(nurse => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-4 font-medium">#${nurse.id}</td>
            <td class="p-4">${nurse.username}</td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                    <button data-action="edit" data-nurse-id="${nurse.id}" data-username="${nurse.username}"
                        class="text-indigo-600 hover:text-indigo-800 font-medium">
                        Editar
                    </button>
                    <button data-action="delete" data-nurse-id="${nurse.id}"
                        class="text-red-600 hover:text-red-800 font-medium">
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        nursesTableBody.appendChild(row);
    });
}

// ==================== MODAL ENFERMERO ====================

function openNurseModal(id = null, username = '') {
    editingNurse = id;
    document.getElementById('nurse-modal-title').textContent = id ? 'Editar Enfermero' : 'Agregar Enfermero';
    document.getElementById('nurse-id').value = id || '';
    document.getElementById('nurse-username').value = username;
    document.getElementById('nurse-password').value = '';
    document.getElementById('nurse-password').required = !id; // Solo requerido al crear
    nurseModal.classList.remove('hidden');
}

function closeNurseModal() {
    editingNurse = null;
    nurseModal.classList.add('hidden');
    formNurse.reset();
}

async function saveNurse(e) {
    e.preventDefault();
    
    const id = document.getElementById('nurse-id').value;
    const username = document.getElementById('nurse-username').value;
    const password = document.getElementById('nurse-password').value;
    
    const nurseData = {
        username,
        role: 'NURSE',
        needAuthentication: true
    };
    
    // Solo incluir password si se proporcionó
    if (password) {
        nurseData.password = password;
    }
    
    try {
        const endpoint = id ? `/nurse/update/${id}` : '/nurse/save';
        const method = 'POST';
        
        const response = await fetch(url + endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nurseData)
        });
        
        if (response.ok) {
            showSuccess(id ? 'Enfermero actualizado exitosamente' : 'Enfermero registrado exitosamente');
            closeNurseModal();
            loadNurses();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar enfermero');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al guardar enfermero');
    }
}

// ==================== CRUD ENFERMEROS ====================

async function deleteNurse(id) {
    if (!confirm('¿Está seguro de eliminar este enfermero?')) return;
    
    try {
        const response = await fetch(url + `/nurse/delete/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Enfermero eliminado exitosamente');
            loadNurses();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al eliminar enfermero');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar enfermero');
    }
}

// ==================== EVENT LISTENERS ====================

function initializeEventListeners() {
    // Botones principales
    btnAddNurse.addEventListener('click', () => openNurseModal());
    btnRefreshNurses.addEventListener('click', loadNurses);
    btnLogout.addEventListener('click', logout);
    
    // Modal de enfermero
    btnCloseNurseModal.addEventListener('click', closeNurseModal);
    formNurse.addEventListener('submit', saveNurse);
    
    // Event delegation para la tabla
    nursesTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        const nurseId = parseInt(button.dataset.nurseId);
        
        switch(action) {
            case 'edit':
                const username = button.dataset.username;
                openNurseModal(nurseId, username);
                break;
            case 'delete':
                deleteNurse(nurseId);
                break;
        }
    });
}

// ==================== INICIALIZACIÓN ====================

addEventListener('load', () => {
    console.log('🚀 Iniciando Panel de Isla - Enfermeros...');
    
    // Inicializar event listeners
    initializeEventListeners();
    
    // Cargar datos iniciales
    loadNurses();
    
    console.log('✅ Panel de Enfermeros inicializado correctamente');
});