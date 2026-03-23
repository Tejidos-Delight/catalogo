// =================================================================
// ARCHIVO admin.js (VERSIÓN FINAL - PRODUCTOS + PROMOCIONES)
// =================================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
const sbClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let editingProductId = null;
let currentFilter = 'all';
let currentSort = 'order-asc';
const BUCKET_NAME = 'product-images';

let promotions = [];
let coupons = [];

// =================================================================
// INICIALIZACIÓN Y AUTENTICACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
});

async function checkUserSession() {
    const { data: { session } } = await sbClient.auth.getSession();
    if (session) {
        console.log('Sesión activa:', session.user.email);
        document.getElementById('admin-panel').style.display = 'block';
        loadProducts();
        setupEventListeners();
        updateCategoryFilter();
        loadPromotions();               // Cargar promociones
        loadCoupons();
    } else {
        window.location.href = 'acceso-seguro-789.html';
    }
}

function setupEventListeners() {
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    document.getElementById('product-image').addEventListener('change', previewImage);
    document.getElementById('category-filter').addEventListener('change', function() {
        currentFilter = this.value;
        displayProducts();
    });
    document.getElementById('sort-products').addEventListener('change', function() {
        currentSort = this.value;
        displayProducts();
    });
    document.querySelectorAll('input[name="size-type"]').forEach(radio => {
        radio.addEventListener('change', toggleSizeOptions);
    });
    document.querySelectorAll('input[name="packaging-type"]').forEach(radio => {
        radio.addEventListener('change', togglePackagingOptions);
    });
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await sbClient.auth.signOut();
            if (error) console.error('Error al salir:', error);
            else window.location.href = 'acceso-seguro-789.html';
        });
    }

    const productsContainer = document.getElementById('products-container');
    productsContainer.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('btn-move-up')) moveProductUp(target.dataset.id);
        else if (target.classList.contains('btn-move-down')) moveProductDown(target.dataset.id);
        else if (target.classList.contains('btn-edit')) editProduct(target.dataset.id);
        else if (target.classList.contains('btn-delete')) deleteProduct(target.dataset.id);
    });

    document.querySelector('button[onclick="showSection(\'products\')"]').addEventListener('click', () => showSection('products'));
    document.querySelector('button[onclick="showSection(\'add-product\')"]').addEventListener('click', () => {
        resetForm();
        showSection('add-product');
    });
    document.querySelector('button[onclick="showSection(\'export\')"]').addEventListener('click', () => showSection('export'));
    document.querySelector('button[onclick="window.location.href=\'index.html\'"]').addEventListener('click', () => window.location.href='index.html');
    document.getElementById('cancel-btn').addEventListener('click', resetForm);
    document.getElementById('search-products').addEventListener('keyup', filterProducts);
}

// =================================================================
// GESTIÓN DE CUPONES
// =================================================================

async function loadCoupons() {
    try {
        const { data, error } = await sbClient
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        coupons = data || [];
        renderCouponsList();
    } catch (error) {
        console.error('Error cargando cupones:', error);
        showAlert('Error al cargar cupones', 'error');
    }
}

