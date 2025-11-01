// =================================================================
// ARCHIVO admin.js REESTRUCTURADO (VERSIÓN 3 - CORREGIDA)
// =================================================================

// 1. Importar la función de Supabase (¡LA LÍNEA MÁS IMPORTANTE!)
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

// =================================================================
// INICIALIZACIÓN Y AUTENTICACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
});

async function checkUserSession() {
    // Usamos el cliente 'sbClient'
    const { data: { session } } = await sbClient.auth.getSession();

    if (session) {
        // El usuario SÍ tiene sesión
        console.log('Sesión activa:', session.user.email);
        // Mostrar el panel de admin
        document.getElementById('admin-panel').style.display = 'block';
        
        // Cargar todo lo demás
        loadProducts();
        setupEventListeners();
        updateCategoryFilter();

    } else {
        // El usuario NO tiene sesión
        console.log('No hay sesión, redirigiendo a login...');
        // Redirigir a la página de login
        window.location.href = 'acceso-seguro-789.html'; // Asegúrate que este sea el nombre de tu login.html
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de producto
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    
    // Vista previa de imagen
    document.getElementById('product-image').addEventListener('change', previewImage);
    
    // Filtros y ordenamiento
    document.getElementById('category-filter').addEventListener('change', function() {
        currentFilter = this.value;
        displayProducts();
    });
    
    document.getElementById('sort-products').addEventListener('change', function() {
        currentSort = this.value;
        displayProducts();
    });

    // Configuración de tamaño
    document.querySelectorAll('input[name="size-type"]').forEach(radio => {
        radio.addEventListener('change', toggleSizeOptions);
    });

    // Configuración de empaque
    document.querySelectorAll('input[name="packaging-type"]').forEach(radio => {
        radio.addEventListener('change', togglePackagingOptions);
    });

    // Botón de Salir
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await sbClient.auth.signOut();
            if (error) {
                console.error('Error al salir:', error);
            } else {
                // Redirigir a login al salir
                window.location.href = 'acceso-seguro-789.html'; // Asegúrate que este sea el nombre de tu login.html
            }
        });
    }
}

// =================================================================
// LÓGICA DE PRODUCTOS (Ahora usando 'sbClient')
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

