document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevenir el envío por defecto

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Lógica básica de validación (puedes expandir esto)
    if (username && password) {
        alert('Inicio de sesión exitoso para: ' + username);
        // Redirigir a la página de administración
        window.location.href = 'administracion.html';
    } else {
        alert('Por favor, complete todos los campos.');
    }
});