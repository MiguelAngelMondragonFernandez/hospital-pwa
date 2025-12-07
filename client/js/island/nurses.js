// ==================== NURSES ====================

import { url } from '../config.js';
import { showSuccess, showError } from './utils.js';

// DOM Elements
const nursesTableBody = document.getElementById('nurses-table-body');
const noNursesMsg = document.getElementById('no-nurses-msg');
const btnAddNurse = document.getElementById('btn-add-nurse');
const btnRefreshNurses = document.getElementById('btn-refresh-nurses');
const nurseModal = document.getElementById('nurse-modal');
const btnCloseNurseModal = document.getElementById('btn-close-nurse-modal');
const formNurse = document.getElementById('form-nurse');

let editingNurse = null;

export function initializeNurses() {
    btnAddNurse.addEventListener('click', () => openNurseModal());
    btnRefreshNurses.addEventListener('click', loadNurses);
    btnCloseNurseModal.addEventListener('click', closeNurseModal);
    formNurse.addEventListener('submit', saveNurse);
    
    // Expose functions to window for inline onclick handlers
    window.editNurse = (id, username) => openNurseModal(id, username);
    window.deleteNurse = deleteNurse;
}

export async function loadNurses() {
    try {
        const response = await fetch(url + "/nurse/all");
        
        if (response.ok) {
            const data = await response.json();
            const nurses = data.data || data;

            if (nurses && nurses.length > 0) {
                renderNursesTable(nurses);
                noNursesMsg.style.display = 'none';
            } else {
                nursesTableBody.innerHTML = '';
                noNursesMsg.style.display = 'block';
            }
        } else {
            nursesTableBody.innerHTML = '';
            noNursesMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading nurses:", error);
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
                <button onclick="editNurse(${nurse.id}, '${nurse.username}')" 
                    class="text-indigo-600 hover:text-indigo-800 font-medium mr-3">
                    Editar
                </button>
                <button onclick="deleteNurse(${nurse.id})" 
                    class="text-red-600 hover:text-red-800 font-medium">
                    Eliminar
                </button>
            </td>
        `;
        nursesTableBody.appendChild(row);
    });
}

function openNurseModal(id = null, username = '') {
    editingNurse = id;
    document.getElementById('nurse-modal-title').textContent = id ? 'Editar Enfermero' : 'Agregar Enfermero';
    document.getElementById('nurse-id').value = id || '';
    document.getElementById('nurse-username').value = username;
    document.getElementById('nurse-password').value = '';
    document.getElementById('nurse-password').required = !id;
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
            showError('Error al eliminar enfermero');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar enfermero');
    }
}