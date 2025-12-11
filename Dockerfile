# 1. Imagen base: Usamos una imagen oficial de Ubuntu como punto de partida.
FROM ubuntu:22.04

# 2. Establecer variables de entorno para evitar interacciones durante la instalación
# (Recomendado para entornos no interactivos como Dockerfile)
ENV DEBIAN_FRONTEND=noninteractive

# 3. Instalar Apache2 y herramientas necesarias (como se haría manualmente).
# 'apt update' actualiza las listas de paquetes.
# 'apt install -y apache2' instala el servidor Apache.
# 'rm -rf /var/lib/apt/lists/*' limpia el cache para mantener la imagen pequeña.
RUN apt update \
    && apt install -y apache2 \
    && apt-get update -y \
    && apt-get upgrade -y \
    && apt-get install -y nano net-tools \
    && rm -rf /var/lib/apt/lists/*

# 4. Copiar los recursos del proyecto.
# La carpeta por defecto para el sitio web en Apache2 sobre Ubuntu es /var/www/html/
# Borramos el index.html por defecto de Apache y copiamos todos nuestros archivos.
RUN rm -f /var/www/html/index.html
COPY . /var/www/html/

# 5. Exponer el puerto por defecto de Apache
EXPOSE 80

# 6. Comando de ejecución: Instrucción para iniciar el servidor Apache
# La forma correcta de iniciar Apache en el foreground (necesario para Docker)
# es usando /usr/sbin/apache2ctl -D FOREGROUND.
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
