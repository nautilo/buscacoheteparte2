let username;
let activeProfile;

document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    username = urlParams.get('username');
    activeProfile = urlParams.get('profile');

    if (!username || !activeProfile) {
        console.error("Username or profile is missing from URL parameters.");
        return; // Salir si no hay datos suficientes
    }

    // Mostrar el nombre de usuario y el nombre del perfil
    const profileNameElement = document.getElementById('profileName');
    profileNameElement.textContent = `Perfil: ${activeProfile}, Usuario: ${username}`;

    // Mostrar las URLs bloqueadas
    await showBlockedUrls(username, activeProfile);

    // Agregar un evento al formulario para bloquear una nueva URL
    const addBlockedUrlForm = document.getElementById('addBlockedUrlForm');
    addBlockedUrlForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Evitar que se envíe el formulario

        const blockedUrlInput = document.getElementById('blockedUrlInput').value;
        try {
            await blockWebsite(username, activeProfile, blockedUrlInput); // Bloquear la URL
            await showBlockedUrls(username, activeProfile); // Actualizar la lista de URLs bloqueadas
        } catch (error) {
            console.error("Error al bloquear la URL:", error);
            alert("Error al bloquear la URL. Inténtalo de nuevo más tarde.");
        }
    });

    // Mostrar el historial de navegación
    await showNavigationHistory(username, activeProfile);

    // Event listener para mostrar la sección de nuevo perfil
    const addProfileButton = document.getElementById('addProfileButton');
    addProfileButton.addEventListener('click', function () {
        const newProfileSection = document.getElementById('newProfileSection');
        newProfileSection.style.display = 'block';
    });

    // Event listener para crear un nuevo perfil de navegación
    const addNavigationProfileButton = document.getElementById('addNavigationProfileButton');
    addNavigationProfileButton.addEventListener('click', async function () {
        const profileNameInput = document.getElementById('profileNameInput').value;
        const profilePasswordInput = document.getElementById('profilePasswordInput').value;
        const profileAvatarURL = document.getElementById('profileAvatarURL').value;

        try {
            await createNavigationProfile(profileNameInput, profilePasswordInput, profileAvatarURL);
        } catch (error) {
            const profileError = document.getElementById('profileError');
            profileError.textContent = "Error al crear el perfil de navegación. Inténtalo de nuevo más tarde.";
            console.error("Error al crear el perfil de navegación:", error);
        }
    });
});

// Función para crear un nuevo perfil de navegación
async function createNavigationProfile(profileName, password, avatarURL) {
    try {
        const response = await fetch(`http://localhost:3000/create-navigation-profile/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileName, password, avatarURL })
        });
        const data = await response.json();
        if (data.success) {
            console.log("Perfil de navegación creado exitosamente.");
            alert("Perfil de navegación creado exitosamente.");
            // Aquí puedes actualizar la lista de perfiles o realizar cualquier otra acción necesaria
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al crear el perfil de navegación:", error);
        throw error;
    }
}

// Función para mostrar las URLs bloqueadas
async function showBlockedUrls(username, profileName) {
    const blockedUrlsList = document.getElementById('blockedUrlsList');
    blockedUrlsList.innerHTML = ""; // Limpiar la lista antes de mostrar las URLs

    try {
        const blockedUrls = await getBlockedUrls(username, profileName);
        blockedUrls.forEach(url => {
            const urlItem = document.createElement('li');
            urlItem.textContent = url;

            // Botón para desbloquear la URL
            const unblockButton = document.createElement('button');
            unblockButton.textContent = "Desbloquear";
            unblockButton.className = "unblock-button btn-primary"; // Agregar clase para el botón
            unblockButton.addEventListener('click', async function () {
                try {
                    await unblockWebsite(username, profileName, url); // Desbloquear la URL
                    await showBlockedUrls(username, profileName); // Actualizar la lista de URLs bloqueadas
                } catch (error) {
                    console.error("Error al desbloquear la URL:", error);
                    alert("Error al desbloquear la URL. Inténtalo de nuevo más tarde.");
                }
            });

            urlItem.appendChild(document.createTextNode(' ')); // Agregar espacio entre texto y botón
            urlItem.appendChild(unblockButton);
            blockedUrlsList.appendChild(urlItem);
        });
    } catch (error) {
        console.error("Error al obtener las URLs bloqueadas:", error);
        alert("Error al obtener las URLs bloqueadas. Inténtalo de nuevo más tarde.");
    }
}

async function blockWebsite(username, profileName, websiteUrl) {
    try {
        // Primero, obtener las URLs bloqueadas para verificar si la URL ya está bloqueada
        const blockedUrls = await getBlockedUrls(username, profileName);
        if (blockedUrls.includes(websiteUrl)) {
            alert("Esta URL ya está bloqueada.");
            return false; // Detener la ejecución si la URL ya está bloqueada
        }
  
        // Si la URL no está bloqueada, proceder a bloquearla
        const response = await fetch(`http://localhost:3000/block-website/${username}/${profileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ websiteUrl: websiteUrl })
        });
        const data = await response.json();
        if (data.success) {
            console.log("URL bloqueada exitosamente.");
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al bloquear la URL:", error);
        throw error;
    }
  }


