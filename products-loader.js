// products-loader.js - Cargar productos desde JSON o localStorage
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
        // Primero intentar cargar desde localStorage (para mantener cambios del admin)
        const savedProducts = localStorage.getItem('tejidosDelightProducts');
        
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
            this.updatePageContent();
        } else {
            // Si no hay en localStorage, cargar desde el archivo JSON
            await this.loadFromJSON();
        }
    }
    
    async loadFromJSON() {
        try {
            const response = await fetch('products.json');
            if (response.ok) {
                const data = await response.json();
                this.products = data.products;
                
                // Guardar en localStorage para futuras visitas
                localStorage.setItem('tejidosDelightProducts', JSON.stringify(this.products));
                
                this.updatePageContent();
            } else {
                throw new Error('No se pudo cargar products.json');
            }
        } catch (error) {
            console.error('Error cargando products.json:', error);
            // Cargar productos de respaldo mínimos
            await this.loadBackupProducts();
        }
    }
    
    async loadBackupProducts() {
        // Productos mínimos de respaldo
        this.products = [
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
        
        localStorage.setItem('tejidosDelightProducts', JSON.stringify(this.products));
        this.updatePageContent();
    }
    
    updatePageContent() {
        // Actualizar páginas de categoría
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
        
        // Determinar categoría actual
        const path = window.location.pathname;
        const fileName = path.split('/').pop().replace('.html', '');
        const currentCategory = categoryMap[fileName];
        
        if (!currentCategory) return;
        
        const categoryProducts = this.products
            .filter(p => p.category === currentCategory)
            .sort((a, b) => (a.order || 999) - (b.order || 999));
        
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
            // Asegurar que las configuraciones tengan valores por defecto
            const sizeConfig = product.sizeConfig || {
                type: 'customizable',
                defaultValue: '10cm',
                options: ['10cm', '15cm', '20cm', 'Personalizado']
            };
            
            const packagingConfig = product.packagingConfig || {
                type: 'customizable', 
                defaultValue: 'Caja con visor',
                options: ['Caja con visor', 'Bolsa de papel', 'Funda transparente']
            };
            
            return `
                <div class="product-card" data-category="${product.type === 'standard' ? 'estandar' : 'personalizados'}">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='imagenes/personalizado.jpg'">
                    <h3>${product.name}</h3>
                    <p class="precio">${product.price}</p>
                    <div class="product-actions">
                        <button class="product-action-btn favorite-btn" title="Agregar a favoritos">❤</button>
                        <button class="product-action-btn add-to-cart-btn" title="Agregar al carrito">🛒</button>
                        <button class="product-action-btn view-btn product-link" 
                        data-name="${product.name}" 
                        data-price="${product.price}" 
                        data-img="${product.image}" 
                        data-type="${product.type}"
                        data-size-config='${JSON.stringify(sizeConfig).replace(/'/g, "&apos;")}'
                        data-packaging-config='${JSON.stringify(packagingConfig).replace(/'/g, "&apos;")}'
                        title="Ver detalles">👁</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Reconfigurar event listeners
        this.setupProductInteractions();
    }
    
    setupProductInteractions() {
        // Configurar event listeners para los nuevos productos
        const productLinks = document.querySelectorAll('.product-link');
        productLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.openModal) {
                    window.openModal.call(this, e);
                }
            });
        });
        
        // Botones de favoritos
        const favoriteBtns = document.querySelectorAll('.favorite-btn');
        favoriteBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.toggleFavorite) {
                    const productCard = this.closest('.product-card');
                    const productName = productCard.querySelector('h3').textContent;
                    const productPrice = productCard.querySelector('.precio').textContent;
                    const productImg = productCard.querySelector('img').src;
                    
                    window.toggleFavorite(productName, productPrice, productImg, this);
                }
            });
        });
        
        // Botones de agregar al carrito
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productCard = this.closest('.product-card');
                const viewBtn = productCard.querySelector('.view-btn');
                
                if (viewBtn) {
                    viewBtn.click();
                }
            });
        });
    }
    
    setupEventListeners() {
        // Escuchar cambios en localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'tejidosDelightProducts') {
                this.loadProducts();
            }
        });
        
        // Escuchar mensajes de actualización desde el admin panel
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'PRODUCTS_UPDATED') {
                this.products = e.data.products;
                this.updatePageContent();
            }
        });
        
        // Recargar cuando la página gane foco (para sincronizar cambios del admin)
        window.addEventListener('focus', () => {
            this.loadProducts();
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productsLoader = new ProductsLoader();
});

// También escuchar actualizaciones de sessionStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'productsUpdated') {
        window.location.reload();
    }
});