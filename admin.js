// Variables globales
let products = [];
let editingProductId = null;
let currentFilter = 'all';
let currentSort = 'order-asc';

// CONFIGURACIÓN SUPABASE - REEMPLAZA CON TUS DATOS
// CONFIGURACIÓN SUPABASE - CON TU API KEY REAL
const SUPABASE_CONFIG = {
    url: 'https://egjlhlkholudjpjesunj.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg',
        'Content-Type': 'application/json'
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
    updateCategoryFilter();
    initializeProducts();
});

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
}

// Inicializar productos si no existen
function initializeProducts() {
    // No necesitamos cargar desde JSON ya que usamos Supabase
    console.log('🔄 Inicializando productos desde Supabase...');
}

// Cargar productos desde Supabase
async function loadProducts() {
    try {
        console.log('📥 Cargando productos desde Supabase...');
        
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?select=*&order=product_order`, {
            headers: SUPABASE_CONFIG.headers
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Productos cargados desde Supabase:', data.length);
            
            // Convertir de formato Supabase a formato interno
            products = data.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                price: item.price,
                type: item.type,
                image: item.image_url,
                sizeConfig: item.size_config || {
                    type: 'customizable',
                    defaultValue: '10cm',
                    options: ['10cm', '15cm', '20cm', 'Personalizado']
                },
                packagingConfig: item.packaging_config || {
                    type: 'customizable',
                    defaultValue: 'Caja con visor',
                    options: ['Caja con visor', 'Bolsa de papel', 'Funda transparente']
                },
                order: item.product_order || 999
            }));
            
        } else {
            throw new Error(`HTTP ${response.status}: Error cargando desde Supabase`);
        }
    } catch (error) {
        console.error('❌ Error cargando desde Supabase:', error);
        // Fallback a localStorage
        await loadFromLocalStorage();
    }
    
    displayProducts();
    updateCategoryFilter();
}

// Función para cargar desde localStorage (fallback)
async function loadFromLocalStorage() {
    const savedProducts = localStorage.getItem('tejidosDelightProducts');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
        console.log('📥 Productos cargados desde localStorage:', products.length);
    } else {
        console.log('⚠️ No hay productos, cargando predeterminados');
        await loadDefaultProducts();
    }
}

// Alternar opciones de tamaño
function toggleSizeOptions() {
    const customizableOptions = document.getElementById('customizable-size-options');
    if (this.value === 'customizable') {
        customizableOptions.classList.remove('hidden');
    } else {
        customizableOptions.classList.add('hidden');
    }
}

// Alternar opciones de empaque
function togglePackagingOptions() {
    const customizableOptions = document.getElementById('customizable-packaging-options');
    if (this.value === 'customizable') {
        customizableOptions.classList.remove('hidden');
    } else {
        customizableOptions.classList.add('hidden');
    }
}

// Cargar productos predeterminados
async function loadDefaultProducts() {
    console.log('🔄 Cargando productos predeterminados...');
    
    const defaultProducts = [
        {
            id: '1',
            name: 'Stitch',
            category: 'amigurumis',
            price: '$5.00',
            type: 'standard',
            image: 'imagenes/stitch.jpg',
            order: 1,
            sizeConfig: {
                type: 'fixed',
                value: '10cm'
            },
            packagingConfig: {
                type: 'customizable',
                defaultValue: 'Caja con visor',
                options: ['Caja con visor', 'Bolsa de papel', 'Funda transparente']
            }
        },
        {
            id: '2',
            name: 'Amigurumi Personalizado',
            category: 'amigurumis',
            price: 'A cotizar',
            type: 'custom',
            image: 'imagenes/personalizado.jpg',
            order: 2,
            sizeConfig: {
                type: 'customizable',
                defaultValue: '15cm',
                options: ['10cm', '15cm', '20cm', '25cm']
            },
            packagingConfig: {
                type: 'customizable',
                defaultValue: 'Caja con visor',
                options: ['Caja con visor', 'Bolsa de papel', 'Funda transparente']
            }
        }
    ];
    
    products = defaultProducts;
    
    try {
        // Intentar guardar los productos predeterminados en Supabase
        await saveProductsToSupabase();
    } catch (error) {
        console.error('❌ Error guardando productos predeterminados en Supabase:', error);
        // Guardar solo en localStorage
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
    }
}

// Guardar productos en Supabase
async function saveProductsToSupabase() {
    console.log('💾 Guardando productos en Supabase...');
    
    // Preparar productos para Supabase
    const productsForDB = products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        type: product.type,
        image_url: product.image,
        size_config: product.sizeConfig,
        packaging_config: product.packagingConfig,
        product_order: product.order || 999
    }));

    // Guardar en Supabase usando UPSERT (inserta o actualiza)
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products`, {
        method: 'POST',
        headers: {
            ...SUPABASE_CONFIG.headers,
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(productsForDB)
    });

    if (response.ok) {
        console.log('✅ Productos guardados en Supabase');
        // También guardar en localStorage como backup
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        return true;
    } else {
        const errorText = await response.text();
        throw new Error(`Supabase error: ${errorText}`);
    }
}

// Actualizar filtro de categorías
function updateCategoryFilter() {
    const filterSelect = document.getElementById('category-filter');
    const categories = [...new Set(products.map(p => p.category))];
    
    // Mantener la opción "Todas"
    filterSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = getCategoryName(category);
        filterSelect.appendChild(option);
    });
}

