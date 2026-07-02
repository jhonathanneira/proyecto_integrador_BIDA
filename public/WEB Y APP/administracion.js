document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('empleado');
            window.location.href = 'BIDA_Inicio de sesion_login.html';
        });
    }

    const empleadosPrueba = Array.isArray(window.empleadosBD) ? window.empleadosBD : [];
    
    // 1. Lógica para cambiar entre pestañas (Se mantiene igual)
    const tabs = document.querySelectorAll('.tab');
    const views = document.querySelectorAll('.admin-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('is-active'));
            views.forEach(v => v.classList.remove('active'));

            tab.classList.add('is-active');
            const targetId = `view-${tab.dataset.target}`;
            document.getElementById(targetId).classList.add('active');
            limpiarVista(tab.dataset.target);
        });
    });

    function limpiarVista(modulo) {
        const tbody = document.getElementById(`tbody-${modulo}`);
        if (!tbody) return;
        tbody.innerHTML = '<div class="data-row">Cargando datos...</div>';
        cargarDatos(modulo);
    }

    // 2. Conexión con tu Backend
    function cargarDatos(modulo) {
        let url = '';
        if (modulo === 'empleados') url = 'http://localhost:3000/app/empleado';

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => renderizarEmpleados(data))
            .catch(err => {
                console.warn('No fue posible cargar desde backend, usando datos de prueba:', err.message);
                renderizarEmpleadosPrueba();
    


});
    }

    
    function renderizarEmpleadosPrueba() {
        const tbody = document.getElementById('tbody-empleados');
        if (!tbody) return;
        if (!empleadosPrueba.length) {
            tbody.innerHTML = '<div class="data-row">No hay empleados de prueba configurados.</div>';
            return;
        }
        

        tbody.innerHTML = empleadosPrueba.map(emp => `
            <div class="data-row">
                <div><div class="main-text">${emp.idEmpleado || ''}</div></div>
                <div><div class="main-text">${emp.nombre || ''}</div></div>
                <div><div class="main-text">${emp.apellido || ''}</div></div>
                <div><div class="main-text">${emp.documento}</div></div>
                <div><div class="main-text">${emp.rol || 'N/A'}</div></div>
                <div><div class="main-text">${emp.especialidad || ''}</div></div>
                <div><div class="main-text">${emp.telefono || ''}</div></div>
                <div><div class="main-text">${emp.email || ''}</div></div>
                <div><span class="status-badge status-active">@${emp.usuario || ''}</span></div>
            </div>
        `).join('');
    }

    // Render desde respuesta del backend
    function renderizarEmpleados(data) {
        const lista = Array.isArray(data) ? data : (data.empleados || data);
        const tbody = document.getElementById('tbody-empleados');
        if (!tbody || !lista || lista.length === 0) {
            if (tbody) tbody.innerHTML = '<div class="data-row">No hay empleados registrados.</div>';
            return;
        }

        tbody.innerHTML = lista.map(emp => `
            <div class="data-row">
                <div><div class="main-text">${emp.idEmpleado || emp.id || ''}</div></div>
                <div><div class="main-text">${emp.nombre || ''}</div></div>
                <div><div class="main-text">${emp.apellido || ''}</div></div>
                <div><div class="main-text">${emp.documento || ''}</div></div>
                <div><div class="main-text">${emp.rol || 'N/A'}</div></div>
                <div><div class="main-text">${emp.especialidad || ''}</div></div>
                <div><div class="main-text">${emp.telefono || ''}</div></div>
                <div><div class="main-text">${emp.email || ''}</div></div>
                <div><span class="status-badge status-active">@${emp.usuario || ''}</span></div>
            </div>
        `).join('');
    }

    limpiarVista('empleados');
    


});