console.log("El script se está ejecutando.");

document.getElementById("resetPasswordForm").addEventListener("submit", function(event) {
  // Evita que el formulario se envíe automáticamente
  event.preventDefault();

  // Obtiene el valor de la nueva contraseña ingresada por el usuario
  var password = document.getElementById("password").value;

  // Si la contraseña no está vacía, envía la solicitud al servidor
  if (password.trim() !== '') {
      enviarDatos(password);
  } else {
      showError("Por favor, ingresa una contraseña.");
  }
});

// Función para mostrar un mensaje de error
function showError(mensaje) {
  var errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = mensaje;

  var resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";
  resultDiv.appendChild(errorDiv);
}

// Función para enviar la solicitud al servidor
function enviarDatos(password) {
  var token = encodeURIComponent(getTokenFromUrl());
  console.log("Token codificado para enviar:", token);

  fetch(`http://localhost:3000/reset-password/${token}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: password }) // Solo enviar la contraseña aquí
  })
  .then(response => {
      console.log("Status de la respuesta:", response.status);
      if (!response.ok) {
          throw new Error('Error al enviar datos al servidor');
      }
      return response.json();
  })
  .then(data => {
      if (data.success) {
          showSuccess(data.message);
      } else {
          showError(data.message);
      }
  })
  .catch(error => {
      console.error('Error al enviar datos al servidor:', error);
      showError('Error al enviar datos al servidor. Inténtalo de nuevo más tarde.');
  });
}

// Función para obtener el token de la URL
function getTokenFromUrl() {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Función para mostrar un mensaje de éxito
function showSuccess(mensaje) {
  var successDiv = document.createElement("div");
  successDiv.className = "success";
  successDiv.textContent = mensaje;

  var resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";
  resultDiv.appendChild(successDiv);
}
