const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const mercadopago = require("mercadopago");
const path = require("path");

const publicUrl = process.env.PUBLIC_URL?.trim().replace(/\/$/, "");

mercadopago.configure({
	access_token: process.env.MP_ACCESS_TOKEN,
});


app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname,"../client")));
app.use(cors());

app.get("/", function (req, res) {
	res.sendFile(path.resolve(__dirname, "..", "client", "media", "index.html"));
});

app.post("/create_preference", (req, res) => {
	if (!publicUrl || !publicUrl.startsWith("https://")) {
		return res.status(500).json({
			error: "PUBLIC_URL no está configurada",
			detail: "Inicia el servidor con la URL HTTPS que te asignó ngrok.",
		});
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
			console.log(error);
			res.status(500).json({
				error: "No se pudo crear la preferencia de pago",
				detail: error.message,
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

app.listen(8080, () => {
	console.log("The server is now running on Port 8080");
	console.log(`Public URL: ${publicUrl || "no configurada"}`);
});