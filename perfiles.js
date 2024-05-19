// Función para obtener el nombre de usuario actual
async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        // Obtener el nombre de usuario de los parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        if (username) {
            resolve(username); // Si el nombre de usuario está en los parámetros de la URL, devolverlo
        } else {
            // Obtener el nombre de usuario del almacenamiento local
            chrome.storage.local.get('username', function(data) {
                const storedUsername = data['username'];
                if (storedUsername) {
                    resolve(storedUsername); // Si se encuentra en el almacenamiento local, devolverlo
                } else {
                    resolve(null); // Si no se puede encontrar, devolver null
                }
            });
        }
    });
}

// Función para obtener el perfil activo


// Función para mostrar el mensaje de bienvenida con el perfil activo
// Función para mostrar el mensaje de bienvenida con el perfil activo
// Función para mostrar el mensaje de bienvenida con el perfil activo
async function showWelcomeMessage() {
    const welcomeMessageElement = document.getElementById("welcomeMessage");
    const profileStatusMessage = document.getElementById("profileStatusMessage");
    if (welcomeMessageElement && profileStatusMessage) {
        const currentUser = await getCurrentUser();
        const activeProfile = await getActiveProfileFromStorage(); // Asegúrate de usar la función correcta para obtener el perfil activo

        if (activeProfile && activeProfile.name) {
            welcomeMessageElement.textContent = `Bienvenido, ${currentUser}! Perfil activo: ${activeProfile.name}`;
            profileStatusMessage.textContent = `Perfil activo: ${activeProfile.name}`;
        } else {
            welcomeMessageElement.textContent = `Bienvenido, ${currentUser}! No hay perfil activo.`;
            profileStatusMessage.textContent = "No hay perfil activo.";
        }
    }
}


// Función para definir y guardar el nombre de usuario en el almacenamiento local de Chrome
async function setCurrentUser(username) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ 'username': username }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error al guardar el nombre de usuario:", chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log("Nombre de usuario guardado exitosamente:", username);
                resolve(true);
            }
        });
    });
}

async function getCurrentUserAndProfile() {
    try {
        const user = await new Promise((resolve, reject) => {
            chrome.storage.local.get('username', function(data) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data.username);
                }
            });
        });

        const profile = await new Promise((resolve, reject) => {
            chrome.storage.local.get('activeProfile', function(data) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data.activeProfile);
                }
            });
        });

        console.log(`Usuario recuperado: ${user}, Perfil activo: ${profile ? profile.name : 'No definido'}`);

        if (!user || !profile) {
            console.error('Usuario o perfil no encontrado');
            return null;
        }

        return { user, profile };
    } catch (error) {
        console.error('Error al recuperar el usuario o el perfil:', error);
        return null;
    }
}

function viewSyncStorage() {
    chrome.storage.sync.get(null, function(items) { // null para obtener todos los elementos
        console.log(items);
    });
}

function clearSyncStorage() {
    chrome.storage.sync.clear(function() {
        console.log('Todos los elementos han sido eliminados correctamente.');
    });
}

async function getCurrentUsernameFromStorage() {
    return new Promise(resolve => {
        chrome.storage.sync.get("currentUser", function(data) {
            const username = data.currentUser;
            console.log("Nombre de usuario recuperado del almacenamiento:", username);
            resolve(username);
        });
    });
}


async function setUserActiveProfile(currentUser, profile) {
    try {
        // Primero, eliminar el perfil activo actual si existe
        await chrome.storage.local.remove("activeProfile", async function() {
            console.log("Perfil activo anterior eliminado.");

            // Luego, establecer el nuevo perfil activo
            const response = await fetch(`http://localhost:3000/set-active-navigation-profile/${currentUser}/${profile.name}`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                // Almacenar el nuevo perfil activo en el almacenamiento local de Chrome
                await chrome.storage.local.set({ "activeProfile": profile }, function() {
                    console.log("Nuevo perfil activo guardado en el almacenamiento local:", profile.name);
                });

                // Almacenar las URLs bloqueadas en el almacenamiento sincronizado de Chrome
                chrome.storage.sync.set({ blockedWebsites: data.blockedWebsites }, function() {
                    console.log("URLs bloqueadas guardadas en el almacenamiento sincronizado de Chrome");
                });

                
                

                // Llamar a showWelcomeMessage para actualizar el mensaje de bienvenida
                await showWelcomeMessage();

                

                return true;
            } else {
                throw new Error(data.message);
            }
        });
    } catch (error) {
        console.error("Error al establecer el perfil activo:", error);
        throw error;
    }
}

