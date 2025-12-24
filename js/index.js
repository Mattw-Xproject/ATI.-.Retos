/* Lógica principal del sitio web js/index.js
  Espera a que todo el HTML esté cargado (gracias a 'defer') y luego decide qué lógica ejecutar.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. LEER EL IDIOMA DE LA URL
    const params = new URLSearchParams(window.location.search);
    
    // Busca "?lang=XX". Si no, usa 'ES' por defecto.
    if(!params.has('lang')){
        params.set('lang','ES');
        window.location.search=params.toString();
    }
    const lang = (params.get('lang')).toUpperCase();
    

    
    // 2. CARGAR DINÁMICAMENTE EL ARCHIVO DE IDIOMA
    const configScript = document.createElement('script');
    configScript.src = `conf/config${lang}.json`; // Ej: conf/configEN.json

    // 3. TODA LA LÓGICA DEPENDE DE QUE EL IDIOMA SE CARGUE
    configScript.onload = () => {
        
        // 4. Validar que la variable 'config' exista
        if (typeof config === 'undefined') {
            console.error(`Error: El archivo ${configScript.src} no se cargó o no define 'const config'.`);
            document.body.innerHTML = `<h1 id="error">Error 400/404: No se pudo cargar el idioma ${lang}.</h1>`;
            return;
        }

        // 5. DECIDIR EN QUÉ PÁGINA ESTAMOS (como antes)
        const gridContainer = document.getElementById('cards-grid');
        const perfilContainer = document.getElementById('perfil-container');

        if (gridContainer) {
            // --- ESTAMOS EN INDEX.HTML ---
            
            // Validar que 'perfiles' (de datos/index.json) exista
            if (typeof perfiles === 'undefined') {
                 console.error('Error: El archivo datos/index.json no se cargó.');
                 return;
            }
            cargarLogicaIndex(); // 'config' y 'perfiles' están listos

        } else if (perfilContainer) {
            // --- ESTAMOS EN PERFIL.HTML ---
            
            cargarLogicaPerfil(); // 'config' está listo
        }
    };

    // 6. Manejar error si el archivo de idioma no existe
    configScript.onerror = () => {
        console.error(`Error: No se encontró el archivo ${configScript.src}.`);
        // Si falla, intenta recargar con 'ES' (español por defecto)
        if (lang !== 'ES') {
            params.set('lang', 'ES');
            window.location.search = params.toString();
        } else {
            document.body.innerHTML = '<h1 id="error">Error fatal: No se pudo cargar el archivo de idioma base.</h1>';
        }
    };

    // 7. Añadir el script de idioma al <head> para iniciar la carga
    document.head.appendChild(configScript);
});

// js/index.js (La función cargarLogicaIndex actualizada)

/**
 * Lógica para INDEX.HTML
 * Configura el Header, Footer, la lista inicial y el FILTRO DE BÚSQUEDA.
 */
function cargarLogicaIndex() {
    try {
        // 1. Rellenar Header/Footer (usa 'config' y 'perfiles' globales)
        rellenarHeaderFooter(config, perfiles[0]); 

        // 2. Renderizar la lista completa por primera vez
        renderizarPerfiles(perfiles);

        // 3. Configurar el escuchador de eventos para la búsqueda
        const searchInput = document.getElementById('search-input');

        //                 ANÁLISIS DE 'THIS' (3 CASOS)

        // CASO 1: Contexto de Método de Objeto
        // 'this' hace referencia al objeto 'auditoriaBusqueda'.
        const auditoriaBusqueda = {
            contador: 0,
            ultimoTermino: '',
            registrar: function(termino) {
                // Usamos 'this' para leer propiedades de ESTE objeto
                this.contador++;
                this.ultimoTermino = termino;
                console.log(`%c[CASO 1 - Objeto] this.contador = ${this.contador}`, 'color: cyan');
                console.log("Valor de 'this':", this); 
            }
        };
        
        // --- CASO 3: Contexto de Event Handler (DOM) ---
        // IMPORTANTE: Usamos 'function()' y NO '() => {}'
        // 'this' hace referencia al elemento HTML que recibe el evento (<input>).
        searchInput.addEventListener('focus', function() {
            console.log(`%c[CASO 3 - Evento DOM] Elemento enfocado`, 'color: lime');
            
            // Usamos 'this' para acceder a atributos del elemento HTML
            console.log("Valor de 'this' (debería ser el <input>):", this);
            console.log("Atributo Placeholder desde 'this':", this.placeholder);
        });

        
        searchInput.addEventListener('input', (e) => {
            // Obtener el texto de búsqueda (limpio y en minúsculas)
            const query = e.target.value.toLowerCase().trim();

            // EJECUTAMOS NUESTRO CASO DE ESTUDIO
            // Al llamar a auditoriaBusqueda.registrar(), 'this' dentro de esa función
            // será el objeto auditoriaBusqueda.
            auditoriaBusqueda.registrar(query);

            // Filtrar la lista global de perfiles
            const perfilesFiltrados = perfiles.filter(estudiante => 
                estudiante.nombre.toLowerCase().includes(query)
            );

            // Volver a renderizar la lista solo con los perfiles filtrados
            renderizarPerfiles(perfilesFiltrados, query);
        });

    } catch (error) {
        console.error('Error al cargar la página de inicio:', error);
    }
}

