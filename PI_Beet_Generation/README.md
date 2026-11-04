# Beet Generation

## Requisitos

- Git, Node.js 22.x y pnpm.
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
pnpm dev
```

Al iniciar, el servidor crea las tablas que falten y carga el catalogo inicial desde `server/db/products.json`. Cada producto se importa una sola vez: los cambios y eliminaciones en la base no se sobrescriben ni reaparecen al reiniciar. Los nuevos productos agregados al JSON con IDs nuevos también se importan una sola vez. Abrir [http://localhost:8080](http://localhost:8080).

Los datos del producto (nombre, descripcion, precio, estilos e imagen) se guardan en PostgreSQL. Los archivos de imagen siguen estando en `client/assets/images/products/`; la base guarda la ruta de cada imagen. Para ocultar un producto sin perder sus datos, se puede marcar como inactivo (`active = false`).

El comando `pnpm db:setup` sigue disponible para preparar la base manualmente; `pnpm db:setup -- --update-catalog` vuelve a sincronizar los datos del catalogo con `products.json`.

### Recuperar contraseña (correo con Gmail)

El enlace para crear una contraseña nueva se envía desde la cuenta de Gmail de la tienda. En esa cuenta activar la verificación en dos pasos, crear una **contraseña de aplicación** en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) y completar en el `.env`:

```env
GMAIL_USER=correo_de_la_tienda@gmail.com
GMAIL_APP_PASSWORD=la_contrasena_de_aplicacion
```

Sin estos datos el correo no se envía: el enlace aparece en la terminal del servidor (útil para probar). El enlace vence a los 30 minutos y sirve una sola vez.

### Probar pagos (https local)

Mercado Pago solo vuelve a la tienda después de pagar si la dirección usa `https`. Para eso, una sola vez desde `server/`:

```powershell
pnpm cert
```

Con `HTTPS_PORT=8443` y `APP_URL=https://localhost:8443` en el `.env`, reiniciar el servidor y abrir [https://localhost:8443](https://localhost:8443). La primera vez el navegador avisa que el certificado no es de confianza (es local): elegir **Configuración avanzada → Continuar a localhost**.

Para los siguientes inicios, desde `server/` basta con `pnpm dev`. Usar `pnpm start` si no se necesitan reinicios automáticos. Detener el servidor con **Ctrl+C** y reiniciarlo después de cambiar el `.env`.

## Verificación

