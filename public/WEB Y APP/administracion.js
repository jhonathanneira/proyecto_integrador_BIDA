document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');
    const tabs = document.querySelectorAll('.admin-tab[data-target]');
    const views = document.querySelectorAll('.admin-content');
    const adminSearch = document.getElementById('admin-search');
    const btnNovedades = document.getElementById('btn-novedades');
    const novedadesModal = document.getElementById('modal-novedades');
    const novedadesFecha = document.getElementById('novedades-fecha');
    const novedadesSummary = document.getElementById('novedades-summary');
    const novedadesList = document.getElementById('novedades-list');
    const formNovedad = document.getElementById('form-novedad');
    const btnCrearNovedad = document.getElementById('btn-crear-novedad');
    const novedadTitulo = document.getElementById('novedad-titulo');
    const novedadDescripcion = document.getElementById('novedad-descripcion');
    const novedadMensaje = document.getElementById('novedad-mensaje');
    const empleadoSesion = obtenerEmpleadoSesion();
    const puedePublicarNovedades = esAdministracion(empleadoSesion?.especialidad);
    const puedeCrearCitas = esAdministracion(empleadoSesion?.especialidad);
    const encabezadosSesion = () => ({ 'Authorization': `Bearer ${sessionStorage.getItem('sesionToken') || ''}` });

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
    const agendaCalendar = document.getElementById('agenda-calendar');
    const agendaPeriodo = document.getElementById('agenda-periodo');
    const agendaAnterior = document.getElementById('agenda-anterior');
    const agendaSiguiente = document.getElementById('agenda-siguiente');
    const agendaVistaBotones = document.querySelectorAll('[data-agenda-vista]');
    const modalEmpleado = document.getElementById('modal-empleado');
    const modalEmpleadoEliminar = document.getElementById('modal-empleado-eliminar');
    const formEmpleado = document.getElementById('form-empleado');
    const empleadoIdInput = document.getElementById('empleado-id');
    const empleadoNombreInput = document.getElementById('empleado-nombre');
    const empleadoRolInput = document.getElementById('empleado-rol');
    const empleadoUsuarioInput = document.getElementById('empleado-usuario');
    const empleadoPasswordInput = document.getElementById('empleado-password');
    const empleadoMensaje = document.getElementById('empleado-mensaje');
    const empleadoEliminarTexto = document.getElementById('empleado-eliminar-texto');
    const btnEmpleadoEliminar = document.getElementById('btn-empleado-eliminar');

    let citaPendienteEliminar = null;
    let citasAgenda = [];
    let agendaVista = 'semana';
    let agendaFechaReferencia = new Date();
    let empleadoPendienteEliminar = null;

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('empleado');
            sessionStorage.removeItem('sesionToken');
            window.location.href = 'BIDA_Inicio de sesion_login.html';
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activarVista(tab.dataset.target));
    });

    if (adminSearch) {
        adminSearch.addEventListener('input', filtrarVistaActual);
        adminSearch.addEventListener('search', filtrarVistaActual);
    }

    if (btnNovedades) btnNovedades.addEventListener('click', abrirNovedadesActualizadas);
    if (btnCrearNovedad) {
        btnCrearNovedad.hidden = !puedePublicarNovedades;
        btnCrearNovedad.addEventListener('click', mostrarFormularioNovedad);
    }
    if (formNovedad) formNovedad.addEventListener('submit', publicarNovedad);
    document.querySelectorAll('[data-novedades-close]').forEach(button => button.addEventListener('click', () => cerrarModal(novedadesModal)));
    if (novedadesModal) novedadesModal.addEventListener('click', event => { if (event.target === novedadesModal) cerrarModal(novedadesModal); });

    if (btnNuevaCita) {
        btnNuevaCita.hidden = !puedeCrearCitas;
        btnNuevaCita.addEventListener('click', () => abrirFormularioCita());
    }
    document.querySelectorAll('[data-entity-new], #btn-gestionar-empleados').forEach(control => {
        control.hidden = !puedeCrearCitas;
    });
    if (agendaAnterior) agendaAnterior.addEventListener('click', () => cambiarPeriodoAgenda(-1));
    if (agendaSiguiente) agendaSiguiente.addEventListener('click', () => cambiarPeriodoAgenda(1));
    agendaVistaBotones.forEach(button => button.addEventListener('click', () => {
        agendaVista = button.dataset.agendaVista;
        agendaVistaBotones.forEach(item => item.classList.toggle('is-active', item === button));
        renderizarCalendarioAgenda();
    }));

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
        if (adminSearch) {
            adminSearch.value = '';
            adminSearch.placeholder = `Buscar en ${tabs.length ? (document.querySelector(`.admin-tab[data-target="${modulo}"]`)?.textContent || 'el módulo').trim() : 'el módulo'}...`;
        }

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

        if (modulo === 'clientes') {
            await cargarClientes();
        }

        if (modulo === 'tratamientos') {
            await cargarTratamientos();
        }

        if (modulo === 'equipos') {
            await cargarEquipos();
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
            const response = await fetch('/app/cita', { headers: encabezadosSesion() });
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
            const response = await fetch('/app/empleado');
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
        citasAgenda = lista || [];

        if (!tbody || !lista || lista.length === 0) {
            if (tbody) tbody.innerHTML = '<div class="data-row">No hay citas registradas.</div>';
            if (agendaTotal) agendaTotal.textContent = '0';
            if (agendaPendientesHoy) agendaPendientesHoy.textContent = '0';
            renderizarCalendarioAgenda();
            return;
        }

        const hoy = claveDia(new Date());
        const pendientesHoy = lista.filter(cita => fechaClave(cita.fecha) === hoy && cita.estado !== 'Cancelada').length;

        if (agendaTotal) agendaTotal.textContent = String(lista.length);
        if (agendaPendientesHoy) agendaPendientesHoy.textContent = String(pendientesHoy);

        tbody.innerHTML = lista.map(cita => renderFilaAgenda(cita)).join('');
        renderizarCalendarioAgenda();
    }

    function fechaClave(fecha) { return String(fecha || '').slice(0, 10); }

    function claveDia(fecha) { return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`; }

    function sumarDias(fecha, dias) { const resultado = new Date(fecha); resultado.setDate(resultado.getDate() + dias); return resultado; }

    function inicioSemana(fecha) {
        const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        return inicio;
    }
    document.querySelectorAll('[data-empleado-close]').forEach(button => button.addEventListener('click', cerrarModalEmpleado));
    document.querySelectorAll('[data-empleado-delete-close]').forEach(button => button.addEventListener('click', cerrarModalEmpleadoEliminar));
    if (modalEmpleado) modalEmpleado.addEventListener('click', event => { if (event.target === modalEmpleado) cerrarModalEmpleado(); });
    if (modalEmpleadoEliminar) modalEmpleadoEliminar.addEventListener('click', event => { if (event.target === modalEmpleadoEliminar) cerrarModalEmpleadoEliminar(); });
    if (formEmpleado) formEmpleado.addEventListener('submit', guardarEmpleado);
    if (btnEmpleadoEliminar) btnEmpleadoEliminar.addEventListener('click', eliminarEmpleadoConfirmado);

    function esMismoDia(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

    function cambiarPeriodoAgenda(direccion) {
        if (agendaVista === 'dia') agendaFechaReferencia = sumarDias(agendaFechaReferencia, direccion);
        else if (agendaVista === 'semana') agendaFechaReferencia = sumarDias(agendaFechaReferencia, direccion * 7);
        else agendaFechaReferencia = new Date(agendaFechaReferencia.getFullYear(), agendaFechaReferencia.getMonth() + direccion, 1);
        renderizarCalendarioAgenda();
    }

    function renderizarCalendarioAgenda() {
        if (!agendaCalendar) return;
        const hoy = new Date();
        let dias = [];
        let titulo = '';
        if (agendaVista === 'dia') {
            dias = [new Date(agendaFechaReferencia)];
            titulo = agendaFechaReferencia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } else if (agendaVista === 'semana') {
            const inicio = inicioSemana(agendaFechaReferencia);
            dias = Array.from({ length: 7 }, (_, indice) => sumarDias(inicio, indice));
            const fin = dias[6];
            titulo = `${inicio.getDate()} ${inicio.toLocaleDateString('es-CO', { month: 'short' })} – ${fin.getDate()} ${fin.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}`;
        } else {
            const primero = new Date(agendaFechaReferencia.getFullYear(), agendaFechaReferencia.getMonth(), 1);
            const inicio = inicioSemana(primero);
            const ultimo = new Date(agendaFechaReferencia.getFullYear(), agendaFechaReferencia.getMonth() + 1, 0);
            const fin = sumarDias(ultimo, 6 - ((ultimo.getDay() + 6) % 7));
            for (let dia = new Date(inicio); dia <= fin; dia = sumarDias(dia, 1)) dias.push(new Date(dia));
            titulo = primero.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        }
        if (agendaPeriodo) agendaPeriodo.textContent = titulo;
        const encabezados = agendaVista === 'dia' ? '' : `<div class="calendar-weekdays">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => `<span>${dia}</span>`).join('')}</div>`;
        agendaCalendar.className = `agenda-calendar is-${agendaVista}`;
        agendaCalendar.innerHTML = `${encabezados}<div class="calendar-grid">${dias.map(dia => renderizarDiaCalendario(dia, hoy)).join('')}</div>`;
        agendaCalendar.querySelectorAll('[data-calendar-cita]').forEach(button => button.addEventListener('click', () => {
            const cita = citasAgenda.find(item => String(item.idCita) === button.dataset.calendarCita);
            if (cita) abrirFormularioCita(cita);
        }));
    }

    function renderizarDiaCalendario(dia, hoy) {
        const clave = claveDia(dia);
        const citas = citasAgenda.filter(cita => fechaClave(cita.fecha) === clave).sort((a, b) => String(a.hora).localeCompare(String(b.hora)));
        const otroMes = agendaVista === 'mes' && dia.getMonth() !== agendaFechaReferencia.getMonth();
        return `<section class="calendar-day ${otroMes ? 'is-other-month' : ''} ${esMismoDia(dia, hoy) ? 'is-today' : ''}"><span class="calendar-date">${dia.getDate()}</span>${citas.map(cita => puedeCrearCitas ? `<button class="calendar-event" type="button" data-calendar-cita="${cita.idCita}" title="Editar cita de ${escapeHtml(cita.paciente)}"><time>${formatearHora(cita.hora)}</time><span>${escapeHtml(cita.paciente)}</span></button>` : `<div class="calendar-event is-readonly"><time>${formatearHora(cita.hora)}</time><span>${escapeHtml(cita.paciente)}</span></div>`).join('')}</section>`;
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
                    ${puedeCrearCitas ? `<div class="row-actions">${botonEditar(`onclick="editarCita(${cita.idCita})"`)}${botonEliminar(`onclick="eliminarCita(${cita.idCita})"`)}</div>` : '<span class="action-restricted">Sin permisos</span>'}
                </div>
            </div>
        `;
    }

    function botonEditar(atributos) {
        return `<button class="btn-icon edit" type="button" ${atributos} aria-label="Editar registro" title="Editar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5V20h3.5L18.3 9.2l-3.5-3.5L4 16.5Zm13.9-9.4 1.2-1.2a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0l-1.2 1.2 3.5 3.5Z"/></svg></button>`;
    }

    function botonEliminar(atributos) {
        return `<button class="btn-icon delete" type="button" ${atributos} aria-label="Eliminar registro" title="Eliminar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/></svg></button>`;
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

    async function guardarCitaLegado(event) {
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
        const url = idCita ? `/app/cita/${idCita}` : '/app/cita';

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

    async function eliminarCitaConfirmadaLegado() {
        if (!citaPendienteEliminar) return;

        try {
            const response = await fetch(`/app/cita/${citaPendienteEliminar}`, {
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
            const response = await fetch('/app/empleado');
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
                    <div>${puedeCrearCitas ? `<div class="row-actions">${botonEditar(`data-editar-empleado="${emp.idEmpleado}"`)}${botonEliminar(`data-eliminar-empleado="${emp.idEmpleado}"`)}</div>` : '<span class="action-restricted">Sin permisos</span>'}</div>
                </div>
            `).join('');
            tbody.querySelectorAll('[data-editar-empleado]').forEach(button => button.addEventListener('click', () => abrirEditorEmpleado(lista.find(emp => String(emp.idEmpleado) === button.dataset.editarEmpleado))));
            tbody.querySelectorAll('[data-eliminar-empleado]').forEach(button => button.addEventListener('click', () => abrirEliminarEmpleado(lista.find(emp => String(emp.idEmpleado) === button.dataset.eliminarEmpleado))));
        } catch (error) {
            console.error('Error al cargar empleados:', error);
            tbody.innerHTML = '<div class="data-row">Error al cargar empleados desde la base de datos.</div>';
        }
    }

    function abrirEditorEmpleado(empleado) {
        if (!puedeCrearCitas || !empleado || !formEmpleado) return;
        empleadoIdInput.value = empleado.idEmpleado;
        empleadoNombreInput.value = empleado.nombre || '';
        empleadoRolInput.value = empleado.rol || '';
        empleadoUsuarioInput.value = empleado.usuario || '';
        empleadoPasswordInput.value = '';
        mostrarMensaje(empleadoMensaje, '', false);
        abrirModal(modalEmpleado);
    }

    function cerrarModalEmpleado() {
        if (formEmpleado) formEmpleado.reset();
        mostrarMensaje(empleadoMensaje, '', false);
        cerrarModal(modalEmpleado);
    }

    async function guardarEmpleado(event) {
        event.preventDefault();
        if (!puedeCrearCitas) return;
        const datos = { nombre: empleadoNombreInput.value.trim(), rol: empleadoRolInput.value.trim(), usuario: empleadoUsuarioInput.value.trim() };
        if (empleadoPasswordInput.value.trim()) datos.password = empleadoPasswordInput.value.trim();
        try {
            const response = await fetch(`/app/empleado/${empleadoIdInput.value}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...encabezadosSesion() }, body: JSON.stringify(datos) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensaje || `HTTP ${response.status}`);
            cerrarModalEmpleado();
            await cargarEmpleados();
        } catch (error) { mostrarMensaje(empleadoMensaje, error.message || 'No fue posible actualizar el empleado.', true); }
    }

    function abrirEliminarEmpleado(empleado) {
        if (!puedeCrearCitas || !empleado) return;
        empleadoPendienteEliminar = empleado.idEmpleado;
        if (empleadoEliminarTexto) empleadoEliminarTexto.textContent = `¿Seguro que deseas eliminar a ${empleado.nombre} ${empleado.apellido || ''}? Esta acción no se puede deshacer.`;
        abrirModal(modalEmpleadoEliminar);
    }

    function cerrarModalEmpleadoEliminar() {
        empleadoPendienteEliminar = null;
        cerrarModal(modalEmpleadoEliminar);
    }

    async function eliminarEmpleadoConfirmado() {
        if (!puedeCrearCitas || !empleadoPendienteEliminar) return;
        try {
            const response = await fetch(`/app/empleado/${empleadoPendienteEliminar}`, { method: 'DELETE', headers: encabezadosSesion() });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensaje || `HTTP ${response.status}`);
            cerrarModalEmpleadoEliminar();
            await cargarEmpleados();
        } catch (error) { if (empleadoEliminarTexto) empleadoEliminarTexto.textContent = error.message || 'No fue posible eliminar el empleado.'; }
    }

    async function cargarProductos() {
        const tbody = document.getElementById('tbody-productos');
        setLoading(tbody, 'Cargando datos...');

        try {
            const response = await fetch('/app/producto');
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
                    <div>${puedeCrearCitas ? `<div class="row-actions">${botonEditar(`data-editar-producto="${prod.idProducto}"`)}${botonEliminar(`onclick="eliminarProducto(${prod.idProducto})"`)}</div>` : '<span class="action-restricted">Sin permisos</span>'}</div>
                </div>
            `).join('');
            tbody.querySelectorAll('[data-editar-producto]').forEach(button => button.addEventListener('click', () => abrirEntidad('producto', productos.find(producto => String(producto.idProducto) === button.dataset.editarProducto))));
        } catch (error) {
            console.error('Error al cargar productos:', error);
            tbody.innerHTML = '<div class="data-row">Error al cargar productos desde la base de datos.</div>';
        }
    }

    async function cargarVentas() {
        const tbody = document.getElementById('tbody-ventas');
        setLoading(tbody, 'Cargando datos...');

        try {
            const response = await fetch('/app/venta');
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


    window.eliminarProducto = async function eliminarProducto(idProducto) {
        try {
            const response = await fetch(`/app/producto/${idProducto}`, {
                method: 'DELETE',
                headers: encabezadosSesion()
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
            const response = await fetch(`/app/cita/${citaPendienteEliminar}`, {
                method: 'DELETE',
                headers: encabezadosSesion()
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
        const url = idCita ? `/app/cita/${idCita}` : '/app/cita';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('sesionToken') || ''}` },
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
            const response = await fetch('/app/empleado');
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

    // Módulos clínicos integrados en la misma ventana de administración.
    const modalEntidad = document.getElementById('modal-entidad');
    const formEntidad = document.getElementById('form-entidad');
    const camposEntidad = document.getElementById('campos-entidad');
    const entidadTitulo = document.getElementById('modal-entidad-titulo');
    const entidadModulo = document.getElementById('modal-entidad-modulo');
    const entidadMensaje = document.getElementById('entidad-mensaje');
    let entidadActual = null;
    let entidadEditandoId = null;

    const configuracionEntidades = {
        empleado: {
            etiqueta: 'Empleado', ruta: 'empleado', lista: 'empleados', id: 'idEmpleado', tbody: 'tbody-empleados',
            campos: [['nombre', 'Nombre', 'text', true], ['apellido', 'Apellido', 'text', true], ['documento', 'Documento', 'text', true], ['rol', 'Rol', 'text', true], ['especialidad', 'Especialidad', 'text', true], ['telefono', 'Teléfono', 'tel', true], ['email', 'Correo electrónico', 'email', true], ['usuario', 'Usuario', 'text', true], ['PASSWORD', 'Contraseña', 'password', true]],
            columnas: [['idEmpleado'], ['nombre'], ['apellido'], ['documento'], ['rol'], ['especialidad'], ['telefono'], ['email'], ['usuario']]
        },
        producto: {
            etiqueta: 'Producto', ruta: 'producto', lista: 'productos', id: 'idProducto', tbody: 'tbody-productos',
            campos: [['nombre', 'Nombre', 'text', true], ['codigoBarra', 'Código de barras', 'text', true], ['precioVenta', 'Precio de venta', 'number', true], ['precioCompra', 'Precio de compra', 'number', true], ['categoria', 'Categoría', 'text', true], ['unidadMedida', 'Unidad de medida', 'text', true], ['fechaVencimiento', 'Fecha de vencimiento', 'date']],
            columnas: [['idProducto'], ['nombre'], ['codigoBarra'], ['precioVenta'], ['precioCompra'], ['categoria'], ['unidadMedida'], ['fechaVencimiento']]
        },
        cliente: {
            etiqueta: 'Cliente', ruta: 'cliente', lista: 'clientes', id: 'idCliente', tbody: 'tbody-clientes',
            campos: [
                ['nombre', 'Nombres', 'text', true], ['apellido', 'Apellidos', 'text', true], ['documentoIdentidad', 'Documento', 'text', true], ['fechaNacimiento', 'Fecha de nacimiento', 'date', true], ['genero', 'Género', 'select', true, false, [['Masculino', 'Masculino'], ['Femenino', 'Femenino'], ['Otro', 'Otro']]], ['telefono', 'Teléfono', 'text', true], ['correo', 'Correo electrónico', 'email', true], ['direccion', 'Dirección', 'text', true, true]
            ],
            columnas: [['idCliente'], ['nombre', item => `${item.nombre || ''} ${item.apellido || ''}`], ['documentoIdentidad'], ['telefono'], ['correo']]
        },
        tratamiento: {
            etiqueta: 'Tratamiento', ruta: 'tratamiento', lista: 'tratamientos', id: 'idTratamiento', tbody: 'tbody-tratamientos',
            campos: [['nombre', 'Nombre', 'text', true], ['categoria', 'Categoría', 'text'], ['costo', 'Costo (COP)', 'number', true], ['duracionMinutos', 'Duración (minutos)', 'number'], ['activo', 'Estado', 'select', false, false, [['1', 'Activo'], ['0', 'Inactivo']]], ['descripcion', 'Descripción', 'textarea', false, true]],
            columnas: [['idTratamiento'], ['nombre'], ['categoria'], ['costo', item => `$${Number(item.costo || 0).toLocaleString('es-CO')}`], ['duracionMinutos', item => item.duracionMinutos ? `${item.duracionMinutos} min` : ''], ['activo', item => Number(item.activo) ? 'Activo' : 'Inactivo']]
        },
        equipo: {
            etiqueta: 'Equipo odontológico', ruta: 'equipo-odontologico', lista: 'equipos', id: 'idEquipo', tbody: 'tbody-equipos',
            campos: [['nombre', 'Nombre del equipo', 'text', true], ['tipo', 'Tipo', 'text', true], ['marca', 'Marca', 'text'], ['modelo', 'Modelo', 'text'], ['serial', 'Número de serie', 'text'], ['estado', 'Estado', 'select', false, false, [['Disponible', 'Disponible'], ['En mantenimiento', 'En mantenimiento'], ['Fuera de servicio', 'Fuera de servicio']]], ['ubicacion', 'Ubicación', 'text'], ['fechaAdquisicion', 'Fecha de adquisición', 'date'], ['proximoMantenimiento', 'Próximo mantenimiento', 'date'], ['observaciones', 'Observaciones', 'textarea', false, true]],
            columnas: [['idEquipo'], ['nombre'], ['tipo'], ['marca'], ['serial'], ['estado'], ['ubicacion']]
        }
    };

    document.querySelectorAll('[data-entity-new]').forEach(button => button.addEventListener('click', () => { if (puedeCrearCitas) abrirEntidad(button.dataset.entityNew); }));
    document.querySelectorAll('[data-entity-close]').forEach(button => button.addEventListener('click', cerrarEntidad));
    if (modalEntidad) modalEntidad.addEventListener('click', event => { if (event.target === modalEntidad) cerrarEntidad(); });
    if (formEntidad) formEntidad.addEventListener('submit', guardarEntidad);

    function campoEntidad(campo, valor = '') {
        const [nombre, etiqueta, tipo = 'text', requerido = false, anchoCompleto = false, opciones = []] = campo;
        const clase = anchoCompleto ? ' class="full-width"' : '';
        let control;
        if (tipo === 'textarea') control = `<textarea name="${nombre}" rows="3">${escapeHtml(valor)}</textarea>`;
        else if (tipo === 'select') control = `<select name="${nombre}">${opciones.map(([v, texto]) => `<option value="${v}" ${String(v) === String(valor) ? 'selected' : ''}>${texto}</option>`).join('')}</select>`;
        else control = `<input type="${tipo}" name="${nombre}" value="${escapeHtml(tipo === 'date' && valor ? String(valor).slice(0, 10) : valor)}" ${requerido ? 'required' : ''}>`;
        return `<label${clase}>${etiqueta}${control}</label>`;
    }

    function filtrarVistaActual() {
        const vistaActiva = document.querySelector('.admin-content.active');
        if (!vistaActiva || !adminSearch) return;

        const termino = adminSearch.value.trim().toLocaleLowerCase('es-CO');
        const filas = vistaActiva.querySelectorAll('.data-table-body .data-row');

        filas.forEach(fila => {
            const esMensaje = filas.length === 1 && !fila.querySelector('.main-text, .row-actions');
            if (esMensaje) return;
            const coincide = !termino || fila.textContent.toLocaleLowerCase('es-CO').includes(termino);
            fila.hidden = !coincide;
        });
    }

    async function abrirNovedades() {
        if (novedadesFecha) {
            novedadesFecha.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (novedadesSummary) novedadesSummary.innerHTML = '<p>Cargando novedades de la clínica...</p>';
        abrirModal(novedadesModal);

        try {
            const [respuestaCitas, respuestaEquipos] = await Promise.all([
                fetch('/app/cita', { headers: encabezadosSesion() }),
                fetch('/app/equipo-odontologico')
            ]);
            if (!respuestaCitas.ok || !respuestaEquipos.ok) throw new Error('No se pudieron obtener las novedades.');
            const datosCitas = await respuestaCitas.json();
            const datosEquipos = await respuestaEquipos.json();
            const hoy = new Date().toISOString().slice(0, 10);
            const citas = datosCitas.citas || [];
            const equipos = datosEquipos.equipos || [];
            const citasHoy = citas.filter(cita => String(cita.fecha).slice(0, 10) === hoy && cita.estado !== 'Cancelada').length;
            const enMantenimiento = equipos.filter(equipo => equipo.estado === 'En mantenimiento').length;
            const fueraServicio = equipos.filter(equipo => equipo.estado === 'Fuera de servicio').length;

            if (novedadesSummary) {
                novedadesSummary.innerHTML = `
                    <div class="novedad-stat"><strong>${citasHoy}</strong><span>Citas activas hoy</span></div>
                    <div class="novedad-stat"><strong>${enMantenimiento}</strong><span>Equipos en mantenimiento</span></div>
                    <div class="novedad-stat ${fueraServicio ? 'is-alert' : ''}"><strong>${fueraServicio}</strong><span>Equipos fuera de servicio</span></div>`;
            }
        } catch (error) {
            console.warn('No fue posible cargar novedades:', error);
            if (novedadesSummary) novedadesSummary.innerHTML = '<p class="novedades-error">No fue posible actualizar los indicadores. Revisa la conexión con el servidor.</p>';
        }
    }

    async function abrirNovedadesActualizadas() {
        if (formNovedad) formNovedad.hidden = true;
        if (novedadesFecha) novedadesFecha.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (novedadesSummary) novedadesSummary.innerHTML = '<p>Cargando indicadores...</p>';
        if (novedadesList) novedadesList.innerHTML = '<p>Cargando publicaciones...</p>';
        abrirModal(novedadesModal);

        try {
            const [respuestaCitas, respuestaEquipos, respuestaNovedades] = await Promise.all([
                fetch('/app/cita', { headers: encabezadosSesion() }),
                fetch('/app/equipo-odontologico'),
                fetch('/app/novedad')
            ]);
            if (!respuestaCitas.ok || !respuestaEquipos.ok || !respuestaNovedades.ok) throw new Error('No se pudieron cargar las novedades.');
            const datosCitas = await respuestaCitas.json();
            const datosEquipos = await respuestaEquipos.json();
            const datosNovedades = await respuestaNovedades.json();
            const hoy = new Date().toISOString().slice(0, 10);
            const citasHoy = (datosCitas.citas || []).filter(cita => String(cita.fecha).slice(0, 10) === hoy && cita.estado !== 'Cancelada').length;
            const equipos = datosEquipos.equipos || [];
            const enMantenimiento = equipos.filter(equipo => equipo.estado === 'En mantenimiento').length;
            const fueraServicio = equipos.filter(equipo => equipo.estado === 'Fuera de servicio').length;
            if (novedadesSummary) novedadesSummary.innerHTML = `<div class="novedad-stat"><strong>${citasHoy}</strong><span>Citas activas hoy</span></div><div class="novedad-stat"><strong>${enMantenimiento}</strong><span>Equipos en mantenimiento</span></div><div class="novedad-stat ${fueraServicio ? 'is-alert' : ''}"><strong>${fueraServicio}</strong><span>Equipos fuera de servicio</span></div>`;
            mostrarNovedades(datosNovedades.novedades || []);
        } catch (error) {
            if (novedadesSummary) novedadesSummary.innerHTML = '<p class="novedades-error">No fue posible actualizar los indicadores.</p>';
            if (novedadesList) novedadesList.innerHTML = '<p class="novedades-error">No fue posible cargar las publicaciones.</p>';
        }
    }

    function obtenerEmpleadoSesion() {
        try { return JSON.parse(sessionStorage.getItem('empleado') || 'null'); }
        catch { return null; }
    }

    function esAdministracion(rol) {
        return String(rol || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'administracion';
    }

    function mostrarNovedades(novedades) {
        if (!novedadesList) return;
        if (!novedades.length) {
            novedadesList.innerHTML = '<p>No hay novedades publicadas.</p>';
            return;
        }
        novedadesList.innerHTML = novedades.map(novedad => `<article class="novedad-item"><span class="novedad-icon">📢</span><div><h4>${escapeHtml(novedad.titulo)}</h4><p>${escapeHtml(novedad.descripcion)}</p><p><small>Publicado por ${escapeHtml(novedad.autor || 'Administración')}</small></p></div></article>`).join('');
    }

    function mostrarFormularioNovedad() {
        if (!puedePublicarNovedades || !formNovedad) return;
        formNovedad.hidden = false;
        mostrarMensaje(novedadMensaje, '', false);
        novedadTitulo.focus();
    }

    async function publicarNovedad(event) {
        event.preventDefault();
        if (!empleadoSesion?.idEmpleado || !puedePublicarNovedades) return;
        mostrarMensaje(novedadMensaje, 'Publicando...', false);
        try {
            const response = await fetch('/app/novedad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('sesionToken') || ''}` },
                body: JSON.stringify({ titulo: novedadTitulo.value.trim(), descripcion: novedadDescripcion.value.trim() })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.mensaje || 'No fue posible publicar la novedad.');
            formNovedad.reset();
            mostrarMensaje(novedadMensaje, 'Novedad publicada.', false);
            formNovedad.hidden = true;
            await abrirNovedadesActualizadas();
        } catch (error) {
            mostrarMensaje(novedadMensaje, error.message, true);
        }
    }

    function abrirEntidad(nombreEntidad, datos = null) {
        entidadActual = configuracionEntidades[nombreEntidad];
        entidadEditandoId = datos ? datos[entidadActual.id] : null;
        if (!entidadActual || !camposEntidad) return;
        entidadModulo.textContent = entidadActual.etiqueta;
        entidadTitulo.textContent = entidadEditandoId ? `Editar ${entidadActual.etiqueta.toLowerCase()}` : `Nuevo ${entidadActual.etiqueta.toLowerCase()}`;
        camposEntidad.innerHTML = entidadActual.campos.map(campo => campoEntidad(campo, datos?.[campo[0]] ?? '')).join('');
        mostrarMensaje(entidadMensaje, '', false);
        abrirModal(modalEntidad);
    }

    function cerrarEntidad() {
        entidadActual = null;
        entidadEditandoId = null;
        if (formEntidad) formEntidad.reset();
        cerrarModal(modalEntidad);
    }

    async function cargarEntidad(nombreEntidad) {
        const config = configuracionEntidades[nombreEntidad];
        const tbody = document.getElementById(config.tbody);
        setLoading(tbody, 'Cargando datos...');
        try {
            const response = await fetch(`/app/${config.ruta}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const lista = Array.isArray(data) ? data : (data[config.lista] || []);
            if (!lista.length) { tbody.innerHTML = '<div class="data-row">No hay registros.</div>'; return; }
            tbody.innerHTML = lista.map(item => `<div class="data-row">${config.columnas.map(([campo, formato]) => `<div><div class="main-text">${escapeHtml(formato ? formato(item) : item[campo] || '')}</div></div>`).join('')}<div>${puedeCrearCitas ? `<div class="row-actions">${botonEditar(`data-editar="${item[config.id]}"`)}${botonEliminar(`data-eliminar="${item[config.id]}"`)}</div>` : '<span class="action-restricted">Sin permisos</span>'}</div></div>`).join('');
            tbody.querySelectorAll('[data-editar]').forEach(button => button.addEventListener('click', () => abrirEntidad(nombreEntidad, lista.find(item => String(item[config.id]) === button.dataset.editar))));
            tbody.querySelectorAll('[data-eliminar]').forEach(button => button.addEventListener('click', () => eliminarEntidad(nombreEntidad, button.dataset.eliminar)));
        } catch (error) {
            console.error(`Error al cargar ${nombreEntidad}:`, error);
            tbody.innerHTML = '<div class="data-row">Error al cargar los datos desde la base de datos.</div>';
        }
    }

    const cargarClientes = () => cargarEntidad('cliente');
    const cargarTratamientos = () => cargarEntidad('tratamiento');
    const cargarEquipos = () => cargarEntidad('equipo');

    async function guardarEntidad(event) {
        event.preventDefault();
        if (!entidadActual) return;
        const datos = Object.fromEntries(new FormData(formEntidad));
        ['costo', 'duracionMinutos'].forEach(campo => { if (campo in datos && datos[campo] !== '') datos[campo] = Number(datos[campo]); });
        const url = `/app/${entidadActual.ruta}${entidadEditandoId ? `/${entidadEditandoId}` : ''}`;
        try {
            const response = await fetch(url, { method: entidadEditandoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...encabezadosSesion() }, body: JSON.stringify(datos) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensaje || `HTTP ${response.status}`);
            mostrarMensaje(entidadMensaje, data.mensaje || 'Registro guardado correctamente.', false);
            if (entidadActual === configuracionEntidades.empleado) await cargarEmpleados();
            else if (entidadActual === configuracionEntidades.producto) await cargarProductos();
            else await cargarEntidad(entidadActual === configuracionEntidades.cliente ? 'cliente' : entidadActual === configuracionEntidades.tratamiento ? 'tratamiento' : 'equipo');
            setTimeout(cerrarEntidad, 350);
        } catch (error) { mostrarMensaje(entidadMensaje, error.message || 'No fue posible guardar el registro.', true); }
    }

    async function eliminarEntidad(nombreEntidad, id) {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        const config = configuracionEntidades[nombreEntidad];
        try {
            const response = await fetch(`/app/${config.ruta}/${id}`, { method: 'DELETE', headers: encabezadosSesion() });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.mensaje || `HTTP ${response.status}`);
            await cargarEntidad(nombreEntidad);
        } catch (error) { alert(error.message || 'No fue posible eliminar el registro.'); }
    }

    activarVista('agenda');
});
