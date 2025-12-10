import { url } from '../config.js';
import { showSuccess, showError, logout } from './utils.js';
import { writeData } from '../idb-helper.js';

// DOM Elements - Tabla Principal
const nursesTableBody = document.getElementById('nurses-table-body');
const noNursesMsg = document.getElementById('no-nurses-msg');
const btnAddNurse = document.getElementById('btn-add-nurse');
const btnRefreshNurses = document.getElementById('btn-refresh-nurses');
const btnLogout = document.getElementById('btn-logout');

// DOM Elements - Modal Enfermero
const nurseModal = document.getElementById('nurse-modal');
const nurseModalTitle = document.getElementById('nurse-modal-title');
const btnCloseNurseModal = document.getElementById('btn-close-nurse-modal');
const formNurse = document.getElementById('form-nurse');
const passwordInput = document.getElementById('nurse-password');
const passwordHint = document.getElementById('password-hint');

// DOM Elements - Modal Asignación
const assignModal = document.getElementById('assign-modal');
const btnCloseAssignModal = document.getElementById('btn-close-assign-modal');
const btnSaveAssignment = document.getElementById('btn-save-assignment');
const bedsListContainer = document.getElementById('beds-list');
const assignNurseName = document.getElementById('assign-nurse-name');

let currentNurseIdForAssignment = null;

// ==================== CARGAR ENFERMEROS ====================

async function loadNurses() {
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
        showError('Error al cargar enfermeros');
    }
}

function renderNursesTable(nurses) {
    nursesTableBody.innerHTML = '';

    nurses.forEach(nurse => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-4 font-medium">#${nurse.id}</td>
            <td class="p-4">
                <span class="font-medium text-gray-900">${nurse.username}</span>
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                    <button data-action="assign" data-nurse-id="${nurse.id}" data-nurse-name="${nurse.username}"
                        class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1"
                        title="Asignar Camas">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Asignar
                    </button>

                    <button data-action="edit" data-nurse-id="${nurse.id}" data-nurse-name="${nurse.username}"
                        class="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1"
                        title="Editar Enfermero">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Editar
                    </button>

                    <button data-action="delete" data-nurse-id="${nurse.id}"
                        class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1"
                        title="Eliminar Enfermero">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        nursesTableBody.appendChild(row);
    });
}

// ==================== CRUD ENFERMERO (Crear / Editar / Eliminar) ====================

// Abrir modal para crear
function openCreateModal() {
    document.getElementById('nurse-id').value = '';
    document.getElementById('nurse-username').value = '';
    document.getElementById('nurse-password').value = '';

    nurseModalTitle.textContent = 'Agregar Enfermero';
    passwordInput.required = true;
    passwordHint.textContent = '';

    nurseModal.classList.remove('hidden');
}

// Abrir modal para editar
function openEditModal(id, username) {
    document.getElementById('nurse-id').value = id;
    document.getElementById('nurse-username').value = username;
    document.getElementById('nurse-password').value = ''; // Limpiamos password por seguridad

    nurseModalTitle.textContent = 'Editar Enfermero';

    // En editar, la contraseña suele ser opcional, pero depende de tu backend
    // Si tu backend requiere contraseña siempre, déjalo required.
    // Si no, puedes quitar el required:
    // passwordInput.required = false; 
    // passwordHint.textContent = '(Dejar en blanco para no cambiar)';

    nurseModal.classList.remove('hidden');
}

// Guardar (Crear o Actualizar)
async function saveNurse(e) {
    e.preventDefault();

    const id = document.getElementById('nurse-id').value;
    const username = document.getElementById('nurse-username').value;
    const password = document.getElementById('nurse-password').value;

    const nurseData = {
        username: username,
        password: password,
        role: "NURSE"
    };

    // Determinamos si es Update (PUT) o Create (POST)
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? '/nurse/update' : '/nurse/save';
    const fullUrl = url + endpoint;

    // Función auxiliar para guardar en Offline
    async function handleOfflineSave() {
        try {
            const syncData = {
                url: fullUrl,
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: nurseData
            };

            await writeData('sync-posts', syncData);

            // Registrar Tarea de Sincronización
            const swRegistration = await navigator.serviceWorker.ready;
            if (swRegistration.sync) {
                await swRegistration.sync.register('sync-nurses');
                showSuccess('Guardado MODO OFFLINE. Se sincronizará al volver la conexión.');
                closeNurseModal();
            } else {
                showError('Tu navegador no soporta Background Sync, pero se guardó localmente.');
            }
        } catch (err) {
            console.error("Error saving offline:", err);
            showError("Error al guardar en modo offline");
        }
    }

    // 1. CHEQUEO OFFLINE EXPLÍCITO
    if (!navigator.onLine) {
        await handleOfflineSave();
        return;
    }

    // 2. INTENTO ONLINE
    try {
        const response = await fetch(fullUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nurseData)
        });

        if (response.ok) {
            showSuccess(id ? "Enfermero actualizado" : "Enfermero creado exitosamente");
            closeNurseModal();
            loadNurses();
        } else {
            // Si el servidor responde 503 (nuestro SW offline) o falla
            if (response.status === 503) {
                console.warn("Recibido 503 (Offline SW), intentando guardar offline...");
                await handleOfflineSave();
            } else {
                const data = await response.json();
                showError(data.message || "Error al guardar enfermero");
            }
        }
    } catch (error) {
        console.error("Error de red al guardar:", error);
        // Si falla el fetch por error de red
        await handleOfflineSave();
    }
}

