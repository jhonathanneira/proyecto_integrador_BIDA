document.addEventListener('DOMContentLoaded', () => {
    
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
        

        tbody.innerHTML = empleadosBD.map(emp => `
            <div class="data-row">
                <div><div class="main-text">${emp.nombre} ${emp.apellido}</div><div class="sub-text">ID: ${emp.idEmpleado}</div></div>
                <div><div class="main-text">${emp.documento}</div></div>
                <div><div class="main-text">${emp.rol || 'N/A'}</div><div class="sub-text">${emp.especialidad || 'General'}</div></div>
                <div><div class="main-text">${emp.telefono}</div><div class="sub-text">${emp.email}</div></div>
                <div><span class="status-badge status-active">@${emp.usuario}</span></div>
                <div class="action-buttons">
                    <button class="btn-icon">✎</button>
                    <button class="btn-icon delete">✖</button>
                </div>
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
                <div><div class="main-text">${emp.nombre} ${emp.apellido}</div><div class="sub-text">ID: ${emp.idEmpleado || emp.id || ''}</div></div>
                <div><div class="main-text">${emp.documento || ''}</div></div>
                <div><div class="main-text">${emp.rol || 'N/A'}</div><div class="sub-text">${emp.especialidad || ''}</div></div>
                <div><div class="main-text">${emp.telefono || ''}</div><div class="sub-text">${emp.email || ''}</div></div>
                <div><span class="status-badge status-active">@${emp.usuario || ''}</span></div>
                <div class="action-buttons">
                    <button class="btn-icon">✎</button>
                    <button class="btn-icon delete">✖</button>
                </div>
            </div>
        `).join('');
    }

    

    function renderizarProductosPrueba() {
        const tbody = document.getElementById('tbody-productos');
       

        tbody.innerHTML = productosBD.map(prod => `
            <div class="data-row">
                <div><div class="main-text">${prod.nombre}</div><div class="sub-text">ID: ${prod.idProducto}</div></div>
                <div><div class="main-text">${prod.codigoBarra}</div></div>
                <div><div class="main-text">${prod.categoria}</div><div class="sub-text">${prod.unidadMedida}</div></div>
                <div>
                    <div class="main-text" style="color: #15803d;">V: $${prod.precioVenta.toLocaleString('es-CO')}</div>
                    <div class="sub-text">C: $${prod.precioCompra.toLocaleString('es-CO')}</div>
                </div>
                <div><div class="main-text">${prod.fechaVencimiento}</div></div>
                <div class="action-buttons">
                    <button class="btn-icon">✎</button>
                    <button class="btn-icon delete">✖</button>
                </div>
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
                <div><div class="main-text">${prod.nombre}</div><div class="sub-text">ID: ${prod.idProducto || prod.id || ''}</div></div>
                <div><div class="main-text">${prod.codigoBarra || ''}</div></div>
                <div><div class="main-text">${prod.categoria || ''}</div><div class="sub-text">${prod.unidadMedida || ''}</div></div>
                <div>
                    <div class="main-text" style="color: #15803d;">V: $${(prod.precioVenta||0).toLocaleString('es-CO')}</div>
                    <div class="sub-text">C: $${(prod.precioCompra||0).toLocaleString('es-CO')}</div>
                </div>
                <div><div class="main-text">${prod.fechaVencimiento || ''}</div></div>
                <div class="action-buttons">
                    <button class="btn-icon">✎</button>
                    <button class="btn-icon delete">✖</button>
                </div>
            </div>
        `).join('');
    }

    function renderizarVentasPrueba() {
        const tbody = document.getElementById('tbody-ventas');
        

        tbody.innerHTML = ventasBD.map(venta => `
            <div class="data-row">
                <div><div class="main-text"># V-${venta.idVenta}</div></div>
                <div><div class="main-text">${venta.fechaHora.split(' ')[0]}</div><div class="sub-text">${venta.fechaHora.split(' ')[1]}</div></div>
                <div><span class="status-badge status-active">${venta.estado}</span><div class="sub-text">${venta.metodoPago}</div></div>
                <div><div class="main-text">Emp: ${venta.idEmpleado}</div><div class="sub-text">Cli: ${venta.idCliente}</div></div>
                <div><div class="main-text" style="font-size: 1.2rem; color: #005792;">$${parseFloat(venta.totalPagar).toLocaleString('es-CO')}</div></div>
                <div class="action-buttons">
                    <button class="btn-icon">👁</button>
                    <button class="btn-icon delete">✖</button>
                </div>
            </div>
        `).join('');
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
                <div><div class="main-text"># V-${venta.idVenta || venta.id || ''}</div></div>
                <div><div class="main-text">${(venta.fechaHora||'').split(' ')[0] || ''}</div><div class="sub-text">${(venta.fechaHora||'').split(' ')[1] || ''}</div></div>
                <div><span class="status-badge status-active">${venta.estado || ''}</span><div class="sub-text">${venta.metodoPago || ''}</div></div>
                <div><div class="main-text">Emp: ${venta.idEmpleado || ''}</div><div class="sub-text">Cli: ${venta.idCliente || ''}</div></div>
                <div><div class="main-text" style="font-size: 1.2rem; color: #005792;">$${parseFloat(venta.totalPagar||0).toLocaleString('es-CO')}</div></div>
                <div class="action-buttons">
                    <button class="btn-icon">👁</button>
                    <button class="btn-icon delete">✖</button>
                </div>
            </div>
        `).join('');
    }


});