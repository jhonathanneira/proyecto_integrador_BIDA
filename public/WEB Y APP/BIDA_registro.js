document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir el envío por defecto

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validación básica
    if (nombre && apellido && email && telefono && password && confirmPassword) {
        if (password === confirmPassword) {
            alert('Registro exitoso para: ' + nombre + ' ' + apellido);
            // Aquí puedes enviar los datos a un servidor o redirigir
        } else {
            alert('Las contraseñas no coinciden.');
        }
    } else {
        alert('Por favor, complete todos los campos.');
    }
});