async function verifyAndUpdateActiveProfileName() {
    chrome.storage.sync.get(['activeProfile', 'activeProfileName'], function(data) {
        const activeProfile = data.activeProfile;
        const activeProfileName = data.activeProfileName;

        if (activeProfile && activeProfile.name !== activeProfileName) {
            console.error('Discrepancia detectada en el nombre del perfil activo.');
            // Corregir el activeProfileName para que coincida con el nombre del perfil activo
            chrome.storage.sync.set({activeProfileName: activeProfile.name}, function() {
                console.log(`activeProfileName actualizado a: ${activeProfile.name}`);
            });
        } else {
            console.log('No hay discrepancia en el nombre del perfil activo.');
        }
    });
}

// Llamar a la función al inicio o en un punto adecuado en tu código
verifyAndUpdateActiveProfileName();

function viewSyncStorage() {
    chrome.storage.sync.get(null, function(items) { // null aquí significa obtener todos los elementos
        console.log('Items in sync storage:', items);
    });
}

async function getActiveProfileFromStorage() {
    return new Promise(resolve => {
        chrome.storage.local.get("activeProfile", function(data) {
            const activeProfile = data.activeProfile;
            console.log("Perfil activo recuperado del almacenamiento:", activeProfile);
            resolve(activeProfile);
        });
    });
}


async function captureNavigationHistory(profile) {
    // Lógica para capturar el historial de navegación
    chrome.history.search({text: '', maxResults: 1000}, function(data) {
        // `data` contiene un array de objetos con la información del historial
        // Por cada objeto, puedes extraer la información relevante como URL y título
        // y agregarla al historial de navegación del perfil activo
        let newNavigationHistory = [];
        data.forEach(item => {
            newNavigationHistory.push({
                url: item.url,
                title: item.title
            });
        });

        // Obtener el historial existente del almacenamiento local
        chrome.storage.local.get("navigationHistory", function(result) {
            let existingNavigationHistory = result.navigationHistory || [];

            // Combinar historiales
            let combinedHistory = existingNavigationHistory.concat(newNavigationHistory);

            // Eliminar duplicados
            combinedHistory = combinedHistory.filter((item, index, self) =>
                index === self.findIndex(t => (
                    t.url === item.url && t.title === item.title
                ))
            );

            // Guardar el historial combinado en el almacenamiento local
            chrome.storage.local.set({ "navigationHistory": combinedHistory }, function() {
                
            });
        });
    });
}


// Función para obtener el perfil activo desde el almacenamiento local de Chrome

// Listener para el evento 'DOMContentLoaded' que se ejecuta cuando el DOM ha sido completamente cargado
document.addEventListener('DOMContentLoaded', async function() {
    // Llama a la función para obtener y mostrar el perfil activo al cargar la página
    const activeProfile = await getActiveProfileFromStorage();
    if (activeProfile) {
        const profileStatusMessage = document.getElementById("profileStatusMessage");
        if (profileStatusMessage) {
            profileStatusMessage.textContent = `Perfil activo: ${activeProfile.name}`;
        }
    }
});

function clearBlockingRules() {
    chrome.declarativeNetRequest.getDynamicRules(function(rules) {
        const ruleIds = rules.map(rule => rule.id); // Obtener los IDs de todas las reglas
        if (ruleIds.length > 0) {
            // Eliminar todas las reglas de bloqueo
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds, // IDs de las reglas a eliminar
                addRules: [] // No hay reglas para agregar
            }, function() {
                console.log("Todas las reglas de bloqueo han sido eliminadas.");
            });
        } else {
            console.log("No hay reglas de bloqueo para eliminar.");
        }
    });
}

