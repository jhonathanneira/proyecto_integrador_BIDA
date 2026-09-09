document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('registroForm');
    const tipo = document.getElementById('tipo');
    const camposCliente = document.getElementById('campos-cliente');
    const camposEmpleado = document.getElementById('campos-empleado');
    const mensaje = document.getElementById('registroMensaje');
    const password = document.getElementById('password');
    const confirmarPassword = document.getElementById('confirmPassword');
    const etiquetasPassword = [document.querySelector('label[for="password"]'), document.querySelector('label[for="confirmPassword"]')];

    function alternarTipoRegistro() {
        const esEmpleado = tipo.value === 'empleado';
        camposCliente.hidden = esEmpleado;
        camposEmpleado.hidden = !esEmpleado;
        etiquetasPassword.forEach(etiqueta => { if (etiqueta) etiqueta.hidden = !esEmpleado; });
        password.hidden = !esEmpleado;
        confirmarPassword.hidden = !esEmpleado;
        password.required = esEmpleado;
        confirmarPassword.required = esEmpleado;
        camposCliente.querySelectorAll('input, select').forEach(campo => { campo.required = !esEmpleado; });
        camposEmpleado.querySelectorAll('input').forEach(campo => { campo.required = esEmpleado; });
        mensaje.textContent = esEmpleado ? 'Las cuentas de Administración se crean únicamente desde Administración.' : '';
        mensaje.style.color = esEmpleado ? '#475569' : '';
    }

    tipo.addEventListener('change', alternarTipoRegistro);
    alternarTipoRegistro();

    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!formulario.checkValidity()) return formulario.reportValidity();

        const datos = Object.fromEntries(new FormData(formulario));
        if (datos.tipo === 'empleado' && datos.password !== datos.confirmPassword) {
            mensaje.textContent = 'Las contraseñas no coinciden.';
            mensaje.style.color = '#b91c1c';
            return;
        }

        mensaje.textContent = 'Registrando...';
        mensaje.style.color = '#475569';
        try {
            const respuesta = await fetch('/app/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const resultado = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok) throw new Error(resultado.mensaje || 'No fue posible completar el registro.');

            formulario.reset();
            alternarTipoRegistro();
            mensaje.textContent = resultado.mensaje;
            mensaje.style.color = '#15803d';
        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.style.color = '#b91c1c';
        }
    });
});
