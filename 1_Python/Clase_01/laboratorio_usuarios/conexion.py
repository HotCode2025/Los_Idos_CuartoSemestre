import os

from psycopg2 import DatabaseError
from psycopg2.pool import SimpleConnectionPool

from .excepciones import ConexionError
from .logger_base import logger


class Conexion:
    DATABASE = os.getenv("DB_NAME", "test_db")
    USERNAME = os.getenv("DB_USER", "postgres")
    PASSWORD = os.getenv("DB_PASSWORD", "admin")
    DB_PORT = os.getenv("DB_PORT", "5432")
    HOST = os.getenv("DB_HOST", "127.0.0.1")
    MIN_CON = int(os.getenv("DB_MIN_CON", "1"))
    MAX_CON = int(os.getenv("DB_MAX_CON", "5"))
    _pool: SimpleConnectionPool | None = None

    @classmethod
    def obtener_pool(cls) -> SimpleConnectionPool:
        if cls._pool is None:
            try:
                cls._pool = SimpleConnectionPool(
                    cls.MIN_CON,
                    cls.MAX_CON,
                    host=cls.HOST,
                    port=cls.DB_PORT,
                    database=cls.DATABASE,
                    user=cls.USERNAME,
                    password=cls.PASSWORD,
                )
                logger.info("Pool de conexiones creado")
            except (DatabaseError, ValueError) as error:
                logger.exception("No se pudo crear el pool")
                raise ConexionError("No se pudo conectar con la base de datos") from error
        return cls._pool

    @classmethod
    def obtener_conexion(cls):
        try:
            return cls.obtener_pool().getconn()
        except (DatabaseError, AttributeError) as error:
            logger.exception("No se pudo obtener una conexión")
            raise ConexionError("No hay conexiones disponibles") from error

    @classmethod
    def liberar_conexion(cls, conexion) -> None:
        if conexion is None or cls._pool is None:
            return
        try:
            cls._pool.putconn(conexion)
        except DatabaseError as error:
            logger.exception("No se pudo liberar la conexión")
            raise ConexionError("No se pudo devolver la conexión al pool") from error

    @classmethod
    def cerrar_conexiones(cls) -> None:
        if cls._pool is not None:
            try:
                cls._pool.closeall()
                logger.info("Pool de conexiones cerrado")
            except DatabaseError as error:
                logger.exception("No se pudo cerrar el pool")
                raise ConexionError("No se pudieron cerrar las conexiones") from error
            finally:
                cls._pool = None