/**
 * NUEVA FUNCIÓN: Renderizar Perfiles
 * Dibuja las tarjetas en el index.html o muestra el mensaje de "No encontrado".
 */
function renderizarPerfiles(listaPerfiles, query = "") {
    const gridContainer = document.getElementById('cards-grid');
    const messageContainer = document.getElementById('search-results-message');
    const lang = (new URLSearchParams(window.location.search)).get('lang') || 'ES';

    // Limpiar el estado anterior
    gridContainer.innerHTML = '';
    messageContainer.innerHTML = '';

    // Si hay resultados, dibujarlos
    if (listaPerfiles.length > 0) {
        listaPerfiles.forEach(estudiante => {
            const listItem = document.createElement('li');
            listItem.className = 'card-wrap';
            const enlace = document.createElement('a');
            enlace.href = `perfil.html?ci=${estudiante.ci}&lang=${lang}`;
            
            enlace.innerHTML = `
                <div class="card-header">
                    <div class="card-img" style="background-image: url('${estudiante.imagen}')"></div>
                </div>
                <div class="card-content">
                    <h2 class="card-title">${estudiante.nombre}</h2>
                </div>
            `;
            listItem.appendChild(enlace);
            gridContainer.appendChild(listItem);
        });
    
    // Si NO hay resultados Y el usuario escribió algo
    } else if (query) {
        // Usar la plantilla de texto del archivo de idioma
        const mensajePlantilla = config.searchNotFound; // "No hay alumnos...: [query]"
        // Reemplazar [query] con el texto real (en negrita)
        const mensaje = mensajePlantilla.replace('[query]', `<strong>${query}</strong>`);
        
        // CASO 2: EJEMPLO Contexto DE 'THIS' EN FUNCIÓN NORMAL
        function verificarContextoGlobal() {
            // Variable local (no afecta a this, pero es parte del scope)
            let mensaje = "Soy una función normal";

            console.log(`%c[CASO 2 - Función Normal] Ejecutando: ${mensaje}`, 'color: yellow');
            console.log("Valor de 'this' (debería ser Window):", this);
        }
        verificarContextoGlobal();

        messageContainer.innerHTML = `<p class="search-no-results">${mensaje}</p>`;
    }
    // Si no hay resultados Y no hay query (lista vacía), no muestra nada.
}

/**
    Lógica para PERFIL.HTML
    Carga el perfil específico dinámicamente SIN USAR FETCH.
    Usa el truco de "Inyección de Script JSON".
 */