// Función para obtener las URLs bloqueadas
async function getBlockedUrls(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/get-blocked-urls/${username}/${profileName}`);
        const data = await response.json();
        if (data.success) {
            return data.blockedUrls;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al obtener las URLs bloqueadas del backend:", error);
        throw error;
    }
}

// Función para agregar una visita al historial de navegación
async function addNavigationHistory(username, profileName, title, url) {
    try {
        const response = await fetch(`http://localhost:3000/add-navigation-history/${username}/${profileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: title, url: url })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al agregar la visita al historial de navegación:", error);
    }
}




// Función para desbloquear una URL


// Función para mostrar el historial de navegación
// Función para mostrar el historial de navegación con paginación
// Función para mostrar el historial de navegación con paginación
// Función para mostrar el historial de navegación con paginación
async function showNavigationHistory(username, profileName, page = 1, pageSize = 10) {
    const navigationHistoryContainer = document.getElementById('navigationHistoryContainer');
    navigationHistoryContainer.innerHTML = ""; // Limpiar el contenedor antes de mostrar nuevos resultados

    try {
        const navigationHistory = await fetchNavigationHistory(username, profileName);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedItems = navigationHistory.slice(startIndex, endIndex);

        if (paginatedItems.length > 0) {
            const historyList = document.createElement('ul');
            paginatedItems.forEach(visit => {
                const listItem = document.createElement('li');
                const visitLink = document.createElement('a');
                visitLink.href = visit.url;
                // Cambio aquí: usar new URL para obtener el hostname y mostrarlo
                visitLink.textContent = new URL(visit.url).hostname; // Muestra el dominio en lugar del título
                visitLink.target = "_blank";
                listItem.appendChild(visitLink);
                historyList.appendChild(listItem);
            });
            navigationHistoryContainer.appendChild(historyList);
        } else {
            const noHistoryMessage = document.createElement('p');
            noHistoryMessage.textContent = "No hay historial de navegación para este perfil en la página actual.";
            navigationHistoryContainer.appendChild(noHistoryMessage);
        }

        // Agregar controles de paginación
        addPaginationControls(page, Math.ceil(navigationHistory.length / pageSize));
    } catch (error) {
        console.error("Error al mostrar el historial de navegación:", error);
        alert("Error al mostrar el historial de navegación. Inténtalo de nuevo más tarde.");
    }
}

// Función para agregar controles de paginación
function addPaginationControls(currentPage, totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = ""; // Limpiar controles de paginación existentes

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => showNavigationHistory(username, activeProfile, i);
        if (i === currentPage) {
            pageButton.disabled = true; // Desactivar el botón de la página actual
        }
        paginationContainer.appendChild(pageButton);
    }
}

