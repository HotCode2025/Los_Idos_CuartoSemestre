const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path")

// Prefer server/.env; also support the .env at the project root.
require("dotenv").config({ path: [path.join(__dirname, ".env"), path.join(__dirname, "../.env")], quiet: true });
app.get("/payment-config", (req, res) => {
 if (!process.env.MERCADOPAGO_PUBLIC_KEY) {
  return res.status(503).json({ error: "Falta MERCADOPAGO_PUBLIC_KEY en el .env. Reinicia el servidor tras configurarla." });
 }
 res.json({ publicKey: process.env.MERCADOPAGO_PUBLIC_KEY });
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname,"../client")));
app.use(cors());

app.get("/", function (req, res) {
	res.sendFile(path.resolve(__dirname, "..", "client", "index.html"));
});

app.post("/create_preference", async (req, res) => {
 if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  return res.status(503).json({ error: "Falta MERCADOPAGO_ACCESS_TOKEN en el .env. Reinicia el servidor tras configurarlo." });
 }
 if (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0 || !Number.isInteger(Number(req.body.quantity)) || Number(req.body.quantity) <= 0) {
  return res.status(400).json({ error: "El precio y la cantidad deben ser positivos y validos." });
 }


	let preference = {
		items: [
			{
				title: req.body.description,
				unit_price: Number(req.body.price),
                    currency_id: "ARS",
				quantity: Number(req.body.quantity),
			}
		],
		back_urls: {
			"success": "http://localhost:8080",
			"failure": "http://localhost:8080",
		},
	};

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

app.listen(8080, () => {
	console.log("The server is now running on Port 8080");
});