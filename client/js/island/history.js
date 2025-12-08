import { url } from '../config.js';
import { getStatusClass } from './utils.js'

        function logout() {
            console.log('🚪 Cerrando sesión...');
            // Limpiar cualquier dato de sesión si lo hay
            localStorage.removeItem('userToken');
            sessionStorage.clear();
            // Redirigir a la página de login
            window.location.href = './login.html';
        }
        const tableBody = document.getElementById('requests-table-body');
        const noRequestsMsg = document.getElementById('no-requests-msg');
        const btnRefresh = document.getElementById('btn-refresh');
        const btnLogout = document.getElementById('btn-logout');

        async function loadRequests() {
            try {
                const response = await fetch(url + "/attention/findAll");
                
                if (response.ok) {
                    const data = await response.json();
                    const requests = data.data;

                    if (requests && requests.length > 0) {
                        renderRequestsTable(requests);
                        noRequestsMsg.style.display = 'none';
                    } else {
                        tableBody.innerHTML = '';
                        noRequestsMsg.style.display = 'block';
                    }
                } else {
                    console.error('Error en la respuesta:', response.status);
                    tableBody.innerHTML = '';
                    noRequestsMsg.style.display = 'block';
                }
            } catch (error) {
                console.error("Error loading requests:", error);
                tableBody.innerHTML = '';
                noRequestsMsg.style.display = 'block';
            }
        }

        function renderRequestsTable(requests) {
            tableBody.innerHTML = '';
            
            requests.forEach(req => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-4 font-medium">#${req.id}</td>
                    <td class="p-4">${req.stretcherId || 'N/A'}</td>
                    <td class="p-4">${req.dateTime || 'N/A'}</td>
                    <td class="p-4">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(req.status)}">
                            ${req.status || 'PENDIENTE'}
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        function initializeApp() {
            console.log('🚀 Iniciando Panel de Isla - Historial...');
            
            // Setup event listeners
            if (btnLogout) {
                btnLogout.addEventListener('click', logout);
            }
            
            if (btnRefresh) {
                btnRefresh.addEventListener('click', loadRequests);
            }
            
            // Load initial data
            loadRequests();
            
            // Auto-refresh every 10 seconds
            setInterval(loadRequests, 10000);
            
            console.log('✅ Panel de Historial inicializado correctamente');
        }

        // Start app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }