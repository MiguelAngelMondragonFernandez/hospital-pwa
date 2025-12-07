// ==================== TAB NAVIGATION ====================

import { loadRequests } from './history.js';
import { loadNurses } from './nurses.js';
import { loadPatients } from './patients.js';
import { loadBeds } from './beds.js';

// DOM Elements
const tabHistory = document.getElementById('tab-history');
const tabNurses = document.getElementById('tab-nurses');
const tabPatients = document.getElementById('tab-patients');
const tabBeds = document.getElementById('tab-beds');

const viewHistory = document.getElementById('view-history');
const viewNurses = document.getElementById('view-nurses');
const viewPatients = document.getElementById('view-patients');
const viewBeds = document.getElementById('view-beds');

let currentView = 'history';

export function initializeTabs() {
    tabHistory.addEventListener('click', () => switchTab('history'));
    tabNurses.addEventListener('click', () => switchTab('nurses'));
    tabPatients.addEventListener('click', () => switchTab('patients'));
    tabBeds.addEventListener('click', () => switchTab('beds'));
}

export function switchTab(tab) {
    currentView = tab;
    
    // Reset all tabs
    [tabHistory, tabNurses, tabPatients, tabBeds].forEach(t => {
        t.classList.remove('bg-white', 'shadow', 'text-indigo-700');
        t.classList.add('text-gray-700');
    });
    
    // Hide all views
    [viewHistory, viewNurses, viewPatients, viewBeds].forEach(v => {
        v.classList.add('hidden');
    });
    
    // Activate selected tab
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
    } else if (tab === 'patients') {
        tabPatients.classList.add('bg-white', 'shadow', 'text-indigo-700');
        tabPatients.classList.remove('text-gray-700');
        viewPatients.classList.remove('hidden');
        loadPatients();
    } else if (tab === 'beds') {
        tabBeds.classList.add('bg-white', 'shadow', 'text-indigo-700');
        tabBeds.classList.remove('text-gray-700');
        viewBeds.classList.remove('hidden');
        loadBeds();
    }
}

export function getCurrentView() {
    return currentView;
}