from .conexion import Conexion
from .excepciones import ConexionError
from .logger_base import logger


class CursorDelPool:
    def __init__(self):
        self._conexion = None
        self._cursor = None

    def __enter__(self):
        try:
            self._conexion = Conexion.obtener_conexion()
            self._cursor = self._conexion.cursor()
            return self._cursor
        except Exception as error:
            if self._conexion is not None:
                Conexion.liberar_conexion(self._conexion)
                self._conexion = None
            if isinstance(error, ConexionError):
                raise
            logger.exception("No se pudo crear el cursor")
            raise ConexionError("No se pudo abrir un cursor") from error

    def __exit__(self, tipo_excepcion, valor_excepcion, traceback):
        try:
            if self._conexion is not None:
                if tipo_excepcion is None:
                    self._conexion.commit()
                else:
                    self._conexion.rollback()
                    logger.error("Operación revertida: %s", valor_excepcion)
        finally:
            if self._cursor is not None:
                self._cursor.close()
            if self._conexion is not None:
                Conexion.liberar_conexion(self._conexion)
        return False

