#Este juego tiene la temática de una revancha contra los marcianos de Mars Attacks! Tiene 3 dificultades
#y hay que tratar de eliminar la mayor cantidad de naves sin morir.

import pygame
import sys
import random
import os

from personaje import Personaje, Enemigo, Explosion
from constantes import SCREEN_WIDTH, SCREEN_HEIGHT, IMAGES_PATH, SOUNDS_PATH


def cargar_imagen(nombre, tamano=None):
    ruta = os.path.join(IMAGES_PATH, nombre)
    imagen = pygame.image.load(ruta).convert_alpha()

    if tamano:
        imagen = pygame.transform.scale(imagen, tamano)

    return imagen


def cargar_sonido(nombre):
    ruta = os.path.join(SOUNDS_PATH, nombre)

    try:
        return pygame.mixer.Sound(ruta)
    except (pygame.error, FileNotFoundError) as error:
        print(f"No se pudo cargar {nombre}: {error}")
        return None


def texto_centrado(screen, texto, fuente, color, y):
    superficie = fuente.render(texto, True, color)
    rect = superficie.get_rect(
        center=(SCREEN_WIDTH // 2, y)
    )
    screen.blit(superficie, rect)


def dibujar_boton(screen, texto, rect, mouse_pos, fuente):
    # cambio los colores cuando paso el mouse por arriba del boton
    esta_seleccionado = rect.collidepoint(mouse_pos)
     # colores de los botones
    color_borde = (240, 86, 69) if esta_seleccionado else (240, 86, 69)
    color_fondo = (240, 86, 69) if esta_seleccionado else (48, 18, 27)
    color_detalle = (255, 255, 255) if esta_seleccionado else (255, 170, 100)
    color_texto = (15, 15, 25) if esta_seleccionado else BLANCO

    # agrego una sombra abajo para que el boton resalte un poco
    sombra = rect.move(0, 6)
    pygame.draw.rect(
        screen, (2, 4, 16), sombra, border_radius=5
    )

    # dibujo el fondo y el borde redondeado del boton
    pygame.draw.rect(screen, color_fondo, rect, border_radius=5)
    pygame.draw.rect(
        screen, color_borde, rect, 2, border_radius=5
    )


    # dejo el texto justo en el centro del boton
    etiqueta = fuente.render(texto, True, color_texto)
    screen.blit(etiqueta, etiqueta.get_rect(center=rect.center))


def dibujar_fondo_oscuro(screen):
    # oscurezco un poco el fondo asi se leen mejor las letras
    capa = pygame.Surface(
        (SCREEN_WIDTH, SCREEN_HEIGHT),
        pygame.SRCALPHA
    )
    capa.fill((3, 5, 25, 165))
    screen.blit(capa, (0, 0))

def menu_principal(screen, fondo, reloj):
    fuente_titulo = pygame.font.Font(None, 68)
    fuente_subtitulo = pygame.font.Font(None, 28)
    fuente_boton = pygame.font.Font(None, 42)

    ancho_boton = 220
    alto_boton = 55
    espacio_entre_botones = 20

    # centro los botones para poner uno abajo del otro
    inicio_x = (SCREEN_WIDTH - ancho_boton) // 2
    posicion_y = SCREEN_HEIGHT // 2

    boton_jugar = pygame.Rect(
        inicio_x, posicion_y, ancho_boton, alto_boton
    )

    boton_salir = pygame.Rect(
        inicio_x,
        posicion_y + alto_boton + espacio_entre_botones,
        ancho_boton,
        alto_boton
    )

    while True:
        mouse_pos = pygame.mouse.get_pos()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                if event.key == pygame.K_RETURN:
                    return True

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if boton_jugar.collidepoint(event.pos):
                    return True
                if boton_salir.collidepoint(event.pos):
                    return False

        screen.blit(fondo, (0, 0))
        dibujar_fondo_oscuro(screen)

        texto_centrado(
            screen, "Mars Attacks!",
            fuente_titulo, (255, 145, 77), SCREEN_HEIGHT // 3
        )

        texto_centrado(
            screen, "¡Marte es una amenaza!",
            fuente_subtitulo, BLANCO, SCREEN_HEIGHT // 3 + 50
        )

        dibujar_boton(screen, "JUGAR", boton_jugar, mouse_pos, fuente_boton)
        dibujar_boton(screen, "SALIR", boton_salir, mouse_pos, fuente_boton)

        pygame.display.flip()
        reloj.tick(60)


def seleccionar_nivel(screen, fondo, reloj):
    fuente_titulo = pygame.font.Font(None, 60)
    fuente_boton = pygame.font.Font(None, 38)
    fuente_texto = pygame.font.Font(None, 25)
    fuente_aclaracion = pygame.font.Font(None, 25)

    ancho_boton = 260
    alto_boton = 55
    espacio_entre_botones = 28
    ancho_total = ancho_boton * 3 + espacio_entre_botones * 2
    inicio_x = (SCREEN_WIDTH - ancho_total) // 2
    posicion_y = SCREEN_HEIGHT // 2 + 25
    caja_aclaracion = pygame.Rect(
        SCREEN_WIDTH // 2 - 370,
        posicion_y + alto_boton + 42,
        740,
        110
    )

    botones = [
        (
            pygame.Rect(inicio_x, posicion_y, ancho_boton, alto_boton),
            "Principiante", "facil"
        ),
        (
            pygame.Rect(
                inicio_x + ancho_boton + espacio_entre_botones,
                posicion_y,
                ancho_boton,
                alto_boton
            ),
            "Normal", "medio"
        ),
        (
            pygame.Rect(
                inicio_x + (ancho_boton + espacio_entre_botones) * 2,
                posicion_y,
                ancho_boton,
                alto_boton
            ),
            "Veterano", "dificil"
        )
    ]

    while True:
        mouse_pos = pygame.mouse.get_pos()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return None

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return None
                if event.key == pygame.K_1:
                    return "facil"
                if event.key == pygame.K_2:
                    return "medio"
                if event.key == pygame.K_3:
                    return "dificil"

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                for rect, texto, dificultad in botones:
                    if rect.collidepoint(event.pos):
                        return dificultad

        screen.blit(fondo, (0, 0))
        dibujar_fondo_oscuro(screen)

        texto_centrado(
            screen, "SELECCIONA LA DIFICULTAD",
            fuente_titulo, (240, 86, 69), SCREEN_HEIGHT // 3 - 10
        )

        texto_centrado(
            screen, "Elige tu nivel de experiencia:",
            fuente_texto, BLANCO, SCREEN_HEIGHT // 3 + 35
        )

        # caja con los colores de los botones
        pygame.draw.rect(
            screen, (48, 18, 27), caja_aclaracion, border_radius=5
        )
        pygame.draw.rect(
            screen, (240, 86, 69), caja_aclaracion, 2, border_radius=5
        )

        # aca muestro cual es la dificultad de cada nivel
        aclaraciones = (
            "Principiante: Si tienes miedo.",
            "Normal: Si estás acostumbrado a juegos matamarcianos.",
            "Veterano: Donde se ven los verdaderos valientes."
        )
        for indice, texto in enumerate(aclaraciones):
            etiqueta = fuente_aclaracion.render(texto, True, BLANCO)
            posicion = etiqueta.get_rect(
                center=(
                    caja_aclaracion.centerx,
                    caja_aclaracion.top + 23 + indice * 31
                )
            )
            screen.blit(etiqueta, posicion)

        for rect, texto, dificultad in botones:
            dibujar_boton(screen, texto, rect, mouse_pos, fuente_boton)

        pygame.display.flip()
        reloj.tick(60)

BLANCO = (245, 248, 255)
CELESTE = (60, 200, 255)
VIOLETA = (145, 90, 255)
NEGRO = (5, 8, 25)
ROJO = (255, 65, 75)
VERDE = (40, 230, 130)


def dibujar_interfaz(
    screen, personaje, puntos, nivel, enemigos_matados,
    enemigos_escapados
):
    # dejo espacio arriba para la vida y los datos de la partida
    pygame.draw.rect(
        screen, NEGRO,
        (0, 0, SCREEN_WIDTH, 112)
    )

    fuente_interfaz = pygame.font.Font(None, 25)

    # hago que la energia quede entre 0 y 100 para que la barra no se pase
    energia = max(0, min(100, personaje.energia))
    x, y = 20, 48
    ancho, alto = 180, 22

    pygame.draw.rect(
        screen, (150, 35, 45),
        (x, y, ancho, alto)
    )

    if energia > 0:
        color_vida = VERDE if energia > 30 else ROJO
        pygame.draw.rect(
            screen, color_vida,
            (x, y, int(ancho * energia / 100), alto)
        )

    pygame.draw.rect(
        screen, BLANCO,
        (x, y, ancho, alto), 2
    )

    texto_vida = fuente_interfaz.render(
        f"VIDA: {energia}%", True, BLANCO
    )
    screen.blit(texto_vida, (20, 12))

    # acomodo los puntos, eliminados, escapados y nivel en la segunda fila
    datos = (
        (f"PUNTUACION: {puntos}", BLANCO, SCREEN_WIDTH * 0.18),
        (f"ELIMINADOS: {enemigos_matados}", VERDE, SCREEN_WIDTH * 0.42),
        (f"ESCAPADOS: {enemigos_escapados}", ROJO, SCREEN_WIDTH * 0.68),
        (f"NIVEL: {nivel}", CELESTE, SCREEN_WIDTH * 0.91)
    )
    for texto, color, centro_x in datos:
        etiqueta = fuente_interfaz.render(texto, True, color)
        screen.blit(
            etiqueta, etiqueta.get_rect(center=(int(centro_x), 82))
        )




def pantalla_game_over(
    screen, fondo, reloj, puntos, enemigos_matados, enemigos_escapados
):
    fuente_grande = pygame.font.Font(None, 74)
    fuente_pequena = pygame.font.Font(None, 34)
    fuente_boton = pygame.font.Font(None, 34)
    ancho_boton = 300
    alto_boton = 60
    espacio_entre_botones = 32
    ancho_total = ancho_boton * 2 + espacio_entre_botones
    inicio_x = (SCREEN_WIDTH - ancho_total) // 2
    posicion_y = SCREEN_HEIGHT // 2 + 115
    boton_elegir_nivel = pygame.Rect(
        inicio_x, posicion_y, ancho_boton, alto_boton
    )
    boton_salir = pygame.Rect(
        inicio_x + ancho_boton + espacio_entre_botones,
        posicion_y,
        ancho_boton,
        alto_boton
    )

    while True:
        mouse_pos = pygame.mouse.get_pos()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_n:
                    return True
                if event.key in (pygame.K_ESCAPE, pygame.K_RETURN):
                    return False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if boton_elegir_nivel.collidepoint(event.pos):
                    return True
                if boton_salir.collidepoint(event.pos):
                    return False

        screen.blit(fondo, (0, 0))
        dibujar_fondo_oscuro(screen)

        texto_centrado(
            screen, "GAME OVER",
            fuente_grande, ROJO, SCREEN_HEIGHT // 2 - 55
        )

        texto_centrado(
            screen, f"Puntuacion final: {puntos}",
            fuente_pequena, BLANCO, SCREEN_HEIGHT // 2
        )

        texto_centrado(
            screen,
            f"Enemigos eliminados: {enemigos_matados}   |   Escapados: {enemigos_escapados}",
            fuente_pequena,
            BLANCO,
            SCREEN_HEIGHT // 2 + 48
        )

        texto_centrado(
            screen, "Presiona N para elegir otro nivel o ESC para salir",
            fuente_pequena, BLANCO, SCREEN_HEIGHT // 2 + 88
        )

        dibujar_boton(
            screen, "ELEGIR NIVEL", boton_elegir_nivel, mouse_pos, fuente_boton
        )
        dibujar_boton(
            screen, "SALIR", boton_salir, mouse_pos, fuente_boton
        )

        pygame.display.flip()
        reloj.tick(60)



def jugar_partida(
    screen, fondo, reloj, dificultad, sonido_laser, sonido_explosion,
    sonido_muerte
):
    # segun la dificultad elegida cambia la cantidad de enemigos que pueden salir
    dificultades = {
        "facil": (0.012, 0.002, 0.045),
        "medio": (0.020, 0.003, 0.080),
        "dificil": (0.035, 0.005, 0.120)
    }

    probabilidad_inicial, incremento, probabilidad_maxima = dificultades[dificultad]

    personaje = Personaje(
        SCREEN_WIDTH // 2,
        SCREEN_HEIGHT - 100
    )

    enemigos = []
    explosiones = []

    puntos = 0
    enemigos_matados = 0
    enemigos_escapados = 0
    nivel = 1
    siguiente_nivel = 250

    running = True
    personaje_muerto = False

    ultimo_disparo = 0
    intervalo_disparo = 250

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

        if not running:
            break

        
        keys = pygame.key.get_pressed()
        dx = 0
        dy = 0

        if keys[pygame.K_LEFT]:
            dx -= 5
        if keys[pygame.K_RIGHT]:
            dx += 5
        if keys[pygame.K_UP]:
            dy -= 5
        if keys[pygame.K_DOWN]:
            dy += 5

        personaje.mover(dx, dy)

        personaje.shape.clamp_ip(
            pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
        )

     
        tiempo_actual = pygame.time.get_ticks()

        if (
            keys[pygame.K_SPACE]
            and tiempo_actual - ultimo_disparo >= intervalo_disparo
        ):
            personaje.lanzar_laser()
            ultimo_disparo = tiempo_actual

            if sonido_laser:
                sonido_laser.play()

        
        for enemigo in enemigos[:]:
            enemigo.mover()

            if enemigo.rect.top > SCREEN_HEIGHT:
                enemigos.remove(enemigo)
                enemigos_escapados += 1
                continue

            if enemigo.rect.colliderect(personaje.shape):
                personaje.energia = 0
                personaje_muerto = True
                if sonido_muerte:
                    sonido_muerte.play()
                running = False
                break

            for laser in personaje.lasers[:]:
                if enemigo.rect.colliderect(laser.rect):
                    explosiones.append(
                        Explosion(
                            enemigo.rect.centerx,
                            enemigo.rect.centery
                        )
                    )

                    if enemigo in enemigos:
                        enemigos.remove(enemigo)
                        enemigos_matados += 1

                    if laser in personaje.lasers:
                        personaje.lasers.remove(laser)

                    puntos += 10

                    if sonido_explosion:
                        sonido_explosion.play()

                    break

        if not running:
            break

        # a medida que subimos de nivel hay mas chances de que salgan enemigos
        probabilidad = min(
            probabilidad_inicial + (nivel - 1) * incremento,
            probabilidad_maxima
        )

        if random.random() < probabilidad:
            x = random.randint(0, SCREEN_WIDTH - 80)
            enemigos.append(Enemigo(x, 0))

        # saco los disparos que ya se fueron de la pantalla
        personaje.lasers = [
            laser for laser in personaje.lasers
            if laser.rect.bottom > 0
        ]

        # actualizo las explosiones y saco las que ya terminaron
        explosiones = [
            explosion for explosion in explosiones
            if explosion.actualizar()
        ]

        # cada vez que llegamos a los puntos necesarios subimos un nivel
        while puntos >= siguiente_nivel:
            nivel += 1
            siguiente_nivel += 250

        screen.blit(fondo, (0, 0))

        personaje.dibujar(screen)

        for enemigo in enemigos:
            enemigo.dibujar(screen)

        for explosion in explosiones:
            explosion.dibujar(screen)

        
        dibujar_interfaz(
            screen, personaje, puntos, nivel,
            enemigos_matados, enemigos_escapados
        )

        pygame.display.flip()
        reloj.tick(60)

    return (
        personaje_muerto,
        puntos,
        enemigos_matados,
        enemigos_escapados
    )


def main():
    pygame.init()

    try:
        pygame.mixer.init()
    except pygame.error as error:
        print("El audio no está disponible:", error)

    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Mars Attacks!")
    reloj = pygame.time.Clock()

    try:
        fondo = cargar_imagen(
            "fondo.jfif", (SCREEN_WIDTH, SCREEN_HEIGHT)
        )

        try:
            pygame.display.set_icon(cargar_imagen("001.jfif"))
        except (pygame.error, FileNotFoundError) as error:
            print("No se pudo cargar el icono:", error)
    except (pygame.error, FileNotFoundError) as error:
        print("Error al cargar los fondos:", error)
        pygame.quit()
        return

    sonido_laser = cargar_sonido("disparo.mp3")
    sonido_explosion = cargar_sonido("explosion.mp3")
    sonido_muerte = cargar_sonido("muerte.mp3")

    if sonido_laser:
        sonido_laser.set_volume(0.20)

    if sonido_explosion:
        sonido_explosion.set_volume(0.30)

    if sonido_muerte:
        sonido_muerte.set_volume(0.45)

    ruta_musica = os.path.join(SOUNDS_PATH, "fondo.mp3")
    try:
        pygame.mixer.music.load(ruta_musica)
        pygame.mixer.music.set_volume(0.20)
        pygame.mixer.music.play(-1)
    except (pygame.error, FileNotFoundError) as error:
        print("No se pudo cargar la música:", error)

    if not menu_principal(screen, fondo, reloj):
        pygame.quit()
        return

    # si perdemos podemos volver a elegir nivel y empezar otra partida
    while True:
        dificultad = seleccionar_nivel(screen, fondo, reloj)
        if dificultad is None:
            break

        (
            personaje_muerto,
            puntos,
            enemigos_matados,
            enemigos_escapados
        ) = jugar_partida(
            screen, fondo, reloj, dificultad,
            sonido_laser, sonido_explosion, sonido_muerte
        )

        if not personaje_muerto:
            break

        volver_a_elegir_nivel = pantalla_game_over(
            screen, fondo, reloj, puntos,
            enemigos_matados, enemigos_escapados
        )
        if not volver_a_elegir_nivel:
            break

    pygame.quit()


if __name__ == "__main__":
    main()
