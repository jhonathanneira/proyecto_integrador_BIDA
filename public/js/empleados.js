document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');
    const modalEditar = document.getElementById('modal-editar-empleado');
    const modalEliminar = document.getElementById('modal-eliminar-empleado');
    const formEditar = document.getElementById('form-editar-empleado');
    const mensajeEditar = document.getElementById('editar-mensaje');
    const inputIdEmpleado = document.getElementById('editar-id-empleado');
    const inputNombre = document.getElementById('editar-nombre');
    const inputRol = document.getElementById('editar-rol');
    const inputUsuario = document.getElementById('editar-usuario');
    const inputPassword = document.getElementById('editar-password');
    const textoEliminar = document.getElementById('eliminar-texto');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    let empleadoPendienteEliminar = null;

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('empleado');
            window.location.href = '../WEB Y APP/BIDA_Inicio de sesion_login.html';
        });
    }

    document.querySelectorAll('[data-modal-close]').forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-modal-close');
            if (target === 'editar') cerrarModal(modalEditar, formEditar, mensajeEditar);
            if (target === 'eliminar') cerrarModal(modalEliminar);
        });
    });

    if (modalEditar) {
        modalEditar.addEventListener('click', event => {
            if (event.target === modalEditar) {
                cerrarModal(modalEditar, formEditar, mensajeEditar);
            }
        });
    }

    if (modalEliminar) {
        modalEliminar.addEventListener('click', event => {
            if (event.target === modalEliminar) {
                cerrarModal(modalEliminar);
            }
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', async event => {
            event.preventDefault();

            const idEmpleado = inputIdEmpleado.value;
            const nombre = inputNombre.value.trim();
            const rol = inputRol.value.trim();
            const usuario = inputUsuario.value.trim();
            const password = inputPassword.value.trim();

            if (!idEmpleado || !nombre || !rol || !usuario) {
                mostrarMensaje(mensajeEditar, 'Completa los campos obligatorios.', true);
                return;
            }

            const payload = { nombre, rol, usuario };
            if (password) {
                payload.password = password;
            }

            try {
                const response = await fetch(`http://localhost:3000/app/empleado/${idEmpleado}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.mensaje || `HTTP ${response.status}`);
                }

                mostrarMensaje(mensajeEditar, data.mensaje || 'Empleado actualizado correctamente.', false);
                setTimeout(() => {
                    cerrarModal(modalEditar, formEditar, mensajeEditar);
                    cargarEmpleados();
                }, 400);
            } catch (error) {
                console.error('Error al actualizar empleado:', error);
                mostrarMensaje(mensajeEditar, error.message || 'No fue posible actualizar el empleado.', true);
            }
        });
    }

    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async () => {
            if (!empleadoPendienteEliminar) return;

            try {
                const response = await fetch(`http://localhost:3000/app/empleado/${empleadoPendienteEliminar}`, {
                    method: 'DELETE'
                });

                if (!response.ok && response.status !== 204) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.mensaje || `HTTP ${response.status}`);
                }

                empleadoPendienteEliminar = null;
                cerrarModal(modalEliminar);
                cargarEmpleados();
            } catch (error) {
                console.error('Error al eliminar empleado:', error);
                if (textoEliminar) {
                    textoEliminar.textContent = error.message || 'Ocurrió un error al eliminar el empleado.';
                }
            }
        });
    }

    cargarEmpleados();

    function cargarEmpleados() {
        const tbody = document.getElementById('tbody-empleados');

        if (!tbody) {
            console.error('No se encontró el contenedor tbody-empleados.');
            return;
        }

        tbody.innerHTML = '<div class="data-row">Cargando datos...</div>';

        fetch('http://localhost:3000/app/empleado')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                return res.json();
            })
            .then(data => {
                const lista = Array.isArray(data) ? data : (data.empleados || []);

                if (lista.length === 0) {
                    tbody.innerHTML = '<div class="data-row">No hay empleados registrados.</div>';
                    return;
                }

                tbody.innerHTML = lista.map(empleado => renderFilaEmpleado(empleado)).join('');
            })
            .catch(err => {
                console.error('Error al cargar empleados:', err);
                tbody.innerHTML = '<div class="data-row">Error al cargar empleados desde la base de datos.</div>';
            });
    }

    window.editarEmpleado = function editarEmpleado(idEmpleado) {
        const fila = obtenerFilaEmpleado(idEmpleado);
        if (!fila || !modalEditar || !formEditar) return;

        inputIdEmpleado.value = idEmpleado;
        inputNombre.value = fila.nombre || '';
        inputRol.value = fila.rol || '';
        inputUsuario.value = fila.usuario || '';
        inputPassword.value = '';
        mostrarMensaje(mensajeEditar, '', false);
        abrirModal(modalEditar);
    };

    window.eliminarEmpleado = async function eliminarEmpleado(idEmpleado) {
        empleadoPendienteEliminar = idEmpleado;
        if (textoEliminar) {
            const fila = obtenerFilaEmpleado(idEmpleado);
            textoEliminar.textContent = fila
                ? `¿Seguro que deseas eliminar a ${fila.nombre || 'este empleado'} ${fila.apellido || ''}? Esta acción no se puede deshacer.`
                : `¿Seguro que deseas eliminar el empleado ${idEmpleado}? Esta acción no se puede deshacer.`;
        }
        abrirModal(modalEliminar);
    };

    function abrirModal(modal) {
        if (!modal) return;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function cerrarModal(modal, form, mensaje) {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        if (form) form.reset();
        if (mensaje) mostrarMensaje(mensaje, '', false);
        if (modal === modalEliminar) {
            empleadoPendienteEliminar = null;
            if (textoEliminar) {
                textoEliminar.textContent = '¿Seguro que deseas eliminar este empleado?';
            }
        }
    }

    function mostrarMensaje(elemento, texto, esError) {
        if (!elemento) return;
        elemento.textContent = texto;
        elemento.style.color = esError ? '#b91c1c' : '#15803d';
    }

    function obtenerFilaEmpleado(idEmpleado) {
        const fila = document.querySelector(`[data-empleado-id="${idEmpleado}"]`);
        if (!fila) return null;

        return {
            nombre: fila.dataset.nombre || '',
            apellido: fila.dataset.apellido || '',
            usuario: fila.dataset.usuario || '',
            rol: fila.dataset.rol || ''
        };
    }

    function renderFilaEmpleado(empleado) {
        return `
            <div class="data-row" data-empleado-id="${empleado.idEmpleado ?? ''}" data-nombre="${escapeHtml(empleado.nombre ?? '')}" data-apellido="${escapeHtml(empleado.apellido ?? '')}" data-usuario="${escapeHtml(empleado.usuario ?? '')}" data-rol="${escapeHtml(empleado.rol ?? '')}">
                <div><div class="main-text">${empleado.idEmpleado ?? ''}</div></div>
                <div><div class="main-text">${empleado.nombre ?? ''}</div></div>
                <div><div class="main-text">${empleado.apellido ?? ''}</div></div>
                <div><div class="main-text">${empleado.documento ?? ''}</div></div>
                <div><div class="main-text">${empleado.rol ?? ''}</div></div>
                <div><div class="main-text">${empleado.especialidad ?? ''}</div></div>
                <div><div class="main-text">${empleado.telefono ?? ''}</div></div>
                <div><div class="main-text">${empleado.email ?? ''}</div></div>
                <div><div class="main-text">${empleado.usuario ?? ''}</div></div>
                <div>
                    <div class="row-actions">
                        <button class="btn-action edit" type="button" onclick="editarEmpleado(${empleado.idEmpleado})">Editar</button>
                        <button class="btn-action delete" type="button" onclick="eliminarEmpleado(${empleado.idEmpleado})">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
});