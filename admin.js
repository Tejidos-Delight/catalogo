// Variables globales
let products = [];
let editingProductId = null;
let currentFilter = 'all';
let currentSort = 'order-asc';

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
    const savedProducts = localStorage.getItem('tejidosDelightProducts');
    
    if (!savedProducts || JSON.parse(savedProducts).length === 0) {
        // Si no hay productos, cargar desde el JSON
        loadProductsFromJSON();
    }
}

// Cargar productos desde JSON
async function loadProductsFromJSON() {
    try {
        const response = await fetch('products.json');
        if (response.ok) {
            const data = await response.json();
            products = data.products;
            saveProducts();
            displayProducts();
            updateCategoryFilter();
            showAlert('Productos cargados desde archivo JSON.', 'success');
        }
    } catch (error) {
        console.error('Error cargando products.json:', error);
        // Cargar productos mínimos de respaldo
        loadDefaultProducts();
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

// Cargar productos desde localStorage
function loadProducts() {
    const savedProducts = localStorage.getItem('tejidosDelightProducts');
    
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    
    displayProducts();
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

// Cargar productos predeterminados
function loadDefaultProducts() {
    products = [
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
        },
        {
            id: '3',
            name: 'Ramo de Hello Kitty',
            category: 'flores',
            price: '$5.00',
            type: 'standard',
            image: 'imagenes/ramo-hello-kitty.jpg',
            order: 1,
            sizeConfig: {
                type: 'fixed',
                value: '25cm'
            },
            packagingConfig: {
                type: 'fixed',
                value: 'Papel de regalo'
            }
        },
        {
            id: '4',
            name: 'Ramo Personalizado',
            category: 'flores',
            price: 'A cotizar',
            type: 'custom',
            image: 'imagenes/personalizado.jpg',
            order: 2,
            sizeConfig: {
                type: 'customizable',
                defaultValue: '30cm',
                options: ['25cm', '30cm', '35cm', '40cm']
            },
            packagingConfig: {
                type: 'customizable',
                defaultValue: 'Papel de regalo',
                options: ['Papel de regalo', 'Caja premium', 'Bolsa de tela']
            }
        },
        {
            id: '5',
            name: 'Llavero Básico',
            category: 'llaveros',
            price: '$3.00',
            type: 'standard',
            image: 'imagenes/llavero-basico.jpg',
            order: 1,
            sizeConfig: {
                type: 'fixed',
                value: '5cm'
            },
            packagingConfig: {
                type: 'fixed',
                value: 'Bolsa pequeña'
            }
        },
        {
            id: '6',
            name: 'Llavero Personalizado',
            category: 'llaveros',
            price: 'A cotizar',
            type: 'custom',
            image: 'imagenes/personalizado.jpg',
            order: 2,
            sizeConfig: {
                type: 'customizable',
                defaultValue: '6cm',
                options: ['5cm', '6cm', '7cm', '8cm']
            },
            packagingConfig: {
                type: 'customizable',
                defaultValue: 'Bolsa pequeña',
                options: ['Bolsa pequeña', 'Cajita', 'Sobre']
            }
        },
        {
            id: '7',
            name: 'Pulsera Básica',
            category: 'pulseras',
            price: '$4.00',
            type: 'standard',
            image: 'imagenes/pulsera-basica.jpg',
            order: 1,
            sizeConfig: {
                type: 'fixed',
                value: 'Ajustable'
            },
            packagingConfig: {
                type: 'fixed',
                value: 'Bolsa de organza'
            }
        },
        {
            id: '8',
            name: 'Pulsera Personalizada',
            category: 'pulseras',
            price: 'A cotizar',
            type: 'custom',
            image: 'imagenes/personalizado.jpg',
            order: 2,
            sizeConfig: {
                type: 'customizable',
                defaultValue: '17cm',
                options: ['15cm', '17cm', '19cm', '21cm']
            },
            packagingConfig: {
                type: 'customizable',
                defaultValue: 'Bolsa de organza',
                options: ['Bolsa de organza', 'Cajita', 'Display']
            }
        },
        {
            id: '9',
            name: 'Bolsa Básica',
            category: 'bolsas',
            price: '$8.00',
            type: 'standard',
            image: 'imagenes/bolsa-basica.jpg',
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
            id: '10',
            name: 'Bolsa Personalizada',
            category: 'bolsas',
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
        },
        {
            id: '11',
            name: 'Maceta Simple',
            category: 'macetas',
            price: '$6.00',
            type: 'standard',
            image: 'imagenes/maceta-simple.jpg',
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
            id: '12',
            name: 'Maceta Personalizada',
            category: 'macetas',
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
    
    saveProducts();
    displayProducts();
    updateCategoryFilter();
}

// En admin.js - reemplazar saveProducts()
async function saveProducts() {
    try {
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
            product_order: product.order
        }));

        // Guardar en Supabase
        const response = await fetch('https://tu-proyecto.supabase.co/rest/v1/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'tu-clave-publica-anon',
                'Authorization': 'Bearer tu-clave-publica-anon',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(productsForDB)
        });

        if (response.ok) {
            showAlert('✅ Productos guardados en base de datos', 'success');
        } else {
            throw new Error('Error en respuesta de Supabase');
        }
    } catch (error) {
        console.error('Error guardando en Supabase:', error);
        // Fallback a localStorage
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(products));
        showAlert('✅ Productos guardados en localStorage (fallback)', 'success');
    }
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
function moveProductUp(productId) {
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
        
        saveProducts();
        displayProducts();
    }
}

// Mover producto hacia abajo
function moveProductDown(productId) {
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
        
        saveProducts();
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

// Guardar producto (nuevo o editado)
function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const type = document.getElementById('product-type').value;
    const imageUrl = document.getElementById('product-image-url').value;
    const description = document.getElementById('product-description').value;
    
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
    
    // Si estamos editando
    if (productId) {
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex] = {
                ...products[productIndex],
                name,
                category,
                price,
                type,
                image: imageUrl || products[productIndex].image,
                description: description || products[productIndex].description,
                sizeConfig,
                packagingConfig
            };
            
            showAlert('Producto actualizado correctamente.', 'success');
        }
    } else {
        // Nuevo producto - determinar el orden
        const categoryProducts = products.filter(p => p.category === category);
        const maxOrder = categoryProducts.length > 0 ? 
            Math.max(...categoryProducts.map(p => p.order || 0)) : 0;
        
        const newProduct = {
            id: generateId(),
            name,
            category,
            price,
            type,
            image: imageUrl || 'imagenes/personalizado.jpg',
            description: description || '',
            order: maxOrder + 1,
            sizeConfig,
            packagingConfig
        };
        
        products.push(newProduct);
        showAlert('Producto agregado correctamente.', 'success');
    }
    
    saveProducts();
    resetForm();
    showSection('products');
}

// Generar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
        document.getElementById('product-description').value = product.description || '';
        
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
function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        displayProducts();
        showAlert('Producto eliminado correctamente.', 'success');
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
    
    showAlert('Productos exportados correctamente. Reemplaza el contenido de products.json con este archivo para actualizar GitHub Pages.', 'success');
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
                    saveProducts();
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
function resetToDefault() {
    if (confirm('¿Estás seguro de que quieres restablecer todos los productos a los valores predeterminados? Se perderán todos los productos actuales.')) {
        loadDefaultProducts();
        showAlert('Productos restablecidos a valores predeterminados.', 'success');
    }
}