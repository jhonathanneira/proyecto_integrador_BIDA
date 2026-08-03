document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');
    const tabs = document.querySelectorAll('.admin-tab[data-target]');
    const views = document.querySelectorAll('.admin-content');

    const agendaModal = document.getElementById('modal-agenda');
    const agendaDeleteModal = document.getElementById('modal-agenda-eliminar');
    const agendaForm = document.getElementById('form-agenda');
    const agendaMessage = document.getElementById('agenda-mensaje');
    const agendaDeleteText = document.getElementById('agenda-eliminar-texto');
    const agendaDeleteButton = document.getElementById('btn-agenda-confirmar-eliminar');
    const agendaTitle = document.getElementById('modal-agenda-titulo');
    const agendaId = document.getElementById('agenda-id-cita');
    const agendaFecha = document.getElementById('agenda-fecha');
    const agendaHora = document.getElementById('agenda-hora');
    const agendaPaciente = document.getElementById('agenda-paciente');
    const agendaDocumento = document.getElementById('agenda-documento');
    const agendaTelefono = document.getElementById('agenda-telefono');
    const agendaEmpleado = document.getElementById('agenda-empleado');
    const agendaTratamiento = document.getElementById('agenda-tratamiento');
    const agendaEstado = document.getElementById('agenda-estado');
    const agendaObservacion = document.getElementById('agenda-observacion');
    const agendaTotal = document.getElementById('agenda-total-citas');
    const agendaPendientesHoy = document.getElementById('agenda-pendientes-hoy');
    const btnNuevaCita = document.getElementById('btn-nueva-cita');

    let citaPendienteEliminar = null;

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('empleado');
            window.location.href = 'BIDA_Inicio de sesion_login.html';
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activarVista(tab.dataset.target));
    });

    if (btnNuevaCita) {
        btnNuevaCita.addEventListener('click', () => abrirFormularioCita());
    }

    document.querySelectorAll('[data-agenda-close]').forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-agenda-close');
            if (target === 'form') cerrarModalAgenda();
            if (target === 'delete') cerrarModalEliminarAgenda();
        });
    });

    if (agendaModal) {
        agendaModal.addEventListener('click', event => {
            if (event.target === agendaModal) {
                cerrarModalAgenda();
            }
        });
    }

    if (agendaDeleteModal) {
        agendaDeleteModal.addEventListener('click', event => {
            if (event.target === agendaDeleteModal) {
                cerrarModalEliminarAgenda();
            }
        });
    }

    if (agendaForm) {
        agendaForm.addEventListener('submit', guardarCita);
    }

    if (agendaDeleteButton) {
        agendaDeleteButton.addEventListener('click', eliminarCitaConfirmada);
    }

    async function activarVista(modulo) {
        tabs.forEach(t => t.classList.toggle('is-active', t.dataset.target === modulo));
        views.forEach(v => v.classList.toggle('active', v.id === `view-${modulo}`));

        if (modulo === 'agenda') {
            await cargarAgenda();
        }

        if (modulo === 'empleados') {
            await cargarEmpleados();
        }

        if (modulo === 'productos') {
            await cargarProductos();
        }

        if (modulo === 'ventas') {
            await cargarVentas();
        }
    }

    function setLoading(tbody, mensaje) {
        if (tbody) {
            tbody.innerHTML = `<div class="data-row">${mensaje}</div>`;
        }
    }

    function mostrarMensaje(elemento, texto, esError) {
        if (!elemento) return;
        elemento.textContent = texto;
        elemento.style.color = esError ? '#b91c1c' : '#15803d';
    }

    function abrirModal(elemento) {
        if (!elemento) return;
        elemento.classList.add('is-open');
        elemento.setAttribute('aria-hidden', 'false');
    }

    function cerrarModal(elemento) {
        if (!elemento) return;
        elemento.classList.remove('is-open');
        elemento.setAttribute('aria-hidden', 'true');
    }

    function cerrarModalAgenda() {
        if (agendaForm) agendaForm.reset();
        if (agendaId) agendaId.value = '';
        if (agendaTitle) agendaTitle.textContent = 'Nueva cita';
        mostrarMensaje(agendaMessage, '', false);
        cerrarModal(agendaModal);
    }

    function cerrarModalEliminarAgenda() {
        citaPendienteEliminar = null;
        if (agendaDeleteText) {
            agendaDeleteText.textContent = '¿Seguro que deseas eliminar esta cita?';
        }
        cerrarModal(agendaDeleteModal);
    }

    async function cargarAgenda() {
        const tbody = document.getElementById('tbody-agenda');
        setLoading(tbody, 'Cargando citas...');

        try {
            const response = await fetch('http://localhost:3000/app/cita');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            renderizarAgenda(data);
            await cargarEmpleadosEnSelect();
        } catch (error) {
            console.error('No fue posible cargar la agenda:', error);
            if (tbody) {
                tbody.innerHTML = '<div class="data-row">Error al cargar la agenda desde la base de datos.</div>';
            }
        }
    }

    async function cargarEmpleadosEnSelect() {
        if (!agendaEmpleado) return;

        try {
            const response = await fetch('http://localhost:3000/app/empleado');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const lista = Array.isArray(data) ? data : (data.empleados || []);

            const options = ['<option value="">Sin asignar</option>'];
            lista.forEach(empleado => {
                options.push(`<option value="${empleado.idEmpleado}">${escapeHtml(empleado.nombre || '')} ${escapeHtml(empleado.apellido || '')}</option>`);
            });

            agendaEmpleado.innerHTML = options.join('');
        } catch (error) {
            console.warn('No fue posible cargar empleados para la agenda:', error);
        }
    }

    function renderizarAgenda(data) {
        const lista = Array.isArray(data) ? data : (data.citas || data);
        const tbody = document.getElementById('tbody-agenda');

        if (!tbody || !lista || lista.length === 0) {
            if (tbody) tbody.innerHTML = '<div class="data-row">No hay citas registradas.</div>';
            if (agendaTotal) agendaTotal.textContent = '0';
            if (agendaPendientesHoy) agendaPendientesHoy.textContent = '0';
            return;
        }

        const hoy = new Date().toISOString().slice(0, 10);
        const pendientesHoy = lista.filter(cita => cita.fecha === hoy && cita.estado !== 'Cancelada').length;

        if (agendaTotal) agendaTotal.textContent = String(lista.length);
        if (agendaPendientesHoy) agendaPendientesHoy.textContent = String(pendientesHoy);

        tbody.innerHTML = lista.map(cita => renderFilaAgenda(cita)).join('');
    }

    function renderFilaAgenda(cita) {
        return `
            <div class="data-row" data-cita-id="${cita.idCita ?? ''}" data-fecha="${escapeHtml(cita.fecha ?? '')}" data-hora="${escapeHtml((cita.hora ?? '').toString().slice(0, 5))}" data-paciente="${escapeHtml(cita.paciente ?? '')}" data-documento="${escapeHtml(cita.documento ?? '')}" data-telefono="${escapeHtml(cita.telefono ?? '')}" data-id-empleado="${cita.idEmpleado ?? ''}" data-tratamiento="${escapeHtml(cita.tratamiento ?? '')}" data-estado="${escapeHtml(cita.estado ?? '')}" data-observacion="${escapeHtml(cita.observacion ?? '')}">
                <div><div class="main-text">${formatearFecha(cita.fecha)}</div></div>
                <div><div class="main-text">${formatearHora(cita.hora)}</div></div>
                <div><div class="main-text">${cita.paciente ?? ''}</div></div>
                <div><div class="main-text">${cita.nombreEmpleado || cita.idEmpleado || 'Sin asignar'}</div></div>
                <div><div class="main-text">${cita.tratamiento ?? ''}</div></div>
                <div><span class="status-badge status-active">${cita.estado ?? 'Programada'}</span></div>
                <div>
                    <div class="row-actions">
                        <button class="btn-icon" type="button" onclick="editarCita(${cita.idCita})">E</button>
                        <button class="btn-icon delete" type="button" onclick="eliminarCita(${cita.idCita})">X</button>
                    </div>
                </div>
            </div>
        `;
    }

    function obtenerDatosCita(idCita) {
        const fila = document.querySelector(`[data-cita-id="${idCita}"]`);
        if (!fila) return null;

        return {
            idCita,
            fecha: fila.dataset.fecha || '',
            hora: fila.dataset.hora || '',
            paciente: fila.dataset.paciente || '',
            documento: fila.dataset.documento || '',
            telefono: fila.dataset.telefono || '',
            idEmpleado: fila.dataset.idEmpleado || '',
            tratamiento: fila.dataset.tratamiento || '',
            estado: fila.dataset.estado || 'Programada',
            observacion: fila.dataset.observacion || ''
        };
    }

    async function abrirFormularioCita(cita = null) {
        await cargarEmpleadosEnSelect();

        if (agendaForm) agendaForm.reset();
        if (agendaId) agendaId.value = cita?.idCita || '';
        if (agendaFecha) agendaFecha.value = cita?.fecha || new Date().toISOString().slice(0, 10);
        if (agendaHora) agendaHora.value = cita?.hora || '';
        if (agendaPaciente) agendaPaciente.value = cita?.paciente || '';
        if (agendaDocumento) agendaDocumento.value = cita?.documento || '';
        if (agendaTelefono) agendaTelefono.value = cita?.telefono || '';
        if (agendaEmpleado) agendaEmpleado.value = cita?.idEmpleado || '';
        if (agendaTratamiento) agendaTratamiento.value = cita?.tratamiento || '';
        if (agendaEstado) agendaEstado.value = cita?.estado || 'Programada';
        if (agendaObservacion) agendaObservacion.value = cita?.observacion || '';
        if (agendaTitle) agendaTitle.textContent = cita ? 'Editar cita' : 'Nueva cita';
        mostrarMensaje(agendaMessage, '', false);
        abrirModal(agendaModal);
    }

    async function guardarCita(event) {
        event.preventDefault();

        const payload = {
            fecha: agendaFecha.value,
            hora: agendaHora.value,
            paciente: agendaPaciente.value.trim(),
            documento: agendaDocumento.value.trim(),
            telefono: agendaTelefono.value.trim(),
            idEmpleado: agendaEmpleado.value || null,
            tratamiento: agendaTratamiento.value.trim(),
            estado: agendaEstado.value,
            observacion: agendaObservacion.value.trim()
        };

        if (!payload.fecha || !payload.hora || !payload.paciente || !payload.tratamiento) {
            mostrarMensaje(agendaMessage, 'Fecha, hora, paciente y tratamiento son obligatorios.', true);
            return;
        }

        const idCita = agendaId.value;
        const method = idCita ? 'PUT' : 'POST';
        const url = idCita ? `http://localhost:3000/app/cita/${idCita}` : 'http://localhost:3000/app/cita';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.mensaje || `HTTP ${response.status}`);
            }

            mostrarMensaje(agendaMessage, data.mensaje || 'Cita guardada correctamente.', false);
            await cargarAgenda();
            setTimeout(() => cerrarModalAgenda(), 350);
        } catch (error) {
            console.error('Error al guardar la cita:', error);
            mostrarMensaje(agendaMessage, error.message || 'No fue posible guardar la cita.', true);
        }
    }

    async function eliminarCitaConfirmada() {
        if (!citaPendienteEliminar) return;

        try {
            const response = await fetch(`http://localhost:3000/app/cita/${citaPendienteEliminar}`, {
                method: 'DELETE'
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.mensaje || `HTTP ${response.status}`);
            }

            citaPendienteEliminar = null;
            cerrarModalEliminarAgenda();
            await cargarAgenda();
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            if (agendaDeleteText) {
                agendaDeleteText.textContent = error.message || 'Ocurrió un error al eliminar la cita.';
            }
        }
    }

    async function cargarEmpleados() {
        const tbody = document.getElementById('tbody-empleados');
        setLoading(tbody, 'Cargando datos...');

        try {
            const response = await fetch('http://localhost:3000/app/empleado');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const lista = Array.isArray(data) ? data : (data.empleados || []);

            if (!lista.length) {
                tbody.innerHTML = '<div class="data-row">No hay empleados registrados.</div>';
                return;
            }

            tbody.innerHTML = lista.map(emp => `
                <div class="data-row">
                    <div><div class="main-text">${emp.idEmpleado || ''}</div></div>
                    <div><div class="main-text">${emp.nombre || ''}</div></div>
                    <div><div class="main-text">${emp.apellido || ''}</div></div>
                    <div><div class="main-text">${emp.documento || ''}</div></div>
                    <div><div class="main-text">${emp.rol || 'N/A'}</div></div>
                    <div><div class="main-text">${emp.especialidad || ''}</div></div>
                    <div><div class="main-text">${emp.telefono || ''}</div></div>
                    <div><div class="main-text">${emp.email || ''}</div></div>
                    <div><div class="main-text">${emp.usuario || ''}</div></div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar empleados:', error);
            tbody.innerHTML = '<div class="data-row">Error al cargar empleados desde la base de datos.</div>';
        }
    }

    async function cargarProductos() {
        const tbody = document.getElementById('tbody-productos');
        setLoading(tbody, 'Cargando datos...');

        try {
            const response = await fetch('http://localhost:3000/app/producto');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const productos = await response.json();

            if (!Array.isArray(productos) || productos.length === 0) {
                tbody.innerHTML = '<div class="data-row">No hay productos registrados.</div>';
                return;
            }

            tbody.innerHTML = productos.map(prod => `
                <div class="data-row">
                    <div><div class="main-text">${prod.idProducto ?? ''}</div></div>
                    <div><div class="main-text">${prod.nombre ?? ''}</div></div>
                    <div><div class="main-text">${prod.codigoBarra ?? ''}</div></div>
                    <div><div class="main-text">${Number(prod.precioVenta || 0).toLocaleString('es-CO')}</div></div>
                    <div><div class="main-text">${Number(prod.precioCompra || 0).toLocaleString('es-CO')}</div></div>
                    <div><div class="main-text">${prod.categoria ?? ''}</div></div>
                    <div><div class="main-text">${prod.unidadMedida ?? ''}</div></div>
                    <div><div class="main-text">${prod.fechaVencimiento ? formatearFecha(prod.fechaVencimiento) : ''}</div></div>
                    <div>
                        <div class="row-actions">
                            <button class="btn-icon" type="button" onclick="editarProducto(${prod.idProducto})">E</button>
                            <button class="btn-icon delete" type="button" onclick="eliminarProducto(${prod.idProducto})">X</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar productos:', error);
            tbody.innerHTML = '<div class="data-row">Error al cargar productos desde la base de datos.</div>';
        }
    }

    async function cargarVentas() {
        const tbody = document.getElementById('tbody-ventas');
        setLoading(tbody, 'Cargando datos...');

        try {
            const response = await fetch('http://localhost:3000/app/venta');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const ventas = await response.json();
            const lista = Array.isArray(ventas) ? ventas : (ventas.ventas || ventas);

            if (!lista || lista.length === 0) {
                tbody.innerHTML = '<div class="data-row">No hay ventas registradas.</div>';
                return;
            }

            tbody.innerHTML = lista.map(venta => `
                <div class="data-row">
                    <div><div class="main-text">${venta.idVenta || ''}</div></div>
                    <div><div class="main-text">${venta.fechaHora || ''}</div></div>
                    <div><div class="main-text" style="font-size: 1.05rem; color: #005792;">$${parseFloat(venta.totalPagar || 0).toLocaleString('es-CO')}</div></div>
                    <div><div class="main-text">${venta.metodoPago || ''}</div></div>
                    <div><span class="status-badge status-active">${venta.estado || ''}</span></div>
                    <div><div class="main-text">${venta.idEmpleado || ''}</div></div>
                    <div><div class="main-text">${venta.idCliente || ''}</div></div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar ventas:', error);
            tbody.innerHTML = '<div class="data-row">Error al cargar ventas desde la base de datos.</div>';
        }
    }

    function formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    function formatearHora(hora) {
        return (hora || '').toString().slice(0, 5);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    window.editarCita = async function editarCita(idCita) {
        await cargarEmpleadosEnSelect();
        const cita = obtenerDatosCita(idCita);
        if (!cita) return;

        if (agendaId) agendaId.value = cita.idCita;
        if (agendaFecha) agendaFecha.value = cita.fecha || '';
        if (agendaHora) agendaHora.value = cita.hora || '';
        if (agendaPaciente) agendaPaciente.value = cita.paciente || '';
        if (agendaDocumento) agendaDocumento.value = cita.documento || '';
        if (agendaTelefono) agendaTelefono.value = cita.telefono || '';
        if (agendaEmpleado) agendaEmpleado.value = cita.idEmpleado || '';
        if (agendaTratamiento) agendaTratamiento.value = cita.tratamiento || '';
        if (agendaEstado) agendaEstado.value = cita.estado || 'Programada';
        if (agendaObservacion) agendaObservacion.value = cita.observacion || '';
        if (agendaTitle) agendaTitle.textContent = 'Editar cita';
        mostrarMensaje(agendaMessage, '', false);
        abrirModal(agendaModal);
    };

    window.eliminarCita = function eliminarCita(idCita) {
        citaPendienteEliminar = idCita;
        const cita = obtenerDatosCita(idCita);

        if (agendaDeleteText) {
            agendaDeleteText.textContent = cita
                ? `¿Seguro que deseas eliminar la cita de ${cita.paciente || 'este paciente'} el ${cita.fecha || ''} a las ${cita.hora || ''}? Esta acción no se puede deshacer.`
                : '¿Seguro que deseas eliminar esta cita?';
        }

        abrirModal(agendaDeleteModal);
    };

    window.editarProducto = function editarProducto(idProducto) {
        alert(`Editar producto ${idProducto}`);
    };

    window.eliminarProducto = async function eliminarProducto(idProducto) {
        try {
            const response = await fetch(`http://localhost:3000/app/producto/${idProducto}`, {
                method: 'DELETE'
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`HTTP ${response.status}`);
            }

            await cargarProductos();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Ocurrió un error al eliminar el producto.');
        }
    };

    async function eliminarCitaConfirmada() {
        if (!citaPendienteEliminar) return;

        try {
            const response = await fetch(`http://localhost:3000/app/cita/${citaPendienteEliminar}`, {
                method: 'DELETE'
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.mensaje || `HTTP ${response.status}`);
            }

            citaPendienteEliminar = null;
            cerrarModalEliminarAgenda();
            await cargarAgenda();
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            if (agendaDeleteText) {
                agendaDeleteText.textContent = error.message || 'Ocurrió un error al eliminar la cita.';
            }
        }
    }

    async function guardarCita(event) {
        event.preventDefault();

        const payload = {
            fecha: agendaFecha.value,
            hora: agendaHora.value,
            paciente: agendaPaciente.value.trim(),
            documento: agendaDocumento.value.trim(),
            telefono: agendaTelefono.value.trim(),
            idEmpleado: agendaEmpleado.value || null,
            tratamiento: agendaTratamiento.value.trim(),
            estado: agendaEstado.value,
            observacion: agendaObservacion.value.trim()
        };

        if (!payload.fecha || !payload.hora || !payload.paciente || !payload.tratamiento) {
            mostrarMensaje(agendaMessage, 'Fecha, hora, paciente y tratamiento son obligatorios.', true);
            return;
        }

        const idCita = agendaId.value;
        const method = idCita ? 'PUT' : 'POST';
        const url = idCita ? `http://localhost:3000/app/cita/${idCita}` : 'http://localhost:3000/app/cita';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.mensaje || `HTTP ${response.status}`);
            }

            mostrarMensaje(agendaMessage, data.mensaje || 'Cita guardada correctamente.', false);
            await cargarAgenda();
            setTimeout(() => cerrarModalAgenda(), 350);
        } catch (error) {
            console.error('Error al guardar la cita:', error);
            mostrarMensaje(agendaMessage, error.message || 'No fue posible guardar la cita.', true);
        }
    }

    function obtenerDatosCita(idCita) {
        const fila = document.querySelector(`[data-cita-id="${idCita}"]`);
        if (!fila) return null;

        return {
            idCita,
            fecha: fila.dataset.fecha || '',
            hora: fila.dataset.hora || '',
            paciente: fila.dataset.paciente || '',
            documento: fila.dataset.documento || '',
            telefono: fila.dataset.telefono || '',
            idEmpleado: fila.dataset.idEmpleado || '',
            tratamiento: fila.dataset.tratamiento || '',
            estado: fila.dataset.estado || 'Programada',
            observacion: fila.dataset.observacion || ''
        };
    }

    async function cargarEmpleadosEnSelect() {
        if (!agendaEmpleado) return;

        try {
            const response = await fetch('http://localhost:3000/app/empleado');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const lista = Array.isArray(data) ? data : (data.empleados || []);

            const options = ['<option value="">Sin asignar</option>'];
            lista.forEach(empleado => {
                options.push(`<option value="${empleado.idEmpleado}">${escapeHtml(empleado.nombre || '')} ${escapeHtml(empleado.apellido || '')}</option>`);
            });

            agendaEmpleado.innerHTML = options.join('');
        } catch (error) {
            console.warn('No fue posible cargar empleados para la agenda:', error);
        }
    }

    async function abrirFormularioCita(cita = null) {
        await cargarEmpleadosEnSelect();

        if (agendaForm) agendaForm.reset();
        if (agendaId) agendaId.value = cita?.idCita || '';
        if (agendaFecha) agendaFecha.value = cita?.fecha || new Date().toISOString().slice(0, 10);
        if (agendaHora) agendaHora.value = cita?.hora || '';
        if (agendaPaciente) agendaPaciente.value = cita?.paciente || '';
        if (agendaDocumento) agendaDocumento.value = cita?.documento || '';
        if (agendaTelefono) agendaTelefono.value = cita?.telefono || '';
        if (agendaEmpleado) agendaEmpleado.value = cita?.idEmpleado || '';
        if (agendaTratamiento) agendaTratamiento.value = cita?.tratamiento || '';
        if (agendaEstado) agendaEstado.value = cita?.estado || 'Programada';
        if (agendaObservacion) agendaObservacion.value = cita?.observacion || '';
        if (agendaTitle) agendaTitle.textContent = cita ? 'Editar cita' : 'Nueva cita';
        mostrarMensaje(agendaMessage, '', false);
        abrirModal(agendaModal);
    }

    activarVista('agenda');
});
