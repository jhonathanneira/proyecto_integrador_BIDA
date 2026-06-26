// Asegura que se cargue el contenido HTML antes de ejecutar el codigo
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginform');
  const mensajeDiv = document.getElementById('mensaje');

  if (!form || !mensajeDiv) {
    console.error('No se encontraron los elementos del formulario de login.');
    return;
  }

  // Escuchamos el envio del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtenemos los datos del usuario
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validacion basica de campos vacios
    if (!username || !password) {
      mensajeDiv.textContent = 'Por favor, complete todos los campos.';
      mensajeDiv.style.color = 'red';
      return;
    }

    const API_URL = 'http://localhost:3000/app/empleado/login';

    try {
      // Enviar datos al servidor usando fetch
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Guarda el usuario logueado en sessionStorage
        sessionStorage.setItem('empleado', JSON.stringify(data.user));
        mensajeDiv.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
        mensajeDiv.style.color = 'green';

        // Redirigir a la pagina de administracion
        window.location.href = 'administracion.html';
      } else {
        mensajeDiv.textContent = data.mensaje || 'Error al iniciar sesión.';
        mensajeDiv.style.color = 'red';
      }
    } catch (error) {
      console.error('Error en la solicitud de inicio de sesión:', error);
      mensajeDiv.textContent = 'Error en la solicitud de inicio de sesión. Por favor, inténtelo de nuevo.';
      mensajeDiv.style.color = 'red';
    }
  });
});
