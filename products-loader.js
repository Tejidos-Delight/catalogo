// products-loader.js - VERSIÓN CON EVENTO PERSONALIZADO
console.log('🔧 products-loader.js cargado');

async function loadAndRenderProducts() {
    console.log('🎯 Iniciando carga directa de productos...');

    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) {
        console.error('❌ No se encuentra .product-grid');
        return;
    }

    // Mostrar esqueleto de carga (mismo tamaño que los productos reales)
    const skeletonCount = 12; // puedes ajustar según la cantidad esperada
    const skeletonCards = Array(skeletonCount).fill().map(() => `
        <div class="product-card skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-price"></div>
            <div class="skeleton-actions">
                <div class="skeleton-btn"></div>
                <div class="skeleton-btn"></div>
                <div class="skeleton-btn"></div>
            </div>
        </div>
    `).join('');
    productGrid.innerHTML = skeletonCards;

    // Agregar estilos críticos si no existen
    if (!document.querySelector('#critical-styles')) {
        const criticalStyles = `
            <style id="critical-styles">
                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                    padding: 20px 0;
                }
                .product-card {
                    background: white;
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    text-align: center;
                    transition: transform 0.3s ease;
                }
                .product-card:hover {
                    transform: translateY(-5px);
                }
                .product-card img {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .product-card h3 {
                    font-family: 'Josefin Sans', sans-serif;
                    font-size: 1em;
                    margin: 10px 0 5px;
                    color: #333;
                }
                .precio {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: #d9534f;
                    margin: 5px 0;
                }
                .product-actions {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                }
                .product-action-btn {
                    background: none;
                    border: none;
                    font-size: 1.1em;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .product-action-btn:hover {
                    background: rgba(217, 83, 79, 0.1);
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', criticalStyles);
    }

    try {
        const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const products = await response.json();

        // Determinar categoría actual basada en el nombre del archivo HTML
        const path = window.location.pathname;
        const fileName = path.split('/').pop().replace('.html', '');
        
        // MAPA DE CATEGORÍAS (incluye "adicionales")
        const categoryMap = {
            'amigurumis': 'amigurumis',
            'flores': 'flores',
            'llaveros': 'llaveros',
            'pulseras': 'pulseras',
            'colgantes': 'colgantes',
            'combos': 'combos',
            'bolsas': 'bolsas',
            'macetas': 'macetas',
            'adicionales': 'adicionales'
        };
        
        const currentCategory = categoryMap[fileName];
        
        if (!currentCategory) {
            productGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#d9534f;">⚠️ Categoría no válida. Verifica el nombre del archivo.</div>';
            productGrid.classList.add('loaded');
            return;
        }

        // Filtrar y ordenar productos de la categoría actual
        const categoryProducts = products
            .filter(p => p.category === currentCategory)
            .sort((a, b) => (a.product_order || 999) - (b.product_order || 999));

        if (categoryProducts.length === 0) {
            productGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">✨ No hay productos en esta categoría todavía. ¡Vuelve pronto!</div>';
        } else {
            // Guardar productos en variable global para acceso rápido
            window.currentProducts = {};
            categoryProducts.forEach(product => {
                window.currentProducts[product.id] = product;
            });

            // Renderizar productos con data-id
            productGrid.innerHTML = categoryProducts.map(product => `
                <div class="product-card" data-category="${product.type === 'standard' ? 'estandar' : 'personalizados'}">
                    <img src="${product.image_url}" alt="${product.name}" 
                        onerror="this.onerror=null; this.src='imagenes/personalizado.jpg'">
                    <h3>${product.name}</h3>
                    <p class="precio">${product.price}</p>
                    <div class="product-actions">
                        <button class="product-action-btn favorite-btn" title="Favorito">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <use href="#icon-heart"></use>
                            </svg>
                        </button>
                        <button class="product-action-btn add-to-cart-btn" title="Carrito">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <use href="#icon-cart"></use>
                            </svg>
                        </button>
                        <button class="product-action-btn view-btn product-link" 
                            data-id="${product.id}"
                            data-name="${product.name}" 
                            data-price="${product.price}" 
                            data-img="${product.image_url}" 
                            data-type="${product.type}"
                            data-category="${product.category}"
                            data-size-config='${JSON.stringify(product.size_config || {})}'
                            data-packaging-config='${JSON.stringify(product.packaging_config || {})}'
                            title="Ver detalles">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <use href="#icon-eye"></use>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');

            console.log('🎉 PRODUCTOS RENDERIZADOS CON ESTILOS');
            
            // Cargar favoritos después de renderizar
            setTimeout(() => {
                if (window.loadFavoritesFromStorage) {
                    window.loadFavoritesFromStorage();
                }
            }, 100);
        }

        productGrid.classList.add('loaded');

        // DISPARAR EVENTO PERSONALIZADO PARA INDICAR QUE LOS PRODUCTOS ESTÁN LISTOS
        const productsLoadedEvent = new CustomEvent('productsLoaded', { detail: { products: categoryProducts } });
        window.dispatchEvent(productsLoadedEvent);
        console.log('📢 Evento "productsLoaded" disparado');

    } catch (error) {
        console.error('Error cargando productos:', error);
        productGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">❌ Error al cargar los productos. Intenta de nuevo.</div>';
        productGrid.classList.add('loaded');
        // También emitimos evento aunque haya error (para no bloquear)
        window.dispatchEvent(new CustomEvent('productsLoaded', { detail: { error: true } }));
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', loadAndRenderProducts);
window.loadAndRenderProducts = loadAndRenderProducts;

// Función auxiliar para recargar favoritos después de renderizar
function triggerFavoritesReload() {
    if (window.loadFavoritesFromStorage) {
        window.loadFavoritesFromStorage();
    } else {
        setTimeout(triggerFavoritesReload, 100);
    }
}

window.updateProductFavorites = function() {
    if (window.loadFavoritesFromStorage) {
        window.loadFavoritesFromStorage();
    }
};

window.loadAndRenderProducts = async function() {
    await loadAndRenderProducts();
    setTimeout(triggerFavoritesReload, 200);
};