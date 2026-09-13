- Abrir pgadmin
- Crear una bdd llamada test_db con owner postgres
- Ejecutar esta query 'CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);'

En Visual:
- Revisar que en conexion.py tu puerto y contraseña sean las de default mencionadas
- Parado sobre la carpeta de Laboratiorio_01 ejecutar en la terminal 'python -m laboratorio_usuarios.menu_app_usuario'

