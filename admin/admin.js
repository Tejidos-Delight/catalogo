// =================================================================
// ARCHIVO admin.js (VERSIÓN 10 - CON BOTONES NO ARRASTRABLES Y MEJORAS)
// =================================================================

// 1. Importar la función de Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 2. Configuración del Cliente Supabase
const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';

// 3. Crear el cliente
const sbClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let products = [];
let editingProductId = null;
let currentFilter = 'all';
let currentSort = 'order-asc';
const BUCKET_NAME = 'product-images'; // El nombre de nuestro balde

// =================================================================
// INICIALIZACIÓN Y AUTENTICACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
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
        loadPromotions();
    } else {
        console.log('No hay sesión, redirigiendo a login...');
        window.location.href = 'acceso-seguro-789.html';
    }
}

// --- FUNCIÓN 'setupEventListeners' ---
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
            if (error) {
                console.error('Error al salir:', error);
            } else {
                window.location.href = 'acceso-seguro-789.html';
            }
        });
    }
    
    // Listeners para los botones globales (delegación de eventos)
    const productsContainer = document.getElementById('products-container');
    productsContainer.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('btn-move-up')) {
            moveProductUp(target.dataset.id);
        } else if (target.classList.contains('btn-move-down')) {
            moveProductDown(target.dataset.id);
        } else if (target.classList.contains('btn-edit')) {
            editProduct(target.dataset.id);
        } else if (target.classList.contains('btn-delete')) {
            deleteProduct(target.dataset.id);
        }
    });

    // Listeners de los botones de navegación del panel
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
// LÓGICA DE PRODUCTOS
// =================================================================

// Cargar productos desde Supabase
async function loadProducts() {
    try {
        console.log('📥 Cargando productos desde Supabase...');
        const { data, error } = await sbClient
            .from('products')
            .select('*')
            .order('product_order', { ascending: true });
        if (error) throw error; 
        console.log('✅ Productos cargados:', data.length);
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
        console.error('❌ Error cargando desde Supabase:', error);
        showAlert(`Error cargando productos: ${error.message}`, 'error');
    }
    displayProducts();
    updateCategoryFilter();
}

