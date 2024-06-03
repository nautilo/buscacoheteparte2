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

    // Fetching navigation data
    fetchNavigationData(username, activeProfile);
});

// Establecer el perfil activo
async function setActiveProfile(profileName) {
    try {
        const response = await fetch(`http://localhost:3000/set-active-navigation-profile/${username}/${profileName}`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            activeProfile = profileName;
            profileNameElement.textContent = `Perfil: ${activeProfile}, Usuario: ${username}`;
            await showNavigationHistory(username, activeProfile); // Actualizar el historial de navegación
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al establecer el perfil activo:", error);
        alert("Error al establecer el perfil activo. Inténtalo de nuevo más tarde.");
    }
}

// Agregar un evento a los enlaces para cambiar el perfil activo
const profileLinks = document.querySelectorAll('.profile-link');
profileLinks.forEach(link => {
    link.addEventListener('click', function (event) {
        event.preventDefault(); // Evitar la acción predeterminada del enlace
        const profileName = this.textContent.trim();
        setActiveProfile(profileName);
    });
});

// Función de debounce para evitar múltiples llamadas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Asegurarse de que addNavigationHistory solo se llama una vez por carga de página
let isHistoryAdded = false;

window.addEventListener('load', debounce(async function () {
    if (!isHistoryAdded) {
        const title = document.title;
        const url = window.location.href;
        await addNavigationHistory(username, activeProfile, title, url);
        isHistoryAdded = true;
    }
}, 500)); // 500 ms de espera para evitar llamadas duplicadas

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
            unblockButton.className = "unblock-button"; // Agregar clase para el botón
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
        alert("Error al agregar la visita al historial de navegación. Inténtalo de nuevo más tarde.");
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
  
  function populateList() { // This function is called at the beginning 
    var ul = document.getElementById("list"); // Get the ul element by its ID

    // Retrieve data from chrome.storage.sync
    chrome.storage.sync.get(null, function(result) { // Passing null gets everything in the storage
        var storageArray = result['words']; // Get the 'words' array from the storage

        // Check if storageArray is an array and not empty
        if (Array.isArray(storageArray) && storageArray.length > 0) {
            // Iterate through the storageArray
            for (var i = 0; i < storageArray.length; i++) {
                var word = storageArray[i]; // Get the word at index i
                var listItem = document.createElement("li"); // Create a new li element
                listItem.textContent = word; // Set the text content of the li element to the word
                listItem.id = word; // Set the id of the li element to the word
                ul.appendChild(listItem); // Append the li element to the ul
            }
        } else {
            console.log("No words found in storage or storage is not an array.");
            // Handle the case where there are no words in storage or storage is not an array
        }
    });
}

  
fetchNavigationData(username, activeProfile);

async function fetchNavigationData(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/api/navigation-history/${username}/${profileName}`, {
            credentials: 'include'
        });
        const result = await response.json();
        console.log(result);
        if (result.success) {
            const navigationData = result.data;
            
            // Filtrar las URLs de Google
            const filteredData = navigationData.filter(item => !item.url.includes("google.com"));
            
            // Obtener hostnames de las URLs filtradas
            const urls = filteredData.map(item => new URL(item.url).hostname); 
            
            const visitCounts = filteredData.map(item => item.visitCount);
            const visitedAt = filteredData.map(item => new Date(item.visitedAt)); // Convertir a objetos Date
            const lastVisitedAt = filteredData.map(item => new Date(item.lastVisitedAt)); // Convertir a objetos Date

            console.log(urls);
            console.log(visitCounts);
            console.log(visitedAt);
            console.log(lastVisitedAt);

            renderBarChart(urls, visitCounts);
            renderPieChart(urls, visitCounts);
            const mostVisitedSite = obtenerSitioMasVisitado(urls, visitCounts);
            mostrarSitioMasVisitado(mostVisitedSite);

            renderTimeChart(urls, visitedAt, lastVisitedAt); // Llamar a la función con las fechas convertidas
        } else {
            console.error('Error al obtener los datos del gráfico');
        }
    } catch (error) {
        console.error('Error al obtener los datos del gráfico:', error);
    }
}

function renderTimeChart(urls, visitedAt, lastVisitedAt) {
    const ctx = document.getElementById('timeChart').getContext('2d');
    console.log('Rendering time chart with visitedAt:', visitedAt);
    console.log('Rendering time chart with lastVisitedAt:', lastVisitedAt);

    // Procesa los datos de fecha si es necesario
    const visitDates = visitedAt.map(date => new Date(date));
    let lastVisitDates = [];
    if (lastVisitedAt) {
        lastVisitDates = lastVisitedAt.map(date => new Date(date));
    } else {
        // Si lastVisitedAt no está definido, usa un array vacío para evitar errores
        lastVisitDates = new Array(visitedAt.length).fill(new Date());
    }

    console.log('Processed visit dates:', visitDates);
    console.log('Processed last visit dates:', lastVisitDates);

    // Calcula la diferencia de tiempo entre visitas y última visita para cada sitio
    const timeDifferences = visitDates.map((visitDate, index) => {
        const lastVisitDate = lastVisitDates[index];
        return Math.abs(visitDate - lastVisitDate); // Calcula la diferencia absoluta en milisegundos
    });

    // Convierte la diferencia de tiempo a la unidad deseada (por ejemplo, días)
    const timeDifferencesInDays = timeDifferences.map(diff => Math.ceil(diff / (1000 * 60 * 60 * 24))); // Convierte a días y redondea hacia arriba

    console.log('Time differences between visits and last visits (in days) for all sites:', timeDifferencesInDays);

    // Crea un mapeo entre las URLs y los colores
    const urlColorMap = {};
    const uniqueUrls = [...new Set(urls)]; // Obtiene URLs únicas
    const colors = generateRandomColors(uniqueUrls.length); // Genera colores aleatorios
    uniqueUrls.forEach((url, index) => {
        urlColorMap[url] = colors[index]; // Asigna un color a cada URL
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: visitDates.map((date, index) => date.toLocaleDateString()), // Usa solo la fecha como etiquetas
            datasets: urls.map((url, index) => ({
                label: url,
                data: [timeDifferencesInDays[index]], // Usa las diferencias de tiempo en días
                borderColor: urlColorMap[url],
                borderWidth: 1,
                fill: false,
                pointLabel: {
                    formatter: function(context) {
                        const dataIndex = context.dataIndex;
                        return urls[dataIndex]; // Muestra la URL como etiqueta del punto
                    }
                }
            }))
        },
        options: {
            scales: {
                x: {
                    type: 'time', // Configura el eje X como tipo de tiempo
                    time: {
                        unit: 'day' // Configura la unidad de tiempo
                    }
                },
                y: {
                    type: 'linear',
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        beginAtZero: true
                    }
                }
            }
        }
    });
}




function generateRandomColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const color = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;
        colors.push(color);
    }
    return colors;
}







function renderBarChart(urls, visitCounts) {
    const ctx = document.getElementById('navigationBarChart').getContext('2d');
    console.log('Rendering bar chart with URLs:', urls);
    console.log('Rendering bar chart with visit counts:', visitCounts);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: urls,
            datasets: [{
                label: 'Visitas',
                data: visitCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    type: 'linear',
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

function renderPieChart(urls, visitCounts) {
    const ctx = document.getElementById('navigationPieChart').getContext('2d');
    console.log('Rendering pie chart with URLs:', urls);
    console.log('Rendering pie chart with visit counts:', visitCounts);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: urls, // Utilizar los nombres de los sitios como etiquetas
            datasets: [{
                label: 'Visitas',
                data: visitCounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    display: false
                },
                x: {
                    display: false
                }
            }
        }
    });
}

function renderChart(urls, visitCounts) {
    const ctx = document.getElementById('navigationChart').getContext('2d');
    console.log('Rendering chart with URLs:', urls); // Verifica URLs
    console.log('Rendering chart with visit counts:', visitCounts); // Verifica contadores de visitas
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: urls,
            datasets: [{
                label: 'Visitas',
                data: visitCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    type: 'linear',
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

function obtenerSitioMasVisitado(urls, visitCounts) {
    // Encontrar el índice del recuento de visitas más alto
    const maxIndex = visitCounts.indexOf(Math.max(...visitCounts));

    // Obtener el sitio correspondiente con el índice encontrado
    return urls[maxIndex];
}

function mostrarSitioMasVisitado(sitioMasVisitado) {
    try {
        const mostVisitedSiteElement = document.getElementById('mostVisitedSite');
        mostVisitedSiteElement.textContent = `Sitio más visitado: ${sitioMasVisitado}`;
    } catch (error) {
        console.error('Error al mostrar el sitio más visitado:', error);
    }
}

  