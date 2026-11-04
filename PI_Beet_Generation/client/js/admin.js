const adminStatus = document.getElementById('admin-status');
const adminContent = document.getElementById('admin-content');
const adminRetry = document.getElementById('admin-retry');
const userSearch = document.getElementById('user-search');
let users = [];
let saving = false;
async function api(path, options) {
    const response = await fetch('/api/admin' + path, options);
    const data = await response.json();
    if (response.status === 401) { location.assign('/?login=1'); throw new Error('La sesion vencio.'); }
    if (response.status === 403) { adminContent.hidden = true; throw new Error(data.error); }
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la accion.');
    return data;
}
function renderUsers() {
    const body = document.getElementById('admin-users');
    body.replaceChildren();
    const search = userSearch.value.trim().toLocaleLowerCase();
    const filtered = users.filter(user => `${user.name} ${user.email}`.toLocaleLowerCase().includes(search));
    document.getElementById('admin-empty').hidden = filtered.length > 0;
    for (const user of filtered) {
        const row = document.createElement('tr');
        for (const text of [user.name, user.email, user.isAdmin ? 'Administrador' : 'Sin acceso al panel']) {
            const cell = document.createElement('td');
            cell.textContent = text;
            row.append(cell);
        }
        const actions = document.createElement('td');
        if (user.protected) actions.textContent = 'Cuenta protegida';
        else {
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = saving;
            button.textContent = user.isAdmin ? 'Quitar acceso' : 'Aprobar acceso';
            button.setAttribute('aria-label', `${button.textContent} para ${user.email}`);
            button.addEventListener('click', () => updateAccess(user));
            actions.append(button);
        }
        row.append(actions);
        body.append(row);
    }
}
async function updateAccess(user) {
    const approved = !user.isAdmin;
    const action = approved ? 'dar acceso de administrador' : 'quitar el acceso de administrador';
    if (!confirm(`?Queres ${action} a ${user.email}?`)) return;
    saving = true;
    renderUsers();
    adminStatus.textContent = 'Guardando permiso?';
    try {
        await api(`/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved }) });
        await loadPanel();
        adminStatus.textContent = approved ? `Acceso aprobado para ${user.email}.` : `Acceso retirado a ${user.email}.`;
    } catch (error) { adminStatus.textContent = error.message; }
    finally { saving = false; renderUsers(); }
}
async function loadPanel() {
    adminRetry.hidden = true;
    const data = await api('');
    const catalog = await api('/products');
    products = catalog.items;
    renderProducts();
    users = data.users;
    document.getElementById('admin-greeting').textContent = `Hola, ${data.user.name}. Administra los accesos de tu equipo.`;
    document.getElementById('users-count').textContent = users.length;
    document.getElementById('admins-count').textContent = users.filter(user => user.isAdmin).length;
    document.getElementById('products-count').textContent = data.products.active;
    adminContent.hidden = false;
    renderUsers();
}
function startPanel() {
    adminStatus.textContent = 'Cargando panel?';
    loadPanel().then(() => { adminStatus.textContent = ''; }).catch(error => {
        adminStatus.textContent = error.message;
        adminRetry.hidden = false;
    });
}
userSearch.addEventListener('input', renderUsers);
adminRetry.addEventListener('click', startPanel);

const productForm = document.getElementById('product-form');
const productFields = document.getElementById('product-fields');
const productStatus = document.getElementById('product-status');
const productSearch = document.getElementById('product-search');
const productFilter = document.getElementById('product-filter');
let products = [];
let editingProductId = null;
let savingProduct = false;
const categoryNames = { mujer: 'Mujer', hombre: 'Hombre', unisex: 'Unisex', 'sin-categoria': 'Sin categoria' };
function fillProductDepartments() {
    const select = productForm.elements.department;
    select.replaceChildren(new Option('Sin clasificar', 'sin-clasificar'));
    for (const [key, family] of Object.entries(CatalogTaxonomy)) select.add(new Option(family.label, key));
}
function fillProductSubcategories(selected = '') {
    const select = productForm.elements.subcategory;
    select.replaceChildren(new Option('Toda la familia / sin subcategoria', ''));
    const family = CatalogTaxonomy[productForm.elements.department.value];
    for (const [key, label] of Object.entries(family?.items || {})) select.add(new Option(label, key));
    select.value = selected;
}
fillProductDepartments();
fillProductSubcategories();
productForm.elements.department.addEventListener('change', () => fillProductSubcategories());
const productPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
function renderProducts() {
    const body = document.getElementById('admin-products');
    body.replaceChildren();
    const search = productSearch.value.trim().toLocaleLowerCase();
    const filtered = products.filter(p => `${p.id} ${p.name} ${categoryNames[p.category] || ""} ${CatalogTaxonomy[p.department]?.label || ""} ${CatalogTaxonomy[p.department]?.items[p.subcategory] || ""}`.toLocaleLowerCase().includes(search) &&
        (productFilter.value === 'all' || p.active === (productFilter.value === 'active')));
    document.getElementById('product-empty').hidden = filtered.length > 0;
    document.getElementById('product-new').disabled = savingProduct;
    for (const product of filtered) {
        const row = document.createElement('tr');
        for (const text of [`#${product.id} - ${product.name} (${categoryNames[product.category] || "Sin categoria"})`, productPrice.format(product.price),
            product.styles.join(', ') || '-', product.active ? 'Activo' : 'Inactivo']) {
            const cell = document.createElement('td');
            cell.textContent = text;
            row.append(cell);
        }
        const actions = document.createElement('td');
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Editar';
        edit.disabled = savingProduct;
        edit.setAttribute('aria-label', `Editar ${product.name}`);
        edit.addEventListener('click', () => openProductForm(product));
        actions.append(edit);
        if (product.active) {
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Desactivar';
            remove.disabled = savingProduct;
            remove.setAttribute('aria-label', `Desactivar ${product.name}`);
            remove.addEventListener('click', () => deactivateProduct(product));
            actions.append(remove);
        }
        row.append(actions);
        body.append(row);
    }
}
function openProductForm(product = null) {
    editingProductId = product?.id || null;
    productForm.reset();
    productForm.elements.department.value = product?.department || 'sin-clasificar';
    fillProductSubcategories(product?.subcategory || '');
    productStatus.textContent = '';
    document.getElementById('product-form-title').textContent = product ? `Editar producto #${product.id}` : 'Nuevo producto';
    if (product) {
        for (const field of ['name', 'description', 'price', 'img', 'category']) productForm.elements[field].value = product[field];
        productForm.elements.active.checked = product.active;
        productForm.querySelectorAll('[name="styles"]').forEach(input => { input.checked = product.styles.includes(input.value); });
    }
    productForm.hidden = false;
    productForm.elements.name.focus();
}
function closeProductForm() {
    productForm.hidden = true;
    editingProductId = null;
    productForm.reset();
}
function lockProducts(locked) {
    savingProduct = locked;
    productFields.disabled = locked;
    renderProducts();
}
async function refreshProducts() {
    products = (await api('/products')).items;
    document.getElementById('products-count').textContent = products.filter(p => p.active).length;
    renderProducts();
}
productForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (savingProduct) return;
    const values = new FormData(productForm);
    const product = { name: values.get('name'), description: values.get('description'),
        department: values.get('department'), subcategory: values.get('subcategory'), category: values.get('category'), price: Number(values.get('price')), img: values.get('img'), styles: values.getAll('styles'),
        active: productForm.elements.active.checked };
    const editing = editingProductId !== null;
    lockProducts(true);
    productStatus.textContent = 'Guardando producto...';
    try {
        await api('/products' + (editing ? `/${editingProductId}` : ''), {
            method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product),
        });
        closeProductForm();
        productStatus.textContent = editing ? 'Producto actualizado.' : 'Producto creado.';
        try { await refreshProducts(); }
        catch { productStatus.textContent += ' No se pudo actualizar la lista. Recarga el panel para verla.'; }
    } catch (error) { productStatus.textContent = error.message; }
    finally { lockProducts(false); }
});
async function deactivateProduct(product) {
    if (savingProduct || !confirm(`Desactivar "${product.name}"? Dejara de aparecer en la tienda. Podes reactivarlo desde Editar.`)) return;
    lockProducts(true);
    productStatus.textContent = 'Desactivando producto...';
    try {
        await api(`/products/${product.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        if (editingProductId === product.id) closeProductForm();
        productStatus.textContent = 'Producto desactivado.';
        try { await refreshProducts(); }
        catch { productStatus.textContent += ' Recarga el panel para actualizar la lista.'; }
    } catch (error) { productStatus.textContent = error.message; }
    finally { lockProducts(false); }
}
document.getElementById('product-new').addEventListener('click', () => openProductForm());
document.getElementById('product-cancel').addEventListener('click', closeProductForm);
productSearch.addEventListener('input', renderProducts);
productFilter.addEventListener('change', renderProducts);
startPanel();