// Mostrar productos en la interfaz
function displayProducts(filteredProducts = null) {
    let productsToDisplay = filteredProducts || products;
    
    // Aplicar filtro
    if (currentFilter !== 'all') {
        productsToDisplay = productsToDisplay.filter(p => p.category === currentFilter);
    }
    
    // Aplicar ordenamiento
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

// Obtener display de tamaño
function getSizeDisplay(sizeConfig) {
    if (!sizeConfig) return 'No configurado';
    
    if (sizeConfig.type === 'fixed') {
        return `Fijo: ${sizeConfig.value || 'No especificado'}`;
    } else {
        const options = sizeConfig.options ? sizeConfig.options.join(', ') : 'No especificadas';
        const defaultValue = sizeConfig.defaultValue || 'No especificado';
        return `Personalizable: ${defaultValue} (${options})`;
    }
}

// Obtener display de empaque
function getPackagingDisplay(packagingConfig) {
    if (!packagingConfig) return 'No configurado';
    
    if (packagingConfig.type === 'fixed') {
        return `Fijo: ${packagingConfig.value || 'No especificado'}`;
    } else {
        const options = packagingConfig.options ? packagingConfig.options.join(', ') : 'No especificadas';
        const defaultValue = packagingConfig.defaultValue || 'No especificado';
        return `Personalizable: ${defaultValue} (${options})`;
    }
}

// Ordenar productos
function sortProducts(products, sortType) {
    const sortedProducts = [...products];
    
    switch (sortType) {
        case 'name-asc':
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc':
            return sortedProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('$', '')) || 0;
                const priceB = parseFloat(b.price.replace('$', '')) || 0;
                return priceA - priceB;
            });
        case 'price-desc':
            return sortedProducts.sort((a, b) => {
                const priceA = parseFloat(a.price.replace('$', '')) || 0;
                const priceB = parseFloat(b.price.replace('$', '')) || 0;
                return priceB - priceA;
            });
        case 'order-asc':
            return sortedProducts.sort((a, b) => (a.order || 999) - (b.order || 999));
        case 'order-desc':
            return sortedProducts.sort((a, b) => (b.order || 0) - (a.order || 0));
        case 'category-asc':
            return sortedProducts.sort((a, b) => a.category.localeCompare(b.category));
        case 'category-desc':
            return sortedProducts.sort((a, b) => b.category.localeCompare(a.category));
        default:
            return sortedProducts;
    }
}

// Mover producto hacia arriba
async function moveProductUp(productId) {
    const categoryProducts = products.filter(p => 
        currentFilter === 'all' ? true : p.category === currentFilter
    );
    const currentIndex = categoryProducts.findIndex(p => p.id === productId);
    
    if (currentIndex > 0) {
        const product = categoryProducts[currentIndex];
        const previousProduct = categoryProducts[currentIndex - 1];
        
        // Intercambiar órdenes
        const tempOrder = product.order;
        product.order = previousProduct.order;
        previousProduct.order = tempOrder;
        
        await saveProducts();
        displayProducts();
    }
}

