// products-loader.js - VERSIÓN DIRECTA Y FUNCIONAL
console.log('🔧 products-loader.js cargado');

async function loadAndRenderProducts() {
    console.log('🎯 Iniciando carga directa de productos...');
    
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) {
        console.error('❌ No se encuentra .product-grid');
        return;
    }

    // Mostrar loading
    productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px;">Cargando productos...</div>';

    try {
        const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
        
        console.log('📡 Haciendo fetch a Supabase...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Response status:', response.status, response.ok);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const products = await response.json();
        console.log('✅ Productos obtenidos:', products);

        // Determinar categoría actual
        const path = window.location.pathname;
        const fileName = path.split('/').pop().replace('.html', '');
        console.log('📄 Página actual:', fileName);
        
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
        
        const currentCategory = categoryMap[fileName];
        console.log('🎯 Categoría filtrada:', currentCategory);

        if (!currentCategory) {
            productGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Error: No es página de categoría</div>';
            return;
        }

        // Filtrar productos por categoría
        const categoryProducts = products
            .filter(p => p.category === currentCategory)
            .sort((a, b) => (a.product_order || 999) - (b.product_order || 999));

        console.log(`📦 Productos filtrados para ${currentCategory}:`, categoryProducts);

        if (categoryProducts.length === 0) {
            productGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">
                    <p>No hay productos en esta categoría.</p>
                    <a href="admin.html" style="color:#d9534f;">Agregar productos</a>
                </div>
            `;
            return;
        }

        // RENDERIZAR DIRECTAMENTE
        productGrid.innerHTML = categoryProducts.map(product => `
            <div class="product-card" data-category="${product.type === 'standard' ? 'estandar' : 'personalizados'}">
                <img src="${product.image_url}" alt="${product.name}" 
                     onerror="this.src='imagenes/personalizado.jpg'" 
                     style="width:100%; height:150px; object-fit:cover; border-radius:8px;">
                <h3>${product.name}</h3>
                <p class="precio">${product.price}</p>
                <div class="product-actions">
                    <button class="product-action-btn favorite-btn">❤</button>
                    <button class="product-action-btn add-to-cart-btn">🛒</button>
                    <button class="product-action-btn view-btn product-link" 
                       data-name="${product.name}" 
                       data-price="${product.price}" 
                       data-img="${product.image_url}" 
                       data-type="${product.type}"
                       data-size-config='${JSON.stringify(product.size_config || {type: 'customizable'})}'
                       data-packaging-config='${JSON.stringify(product.packaging_config || {type: 'customizable'})}'
                       title="Ver detalles">👁</button>
                </div>
            </div>
        `).join('');

        console.log('🎉 PRODUCTOS RENDERIZADOS EXITOSAMENTE');

    } catch (error) {
        console.error('💥 Error crítico:', error);
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:red;">
                    <p>Error cargando productos: ${error.message}</p>
                    <button onclick="loadAndRenderProducts()" style="padding:10px 20px; background:#d9534f; color:white; border:none; border-radius:5px; cursor:pointer;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Inicialización inmediata
console.log('🚀 Ejecutando carga automática...');
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, iniciando render...');
    setTimeout(loadAndRenderProducts, 100);
});

// También ejecutar después de un tiempo por si el DOM ya está listo
setTimeout(() => {
    console.log('⏰ Timeout de seguridad ejecutándose...');
    loadAndRenderProducts();
}, 1000);

// Hacerla global para poder llamarla manualmente
window.loadAndRenderProducts = loadAndRenderProducts;