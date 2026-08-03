document.addEventListener('DOMContentLoaded', () => {
    const dayNames = [
        'Domingo', 'Lunes', 'Martes', 'Miércoles',
        'Jueves', 'Viernes', 'Sábado'
    ];

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const today = new Date();

    const dayElement = document.getElementById('agendaDay');
    const dateElement = document.getElementById('agendaDate');
    const monthYearElement = document.getElementById('agendaMonthYear');

    if (dayElement && dateElement && monthYearElement) {
        dayElement.textContent = dayNames[today.getDay()];
        dateElement.textContent = today.getDate().toString().padStart(2, '0');
        monthYearElement.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    }
});