document.addEventListener("DOMContentLoaded", function() {
    // Obtenemos el elemento del enlace "Atrás"
    const atrasLink = document.getElementById('atrasLink');

    // Añadir evento de clic para el enlace "Atrás"
    atrasLink.addEventListener('click', async function(event) {
        event.preventDefault();
        await redirectToPreviousPage();
    });

    // Función para obtener el nombre de usuario actual
    async function getCurrentUser() {
        return new Promise((resolve) => {
            chrome.storage.sync.get("currentUser", function(data) {
                resolve(data.currentUser);
            });
        });
    }

    // Función para obtener el perfil activo
    async function getActiveProfile() {
        return new Promise((resolve) => {
            chrome.storage.local.get("activeProfile", function(data) {
                resolve(data.activeProfile);
            });
        });
    }

    // Función para redirigir a la página anterior con las credenciales del usuario actual y el perfil activo
    async function redirectToPreviousPage() {
        const currentUser = await getCurrentUser();
        const activeProfile = await getActiveProfile();
        
        if (currentUser && activeProfile) {
            const url = `panel.html?username=${encodeURIComponent(currentUser)}&profile=${encodeURIComponent(activeProfile.name)}`;
            window.open(url, '_self');
        } else {
            console.error("No se encontró el usuario actual o el perfil activo.");
        }
    }
});