// Muestra el preview, no guarda el Base64
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Lógica de subida (Signed URL -> Update DB -> Delete old)
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
            console.log('Subiendo nueva imagen...');
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            console.log(`Subiendo archivo nuevo: ${fileName}`);

            // Usar Signed URL para subir
            const { data: signData, error: signError } = await sbClient.storage
                .from(BUCKET_NAME)
                .createSignedUploadUrl(fileName);

            if (signError) {
                throw new Error(`Error creando URL firmada: ${signError.message}`);
            }

            const uploadResponse = await fetch(signData.signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadResponse.ok) {
                throw new Error(`Error subiendo archivo: ${await uploadResponse.text()}`);
            }
            
            const { data: publicUrlData } = sbClient.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
            console.log('Nueva URL de imagen:', imageUrl);

        } else if (!imageUrl) {
            imageUrl = '../imagenes/personalizado.jpg';
        }

        const category = document.getElementById('product-category').value;
        const price = document.getElementById('product-price').value;
        const type = document.getElementById('product-type').value;
        
        // --- LÓGICA DE TAMAÑO ACTUALIZADA (Incluye 'none') ---
        const sizeType = document.querySelector('input[name="size-type"]:checked').value;
        let sizeConfig = {};
        
        if (sizeType === 'fixed') {
            sizeConfig = { type: 'fixed', value: document.getElementById('fixed-size').value || '10cm' };
        } else if (sizeType === 'customizable') {
            const sizeOptions = document.getElementById('size-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
            sizeConfig = { 
                type: 'customizable', 
                defaultValue: document.getElementById('default-size').value || '10cm', 
                options: sizeOptions.length > 0 ? sizeOptions : ['10cm', '15cm', '20cm'] 
            };
        } else if (sizeType === 'none') {
            sizeConfig = { type: 'none' };
        }
        
        const packagingType = document.querySelector('input[name="packaging-type"]:checked').value;
        let packagingConfig = {};
        if (packagingType === 'fixed') { packagingConfig = { type: 'fixed', value: document.getElementById('fixed-packaging').value || 'Caja con visor' }; }
        else { const packagingOptions = document.getElementById('packaging-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== ''); packagingConfig = { type: 'customizable', defaultValue: document.getElementById('default-packaging').value || 'Caja con visor', options: packagingOptions.length > 0 ? packagingOptions : ['Caja con visor', 'Bolsa de papel'] }; }

        if (!name || !category || !price || !type) {
            throw new Error('Por favor completa todos los campos obligatorios.');
        }

        const productData = {
            name: name,
            category: category,
            price: price,
            type: type,
            image_url: imageUrl,
            size_config: sizeConfig,
            packaging_config: packagingConfig
        };

        if (productId) {
            const productIndex = products.findIndex(p => p.id === productId);
            productData.product_order = products[productIndex]?.order || 999;

            const { error } = await sbClient.from('products').update(productData).eq('id', productId); 
            if (error) throw error;
            
            const updatedProduct = { ...products[productIndex], ...productData, image: productData.image_url };
            products[productIndex] = updatedProduct;
            showAlert('Producto actualizado correctamente.', 'success');
            
            if (file && oldImageUrl && oldImageUrl.includes(BUCKET_NAME)) {
                const oldFileName = oldImageUrl.split('/').pop();
                console.log('Borrando archivo antiguo:', oldFileName);
                
                const { error: deleteError } = await sbClient.storage.from(BUCKET_NAME).remove([oldFileName]);
                if (deleteError) {
                    console.warn('Advertencia: No se pudo borrar la imagen antigua.', deleteError.message);
                    showAlert('Producto actualizado, pero no se pudo borrar la imagen antigua.', 'error');
                }
            }

        } else {
            const categoryProducts = products.filter(p => p.category === category);
            const maxOrder = categoryProducts.length > 0 ? Math.max(...categoryProducts.map(p => p.order || 0)) : 0;
            productData.product_order = maxOrder + 1;
            
            const { data, error } = await sbClient.from('products').insert(productData).select(); 
            if (error) throw error;

            const newProductData = data[0]; 
            const newProduct = {
                id: newProductData.id,
                name: newProductData.name,
                category: newProductData.category,
                price: newProductData.price,
                type: newProductData.type,
                image: newProductData.image_url,
                order: newProductData.product_order,
                sizeConfig: newProductData.size_config,
                packagingConfig: newProductData.packaging_config
            };
            products.push(newProduct);
            showAlert('Producto agregado correctamente.', 'success');
        }
        
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        resetForm();
        showSection('products');
        await loadProducts();    // Recargar desde DB
        displayProducts();       // Mostrar datos actualizados

    } catch (error) {
        console.error('❌ Error guardando en Supabase:', error);
        showAlert(`Error: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Guardar Producto';
    }
}

// Borra el producto de la DB y la imagen del Storage
async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            const product = products.find(p => p.id === id);
            
            const { error: dbError } = await sbClient.from('products').delete().eq('id', id);
            if (dbError) throw dbError;

            if (product && product.image && product.image.includes(BUCKET_NAME)) {
                const fileName = product.image.split('/').pop();
                console.log('Borrando imagen del storage:', fileName);
                
                const { error: storageError } = await sbClient.storage
                    .from(BUCKET_NAME)
                    .remove([fileName]);
                
                if (storageError) {
                    console.warn('No se pudo borrar la imagen antigua:', storageError.message);
                }
            }

            products = products.filter(p => p.id !== id);
            localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
            displayProducts();
            showAlert('Producto eliminado correctamente.', 'success');

        } catch (error) {
            console.error('Error eliminando producto:', error);
            showAlert(`Error: ${error.message}`, 'error');
        }
    }
}

// =================================================================
// FUNCIONES DE UI
// =================================================================

function displayProducts(filteredProducts = null) {
    let productsToDisplay = filteredProducts || products;
    if (currentFilter !== 'all') productsToDisplay = productsToDisplay.filter(p => p.category === currentFilter);
    productsToDisplay = sortProducts(productsToDisplay, currentSort);

    const container = document.getElementById('products-container');
    if (productsToDisplay.length === 0) {
        container.innerHTML = '<p class="no-products">No hay productos para mostrar.</p>';
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
            <h3 style="margin: 5px 0; font-size: 0.9em;">${product.name}</h3>
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
    `}).join('');
    
    initDragAndDrop();
}

// Nueva función global para expandir detalles
window.toggleDetails = function(id) {
    const details = document.getElementById(`details-${id}`);
    if (details) {
        details.classList.toggle('show');
    }
};

function getCategoryName(category) {
    const categories = {
        'amigurumis': 'Amigurumis', 'flores': 'Flores y Ramos', 'llaveros': 'Llaveros',
        'pulseras': 'Pulseras', 'colgantes': 'Colgantes', 'combos': 'Combos',
        'bolsas': 'Bolsas', 'macetas': 'Macetas', 'adicionales': 'Artículos Adicionales'
    };
    return categories[category] || category;
}

function updateCategoryFilter() {
    const filterSelect = document.getElementById('category-filter');
    const categories = [...new Set(products.map(p => p.category))];
    filterSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = getCategoryName(category);
        filterSelect.appendChild(option);
    });
}