- [Estado de la base](http://localhost:8080/api/health): debe devolver `{"status":"ok","database":"connected"}`.
- [Catálogo](http://localhost:8080/api/products).
- Pruebas: `pnpm test` desde `server/`.

Si falla la conexión, revisar el servicio PostgreSQL, el puerto y las credenciales. Si faltan tablas, ejecutar `pnpm db:setup`. Si la tienda muestra productos viejos o sin imagen, ejecutar `pnpm db:setup -- --update-catalog` para reemplazar el catálogo con `server/db/products.json`. Si el puerto 8080 está ocupado, detener la instancia anterior.

## Carrito guardado por cuenta

- Sin iniciar sesion, el carrito se conserva en este navegador usando localStorage.
- Al ingresar o crear una cuenta, sus productos se suman al carrito guardado en PostgreSQL. Si un producto esta en ambos, se suman las cantidades hasta un maximo de 99 unidades. Los reintentos de esa misma combinacion no duplican unidades.
- Con la sesion iniciada, agregar, cambiar cantidades o eliminar productos actualiza `cart_items` para ese usuario. Al recargar o volver a ingresar, se recupera ese carrito con los precios actuales del catalogo.
- Al salir, el carrito de la cuenta deja de mostrarse, pero sigue guardado. Otra cuenta recupera su propio carrito.
- Si falla el guardado, aparece un aviso y el cambio no se muestra como guardado. Reintentar la accion cuando vuelva la conexion.

Las rutas `GET /api/cart`, `PUT /api/cart` y `POST /api/cart/merge` requieren la cookie de sesion. El servidor obtiene el usuario desde la sesion; no acepta un usuario enviado por el navegador. La tabla `cart_merges` evita duplicar la combinacion del carrito de invitado tras una respuesta perdida. Las tablas se preparan con el arranque habitual o con `pnpm db:setup`.

Para probar: agregar productos sin ingresar, iniciar sesion, modificar cantidades, recargar, salir y volver a ingresar. El carrito debe mantenerse; una segunda cuenta no debe ver esos productos. El carrito no se vacia automaticamente por los parametros de retorno del pago: eso requiere confirmar el pago en el servidor.

Pruebas habituales: `pnpm test` desde `server/`. Para incluir la prueba de PostgreSQL en un esquema temporal aislado:

```powershell
$env:CART_DB_TEST="1"
pnpm test
Remove-Item Env:CART_DB_TEST
```

## Panel de administracion

Ingresar a la tienda con la cuenta `generationbeet@gmail.com` y su contrasena habitual. Aparece el enlace **Administracion** en el encabezado; tambien se puede abrir `/admin` en el mismo origen. Si la cuenta todavia no existe, registrarla con ese email: es la cuenta administradora inicial. No se crea una contrasena por defecto.

El panel muestra el total de usuarios, administradores y productos activos. Desde la lista de usuarios se puede aprobar o retirar el acceso administrativo de otras cuentas registradas. La cuenta principal y el acceso propio estan protegidos contra la revocacion desde el panel. Las cuentas comunes siguen pudiendo comprar sin aprobacion administrativa.

La aprobacion se guarda en `users.approved_admin`. El servidor valida la sesion y el permiso en cada ruta `/api/admin`; no toma permisos enviados en el registro ni confia en ocultar el enlace del navegador. Retirar el acceso bloquea las siguientes solicitudes incluso si la cuenta sigue logueada. El email inicial esta definido en `server/permissions.js`.

Reiniciar el servidor o ejecutar `pnpm db:setup` para agregar la columna sin modificar los datos existentes. Las pruebas de permisos, login, aprobacion y revocacion contra PostgreSQL se incluyen con `CART_DB_TEST=1`, usando esquemas temporales aislados.

### Gestion de productos

En `/admin`, la seccion **Productos** permite listar y buscar activos e inactivos, crear productos y editar nombre, descripcion, precio en pesos, imagen, estilos y estado. Para la imagen, usar una URL HTTPS o una ruta de archivo existente como `/assets/images/products/buzo_gris.png`; este formulario no sube archivos.

**Desactivar** implementa la eliminacion logica: el producto deja de aparecer en el catalogo y no se puede pagar, pero conserva sus referencias en los carritos guardados. Para recuperarlo, buscarlo entre los inactivos, editarlo y marcar **Activo en la tienda**. Los cambios se guardan en PostgreSQL y aparecen al recargar la tienda.

Las rutas `GET/POST /api/admin/products` y `PUT/DELETE /api/admin/products/:id` requieren acceso administrativo aprobado. El servidor valida todos los campos y usa los precios de PostgreSQL al pagar.

### Categorias del catalogo

El selector del nav permite filtrar Mujer, Hombre, Unisex y Accesorios, combinados con busqueda, estilo y precio. En Administracion > Productos > Editar se asigna la categoria de cada producto. Los productos existentes se conservan como **Sin categoria** hasta clasificarlos: siguen apareciendo en **Todas las categorias**. La categoria se guarda en PostgreSQL y el servidor valida sus valores. Ejecutar `pnpm db:setup` o reiniciar el servidor para agregar la columna.

## Checkout en tres pasos

Desde el carrito, **Continuar al Pago** abre `/checkout`:

1. **Confirmar productos:** revisar cantidades, quitar productos y confirmar. El servidor consulta precios y disponibilidad actuales en PostgreSQL.
2. **Direccion:** completar destinatario, email, telefono, calle, altura, localidad, provincia y codigo postal de Argentina. Piso y departamento son opcionales.
3. **Pago:** revisar productos y direccion, volver a corregir si hace falta y pulsar **Pagar con Mercado Pago**. Solo entonces se crea la preferencia y se redirige al checkout de Mercado Pago en la misma pestana.

El carrito sigue usando la misma persistencia de invitados y cuentas. La direccion permanece en memoria mientras la pagina esta abierta; no se guarda en localStorage. Se valida en el servidor y se envia a Mercado Pago con la preferencia (ver [referencia oficial](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post)). No se calcula una tarifa de envio en este flujo: se muestra el total de productos. Si el precio cambia antes de pagar, se pide volver al paso 1. Crear una preferencia no confirma un pago ni genera todavia un pedido con seguimiento en la base; esa confirmacion requiere integrar los webhooks.

Las pruebas del checkout simulan Mercado Pago y no realizan cobros ni envian direcciones reales.

### Subnav de familias y subcategorias

Debajo del encabezado hay un menu simple de **Calzado**, **Indumentaria** y **Accesorios**, con subcategorias como Zapatillas, Buzos, Pantalones, Carteras y Mochilas. Cada familia permite ver todos sus productos o elegir una subcategoria. La seleccion se combina con busqueda, publico, estilos y orden por precio; la etiqueta del catalogo permite quitarla.

En Admin > Productos, elegir **Familia** y luego **Subcategoria** al crear o editar. La clasificacion anterior de Mujer/Hombre/Unisex se conserva en el campo **Publico**. Los productos existentes quedan sin clasificar por familia hasta asignarles una; siguen apareciendo en **Ver todo**. No se agregan productos de ejemplo. Las opciones compartidas por el menu, el formulario y la validacion del servidor estan en `client/js/catalog-taxonomy.js`. Reiniciar el servidor o ejecutar `pnpm db:setup` para crear las dos columnas nuevas.

### Autocompletar la clasificacion existente

Los campos del CRUD, incluidos publico, familia y subcategoria, se guardan en PostgreSQL al pulsar **Guardar producto**. Reiniciar el servidor no reemplaza estos cambios por el JSON inicial.

Desde `server/`, `npm run products:classify` muestra una propuesta basada en nombres y descripciones. `npm run products:classify -- --apply` guarda solamente las familias y subcategorias pendientes en una transaccion. Conserva las clasificaciones manuales, el publico, precios, nombres, descripciones y estado activo. Si no hay una coincidencia reconocible, no inventa una categoria. Incluye Camisas y Musculosas para clasificar los productos actuales. Se puede volver a ejecutar despues de incorporar productos sin clasificar.

### Productos importados de las imagenes recibidas

Las 23 imagenes del lote del 4 de noviembre de 2026 se guardaron en `client/assets/images/products/import-*.jpg`. La descripcion, la clasificacion y los precios elegidos entre $25.000 y $60.000 estan en `server/db/imports/products-2026-11-04.json`; los productos se cargan en PostgreSQL, no se leen del manifiesto al navegar. Se pueden editar normalmente desde el admin.

Para reproducir esa importacion en otra base: desde `server/`, ejecutar `node scripts/import-image-products.js` para ver la propuesta y `node scripts/import-image-products.js --apply` para guardarla. El comando valida las imagenes y los datos, crea el lote en una transaccion y omite los productos cuyo archivo de imagen ya existe en la base. No reemplaza productos ni vuelve a sortear los precios. Las fotos son miniaturas tal como se recibieron y no se inventan materiales, talles ni especificaciones tecnicas.

### Segundo lote y submenu disponible

El segundo lote de 12 imagenes esta en `server/db/imports/products-2026-11-04-batch2.json` y usa el mismo rango de precios de $25.000 a $60.000. Se importa con `node scripts/import-image-products.js --batch=products-2026-11-04-batch2.json --apply`. El comando conserva los productos existentes y omite imagenes ya importadas.

El subnav se construye al cargar el catalogo: solo muestra familias y subcategorias que tengan productos activos. Agregar o desactivar productos desde el admin se refleja en el submenu al recargar la tienda. El admin mantiene todas las opciones para poder clasificar futuros productos. La disponibilidad se calcula sobre el catalogo activo completo, antes de combinar busqueda, estilos o publico.
