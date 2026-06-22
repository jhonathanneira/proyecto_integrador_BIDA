
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevenir el envío por defecto

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();


    if (!username || !password) {
        alert('Por favor, complete todos los campos.');
        return;
    }


    const API_URL = 'http://localhost:3000/app/empleado/login'; 

    try {

        // enviar datos al servidor usando fetch
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ usuario:username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // guarda el usuario logueado en sessionStorage o localStorage (sesion de almacenamiento)
            sessionStorage.setItem('empleado', JSON.stringify(data.user));

            alert('Inicio de sesión exitoso para: ' + username);

            // Redirigir a la página de administración
            window.location.href = 'administracion.html';
        } else {
            alert('Error en el inicio de sesión: ' + (data.mensaje || data.message || 'respuesta inválida'));
        }
    } catch (error) {
        console.error('Error en la solicitud de inicio de sesión:', error);
        alert('Ocurrió un error al intentar iniciar sesión. Por favor, inténtelo de nuevo más tarde.');
    }


});