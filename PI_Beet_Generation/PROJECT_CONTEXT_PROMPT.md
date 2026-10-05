# Prompt de contexto del proyecto: Ecommerce2026

Usa la siguiente información como contexto general antes de analizar, modificar o extender este proyecto.

## 1. Identidad y objetivo

**Nombre:** Ecommerce2026  
**Tipo:** Aplicación web de comercio electrónico de ropa y accesorios.  
**Objetivo actual:** Mostrar productos, permitir agregarlos a un carrito y generar una preferencia de pago mediante Mercado Pago.

La aplicación está dividida físicamente en un cliente web estático y un servidor Node.js. El servidor sirve los archivos del cliente y expone el endpoint necesario para crear preferencias de pago.

## 2. Estructura actual

```text
Ecommerce2026/
├── package.json              # Manifiesto raíz genérico, sin dependencias útiles
├── pnpm-lock.yaml            # Lockfile raíz vacío, sin paquetes instalados
├── client/
│   ├── js/
│   │   ├── cart.js
│   │   ├── index.js
│   │   └── products.js
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── assets/
│       └── images/
│           └── products/
├── server/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── server.js
└── ...
```

El backend es el único subproyecto que utiliza dependencias de Node.js. El frontend está implementado con HTML, CSS y JavaScript nativo, sin bundler ni framework.

Actualmente existen también `package.json` y `pnpm-lock.yaml` en la raíz. Son archivos redundantes para la estructura vigente: el manifiesto raíz no declara dependencias ni scripts útiles y su lockfile no contiene paquetes. Los archivos funcionales son `server/package.json` y `server/pnpm-lock.yaml`.

## 3. Tecnologías

- **HTML5:** estructura de la tienda.
- **CSS3:** estilos, layout de productos, carrito, modal y botones.
- **JavaScript vanilla:** renderizado de productos, estado del carrito y comunicación con el backend.
- **Node.js:** runtime del servidor.
- **CommonJS:** sistema de módulos utilizado por `server/server.js`.
- **Express 5:** servidor HTTP, middleware y rutas.
- **CORS:** habilitación de solicitudes entre orígenes.
- **Mercado Pago SDK:** creación de preferencias de pago en el backend.
- **Mercado Pago Web SDK v2:** cargado mediante CDN en `client/index.html` para renderizar el botón de checkout.
- **pnpm:** gestor de paquetes utilizado para el backend.
- **Nodemon:** reinicio automático del servidor durante el desarrollo.

## 4. Dependencias del backend

Las dependencias se declaran en `server/package.json`:

```json
{
  "cors": "^2.8.6",
  "express": "^5.2.1",
  "mercadopago": "^1.5.17",
  "nodemon": "^3.1.14"
}
```

El lockfile correspondiente es `server/pnpm-lock.yaml`. Si el frontend continúa siendo JavaScript nativo servido directamente por Express, no necesita un `package.json` ni dependencias propias.

## 5. Arquitectura y responsabilidades

### Cliente

- `client/index.html` carga la hoja de estilos, el SDK de Mercado Pago y los tres scripts del cliente.
- `client/js/products.js` contiene el catálogo estático de 12 productos. Cada producto tiene identificador, nombre, precio, cantidad inicial e imagen.
- `client/js/index.js` crea las tarjetas de productos y permite agregarlos al carrito.
- `client/js/cart.js` mantiene el carrito en memoria, abre el modal, modifica cantidades, elimina productos, calcula el total y solicita el checkout.
- `client/css/styles.css` define la presentación de las tarjetas, el botón flotante del carrito, el contador, el modal y los controles de cantidad.
- `client/assets/images/products/` contiene las imágenes públicas del catálogo.

### Servidor

- `server/server.js` crea una aplicación Express.
- Express sirve estáticamente la carpeta `client`.
- La ruta `GET /` entrega `client/index.html`.
- La ruta `POST /create_preference` recibe `description`, `price` y `quantity`, crea una preferencia de Mercado Pago y devuelve su identificador.
- La ruta `GET /feedback` devuelve datos básicos del pago recibidos como query parameters.
- El servidor escucha en el puerto `8080`.
- El script de desarrollo es `pnpm start`, que ejecuta `nodemon server.js` desde la carpeta `server`.

## 6. Flujo principal de compra

