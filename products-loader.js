// products-loader.js - VERSIÓN CON ESTILOS CRÍTICOS
console.log('🔧 products-loader.js cargado');

async function loadAndRenderProducts() {
    console.log('🎯 Iniciando carga directa de productos...');
    
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) {
        console.error('❌ No se encuentra .product-grid');
        return;
    }

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

        // Determinar categoría actual
        const path = window.location.pathname;
        const fileName = path.split('/').pop().replace('.html', '');
        
        const categoryMap = {
            'amigurumis': 'amigurumis', 'flores': 'flores', 'llaveros': 'llaveros', 
            'pulseras': 'pulseras', 'colgantes': 'colgantes', 'combos': 'combos', 
            'bolsas': 'bolsas', 'macetas': 'macetas'
        };
        
        const currentCategory = categoryMap[fileName];
        if (!currentCategory) return;

        // Filtrar y ordenar productos
        const categoryProducts = products
            .filter(p => p.category === currentCategory)
            .sort((a, b) => (a.product_order || 999) - (b.product_order || 999));

        if (categoryProducts.length === 0) {
            productGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">No hay productos</div>';
            return;
        }

        // RENDERIZAR con estilos adecuados
        productGrid.innerHTML = categoryProducts.map(product => `
            <div class="product-card" data-category="${product.type === 'standard' ? 'estandar' : 'personalizados'}">
                <img src="${product.image_url}" alt="${product.name}" 
                     onerror="this.onerror=null; this.src='imagenes/personalizado.jpg'">
                <h3>${product.name}</h3>
                <p class="precio">${product.price}</p>
                <div class="product-actions">
                    <button class="product-action-btn favorite-btn" title="Favorito">❤</button>
                    <button class="product-action-btn add-to-cart-btn" title="Carrito">🛒</button>
                    <button class="product-action-btn view-btn product-link" 
                       data-name="${product.name}" 
                       data-price="${product.price}" 
                       data-img="${product.image_url}" 
                       data-type="${product.type}"
                       data-size-config='${JSON.stringify(product.size_config || {})}'
                       data-packaging-config='${JSON.stringify(product.packaging_config || {})}'
                       title="Ver detalles">👁</button>
                </div>
            </div>
        `).join('');

        console.log('🎉 PRODUCTOS RENDERIZADOS CON ESTILOS');

    } catch (error) {
        console.error('Error:', error);
        productGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Error cargando productos</div>';
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', loadAndRenderProducts);
setTimeout(loadAndRenderProducts, 1000);
window.loadAndRenderProducts = loadAndRenderProducts;