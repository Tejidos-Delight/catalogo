// products-loader.js - Versión con Supabase
class ProductsLoader {
    constructor() {
        this.products = [];
        this.init();
    }
    
    async init() {
        await this.loadProducts();
        this.setupEventListeners();
    }
    
    async loadProducts() {
        try {
            // Intentar cargar desde Supabase
            const response = await fetch('https://tu-proyecto.supabase.co/rest/v1/products?select=*', {
                headers: {
                    'apikey': 'tu-clave-publica-anon',
                    'Authorization': 'Bearer tu-clave-publica-anon'
                }
            });
            
            if (response.ok) {
                this.products = await response.json();
                console.log('✅ Productos cargados desde Supabase:', this.products.length);
            } else {
                throw new Error('Error cargando desde Supabase');
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            // Fallback a localStorage
            const savedProducts = localStorage.getItem('tejidosDelightProducts');
            if (savedProducts) {
                this.products = JSON.parse(savedProducts);
            }
        }
        
        this.updatePageContent();
    }
    
    // El resto del código permanece igual...
    updatePageContent() {
        this.updateCategoryPages();
    }
    
    updateCategoryPages() {
        const categoryMap = {
            'amigurumis': 'amigurumis',
            'flores': 'flores',
            'llaveros': 'llaveros', 
            'pulseras': 'pulseras',
            'colgantes': 'colgantes',
            'combos': 'combos',
            'bolsas': 'bolsas',
            'macetas': 'macetas'
        };
        
        const path = window.location.pathname;
        const fileName = path.split('/').pop().replace('.html', '');
        const currentCategory = categoryMap[fileName];
        
        if (!currentCategory) return;
        
        const categoryProducts = this.products
            .filter(p => p.category === currentCategory)
            .sort((a, b) => (a.product_order || 999) - (b.product_order || 999));
        
        this.renderProducts(categoryProducts);
    }
    
    renderProducts(products) {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        
        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-products">No hay productos disponibles en esta categoría.</p>';
            return;
        }
        
        productGrid.innerHTML = products.map(product => {
            const sizeConfig = product.size_config || {
                type: 'customizable',
                defaultValue: '10cm',
                options: ['10cm', '15cm', '20cm', 'Personalizado']
            };
            
            const packagingConfig = product.packaging_config || {
                type: 'customizable', 
                defaultValue: 'Caja con visor',
                options: ['Caja con visor', 'Bolsa de papel', 'Funda transparente']
            };
            
            return `
                <div class="product-card" data-category="${product.type === 'standard' ? 'estandar' : 'personalizados'}">
                    <img src="${product.image_url}" alt="${product.name}" onerror="this.src='imagenes/personalizado.jpg'">
                    <h3>${product.name}</h3>
                    <p class="precio">${product.price}</p>
                    <div class="product-actions">
                        <button class="product-action-btn favorite-btn" title="Agregar a favoritos">❤</button>
                        <button class="product-action-btn add-to-cart-btn" title="Agregar al carrito">🛒</button>
                        <button class="product-action-btn view-btn product-link" 
                           data-name="${product.name}" 
                           data-price="${product.price}" 
                           data-img="${product.image_url}" 
                           data-type="${product.type}"
                           data-size-config='${JSON.stringify(sizeConfig).replace(/'/g, "&apos;")}'
                           data-packaging-config='${JSON.stringify(packagingConfig).replace(/'/g, "&apos;")}'
                           title="Ver detalles">👁</button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.setupProductInteractions();
    }
    
    setupProductInteractions() {
        // ... (el mismo código que antes)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.productsLoader = new ProductsLoader();
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productsLoader = new ProductsLoader();
});