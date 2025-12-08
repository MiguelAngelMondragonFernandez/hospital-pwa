import { url } from '../config.js';
import { showSuccess, showError } from './utils.js';

// DOM Elements
const patientsTableBody = document.getElementById('patients-table-body');
const noPatientsMsg = document.getElementById('no-patients-msg');
const btnAddPatient = document.getElementById('btn-add-patient');
const btnRefreshPatients = document.getElementById('btn-refresh-patients');
const patientModal = document.getElementById('patient-modal');
const btnClosePatientModal = document.getElementById('btn-close-patient-modal');
const formPatient = document.getElementById('form-patient');

// Modal de asignación de cama
const bedAssignModal = document.getElementById('bed-assign-modal');
const btnCloseBedAssignModal = document.getElementById('btn-close-bed-assign-modal');
const bedSelect = document.getElementById('bed-select');
const btnConfirmAssignBed = document.getElementById('btn-confirm-assign-bed');

let editingPatient = null;
let assigningPatientId = null;


export async function loadPatients() {
    try {
        const response = await fetch(url + "/patient/all");
        
        if (response.ok) {
            const data = await response.json();
            const patients = data.data || data;
            console.log('Pacientes cargados:', patients);
            
            if (patients && patients.length > 0) {
                renderPatientsTable(patients);
                noPatientsMsg.style.display = 'none';
            } else {
                patientsTableBody.innerHTML = '';
                noPatientsMsg.style.display = 'block';
            }
        } else {
            console.error('Error en respuesta:', response.status);
            patientsTableBody.innerHTML = '';
            noPatientsMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading patients:", error);
        showError('Error al cargar pacientes');
        patientsTableBody.innerHTML = '';
        noPatientsMsg.style.display = 'block';
    }
}

function renderPatientsTable(patients) {
    patientsTableBody.innerHTML = '';
    
    patients.forEach(patient => {
        const statusClass = getStatusClass(patient.estatus);
        const statusText = getStatusText(patient.estatus);
        
        // Obtener información de la cama
        let bedInfo = 'Sin cama';
        let bedActions = '';
        
        if (patient.cama) {
            // Tiene cama asignada
            bedInfo = `
                <span class="inline-flex items-center gap-1 text-indigo-600 font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Cama #${patient.cama.id}
                </span>
            `;
            bedActions = `
                <button onclick="unassignBedFromPatient(${patient.id})" 
                    class="text-orange-600 hover:text-orange-800 font-medium" 
                    title="Liberar cama">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            `;
        } else {
            // Sin cama asignada
            bedInfo = '<span class="text-gray-400 italic">Sin cama</span>';
            bedActions = `
                <button onclick="assignBedToPatient(${patient.id})" 
                    class="text-green-600 hover:text-green-800 font-medium" 
                    title="Asignar cama">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            `;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-4 font-medium">#${patient.id}</td>
            <td class="p-4">${patient.nombre || ''} ${patient.apellidos || ''}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                    ${patient.tipoSangre || 'N/A'}
                </span>
            </td>
            <td class="p-4">${patient.padecimientos || 'Ninguno'}</td>
            <td class="p-4">
                <select onchange="changePatientStatus(${patient.id}, this.value)" 
                    class="px-3 py-1 rounded text-xs font-semibold ${statusClass} border-none cursor-pointer">
                    <option value="activo" ${patient.estatus === 'activo' ? 'selected' : ''}>Activo</option>
                    <option value="inactivo" ${patient.estatus === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                    <option value="alta" ${patient.estatus === 'alta' ? 'selected' : ''}>Alta</option>
                </select>
            </td>
            <td class="p-4">${bedInfo}</td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                    ${bedActions}
                    <button onclick="editPatient(${patient.id})" 
                        class="text-indigo-600 hover:text-indigo-800 font-medium">
                        Editar
                    </button>
                    <button onclick="deletePatient(${patient.id})" 
                        class="text-red-600 hover:text-red-800 font-medium">
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        patientsTableBody.appendChild(row);
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'activo':
            return 'bg-green-100 text-green-800';
        case 'inactivo':
            return 'bg-gray-100 text-gray-800';
        case 'alta':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'activo':
            return 'Activo';
        case 'inactivo':
            return 'Inactivo';
        case 'alta':
            return 'Alta';
        default:
            return 'Desconocido';
    }
}

function openPatientModal(patient = null) {
    editingPatient = patient ? patient.id : null;
    document.getElementById('patient-modal-title').textContent = patient ? 'Editar Paciente' : 'Agregar Paciente';
    
    document.getElementById('patient-id').value = patient?.id || '';
    document.getElementById('patient-name').value = patient?.nombre || '';
    document.getElementById('patient-lastname').value = patient?.apellidos || '';
    document.getElementById('patient-bloodtype').value = patient?.tipoSangre || '';
    document.getElementById('patient-ailments').value = patient?.padecimientos || '';
    document.getElementById('patient-description').value = patient?.descripcion || '';
    
    patientModal.classList.remove('hidden');
}

function closePatientModal() {
    editingPatient = null;
    patientModal.classList.add('hidden');
    formPatient.reset();
}

async function savePatient(e) {
    e.preventDefault();
    
    const id = document.getElementById('patient-id').value;
    
    const patientData = {
        nombre: document.getElementById('patient-name').value,
        apellidos: document.getElementById('patient-lastname').value,
        tipoSangre: document.getElementById('patient-bloodtype').value,
        padecimientos: document.getElementById('patient-ailments').value,
        descripcion: document.getElementById('patient-description').value,
    };
    
    if (id) {
        patientData.id = parseInt(id);
    }
    
    try {
        const endpoint = id ? '/patient/update' : '/patient/save';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url + endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });
        
        if (response.ok) {
            showSuccess(id ? 'Paciente actualizado exitosamente' : 'Paciente registrado exitosamente');
            closePatientModal();
            loadPatients();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al guardar paciente');
    }
}

async function changePatientStatus(patientId, newStatus) {
    try {
        const response = await fetch(url + `/patient/${patientId}/change-status/${newStatus}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showSuccess(`Estatus cambiado a: ${getStatusText(newStatus)}`);
            loadPatients();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al cambiar estatus');
            loadPatients();
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cambiar estatus');
        loadPatients();
    }
}

async function deletePatient(id) {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return;
    
    try {
        const response = await fetch(url + `/patient/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Paciente eliminado exitosamente');
            loadPatients();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al eliminar paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar paciente');
    }
}

async function editPatient(id) {
    try {
        const response = await fetch(url + `/patient/${id}`);
        
        if (response.ok) {
            const data = await response.json();
            const patient = data.data || data;
            openPatientModal(patient);
        } else {
            showError('Error al cargar datos del paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cargar paciente');
    }
}

// ==================== FUNCIONES DE ASIGNACIÓN DE CAMA ====================

async function assignBedToPatient(patientId) {
    assigningPatientId = patientId;
    
    // Cargar camas disponibles
    try {
        const response = await fetch(url + "/bed/all");
        
        if (response.ok) {
            const data = await response.json();
            const beds = data.data || data;
            
            // Filtrar solo camas libres
            const availableBeds = beds.filter(bed => bed.status === 'libre' && !bed.paciente);
            
            if (availableBeds.length === 0) {
                showError('No hay camas disponibles en este momento');
                return;
            }
            
            // Llenar el select con camas disponibles
            bedSelect.innerHTML = '<option value="">Seleccionar cama...</option>';
            availableBeds.forEach(bed => {
                const option = document.createElement('option');
                option.value = bed.id;
                option.textContent = `Cama #${bed.id} - ${bed.nombre || 'Sin nombre'}`;
                bedSelect.appendChild(option);
            });
            
            // Mostrar modal
            bedAssignModal.classList.remove('hidden');
        } else {
            showError('Error al cargar camas disponibles');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cargar camas');
    }
}

function closeBedAssignModal() {
    assigningPatientId = null;
    bedAssignModal.classList.add('hidden');
    bedSelect.innerHTML = '';
}

async function confirmAssignBed() {
    const bedId = bedSelect.value;
    
    if (!bedId) {
        showError('Por favor seleccione una cama');
        return;
    }
    
    try {
        const response = await fetch(url + `/patient/${assigningPatientId}/assign-bed/${bedId}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showSuccess('Cama asignada exitosamente');
            closeBedAssignModal();
            loadPatients();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al asignar cama');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al asignar cama');
    }
}

async function unassignBedFromPatient(patientId) {
    if (!confirm('¿Está seguro de liberar la cama de este paciente?')) return;
    
    try {
        const response = await fetch(url + `/patient/${patientId}/unassign-bed`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showSuccess('Cama liberada exitosamente');
            loadPatients();
        } else {
            const error = await response.json();
            showError(error.message || 'Error al liberar cama');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al liberar cama');
    }
}