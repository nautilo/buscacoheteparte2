// Obtener referencia al elemento de la imagen
var image = document.getElementById('image');

// Evento de seguimiento del mouse
document.addEventListener('mousemove', function(e) {
    // Obtener las coordenadas del centro de la imagen
    var rect = image.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    // Calcular la diferencia entre las coordenadas del cursor y el centro de la imagen
    var diffX = e.clientX - centerX;
    var diffY = e.clientY - centerY;

    // Calcular el ángulo de rotación en radianes
    var angle = Math.atan2(diffY, diffX);

    // Convertir el ángulo de radianes a grados
    angle = 90 + angle * (180 / Math.PI);

    // Aplicar la rotación a la imagen
    image.style.transform = 'rotate(' + angle + 'deg)';
});

var targetX = 0;
var targetY = 0;
var isMoving = false;

document.addEventListener('click', function(e) {
    var newTargetX = e.clientX - image.width / 2;
    var newTargetY = e.clientY - image.height / 2;

    if (!isMoving || (targetX === image.offsetLeft && targetY === image.offsetTop)) {
        targetX = newTargetX;
        targetY = newTargetY;

        // Calcular la diferencia entre la posición actual de la imagen y el punto de destino
        var deltaX = targetX - image.offsetLeft;
        var deltaY = targetY - image.offsetTop;

        // Calcular la distancia total
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Velocidad de movimiento (ajusta según lo rápido que desees que se mueva la imagen)
        var speed = 10;

        // Calcular la cantidad de fotogramas necesarios para alcanzar el destino
        var frames = distance / speed;

        // Calcular la cantidad de movimiento en cada fotograma
        var moveX = deltaX / frames;
        var moveY = deltaY / frames;

        // Función de animación
        function move() {
            // Actualizar la posición de la imagen
            image.style.left = (image.offsetLeft + moveX) + 'px';
            image.style.top = (image.offsetTop + moveY) + 'px';

            // Si no ha llegado al destino, continuar animando
            if (--frames > 0) {
                requestAnimationFrame(move);
            } else {
                isMoving = false; // Detener el movimiento al llegar al destino
            }
        }

        // Iniciar la animación
        isMoving = true;
        move();
    }
});

// Función para mostrar los resultados de búsqueda como círculos
function displaySearchResults(results) {
    var searchResultsDiv = document.getElementById('searchResults');
    searchResultsDiv.innerHTML = ''; // Limpiar resultados anteriores

    // Obtener dimensiones de la ventana
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

    // Inicializar arrays para almacenar posiciones ocupadas y tamaños de círculos
    var occupiedPositions = [];
    var circleSizes = [];

    // Mostrar los primeros 10 resultados como círculos
    for (var i = 0; i < 10 && i < results.items.length; i++) {
        var title = results.items[i].title;
        var link = results.items[i].link; // Obtener el enlace del resultado
        var circleDiv = document.createElement('div');
        circleDiv.className = 'circle';
        circleDiv.style.backgroundColor = getRandomColor();
        circleDiv.style.position = 'absolute';
        circleDiv.innerText = title;

        // Calcular el diámetro del círculo en función de la longitud del título
        var diameter = Math.max(100, title.length * 5);

        // Establecer el tamaño del círculo
        circleDiv.style.width = diameter + 'px';
        circleDiv.style.height = diameter + 'px';

        // Calcular el tamaño de la fuente proporcional al tamaño del círculo
        var fontSize = Math.min(14, 0.5 * diameter); // Limitar el tamaño de la fuente
        circleDiv.style.fontSize = 10 + fontSize + 'px';

        // Posicionar el círculo de forma aleatoria dentro de la ventana
        var position = getRandomPosition(windowWidth, windowHeight, occupiedPositions, diameter);
        circleDiv.style.left = position.x + 'px';
        circleDiv.style.top = position.y + 'px';

        // Añadir evento de clic para redirigir al enlace del resultado
        circleDiv.addEventListener('click', function() {
            window.location.href = link;
        });

        // Añadir el círculo al contenedor de resultados de búsqueda
        searchResultsDiv.appendChild(circleDiv);

        // Registrar la posición ocupada y el tamaño del círculo
        occupiedPositions.push(position);
        circleSizes.push(diameter);
    }
}

// Función para generar un color aleatorio en formato hexadecimal
function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// Función para generar una posición aleatoria que no se superponga con las posiciones existentes
function getRandomPosition(windowWidth, windowHeight, occupiedPositions, circleSize) {
    var position;
    var attempts = 0;
    var maxAttempts = 50; // Número máximo de intentos antes de abortar

    // Hacer intentos hasta encontrar una posición válida o alcanzar el límite de intentos
    do {
        var x = Math.floor(Math.random() * (windowWidth - circleSize));
        var y = Math.floor(Math.random() * (windowHeight - circleSize));
        position = { x: x, y: y };

        // Comprobar si la posición se superpone con alguna posición ocupada
        var overlap = occupiedPositions.some(function(occupiedPosition) {
            return (Math.abs(position.x - occupiedPosition.x) < circleSize && Math.abs(position.y - occupiedPosition.y) < circleSize);
        });

        attempts++;
    } while (overlap && attempts < maxAttempts);

    // Si no se encontró una posición válida, colocar el círculo en la esquina superior izquierda
    if (overlap) {
        position = { x: 0, y: 0 };
    }

    return position;
}

// Función para realizar una búsqueda utilizando la API de Custom Search Engine de Google
function search(query) {
    var apiKey = 'AIzaSyBp0cceMWkjL6JQ_HJTBGtUH1Jk3CjygM8';
    var cx = 'b1516604cc426476e';
    var url = 'https://www.googleapis.com/customsearch/v1?q=' + query + '&cx=' + cx + '&key=' + apiKey + '&gl=cl';

    fetch(url)
        .then(response => response.json())
        .then(data => displaySearchResults(data))
        .catch(error => console.error('Error al realizar la búsqueda:', error));
}

// Función para manejar el evento de búsqueda
function handleSearch() {
    var query = document.getElementById('searchInput').value;
    if (query.length > 2) { // Realizar la búsqueda solo si la longitud de la consulta es mayor que 2 caracteres
        search(query);
    }
}

// Escuchar el evento 'click' en el botón de búsqueda
document.getElementById('searchButton').addEventListener('click', handleSearch);

// Escuchar el evento 'keypress' en el campo de búsqueda para activar la búsqueda al presionar Enter
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Mostrar el dropdown de avatares al hacer clic en el contenedor del perfil
document.getElementById('profileContainer').addEventListener('click', function() {
    var dropdown = document.getElementById('avatarDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
});

// Cambiar el avatar al hacer clic en una imagen del dropdown
document.querySelectorAll('.avatar-dropdown img').forEach(function(img) {
    img.addEventListener('click', function() {
        var profileAvatar = document.getElementById('profileAvatar');
        profileAvatar.src = this.src;

        // Aquí puedes añadir código para guardar el nuevo avatar en el perfil del usuario
        // Por ejemplo, haciendo una llamada a tu backend para actualizar el perfil del usuario

        // Ocultar el dropdown después de seleccionar un avatar
        document.getElementById('avatarDropdown').style.display = 'none';
    });
});
