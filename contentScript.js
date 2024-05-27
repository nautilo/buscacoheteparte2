// contentScript.js

console.log("El contentScript se está ejecutando.");

chrome.storage.sync.get(null, function(result) {  
    var storageArray = result['words']; 
    console.log(storageArray); 
    if (storageArray != null) {
        var elements = document.getElementsByTagName('*');
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i]; 
            for (var j = 0; j < element.childNodes.length; j++) {
                var node = element.childNodes[j]; 
                if (node.nodeType === 3) {
                    var text = node.nodeValue; 
                    for (var k = 0; k < storageArray.length; k++) {
                        var word = storageArray[k]; 
                        var length = word.length; 
                        var censor = new Array(length+1).join('*');
                        var regEx = new RegExp(word, "ig"); 
                        var replacedText = text.replaceAll(regEx,censor);
                        if (replacedText !== text) { //replacedText.localeCompare(text) != 0
                            console.log('replacing text');
                            element.replaceChild(document.createTextNode(replacedText), node);
                        }
                    } 
                }
            }
        }
    }
});
// Obtener las reglas de bloqueo del almacenamiento sincronizado
chrome.storage.sync.get('blockedWebsites', function(data) {
    const blockedWebsites = data.blockedWebsites || []; // Obtener el array de sitios bloqueados
    console.log("Urls bloqueadas recibidas:", blockedWebsites);

    // Verificar si la página debe ser bloqueada
    const url = window.location.href; // Obtener la URL actual
    console.log("URL actual:", url);

    const blocked = isUrlBlocked(url, blockedWebsites); // Verificar si la URL está bloqueada
    console.log("¿Está bloqueada la página?", blocked);

    if (blocked) {
        blockPage(); // Bloquear la página si está en la lista de bloqueo
    }
});

// Función para verificar si la URL está bloqueada
function isUrlBlocked(url, blockedWebsites) {
    return blockedWebsites.some(website => {
        const regex = new RegExp('^(https?:\/\/)?(www\.)?' + escapeRegExp(website) + '.*$', 'i');
        return regex.test(url);
    });
}

// Función para escapar caracteres especiales en las expresiones regulares
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& significa la cadena completa que coincide
}

// Función para bloquear la página
function blockPage() {
    document.body.innerHTML = ""; // Limpiar el contenido de la página
    document.body.style.background = "black"; // Establecer el fondo en negro
    document.body.style.color = "white"; // Establecer el color del texto en blanco
    document.body.style.fontFamily = "Arial, sans-serif"; // Establecer la fuente
    document.body.style.padding = "20px"; // Añadir un espacio de relleno

    // Crear un mensaje de bloqueo
    const blockMessage = document.createElement("h1");
    blockMessage.textContent = "Esta página ha sido bloqueada.";
    document.body.appendChild(blockMessage);
}