// Eliminar
async function deleteNurse(id) {
    if (!confirm('¿Está seguro de eliminar a este enfermero? Esta acción no se puede deshacer.')) return;

    try {
        const response = await fetch(url + `/nurse/${id}`, { // Ajusta el endpoint de delete
            method: 'DELETE'
        });

        if (response.ok) {
            showSuccess('Enfermero eliminado exitosamente');
            loadNurses();
        } else {
            const data = await response.json();
            showError(data.message || 'Error al eliminar enfermero');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar');
    }
}

function closeNurseModal() {
    nurseModal.classList.add('hidden');
    formNurse.reset();
}

// ==================== GESTIÓN DE MODAL ASIGNACIÓN ====================

async function openAssignModal(nurseId, nurseName) {
    currentNurseIdForAssignment = nurseId;
    assignNurseName.textContent = nurseName;
    bedsListContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Cargando camas...</p>';

    assignModal.classList.remove('hidden');

    try {
        const response = await fetch(url + "/bed/all");
        if (response.ok) {
            const data = await response.json();
            const allBeds = data.data || data;

            // Filtro para mostrar Libres y Ocupadas
            const bedsToShow = allBeds.filter(bed =>
                bed.status === 'libre' || bed.status === 'ocupada'
            );

            renderBedsList(bedsToShow);
        } else {
            bedsListContainer.innerHTML = '<p class="text-center text-red-500">Error al cargar camas</p>';
        }
    } catch (error) {
        console.error("Error:", error);
        bedsListContainer.innerHTML = '<p class="text-center text-red-500">Error de conexión</p>';
    }
}

function renderBedsList(beds) {
    bedsListContainer.innerHTML = '';

    if (beds.length === 0) {
        bedsListContainer.innerHTML = '<p class="text-center text-gray-500">No hay camas disponibles.</p>';
        return;
    }

    beds.forEach(bed => {
        const activeAssignment = bed.nurseAssignments && bed.nurseAssignments.find(a => a.shiftOpen === true);

        let statusText = '';
        let statusClass = '';

        if (activeAssignment) {
            const nurseName = activeAssignment.nurse ? activeAssignment.nurse.username : 'Otro enfermero';
            statusText = `⚠ Asignada a: ${nurseName}`;
            statusClass = 'text-orange-600 font-bold';
        } else {
            statusText = '✅ Sin Asignar';
            statusClass = 'text-green-600 font-medium';
        }

        const bedPhysicalStatus = bed.status === 'ocupada' ? 'Ocupada' : 'Libre';

        const item = document.createElement('div');
        item.className = "flex flex-col p-3 border-b border-gray-100 hover:bg-gray-50 rounded transition";

        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input type="checkbox" id="bed-${bed.id}" value="${bed.id}"
                        class="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer mr-3">
                    <label for="bed-${bed.id}" class="cursor-pointer select-none">
                        <span class="text-gray-800 font-medium">Cama #${bed.nombre || bed.id}</span>
                        <span class="text-xs text-gray-400 ml-2">(${bedPhysicalStatus})</span>
                    </label>
                </div>
                <div class="text-xs ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
        bedsListContainer.appendChild(item);
    });
}

async function saveAssignment() {
    if (!currentNurseIdForAssignment) return;

    const selectedCheckboxes = bedsListContainer.querySelectorAll('input[type="checkbox"]:checked');
    const selectedBedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedBedIds.length === 0) {
        alert("Por favor seleccione al menos una cama.");
        return;
    }

    btnSaveAssignment.disabled = true;
    btnSaveAssignment.textContent = "Guardando...";

    let successCount = 0;
    let errors = [];

    for (const bedId of selectedBedIds) {
        try {
            const response = await fetch(`${url}/nurse/${currentNurseIdForAssignment}/assign-bed/${bedId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                successCount++;
            } else {
                const err = await response.json();
                errors.push(`Cama ${bedId}: ${err.message || 'Error'}`);
            }
        } catch (error) {
            errors.push(`Cama ${bedId}: Error de conexión`);
        }
    }

    btnSaveAssignment.disabled = false;
    btnSaveAssignment.textContent = "Asignar";

    if (successCount > 0) {
        showSuccess(`Se asignaron ${successCount} camas correctamente.`);
        closeAssignModal();
    }

    if (errors.length > 0) {
        alert("Hubo errores en algunas asignaciones:\n" + errors.join("\n"));
    }
}

function closeAssignModal() {
    assignModal.classList.add('hidden');
    currentNurseIdForAssignment = null;
    bedsListContainer.innerHTML = '';
}

// ==================== EVENT LISTENERS ====================

function initializeEventListeners() {
    btnRefreshNurses.addEventListener('click', loadNurses);
    btnAddNurse.addEventListener('click', openCreateModal); // Usa openCreateModal ahora
    btnLogout.addEventListener('click', logout);

    btnCloseNurseModal.addEventListener('click', closeNurseModal);
    formNurse.addEventListener('submit', saveNurse);

    btnCloseAssignModal.addEventListener('click', closeAssignModal);
    btnSaveAssignment.addEventListener('click', saveAssignment);

    nursesTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.nurseId;

        if (action === 'assign') {
            const name = button.dataset.nurseName;
            openAssignModal(id, name);
        } else if (action === 'edit') {
            const name = button.dataset.nurseName;
            openEditModal(id, name);
        } else if (action === 'delete') {
            deleteNurse(id);
        }
    });
}

// ==================== INICIALIZACIÓN ====================

addEventListener('load', () => {
    console.log('🚀 Iniciando Panel de Enfermeros...');
    initializeEventListeners();
    loadNurses();
});