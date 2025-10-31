// products-loader.js - VERSIÓN CORREGIDA (sin parpadeo)
class ProductsLoader {
    constructor() {
        this.products = [];
        this.isLoading = true;
        this.init();
    }
    
    async init() {
        // Mostrar loader inmediatamente
        this.showLoadingState();
        
        await this.loadProducts();
        this.setupEventListeners();
        
        // Ocultar loader cuando termine
        this.hideLoadingState();
    }
    
    showLoadingState() {
        const productGrid = document.querySelector('.product-grid');
        if (productGrid && this.isLoading) {
            productGrid.innerHTML = `
                <div class="loading-products">
                    <div class="loading-spinner"></div>
                    <p>Cargando productos...</p>
                </div>
            `;
        }
    }
    
    hideLoadingState() {
        this.isLoading = false;
    }
    
    async loadProducts() {
        try {
            // CONFIGURACIÓN REAL
            const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
            
            console.log('🔄 Cargando productos desde Supabase...');
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Productos cargados desde Supabase:', data.length);
                
                // Convertir formato Supabase a formato interno
                this.products = data.map(item => ({
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
            await this.loadFromLocalStorage();
        }
        
        this.updatePageContent();
    }
    
    async loadFromLocalStorage() {
        const savedProducts = localStorage.getItem('tejidosDelightProducts');
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
            console.log('📥 Productos cargados desde localStorage:', this.products.length);
        } else {
            console.log('⚠️ No hay productos en localStorage');
            this.products = [];
        }
    }
    
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
            .sort((a, b) => (a.order || 999) - (b.order || 999));
        
        this.renderProducts(categoryProducts);
    }
    
    renderProducts(products) {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        
        if (products.length === 0) {
            productGrid.innerHTML = `
                <div class="no-products">
                    <p>No hay productos disponibles en esta categoría.</p>
                    <a href="admin.html" class="admin-link">¿Quieres agregar productos?</a>
                </div>
            `;
            return;
        }
        
        // Usar requestAnimationFrame para renderizado suave
        requestAnimationFrame(() => {
            productGrid.innerHTML = products.map(product => {
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
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='imagenes/personalizado.jpg'" loading="lazy">
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
            
            this.setupProductInteractions();
        });
    }
    
    setupProductInteractions() {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            document.querySelectorAll('.product-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.openModal) {
                        window.openModal.call(link, e);
                    }
                });
            });
            
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const productCard = e.target.closest('.product-card');
                    const productName = productCard.querySelector('h3').textContent;
                    const productPrice = productCard.querySelector('.precio').textContent;
                    const productImg = productCard.querySelector('img').src;
                    
                    if (window.toggleFavorite) {
                        window.toggleFavorite(productName, productPrice, productImg, btn);
                    }
                });
            });
        }, 100);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productsLoader = new ProductsLoader();
});