// Mover producto hacia abajo
async function moveProductDown(productId) {
    const categoryProducts = products.filter(p => 
        currentFilter === 'all' ? true : p.category === currentFilter
    );
    const currentIndex = categoryProducts.findIndex(p => p.id === productId);
    
    if (currentIndex < categoryProducts.length - 1) {
        const product = categoryProducts[currentIndex];
        const nextProduct = categoryProducts[currentIndex + 1];
        
        // Intercambiar órdenes
        const tempOrder = product.order;
        product.order = nextProduct.order;
        nextProduct.order = tempOrder;
        
        await saveProducts();
        displayProducts();
    }
}

// Obtener nombre legible de la categoría
function getCategoryName(category) {
    const categories = {
        'amigurumis': 'Amigurumis',
        'flores': 'Flores y Ramos',
        'llaveros': 'Llaveros',
        'pulseras': 'Pulseras',
        'colgantes': 'Colgantes',
        'combos': 'Combos',
        'bolsas': 'Bolsas',
        'macetas': 'Macetas'
    };
    
    return categories[category] || category;
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.price.toLowerCase().includes(searchTerm)
    );
    
    displayProducts(filteredProducts);
}

// Mostrar sección específica
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    // Si es la sección de productos, actualizar la lista
    if (sectionId === 'products') {
        displayProducts();
        updateCategoryFilter();
    }
}

// Vista previa de imagen
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