function renderCouponsList() {
    const container = document.getElementById('coupons-list');
    if (!container) return;
    if (coupons.length === 0) {
        container.innerHTML = '<p>No hay cupones creados.</p>';
        return;
    }
    container.innerHTML = coupons.map(coupon => `
        <div class="coupon-card" style="border:1px solid #eee; padding:12px; margin-bottom:10px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${coupon.code}</strong>
                <div>
                    <button class="btn-edit-coupon" data-id="${coupon.id}">Editar</button>
                    <button class="btn-delete-coupon" data-id="${coupon.id}">Eliminar</button>
                    <button class="btn-toggle-coupon" data-id="${coupon.id}" data-active="${coupon.active}">
                        ${coupon.active ? 'Desactivar' : 'Activar'}
                    </button>
                </div>
            </div>
            <p>${coupon.description || ''}</p>
            <small>
                Tipo: ${coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                | Compra mínima: $${coupon.min_purchase}
                ${coupon.expires_at ? ` | Expira: ${new Date(coupon.expires_at).toLocaleString()}` : ''}
                | Usos: ${coupon.used_count} / ${coupon.usage_limit || '∞'}
            </small>
        </div>
    `).join('');

    document.querySelectorAll('.btn-edit-coupon').forEach(btn => {
        btn.addEventListener('click', () => editCoupon(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete-coupon').forEach(btn => {
        btn.addEventListener('click', () => deleteCoupon(btn.dataset.id));
    });
    document.querySelectorAll('.btn-toggle-coupon').forEach(btn => {
        btn.addEventListener('click', () => toggleCouponActive(btn.dataset.id, btn.dataset.active === 'true'));
    });
}

async function saveCoupon(event) {
    event.preventDefault();
    const id = document.getElementById('coupon-id').value;
    const code = document.getElementById('coupon-code').value.toUpperCase().trim();
    const description = document.getElementById('coupon-description').value;
    const type = document.getElementById('coupon-type').value;
    const value = parseFloat(document.getElementById('coupon-value').value);
    const min_purchase = parseFloat(document.getElementById('coupon-min-purchase').value) || 0;
    const expires_at = document.getElementById('coupon-expires-at').value || null;
    const usage_limit = document.getElementById('coupon-usage-limit').value ? parseInt(document.getElementById('coupon-usage-limit').value) : null;
    const active = document.getElementById('coupon-active').checked;

    const couponData = { code, description, type, value, min_purchase, expires_at, usage_limit, active };

    try {
        if (id) {
            const { error } = await sbClient.from('coupons').update(couponData).eq('id', id);
            if (error) throw error;
            showAlert('Cupón actualizado', 'success');
        } else {
            const { error } = await sbClient.from('coupons').insert(couponData);
            if (error) throw error;
            showAlert('Cupón creado', 'success');
        }
        resetCouponForm();
        loadCoupons();
    } catch (error) {
        console.error('Error guardando cupón:', error);
        showAlert('Error al guardar', 'error');
    }
}

function resetCouponForm() {
    document.getElementById('coupon-form').reset();
    document.getElementById('coupon-id').value = '';
    document.getElementById('coupon-active').checked = true;
    document.getElementById('coupon-expires-at').value = '';
    document.getElementById('coupon-usage-limit').value = '';
    document.getElementById('cancel-coupon-btn').style.display = 'none';
    document.getElementById('coupon-code').focus();
}

async function editCoupon(id) {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;
    document.getElementById('coupon-id').value = coupon.id;
    document.getElementById('coupon-code').value = coupon.code;
    document.getElementById('coupon-description').value = coupon.description || '';
    document.getElementById('coupon-type').value = coupon.type;
    document.getElementById('coupon-value').value = coupon.value;
    document.getElementById('coupon-min-purchase').value = coupon.min_purchase;
    if (coupon.expires_at) {
        const date = new Date(coupon.expires_at);
        document.getElementById('coupon-expires-at').value = date.toISOString().slice(0, 16);
    } else {
        document.getElementById('coupon-expires-at').value = '';
    }
    document.getElementById('coupon-usage-limit').value = coupon.usage_limit || '';
    document.getElementById('coupon-active').checked = coupon.active;
    document.getElementById('cancel-coupon-btn').style.display = 'inline-block';
    showSection('coupons');
}

async function deleteCoupon(id) {
    if (!confirm('¿Eliminar este cupón?')) return;
    try {
        const { error } = await sbClient.from('coupons').delete().eq('id', id);
        if (error) throw error;
        showAlert('Cupón eliminado', 'success');
        loadCoupons();
    } catch (error) {
        console.error('Error eliminando:', error);
        showAlert('Error al eliminar', 'error');
    }
}

async function toggleCouponActive(id, currentActive) {
    try {
        const { error } = await sbClient.from('coupons').update({ active: !currentActive }).eq('id', id);
        if (error) throw error;
        showAlert(`Cupón ${!currentActive ? 'activado' : 'desactivado'}`, 'success');
        loadCoupons();
    } catch (error) {
        console.error('Error toggling:', error);
        showAlert('Error al cambiar estado', 'error');
    }
}

// Eventos del formulario
document.getElementById('coupon-form')?.addEventListener('submit', saveCoupon);
document.getElementById('cancel-coupon-btn')?.addEventListener('click', resetCouponForm);

// =================================================================
// LÓGICA DE PRODUCTOS (guardado, eliminación, etc.)
// =================================================================

async function loadProducts() {
    try {
        console.log('📥 Cargando productos desde Supabase...');
        const { data, error } = await sbClient
            .from('products')
            .select('*')
            .order('product_order', { ascending: true });
        if (error) throw error;
        products = data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            type: item.type,
            image: item.image_url,
            sizeConfig: item.size_config || { type: 'customizable', defaultValue: '10cm', options: ['10cm', '15cm', '20cm'] },
            packagingConfig: item.packaging_config || { type: 'customizable', defaultValue: 'Caja con visor', options: ['Caja con visor', 'Bolsa de papel'] },
            order: item.product_order || 999
        }));
    } catch (error) {
        console.error('Error cargando productos:', error);
        showAlert(`Error cargando productos: ${error.message}`, 'error');
    }
    displayProducts();
    updateCategoryFilter();
}

function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    if (file) {
        const reader = new FileReader();
        reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
    } else preview.style.display = 'none';
}

