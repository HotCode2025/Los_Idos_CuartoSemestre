const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path")
const fs = require("fs");
const https = require("https");

require('./config');
const { pool, getProducts, getProductsByIds } = require('./db');
const { parseCart, buildPaymentItems } = require('./checkout');
const { createAuthRouter } = require('./auth');
const port = Number(process.env.PORT || 8080);
const appUrl = (process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : `http://localhost:${port}`)).replace(/\/$/, '');

app.get('/api/products', async (req, res) => {
    try { res.json(await getProducts()); }
    catch (error) {
        console.error('Error de catalogo PostgreSQL:', error.code || error.name);
        res.status(503).json({ error: 'No se pudo cargar el catalogo. Revisa PostgreSQL y ejecuta pnpm db:setup.' });
    }
});
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT id FROM products LIMIT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch {
        res.status(503).json({ status: 'error', database: 'unavailable' });
    }
});

app.get("/payment-config", (req, res) => {
 if (!process.env.MERCADOPAGO_PUBLIC_KEY) {
  return res.status(503).json({ error: "Falta MERCADOPAGO_PUBLIC_KEY en el .env. Reinicia el servidor tras configurarla." });
 }
 res.json({ publicKey: process.env.MERCADOPAGO_PUBLIC_KEY });
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/api/auth', createAuthRouter(pool, { appUrl }));

app.use(express.static(path.join(__dirname,"../client")));
app.use(cors());

app.get("/", function (req, res) {
	res.sendFile(path.resolve(__dirname, "..", "client", "index.html"));
});

app.post("/create_preference", async (req, res) => {
 if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  return res.status(503).json({ error: "Falta MERCADOPAGO_ACCESS_TOKEN en el .env. Reinicia el servidor tras configurarlo." });
 }
    let quantities;
    try { quantities = parseCart(req.body?.items); }
    catch (error) { return res.status(400).json({ error: error.message }); }

    let products;
    try { products = await getProductsByIds([...quantities.keys()]); }
    catch (error) {
        console.error('Error PostgreSQL al pagar:', error.code || error.name);
        return res.status(503).json({ error: 'No se pudieron consultar los precios en PostgreSQL.' });
    }
    let items;
    try { items = buildPaymentItems(quantities, products); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    const preference = {
        items,
        back_urls: { success: `${appUrl}/`, failure: `${appUrl}/`, pending: `${appUrl}/` },
    };
    // Mercado Pago only redirects automatically to https URLs; on http (localhost)
    // the buyer returns with the "Volver al sitio" button instead.
    if (appUrl.startsWith('https://')) preference.auto_return = 'all';

    try {
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(preference),
            signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok) {
            const detail = String(data.message || data.error || "Solicitud rechazada")
                .split(process.env.MERCADOPAGO_ACCESS_TOKEN).join("[REDACTADO]").slice(0, 500);
            console.error("Mercado Pago rechazo la preferencia:", response.status, detail);
            return res.status(502).json({ error: `Mercado Pago (${response.status}): ${detail}` });
        }
        if (!data.id) throw new Error("Respuesta sin identificador de preferencia");
        res.json({ id: data.id });
    } catch (error) {
        console.error("No se pudo conectar con Mercado Pago:", error.cause?.code || error.name);
        res.status(502).json({ error: "No se pudo conectar con Mercado Pago. Revisa la conexion a Internet del servidor e intenta nuevamente." });
    }
});

app.get('/feedback', function (req, res) {
	res.json({
		Payment: req.query.payment_id,
		Status: req.query.status,
		MerchantOrder: req.query.merchant_order_id
	});
});

if (require.main === module && !process.env.VERCEL) {
    app.listen(port, () => console.log(`Tienda disponible en http://localhost:${port}`));
    // Local https (pnpm cert) so Mercado Pago can return to the store after paying.
    const httpsPort = Number(process.env.HTTPS_PORT);
    const certDir = path.join(__dirname, 'certs');
    if (httpsPort && fs.existsSync(path.join(certDir, 'localhost-cert.pem'))) {
        https.createServer({
            key: fs.readFileSync(path.join(certDir, 'localhost-key.pem')),
            cert: fs.readFileSync(path.join(certDir, 'localhost-cert.pem')),
        }, app).listen(httpsPort, () => console.log(`Tienda con https en https://localhost:${httpsPort}`));
    } else if (httpsPort) {
        console.warn('HTTPS_PORT esta configurado pero falta el certificado. Ejecuta pnpm cert.');
    }
}
module.exports = app;