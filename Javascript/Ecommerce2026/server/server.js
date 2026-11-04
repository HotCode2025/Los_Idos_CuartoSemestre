const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const app = express();
const cors = require("cors");
const mercadopago = require("mercadopago");

const publicUrl = process.env.PUBLIC_URL?.trim().replace(/\/$/, "");

mercadopago.configure({
	access_token: process.env.MP_ACCESS_TOKEN,
});


app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/media", express.static(path.join(__dirname, "../Client/Media")));
app.use("/js", express.static(path.join(__dirname, "../Client/Js")));
app.use(cors());

app.get("/", function (req, res) {
	res.sendFile(path.resolve(__dirname, "..", "Client", "Media", "index.html"));
});

app.get("/config", (req, res) => {
	res.json({ publicKey: process.env.MP_PUBLIC_KEY || "" });
});

app.post("/create_preference", (req, res) => {
	let validPublicUrl = false;
	try { validPublicUrl = new URL(publicUrl).protocol === "https:"; } catch {}
	if (!validPublicUrl) {
		return res.status(500).json({
			error: "PUBLIC_URL no está configurada",
			detail: "Inicia el servidor con la URL HTTPS que te asignó ngrok.",
		});
	}

	if (!process.env.MP_ACCESS_TOKEN || !process.env.MP_PUBLIC_KEY) {
		return res.status(503).json({ error: "Configura MP_ACCESS_TOKEN y MP_PUBLIC_KEY en server/.env" });
	}
	const { description, price, quantity } = req.body || {};
	if (typeof description !== "string" || !description.trim() ||
		!Number.isFinite(price) || price <= 0 ||
		!Number.isSafeInteger(quantity) || quantity < 1) {
		return res.status(400).json({ error: "El producto, precio o cantidad no son validos" });
	}

	let preference = {
		items: [
			{
				title: req.body.description,
				unit_price: Number(req.body.price),
				quantity: Number(req.body.quantity),
			}
		],
		back_urls: {
			"success": `${publicUrl}/feedback`,
			"failure": `${publicUrl}/feedback`,
			"pending": `${publicUrl}/feedback`
		},
		auto_return: "approved"
	};

	mercadopago.preferences.create(preference)
		.then(function (response) {
			res.json({
				id: response.body.id
			});
		}).catch(function (error) {
			console.error("Mercado Pago rechazo la preferencia:", error.status || "error");
			res.status(500).json({
				error: "No se pudo crear la preferencia de pago",
			});
		});
});

app.get('/feedback', function (req, res) {
	const query = new URLSearchParams({
		payment_id: req.query.payment_id || "",
		status: req.query.status || "",
		merchant_order_id: req.query.merchant_order_id || ""
	});

	res.redirect(`/?${query.toString()}`);
});

if (require.main === module) app.listen(8080, () => {
	console.log("The server is now running on Port 8080");
	console.log(`Public URL: ${publicUrl || "no configurada"}`);
});

module.exports = app;