// Función para obtener el historial de navegación
async function fetchNavigationHistory(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/get-navigation-history/${username}/${profileName}`);
        const data = await response.json();
        if (data.success) {
            return data.navigationHistory;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al obtener el historial de navegación del backend:", error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
      searchButton.addEventListener('click', buscarUrls);
    }
  });
  
  function buscarUrls() {
    const tema = document.getElementById('searchInput').value;
    fetch('http://localhost:5000/buscar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tema: tema })
    })
    .then(response => response.json())
    .then(data => {
      mostrarResultados(data.urls_encontradas);
    })
    .catch(error => console.error('Error:', error));
  }
  
  function mostrarResultados(urls) {
    const container = document.getElementById('searchResults');
    container.innerHTML = ''; // Limpiar resultados anteriores
    urls.forEach(url => {
        const element = document.createElement('div');
        element.innerHTML = `<h4>${url.titulo}</h4><p>${url.descripcion}</p><a href="${url.url}" target="_blank">Visitar</a>`;
        
        // Crear botón de bloqueo
        const blockButton = document.createElement('button');
        blockButton.textContent = 'Bloquear';
        blockButton.onclick = () => enviarYBloquear(url.url); // Función para bloquear la URL
        
        element.appendChild(blockButton);
        container.appendChild(element);
    });
}

function enviarYBloquear(urlCompleta) {
    // Extraer solo el dominio de la URL
    const urlObj = new URL(urlCompleta);
    const dominio = urlObj.hostname; // Esto obtendrá 'example.com' de 'https://example.com/path'

    // Establecer el valor del input con el dominio
    const input = document.getElementById('blockedUrlInput');
    input.value = dominio;

    // Simular un click en el botón de bloqueo
    const blockButton = document.getElementById('bloquearUrlBtn'); // Asegúrate de que el ID del botón sea correcto
    blockButton.click();

    // Limpiar el input después de enviar la URL para bloqueo
    input.value = '';
}

async function blockWebsite(username, profileName, websiteUrl) {
    try {
        // Primero, obtener las URLs bloqueadas para verificar si la URL ya está bloqueada
        const blockedUrls = await getBlockedUrls(username, profileName);
        if (blockedUrls.includes(websiteUrl)) {
            alert("Esta URL ya está bloqueada.");
            return false; // Detener la ejecución si la URL ya está bloqueada
        }
  
        // Si la URL no está bloqueada, proceder a bloquearla
        const response = await fetch(`http://localhost:3000/block-website/${username}/${profileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ websiteUrl: websiteUrl })
        });
        const data = await response.json();
        if (data.success) {
            console.log("URL bloqueada exitosamente.");
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al bloquear la URL:", error);
        throw error;
    }
  }

// Función para desbloquear una URL
async function unblockWebsite(username, profileName, websiteUrl) {
  try {
      const response = await fetch(`http://localhost:3000/unblock-website/${username}/${profileName}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ websiteUrl: websiteUrl })
      });
      const data = await response.json();
      if (data.success) {
          console.log("URL desbloqueada exitosamente.");
          return true;
      } else {
          throw new Error(data.message);
      }
  } catch (error) {
      console.error("Error al desbloquear la URL:", error);
      throw error;
  }
}

/// Bloqueo de palabras
function newWord() {
    var word = document.getElementById("new_word").value; 
    chrome.storage.sync.get(null, function(result) { //key is "words" for the array of words 
      var storageArray = result['words']; 
      if (storageArray == null) {
        storageArray = [word]; 
      } else {
        if (!storageArray.includes(word)) {
          //append to the popup
          var ul = document.getElementById("list");
          var listItem = document.createElement("li");
          listItem.textContent = word;
          listItem.id = word; 
          ul.appendChild(listItem); 
          storageArray.push(word); 
        }
      }
      chrome.storage.sync.set({'words': storageArray}, function() {
        console.log('Array is set to ' + storageArray);
      }); //later, make it so that there is no callback function 
    });
  }
  
  function deleteWord() {
    var word = document.getElementById("new_word").value; 
    chrome.storage.sync.get(null, function(result) { //key is "words" for the array of words 
    var storageArray = result['words']; 
    if (storageArray != null && storageArray.includes(word)) {
      var ul = document.getElementById("list");
      var li = document.getElementById(word);
      console.log(ul); 
      console.log(li); 
      ul.removeChild(li); 
      var index = storageArray.indexOf(word); 
      storageArray.splice(index, 1); 
      chrome.storage.sync.set({'words': storageArray}, function() {
        console.log('Array is set to ' + storageArray);
      });
    }
  });
  }
  
  window.onload = function() {
    populateList(); //i think this should be called instead of new word 
    var button = document.getElementById("submit");
    if (button.addEventListener)
      button.addEventListener("click", newWord, false);
    else if (button.attachEvent)
      button.attachEvent('onclick', newWord);
    
    var delete_button = document.getElementById("delete");
    if (delete_button.addEventListener)
      delete_button.addEventListener("click", deleteWord, false);
    else if (delete_button.attachEvent)
      delete_button.attachEvent('onclick', deleteWord);
    
  }
  
  function populateList() { //called at the beginning 
    var ul = document.getElementById("list");
    chrome.storage.sync.get(null, function(result) { //inputting null gets everything in the storage
      var storageArray = result['words']; 
      for (i = 0; i < storageArray.length; i++) {
        var word = storageArray[i]; 
        var listItem = document.createElement("li");
        listItem.textContent = word;
        listItem.id = word; 
        ul.appendChild(listItem);
      }
    });
  }