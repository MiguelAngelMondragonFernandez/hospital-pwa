import { url } from '../config.js';
import { showSuccess, showError, logout } from './utils.js';

// DOM Elements - Tabla Principal
const nursesTableBody = document.getElementById('nurses-table-body');
const noNursesMsg = document.getElementById('no-nurses-msg');
const btnAddNurse = document.getElementById('btn-add-nurse');
const btnRefreshNurses = document.getElementById('btn-refresh-nurses');
const btnLogout = document.getElementById('btn-logout');

// DOM Elements - Modal Enfermero (Crear/Editar)
const nurseModal = document.getElementById('nurse-modal');
const btnCloseNurseModal = document.getElementById('btn-close-nurse-modal');
const formNurse = document.getElementById('form-nurse');

// DOM Elements - Modal Asignación
const assignModal = document.getElementById('assign-modal');
const btnCloseAssignModal = document.getElementById('btn-close-assign-modal');
const btnSaveAssignment = document.getElementById('btn-save-assignment');
const bedsListContainer = document.getElementById('beds-list');
const assignNurseName = document.getElementById('assign-nurse-name');

let currentNurseIdForAssignment = null;
let editingNurseId = null;

// ==================== CARGAR ENFERMEROS ====================

async function loadNurses() {
    try {
        // Ajusta el endpoint según tu NurseController
        const response = await fetch(url + "/nurse/all"); 
        
        if (response.ok) {
            const data = await response.json();
            const nurses = data.data || data; // Ajuste por si viene envuelto en 'data'
            
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
                        class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Asignar Camas
                    </button>
                </div>
            </td>
        `;
        nursesTableBody.appendChild(row);
    });
}

// ==================== GESTIÓN DE MODAL ASIGNACIÓN (CORREGIDO) ====================

async function openAssignModal(nurseId, nurseName) {
    currentNurseIdForAssignment = nurseId;
    assignNurseName.textContent = nurseName;
    bedsListContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Cargando camas...</p>';
    
    assignModal.classList.remove('hidden');

    try {
        // 1. Obtener todas las camas
        const response = await fetch(url + "/bed/all");
        if (response.ok) {
            const data = await response.json();
            const allBeds = data.data || data;

            // 2. FILTRO CORREGIDO: Mostrar Libres Y Ocupadas
            // Tu error estaba aquí antes, filtrando solo 'libre'
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
        // 1. Buscamos si hay un enfermero con turno abierto en esta cama
        // Verificamos si existe la lista y buscamos una asignación con shiftOpen === true
        const activeAssignment = bed.nurseAssignments && bed.nurseAssignments.find(a => a.shiftOpen === true);
        
        // 2. Determinamos qué texto mostrar
        let statusText = '';
        let statusClass = '';
        let isDisabled = ''; // Opcional: si quieres bloquear camas ya asignadas

        if (activeAssignment) {
            // CASO: Ya tiene enfermero
            const nurseName = activeAssignment.nurse ? activeAssignment.nurse.username : 'Otro enfermero';
            statusText = `⚠ Asignada a: ${nurseName}`;
            statusClass = 'text-orange-600 font-bold'; 
        } else {
            // CASO: Nadie la está atendiendo
            statusText = '✅ Sin Asignar';
            statusClass = 'text-green-600 font-medium';
        }

        // 3. Información extra (opcional: estado físico de la cama)
        const bedPhysicalStatus = bed.status === 'ocupada' ? 'Ocupada' : 'Libre';

        const item = document.createElement('div');
        item.className = "flex flex-col p-3 border-b border-gray-100 hover:bg-gray-50 rounded transition";
        
        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <input type="checkbox" id="bed-${bed.id}" value="${bed.id}" ${isDisabled}
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

    // Obtener todos los checkboxes seleccionados
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

    // Iterar y asignar cada cama seleccionada
    // Nota: Tu controlador tiene: POST /api/nurse/{nurseId}/assign-bed/{bedId}
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

// ==================== CREAR ENFERMERO (CRUD Básico) ====================

async function saveNurse(e) {
    e.preventDefault();
    
    const username = document.getElementById('nurse-username').value;
    const password = document.getElementById('nurse-password').value;
    
    // Construir objeto usuario
    const nurseData = {
        username: username,
        password: password,
        role: "NURSE" // Asegúrate de mandar el rol si tu backend lo requiere
    };

    try {
        const response = await fetch(url + "/nurse/save", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nurseData)
        });

        if (response.ok) {
            showSuccess("Enfermero creado exitosamente");
            closeNurseModal();
            loadNurses();
        } else {
            const data = await response.json();
            showError(data.message || "Error al crear enfermero");
        }
    } catch (error) {
        console.error(error);
        showError("Error de conexión");
    }
}

function openNurseModal() {
    nurseModal.classList.remove('hidden');
}

function closeNurseModal() {
    nurseModal.classList.add('hidden');
    formNurse.reset();
}

// ==================== EVENT LISTENERS ====================

function initializeEventListeners() {
    // Botones principales
    btnRefreshNurses.addEventListener('click', loadNurses);
    btnAddNurse.addEventListener('click', openNurseModal);
    btnLogout.addEventListener('click', logout);

    // Modal Crear Enfermero
    btnCloseNurseModal.addEventListener('click', closeNurseModal);
    formNurse.addEventListener('submit', saveNurse);

    // Modal Asignar
    btnCloseAssignModal.addEventListener('click', closeAssignModal);
    btnSaveAssignment.addEventListener('click', saveAssignment);

    // Delegación de eventos en tabla
    nursesTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.nurseId;

        if (action === 'assign') {
            const name = button.dataset.nurseName;
            openAssignModal(id, name);
        }
    });
}

// ==================== INICIALIZACIÓN ====================

addEventListener('load', () => {
    console.log('🚀 Iniciando Panel de Enfermeros...');
    initializeEventListeners();
    loadNurses();
});