async function saveProduct(event) {
    event.preventDefault();
    const submitButton = document.getElementById('submit-btn');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    try {
        const productId = document.getElementById('product-id').value;
        const name = document.getElementById('product-name').value;
        let imageUrl = document.getElementById('product-image-url').value;
        const oldImageUrl = imageUrl;
        const fileInput = document.getElementById('product-image');
        const file = fileInput.files[0];

        if (file) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { data: signData, error: signError } = await sbClient.storage
                .from(BUCKET_NAME)
                .createSignedUploadUrl(fileName);
            if (signError) throw new Error(`Error creando URL firmada: ${signError.message}`);
            const uploadResponse = await fetch(signData.signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });
            if (!uploadResponse.ok) throw new Error(`Error subiendo archivo: ${await uploadResponse.text()}`);
            const { data: publicUrlData } = sbClient.storage.from(BUCKET_NAME).getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
        } else if (!imageUrl) {
            imageUrl = '../imagenes/personalizado.jpg';
        }

        const category = document.getElementById('product-category').value;
        const price = document.getElementById('product-price').value;
        const type = document.getElementById('product-type').value;
        const sizeType = document.querySelector('input[name="size-type"]:checked').value;
        let sizeConfig = {};
        if (sizeType === 'fixed') sizeConfig = { type: 'fixed', value: document.getElementById('fixed-size').value || '10cm' };
        else if (sizeType === 'customizable') {
            const sizeOptions = document.getElementById('size-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
            sizeConfig = {
                type: 'customizable',
                defaultValue: document.getElementById('default-size').value || '10cm',
                options: sizeOptions.length ? sizeOptions : ['10cm', '15cm', '20cm']
            };
        } else if (sizeType === 'none') sizeConfig = { type: 'none' };

        const packagingType = document.querySelector('input[name="packaging-type"]:checked').value;
        let packagingConfig = {};
        if (packagingType === 'fixed') packagingConfig = { type: 'fixed', value: document.getElementById('fixed-packaging').value || 'Caja con visor' };
        else {
            const packagingOptions = document.getElementById('packaging-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
            packagingConfig = {
                type: 'customizable',
                defaultValue: document.getElementById('default-packaging').value || 'Caja con visor',
                options: packagingOptions.length ? packagingOptions : ['Caja con visor', 'Bolsa de papel']
            };
        }

        if (!name || !category || !price || !type) throw new Error('Completa todos los campos obligatorios.');

        const productData = { name, category, price, type, image_url: imageUrl, size_config: sizeConfig, packaging_config: packagingConfig };

        if (productId) {
            const productIndex = products.findIndex(p => p.id === productId);
            productData.product_order = products[productIndex]?.order || 999;
            const { error } = await sbClient.from('products').update(productData).eq('id', productId);
            if (error) throw error;
            products[productIndex] = { ...products[productIndex], ...productData, image: productData.image_url };
            showAlert('Producto actualizado.', 'success');
            if (file && oldImageUrl && oldImageUrl.includes(BUCKET_NAME)) {
                const oldFileName = oldImageUrl.split('/').pop();
                await sbClient.storage.from(BUCKET_NAME).remove([oldFileName]).catch(e => console.warn('No se pudo borrar antigua:', e));
            }
        } else {
            const categoryProducts = products.filter(p => p.category === category);
            const maxOrder = categoryProducts.length ? Math.max(...categoryProducts.map(p => p.order || 0)) : 0;
            productData.product_order = maxOrder + 1;
            const { data, error } = await sbClient.from('products').insert(productData).select();
            if (error) throw error;
            const newProduct = data[0];
            products.push({
                id: newProduct.id, name: newProduct.name, category: newProduct.category,
                price: newProduct.price, type: newProduct.type, image: newProduct.image_url,
                order: newProduct.product_order, sizeConfig: newProduct.size_config,
                packagingConfig: newProduct.packaging_config
            });
            showAlert('Producto agregado.', 'success');
        }
        resetForm();
        showSection('products');
        await loadProducts();
        displayProducts();
    } catch (error) {
        console.error('Error guardando:', error);
        showAlert(`Error: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Guardar Producto';
    }
}

async function deleteProduct(id) {
    if (confirm('¿Eliminar este producto?')) {
        try {
            const product = products.find(p => p.id === id);
            const { error: dbError } = await sbClient.from('products').delete().eq('id', id);
            if (dbError) throw dbError;
            if (product && product.image && product.image.includes(BUCKET_NAME)) {
                const fileName = product.image.split('/').pop();
                await sbClient.storage.from(BUCKET_NAME).remove([fileName]).catch(e => console.warn('No se pudo borrar imagen:', e));
            }
            products = products.filter(p => p.id !== id);
            displayProducts();
            showAlert('Producto eliminado.', 'success');
        } catch (error) {
            console.error(error);
            showAlert(`Error: ${error.message}`, 'error');
        }
    }
}

// =================================================================
// FUNCIONES DE UI PARA PRODUCTOS
// =================================================================

function displayProducts(filteredProducts = null) {
    let productsToDisplay = filteredProducts || products;
    if (currentFilter !== 'all') productsToDisplay = productsToDisplay.filter(p => p.category === currentFilter);
    productsToDisplay = sortProducts(productsToDisplay, currentSort);

    const container = document.getElementById('products-container');
    if (!productsToDisplay.length) {
        container.innerHTML = '<p class="no-products">No hay productos.</p>';
        return;
    }
    container.innerHTML = productsToDisplay.map((product, index) => {
        const displayOrder = product.order || (index + 1);
        return `
            <div class="admin-product-card" data-product-id="${product.id}">
                <div class="order-badge">#${displayOrder}</div>
                <div class="admin-card-container">
                    <img src="${product.image}" onerror="this.src='../imagenes/personalizado.jpg'">
                    <div class="category-badge badge-${product.category}">${getCategoryName(product.category)}</div>
                </div>
                <h3>${product.name}</h3>
                <p><strong>Precio:</strong> ${product.price}</p>
                <div id="details-${product.id}" class="product-extra-info">
                    <p><strong>Tamaño:</strong> ${getSizeDisplay(product.sizeConfig)}</p>
                    <p><strong>Empaque:</strong> ${getPackagingDisplay(product.packagingConfig)}</p>
                </div>
                <div class="admin-product-actions-group">
                    <button class="btn-info-action" onclick="toggleDetails('${product.id}')" draggable="false">Info</button>
                    <button class="btn-edit-action btn-edit" data-id="${product.id}" draggable="false">Editar</button>
                    <button class="btn-delete-action btn-delete" data-id="${product.id}" draggable="false">Borrar</button>
                </div>
            </div>
        `;
    }).join('');
    initDragAndDrop();
}

window.toggleDetails = function(id) {
    const details = document.getElementById(`details-${id}`);
    if (details) details.classList.toggle('show');
};

function getCategoryName(category) {
    const categories = {
        amigurumis: 'Amigurumis', flores: 'Flores y Ramos', llaveros: 'Llaveros',
        pulseras: 'Pulseras', colgantes: 'Colgantes', combos: 'Combos',
        bolsas: 'Bolsas', macetas: 'Macetas', adicionales: 'Artículos Adicionales'
    };
    return categories[category] || category;
}

function updateCategoryFilter() {
    const filterSelect = document.getElementById('category-filter');
    const categories = [...new Set(products.map(p => p.category))];
    filterSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = getCategoryName(cat);
        filterSelect.appendChild(option);
    });
}

function getSizeDisplay(sizeConfig) {
    if (!sizeConfig) return 'No configurado';
    if (sizeConfig.type === 'none') return 'No aplica';
    if (sizeConfig.type === 'fixed') return `Fijo: ${sizeConfig.value || 'No especificado'}`;
    const opts = sizeConfig.options ? sizeConfig.options.join(', ') : 'No especificadas';
    return `Personalizable: ${sizeConfig.defaultValue || 'No especificado'} (${opts})`;
}

function getPackagingDisplay(packConfig) {
    if (!packConfig) return 'No configurado';
    if (packConfig.type === 'fixed') return `Fijo: ${packConfig.value || 'No especificado'}`;
    const opts = packConfig.options ? packConfig.options.join(', ') : 'No especificadas';
    return `Personalizable: ${packConfig.defaultValue || 'No especificado'} (${opts})`;
}

function sortProducts(products, sortType) {
    const sorted = [...products];
    switch (sortType) {
        case 'name-asc': return sorted.sort((a,b) => a.name.localeCompare(b.name));
        case 'name-desc': return sorted.sort((a,b) => b.name.localeCompare(a.name));
        case 'price-asc': return sorted.sort((a,b) => (parseFloat(a.price.replace('$',''))||0) - (parseFloat(b.price.replace('$',''))||0));
        case 'price-desc': return sorted.sort((a,b) => (parseFloat(b.price.replace('$',''))||0) - (parseFloat(a.price.replace('$',''))||0));
        case 'order-asc': return sorted.sort((a,b) => (a.order||999) - (b.order||999));
        case 'order-desc': return sorted.sort((a,b) => (b.order||0) - (a.order||0));
        case 'category-asc': return sorted.sort((a,b) => a.category.localeCompare(b.category));
        case 'category-desc': return sorted.sort((a,b) => b.category.localeCompare(a.category));
        default: return sorted;
    }
}

async function moveProductUp(productId) {
    const categoryProducts = products.filter(p => currentFilter === 'all' ? true : p.category === currentFilter);
    const idx = categoryProducts.findIndex(p => p.id === productId);
    if (idx > 0) {
        const product = categoryProducts[idx];
        const prev = categoryProducts[idx-1];
        [product.order, prev.order] = [prev.order, product.order];
        await saveProducts();
        await loadProducts();
        displayProducts();
    }
}

async function moveProductDown(productId) {
    const categoryProducts = products.filter(p => currentFilter === 'all' ? true : p.category === currentFilter);
    const idx = categoryProducts.findIndex(p => p.id === productId);
    if (idx < categoryProducts.length-1) {
        const product = categoryProducts[idx];
        const next = categoryProducts[idx+1];
        [product.order, next.order] = [next.order, product.order];
        await saveProducts();
        await loadProducts();
        displayProducts();
    }
}

async function saveProducts() {
    try {
        const productsForDB = products.map(p => ({
            id: p.id, name: p.name, category: p.category, price: p.price, type: p.type,
            image_url: p.image, size_config: p.sizeConfig, packaging_config: p.packagingConfig,
            product_order: p.order || 999
        }));
        const { error } = await sbClient.from('products').upsert(productsForDB);
        if (error) throw error;
        showAlert('Productos sincronizados', 'success');
        await loadProducts();
        displayProducts();
    } catch (error) {
        console.error(error);
        showAlert('Error al sincronizar', 'error');
    }
}

function filterProducts() {
    const term = document.getElementById('search-products').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || p.price.toLowerCase().includes(term));
    displayProducts(filtered);
}

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
    if (sectionId === 'products') { 
        displayProducts(); 
        updateCategoryFilter(); 
    }
    if (sectionId === 'promotions') {
        loadPromotions();
    }
    if (sectionId === 'coupons') {
        loadCoupons();
    }
    if (sectionId === 'orders') {
        // Marcar que la sección de órdenes está visible
        ordersSectionVisible = true;
        loadOrders();
        // Iniciar auto-refresco cada 30 segundos si no está ya corriendo
        if (!ordersRefreshInterval) {
            ordersRefreshInterval = setInterval(() => {
                if (ordersSectionVisible) loadOrders();
            }, 30000);
        }
    } else {
        // Si cambiamos a otra sección, detenemos la visibilidad pero no el intervalo (lo dejamos corriendo para cuando vuelva)
        ordersSectionVisible = false;
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    document.getElementById('form-title').textContent = 'Editar Producto';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-type').value = product.type;
    if (product.sizeConfig && product.sizeConfig.type === 'fixed') {
        document.querySelector('input[name="size-type"][value="fixed"]').checked = true;
        document.getElementById('fixed-size').value = product.sizeConfig.value || '10cm';
    } else if (product.sizeConfig && product.sizeConfig.type === 'none') {
        document.querySelector('input[name="size-type"][value="none"]').checked = true;
    } else {
        document.querySelector('input[name="size-type"][value="customizable"]').checked = true;
        document.getElementById('default-size').value = product.sizeConfig?.defaultValue || '10cm';
        document.getElementById('size-options').value = product.sizeConfig?.options ? product.sizeConfig.options.join(', ') : '10cm,15cm,20cm';
    }
    toggleSizeOptions();
    if (product.packagingConfig && product.packagingConfig.type === 'fixed') {
        document.querySelector('input[name="packaging-type"][value="fixed"]').checked = true;
        document.getElementById('fixed-packaging').value = product.packagingConfig.value || 'Caja con visor';
    } else {
        document.querySelector('input[name="packaging-type"][value="customizable"]').checked = true;
        document.getElementById('default-packaging').value = product.packagingConfig?.defaultValue || 'Caja con visor';
        document.getElementById('packaging-options').value = product.packagingConfig?.options ? product.packagingConfig.options.join(', ') : 'Caja con visor,Bolsa de papel';
    }
    togglePackagingOptions();
    const preview = document.getElementById('image-preview');
    if (product.image) {
        preview.src = product.image;
        preview.style.display = 'block';
        document.getElementById('product-image-url').value = product.image;
    }
    document.getElementById('submit-btn').textContent = 'Actualizar Producto';
    document.getElementById('cancel-btn').style.display = 'inline-block';
    showSection('add-product');
}

function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('form-title').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submit-btn').textContent = 'Guardar Producto';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('product-image').value = null;
    document.getElementById('product-image-url').value = '';
    document.querySelector('input[name="size-type"][value="fixed"]').checked = true;
    document.getElementById('fixed-size').value = '10cm';
    toggleSizeOptions();
    document.querySelector('input[name="packaging-type"][value="fixed"]').checked = true;
    document.getElementById('fixed-packaging').value = 'Caja con visor';
    togglePackagingOptions();
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alert');
    if (!alertDiv) return;
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';
    setTimeout(() => alertDiv.style.display = 'none', 5000);
}

function exportProducts() {
    if (!products.length) return showAlert('No hay productos', 'error');
    const dataStr = JSON.stringify({ products }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'tejidos-delight-productos.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Productos exportados', 'success');
}

function importProducts() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) return showAlert('Selecciona un archivo JSON', 'error');
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);
            const importedProducts = imported.products || imported;
            if (Array.isArray(importedProducts)) {
                if (confirm('¿Reemplazar todos los productos?')) {
                    products = importedProducts;
                    saveProducts();
                    displayProducts();
                    showAlert('Productos importados', 'success');
                    fileInput.value = '';
                }
            } else showAlert('Formato inválido', 'error');
        } catch (err) { showAlert('Error al leer JSON', 'error'); }
    };
    reader.readAsText(file);
}

async function resetToDefault() {
    if (confirm('¿Restablecer a valores predeterminados?')) {
        products = [];
        await saveProducts();
        displayProducts();
        showAlert('Productos restablecidos', 'success');
    }
}

function toggleSizeOptions() {
    const customizable = document.getElementById('customizable-size-options');
    const selected = document.querySelector('input[name="size-type"]:checked').value;
    if (selected === 'customizable') customizable.classList.remove('hidden');
    else customizable.classList.add('hidden');
    const fixedInput = document.getElementById('fixed-size');
    if (fixedInput) fixedInput.disabled = (selected === 'none');
}

function togglePackagingOptions() {
    const customizable = document.getElementById('customizable-packaging-options');
    const isCustom = document.querySelector('input[name="packaging-type"][value="customizable"]').checked;
    if (isCustom) customizable.classList.remove('hidden');
    else customizable.classList.add('hidden');
}

let sortableInstance = null;
function initDragAndDrop() {
    const container = document.getElementById('products-container');
    if (!container || currentSort !== 'order-asc') return;
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = Sortable.create(container, {
        animation: 150, scroll: true, scrollSensitivity: 150, scrollSpeed: 20,
        ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
        handle: '.admin-product-card',
        filter: '.btn-info-action, .btn-edit-action, .btn-delete-action, button',
        preventOnFilter: false,
        onEnd: async () => await reorderProductsFromDOM()
    });
}

async function reorderProductsFromDOM() {
    const cards = document.querySelectorAll('.admin-product-card');
    const categoryCounters = {};
    const updatedPayload = [];
    cards.forEach(card => {
        const productId = card.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (product) {
            const cat = product.category;
            categoryCounters[cat] = (categoryCounters[cat] || 0) + 1;
            product.order = categoryCounters[cat];
            updatedPayload.push({
                id: product.id, name: product.name, category: product.category,
                price: product.price, type: product.type, image_url: product.image,
                size_config: product.sizeConfig, packaging_config: product.packagingConfig,
                product_order: product.order
            });
        }
    });
    try {
        const { error } = await sbClient.from('products').upsert(updatedPayload, { onConflict: 'id' });
        if (error) throw error;
        showAlert('Orden actualizado', 'success');
        displayProducts();
    } catch (error) {
        console.error(error);
        showAlert('Error al guardar orden', 'error');
    }
}

// =================================================================
// GESTIÓN DE PROMOCIONES (banner + modal)
// =================================================================

async function loadPromotions() {
    try {
        const { data, error } = await sbClient.from('promotions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        promotions = data || [];
        renderPromotionsList();
    } catch (error) {
        console.error('Error cargando promociones:', error);
        showAlert('Error al cargar promociones', 'error');
    }
}

function renderPromotionsList() {
    const container = document.getElementById('promotions-list');
    if (!container) return;
    if (promotions.length === 0) {
        container.innerHTML = '<p>No hay promociones creadas.</p>';
        return;
    }
    container.innerHTML = promotions.map(promo => `
        <div class="promotion-card" style="border:1px solid #eee; padding:12px; margin-bottom:10px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${promo.name}</strong>
                <div>
                    <button class="btn-edit-promo" data-id="${promo.id}">Editar</button>
                    <button class="btn-delete-promo" data-id="${promo.id}">Eliminar</button>
                    <button class="btn-toggle-promo" data-id="${promo.id}" data-active="${promo.active}">
                        ${promo.active ? 'Desactivar' : 'Activar'}
                    </button>
                </div>
            </div>
            <p>${promo.banner_text}</p>
            <small>
                Descuento: ${promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`} 
                | Mínimo: ${promo.min_quantity} productos<br>
                Mostrar: ${promo.show_banner ? 'Banner' : ''} ${promo.show_modal ? (promo.show_banner ? '+ Modal' : 'Modal') : ''}
                ${promo.show_modal && promo.image_url ? ' (con imagen)' : ''}
            </small>
        </div>
    `).join('');

    document.querySelectorAll('.btn-edit-promo').forEach(btn => btn.addEventListener('click', () => editPromotion(btn.dataset.id)));
    document.querySelectorAll('.btn-delete-promo').forEach(btn => btn.addEventListener('click', () => deletePromotion(btn.dataset.id)));
    document.querySelectorAll('.btn-toggle-promo').forEach(btn => btn.addEventListener('click', () => togglePromotionActive(btn.dataset.id, btn.dataset.active === 'true')));
}

async function savePromotion(event) {
    event.preventDefault();
    const id = document.getElementById('promotion-id').value;
    const name = document.getElementById('promotion-name').value;
    const banner_text = document.getElementById('promotion-banner').value;
    const type = document.getElementById('promotion-type').value;
    const value = parseFloat(document.getElementById('promotion-value').value);
    const min_quantity = parseInt(document.getElementById('promotion-min-qty').value);
    const active = document.getElementById('promotion-active').checked;
    const show_banner = document.getElementById('promotion-show-banner').checked;
    const show_modal = document.getElementById('promotion-show-modal').checked;

    let image_url = document.getElementById('promotion-image-url').value;
    const fileInput = document.getElementById('promotion-image');
    const file = fileInput.files[0];

    if (file) {
        const fileName = `promo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: signData, error: signError } = await sbClient.storage.from(BUCKET_NAME).createSignedUploadUrl(fileName);
        if (signError) throw new Error(`Error creando URL: ${signError.message}`);
        const uploadResponse = await fetch(signData.signedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });
        if (!uploadResponse.ok) throw new Error(`Error subiendo archivo: ${await uploadResponse.text()}`);
        const { data: publicUrlData } = sbClient.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        image_url = publicUrlData.publicUrl;
    } else if (show_modal && !image_url) {
        showAlert('Debes subir una imagen para mostrar el modal', 'error');
        return;
    }

    const promoData = { name, banner_text, type, value, min_quantity, active, show_banner, show_modal, image_url };

    try {
        if (id) {
            const { error } = await sbClient.from('promotions').update(promoData).eq('id', id);
            if (error) throw error;
            showAlert('Promoción actualizada', 'success');
        } else {
            const { error } = await sbClient.from('promotions').insert(promoData);
            if (error) throw error;
            showAlert('Promoción creada', 'success');
        }
        resetPromotionForm();
        loadPromotions();
    } catch (error) {
        console.error('Error guardando promoción:', error);
        showAlert('Error al guardar', 'error');
    }
}

function resetPromotionForm() {
    document.getElementById('promotion-form').reset();
    document.getElementById('promotion-id').value = '';
    document.getElementById('promotion-active').checked = true;
    document.getElementById('promotion-show-banner').checked = true;
    document.getElementById('promotion-show-modal').checked = false;
    document.getElementById('promotion-image-group').style.display = 'none';
    document.getElementById('promotion-image-preview').style.display = 'none';
    document.getElementById('promotion-image-url').value = '';
    document.getElementById('cancel-promo-btn').style.display = 'none';
    document.getElementById('promotion-name').focus();
}

async function editPromotion(id) {
    const promo = promotions.find(p => p.id === id);
    if (!promo) return;
    document.getElementById('promotion-id').value = promo.id;
    document.getElementById('promotion-name').value = promo.name;
    document.getElementById('promotion-banner').value = promo.banner_text;
    document.getElementById('promotion-type').value = promo.type;
    document.getElementById('promotion-value').value = promo.value;
    document.getElementById('promotion-min-qty').value = promo.min_quantity;
    document.getElementById('promotion-active').checked = promo.active;
    document.getElementById('promotion-show-banner').checked = promo.show_banner ?? true;
    document.getElementById('promotion-show-modal').checked = promo.show_modal ?? false;

    if (promo.image_url) {
        document.getElementById('promotion-image-url').value = promo.image_url;
        document.getElementById('promotion-image-preview').src = promo.image_url;
        document.getElementById('promotion-image-preview').style.display = 'block';
    } else {
        document.getElementById('promotion-image-preview').style.display = 'none';
    }

    const imageGroup = document.getElementById('promotion-image-group');
    imageGroup.style.display = promo.show_modal ? 'block' : 'none';

    document.getElementById('cancel-promo-btn').style.display = 'inline-block';
    showSection('promotions');
}

async function deletePromotion(id) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
        const { error } = await sbClient.from('promotions').delete().eq('id', id);
        if (error) throw error;
        showAlert('Promoción eliminada', 'success');
        loadPromotions();
    } catch (error) {
        console.error('Error eliminando:', error);
        showAlert('Error al eliminar', 'error');
    }
}

async function togglePromotionActive(id, currentActive) {
    try {
        const { error } = await sbClient.from('promotions').update({ active: !currentActive }).eq('id', id);
        if (error) throw error;
        showAlert(`Promoción ${!currentActive ? 'activada' : 'desactivada'}`, 'success');
        loadPromotions();
    } catch (error) {
        console.error('Error toggling:', error);
        showAlert('Error al cambiar estado', 'error');
    }
}

// Eventos para la gestión de promociones en el panel
document.getElementById('promotion-show-modal')?.addEventListener('change', function(e) {
    const imageGroup = document.getElementById('promotion-image-group');
    imageGroup.style.display = this.checked ? 'block' : 'none';
});

document.getElementById('promotion-image')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('promotion-image-preview');
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => { preview.src = ev.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
    } else preview.style.display = 'none';
});



document.getElementById('promotion-form')?.addEventListener('submit', savePromotion);
document.getElementById('cancel-promo-btn')?.addEventListener('click', resetPromotionForm);

// =================================================================
// GESTIÓN DE ÓRDENES
// =================================================================

let orders = [];
let currentOrderFilter = 'all';
let currentOrderSearch = '';
let ordersRefreshInterval = null;
let ordersSectionVisible = false;

async function loadOrders() {
    try {
        const { data, error } = await sbClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        orders = data || [];
        renderOrdersList();
    } catch (error) {
        console.error('Error cargando órdenes:', error);
        showAlert('Error al cargar órdenes', 'error');
    }
}

function renderOrdersList() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    let filteredOrders = [...orders];
    if (currentOrderFilter !== 'all') {
        filteredOrders = filteredOrders.filter(o => o.status === currentOrderFilter);
    }
    if (currentOrderSearch.trim() !== '') {
        const searchTerm = currentOrderSearch.trim().toLowerCase();
        filteredOrders = filteredOrders.filter(o => o.order_number.toLowerCase().includes(searchTerm));
    }
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '<p>No hay órdenes que coincidan con los filtros.</p>';
        return;
    }
    
    // Función para formatear fecha en Ecuador
    const formatLocalDate = (utcDate) => {
        const date = new Date(utcDate);
        // Restar 5 horas (18000000 milisegundos) para GMT-5
        const localDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
        return localDate.toLocaleString('es-EC', { hour12: true });
    };
        
    container.innerHTML = filteredOrders.map(order => {
        const itemsHTML = order.items.map(item => 
            `<li>${item.name} (${item.price}) x${item.quantity} | Tamaño: ${item.size || 'N/A'} | Empaque: ${item.packaging || 'N/A'}</li>`
        ).join('');
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <span class="order-number">${order.order_number}</span>
                    <span class="order-date">${formatLocalDate(order.created_at)}</span>
                    <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-items">
                    <strong>Productos:</strong>
                    <ul style="margin: 5px 0 0 20px;">${itemsHTML}</ul>
                </div>
                <div><strong>Subtotal:</strong> $${order.subtotal?.toFixed(2) || '0.00'}</div>
                ${order.discount_amount > 0 ? `<div><strong>Descuento (promoción):</strong> -$${order.discount_amount.toFixed(2)}${order.promo_text ? ` (${order.promo_text})` : ''}</div>` : ''}
                ${order.coupon_code ? `<div><strong>Descuento (cupón ${order.coupon_code}${order.coupon_value !== null ? (order.coupon_type === 'percentage' ? ` ${order.coupon_value}%` : ` $${order.coupon_value}`) : ''}):</strong> -$${order.coupon_discount?.toFixed(2) || '0.00'}</div>` : ''}                <div class="order-total"><strong>Total:</strong> $${order.total?.toFixed(2) || '0.00'}</div>
                <div><strong>Método de contacto:</strong> ${order.payment_method === 'whatsapp' ? 'WhatsApp' : 'Instagram'}</div>
                
                <div class="order-actions">
                    <select class="order-status-select" data-id="${order.id}">
                        <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="aceptada" ${order.status === 'aceptada' ? 'selected' : ''}>Aceptada</option>
                        <option value="completada" ${order.status === 'completada' ? 'selected' : ''}>Completada</option>
                        <option value="cancelada" ${order.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                    <button class="admin-btn delete-order-btn" data-id="${order.id}" style="background:#e74c3c;">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Eventos para cambiar estado
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;
            await updateOrderStatus(orderId, newStatus);
        });
    });
    
    // Eventos para eliminar orden
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.id;
            await deleteOrder(orderId);
        });
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const { error } = await sbClient
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        if (error) throw error;
        showAlert('Estado de orden actualizado', 'success');
        loadOrders(); // recargar lista
    } catch (error) {
        console.error('Error actualizando estado:', error);
        showAlert('Error al actualizar estado', 'error');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('¿Eliminar esta orden permanentemente?')) return;
    try {
        const { error } = await sbClient
            .from('orders')
            .delete()
            .eq('id', orderId);
        if (error) throw error;
        showAlert('Orden eliminada', 'success');
        loadOrders(); // recargar lista
    } catch (error) {
        console.error('Error eliminando orden:', error);
        showAlert('Error al eliminar', 'error');
    }
}

function filterOrders() {
    currentOrderFilter = document.getElementById('filter-order-status').value;
    currentOrderSearch = document.getElementById('search-order').value;
    renderOrdersList();
}

// Función para refrescar manualmente
function refreshOrders() {
    loadOrders();
}

// Exponer funciones globales
window.filterOrders = filterOrders;
window.refreshOrders = refreshOrders;

// =================================================================
// FUNCIONES GLOBALES PARA EL HTML
// =================================================================
window.exportProducts = exportProducts;
window.importProducts = importProducts;
window.resetToDefault = resetToDefault;
window.showSection = showSection;
window.filterProducts = filterProducts;
window.resetForm = resetForm;