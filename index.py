#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import re
from urllib.parse import parse_qs

# --- FUNCIÓN HELPER (Para leer archivos 'const x = ...') ---
def load_js_data(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        # Eliminar 'const variable =' y punto y coma final
        clean_content = re.sub(r'^(const|var|let)\s+\w+\s*=\s*', '', content)
        if clean_content.endswith(';'):
            clean_content = clean_content[:-1]
        try:
            return json.loads(clean_content)
        except:
            return None

def application(environ, start_response):
    
    # 1. PARAMETROS Y CONFIGURACIÓN
    params = parse_qs(environ.get("QUERY_STRING", ""))
    lang = params.get("lang", ["ES"])[0].upper()
    ci_param = params.get("ci", [None])[0]
    search_query = params.get("q", [""])[0] # 'q' para coincidir con el name="q" del form

    base_path = "/var/www/html/ATI"
    
    # Cargar Configuración (Idioma)
    config_path = f"{base_path}/conf/config{lang}.json"
    config = load_js_data(config_path)

    # Validación básica de config
    if config is None:
        start_response("404 Not Found", [("Content-type", "text/html; charset=utf-8")])
        return [f"<h1>Error 404: No se pudo cargar la configuración de idioma ({lang}).</h1>".encode("utf-8")]

    html_output = ""

    # LÓGICA DE PERFIL (Equivalente a cargarLogicaPerfil en JS)
    if ci_param:
        perfil_path = f"{base_path}/{ci_param}/perfil.json"
        perfil = load_js_data(perfil_path)

        if not perfil:
            start_response("404 Not Found", [("Content-type", "text/html; charset=utf-8")])
            return [f'<h1 id="error">Error 400/404: No se encontró el perfil {ci_param}.</h1>'.encode("utf-8")]

        # Preparar datos (Lógica de JS traducida a Python)
        # 1. Imagen: Limpiar ruta y preparar para CSS Variable
        img_raw = perfil.get('imagen', '').replace('../', '').replace('\\', '/')
        img_name = os.path.basename(img_raw)
        img_url = f"/ATI/{ci_param}/{img_name}"

        # 2. Formatear Arrays (join ', ')
        def fmt(val):
            return ", ".join(val) if isinstance(val, list) else str(val)

        lenguajes_fmt = fmt(perfil.get('lenguajes', []))

        # 3. Email Logic (Reemplazo y Link)
        email_config_text = config.get('email', '').replace('[email]', '')
        email_val = perfil.get('email', '')

        # Generar HTML usando la estructura de perfil.html con los IDs llenos
        html_output = f"""
        <!DOCTYPE html>
        <html lang="{lang}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{perfil.get('nombre')}</title>
            <link rel="stylesheet" href="/ATI/css/style.css">
            <style>
                :root {{
                    --profile-img-pequena: url('{img_url}');
                    --profile-img-grande: url('{img_url}');
                }}
                /* Asegurar que el contenedor de imagen exista si no hay CSS externo */
                #foto-perfil {{
                    width: 200px;
                    height: 200px;
                    background-image: var(--profile-img-pequena);
                    background-size: cover;
                    background-position: center;
                    border-radius: 8px;
                }}
            </style>
        </head>
        <body>
            <div id="perfil-container" class="container">
                <div class="container-card">
                    <div class="left-container-card">
                        <div id="foto-perfil" aria-hidden="true"></div>
                    </div>
                    <div class="right-container-card">
                        <h1 id="perfil-nombre">{perfil.get('nombre')}</h1>
                        <p class="descripcion" id="perfil-descripcion">{perfil.get('descripcion', '')}</p>
                        <div class="two-column-list">
                            <ul>
                                <li>
                                    <span class="question" id="label-color">{config.get('color')}</span>
                                    <span class="answer" id="value-color">{perfil.get('color', '')}</span>
                                </li>
                                <li>
                                    <span class="question" id="label-libro">{config.get('libro')}</span>
                                    <span class="answer" id="value-libro">{fmt(perfil.get('libro'))}</span>
                                </li>
                                <li>
                                    <span class="question" id="label-musica">{config.get('musica')}</span>
                                    <span class="answer" id="value-musica">{fmt(perfil.get('musica'))}</span>
                                </li>
                                <li>
                                    <span class="question" id="label-video_juego">{config.get('video_juego')}</span>
                                    <span class="answer" id="value-video_juego">{fmt(perfil.get('video_juego'))}</span>
                                </li>
                                <li>
                                    <span class="question" id="label-lenguajes">{config.get('lenguajes')}</span>
                                    <span class="answer" id="value-lenguajes">{lenguajes_fmt}</span>
                                </li>
                            </ul>
                        </div>
                        <div class="mail">
                            <p id="perfil-email-container">{email_config_text} <a href="mailto:{email_val}">{email_val}</a></p>
                        </div>
                        <div style="margin-top:16px;">
                            <a href="index.py?lang={lang}" class="btn">Volver</a>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    # LÓGICA DE INDEX (Grid de Estudiantes)
    else:
        # Cargar lista de estudiantes
        data_index = load_js_data(f"{base_path}/datos/index.json")
        perfiles_list = data_index if isinstance(data_index, list) else data_index.get("perfiles", [])

        # Filtrar si hay búsqueda (?q=...)
        if search_query:
            perfiles_list = [p for p in perfiles_list if search_query.lower() in p.get('nombre', '').lower()]

        # Generar HTML de las tarjetas
        cards_html = ""
        for p in perfiles_list:
            # Ruta de imagen para la tarjeta
            img_raw = p.get('imagen', '').replace('\\', '/').replace('../', '')
            # Asumimos estructura /ATI/CI/foto.jpg
            img_full = f"/ATI/{img_raw}" if '/' in img_raw else f"/ATI/{p.get('ci')}/{img_raw}"
            
            cards_html += f"""
            <li class="card-wrap">
                <a href="?ci={p.get('ci')}&lang={lang}" style="text-decoration: none; color: inherit;">
                    <div class="card-header">
                         <div class="card-img" style="background-image: url('{img_full}')"></div>
                    </div>
                    <div class="card-content">
                        <h2 class="card-title">{p.get('nombre')}</h2>
                    </div>
                </a>
            </li>
            """
        
        # Mensaje si no hay resultados
        msg_html = ""
        if not perfiles_list and search_query:
             msg = config.get('searchNotFound', 'No results for [query]').replace('[query]', f'<strong>{search_query}</strong>')
             msg_html = f'<div id="search-results-message" class="search-no-results">{msg}</div>'

        html_output = f"""
        <!DOCTYPE html>
        <html lang="{lang}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{config.get('sitio', ['ATI'])[0]} {config.get('sitio', ['UCV'])[1]} {config.get('sitio', ['2025-2'])[2]}</title>
            <link rel="stylesheet" href="/ATI/css/style.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body>
            <header>
                <nav aria-label="Main">
                    <ul class="nav-list">
                        <li class="left">
                            <div class="header-left">
                                <h1 id="header-title">{config.get('sitio', ['ATI'])[0]}<sub>{config.get('sitio', ['UCV'])[1]}</sub> {config.get('sitio', ['2025-2'])[2]}</h1>
                            </div>
                        </li>
                        <li class="center">
                            <div class="header-center">
                                <div class="greeting" id="greeting-text">{config.get('saludo', ['Hola'])}, Mateo</div>
                            </div>
                        </li>
                        <li class="right">
                            <div class="header-right">
                                <form class="search" role="search" action="index.py" method="get">
                                    <input type="hidden" name="lang" value="{lang}">
                                    <input id="search-input" name="q" type="search" placeholder="{config.get('buscar', 'Search')}" aria-label="Buscar" value="{search_query}"/>
                                    <button class="search-button" aria-label="Buscar"><i class="fas fa-search" aria-hidden="true"></i></button>
                                </form>
                            </div>
                        </li>
                    </ul>
                </nav>
            </header>

            <main>
                <section class="cards-section">
                    <ul id="cards-grid" class="cards-grid">
                        {cards_html}
                    </ul>
                    {msg_html}
                </section>
            </main>

            <footer>
                <div id="footer-text">{config.get('copyRight', 'Copyright')}</div>
            </footer>
        </body>
        </html>
        """

    status = "200 OK"
    headers = [("Content-type", "text/html; charset=utf-8")]
    start_response(status, headers)
    return [html_output.encode("utf-8")]