// =================================================================
// FUNCIÓN saveProduct - CORREGIDA
// =================================================================
async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const type = document.getElementById('product-type').value;
    const imageUrl = document.getElementById('product-image-url').value;
    // const description = document.getElementById('product-description').value; // --- CORRECCIÓN: LÍNEA ELIMINADA ---
    
    // Obtener configuración de tamaño
    const sizeType = document.querySelector('input[name="size-type"]:checked').value;
    let sizeConfig = {};
    
    if (sizeType === 'fixed') {
        sizeConfig = {
            type: 'fixed',
            value: document.getElementById('fixed-size').value || '10cm'
        };
    } else {
        const sizeOptions = document.getElementById('size-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
        sizeConfig = {
            type: 'customizable',
            defaultValue: document.getElementById('default-size').value || '10cm',
            options: sizeOptions.length > 0 ? sizeOptions : ['10cm', '15cm', '20cm']
        };
    }
    
    // Obtener configuración de empaque
    const packagingType = document.querySelector('input[name="packaging-type"]:checked').value;
    let packagingConfig = {};
    
    if (packagingType === 'fixed') {
        packagingConfig = {
            type: 'fixed',
            value: document.getElementById('fixed-packaging').value || 'Caja con visor'
        };
    } else {
        const packagingOptions = document.getElementById('packaging-options').value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
        packagingConfig = {
            type: 'customizable',
            defaultValue: document.getElementById('default-packaging').value || 'Caja con visor',
            options: packagingOptions.length > 0 ? packagingOptions : ['Caja con visor', 'Bolsa de papel', 'Funda transparente']
        };
    }
    
    // Validación básica
    if (!name || !category || !price || !type) {
        showAlert('Por favor completa todos los campos obligatorios.', 'error');
        return;
    }
    
    // Asegurar que las configuraciones tengan valores por defecto
    if (sizeConfig.type === 'customizable') {
        if (!sizeConfig.options || sizeConfig.options.length === 0) {
            sizeConfig.options = ['10cm', '15cm', '20cm'];
        }
        if (!sizeConfig.defaultValue) {
            sizeConfig.defaultValue = sizeConfig.options[0];
        }
    }

    if (packagingConfig.type === 'customizable') {
        if (!packagingConfig.options || packagingConfig.options.length === 0) {
            packagingConfig.options = ['Caja con visor', 'Bolsa de papel', 'Funda transparente'];
        }
        if (!packagingConfig.defaultValue) {
            packagingConfig.defaultValue = packagingConfig.options[0];
        }
    }

    // --- LÓGICA CORREGIDA ---
    
    // 1. Crear el objeto de datos (sin ID)
    const productData = {
        name: name,
        category: category,
        price: price,
        type: type,
        image_url: imageUrl || 'imagenes/personalizado.jpg',
        // description: description || '', // --- CORRECCIÓN: LÍNEA ELIMINADA ---
        size_config: sizeConfig,
        packaging_config: packagingConfig
        // El 'product_order' se añade condicionalmente
    };

    try {
        if (productId) {
            // --- ESTAMOS EDITANDO ---
            console.log('🔄 Actualizando producto en Supabase:', productId);
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error("No se encontró el producto para actualizar");
            }
            
            // Mantener el orden original al editar
            productData.product_order = products[productIndex].order || 999;

            const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?id=eq.${productId}`, {
                method: 'PATCH', // Usar PATCH para actualizar
                headers: SUPABASE_CONFIG.headers,
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error actualizando: ${errorText}`);
            }
            
            // Actualizar el array local
            // Mapeamos los campos devueltos por Supabase
            products[productIndex] = { 
                ...products[productIndex],
                name: productData.name,
                category: productData.category,
                price: productData.price,
                type: productData.type,
                image: productData.image_url,
                // description: productData.description, // --- CORRECCIÓN: LÍNEA ELIMINADA ---
                sizeConfig: productData.size_config,
                packagingConfig: productData.packaging_config
            };
            
            showAlert('Producto actualizado correctamente.', 'success');
            
        } else {
            // --- ESTAMOS CREANDO UNO NUEVO ---
            // (Aquí estaba el error)
            console.log('➕ Creando nuevo producto en Supabase...');

            // Determinar el orden
            const categoryProducts = products.filter(p => p.category === category);
            const maxOrder = categoryProducts.length > 0 ? 
                Math.max(...categoryProducts.map(p => p.order || 0)) : 0;
            productData.product_order = maxOrder + 1;
            
            // NO AÑADIR ID, DEJAR QUE SUPABASE LO GENERE
            const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products`, {
                method: 'POST',
                headers: {
                    ...SUPABASE_CONFIG.headers,
                    'Prefer': 'return=representation' // Pedir que devuelva el objeto creado
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error creando: ${errorText}`);
            }

            const newProductData = await response.json();
            const newProduct = newProductData[0];
            
            // Añadir el producto nuevo (con el ID real de Supabase) al array local
            products.push({
                id: newProduct.id,
                name: newProduct.name,
                category: newProduct.category,
                price: newProduct.price,
                type: newProduct.type,
                image: newProduct.image_url,
                // description: newProduct.description, // --- CORRECCIÓN: LÍNEA ELIMINADA ---
                order: newProduct.product_order,
                sizeConfig: newProduct.size_config,
                packagingConfig: newProduct.packaging_config
            });
            showAlert('Producto agregado correctamente.', 'success');
        }
        
        // NO LLAMAMOS A saveProducts() porque ya hicimos la operación
        
        // Guardar en localStorage como backup (ahora sí con el ID correcto)
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));

        resetForm();
        showSection('products'); // Esto llamará a displayProducts()
        displayProducts(); // Forzar actualización de la vista

    } catch (error) {
        console.error('❌ Error guardando en Supabase:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
}
// =================================================================
// FIN DE LA FUNCIÓN CORREGIDA
// =================================================================


// Guardar productos (función principal)
async function saveProducts() {
    // Esta función ahora solo se usa para operaciones en lote (mover, importar)
    try {
        await saveProductsToSupabase();
        showAlert('✅ Productos guardados en base de datos', 'success');
    } catch (error) {
        console.error('❌ Error guardando en Supabase:', error);
        // Fallback a localStorage
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        showAlert('✅ Productos guardados en localStorage (fallback)', 'success');
    }
}

// --- FUNCIÓN generateId() ELIMINADA ---
// Ya no es necesaria, Supabase genera los IDs

// Editar producto
function editProduct(id) {
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('form-title').textContent = 'Editar Producto';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-type').value = product.type;
        // document.getElementById('product-description').value = product.description || ''; // --- CORRECCIÓN: LÍNEA ELIMINADA ---
        
        // Configurar tamaño
        if (product.sizeConfig && product.sizeConfig.type === 'fixed') {
            document.querySelector('input[name="size-type"][value="fixed"]').checked = true;
            document.getElementById('fixed-size').value = product.sizeConfig.value || '10cm';
        } else {
            document.querySelector('input[name="size-type"][value="customizable"]').checked = true;
            document.getElementById('default-size').value = product.sizeConfig?.defaultValue || '10cm';
            document.getElementById('size-options').value = product.sizeConfig?.options ? product.sizeConfig.options.join(', ') : '10cm,15cm,20cm';
        }
        toggleSizeOptions.call(document.querySelector('input[name="size-type"]:checked'));
        
        // Configurar empaque
        if (product.packagingConfig && product.packagingConfig.type === 'fixed') {
            document.querySelector('input[name="packaging-type"][value="fixed"]').checked = true;
            document.getElementById('fixed-packaging').value = product.packagingConfig.value || 'Caja con visor';
        } else {
            document.querySelector('input[name="packaging-type"][value="customizable"]').checked = true;
            document.getElementById('default-packaging').value = product.packagingConfig?.defaultValue || 'Caja con visor';
            document.getElementById('packaging-options').value = product.packagingConfig?.options ? product.packagingConfig.options.join(', ') : 'Caja con visor,Bolsa de papel,Funda transparente';
        }
        togglePackagingOptions.call(document.querySelector('input[name="packaging-type"]:checked'));
        
        // Mostrar imagen actual si existe
        const preview = document.getElementById('image-preview');
        if (product.image && product.image.startsWith('data:')) {
            preview.src = product.image;
            preview.style.display = 'block';
            document.getElementById('product-image-url').value = product.image;
        } else if (product.image) {
            preview.src = product.image;
            preview.style.display = 'block';
        }
        
        document.getElementById('submit-btn').textContent = 'Actualizar Producto';
        document.getElementById('cancel-btn').style.display = 'inline-block';
        
        showSection('add-product');
    }
}

