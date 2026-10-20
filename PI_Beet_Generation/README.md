# Beet Generation

## Requisitos

- Git, Node.js 18 y pnpm.
- PostgreSQL y pgAdmin.
- Credenciales de prueba de Mercado Pago para probar el checkout.

## 1. Configurar PostgreSQL

Clonar el repositorio y abrir la carpeta en VS Code.

En pgAdmin, conectarse como `postgres`, seleccionar la base `postgres` y abrir **Tools > Query Tool**. Ejecutar estas instrucciones **por separado**, reemplazando la contraseña:

```sql
CREATE ROLE beet_app WITH LOGIN PASSWORD 'tu_contrasena';
```

```sql
CREATE DATABASE beet_generation OWNER beet_app;
```

## 2. Configurar el entorno

Desde la raíz del proyecto, en PowerShell:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Completar el `.env` sin borrar las claves que ya tengas:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=beet_generation
PGUSER=beet_app
PGPASSWORD=tu_contrasena
PORT=8080
APP_URL=http://localhost:8080
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_prueba
MERCADOPAGO_PUBLIC_KEY=tu_public_key_de_la_misma_aplicacion
```

Para usar PostgreSQL local, revisar que no exista un `server/.env` con valores distintos: tiene prioridad sobre el `.env` de la raíz. No subir credenciales a Git.

## 3. Instalar e iniciar

Con el servicio PostgreSQL encendido, desde la raíz:

```powershell
cd server
pnpm install --frozen-lockfile
pnpm db:setup
pnpm dev
```

Abrir [http://localhost:8080](http://localhost:8080).

Para los siguientes inicios, desde `server/` basta con `pnpm dev`. Usar `pnpm start` si no se necesitan reinicios automáticos. Detener el servidor con **Ctrl+C** y reiniciarlo después de cambiar el `.env`.

## Verificación

- [Estado de la base](http://localhost:8080/api/health): debe devolver `{"status":"ok","database":"connected"}`.
- [Catálogo](http://localhost:8080/api/products).
- Pruebas: `pnpm test` desde `server/`.

Si falla la conexión, revisar el servicio PostgreSQL, el puerto y las credenciales. Si faltan tablas, ejecutar `pnpm db:setup`. Si el puerto 8080 está ocupado, detener la instancia anterior.
