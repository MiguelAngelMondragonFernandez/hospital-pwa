import { url } from "./config.js";

const tableBody = document.getElementById('requests-table-body');
const noRequestsMsg = document.getElementById('no-requests-msg');
const btnRefresh = document.getElementById('btn-refresh');
const btnLogout = document.getElementById('btn-logout');

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

btnRefresh.addEventListener('click', () => {
    loadRequests();
});

async function loadRequests() {
    try {
        const response = await fetch(url + "/attention/findAllUnattended");
        if (response.ok) {
            const data = await response.json();
            const requests = data.data;

            if (requests && requests.length > 0) {
                renderTable(requests);
                noRequestsMsg.style.display = 'none';
                tableBody.parentElement.style.display = 'table';
            } else {
                tableBody.innerHTML = '';
                noRequestsMsg.style.display = 'block';
                tableBody.parentElement.style.display = 'none';
            }
        } else {
            // If 404 or other error, likely no requests or error
            tableBody.innerHTML = '';
            noRequestsMsg.style.display = 'block';
            tableBody.parentElement.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading requests", error);
        alert("Error al cargar solicitudes");
    }
}

function renderTable(requests) {
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

    // Add event listeners to the new buttons
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
            alert(data.message);
            loadRequests();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error marking as attended", error);
        alert("Error al marcar como atendida");
    }
}

addEventListener('load', () => {
    loadRequests();
    // Optional: Auto refresh every 10 seconds
    setInterval(loadRequests, 10000);
});
