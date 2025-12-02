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
        `;
        tableBody.appendChild(row);
    });
}

addEventListener('load', () => {
    loadRequests();
    // Optional: Auto refresh every 10 seconds
    setInterval(loadRequests, 10000);
});