// Eliminar producto
async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            // Eliminar de Supabase
            const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/products?id=eq.${id}`, {
                method: 'DELETE',
                headers: SUPABASE_CONFIG.headers
            });

            if (response.ok) {
                // Eliminar del array local
                products = products.filter(p => p.id !== id);
                
                // Actualizar localStorage
                localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
                
                displayProducts();
                showAlert('Producto eliminado correctamente.', 'success');
            } else {
                throw new Error('Error eliminando de Supabase');
            }
        } catch (error) {
            console.error('Error eliminando producto:', error);
            // Fallback: eliminar solo localmente
            products = products.filter(p => p.id !== id);
            localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
            displayProducts();
            showAlert('Producto eliminado (solo localmente)', 'success');
        }
    }
}

// Restablecer formulario
function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('form-title').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submit-btn').textContent = 'Guardar Producto';
    document.getElementById('cancel-btn').style.display = 'none';
    editingProductId = null;
    
    // Restablecer opciones de tamaño y empaque a valores por defecto
    document.querySelector('input[name="size-type"][value="fixed"]').checked = true;
    document.getElementById('fixed-size').value = '10cm';
    toggleSizeOptions.call(document.querySelector('input[name="size-type"]:checked'));
    
    document.querySelector('input[name="packaging-type"][value="fixed"]').checked = true;
    document.getElementById('fixed-packaging').value = 'Caja con visor';
    togglePackagingOptions.call(document.querySelector('input[name="packaging-type"]:checked'));
}

// Mostrar alerta
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Exportar productos a JSON
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

// Importar productos desde JSON
function importProducts() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Por favor selecciona un archivo JSON.', 'error');
        return;
    }
    
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
            } else {
                showAlert('El archivo no contiene una lista válida de productos.', 'error');
            }
        } catch (error) {
            showAlert('Error al leer el archivo. Asegúrate de que es un JSON válido.', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Restablecer a valores predeterminados
async function resetToDefault() {
    if (confirm('¿Estás seguro de que quieres restablecer todos los productos a los valores predeterminados? Se perderán todos los productos actuales.')) {
        await loadDefaultProducts();
        displayProducts();
        showAlert('Productos restablecidos a valores predeterminados.', 'success');
    }
}