document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const childLoginForm = document.getElementById('childLoginForm');
  const loginSupervisor = document.getElementById('loginSupervisor');
  const backToChildLogin = document.getElementById('backToChildLogin');
  const supervisorLink = document.getElementById('supervisorLink');
  const backLink = document.getElementById('backLink');
  const childPassword = document.getElementById('childPassword');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const registroLink = document.getElementById('registroLink');
  const despegarButton = document.querySelector('.btndespegar');
  const profileCardsContainer = document.getElementById('profileCards');

  loginSupervisor.addEventListener('click', () => {
      childLoginForm.style.display = 'none';
      loginForm.style.display = 'block';
      supervisorLink.style.display = 'none';
      backLink.style.display = 'block';
      forgotPasswordLink.style.display = 'block';
      registroLink.style.display = 'block';
  });

  backToChildLogin.addEventListener('click', () => {
      childLoginForm.style.display = 'block';
      loginForm.style.display = 'none';
      supervisorLink.style.display = 'block';
      backLink.style.display = 'none';
      forgotPasswordLink.style.display = 'none';
      registroLink.style.display = 'none';
  });

  // Llamar a la función para cargar los perfiles en el combobox
  loadChildProfiles();

  // Evento de click para el botón Despegar
  despegarButton.addEventListener('click', async () => {
      const username = await getCurrentUser();
      const selectedCard = document.querySelector('.card.selected');
      const profileName = selectedCard ? selectedCard.querySelector('.card-title').textContent : null;
      const password = document.getElementById('childPassword').value;

      if (!username || !profileName) {
          alert('Por favor, seleccione un perfil y complete la contraseña si es necesario.');
          return;
      }

      authenticateProfile(username, profileName, password);
  });
});

function showBackLink() {
  // Verificar si ya existe un enlace "Atrás"
  if (!document.getElementById('backToProfilesLink')) {
      const backToProfilesLink = document.createElement('a');
      backToProfilesLink.id = 'backToProfilesLink';
      backToProfilesLink.href = '#';
      backToProfilesLink.innerText = 'Atrás';
      backToProfilesLink.addEventListener('click', () => {
          childPassword.style.display = 'none';
          backToProfilesLink.remove();
          document.querySelectorAll('.card').forEach(card => {
              card.style.display = 'block';
          });
      });
      const profileCardsContainer = document.getElementById('profileCards');
      profileCardsContainer.insertBefore(backToProfilesLink, profileCardsContainer.firstChild);
  }
}

async function loadChildProfiles() {
    const currentUser = await getCurrentUser();
    console.log("Usuario actual:", currentUser);
    if (currentUser) {
        const profiles = await getNavigationProfiles(currentUser);
        const profileCardsContainer = document.getElementById('profileCards');
  
        profiles.forEach(profile => {
            const card = document.createElement('div');
            card.classList.add('card', 'col-md-3', 'm-2');
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                // Ocultar todas las cards
                document.querySelectorAll('.card').forEach(card => {
                    card.style.display = 'none';
                });
                // Mostrar solo la card seleccionada y centrarla
                card.style.display = 'block';
                card.classList.add('selected');
                childPassword.style.display = 'block';
                childPassword.style.margin = '20px auto';
                showBackLink();
            });
  
            const row = document.createElement('div');
            row.classList.add('row', 'g-0');
  
            const colImg = document.createElement('div');
            colImg.classList.add('col-4');
  
            const img = document.createElement('img');
            img.src = profile.avatarURL || './default-profile.png'; // Placeholder para la imagen del perfil
            img.alt = 'Profile Picture';
            img.classList.add('img-fluid', 'rounded-start');
            img.style.height = '60px';
  
            const colBody = document.createElement('div');
            colBody.classList.add('col-8');
  
            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body', 'd-flex', 'align-items-center');
  
            const cardTitle = document.createElement('h5');
            cardTitle.classList.add('card-title', 'mb-0');
            cardTitle.textContent = profile.name;
  
            colImg.appendChild(img);
            cardBody.appendChild(cardTitle);
            colBody.appendChild(cardBody);
            row.appendChild(colImg);
            row.appendChild(colBody);
            card.appendChild(row);
            profileCardsContainer.appendChild(card);
        });
  
        // Agregar card "Entrar como invitado" al final
        const guestCard = document.createElement('div');
        guestCard.classList.add('card', 'col-md-3', 'm-2');
        guestCard.style.cursor = 'pointer';
        guestCard.addEventListener('click', () => {
            // Ocultar todas las cards
            document.querySelectorAll('.card').forEach(card => {
                card.style.display = 'none';
            });
            // Mostrar solo la card seleccionada y centrarla
            guestCard.style.display = 'block';
            guestCard.classList.add('selected');
            childPassword.style.display = 'none';
            showBackLink();
        });
  
        const guestCardBody = document.createElement('div');
        guestCardBody.classList.add('card-body', 'd-flex', 'align-items-center', 'justify-content-center');
  
        const guestCardTitle = document.createElement('h5');
        guestCardTitle.classList.add('card-title', 'mb-0');
        guestCardTitle.textContent = 'Entrar como invitado';
  
        guestCardBody.appendChild(guestCardTitle);
        guestCard.appendChild(guestCardBody);
        profileCardsContainer.appendChild(guestCard);
    } else {
        console.log("No hay un usuario logueado.");
    }
  }
  
