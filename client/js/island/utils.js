export function showSuccess(message) {
    alert('✓ ' + message);
}

export function showError(message) {
    alert('✗ ' + message);
}

export function getStatusClass(status) {
    const statusMap = {
        'PENDING': 'bg-yellow-100 text-yellow-800',
        'PENDIENTE': 'bg-yellow-100 text-yellow-800',
        'COMPLETED': 'bg-green-100 text-green-800',
        'COMPLETADO': 'bg-green-100 text-green-800',
        'CANCELLED': 'bg-red-100 text-red-800',
        'CANCELADO': 'bg-red-100 text-red-800',
        'IN_PROGRESS': 'bg-blue-100 text-blue-800',
        'EN_PROGRESO': 'bg-blue-100 text-blue-800',
        'ATENDIDA': 'bg-green-100 text-green-800',
        'Atendida': 'bg-green-100 text-green-800'
    };
    return statusMap[status] || statusMap[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
}

export function getBedStatusClass(status) {
    const statusMap = {
        'DISPONIBLE': 'bg-green-100 text-green-800',
        'OCUPADA': 'bg-red-100 text-red-800',
        'MANTENIMIENTO': 'bg-yellow-100 text-yellow-800'
    };
    return statusMap[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
}

export function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}