const taxonomy = require('../client/js/catalog-taxonomy');
const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const rules = [
    ['accesorios', 'carteras', /\b(carteras?|bolsos?|handbags?)\b/],
    ['accesorios', 'mochilas', /\b(mochilas?|backpacks?)\b/],
    ['accesorios', 'gorras', /\b(gorras?|gorros?|hats?|boonie|beanies?)\b/],
    ['accesorios', 'cinturones', /\b(cinturon(?:es)?|belts?)\b/],
    ['accesorios', 'bijouterie', /\b(collares?|pulseras?|aros?|bijouterie)\b/],
    ['indumentaria', 'musculosas', /\b(musculosas?|cutoff|tank)\b/],
    ['indumentaria', 'remeras', /\b(remeras?|camisetas?|t-shirts?|tshirts?|tees?)\b/],
    ['indumentaria', 'camisas', /\b(camisas?|sobrecamisas?|overshirts?|shirts?)\b/],
    ['indumentaria', 'buzos', /\b(buzos?|hoodies?|sweatshirts?)\b/],
    ['indumentaria', 'camperas', /\b(camperas?|parkas?|jackets?|abrigos?)\b/],
    ['indumentaria', 'shorts', /\b(shorts?|bermudas?)\b/],
    ['indumentaria', 'pantalones', /\b(jeans?|pantalon(?:es)?|trousers|baggy|oxford)\b/],
    ['indumentaria', 'vestidos', /\b(vestidos?|dress(?:es)?)\b/],
    ['indumentaria', 'faldas', /\b(faldas?|polleras?|skirts?)\b/],
    ['calzado', 'zapatillas', /\b(zapatillas?|sneakers?)\b/],
    ['calzado', 'botas', /\b(botas?|borcegos?|boots?)\b/],
    ['calzado', 'sandalias', /\b(sandalias?|sandals?)\b/],
    ['calzado', 'ojotas', /\b(ojotas?|flip-flops?)\b/],
];
function suggestClassification(product) {
    // El nombre tiene prioridad: un short descrito como "ideal con zapatillas" sigue siendo un short.
    for (const text of [product.name || product.productName, product.description]) {
        const match = rules.find(([, , pattern]) => pattern.test(normalize(text)));
        if (match) return { department: match[0], subcategory: match[1] };
    }
    return null;
}
function missingClassification(product) {
    const suggested = suggestClassification(product);
    if (!suggested) return null;
    const department = product.department && product.department !== 'sin-clasificar' ? product.department : suggested.department;
    const subcategory = product.subcategory || (department === suggested.department ? suggested.subcategory : '');
    if (subcategory && !Object.hasOwn(taxonomy[department]?.items || {}, subcategory)) return null;
    if (department === product.department && subcategory === product.subcategory) return null;
    return { department, subcategory };
}
async function classifyExistingProducts(pool, { apply = false } = {}) {
    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const { rows } = await db.query('SELECT id, name, description, department, subcategory FROM products ORDER BY id FOR UPDATE');
        const changes = [];
        for (const product of rows) {
            const classification = missingClassification(product);
            if (!classification) continue;
            changes.push({ id: product.id, name: product.name, ...classification });
            if (apply) await db.query('UPDATE products SET department=$1, subcategory=$2 WHERE id=$3',
                [classification.department, classification.subcategory, product.id]);
        }
        await db.query(apply ? 'COMMIT' : 'ROLLBACK');
        return changes;
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    } finally { db.release(); }
}
module.exports = { suggestClassification, missingClassification, classifyExistingProducts };