function getSizeDisplay(sizeConfig) {
    if (!sizeConfig) return 'No configurado';
    if (sizeConfig.type === 'none') { return 'No aplica'; }
    if (sizeConfig.type === 'fixed') { return `Fijo: ${sizeConfig.value || 'No especificado'}`; } 
    else { const options = sizeConfig.options ? sizeConfig.options.join(', ') : 'No especificadas'; const defaultValue = sizeConfig.defaultValue || 'No especificado'; return `Personalizable: ${defaultValue} (${options})`; }
}

function getPackagingDisplay(packagingConfig) {
    if (!packagingConfig) return 'No configurado';
    if (packagingConfig.type === 'fixed') { return `Fijo: ${packagingConfig.value || 'No especificado'}`; }
    else { const options = packagingConfig.options ? packagingConfig.options.join(', ') : 'No especificadas'; const defaultValue = packagingConfig.defaultValue || 'No especificado'; return `Personalizable: ${defaultValue} (${options})`; }
}

function sortProducts(products, sortType) {
    const sortedProducts = [...products];
    switch (sortType) {
        case 'name-asc': return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc': return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc': return sortedProducts.sort((a, b) => (parseFloat(a.price.replace('$', '')) || 0) - (parseFloat(b.price.replace('$', '')) || 0));
        case 'price-desc': return sortedProducts.sort((a, b) => (parseFloat(b.price.replace('$', '')) || 0) - (parseFloat(a.price.replace('$', '')) || 0));
        case 'order-asc': return sortedProducts.sort((a, b) => (a.order || 999) - (b.order || 999));
        case 'order-desc': return sortedProducts.sort((a, b) => (b.order || 0) - (a.order || 0));
        case 'category-asc': return sortedProducts.sort((a, b) => a.category.localeCompare(b.category));
        case 'category-desc': return sortedProducts.sort((a, b) => b.category.localeCompare(a.category));
        default: return sortedProducts;
    }
}

async function moveProductUp(productId) {
    const categoryProducts = products.filter(p => currentFilter === 'all' ? true : p.category === currentFilter);
    const currentIndex = categoryProducts.findIndex(p => p.id === productId);
    if (currentIndex > 0) {
        const product = categoryProducts[currentIndex];
        const previousProduct = categoryProducts[currentIndex - 1];
        const tempOrder = product.order;
        product.order = previousProduct.order;
        previousProduct.order = tempOrder;
        await saveProducts();
        await loadProducts();
        displayProducts();
    }
}

async function moveProductDown(productId) {
    const categoryProducts = products.filter(p => currentFilter === 'all' ? true : p.category === currentFilter);
    const currentIndex = categoryProducts.findIndex(p => p.id === productId);
    if (currentIndex < categoryProducts.length - 1) {
        const product = categoryProducts[currentIndex];
        const nextProduct = categoryProducts[currentIndex + 1];
        const tempOrder = product.order;
        product.order = nextProduct.order;
        nextProduct.order = tempOrder;
        await saveProducts();
        await loadProducts();
        displayProducts();
    }
}

