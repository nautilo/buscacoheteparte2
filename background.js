// Función para obtener el último ID de las reglas existentes
function getLastRuleId(existingRules) {
    let lastId = 0;
    existingRules.forEach(rule => {
        if (rule.id > lastId) {
            lastId = rule.id;
        }
    });
    return lastId;
}

console.log("from background")
let active_tab_id = 0;
chrome.tabs.onActivated.addListener(tab => {
    chrome.tabs.get(tab.tabId, current_tab_info => {
          active_tab_id = tab.tabId;
          //chrome.tabs.insertCSS(null, {file: "./styles.css"});
          //chrome.tabs.executeScript(null, {file: "./foreground.js"}, () => console.log("i injected"))
          chrome.tabs.executeScript(null, {file: "./contentScript.js"}, () => console.log("i injected content"))
    });
}); 
// Función para actualizar las reglas de bloqueo
let ruleCounter = 1000; // Inicializamos el contador de reglas

// Función para generar un nuevo ID único para las reglas
function generateUniqueId(existingIds) {
    let newId = Math.max(...existingIds) + 1; // Obtener el máximo de los IDs existentes y sumarle uno
    return newId;
}

// Función para actualizar las reglas de bloqueo
// Función para actualizar las reglas de bloqueo
function updateBlockingRules(blockedWebsites) {
    // Verificar si blockedWebsites es un array y no está vacío
    if (Array.isArray(blockedWebsites) && blockedWebsites.length > 0) {
        // Obtener las reglas de bloqueo dinámicas actuales
        chrome.declarativeNetRequest.getDynamicRules(function(existingRules) {
            const ruleIdsToRemove = existingRules.map(rule => rule.id); // Obtener los IDs de todas las reglas existentes

            // Eliminar las reglas existentes
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove // Eliminar todas las reglas existentes
            }, function() {
                console.log("Se han eliminado las reglas existentes.");

                // Crear un arreglo de reglas de bloqueo basadas en las URLs bloqueadas
                const rulesToAdd = blockedWebsites.map((website, index) => {
                    return {
                        id: index + 1, // Asignar un nuevo ID secuencial
                        priority: 1, // Prioridad de la regla
                        action: { type: "block" }, // Acción de bloqueo
                        condition: {
                            urlFilter: website // URL a bloquear
                        }
                    };
                });

                // Agregar las nuevas reglas de bloqueo
                chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: rulesToAdd // Agregar solo las nuevas reglas
                }, function() {
                    console.log("Se han agregado las nuevas reglas de bloqueo.");
                });
            });
        });
    } else {
        console.log("No hay URLs bloqueadas para actualizar las reglas de bloqueo.");
    }
}


// Cuando la extensión se inicia, obtén las URLs bloqueadas y actualiza las reglas de bloqueo
chrome.runtime.onInstalled.addListener(async function() {
    try {
        const syncData = await getSyncData(); // Obtener los datos sincronizados
        let blockedWebsites = syncData.blockedWebsites || []; // Obtener el array de sitios bloqueados

        // Verificar si blockedWebsites es un array
        if (!Array.isArray(blockedWebsites)) {
            // Si no es un array, conviértelo a uno
            blockedWebsites = [blockedWebsites];
        }

        // Actualizar las reglas de bloqueo con las URLs bloqueadas
        updateBlockingRules(blockedWebsites);
    } catch (error) {
        console.error("Error al actualizar las reglas de bloqueo:", error);
    }
});

// Listener para cambios en el almacenamiento sincronizado
chrome.storage.onChanged.addListener(async function(changes, areaName) {
    if (areaName === 'sync' && 'blockedWebsites' in changes) {
        let blockedWebsites = changes.blockedWebsites.newValue || []; // Obtener el array de sitios bloqueados

        // Verificar si blockedWebsites es un array
        if (!Array.isArray(blockedWebsites)) {
            // Si no es un array, conviértelo a uno
            blockedWebsites = [blockedWebsites];
        }

        // Actualizar las reglas de bloqueo con las URLs bloqueadas
        updateBlockingRules(blockedWebsites);
    }
});

// Función para obtener los datos sincronizados
function getSyncData() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('blockedWebsites', function(data) {
            resolve(data);
        });
    });
}

// Escuchar eventos de navegación completados
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if (details.frameId === 0) {
        chrome.history.addUrl({url: details.url}, function() {
            console.log(`URL añadida al historial: ${details.url}`);
        });
    }
});


chrome.storage.sync.get("currentUser", function(data) {
    const currentUser = data.currentUser;
    if (currentUser) {
        console.log("Usuario actual recuperado:", currentUser);
        // Puedes continuar con la lógica que depende del nombre de usuario aquí
    } else {
        console.error("No se pudo recuperar el nombre de usuario.");
    }
});

chrome.runtime.onStartup.addListener(() => {
    registerWebNavigationListeners();
});

// Escuchar eventos de navegación antes de que la página comience a cargar
// Escuchar eventos de navegación antes de que la página comience a cargar
// Escuchar eventos de navegación antes de que la página comience a cargar
// Escuchar eventos de navegación antes de que la página comience a cargar
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
    if (details.frameId === 0) {
      // Recuperar datos del usuario y el nombre del perfil activo
      chrome.storage.sync.get(['currentUser', 'activeProfileName'], function(data) {
        const username = data.currentUser;
        const profileName = data.activeProfileName; // Asegúrate de que esta clave coincide con cómo guardas el nombre del perfil activo

        console.log("Username:", username);
        console.log("Active Profile Name:", profileName);

        if (!username || !profileName) {
          console.error('Usuario o perfil no encontrado');
          return; // Salir si no hay datos válidos
        }

        // Usar el perfil activo para añadir historial de navegación
        fetch(`http://localhost:3000/add-navigation-history/${username}/${profileName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Asegúrate de reemplazar esto con tu token real
          },
          body: JSON.stringify({
            title: 'Título de la página', // Asegúrate de obtener el título de alguna manera, si es necesario
            url: details.url
          })
        }).then(response => response.json())
          .then(data => {
            if (!data.success) {
              console.error('Error al enviar URL:', data.message);
              return; // No continuar si la operación no fue exitosa
            }
            console.log('URL añadida al historial:', details.url);
          })
          .catch(error => console.error('Error al enviar URL:', error));
      });
    }
  }, {url: [{urlMatches : 'http://*/*'}, {urlMatches : 'https://*/*'}]});