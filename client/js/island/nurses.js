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
let assigningNurse = null;
const assignModal = document.getElementById('assign-modal');
const btnCloseAssignModal = document.getElementById('btn-close-assign-modal');
const btnSaveAssignment = document.getElementById('btn-save-assignment');
const bedsList = document.getElementById('beds-list');


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
                    <button data-action="assign" data-nurse-id="${nurse.id}" data-username="${nurse.username}"
                        class="text-green-600 hover:text-green-800 font-medium">
                        Asignar
                    </button>
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

// ==================== MODAL ASIGNACIÓN ====================

function openAssignModal(id, username) {
    assigningNurse = id;
    document.getElementById('assign-nurse-name').textContent = username;
    assignModal.classList.remove('hidden');
    loadAvailableBeds();
}

function closeAssignModal() {
    assigningNurse = null;
    assignModal.classList.add('hidden');
    bedsList.innerHTML = '<p class="text-center text-gray-500 text-sm">Cargando camas...</p>';
}

async function loadAvailableBeds() {
    try {
        const [bedsResponse, assignmentsResponse] = await Promise.all([
            fetch(url + "/bed/all"),
            fetch(url + `/nurse/${assigningNurse}/assignments/active`)
        ]);

        if (bedsResponse.ok) {
            const bedsData = await bedsResponse.json();
            const allBeds = bedsData.data || bedsData;

            let assignedBedIds = [];
            if (assignmentsResponse.ok) {
                const assignmentsData = await assignmentsResponse.json();
                const assignments = assignmentsData.data || assignmentsData;
                assignedBedIds = assignments.map(a => a.bed.id);
            }

            // Filtrar camas:
            // 1. Status 'libre' (o lo que defina la regla de negocio)
            // 2. NO asignada ya a este enfermero
            const availableBeds = allBeds.filter(bed => {
                const isFree = bed.status === 'libre';
                const isNotAssignedToThisNurse = !assignedBedIds.includes(bed.id);
                return isFree && isNotAssignedToThisNurse;
            });

            renderBedsList(availableBeds);
        } else {
            bedsList.innerHTML = '<p class="text-red-500 text-center text-sm">Error al cargar camas</p>';
        }
    } catch (error) {
        console.error("Error loading beds:", error);
        bedsList.innerHTML = '<p class="text-red-500 text-center text-sm">Error de conexión</p>';
    }
}

function renderBedsList(beds) {
    if (!beds || beds.length === 0) {
        bedsList.innerHTML = '<p class="text-gray-500 text-center text-sm">No hay camas disponibles para asignar</p>';
        return;
    }

    bedsList.innerHTML = '';
    beds.forEach(bed => {
        const div = document.createElement('div');
        div.className = 'flex items-center p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors';
        div.innerHTML = `
            <input type="checkbox" id="bed-${bed.id}" value="${bed.id}" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
            <label for="bed-${bed.id}" class="ml-3 text-sm text-gray-700 cursor-pointer flex-1">
                <span class="font-medium">Cama #${bed.id}</span>
                <span class="text-gray-400 text-xs ml-2">(${bed.status})</span>
            </label>
        `;
        bedsList.appendChild(div);
    });
}

async function saveAssignment() {
    if (!assigningNurse) return;

    const selectedBeds = Array.from(bedsList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(input => input.value);

    if (selectedBeds.length === 0) {
        showError('Seleccione al menos una cama');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Procesar asignaciones secuencialmente
    for (const bedId of selectedBeds) {
        try {
            const response = await fetch(url + `/nurse/${assigningNurse}/assign-bed/${bedId}`, {
                method: 'POST'
            });

            if (response.ok) {
                successCount++;
            } else {
                errorCount++;
                const errorData = await response.json();
                console.warn(`Error asignando cama ${bedId}:`, errorData.message);
                // Si solo es una cama, mostrar el error específico
                if (selectedBeds.length === 1) {
                    showError(errorData.message || 'Error al asignar cama');
                    return; // Salir si es error único para que el usuario lo vea
                }
            }
        } catch (error) {
            console.error('Error assigning bed:', bedId, error);
            errorCount++;
        }
    }

    if (successCount > 0) {
        showSuccess(`Asignadas ${successCount} camas correctamente`);
        if (errorCount > 0) showError(`Fallaron ${errorCount} asignaciones (Ver consola para detalles)`);
        closeAssignModal();
    } else if (errorCount > 0 && selectedBeds.length > 1) {
        // Si fallaron todas y eran varias
        showError('No se pudo realizar ninguna asignación');
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

    // Modal de asignación
    btnCloseAssignModal.addEventListener('click', closeAssignModal);
    btnSaveAssignment.addEventListener('click', saveAssignment);

    // Event delegation para la tabla
    nursesTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const nurseId = parseInt(button.dataset.nurseId);

        switch (action) {
            case 'edit':
                const username = button.dataset.username;
                openNurseModal(nurseId, username);
                break;
            case 'assign':
                const assignUsername = button.dataset.username;
                openAssignModal(nurseId, assignUsername);
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