async function saveProducts() {
    try {
        const productsForDB = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            type: p.type,
            image_url: p.image,
            size_config: p.sizeConfig,
            packaging_config: p.packagingConfig,
            product_order: p.order || 999
        }));

        const { error } = await sbClient.from('products').upsert(productsForDB);
        if (error) throw error;

        showAlert('✅ Productos sincronizados con la base de datos', 'success');
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        await loadProducts();
        displayProducts();
    } catch (error) {
        console.error('❌ Error guardando productos en lote:', error);
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        showAlert('✅ Productos guardados en localStorage (fallback)', 'success');
    }
}


function filterProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm) || product.category.toLowerCase().includes(searchTerm) || product.price.toLowerCase().includes(searchTerm));
    displayProducts(filteredProducts);
}

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`).classList.add('active');
    if (sectionId === 'products') {
        displayProducts();
        updateCategoryFilter();
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
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
}


function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('form-title').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submit-btn').textContent = 'Guardar Producto';
    document.getElementById('cancel-btn').style.display = 'none';
    editingProductId = null;
    
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
    const alert = document.getElementById('alert');
    if (!alert) { console.error('Elemento #alert no encontrado'); return; }
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

function exportProducts() {
    console.log('🔴 exportProducts() ejecutándose...');
    console.log('📦 Productos a exportar:', products);
    
    try {
        if (!products || products.length === 0) {
            showAlert('No hay productos para exportar.', 'error');
            return;
        }

        const dataStr = JSON.stringify({ products: products }, null, 2);
        console.log('📄 JSON generado:', dataStr);
        
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'tejidos-delight-productos.json';
        
        console.log('🔗 Creando enlace de descarga...');
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        console.log('✅ Descarga iniciada');
        showAlert('Productos exportados correctamente.', 'success');
        
    } catch (error) {
        console.error('❌ Error en exportProducts:', error);
        showAlert(`Error exportando productos: ${error.message}`, 'error');
    }
}

function importProducts() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) { showAlert('Por favor selecciona un archivo JSON.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const importedProducts = importedData.products || importedData;
            if (Array.isArray(importedProducts)) {
                if (confirm('¿Estás seguro de que quieres importar estos productos? Se reemplazarán todos los productos actuales.')) {
                    products = importedProducts;
                    saveProducts();
                    displayProducts();
                    showAlert('Productos importados correctamente.', 'success');
                    fileInput.value = '';
                }
            } else { showAlert('El archivo no contiene una lista válida de productos.', 'error'); }
        } catch (error) { showAlert('Error al leer el archivo. Asegúrate de que es un JSON válido.', 'error'); }
    };
    reader.readAsText(file);
}

async function resetToDefault() {
    if (confirm('¿Estás seguro de que quieres restablecer todos los productos a los valores predeterminados? Se perderán todos los productos actuales.')) {
        products = [];
        await saveProducts();
        displayProducts();
        showAlert('Productos restablecidos.', 'success');
    }
}

// --- FUNCIÓN 'toggleSizeOptions' MODIFICADA ---
function toggleSizeOptions() {
    const customizableOptions = document.getElementById('customizable-size-options');
    const selectedType = document.querySelector('input[name="size-type"]:checked').value;
    
    if (selectedType === 'customizable') {
        customizableOptions.classList.remove('hidden');
    } else {
        customizableOptions.classList.add('hidden');
    }
    
    const fixedInput = document.getElementById('fixed-size');
    if (fixedInput) {
        fixedInput.disabled = (selectedType === 'none');
        if (selectedType === 'none') fixedInput.value = '';
    }
}

function togglePackagingOptions() {
    const customizableOptions = document.getElementById('customizable-packaging-options');
    const isCustom = document.querySelector('input[name="packaging-type"][value="customizable"]').checked;
    if (isCustom) { customizableOptions.classList.remove('hidden'); }
    else { customizableOptions.classList.add('hidden'); }
}

// Variable para la instancia
let sortableInstance = null;

function initDragAndDrop() {
    const container = document.getElementById('products-container');
    if (!container || currentSort !== 'order-asc') return;

    if (sortableInstance) sortableInstance.destroy();

    sortableInstance = Sortable.create(container, {
        animation: 150,
        scroll: true,
        scrollSensitivity: 150,
        scrollSpeed: 20,
        bubbleScroll: true,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        handle: '.admin-product-card',
        // Excluir botones del arrastre
        filter: '.btn-info-action, .btn-edit-action, .btn-delete-action, button',
        preventOnFilter: false,
        onEnd: async function () {
            await reorderProductsFromDOM();
        }
    });
}

async function reorderProductsFromDOM() {
    const cards = document.querySelectorAll('.admin-product-card');
    const categoryCounters = {};
    const updatedPayload = [];

    cards.forEach((card) => {
        const productId = card.dataset.productId;
        const product = products.find(p => p.id === productId);
        
        if (product) {
            const cat = product.category;
            categoryCounters[cat] = (categoryCounters[cat] || 0) + 1;
            const newOrder = categoryCounters[cat];

            product.order = newOrder;

            updatedPayload.push({ 
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                type: product.type,
                image_url: product.image,
                size_config: product.sizeConfig,
                packaging_config: product.packagingConfig,
                product_order: newOrder 
            });
        }
    });

    try {
        const { error } = await sbClient.from('products').upsert(updatedPayload, { onConflict: 'id' });
        if (error) throw error;
        
        showAlert('✅ Orden actualizado', 'success');
        displayProducts();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al guardar: ' + error.message, 'error');
    }
}

// Variables para promociones
let promotions = [];

// Cargar promociones desde Supabase
async function loadPromotions() {
    try {
        const { data, error } = await sbClient
            .from('promotions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        promotions = data || [];
        renderPromotionsList();
    } catch (error) {
        console.error('Error cargando promociones:', error);
        showAlert('Error al cargar promociones', 'error');
    }
}

// Renderizar lista de promociones
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
            <small>Tipo: ${promo.type === 'percentage' ? 'Porcentaje' : 'Cantidad fija'} | Valor: ${promo.value}${promo.type === 'percentage' ? '%' : '$'} | Mínimo: ${promo.min_quantity} productos</small>
        </div>
    `).join('');
    
    // Event listeners para botones
    document.querySelectorAll('.btn-edit-promo').forEach(btn => {
        btn.addEventListener('click', () => editPromotion(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete-promo').forEach(btn => {
        btn.addEventListener('click', () => deletePromotion(btn.dataset.id));
    });
    document.querySelectorAll('.btn-toggle-promo').forEach(btn => {
        btn.addEventListener('click', () => togglePromotionActive(btn.dataset.id, btn.dataset.active === 'true'));
    });
}

// Guardar promoción (nueva o edición)
async function savePromotion(event) {
    event.preventDefault();
    const id = document.getElementById('promotion-id').value;
    const name = document.getElementById('promotion-name').value;
    const banner_text = document.getElementById('promotion-banner').value;
    const type = document.getElementById('promotion-type').value;
    const value = parseFloat(document.getElementById('promotion-value').value);
    const min_quantity = parseInt(document.getElementById('promotion-min-qty').value);
    const active = document.getElementById('promotion-active').checked;
    
    const promoData = { name, banner_text, type, value, min_quantity, active };
    
    try {
        if (id) {
            const { error } = await sbClient
                .from('promotions')
                .update(promoData)
                .eq('id', id);
            if (error) throw error;
            showAlert('Promoción actualizada', 'success');
        } else {
            const { error } = await sbClient
                .from('promotions')
                .insert(promoData);
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
    document.getElementById('cancel-promo-btn').style.display = 'inline-block';
    showSection('promotions');
}

async function deletePromotion(id) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
        const { error } = await sbClient
            .from('promotions')
            .delete()
            .eq('id', id);
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
        const { error } = await sbClient
            .from('promotions')
            .update({ active: !currentActive })
            .eq('id', id);
        if (error) throw error;
        showAlert(`Promoción ${!currentActive ? 'activada' : 'desactivada'}`, 'success');
        loadPromotions();
    } catch (error) {
        console.error('Error toggling:', error);
        showAlert('Error al cambiar estado', 'error');
    }
}

// Agregar evento al formulario
document.getElementById('promotion-form')?.addEventListener('submit', savePromotion);
document.getElementById('cancel-promo-btn')?.addEventListener('click', resetPromotionForm);

// =================================================================
// HACER FUNCIONES GLOBALES PARA LOS BOTONES DEL HTML
// =================================================================

window.exportProducts = exportProducts;
window.importProducts = importProducts;
window.resetToDefault = resetToDefault;
window.showSection = showSection;
window.filterProducts = filterProducts;
window.resetForm = resetForm;