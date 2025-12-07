import { url } from '../config.js';
import { showSuccess, showError } from './utils.js';

const bedsTableBody = document.getElementById('beds-table-body');
const noBedsMsg = document.getElementById('no-beds-msg');
const btnAddBed = document.getElementById('btn-add-bed');
const btnRefreshBeds = document.getElementById('btn-refresh-beds');
const bedModal = document.getElementById('bed-modal');
const btnCloseBedModal = document.getElementById('btn-close-bed-modal');
const formBed = document.getElementById('form-bed');

let editingBed = null;

export function initializeBeds() {
    btnAddBed.addEventListener('click', () => openBedModal());
    btnRefreshBeds.addEventListener('click', loadBeds);
    btnCloseBedModal.addEventListener('click', closeBedModal);
    formBed.addEventListener('submit', saveBed);
    
    window.editBed = editBed;
    window.deleteBed = deleteBed;
    window.changeBedStatus = changeBedStatus;
    window.updateBedStatusClass = updateBedStatusClass;
}

export async function loadBeds() {
    try {
        const response = await fetch(url + "/bed/all");
        
        if (response.ok) {
            const data = await response.json();
            const beds = data.data || data;
            console.log('Camas cargadas:', data);
            
            if (beds && beds.length > 0) {
                renderBedsTable(beds);
                noBedsMsg.style.display = 'none';
            } else {
                bedsTableBody.innerHTML = '';
                noBedsMsg.style.display = 'block';
            }
        } else {
            bedsTableBody.innerHTML = '';
            noBedsMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading beds:", error);
        showError('Error al cargar camas');
        bedsTableBody.innerHTML = '';
        noBedsMsg.style.display = 'block';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'libre':
            return 'bg-green-100 text-green-800';
        case 'ocupada':
            return 'bg-red-100 text-red-800';
        case 'mantenimiento':
            return 'bg-blue-100 text-blue-800';
        case 'limpieza':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'libre':
            return 'Disponible';
        case 'ocupada':
            return 'Ocupada';
        case 'mantenimiento':
            return 'Mantenimiento';
        case 'limpieza':
            return 'En limpieza';
        default:
            return 'Desconocido';
    }
}

// Función para actualizar las clases CSS del selector cuando cambia
function updateBedStatusClass(selectElement) {
    const newStatus = selectElement.value;
    const newClass = getStatusClass(newStatus);
    
    // Remover todas las clases de color posibles
    selectElement.className = 'px-3 py-1 rounded text-xs font-semibold border-none cursor-pointer';
    
    // Agregar las nuevas clases según el estatus
    selectElement.className += ' ' + newClass;
}

function renderBedsTable(beds) {
    bedsTableBody.innerHTML = '';
    
    beds.forEach(bed => {
        const statusClass = getStatusClass(bed.status);
        const statusText = getStatusText(bed.status);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-4 font-medium">#${bed.id}</td>
            <td class="p-4">${bed.nombre || 'N/A'}</td>
            <td class="p-4">
                <select 
                    id="bed-status-${bed.id}"
                    onchange="updateBedStatusClass(this); changeBedStatus(${bed.id}, this.value)" 
                    class="px-3 py-1 rounded text-xs font-semibold ${statusClass} border-none cursor-pointer">
                    <option value="libre" ${bed.status === 'libre' ? 'selected' : ''}>Disponible</option>
                    <option value="ocupada" ${bed.status === 'ocupada' ? 'selected' : ''}>Ocupada</option>
                    <option value="mantenimiento" ${bed.status === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                    <option value="limpieza" ${bed.status === 'limpieza' ? 'selected' : ''}>En limpieza</option>     
                </select>
            </td>
            <td class="p-4">${bed.pacienteNombre || bed.patientName || 'SIn paciente'}</td>
            <td class="p-4 text-right">
                <button onclick="editBed(${bed.id})" 
                    class="text-indigo-600 hover:text-indigo-800 font-medium mr-3">
                    Editar
                </button>
                <button onclick="deleteBed(${bed.id})" 
                    class="text-red-600 hover:text-red-800 font-medium">
                    Eliminar
                </button>
            </td>
        `;
        bedsTableBody.appendChild(row);
    });
}

function openBedModal(bed = null) {
    editingBed = bed ? bed.id : null;
    document.getElementById('bed-modal-title').textContent = bed ? 'Editar Cama' : 'Agregar Cama';
    
    document.getElementById('bed-id').value = bed?.id || '';
    document.getElementById('bed-number').value = bed?.nombre || '';
    
    bedModal.classList.remove('hidden');
}

function closeBedModal() {
    editingBed = null;
    bedModal.classList.add('hidden');
    formBed.reset();
}

async function saveBed(e) {
    e.preventDefault();
    
    const id = document.getElementById('bed-id').value;
    
    const bedData = {
        nombre: document.getElementById('bed-number').value,
    };
    
    // Si es edición, agregar el ID
    if (id) {
        bedData.id = parseInt(id);
    }
    
    try {
        const endpoint = id ? '/bed/update' : '/bed/save';
        const method = id ? 'PUT' : 'POST';
        
        console.log('Enviando datos:', bedData);
        console.log('Endpoint:', url + endpoint);
        
        const response = await fetch(url + endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bedData)
        });
        
        if (response.ok) {
            showSuccess(id ? 'Cama actualizada exitosamente' : 'Cama registrada exitosamente');
            closeBedModal();
            loadBeds();
        } else {
            const error = await response.json();
            console.error('Error del servidor:', error);
            showError(error.message || 'Error al guardar cama');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al guardar cama');
    }
}

async function deleteBed(id) {
    if (!confirm('¿Está seguro de eliminar esta cama?')) return;
    
    try {
        const response = await fetch(url + `/bed/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Cama eliminada exitosamente');
            loadBeds();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al eliminar cama');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar cama');
    }
}

async function editBed(id) {
    try {
        const response = await fetch(url + `/bed/${id}`);
        
        if (response.ok) {
            const data = await response.json();
            const bed = data.data || data;
            console.log('Cama cargada:', bed);
            openBedModal(bed);
        } else {
            showError('Error al cargar datos de la cama');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cargar cama');
    }
}

async function changeBedStatus(bedId, newStatus) {
    try {
        const response = await fetch(url + `/bed/${bedId}/change-status/${newStatus}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showSuccess(`Estatus cambiado a: ${getStatusText(newStatus)}`);
            // No recargar toda la tabla, el color ya se actualizó con updateBedStatusClass
        } else {
            const error = await response.json();
            showError(error.message || 'Error al cambiar estatus');
            loadBeds(); // Recargar para restaurar el valor anterior
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cambiar estatus');
        loadBeds(); // Recargar para restaurar el valor anterior
    }
}