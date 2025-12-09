import { url } from '../config.js';
import { showSuccess, showError, logout } from './utils.js';

// DOM Elements
const bedsTableBody = document.getElementById('beds-table-body');
const noBedsMsg = document.getElementById('no-beds-msg');
const btnAddBed = document.getElementById('btn-add-bed');
const btnRefreshBeds = document.getElementById('btn-refresh-beds');
const btnLogout = document.getElementById('btn-logout');
const bedModal = document.getElementById('bed-modal');
const formBed = document.getElementById('form-bed');

let editingBed = null;

// ==================== CARGAR CAMAS ====================

async function loadBeds() {
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
            console.error('Error en respuesta:', response.status);
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

function renderBedsTable(beds) {
    bedsTableBody.innerHTML = '';
    
    beds.forEach(bed => {
        const statusClass = getStatusClass(bed.status);
        
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
                    data-action="change-status" 
                    data-bed-id="${bed.id}"
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
                    <button data-action="view-patient" data-bed-id="${bed.id}"
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
                        <button data-action="view-qr" data-qr-url="${bed.qrUrl}" data-bed-id="${bed.id}"
                            class="text-blue-600 hover:text-blue-800 font-medium" 
                            title="Ver QR">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </button>
                    ` : `
                        <button data-action="generate-qr" data-bed-id="${bed.id}"
                            class="text-green-600 hover:text-green-800 font-medium" 
                            title="Generar QR">
                            Generar QR
                        </button>
                    `}
                    <button data-action="delete" data-bed-id="${bed.id}"
                        class="text-red-600 hover:text-red-800 font-medium">
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        bedsTableBody.appendChild(row);
    });
}

// ==================== UTILIDADES ====================

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
    
    selectElement.className = 'px-3 py-1 rounded text-xs font-semibold border-none cursor-pointer ' + newClass;
}

// ==================== AGREGAR CAMA DIRECTA ====================

async function addBedDirectly() {
    const confirmAdd = confirm('¿Desea agregar una nueva cama?');
    
    if (!confirmAdd) return;
    
    try {
        // Obtener el siguiente número de cama disponible
        const response = await fetch(url + "/bed/all");
        let nextNumber = 1;
        
        if (response.ok) {
            const data = await response.json();
            const beds = data.data || data;
            
            if (beds && beds.length > 0) {
                // Encontrar el número más alto y sumar 1
                const maxId = Math.max(...beds.map(bed => bed.id || 0));
                nextNumber = maxId + 1;
            }
        }
        
        const bedData = {
            nombre: `Cama ${nextNumber}`
        };
        
        const saveResponse = await fetch(url + '/bed/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bedData)
        });
        
        if (saveResponse.ok) {
            showSuccess('Cama agregada exitosamente');
            loadBeds();
        } else {
            const error = await saveResponse.json();
            showError(error.message || 'Error al agregar cama');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al agregar cama');
    }
}

// ==================== MODAL CAMA (SOLO PARA EDITAR) ====================


// ==================== CRUD CAMAS ====================

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


async function changeBedStatus(bedId, newStatus, selectElement) {
    try {
        const response = await fetch(url + `/bed/${bedId}/change-status/${newStatus}`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess(`Estatus cambiado a: ${getStatusText(newStatus)}`);
            updateBedStatusClass(selectElement);
        } else {
            showError(data.message || 'Error al cambiar estatus');
            loadBeds();
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cambiar estatus');
        loadBeds();
    }
}

// ==================== QR Y PACIENTE ====================

async function generateQR(bedId) {
    if (!confirm('¿Desea generar el código QR para esta cama?')) return;
    
    try {
        const response = await fetch(url + `/bed/${bedId}/generar-qr`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            showSuccess('Código QR generado exitosamente');
            console.log(data);
            if (data.data && data.data.qrUrl) {
                showQRModal(data.data.qrUrl, data.data.id);
            }
            
            loadBeds();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al generar QR');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al generar QR');
    }
}

function showQRModal(qrUrl, bedId) {
    console.log(bedId);
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-800">
                    Código QR - Cama #${bedId}
                </h3>
                <button class="close-modal text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="flex flex-col items-center">
                <div class="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                    <img src="${qrUrl}" alt="Código QR" class="w-64 h-64 object-contain" />
                </div>
                
                <p class="text-sm text-gray-600 text-center mb-4">
                    Escanea este código QR para ver la información del paciente
                </p>
                
                <div class="flex gap-3 w-full">
                    <a href="${qrUrl}" download="qr-cama-${bedId}.png"
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-center shadow transition">
                        Descargar QR
                    </a>
                    <button class="close-modal flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold shadow transition">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function viewPatientInfo(bedId) {
    try {
        const response = await fetch(url + `/bed/${bedId}/paciente`);
        
        if (response.ok) {
            const data = await response.json();
            const info = data.data;
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm';
            modal.innerHTML = `
                <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-800">
                            Información del Paciente
                        </h3>
                        <button class="close-modal text-gray-400 hover:text-gray-600">
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
                        <button class="close-modal bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => modal.remove());
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        } else {
            const error = await response.json();
            showError(error.message || 'No se pudo obtener información del paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al obtener información');
    }
}

// ==================== EVENT LISTENERS ====================

function initializeEventListeners() {
    // Botón de agregar cama (ahora agrega directamente)
    btnAddBed.addEventListener('click', addBedDirectly);
    btnRefreshBeds.addEventListener('click', loadBeds);
    btnLogout.addEventListener('click', logout);
    
    
    // Event delegation para la tabla
    bedsTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        const bedId = parseInt(button.dataset.bedId);

        switch(action) {
            case 'delete':
                deleteBed(bedId);
                break;
            case 'generate-qr':
                generateQR(bedId);
                break;
            case 'view-qr':
                showQRModal(button.dataset.qrUrl,bedId);
                break;
            case 'view-patient':
                viewPatientInfo(bedId);
                break;
        }
    });
    
    // Cambio de estatus
    bedsTableBody.addEventListener('change', (e) => {
        if (e.target.dataset.action === 'change-status') {
            const bedId = parseInt(e.target.dataset.bedId);
            changeBedStatus(bedId, e.target.value, e.target);
        }
    });
}

// ==================== INICIALIZACIÓN ====================

addEventListener('load', () => {
    console.log('🚀 Iniciando Panel de Isla - Camas...');
    initializeEventListeners();
    loadBeds();
    console.log('✅ Panel de Camas inicializado correctamente');
});