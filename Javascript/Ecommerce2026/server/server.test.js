const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

process.env.MP_ACCESS_TOKEN = "TEST-private-token";
process.env.MP_PUBLIC_KEY = "TEST-public-key";
process.env.PUBLIC_URL = "https://example.com";
const mercadopago = require("mercadopago");
const app = require("./server");
let server;
let base;
let preference;
const originalCreate = mercadopago.preferences.create;

before(async () => {
    mercadopago.preferences.create = async (value) => {
        preference = value;
        return { body: { id: "test-preference" } };
    };
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    mercadopago.preferences.create = originalCreate;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test("sirve la tienda y todos los recursos locales referenciados", async () => {
    for (const url of ["/", "/media/"]) {
        const response = await fetch(base + url);
        assert.equal(response.status, 200);
        const html = await response.text();
        for (const [, resource] of html.matchAll(/(?:src|href)="(\/(?:js|media)\/[^\"]+)"/g)) {
            assert.equal((await fetch(base + resource)).status, 200, resource);
        }
    }
    const fs = require("node:fs");
    const path = require("node:path");
    const catalog = fs.readFileSync(path.join(__dirname, "../Client/Js/products.js"), "utf8");
    for (const [resource] of catalog.matchAll(/\/media\/[^\"]+\.png/g)) {
        assert.equal((await fetch(base + resource)).status, 200, resource);
    }
});

test("expone solo la clave publica", async () => {
    assert.deepEqual(await (await fetch(base + "/config")).json(), { publicKey: "TEST-public-key" });
    assert.equal((await fetch(base + "/.env")).status, 404);
});

test("valida el carrito y crea preferencias con retornos HTTPS", async () => {
    const post = (body) => fetch(base + "/create_preference", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    for (const body of [{}, { description: "Compra", price: -1, quantity: 1 },
        { description: "Compra", price: 300, quantity: 0.5 }]) {
        assert.equal((await post(body)).status, 400);
    }
    const response = await post({ description: "Compra", price: 600, quantity: 1 });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: "test-preference" });
    assert.equal(preference.items[0].unit_price, 600);
    assert.equal(preference.back_urls.success, "https://example.com/feedback");
});

test("regresa a la tienda con el estado informado por Mercado Pago", async () => {
    const response = await fetch(base + "/feedback?payment_id=123&status=pending", { redirect: "manual" });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/?payment_id=123&status=pending&merchant_order_id=");
});

test("controla los errores del proveedor sin exponer credenciales", async () => {
    mercadopago.preferences.create = async () => { throw new Error("TEST-private-token"); };
    const response = await fetch(base + "/create_preference", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "Compra", price: 300, quantity: 1 }),
    });
    assert.equal(response.status, 500);
    assert.ok(!(await response.text()).includes("TEST-private-token"));
});
