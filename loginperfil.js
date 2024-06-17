document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    authButton.addEventListener('click', async function() {
      const username = document.getElementById('username').value;
      const profileName = document.getElementById('profileName').value;
      const password = document.getElementById('password').value;
  
      if (!username || !profileName || !password) {
        alert('Por favor, complete todos los campos.');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3000/authenticate-navigation-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, profileName, password })
        });
        const data = await response.json();
        const resultDiv = document.getElementById('result');
        if (data.success) {
          resultDiv.innerHTML = '<div class="alert alert-success" role="alert">Autenticación exitosa</div>';
        } else {
          resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${data.message}</div>`;
        }
      } catch (error) {
        console.error('Error al autenticar el perfil:', error);
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<div class="alert alert-danger" role="alert">Error en el servidor</div>';
      }
    });
  });
  