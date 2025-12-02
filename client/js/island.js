import { url } from "./config.js";

const tableBody = document.getElementById('requests-table-body');
const noRequestsMsg = document.getElementById('no-requests-msg');
const btnRefresh = document.getElementById('btn-refresh');
const btnLogout = document.getElementById('btn-logout');

// Tabs
const tabHistory = document.getElementById('tab-history');
const tabNurses = document.getElementById('tab-nurses');
const tabRegister = document.getElementById('tab-register');
const viewHistory = document.getElementById('view-history');
const viewNurses = document.getElementById('view-nurses');
const viewRegister = document.getElementById('view-register');

function switchTab(tab) {
    // Reset styles
    [tabHistory, tabNurses, tabRegister].forEach(t => {
        t.classList.remove('bg-white', 'shadow', 'text-indigo-700');
        t.classList.add('text-gray-700');
    });
    // Hide views
    [viewHistory, viewNurses, viewRegister].forEach(v => v.classList.add('hidden'));

    // Activate tab
    if (tab === 'history') {
        tabHistory.classList.add('bg-white', 'shadow', 'text-indigo-700');
        tabHistory.classList.remove('text-gray-700');
        viewHistory.classList.remove('hidden');
        loadRequests();
    } else if (tab === 'nurses') {
        tabNurses.classList.add('bg-white', 'shadow', 'text-indigo-700');
        tabNurses.classList.remove('text-gray-700');
        viewNurses.classList.remove('hidden');
        loadNurses();
    } else if (tab === 'register') {
        tabRegister.classList.add('bg-white', 'shadow', 'text-indigo-700');
        tabRegister.classList.remove('text-gray-700');
        viewRegister.classList.remove('hidden');
    }
}

tabHistory.addEventListener('click', () => switchTab('history'));
tabNurses.addEventListener('click', () => switchTab('nurses'));
tabRegister.addEventListener('click', () => switchTab('register'));

btnLogout.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

btnRefresh.addEventListener('click', loadRequests);

async function loadRequests() {
    try {
        // Island view sees all requests (history).
        const response = await fetch(url + "/attention/findAll");
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
            tableBody.innerHTML = '';
            noRequestsMsg.style.display = 'block';
            tableBody.parentElement.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading requests", error);
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
    setInterval(loadRequests, 10000);
});
