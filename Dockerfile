# 1. Imagen base: Usamos una imagen oficial de Ubuntu como punto de partida.
FROM ubuntu:latest

# 2. Establecer variables de entorno para evitar interacciones durante la instalación
# (Recomendado para entornos no interactivos como Dockerfile)
ENV DEBIAN_FRONTEND=noninteractive

# 3. Instalar Apache2 y herramientas necesarias (como se haría manualmente).
# 'apt update' actualiza las listas de paquetes.
# 'apt install -y apache2' instala el servidor Apache, Python, WSGI y PIP
# 'apt-get clean' limpia el cache para mantener la imagen pequeña.
RUN apt-get update && apt-get install -y apache2 \
    apache2-utils \
    python3 \
    python3-pip \
    libapache2-mod-wsgi-py3 \
    python3-venv \
    && apt-get clean

# 4. Habilitar el módulo WSGI en Apache
RUN a2enmod wsgi

# 5.  Configuración del Entorno Virtual y Librerías
RUN mkdir -p /home/apps
RUN python3 -m venv /home/apps/web_env

# 6. Instalamos beaker-py dentro del entorno virtual
RUN . /home/apps/web_env/bin/activate \
    && pip install beaker-py --break-system-packages

# 7. Preparar el directorio de la aplicación y copiar recursos
RUN mkdir -p /var/www/html/ATI
COPY . /var/www/html/ATI

# 8. Configuración de Apache para el proyecto 
# si el archivo 'ati_wsgi.conf' existe en la carpeta 'dockerfile-conf/'
COPY /dockerfile-conf/ati_wsgi.conf /etc/apache2/conf-available/
RUN a2enconf ati_wsgi

# 9. Ajustes finales de permisos y puertos
RUN chown -R www-data:www-data /var/www/html/ATI

# 10. Comando de ejecución: Instrucción para iniciar el servidor Apache
# La forma correcta de iniciar Apache en el foreground (necesario para Docker)
# es usando /usr/sbin/apache2ctl -D FOREGROUND.
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
