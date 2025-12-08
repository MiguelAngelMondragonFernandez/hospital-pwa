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
    window.generateQR = generateQR;
    window.viewPatientInfo = viewPatientInfo;
}

export async function loadBeds() {
    try {
        const response = await fetch(url + "/bed/all");
        
        if (response.ok) {
            const data = await response.json();
            const beds = data.data || data;
            console.log('Camas cargadas:', beds);
            
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

function updateBedStatusClass(selectElement) {
    const newStatus = selectElement.value;
    const newClass = getStatusClass(newStatus);
    
    selectElement.className = 'px-3 py-1 rounded text-xs font-semibold border-none cursor-pointer';
    selectElement.className += ' ' + newClass;
}

function renderBedsTable(beds) {
    bedsTableBody.innerHTML = '';
    
    beds.forEach(bed => {
        const statusClass = getStatusClass(bed.status);
        const statusText = getStatusText(bed.status);
        
        // Obtener nombre del paciente
        let patientName = 'Sin paciente';
        if (bed.paciente) {
            patientName = `${bed.paciente.nombre || ''} ${bed.paciente.apellidos || ''}`.trim();
        }
        
        // Verificar si tiene QR generado
        const hasQR = bed.qrUrl && bed.qrUrl.length > 0;
        
        // Verificar si tiene paciente para deshabilitar opción "libre"
        const hasPatient = bed.paciente !== null && bed.paciente !== undefined;
        const disableLibreOption = hasPatient ? 'disabled' : '';
        const libreOptionText = hasPatient ? 'Disponible (libere al paciente primero)' : 'Disponible';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-4 font-medium">#${bed.id}</td>
            <td class="p-4">${bed.nombre || 'Cama ' + bed.id}</td>
            <td class="p-4">
                <select 
                    id="bed-status-${bed.id}"
                    onchange="updateBedStatusClass(this); changeBedStatus(${bed.id}, this.value)" 
                    class="px-3 py-1 rounded text-xs font-semibold ${statusClass} border-none cursor-pointer">
                    <option value="libre" ${bed.status === 'libre' ? 'selected' : ''} ${disableLibreOption}>
                        ${libreOptionText}
                    </option>
                    <option value="ocupada" ${bed.status === 'ocupada' ? 'selected' : ''}>Ocupada</option>
                    <option value="mantenimiento" ${bed.status === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                    <option value="limpieza" ${bed.status === 'limpieza' ? 'selected' : ''}>En limpieza</option>     
                </select>
            </td>
            <td class="p-4">
                ${bed.paciente ? `
                    <button onclick="viewPatientInfo(${bed.id})" 
                        class="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ${patientName}
                    </button>
                ` : `
                    <span class="text-gray-400 italic">${patientName}</span>
                `}
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                    ${hasQR ? `
                        <button onclick="window.open('${bed.qrUrl}', '_blank')" 
                            class="text-blue-600 hover:text-blue-800 font-medium" 
                            title="Ver QR">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </button>
                    ` : `
                        <button onclick="generateQR(${bed.id})" 
                            class="text-green-600 hover:text-green-800 font-medium" 
                            title="Generar QR">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    `}
                    <button onclick="editBed(${bed.id})" 
                        class="text-indigo-600 hover:text-indigo-800 font-medium">
                        Editar
                    </button>
                    <button onclick="deleteBed(${bed.id})" 
                        class="text-red-600 hover:text-red-800 font-medium">
                        Eliminar
                    </button>
                </div>
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
    
    if (id) {
        bedData.id = parseInt(id);
    }
    
    try {
        const endpoint = id ? '/bed/update' : '/bed/save';
        const method = id ? 'PUT' : 'POST';
        
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
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess(`Estatus cambiado a: ${getStatusText(newStatus)}`);
        } else {
            // Mostrar el mensaje de error específico del backend
            showError(data.message || 'Error al cambiar estatus');
            
            // Recargar la tabla para restaurar el valor anterior
            loadBeds();
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cambiar estatus');
        loadBeds();
    }
}

// Función para generar QR
async function generateQR(bedId) {
    if (!confirm('¿Desea generar el código QR para esta cama?')) return;
    
    try {
        const response = await fetch(url + `/bed/${bedId}/generar-qr`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            showSuccess('Código QR generado exitosamente');
            
            // Abrir el QR en una nueva pestaña
            if (data.data && data.data.qrUrl) {
                window.open(data.data.qrUrl, '_blank');
            }
            
            loadBeds(); // Recargar para mostrar el botón de ver QR
        } else {
            const error = await response.json();
            showError(error.message || 'Error al generar QR');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al generar QR');
    }
}

// Función para ver información del paciente
async function viewPatientInfo(bedId) {
    try {
        const response = await fetch(url + `/bed/${bedId}/paciente`);
        
        if (response.ok) {
            const data = await response.json();
            const info = data.data;
            
            // Crear modal personalizado para mostrar info del paciente
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm';
            modal.innerHTML = `
                <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-800">
                            Información del Paciente
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="bg-indigo-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">Cama</p>
                            <p class="text-lg font-bold text-indigo-700">#${info.bedId}</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600 mb-1">Nombre Completo</p>
                                <p class="font-semibold text-gray-800">${info.patientName}</p>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600 mb-1">Tipo de Sangre</p>
                                <p class="font-semibold text-red-600">${info.bloodType || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-2">Padecimientos</p>
                            <p class="text-gray-800">${info.ailments || 'Sin registrar'}</p>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-600 mb-2">Descripción</p>
                            <p class="text-gray-800">${info.description || 'Sin descripción'}</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600 mb-1">Estado de la Cama</p>
                                <span class="inline-block px-3 py-1 rounded text-xs font-semibold ${getStatusClass(info.bedStatus)}">
                                    ${getStatusText(info.bedStatus)}
                                </span>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <p class="text-sm text-gray-600 mb-1">Fecha de Ingreso</p>
                                <p class="font-semibold text-gray-800">
                                    ${info.admissionDate ? new Date(info.admissionDate).toLocaleString('es-MX') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        <button onclick="this.closest('.fixed').remove()" 
                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } else {
            const error = await response.json();
            showError(error.message || 'No se pudo obtener información del paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al obtener información');
    }
}