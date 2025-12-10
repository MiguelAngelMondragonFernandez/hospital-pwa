import { url } from "./config.js";
import { initNotifications } from "./nurse-notifications.js";

const tableBody = document.getElementById('requests-table-body');
const noRequestsMsg = document.getElementById('no-requests-msg');
const btnRefresh = document.getElementById('btn-refresh');
const btnLogout = document.getElementById('btn-logout');



btnLogout.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});


// Debug logic moved to load event

if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
        loadRequests();
    });
}

async function loadRequests() {
    if (!tableBody) return; // Guard

    try {
        const response = await fetch(url + "/attention/findAllUnattended");
        if (response.ok) {
            const data = await response.json();
            const requests = data.data;

            if (requests && requests.length > 0) {
                renderTable(requests);
                if (noRequestsMsg) noRequestsMsg.style.display = 'none';
                if (tableBody.parentElement) tableBody.parentElement.style.display = 'table';
            } else {
                tableBody.innerHTML = '';
                if (noRequestsMsg) noRequestsMsg.style.display = 'block';
                if (tableBody.parentElement) tableBody.parentElement.style.display = 'none';
            }
        } else {
            tableBody.innerHTML = '';
            if (noRequestsMsg) noRequestsMsg.style.display = 'block';
            if (tableBody.parentElement) tableBody.parentElement.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading requests", error);
    }
}

function renderTable(requests) {
    if (!tableBody) return;

    tableBody.innerHTML = '';
    requests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.id}</td>
            <td>${req.stretcherId}</td>
            <td>${req.dateTime}</td>
            <td><span class="badge bg-warning text-dark">${req.status}</span></td>
            <td>
                ${req.status !== 'Atendida' ? `<button class="btn-attend btn btn-primary btn-sm" data-id="${req.id}">Atender</button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.btn-attend').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            markAsAttended(id);
        });
    });
}

async function markAsAttended(id) {
    try {
        const response = await fetch(url + "/attention/markAsAttended/" + id, {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            // alert(data.message);
            loadRequests();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error marking as attended", error);
        alert("Error al marcar como atendida");
    }
}

// Load initial data
loadRequests();

// Polling every 10 seconds
setInterval(loadRequests, 10000);

// Initialize Shared Notifications
// Pass loadRequests as callback so data refreshes on notification
initNotifications(loadRequests);