// Creates a self-signed certificate so the store can run on https://localhost.
// Mercado Pago only returns to https URLs, so this is needed to test checkout locally.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const certDir = path.join(__dirname, '../certs');
const keyFile = path.join(certDir, 'localhost-key.pem');
const certFile = path.join(certDir, 'localhost-cert.pem');

const candidates = ['openssl',
    'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe'];
const openssl = candidates.find((bin) => {
    try { execFileSync(bin, ['version'], { stdio: 'ignore' }); return true; } catch { return false; }
});
if (!openssl) {
    console.error('No se encontro OpenSSL. Instala Git para Windows (incluye OpenSSL) y volve a intentar.');
    process.exit(1);
}

fs.mkdirSync(certDir, { recursive: true });
execFileSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '825',
    '-keyout', keyFile, '-out', certFile, '-subj', '/CN=localhost',
    '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'ignore' });
console.log(`Certificado creado en ${certDir}`);
