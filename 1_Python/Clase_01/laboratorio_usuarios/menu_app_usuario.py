from .conexion import Conexion
from .excepciones import AplicacionError, ValidacionError
from .logger_base import log
from .Usuario import Usuario
from .usuario_dao import UsuarioDAO


def leer_texto(mensaje):
    valor = input(mensaje).strip()
    if not valor:
        raise ValidacionError("El valor no puede quedar vacío")
    return valor


def leer_id(mensaje):
    identificador = int(input(mensaje))
    if identificador <= 0:
        raise ValidacionError("El id debe ser un entero positivo")
    return identificador


def ejecutar_menu():
    opcion = None
    while opcion != 5:
        try:
            print("Opciones:")
            print("1. Listar Usuarios")
            print("2. Agregar Usuario")
            print("3. Modificar Usuario")
            print("4. Eliminar Usuario")
            print("5. Salir")
            opcion = int(input("Digite la opción (1-5): "))

            if opcion == 1:
                usuarios = UsuarioDAO.seleccionar()
                if not usuarios:
                    log.info("No hay usuarios registrados")
                for usuario in usuarios:
                    log.info(usuario)
            elif opcion == 2:
                username_var = leer_texto("Digite el nombre de usuario: ")
                password_var = leer_texto("Digite su contraseña: ")
                usuario = Usuario(username=username_var, password=password_var)
                usuario_insertado = UsuarioDAO.insertar(usuario)
                log.info("Usuario insertado: %s", usuario_insertado)
            elif opcion == 3:
                id_usuario_var = leer_id("Digite el id del usuario a modificar: ")
                username_var = leer_texto("Digite el nombre del usuario a modificar: ")
                password_var = leer_texto("Digite la contraseña del usuario a modificar: ")
                usuario = Usuario(id_usuario_var, username_var, password_var)
                usuario_actualizado = UsuarioDAO.actualizar(usuario)
                log.info("Usuario actualizado: %s", usuario_actualizado)
            elif opcion == 4:
                id_usuario_var = leer_id("Digite el id del usuario a eliminar: ")
                usuario = Usuario(id_usuario=id_usuario_var)
                usuario_eliminado = UsuarioDAO.eliminar(usuario)
                log.info("Usuario eliminado: %s", usuario_eliminado)
            elif opcion == 5:
                log.info("Salimos de la aplicación, hasta pronto!!!")
            else:
                log.warning("Opción incorrecta; digite un número del 1 al 5")
        except ValueError:
            log.warning("Debe ingresar un número válido. La aplicación continúa.")
        except (AplicacionError, EOFError) as error:
            log.error("%s. Puede volver a intentarlo.", error)
        except KeyboardInterrupt:
            log.warning("Operación cancelada. Elija 5 para salir.")
        except Exception:
            log.exception("Error inesperado; la aplicación continuará")

    try:
        Conexion.cerrar_conexiones()
    except AplicacionError as error:
        log.warning("No se pudieron cerrar las conexiones: %s", error)


if __name__ == "__main__":
    ejecutar_menu()