function getActiveBlockingRules(callback) {
    chrome.declarativeNetRequest.getDynamicRules(function(rules) {
        // Filtrar solo las reglas de bloqueo (acción 'block')
        const blockingRules = rules.filter(rule => rule.action.type === "block");
        
        // Verificar si se proporcionó una función de devolución de llamada
        if (typeof callback === "function") {
            callback(blockingRules); // Llamar a la función de devolución de llamada con las reglas
        } else {
            console.error("Error: Se requiere una función de devolución de llamada.");
        }
    });
}

// Ejemplo de uso:



function getBlockingRules() {
    chrome.declarativeNetRequest.getDynamicRules(function(rules) {
        console.log("Reglas de bloqueo actuales:");
        console.log(rules);
    });
}

function limpiarSyncStorage() {
    chrome.storage.sync.clear(function() {
      console.log('Todos los elementos han sido eliminados correctamente.');
    });
  }
  

function mostrarSyncStorage() {
    // Obtener el contenido del almacenamiento sincronizado
    chrome.storage.sync.get(null, function(items) {
        // Verificar si hay algún error
        if (chrome.runtime.lastError) {
            console.error("Error al obtener el almacenamiento sincronizado:", chrome.runtime.lastError);
        } else {
            // Mostrar los datos en la consola
            console.log("Contenido del almacenamiento sincronizado:", items);
        }
    });
}
// Función para mostrar los perfiles de navegación existentes
// Función para mostrar los perfiles de navegación existentes
async function showNavigationProfiles() {
    const currentUser = await getCurrentUser();
    const navigationProfilesMessage = document.getElementById("navigationProfilesMessage");
    const navigationProfileList = document.getElementById("navigationProfileList");
    navigationProfileList.innerHTML = ""; // Limpiar la lista antes de mostrar los perfiles

    try {
        const navigationProfiles = await getNavigationProfiles(currentUser);
        
        // Verificar si hay perfiles de navegación
        if (navigationProfiles.length === 0) {
            navigationProfilesMessage.textContent = "No hay perfiles de navegación disponibles.";
            return;
        }

        navigationProfilesMessage.textContent = ""; // Limpiar el mensaje de error

        // Iterar sobre cada perfil de navegación y crear elementos para mostrarlos en la lista
        navigationProfiles.forEach(profile => {
            const profileItem = document.createElement("li");
            profileItem.textContent = profile.name;

            // Botones para cada perfil
const setAsActiveButton = document.createElement("button");
setAsActiveButton.textContent = "Establecer como activo";
setAsActiveButton.addEventListener("click", async function() {
    try {
        await setUserActiveProfile(currentUser, profile); // Establecer como activo
        console.log("Perfil activo establecido exitosamente.");

        // Primero, eliminar el nombre del perfil activo anterior del almacenamiento sincronizado
        chrome.storage.sync.remove('activeProfileName', function() {
            if (chrome.runtime.lastError) {
                console.error("Error al eliminar el nombre del perfil activo anterior:", chrome.runtime.lastError);
            } else {
                console.log("Nombre del perfil activo anterior eliminado correctamente.");

                // Luego, guardar el nuevo nombre del perfil activo en el almacenamiento sincronizado
                chrome.storage.sync.set({ 'activeProfileName': profile.name }, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Error al guardar el nombre del perfil activo:", chrome.runtime.lastError);
                    } else {
                        console.log("Nombre del perfil activo guardado en el almacenamiento sincronizado:", profile.name);
                    }
                });
            }
        });

        const activeProfileMessage = document.getElementById("activeProfileMessage");
        if (activeProfileMessage) {
            await showActiveProfile(); // Mostrar el perfil activo actualizado
        }
    } catch (error) {
        console.error("Error al establecer el perfil activo:", error);
        alert("Error al establecer el perfil activo. Inténtalo de nuevo más tarde.");
    }
});

            const editButton = document.createElement("button");
editButton.textContent = "Editar";
editButton.addEventListener("click", async function() {
    const newName = prompt("Ingrese el nuevo nombre para el perfil:", profile.name);
    if (newName !== null) {
        const newAge = prompt("Ingrese la nueva edad para el perfil:", profile.age);
        if (newAge !== null) {
            const newPassword = prompt("Ingrese la nueva contraseña para el perfil:");
            if (newPassword !== null) {
                try {
                    await updateProfile(currentUser, profile.name, newName, newAge, newPassword); // Editar el perfil
                    await showNavigationProfiles(); // Actualizar la lista de perfiles
                } catch (error) {
                    console.error("Error al editar el perfil:", error);
                    alert("Error al editar el perfil. Inténtalo de nuevo más tarde.");
                }
            }
        }
    }
});

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener("click", async function() {
                if (confirm("¿Estás seguro de que deseas eliminar este perfil?")) {
                    try {
                        await deleteNavigationProfile(currentUser, profile.name); // Eliminar el perfil
                        await showNavigationProfiles(); // Actualizar la lista de perfiles
                    } catch (error) {
                        console.error("Error al eliminar el perfil:", error);
                        alert("Error al eliminar el perfil. Inténtalo de nuevo más tarde.");
                    }
                }
            });

            const goToBlockPanelButton = document.createElement("button");
            goToBlockPanelButton.textContent = "Ir a panel de bloqueo";
            goToBlockPanelButton.addEventListener("click", async function() {
                const currentUser = await getCurrentUser(); // Obtener el usuario actual
                if (currentUser) {
                    window.open(`panel.html?username=${currentUser}&profile=${profile.name}`, '_blank');
                } else {
                    alert("No se pudo obtener el nombre de usuario.");
                }
            });

            // Agregar los botones al elemento del perfil
            profileItem.appendChild(setAsActiveButton);
            profileItem.appendChild(editButton);
            profileItem.appendChild(deleteButton);
            profileItem.appendChild(goToBlockPanelButton);

            // Agregar el elemento del perfil a la lista
            navigationProfileList.appendChild(profileItem);
        });
    } catch (error) {
        console.error("Error al obtener los perfiles de navegación:", error);
        navigationProfilesMessage.textContent = "Error al cargar los perfiles de navegación. Inténtalo de nuevo más tarde.";
    }
}

