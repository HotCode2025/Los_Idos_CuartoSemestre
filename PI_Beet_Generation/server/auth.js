const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');
const { waitUntil } = require('@vercel/functions');
const { sendPasswordResetEmail } = require('./mailer');

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = 'beet_session';
const SESSION_DAYS = 7;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const RESET_MINUTES = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(password, salt, SCRYPT.keylen, SCRYPT);
    return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
    const [scheme, N, r, p, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = await scrypt(password, Buffer.from(salt, 'hex'), expected.length, { N: +N, r: +r, p: +p });
    return crypto.timingSafeEqual(actual, expected);
}

function parseCredentials(body, { register = false } = {}) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new Error('Ingresa un email valido.');
    if (register) {
        if (name.length < 2 || name.length > 80) throw new Error('El nombre debe tener entre 2 y 80 caracteres.');
        validateNewPassword(password);
    } else if (!password || password.length > 128) {
        throw new Error('Ingresa tu contraseña.');
    }
    return { email, password, name };
}

function validateNewPassword(password) {
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        throw new Error('La contraseña debe tener entre 8 y 128 caracteres.');
    }
    return password;
}

const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

function readSessionToken(req) {
    for (const part of String(req.headers.cookie || '').split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === SESSION_COOKIE) return value.join('=');
    }
    return null;
}

// Hash used when the email does not exist, so both failure paths take the same time.
const dummyHash = hashPassword(crypto.randomBytes(16).toString('hex'));

// Small in-memory limiter: 5 failed logins per email every 15 minutes.
const failedLogins = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
function isLoginBlocked(email) {
    const entry = failedLogins.get(email);
    if (entry && Date.now() - entry.since > LOGIN_WINDOW_MS) failedLogins.delete(email);
    return (failedLogins.get(email)?.count || 0) >= 5;
}
function recordFailedLogin(email) {
    const entry = failedLogins.get(email) || { count: 0, since: Date.now() };
    entry.count++;
    failedLogins.set(email, entry);
}

