# Beet Generation

Beet Generation es una tienda web de ropa y accesorios. El catálogo y el carrito están implementados en JavaScript nativo; un servidor Express sirve el sitio y expone una ruta para iniciar el checkout con Mercado Pago.

## Requisitos

- Node.js 18 o posterior.
- pnpm. Si tu instalación de Node incluye Corepack, puedes habilitarlo con `corepack enable`.
- Un navegador web moderno.

No se necesita instalar dependencias para el cliente: Express sirve directamente los archivos estáticos de `client/`.

## Ejecutar localmente

Desde la carpeta raíz del proyecto, instala las dependencias del servidor y arráncalo:

```sh
cd server
pnpm install --frozen-lockfile
pnpm start
```

En PowerShell también puedes usar:

```powershell
Set-Location .\server
pnpm install --frozen-lockfile
pnpm start
```

Abre [http://localhost:8080](http://localhost:8080). Nodemon reinicia el servidor cuando detecta cambios en sus archivos. Para detenerlo, pulsa `Ctrl+C` en la terminal.

> Ejecuta los comandos de pnpm desde `server/`: allí están el manifiesto y el lockfile funcionales. El `package.json` de la raíz no contiene scripts ni dependencias de la aplicación.

## Configuración de pagos y seguridad

La tienda y el carrito se pueden explorar localmente sin completar una compra. Al continuar al pago, el cliente envía una solicitud a `POST /create_preference` y necesita acceso a Mercado Pago.

**No uses el checkout para pagos reales en este estado.** El código actual contiene un access token de Mercado Pago directamente en `server/server.js` y no carga configuración desde `.env` ni desde variables de entorno. Como esa credencial está expuesta en el código, debe revocarse o rotarse antes de cualquier uso. No copies credenciales reales a archivos versionados ni las compartas.

Para probar pagos, primero configura el backend para leer un access token de prueba desde una variable de entorno y utiliza las credenciales de prueba de tu propia cuenta de Mercado Pago. La implementación actual no permite configurar el token de esa manera todavía. La public key usada por el SDK del cliente es visible en el navegador; utiliza también una clave de prueba para pruebas locales.

El SDK web de Mercado Pago se carga desde un CDN, por lo que el navegador necesita conexión a Internet para inicializar el checkout.

## Estructura del proyecto

```text
PI_Beet_Generation/
├── client/
│   ├── assets/images/products/  # Imágenes del catálogo
│   ├── css/styles.css           # Estilos de la tienda y el carrito
│   ├── js/
│   │   ├── products.js          # Catálogo estático
│   │   ├── index.js             # Renderizado de productos y acciones
│   │   └── cart.js              # Carrito y solicitud del checkout
│   └── index.html
└── server/
    ├── package.json             # Dependencias y scripts del servidor
    ├── pnpm-lock.yaml
    └── server.js                # Express, archivos estáticos y rutas HTTP
```

El catálogo contiene 12 productos estáticos. El carrito se mantiene en memoria del navegador y se pierde al recargar la página; el proyecto no usa base de datos ni autenticación.

## Rutas del servidor

- `GET /`: entrega la página de la tienda.
- `POST /create_preference`: solicita a Mercado Pago una preferencia para el checkout.
- `GET /feedback`: devuelve los parámetros básicos del resultado del pago.

El servidor escucha en el puerto `8080`. El cliente también tiene escrita esa dirección localmente en `client/js/cart.js`.

## Desarrollo y pruebas

El servidor se inicia con `pnpm start` desde `server/`. No hay una suite de pruebas configurada: el script `pnpm test` termina intencionalmente con un error de “no test specified”.

Si el puerto `8080` ya está ocupado, detén el otro proceso que lo utiliza antes de iniciar el servidor. Si la página carga pero no aparecen estilos o imágenes, revisa la consola del navegador y confirma que estás abriendo el sitio en `http://localhost:8080`, no abriendo `client/index.html` directamente.
