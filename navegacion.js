document.addEventListener("DOMContentLoaded", function() {
    // Obtenemos el elemento del enlace "Gráficos y estadísticas"
    const graficosLink = document.getElementById('graficosLink');

    // Añadir evento de clic para el enlace "Gráficos y estadísticas"
    graficosLink.addEventListener('click', async function(event) {
        event.preventDefault();
        await redirectToGraficosPage();
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

    // Función para redirigir a graficos.html con las credenciales del usuario actual y el perfil activo
    async function redirectToGraficosPage() {
        const currentUser = await getCurrentUser();
        const activeProfile = await getActiveProfile();
        
        if (currentUser && activeProfile) {
            const url = `graficos.html?username=${encodeURIComponent(currentUser)}&profile=${encodeURIComponent(activeProfile.name)}`;
            window.open(url, '_self');
        } else {
            console.error("No se encontró el usuario actual o el perfil activo.");
        }
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // Obtenemos los elementos del panel de navegación
    const sitiosBloqueados = document.getElementById('sitios-bloqueados');
    const palabrasBloqueadas = document.getElementById('palabras-bloqueadas');
    const historial = document.getElementById('navigationHistoryPanel');
    const supervisadosLink = document.getElementById('supervisadosLink');

    // Por defecto, todos los elementos están ocultos
    sitiosBloqueados.style.display = 'none';
    palabrasBloqueadas.style.display = 'none';
    historial.style.display = 'block';

    // Obtenemos los elementos del panel de navegación
    const enlacesNavegacion = document.querySelectorAll('.navegacion .nav-link');

    // Asignamos eventos clic a los enlaces de navegación
    enlacesNavegacion.forEach(function(enlace) {
        enlace.addEventListener('click', function(event) {
            // Evitamos que el enlace lleve a otra página
            event.preventDefault();

            // Ocultamos todos los divs de contenido
            ocultarTodosLosDivs();

            // Dependiendo del enlace clicado, mostramos el div correspondiente
            switch (enlace.textContent.trim()) {
                case 'Sitios bloqueados':
                    sitiosBloqueados.style.display = 'block';
                    break;
                case 'Palabras bloqueadas':
                    palabrasBloqueadas.style.display = 'block';
                    break;
                case 'Historial y estadísticas':
                    historial.style.display = 'block';
                    break;
                default:
                    break;
            }
        });
    });

    // Función para ocultar todos los divs de contenido
    function ocultarTodosLosDivs() {
        sitiosBloqueados.style.display = 'none';
        palabrasBloqueadas.style.display = 'none';
        historial.style.display = 'none';
    }

    // Añadir evento de clic para el enlace "Ver usuarios supervisados"
    supervisadosLink.addEventListener('click', async (event) => {
        event.preventDefault();
        await redirectToProfilesPage();
    });

    // Función para obtener el nombre de usuario actual
    async function getCurrentUser() {
        return new Promise((resolve) => {
            chrome.storage.sync.get("currentUser", function(data) {
                resolve(data.currentUser);
            });
        });
    }

    // Función para redirigir a perfiles.html con las credenciales del usuario actual
    async function redirectToProfilesPage() {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            const url = `perfiles.html?user=${encodeURIComponent(currentUser)}&currentUser=${encodeURIComponent(currentUser)}`;
            window.open(url, '_self');
        } else {
            console.error("No se encontró el usuario actual.");
        }
    }
});