async function getCurrentUser() {
  return new Promise((resolve) => {
      chrome.storage.sync.get("currentUser", function(data) {
          console.log("Valor de currentUser en storage:", data.currentUser);
          resolve(data.currentUser);
      });
  });
}

async function saveCurrentUser(username) {
  return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ "currentUser": username }, function() {
          if (chrome.runtime.lastError) {
              console.error("Error al guardar el nombre de usuario:", chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
          } else {
              console.log("Nombre de usuario guardado exitosamente:", username);
              resolve();
          }
      });
  });
}

// Función para obtener los perfiles de navegación existentes
async function getNavigationProfiles(username) {
  try {
      const response = await fetch(`http://localhost:3000/get-navigation-profiles/${username}`);
      const data = await response.json();
      if (data.success) {
          console.log("Perfiles existentes:", data.navigationProfiles); // Agregar para depuración
          return data.navigationProfiles;
      } else {
          throw new Error(data.message);
      }
  } catch (error) {
      console.error("Error al obtener los perfiles de navegación:", error);
      throw error;
  }
}

// Función para autenticar el perfil de navegación
async function authenticateProfile(username, profileName, password) {
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
          window.open(`buscador.html?username=${username}&profile=${profileName}`, '_blank');
          
      } else {
          resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${data.message}</div>`;
      }
  } catch (error) {
      console.error('Error al autenticar el perfil:', error);
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<div class="alert alert-danger" role="alert">Error en el servidor</div>';
  }
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault(); // Evitar el envío del formulario por defecto

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Validar si los campos están vacíos
  if (!username || !password) {
      document.getElementById('result').innerText = "Por favor, complete todos los campos.";
      return;
  }

  fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(async function(data) {
      if (data.success) {
          // Guardar el nombre de usuario en el almacenamiento local
          await saveCurrentUser(username);

          // Suponiendo que obtienes el perfil activo del usuario desde la respuesta del servidor
          const activeProfile = data.activeProfile; // Asegúrate de que el servidor envíe esta información

          // Guardar el perfil activo en el almacenamiento local
          chrome.storage.sync.set({ "activeProfile": activeProfile }, function() {
              console.log("Perfil activo guardado:", activeProfile);
          });

          // Abrir buscador.html en una nueva pestaña si es un usuario supervisado
          if (data.userType === 'supervised') {
              window.open(`buscador.html?username=${username}&profile=${activeProfile}`, '_blank');
          } else {
              // Abrir perfiles.html en una nueva pestaña después de iniciar sesión exitosamente
              window.open(`perfiles.html?user=${username}&currentUser=${username}`, '_blank');
          }
      } else {
          document.getElementById('result').innerText = data.message;
      }
  })
  .catch(error => console.error('Error:', error));
});
