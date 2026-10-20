const path = require('node:path');
require('dotenv').config({
    path: [path.join(__dirname, '.env'), path.join(__dirname, '../.env')],
    quiet: true,
});
