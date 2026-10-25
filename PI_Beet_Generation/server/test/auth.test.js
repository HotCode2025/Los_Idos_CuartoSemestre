const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, parseCredentials, readSessionToken } = require('../auth');

test('hashes passwords with a random salt and verifies them', async () => {
    const first = await hashPassword('secreto123');
    const second = await hashPassword('secreto123');
    assert.notEqual(first, second);
    assert.ok(!first.includes('secreto123'));
    assert.equal(await verifyPassword('secreto123', first), true);
    assert.equal(await verifyPassword('otra-clave', first), false);
    assert.equal(await verifyPassword('secreto123', 'texto-plano'), false);
});

test('normalizes emails and validates registration fields', () => {
    assert.deepEqual(parseCredentials({ name: ' Ana ', email: ' Ana@Mail.COM ', password: '12345678' }, { register: true }),
        { name: 'Ana', email: 'ana@mail.com', password: '12345678' });
    for (const body of [undefined, { email: 'sin-arroba', password: '12345678', name: 'Ana' },
        { email: 'a@b.co', password: 'corta', name: 'Ana' }, { email: 'a@b.co', password: '12345678', name: 'A' },
        { email: 'a@b.co', password: 12345678, name: 'Ana' }]) {
        assert.throws(() => parseCredentials(body, { register: true }));
    }
    assert.throws(() => parseCredentials({ email: 'a@b.co', password: '' }));
});

test('reads the session token from the cookie header', () => {
    assert.equal(readSessionToken({ headers: { cookie: 'otra=1; beet_session=abc-123' } }), 'abc-123');
    assert.equal(readSessionToken({ headers: {} }), null);
});