function createAuthRouter(pool, { appUrl }) {
    const router = express.Router();

    // Secure flag when the request arrived over https (directly or through a proxy such as Vercel).
    const setSessionCookie = (req, res, token, maxAgeSeconds) => {
        const secure = req.secure || req.get('x-forwarded-proto') === 'https';
        res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`);
    };

    async function startSession(req, res, userId) {
        const token = crypto.randomBytes(32).toString('base64url');
        await pool.query(`INSERT INTO sessions (token_hash, user_id, expires_at)
            VALUES ($1, $2, now() + make_interval(days => $3))`, [tokenHash(token), userId, SESSION_DAYS]);
        setSessionCookie(req, res, token, SESSION_DAYS * 24 * 60 * 60);
    }

    // Only JSON bodies are accepted: together with SameSite=Lax this blocks cross-site form posts.
    router.use((req, res, next) => {
        if (req.method === 'POST' && !req.is('application/json')) {
            return res.status(415).json({ error: 'Se esperaba JSON.' });
        }
        next();
    });

    router.post('/register', async (req, res) => {
        let credentials;
        try { credentials = parseCredentials(req.body, { register: true }); }
        catch (error) { return res.status(400).json({ error: error.message }); }
        try {
            const passwordHash = await hashPassword(credentials.password);
            const { rows } = await pool.query(`INSERT INTO users (name, email, password_hash)
                VALUES ($1, $2, $3) RETURNING id, name, email`, [credentials.name, credentials.email, passwordHash]);
            await startSession(req, res, rows[0].id);
            res.status(201).json({ user: rows[0] });
        } catch (error) {
            if (error.code === '23505') return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
            console.error('Error PostgreSQL al registrar:', error.code || error.name);
            res.status(503).json({ error: 'No se pudo crear la cuenta. Revisa PostgreSQL.' });
        }
    });

    router.post('/login', async (req, res) => {
        let credentials;
        try { credentials = parseCredentials(req.body); }
        catch (error) { return res.status(400).json({ error: error.message }); }
        if (isLoginBlocked(credentials.email)) {
            return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
        }
        try {
            const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE lower(email) = $1', [credentials.email]);
            const user = rows[0];
            const valid = await verifyPassword(credentials.password, user ? user.password_hash : await dummyHash);
            if (!user || !valid) {
                recordFailedLogin(credentials.email);
                return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
            }
            failedLogins.delete(credentials.email);
            await startSession(req, res, user.id);
            res.json({ user: { id: user.id, name: user.name, email: user.email } });
        } catch (error) {
            console.error('Error PostgreSQL al iniciar sesion:', error.code || error.name);
            res.status(503).json({ error: 'No se pudo iniciar sesion. Revisa PostgreSQL.' });
        }
    });

    router.post('/logout', async (req, res) => {
        const token = readSessionToken(req);
        try {
            if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1 OR expires_at < now()', [tokenHash(token)]);
        } catch (error) {
            console.error('Error PostgreSQL al cerrar sesion:', error.code || error.name);
        }
        setSessionCookie(req, res, '', 0);
        res.json({ ok: true });
    });

    router.get('/me', async (req, res) => {
        const token = readSessionToken(req);
        if (!token) return res.json({ user: null });
        try {
            const { rows } = await pool.query(`SELECT u.id, u.name, u.email FROM sessions s
                JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()`, [tokenHash(token)]);
            res.json({ user: rows[0] || null });
        } catch (error) {
            console.error('Error PostgreSQL al leer la sesion:', error.code || error.name);
            res.status(503).json({ error: 'No se pudo verificar la sesion.' });
        }
    });

    // Always answers the same, so the form does not reveal which emails have an account.
    router.post('/forgot', async (req, res) => {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!EMAIL_PATTERN.test(email) || email.length > 254) return res.status(400).json({ error: 'Ingresa un email valido.' });
        try {
            // At most one link per minute for each account.
            const { rows } = await pool.query(`SELECT id, name, email FROM users WHERE lower(email) = $1
                AND NOT EXISTS (SELECT 1 FROM password_resets r WHERE r.user_id = users.id
                    AND r.created_at > now() - interval '1 minute')`, [email]);
            const user = rows[0];
            if (user) {
                const token = crypto.randomBytes(32).toString('base64url');
                await pool.query(`INSERT INTO password_resets (token_hash, user_id, expires_at)
                    VALUES ($1, $2, now() + make_interval(mins => $3))`, [tokenHash(token), user.id, RESET_MINUTES]);
                // Sent after answering, so the response time does not reveal whether the account exists.
                waitUntil(sendPasswordResetEmail(user.email, user.name, `${appUrl}/?reset=${token}`)
                    .catch((error) => console.error('No se pudo enviar el correo de recuperacion:', error.code || error.message)));
            }
            res.json({ message: 'Si hay una cuenta con ese email, te enviamos un enlace para crear una contraseña nueva.' });
        } catch (error) {
            console.error('Error PostgreSQL al pedir recuperacion:', error.code || error.name);
            res.status(503).json({ error: 'No se pudo procesar el pedido. Intenta mas tarde.' });
        }
    });

    router.post('/reset', async (req, res) => {
        const token = typeof req.body?.token === 'string' ? req.body.token : '';
        let password;
        try { password = validateNewPassword(req.body?.password); }
        catch (error) { return res.status(400).json({ error: error.message }); }
        if (!token) return res.status(400).json({ error: 'El enlace no es valido.' });
        let client;
        try {
            client = await pool.connect();
            await client.query('BEGIN');
            // Deleting the token makes the link single-use even with simultaneous requests.
            const { rows } = await client.query(`DELETE FROM password_resets WHERE token_hash = $1
                RETURNING user_id, expires_at > now() AS valid`, [tokenHash(token)]);
            if (!rows[0]?.valid) {
                await client.query('COMMIT');
                return res.status(400).json({ error: 'El enlace vencio o ya fue usado. Pedi uno nuevo.' });
            }
            const userId = rows[0].user_id;
            const { rows: users } = await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2
                RETURNING id, name, email`, [await hashPassword(password), userId]);
            // Close every open session and pending link: whoever knew the old password is logged out.
            await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
            await client.query('COMMIT');
            failedLogins.delete(users[0].email.toLowerCase());
            await startSession(req, res, userId);
            res.json({ user: users[0] });
        } catch (error) {
            await client?.query('ROLLBACK').catch(() => {});
            console.error('Error PostgreSQL al cambiar la contraseña:', error.code || error.name);
            res.status(503).json({ error: 'No se pudo cambiar la contraseña. Revisa PostgreSQL.' });
        } finally {
            client?.release();
        }
    });

    return router;
}

module.exports = { hashPassword, verifyPassword, parseCredentials, readSessionToken, createAuthRouter };
