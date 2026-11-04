require('../config');
const { pool } = require('../db');
const { classifyExistingProducts } = require('../classify-products');
const apply = process.argv.includes('--apply');
classifyExistingProducts(pool, { apply }).then(changes => {
    console.table(changes);
    console.log(`${changes.length} productos ${apply ? 'actualizados en PostgreSQL' : 'pendientes (vista previa; usar --apply para guardar)'}.`);
}).catch(error => {
    console.error('No se pudo clasificar el catalogo:', error.code || error.name);
    process.exitCode = 1;
}).finally(() => pool.end());
