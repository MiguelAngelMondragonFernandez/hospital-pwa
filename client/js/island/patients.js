// ==================== PATIENTS ====================

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

let editingPatient = null;

export function initializePatients() {
    btnAddPatient.addEventListener('click', () => openPatientModal());
    btnRefreshPatients.addEventListener('click', loadPatients);
    btnClosePatientModal.addEventListener('click', closePatientModal);
    formPatient.addEventListener('submit', savePatient);
    
    // Expose functions to window for inline onclick handlers
    window.editPatient = editPatient;
    window.deletePatient = deletePatient;
    window.changePatientStatus = changePatientStatus;
}

export async function loadPatients() {
    try {
        const response = await fetch(url + "/patient/all");
        
        if (response.ok) {
            const data = await response.json();
            const patients = data.data || data;
            console.log('Pacientes cargados:', data);
            
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
        // Determinar el estilo del badge según el estatus
        const statusClass = getStatusClass(patient.estatus);
        const statusText = getStatusText(patient.estatus);
        
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
            <td class="p-4">${patient.camaId ? `Cama #${patient.camaId}` : 'Sin cama'}</td>
            <td class="p-4 text-right">
                <button onclick="editPatient(${patient.id})" 
                    class="text-indigo-600 hover:text-indigo-800 font-medium mr-3">
                    Editar
                </button>
                <button onclick="deletePatient(${patient.id})" 
                    class="text-red-600 hover:text-red-800 font-medium">
                    Eliminar
                </button>
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
    
    // Mapear campos del backend al frontend (incluyendo apellidos)
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
    
    // Mapear nombres de campos del frontend al backend (DTO)
    const patientData = {
        nombre: document.getElementById('patient-name').value,
        apellido: document.getElementById('patient-lastname').value,  // Campo agregado
        tipoSangre: document.getElementById('patient-bloodtype').value,
        padecimientos: document.getElementById('patient-ailments').value,
        descripcion: document.getElementById('patient-description').value,
    };
    
    // Si estamos editando, agregar el ID
    if (id) {
        patientData.id = parseInt(id);
    }
    
    try {
        const endpoint = id ? '/patient/update' : '/patient/save';
        const method = id ? 'PUT' : 'POST';
        
        console.log('Enviando datos:', patientData);
        console.log('Endpoint:', url + endpoint);
        
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
            console.error('Error del servidor:', error);
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
            loadPatients(); // Recargar para restaurar el valor anterior
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cambiar estatus');
        loadPatients(); // Recargar para restaurar el valor anterior
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
            console.log('Paciente cargado:', patient);
            openPatientModal(patient);
        } else {
            showError('Error al cargar datos del paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cargar paciente');
    }
}