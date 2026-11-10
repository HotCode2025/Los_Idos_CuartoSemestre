import os

# Define el tamaño de la ventana donde se dibuja el juego.
SCREEN_WIDTH = 1700
SCREEN_HEIGHT = 1000

# Guarda un color azul que puede reutilizarse en los elementos del juego.
COLOR_LASER = (0, 0, 255)  # Azul

# Construye las rutas a las carpetas de imágenes y sonidos junto a este archivo.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), 'assets_1')
IMAGES_PATH = os.path.join(ASSETS_PATH, 'imagenes')
SOUNDS_PATH = os.path.join(ASSETS_PATH, 'sonidos')
