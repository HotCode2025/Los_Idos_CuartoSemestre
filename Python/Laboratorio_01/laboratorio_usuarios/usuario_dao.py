from psycopg2 import DatabaseError

from .cursor_del_pool import CursorDelPool
from .excepciones import ConexionError, UsuarioDaoError
from .logger_base import log
from .Usuario import Usuario


class UsuarioDAO:
    """DAO (Data Access Object) para realizar el CRUD de la tabla usuario."""

    _SELECT = "SELECT * FROM usuario ORDER BY id_usuario"
    _INSERTAR = "INSERT INTO usuario(username, password) VALUES (%s, %s)"
    _ACTUALIZAR = "UPDATE usuario SET username=%s, password=%s WHERE id_usuario=%s"
    _ELIMINAR = "DELETE FROM usuario WHERE id_usuario=%s"

    @classmethod
    def seleccionar(cls):
        try:
            with CursorDelPool() as cursor:
                log.debug("Seleccionando usuarios")
                cursor.execute(cls._SELECT)
                usuarios = []
                for registro in cursor.fetchall():
                    usuarios.append(Usuario(registro[0], registro[1], registro[2]))
                return usuarios
        except (DatabaseError, ConexionError) as error:
            log.exception("Error al listar usuarios")
            raise UsuarioDaoError("No se pudieron consultar los usuarios") from error

    @classmethod
    def insertar(cls, usuario):
        try:
            with CursorDelPool() as cursor:
                log.debug("Usuario a insertar: %s", usuario)
                valores = (usuario.username, usuario.password)
                cursor.execute(cls._INSERTAR, valores)
                return cursor.rowcount
        except (DatabaseError, ConexionError) as error:
            log.exception("Error al agregar usuario")
            raise UsuarioDaoError(
                "No se pudo agregar el usuario; compruebe si el nombre ya existe"
            ) from error

    @classmethod
    def actualizar(cls, usuario):
        try:
            with CursorDelPool() as cursor:
                log.debug("Usuario a actualizar: %s", usuario)
                valores = (usuario.username, usuario.password, usuario.id_usuario)
                cursor.execute(cls._ACTUALIZAR, valores)
                return cursor.rowcount
        except (DatabaseError, ConexionError) as error:
            log.exception("Error al actualizar usuario")
            raise UsuarioDaoError("No se pudo actualizar el usuario") from error

    @classmethod
    def eliminar(cls, usuario):
        try:
            with CursorDelPool() as cursor:
                log.debug("Usuario a eliminar: %s", usuario)
                valores = (usuario.id_usuario,)
                cursor.execute(cls._ELIMINAR, valores)
                return cursor.rowcount
        except (DatabaseError, ConexionError) as error:
            log.exception("Error al eliminar usuario")
            raise UsuarioDaoError("No se pudo eliminar el usuario") from error


UsuarioDao = UsuarioDAO
