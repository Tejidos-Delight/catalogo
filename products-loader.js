// products-loader.js - VERSIÓN DEFINITIVA (sin parpadeo)
class ProductsLoader {
    constructor() {
        this.products = [];
        this.hasRendered = false;
        this.init();
    }
    
    async init() {
        // Prevenir múltiples inicializaciones
        if (window.productsLoaderInitialized) {
            return;
        }
        window.productsLoaderInitialized = true;
        
        console.log('🔄 ProductsLoader iniciado');
        await this.loadProducts();
    }
    
    async loadProducts() {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) {
            console.log('❌ No se encontró .product-grid');
            return;
        }
        
        // Guardar el contenido original para comparación
        const originalContent = productGrid.innerHTML;
        
        try {
            // CONFIGURACIÓN REAL
            const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
            
            console.log('📥 Cargando productos desde Supabase...');
            
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
                
                this.renderProducts();
                
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error cargando desde Supabase:', error);
            await this.loadFromLocalStorage();
        }
    }
    
    async loadFromLocalStorage() {
        const savedProducts = localStorage.getItem('tejidosDelightProducts');
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
            console.log('📥 Productos cargados desde localStorage:', this.products.length);
            this.renderProducts();
        } else {
            console.log('⚠️ No hay productos disponibles');
            this.showNoProducts();
        }
    }
    
    renderProducts() {
        if (this.hasRendered) {
            console.log('⚠️ Ya se renderizaron los productos, evitando duplicado');
            return;
        }
        
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        
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
        
        if (!currentCategory) {
            console.log('❌ Categoría no encontrada para:', fileName);
            return;
        }
        
        const categoryProducts = this.products
            .filter(p => p.category === currentCategory)
            .sort((a, b) => (a.order || 999) - (b.order || 999));
        
        console.log(`📊 Mostrando ${categoryProducts.length} productos para categoría: ${currentCategory}`);
        
        if (categoryProducts.length === 0) {
            this.showNoProducts();
            return;
        }
        
        // Renderizar una sola vez
        this.hasRendered = true;
        
        // Usar microtask para renderizado suave
        Promise.resolve().then(() => {
            productGrid.innerHTML = categoryProducts.map(product => {
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
    
    showNoProducts() {
        const productGrid = document.querySelector('.product-grid');
        if (productGrid && !this.hasRendered) {
            productGrid.innerHTML = `
                <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #666;">
                    <p>No hay productos disponibles en esta categoría.</p>
                    <a href="admin.html" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background-color: #d9534f; color: white; text-decoration: none; border-radius: 5px;">Agregar productos</a>
                </div>
            `;
            this.hasRendered = true;
        }
    }
    
    setupProductInteractions() {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            // Botones de vista
            document.querySelectorAll('.product-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.openModal) {
                        window.openModal.call(link, e);
                    }
                });
            });
            
            // Botones de favoritos
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const productCard = e.target.closest('.product-card');
                    if (!productCard) return;
                    
                    const productName = productCard.querySelector('h3')?.textContent;
                    const productPrice = productCard.querySelector('.precio')?.textContent;
                    const productImg = productCard.querySelector('img')?.src;
                    
                    if (productName && window.toggleFavorite) {
                        window.toggleFavorite(productName, productPrice, productImg, btn);
                    }
                });
            });
            
            // Botones de carrito
            document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const productCard = e.target.closest('.product-card');
                    if (!productCard) return;
                    
                    const viewBtn = productCard.querySelector('.view-btn');
                    if (viewBtn) {
                        viewBtn.click();
                    }
                });
            });
            
        }, 50);
    }
}

// INICIALIZACIÓN ÚNICA Y CONTROLADA
function initializeProductsLoader() {
    // Verificar si ya se inicializó
    if (window.productsLoaderInstance) {
        console.log('⚠️ ProductsLoader ya estaba inicializado');
        return window.productsLoaderInstance;
    }
    
    // Verificar si estamos en una página de categoría
    const path = window.location.pathname;
    const fileName = path.split('/').pop().replace('.html', '');
    const validCategories = ['amigurumis', 'flores', 'llaveros', 'pulseras', 'colgantes', 'combos', 'bolsas', 'macetas'];
    
    if (!validCategories.includes(fileName) && fileName !== 'index') {
        console.log('ℹ️ No es página de productos, no inicializando ProductsLoader');
        return null;
    }
    
    console.log('🚀 Inicializando ProductsLoader para:', fileName);
    window.productsLoaderInstance = new ProductsLoader();
    return window.productsLoaderInstance;
}

// Inicializar cuando el DOM esté listo - SOLO UNA VEZ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductsLoader);
} else {
    initializeProductsLoader();
}