const CatalogTaxonomy = {
    calzado: { label: 'Calzado', items: { zapatillas: 'Zapatillas', botas: 'Botas y borcegos', sandalias: 'Sandalias', ojotas: 'Ojotas' } },
    indumentaria: { label: 'Indumentaria', items: { remeras: 'Remeras', camisas: 'Camisas', musculosas: 'Musculosas', buzos: 'Buzos', camperas: 'Camperas', pantalones: 'Pantalones', shorts: 'Shorts', vestidos: 'Vestidos', faldas: 'Faldas' } },
    accesorios: { label: 'Accesorios', items: { carteras: 'Carteras', mochilas: 'Mochilas', gorras: 'Gorras', cinturones: 'Cinturones', bijouterie: 'Bijouterie' } },
};
if (typeof module !== 'undefined' && module.exports) module.exports = CatalogTaxonomy;