async function updateProfile(currentUser, oldName, newName, newAge, newPassword) {
    try {
        // Encuentra el perfil actualizado
        const user = await Usuario.findOne({ _id: currentUser._id });
        const profile = user.navigationProfiles.find(profile => profile.name === oldName);

        // Actualiza los datos del perfil
        profile.name = newName;
        profile.age = parseInt(newAge);
        profile.password = newPassword;

        // Guarda los cambios
        await user.save();
    } catch (error) {
        throw error;
    }
}


// Función para actualizar el nombre de un perfil de navegación
async function updateProfileName(username, oldName, newName) {
    try {
        const response = await fetch(`http://localhost:3000/update-profile-name/${username}/${oldName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName }),
            timeout: 10000
        });
        const data = await response.json();
        if (data.success) {
            console.log("Nombre de perfil actualizado exitosamente.");

            await showWelcomeMessage();
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al actualizar el nombre del perfil:", error);
        throw error;
    }
}

// Función para eliminar un perfil de navegación
async function deleteNavigationProfile(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/delete-navigation-profile/${username}/${profileName}`, {
            method: 'DELETE',
            timeout: 10000
        });
        const data = await response.json();
        if (data.success) {
            console.log("Perfil eliminado exitosamente.");

            // Verificar si el perfil que se está eliminando es el perfil activo
            const currentUser = await getCurrentUser();
            const activeProfile = await getActiveProfileFromStorage(); // Usar la función correcta para obtener el perfil activo

            if (activeProfile && activeProfile.name === profileName) {
                // Si el perfil activo es el perfil eliminado, establece el perfil activo como null
                await setUserActiveProfile(currentUser, null); // Establece el perfil activo como null
                console.log("Perfil activo establecido como null.");
            }

            // Actualizar la lista de perfiles
            await showNavigationProfiles();

            // Verificar si el perfil activo ha sido eliminado y actualizar el mensaje de perfil activo
            const activeProfileMessage = document.getElementById("profileStatusMessage");
            if (activeProfileMessage) {
                const currentActiveProfile = await getActiveProfileFromStorage();
                if (!currentActiveProfile) {
                    activeProfileMessage.textContent = "No hay perfil activo.";
                }
            }

            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al eliminar el perfil:", error);
        throw error;
    }
}



// Función para agregar un nuevo perfil de navegación
// Función para agregar un nuevo perfil de navegación asegurándose de que no exista otro con el mismo nombre
async function addNavigationProfile(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/add-navigation-profile/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: profileName })
        });
        const data = await response.json();
        if (data.success) {
            console.log("Nuevo perfil de navegación agregado exitosamente.");
            document.getElementById('profileError').textContent = ''; // Limpiar mensajes de error anteriores
            return true;
        } else {
            // Manejar la respuesta cuando el nombre del perfil ya existe
            if (response.status === 409) {
                document.getElementById('profileError').textContent = "No puedes tener 2 perfiles de navegación con el mismo nombre.";
            } else {
                document.getElementById('profileError').textContent = data.message;
            }
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al agregar un nuevo perfil de navegación:", error);
        document.getElementById('profileError').textContent = "Error al agregar un nuevo perfil de navegación: " + error.message;
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Mostrar el mensaje de bienvenida con el perfil activo
    await showWelcomeMessage();

    // Mostrar los perfiles de navegación existentes
    await showNavigationProfiles();

    // Listener para el botón de agregar perfil
    const addProfileButton = document.getElementById('addProfileButton');
    addProfileButton.addEventListener('click', async function(event) {
        const profileNameInput = document.getElementById('navigationProfileNameInput');
        const profileName = profileNameInput.value.trim();
        if (!profileName) {
            console.error("El nombre del perfil no puede estar vacío");
            return; // Detener la ejecución si el campo está vacío
        }

        const currentUser = await getCurrentUser();
        try {
            await addNavigationProfile(currentUser, profileName); // Agregar el nuevo perfil
            await showNavigationProfiles(); // Actualizar la lista de perfiles de navegación
            await showWelcomeMessage(); // Mostrar el mensaje de bienvenida actualizado
            profileNameInput.value = ''; // Limpiar el input después de agregar el perfil
        } catch (error) {
            console.error("Error al agregar un nuevo perfil de navegación:", error);
        }
    });
});

function showActiveProfileFromConsole() {
    // Intenta obtener el username y el profileName del localStorage
    const username = localStorage.getItem('currentUser');
    const profileName = localStorage.getItem('activeProfileName');

    // Verifica si la información existe
    if (username && profileName) {
        console.log(`Perfil Activo: ${profileName}, Usuario: ${username}`);
    } else {
        console.log('No se encontró información del perfil activo o del usuario.');
    }
}

// Función para obtener los perfiles de navegación existentes
async function getNavigationProfiles(username) {
    try {
        const response = await fetch(`http://localhost:3000/get-navigation-profiles/${username}`);
        const data = await response.json();
        if (data.success) {
            return data.navigationProfiles;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al obtener los perfiles de navegación:", error);
        throw error;
    }
}

// Función para agregar un nuevo perfil de navegación
async function addNavigationProfile(username, profileName) {
    try {
        const response = await fetch(`http://localhost:3000/add-navigation-profile/${username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: profileName })
        });
        const data = await response.json();
        if (data.success) {
            console.log("Nuevo perfil de navegación agregado exitosamente.");
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error al agregar un nuevo perfil de navegación:", error);
        throw error;
    }
}

