const fs = require('node:fs');
const path = require('node:path');

// Vercel sirve public/ desde su CDN; express.static es para el desarrollo local.
const source = path.resolve(__dirname, '../../client');
const destination = path.resolve(__dirname, '../public');
const products = require('../db/products.json');
for (const product of products) {
    const imagePath = decodeURIComponent(product.img);
    const image = path.resolve(source, '.' + imagePath);
    if (!image.startsWith(source + path.sep) || !fs.existsSync(image)) {
        throw new Error(`Falta la imagen inicial del producto ${product.id}: ${product.img}`);
    }
}
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
console.log('Frontend copiado desde client/ a server/public/.');
