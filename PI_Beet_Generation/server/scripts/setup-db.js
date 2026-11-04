require('../config');
// Use the direct cloud connection for administration, if provided.
if (process.env.DATABASE_URL_DIRECT) process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
const { pool } = require('../db');
const { setupDatabase } = require('../db/setup');
const updateCatalog = process.argv.includes('--update-catalog');

setupDatabase(pool, { updateCatalog })
    .then(() => console.log(updateCatalog
        ? 'Base lista: catalogo actualizado desde products.json.'
        : 'Base lista: tablas creadas y catalogo inicial cargado.'))
    .catch((error) => {
        console.error('No se pudo preparar PostgreSQL. Revisa la conexion y los permisos. Codigo:', error.code || error.name);
        process.exitCode = 1;
    }).finally(() => pool.end());