1. El usuario abre `http://localhost:8080`.
2. Express entrega el HTML y sirve los archivos del cliente.
3. `products.js` define el catálogo y `index.js` dibuja las tarjetas.
4. Al pulsar **Comprar**, el producto se agrega al array `cart` o aumenta su cantidad.
5. El botón flotante abre el modal del carrito.
6. El usuario puede aumentar, disminuir o eliminar productos.
7. El total se calcula como la suma de `price * quanty`.
8. Al pulsar **Continuar al Pago**, el cliente envía una solicitud `POST` a `http://localhost:8080/create_preference`.
9. El backend crea una preferencia en Mercado Pago y devuelve `preference.id`.
10. El SDK de Mercado Pago renderiza el botón Wallet dentro de `#button-checkout`.

## 7. Estado actual

### Funcionalidades existentes

- Catálogo estático de productos.
- Renderizado dinámico de tarjetas.
- Carrito en memoria del navegador.
- Contador de unidades en el carrito.
- Modal para visualizar el carrito.
- Aumento y disminución de cantidades.
- Eliminación de productos.
- Cálculo del total.
- Creación de preferencias de pago con Mercado Pago.
- Servicio de archivos estáticos mediante Express.
- Reinicio automático del servidor con Nodemon.

### Limitaciones y pendientes

- No hay base de datos; los productos y el carrito son temporales.
- El carrito se pierde al recargar la página.
- No existe autenticación ni gestión de usuarios.
- No hay panel de administración ni gestión de inventario.
- No hay tests automatizados configurados.
- El script `test` de `server/package.json` todavía devuelve error deliberadamente.
- No hay validación robusta de los datos recibidos en `POST /create_preference`.
- La URL del backend está escrita directamente en el cliente como `http://localhost:8080`.
- Las rutas de imágenes dependen de que Express sirva correctamente la carpeta `client`.
- El idioma del documento HTML está definido como `en`, aunque la interfaz está principalmente en español.
- El título HTML todavía es `Document`.
- El CSS no muestra un tratamiento específico para todos los tamaños de pantalla.
- No se ha confirmado un repositorio Git inicializado en la carpeta del proyecto.

## 8. Riesgos de seguridad que deben atenderse

- `server/server.js` contiene un access token de Mercado Pago escrito directamente en el código. Debe revocarse o rotarse si fue expuesto y reemplazarse por una variable de entorno.
- El cliente contiene una public key de Mercado Pago escrita directamente en `cart.js`. Las claves públicas pueden estar en el cliente, pero conviene gestionarlas mediante configuración del entorno.
- No se deben subir tokens, claves privadas ni archivos `.env` al control de versiones.
- El endpoint de creación de preferencias debe validar tipos, rangos y contenido antes de comunicarse con Mercado Pago.
- En producción se deben reemplazar las URLs locales por variables de entorno y configurar HTTPS.

## 9. Convenciones para futuros cambios

- Mantener el frontend sin framework mientras no exista una necesidad clara de incorporar uno.
- Mantener las dependencias del servidor en `server/package.json` y su lockfile en `server/pnpm-lock.yaml`.
- No crear otro `package.json` en la raíz salvo que se convierta explícitamente el proyecto en un workspace o se incorporen herramientas que pertenezcan a todo el proyecto.
- Conservar la separación entre archivos estáticos del cliente y lógica del backend.
- Evitar mezclar credenciales con el código fuente.
- Antes de agregar una dependencia, comprobar si la funcionalidad puede resolverse con APIs nativas o con una dependencia ya instalada.
- Al modificar una ruta del backend, verificar el flujo completo desde el navegador hasta Mercado Pago.

## 10. Comandos de desarrollo

Desde la carpeta del backend:

```powershell
cd server
pnpm install
pnpm start
```

Después, abrir:

```text
http://localhost:8080
```

## 11. Instrucción para el asistente

Cuando trabajes sobre este proyecto:

1. Analiza primero el archivo o flujo directamente relacionado con la solicitud.
2. Respeta la separación actual entre `client` y `server`.
3. Mantén los cambios pequeños y compatibles con JavaScript vanilla y CommonJS.
4. No introduzcas un framework, bundler o base de datos sin justificarlo.
5. Verifica los cambios con una prueba o comando ejecutable cuando sea posible.
6. Señala cualquier impacto en pagos, seguridad, rutas HTTP o configuración de dependencias.
7. No expongas ni reutilices credenciales reales; usa variables de entorno y valores de ejemplo.
