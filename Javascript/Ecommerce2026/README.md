# Ecommerce Los Idos

Aplicacion de ecommerce con frontend estatico, servidor Express y checkout de Mercado Pago.

## Requisitos

- Node.js 18 o superior.
- pnpm instalado. Si no esta disponible, habilitarlo con `corepack enable`.
- Una cuenta de Mercado Pago con credenciales de prueba o produccion.
- ngrok instalado y autenticado con `ngrok config add-authtoken <TU_NGROK_AUTHTOKEN>`.

## 1. Instalar dependencias

Abrir PowerShell en la carpeta del servidor:

```powershell
cd "C:\Users\gigli\Desktop\Los_Idos_CuartoSemestre\Javascript\Ecommerce2026\server"
pnpm install
```

Las dependencias del proyecto son:

- `express`: servidor HTTP y rutas.
- `cors`: permite solicitudes desde otros origenes.
- `dotenv`: carga las variables de `.env`.
- `mercadopago`: crea preferencias de pago desde el backend.
- `nodemon`: reinicia el servidor durante el desarrollo.

## 2. Configurar las credenciales

Crear `server/.env` con este formato:

```env
MP_ACCESS_TOKEN=APP_USR-<ACCESS_TOKEN_PRIVADO_DE_MERCADO_PAGO>
PUBLIC_URL=https://<URL_DE_NGROK>
```

### Manejo del access token

`MP_ACCESS_TOKEN` es una credencial privada. El servidor la carga con `dotenv` y la usa en:

```javascript
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN,
});
```

El token nunca debe:

- escribirse en `client/js/cart.js`;
- enviarse al navegador;
- publicarse en GitHub o incluirse en capturas de pantalla;
- agregarse a un archivo versionado.

El archivo `.gitignore` ya excluye `.env`. Si el token se expone, revocarlo y generar uno nuevo desde Mercado Pago.

La clave publica usada por el SDK del navegador esta en `client/js/cart.js`. Es normal que sea visible en el frontend, pero debe pertenecer a la misma cuenta y entorno que el `MP_ACCESS_TOKEN` del servidor.

## 3. Iniciar el servidor

Desde `server`:

```powershell
pnpm start
```

El servidor queda disponible localmente en:

```text
http://localhost:8080
```

Debe mostrar un mensaje parecido a:

```text
The server is now running on Port 8080
Public URL: https://<URL_DE_NGROK>
```

`PUBLIC_URL` es obligatoria porque Mercado Pago la utiliza para las URLs de retorno del pago.

## 4. Iniciar ngrok en otra terminal

Abrir una segunda terminal de PowerShell y ejecutar:

```powershell
ngrok http 8080
```

Copiar la URL HTTPS que aparece en `Forwarding`, por ejemplo:

```text
https://vigorous-persuader-flatness.ngrok-free.app
```

Actualizar `PUBLIC_URL` en `server/.env` con esa URL, sin `/` al final:

```env
PUBLIC_URL=https://vigorous-persuader-flatness.ngrok-free.app
```

Después de cambiar `.env`, detener y volver a iniciar `pnpm start`, porque `dotenv` lee las variables al arrancar el proceso.

> La URL gratuita de ngrok puede cambiar al reiniciar el túnel. Cada vez que cambie, actualizar `PUBLIC_URL` y reiniciar el servidor.

## 5. Abrir la tienda

Usar la URL HTTPS de ngrok en el navegador:

```text
https://<URL_DE_NGROK>/media/
```

También se puede abrir `http://localhost:8080/media/` para revisar la tienda localmente. Para probar correctamente los retornos de Mercado Pago, usar la URL de ngrok.

## 6. Probar el checkout

1. Agregar un producto al carrito.
2. Abrir el carrito.
3. Pulsar `Continuar al Pago`.
4. El frontend solicita `POST /create_preference`.
5. El backend usa el `MP_ACCESS_TOKEN` para crear la preferencia.
6. Mercado Pago devuelve un `preferenceId`.
7. El frontend inicializa el Wallet Brick con ese identificador y la clave publica.
8. Completar el pago con credenciales de prueba si se esta usando el entorno de prueba.
9. Mercado Pago redirige a `/feedback` y el servidor devuelve al frontend con el estado de la operacion.

## Solucion rapida de errores

### Error `401 Unauthorized` en `/bricks/preferences`

Verificar que la clave publica de `client/js/cart.js` y el `MP_ACCESS_TOKEN` de `server/.env` pertenezcan a la misma cuenta y entorno de Mercado Pago. Luego recargar la pagina sin cache.

### Error `PUBLIC_URL no esta configurada`

Comprobar que `server/.env` contiene una URL HTTPS valida y reiniciar el servidor.

### ngrok termina con error usando `ngrok start`

`ngrok start` necesita un nombre de tunel definido en la configuracion. Para este proyecto usar directamente:

```powershell
ngrok http 8080
```

### El navegador no puede conectar con el servidor

Confirmar que `pnpm start` sigue ejecutandose y que ngrok apunta al mismo puerto `8080`.

## Detener los procesos

En cada terminal presionar `Ctrl+C`:

1. Primero en la terminal de ngrok.
2. Luego en la terminal del servidor.
