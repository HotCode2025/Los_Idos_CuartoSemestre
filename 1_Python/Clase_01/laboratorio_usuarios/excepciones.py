class AplicacionError(Exception):
    """Excepción base para errores controlados de la aplicación."""


class ConexionError(AplicacionError):
    """No fue posible obtener o utilizar una conexión."""


class UsuarioDaoError(AplicacionError):
    """Falló una operación de persistencia de usuarios."""


class ValidacionError(AplicacionError):
    """Los datos ingresados no son válidos."""

