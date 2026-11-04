function availableCatalogFamilies(products, taxonomy) {
    const result = {};
    for (const [department, family] of Object.entries(taxonomy)) {
        const available = products.filter(product => product.active !== false && product.department === department);
        if (!available.length) continue;
        const keys = new Set(available.map(product => product.subcategory));
        result[department] = { label: family.label,
            items: Object.fromEntries(Object.entries(family.items).filter(([key]) => keys.has(key))) };
    }
    return result;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { availableCatalogFamilies };