function cargarLogicaPerfil() {
    try {
        // 1. Obtener la CI del estudiante desde el parámetro en la URL
        const params = new URLSearchParams(window.location.search);
        const ci = params.get('ci');

        if (!ci) {
            document.body.innerHTML = '<h1 id="error">Error 400/404: No se especificó una Cédula (CI) en la URL.</h1>';
            return;
        }

        // 2. EL TRUCO: Inyectar dinámicamente el script del perfil
        const scriptPerfil = document.createElement('script');
        // El navegador cargará este archivo como un script
        scriptPerfil.src = `${ci}/perfil.json`; 
        
        // 3. Cuando el script cargue, creará la variable 'perfil'.
        // Toda la lógica de rellenado DEBE ir dentro del 'onload'.
        scriptPerfil.onload = () => {
            
            // Verificamos que el script haya creado la variable 'perfil'
            if (typeof perfil === 'undefined') {
                console.error(`Error: El archivo ${ci}/perfil.json no se cargó o no define 'const perfil'.`);
                document.body.innerHTML = `<h1 id="error">Error 400/404: No se pudo cargar el perfil ${ci}.</h1>`;
                return;
            }

            // 4. Rellenar el perfil (ahora 'perfil' existe)
            
            // Título de la página y Nombre H1
            document.title = perfil.nombre;
            document.getElementById('perfil-nombre').textContent = perfil.nombre;
            document.getElementById('perfil-descripcion').textContent = perfil.descripcion;

            // Lista de Pregunta/Respuesta
            document.getElementById('label-color').textContent = config.color;
            document.getElementById('value-color').textContent = perfil.color;
            
            document.getElementById('label-libro').textContent = config.libro;
            document.getElementById('value-libro').textContent = perfil.libro.join(', ');
            
            document.getElementById('label-musica').textContent = config.musica;
            document.getElementById('value-musica').textContent = perfil.musica.join(', ');
            
            document.getElementById('label-video_juego').textContent = config.video_juego;
            document.getElementById('value-video_juego').textContent = perfil.video_juego.join(', ');
            
            document.getElementById('label-lenguajes').textContent = config.lenguajes;
            document.getElementById('value-lenguajes').innerHTML = `<strong>${perfil.lenguajes.join(', ')}</strong>`;

            // Email (con enlace)
            const emailContainer = document.getElementById('perfil-email-container');
            const emailTexto = config.email.replace('[email]', ''); 
            emailContainer.textContent = emailTexto + ' '; 
            const emailLink = document.createElement('a');
            emailLink.href = 'mailto:' + perfil.email;
            emailLink.textContent = perfil.email;
            emailContainer.appendChild(emailLink);

            // 5. Asignar la imagen (única) a las variables CSS
            document.documentElement.style.setProperty('--profile-img-pequena', `url(${perfil.imagen})`);
            document.documentElement.style.setProperty('--profile-img-grande', `url(${perfil.imagen})`);
        };
        
        // En caso de que el archivo no exista (ej. 404)
        scriptPerfil.onerror = () => {
            console.error(`Error: No se encontró el archivo ${ci}/perfil.json.`);
            document.body.innerHTML = `<h1 id="error">Error 400/404: No se encontró el perfil ${ci}.</h1>`;
        };

        // 6. Añadir el script al <head> para iniciar la carga
        document.head.appendChild(scriptPerfil);

    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Función reutilizable para rellenar Header y Footer (usada en Index)
 */
function rellenarHeaderFooter(config, perfilUsuario) {
    // 1. Título de la página
    const pageTitle = config.sitio.join(' ');
    document.title = pageTitle;

    // 2. Título del Header (con <sub>)
    const headerTitle = `${config.sitio[0]}<sub>${config.sitio[1]}</sub> ${config.sitio[2]}`;
    document.getElementById('header-title').innerHTML = headerTitle;

    // 3. Saludo (extrae solo el primer nombre)
    const nombreUsuario = perfilUsuario.nombre.split(' ')[0];
    document.getElementById('greeting-text').textContent = `${config.saludo}, ${nombreUsuario}`;

    // 4. Placeholder de búsqueda
    document.getElementById('search-input').placeholder = config.buscar;

    // 5. Texto del Footer
    document.getElementById('footer-text').textContent = config.copyRight;
}


function loadProfile(ci) {
    // Petición AJAX al backend Python
    fetch(`index.py?action=get_profile&ci=${ci}`)
        .then(response => response.json())
        .then(data => {
            renderProfile(data);
        })
        .catch(error => console.error('Error cargando perfil:', error));
}

function renderProfile(data) {
    const perfil = data.perfil;
    const textos = data.textos; // Etiquetas traducidas del config

    const grid = document.getElementById('cards-grid');
    const container = document.getElementById('perfil-container');
    const content = document.getElementById('perfil-content');

    // Ocultar Grid, Mostrar Perfil
    grid.style.display = 'none';
    container.style.display = 'block';

    // Generar HTML Dinámico usando los datos y las etiquetas traducidas
    // Nota: Ajustamos las rutas de imagen
    content.innerHTML = `
        <div class="perfil-header">
            <img src="${perfil.imagen}" alt="${perfil.nombre}" class="profile-pic-large">
            <h1>${perfil.nombre}</h1>
            <p>${perfil.descripcion}</p>
        </div>
        <div class="perfil-details">
            <p><strong>${textos.color}:</strong> ${perfil.color}</p>
            <p><strong>${textos.libro}:</strong> ${Array.isArray(perfil.libro) ? perfil.libro.join(', ') : perfil.libro}</p>
            <p><strong>${textos.musica}:</strong> ${Array.isArray(perfil.musica) ? perfil.musica.join(', ') : perfil.musica}</p>
            <p><strong>${textos.video_juego}:</strong> ${Array.isArray(perfil.video_juego) ? perfil.video_juego.join(', ') : perfil.video_juego}</p>
            <p><strong>${textos.lenguajes}:</strong> ${Array.isArray(perfil.lenguajes) ? perfil.lenguajes.join(', ') : perfil.lenguajes}</p>
            <p><strong>Email:</strong> <a href="mailto:${perfil.email}">${perfil.email}</a></p>
        </div>
    `;
}

function showGrid() {
    document.getElementById('cards-grid').style.display = 'grid'; // O flex, según tu CSS
    document.getElementById('perfil-container').style.display = 'none';
}