document.addEventListener('DOMContentLoaded', () => {
    const empleadosPrueba = Array.isArray(window.empleadosBD) ? window.empleadosBD : [];
    const productosPrueba = Array.isArray(window.productosBD) ? window.productosBD : [];
    const ventasPrueba = Array.isArray(window.ventasBD) ? window.ventasBD : [];
    
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
            // Limpiar cualquier dato de muestra y dejar la vista lista para cargar datos reales
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
        // Rutas del backend (se sirven desde app.js bajo /app)
        if (modulo === 'empleados') url = 'http://localhost:3000/app/empleado';
        if (modulo === 'productos') url = 'http://localhost:3000/app/producto';
        if (modulo === 'ventas') url = 'http://localhost:3000/app/venta';

        // Intentamos obtener datos reales; si falla, usamos datos de prueba.
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {
                if (modulo === 'empleados') renderizarEmpleados(data);
                if (modulo === 'productos') renderizarProductos(data);
                if (modulo === 'ventas') renderizarVentas(data);
            })
            .catch(err => {
                console.warn('No fue posible cargar desde backend, usando datos de prueba:', err.message);
                if(modulo === 'empleados') renderizarEmpleadosPrueba();
                if(modulo === 'productos') renderizarProductosPrueba();
                if(modulo === 'ventas') renderizarVentasPrueba();
            });
    }

    
    function renderizarEmpleadosPrueba() {
        const tbody = document.getElementById('tbody-empleados');
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
        // Algunos endpoints devuelven un objeto con { empleados } o bien un array.
        const lista = Array.isArray(data) ? data : (data.empleados || data);
        const tbody = document.getElementById('tbody-empleados');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<div class="data-row">No hay empleados registrados.</div>';
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

    

    function renderizarProductosPrueba() {
        const tbody = document.getElementById('tbody-productos');
        if (!productosPrueba.length) {
            tbody.innerHTML = '<div class="data-row">No hay productos de prueba configurados.</div>';
            return;
        }
       

        tbody.innerHTML = productosPrueba.map(prod => `
            <div class="data-row">
                <div><div class="main-text">${prod.idProducto || ''}</div></div>
                <div><div class="main-text">${prod.nombre || ''}</div></div>
                <div><div class="main-text">${prod.codigoBarra}</div></div>
                <div><div class="main-text" style="color: #15803d;">$${(prod.precioVenta || 0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">$${(prod.precioCompra || 0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${prod.categoria || ''}</div></div>
                <div><div class="main-text">${prod.unidadMedida || ''}</div></div>
                <div><div class="main-text">${prod.fechaVencimiento}</div></div>
            </div>
        `).join('');
    }

    function renderizarProductos(data) {
        const lista = Array.isArray(data) ? data : (data.productos || data);
        const tbody = document.getElementById('tbody-productos');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<div class="data-row">No hay productos registrados.</div>';
            return;
        }

        tbody.innerHTML = lista.map(prod => `
            <div class="data-row">
                <div><div class="main-text">${prod.idProducto || prod.id || ''}</div></div>
                <div><div class="main-text">${prod.nombre || ''}</div></div>
                <div><div class="main-text">${prod.codigoBarra || ''}</div></div>
                <div><div class="main-text" style="color: #15803d;">$${(prod.precioVenta||0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">$${(prod.precioCompra||0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${prod.categoria || ''}</div></div>
                <div><div class="main-text">${prod.unidadMedida || ''}</div></div>
                <div><div class="main-text">${prod.fechaVencimiento || ''}</div></div>
            </div>
        `).join('');
    }

    function renderizarVentasPrueba() {
        const tbody = document.getElementById('tbody-ventas');
        if (!ventasPrueba.length) {
            tbody.innerHTML = '<div class="data-row">No hay ventas de prueba configuradas.</div>';
            return;
        }
        

        tbody.innerHTML = ventasPrueba.map(venta => `
            <div class="data-row">
                <div><div class="main-text">${venta.idVenta || ''}</div></div>
                <div><div class="main-text">${venta.fechaHora || ''}</div></div>
                <div><div class="main-text" style="font-size: 1.1rem; color: #005792;">$${parseFloat(venta.totalPagar || 0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${venta.metodoPago || ''}</div></div>
                <div><span class="status-badge status-active">${venta.estado || ''}</span></div>
                <div><div class="main-text">${venta.idEmpleado || ''}</div></div>
                <div><div class="main-text">${venta.idCliente || ''}</div></div>
            </div>
        `).join('');
    }

    const tabActiva = document.querySelector('.tab.is-active');
    if (tabActiva) {
        limpiarVista(tabActiva.dataset.target);
    }

    function renderizarVentas(data) {
        const lista = Array.isArray(data) ? data : (data.ventas || data);
        const tbody = document.getElementById('tbody-ventas');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = '<div class="data-row">No hay ventas registradas.</div>';
            return;
        }

        tbody.innerHTML = lista.map(venta => `
            <div class="data-row">
                <div><div class="main-text">${venta.idVenta || venta.id || ''}</div></div>
                <div><div class="main-text">${venta.fechaHora || ''}</div></div>
                <div><div class="main-text" style="font-size: 1.1rem; color: #005792;">$${parseFloat(venta.totalPagar||0).toLocaleString('es-CO')}</div></div>
                <div><div class="main-text">${venta.metodoPago || ''}</div></div>
                <div><span class="status-badge status-active">${venta.estado || ''}</span></div>
                <div><div class="main-text">${venta.idEmpleado || ''}</div></div>
                <div><div class="main-text">${venta.idCliente || ''}</div></div>
            </div>
        `).join('');
    }


});