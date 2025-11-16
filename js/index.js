/* Lógica principal del sitio web js/index.js
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Validar que la configuración global exista
    if (typeof config === 'undefined') {
        console.error('Error: El archivo configES.json no se cargó.');
        document.body.innerHTML = '<h1>Error fatal: No se pudo cargar la configuración.</h1>';
        return;
    }
    
    // 2. Decidir en qué página estamos
    const gridContainer = document.getElementById('cards-grid');
    const perfilContainer = document.getElementById('perfil-container');

    if (gridContainer) {
        // EN INDEX.HTML
        // Ejecutar la lógica del Index
        cargarLogicaIndex();

    } else if (perfilContainer) {
        // EN PERFIL.HTML
        
        // Ejecutar la lógica del Perfil
        cargarLogicaPerfil();
    }
});

// js/index.js (La función cargarLogicaIndex actualizada)

function cargarLogicaIndex() {
    try {
        const perfilUsuario = perfiles[0];
        rellenarHeaderFooter(config, perfilUsuario);

        const gridContainer = document.getElementById('cards-grid');
        gridContainer.innerHTML = ''; 

        perfiles.forEach(estudiante => {
            // 1. Crear el <li> (la tarjeta)
            const listItem = document.createElement('li');
            listItem.className = 'card-wrap';

            gridContainer.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error al cargar la página de inicio:', error);
    }
}

/**
    Lógica para PERFIL.HTML
    Carga el perfil específico dinámicamente SIN USAR FETCH.
    Usa el truco de "Inyección de Script JSON".
 */
function cargarLogicaPerfil() {
    try {

        // EL TRUCO: Inyectar dinámicamente el script del perfil
        const scriptPerfil = document.createElement('script');
        // El navegador cargará este archivo como un script
        scriptPerfil.src = `29900089/perfil.json`; 
        
        
        // Toda la lógica de rellenado DEBE ir dentro del 'onload'.
        scriptPerfil.onload = () => {
            
            // Verificamos que el script haya creado la variable 'perfil'
            if (typeof perfil === 'undefined') {
                console.error(`Error: El archivo 29900089/perfil.json no se cargó o no define 'const perfil'.`);
                document.body.innerHTML = `<h1>Error: No se pudo cargar el perfil 29900089.</h1>`;
                return;
            }

            // Rellenar el perfil (ahora 'perfil' existe)
            
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
            document.body.innerHTML = `<h1>Error: No se encontró el perfil ${ci}.</h1>`;
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