// Guardar producto (nuevo o editado)
async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const type = document.getElementById('product-type').value;
    const imageUrl = document.getElementById('product-image-url').value;
    
    const sizeType = document.querySelector('input[name="size-type"]:checked').value;
    let sizeConfig = {};
    if (sizeType === 'fixed') { sizeConfig = { type: 'fixed', value: document.getElementById('fixed-size').value || '10cm' }; } 
    else { const sizeOptions = document.getElementById('size-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== ''); sizeConfig = { type: 'customizable', defaultValue: document.getElementById('default-size').value || '10cm', options: sizeOptions.length > 0 ? sizeOptions : ['10cm', '15cm', '20cm'] }; }
    
    const packagingType = document.querySelector('input[name="packaging-type"]:checked').value;
    let packagingConfig = {};
    if (packagingType === 'fixed') { packagingConfig = { type: 'fixed', value: document.getElementById('fixed-packaging').value || 'Caja con visor' }; }
    else { const packagingOptions = document.getElementById('packaging-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== ''); packagingConfig = { type: 'customizable', defaultValue: document.getElementById('default-packaging').value || 'Caja con visor', options: packagingOptions.length > 0 ? packagingOptions : ['Caja con visor', 'Bolsa de papel'] }; }

    if (!name || !category || !price || !type) { showAlert('Por favor completa todos los campos obligatorios.', 'error'); return; }

    const productData = {
        name: name,
        category: category,
        price: price,
        type: type,
        image_url: imageUrl || 'imagenes/personalizado.jpg',
        size_config: sizeConfig,
        packaging_config: packagingConfig
    };

    try {
        if (productId) {
            // --- EDITANDO ---
            const productIndex = products.findIndex(p => p.id === productId);
            productData.product_order = products[productIndex]?.order || 999;

            const { error } = await sbClient
                .from('products')
                .update(productData)
                .eq('id', productId); 

            if (error) throw error;
            
            products[productIndex] = { ...products[productIndex], ...productData, image: productData.image_url };
            showAlert('Producto actualizado correctamente.', 'success');
            
        } else {
            // --- CREANDO ---
            const categoryProducts = products.filter(p => p.category === category);
            const maxOrder = categoryProducts.length > 0 ? Math.max(...categoryProducts.map(p => p.order || 0)) : 0;
            productData.product_order = maxOrder + 1;
            
            const { data, error } = await sbClient
                .from('products')
                .insert(productData)
                .select(); 

            if (error) throw error;

            const newProduct = data[0]; 
            
            products.push({
                id: newProduct.id,
                name: newProduct.name,
                category: newProduct.category,
                price: newProduct.price,
                type: newProduct.type,
                image: newProduct.image_url,
                order: newProduct.product_order,
                sizeConfig: newProduct.size_config,
                packagingConfig: newProduct.packaging_config
            });
            showAlert('Producto agregado correctamente.', 'success');
        }
        
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        resetForm();
        showSection('products');
        displayProducts();

    } catch (error) {
        console.error('❌ Error guardando en Supabase:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
}

// Eliminar producto
async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            const { error } = await sbClient
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

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
// FUNCIONES DE UI (Sin cambios)
// =================================================================
// (El resto de tus funciones de UI permanecen exactamente iguales)
// ...

function displayProducts(filteredProducts = null) {
    let productsToDisplay = filteredProducts || products;
    
    if (currentFilter !== 'all') {
        productsToDisplay = productsToDisplay.filter(p => p.category === currentFilter);
    }
    
    productsToDisplay = sortProducts(productsToDisplay, currentSort);
    
    const container = document.getElementById('products-container');
    
    if (productsToDisplay.length === 0) {
        container.innerHTML = '<p class="no-products">No hay productos para mostrar en esta categoría.</p>';
        return;
    }
    
    container.innerHTML = productsToDisplay.map(product => `
        <div class="admin-product-card" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='imagenes/personalizado.jpg'">
            <h3>${product.name}</h3>
            <p><strong>Categoría:</strong> ${getCategoryName(product.category)}</p>
            <p><strong>Precio:</strong> ${product.price}</p>
            <p><strong>Tipo:</strong> ${product.type === 'standard' ? 'Estándar' : 'Personalizado'}</p>
            <p><strong>Tamaño:</strong> ${getSizeDisplay(product.sizeConfig)}</p>
            <p><strong>Empaque:</strong> ${getPackagingDisplay(product.packagingConfig)}</p>
            <p><strong>Orden:</strong> ${product.order || 'No definido'}</p>
            <div class="admin-product-actions">
                <button class="btn-move-up" onclick="moveProductUp('${product.id}')" ${productsToDisplay.indexOf(product) === 0 ? 'disabled' : ''}>⬆</button>
                <button class="btn-move-down" onclick="moveProductDown('${product.id}')" ${productsToDisplay.indexOf(product) === productsToDisplay.length - 1 ? 'disabled' : ''}>⬇</button>
                <button class="btn-edit" onclick="editProduct('${product.id}')">Editar</button>
                <button class="btn-delete" onclick="deleteProduct('${product.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
}


function getCategoryName(category) {
    const categories = {
        'amigurumis': 'Amigurumis', 'flores': 'Flores y Ramos', 'llaveros': 'Llaveros',
        'pulseras': 'Pulseras', 'colgantes': 'Colgantes', 'combos': 'Combos',
        'bolsas': 'Bolsas', 'macetas': 'Macetas'
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
        await saveProducts(); // Esta función ahora solo guarda todo el array
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
        await saveProducts(); // Esta función ahora solo guarda todo el array
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

function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('product-image-url').value = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        document.getElementById('product-image-url').value = '';
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
        } else {
            document.querySelector('input[name="size-type"][value="customizable"]').checked = true;
            document.getElementById('default-size').value = product.sizeConfig?.defaultValue || '10cm';
            document.getElementById('size-options').value = product.sizeConfig?.options ? product.sizeConfig.options.join(', ') : '10cm,15cm,20cm';
        }
        toggleSizeOptions.call(document.querySelector('input[name="size-type"]:checked'));
        
        if (product.packagingConfig && product.packagingConfig.type === 'fixed') {
            document.querySelector('input[name="packaging-type"][value="fixed"]').checked = true;
            document.getElementById('fixed-packaging').value = product.packagingConfig.value || 'Caja con visor';
        } else {
            document.querySelector('input[name="packaging-type"][value="customizable"]').checked = true;
            document.getElementById('default-packaging').value = product.packagingConfig?.defaultValue || 'Caja con visor';
            document.getElementById('packaging-options').value = product.packagingConfig?.options ? product.packagingConfig.options.join(', ') : 'Caja con visor,Bolsa de papel';
        }
        togglePackagingOptions.call(document.querySelector('input[name="packaging-type"]:checked'));
        
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
    
    document.querySelector('input[name="size-type"][value="fixed"]').checked = true;
    document.getElementById('fixed-size').value = '10cm';
    toggleSizeOptions.call(document.querySelector('input[name="size-type"]:checked'));
    
    document.querySelector('input[name="packaging-type"][value="fixed"]').checked = true;
    document.getElementById('fixed-packaging').value = 'Caja con visor';
    togglePackagingOptions.call(document.querySelector('input[name="packaging-type"]:checked'));
}

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (!alert) { // Asegurarse de que el elemento 'alert' exista
        console.error('Elemento #alert no encontrado');
        return;
    }
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

function exportProducts() {
    const dataStr = JSON.stringify({ products: products }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'tejidos-delight-productos.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showAlert('Productos exportados correctamente.', 'success');
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
                    saveProducts(); // Esto guardará en Supabase
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
        await saveProducts(); // Guarda el array vacío
        displayProducts();
        showAlert('Productos restablecidos.', 'success');
    }
}

function toggleSizeOptions() {
    const customizableOptions = document.getElementById('customizable-size-options');
    const isCustom = document.querySelector('input[name="size-type"][value="customizable"]').checked;
    if (isCustom) { customizableOptions.classList.remove('hidden'); }
    else { customizableOptions.classList.add('hidden'); }
}

function togglePackagingOptions() {
    const customizableOptions = document.getElementById('customizable-packaging-options');
    const isCustom = document.querySelector('input[name="packaging-type"][value="customizable"]').checked;
    if (isCustom) { customizableOptions.classList.remove('hidden'); }
    else { customizableOptions.classList.add('hidden'); }
}