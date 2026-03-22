// =================================================================
// ARCHIVO main.js (VERSIÓN FINAL - PROMOCIONES BANNER + MODAL)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- Selectores DOM ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalImg = document.getElementById('modal-img');
    const modalName = document.getElementById('modal-name');
    const modalPrice = document.getElementById('modal-price');
    
    const formSizeStandard = document.getElementById('form-size-standard');
    const formSizeCustom = document.getElementById('form-size-custom');
    const formPackaging = document.getElementById('form-packaging');
    
    const instructionsStandard = document.getElementById('instructions-standard');
    const instructionsCustom = document.getElementById('instructions-custom');

    const modalSizeSelect = document.getElementById('modal-size-select');
    const modalSizeCustomContainer = document.getElementById('modal-size-custom-container');
    const modalSizeCustomText = document.getElementById('modal-size-custom-text');
    const modalSizeCustomInput = document.getElementById('modal-size-custom');
    
    const modalPackagingSelect = document.getElementById('modal-packaging-select');
    const waButton = document.getElementById('modal-wa-btn');
    const igButton = document.getElementById('modal-ig-btn');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart');
    const shareButton = document.getElementById('modal-share-btn');

    const quantityInput = document.getElementById('modal-quantity');
    const quantityDecrease = document.getElementById('quantity-decrease');
    const quantityIncrease = document.getElementById('quantity-increase');

    const productLinks = document.querySelectorAll('.product-link');
    
    // --- Variables de Estado ---
    let currentProductName = "";
    let currentProductType = "standard";
    let currentProductCategory = "";
    let currentProductId = null;
    let currentQuantity = 1;
    let isEditingCartItem = false;
    let editingCartItemName = "";
    let currentSizeConfig = {};
    let currentPackagingConfig = {};
    
    let cart = [];
    let favorites = [];
    let selectedPaymentMethod = '';
    
    // --- Elementos Globales UI ---
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.nav-btn');
    const cartCounter = document.querySelector('.cart-counter');
    const cartContainer = document.querySelector('.cart-container');
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueShoppingBtn = document.getElementById('continue-shopping');
    const favoritesMessage = document.getElementById('favorites-message');

    // Comportamiento de la modal: 'session', 'daily' o 'always'
    const PROMO_BEHAVIOR = 'session'; // Cambia aquí si quieres otro comportamiento

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        // Pequeño retraso para que la animación funcione
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ============================================================
    // PROMOCIONES (banner + modal)
    // ============================================================
    async function fetchActivePromotions() {
        const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/promotions?select=*&active=eq.true`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Error fetching promotions');
            return await response.json();
        } catch (error) {
            console.error('Error cargando promociones:', error);
            return [];
        }
    }

    function showPromotionBanner(promo) {
        if (!promo.show_banner) return;
        // Siempre muestra el banner, no se puede cerrar
        const bannerHTML = `
            <div id="promo-banner-${promo.id}" class="promo-banner" style="background-color: #d9534f; color: white; text-align: center; padding: 10px; position: relative; z-index: 100;">
                <span>${promo.banner_text}</span>
            </div>
        `;
        const header = document.querySelector('header');
        if (header && !document.getElementById(`promo-banner-${promo.id}`)) {
            header.insertAdjacentHTML('afterend', bannerHTML);
        }
    }

    function showPromotionModal(promo) {
        if (!promo.show_modal || !promo.image_url) return;

        const storage = PROMO_BEHAVIOR === 'daily' ? localStorage : (PROMO_BEHAVIOR === 'session' ? sessionStorage : null);
        const key = `promoModal_${promo.id}`;

        // Verificar si ya se mostró según el comportamiento elegido
        if (storage && storage.getItem(key)) {
            return; // No mostrar de nuevo en esta sesión/día
        }

        const modalHTML = `
            <div id="promo-modal-overlay-${promo.id}" class="promo-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="position: relative; max-width: 90%; max-height: 90%;">
                    <img src="${promo.image_url}" alt="Promoción" style="max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
                    <button class="close-promo-modal" data-id="${promo.id}" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 1.2em; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">&times;</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const overlayModal = document.getElementById(`promo-modal-overlay-${promo.id}`);
        const closeModalBtn = overlayModal.querySelector('.close-promo-modal');
        const closeModal = () => {
            overlayModal.remove();
            // Guardar según el comportamiento elegido
            if (storage) {
                if (PROMO_BEHAVIOR === 'daily') {
                    storage.setItem(key, Date.now()); // Guarda timestamp para 24h
                } else {
                    storage.setItem(key, 'shown');    // Guarda marca de sesión
                }
            }
        };
        closeModalBtn.addEventListener('click', closeModal);
        overlayModal.addEventListener('click', (e) => {
            if (e.target === overlayModal) closeModal();
        });
    }

    (async () => {
        const promotions = await fetchActivePromotions();
        promotions.forEach(promo => {
            showPromotionBanner(promo);
        });

        // Solo mostrar la modal si NO hay un hash de producto
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#product-')) {
            promotions.forEach(promo => {
                showPromotionModal(promo);
            });
        }
    })();

    // ============================================================
    // CARRITO Y FUNCIONES COMUNES
    // ============================================================
    
    function generateOrderNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${year}${month}${day}-${random}`;
    }

    // Función para guardar orden en Supabase
    async function saveOrderToSupabase(orderData) {
        const SUPABASE_URL = 'https://egjlhlkholudjpjesunj.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnamxobGtob2x1ZGpwamVzdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzA5NDAsImV4cCI6MjA3NzUwNjk0MH0.KSIKD0QdwxO2GTXl60SiXz32y-AQlEi-CIsLBRsU_wg';
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) throw new Error('Error guardando orden');
            console.log('Orden guardada:', orderData.order_number);
            return true;
        } catch (error) {
            console.error('Error al guardar orden:', error);
            return false;
        }
    }

    function createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    async function updateCartDisplay() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Tu carrito está vacío</p>';
            if (cartTotalElement) cartTotalElement.textContent = '$0.00';
            const discountLine = document.querySelector('.cart-discount');
            if (discountLine) discountLine.remove();
            const progressContainer = document.getElementById('progress-container');
            if (progressContainer) progressContainer.style.display = 'none';
            return;
        }
        
        let subtotal = 0;
        cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.dataset.identifier = item.identifier;
            const priceVal = parseFloat(item.price.replace('$', '')) || 0;
            subtotal += priceVal * item.quantity;
            let desc = '';
            if (item.size && item.size !== "N/A") desc += `<div class="cart-item-details">Tamaño: ${item.size}</div>`;
            desc += `<div class="cart-item-details">Empaque: ${item.packaging}</div>`;
            el.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    ${desc}
                    <div class="cart-item-price">${item.price} c/u</div>
                    <div class="cart-item-controls">
                        <button class="cart-quantity-btn">-</button>
                        <span class="cart-quantity-input">${item.quantity}</span>
                        <button class="cart-quantity-btn">+</button>
                        <button class="cart-item-edit" title="Editar">✏️</button>
                    </div>
                </div>
                <button class="cart-item-remove" title="Eliminar">&times;</button>
            `;
            cartItemsContainer.appendChild(el);
        });
        
        const promotions = await fetchActivePromotions();
        let discount = 0;
        if (promotions.length > 0) {
            const promo = promotions[0]; // Aplicamos el descuento de la primera promoción activa (puedes elegir otra lógica)
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQuantity >= promo.min_quantity) {
                if (promo.type === 'percentage') discount = subtotal * (promo.value / 100);
                else if (promo.type === 'fixed') discount = promo.value;
            }
        }
        const total = subtotal - discount;
        // Dentro de updateCartDisplay, después de obtener promotions y calcular discount
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            if (promotions.length > 0) {
                const promo = promotions[0];
                const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
                const needed = promo.min_quantity - totalQuantity;
                const percent = Math.min(100, (totalQuantity / promo.min_quantity) * 100);
                const itemsNeededSpan = document.getElementById('items-needed');
                const progressBar = document.getElementById('progress-bar');
                if (totalQuantity >= promo.min_quantity) {
                    // Ya alcanzó el descuento
                    progressContainer.style.display = 'none';
                } else {
                    progressContainer.style.display = 'block';
                    itemsNeededSpan.textContent = needed;
                    progressBar.style.width = `${percent}%`;
                }
            } else {
                progressContainer.style.display = 'none';
            }
        }
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
        
        let discountLine = document.querySelector('.cart-discount');
        if (discount > 0) {
            if (!discountLine) {
                const cartFooter = document.querySelector('.cart-footer');
                if (cartFooter) {
                    const discountHTML = `<div class="cart-discount" style="color:green; margin-bottom:5px;">Descuento: -$${discount.toFixed(2)}</div>`;
                    cartFooter.insertBefore(createElementFromHTML(discountHTML), cartFooter.firstChild);
                }
            } else {
                discountLine.textContent = `Descuento: -$${discount.toFixed(2)}`;
            }
        } else {
            if (discountLine) discountLine.remove();
        }
    }

    function updateCartCounter() {
        const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
        if (cartCounter) cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems ? 'flex' : 'none';
    }

    function saveCartToStorage() {
        localStorage.setItem('tejidosDelightCart', JSON.stringify(cart));
    }

    function loadCartFromStorage() {
        try {
            cart = JSON.parse(localStorage.getItem('tejidosDelightCart') || '[]');
            cart.forEach(i => { if (!i.identifier) i.identifier = i.name + (i.size||'') + (i.packaging||''); });
        } catch(e) { cart = []; }
    }

    // ============================================================
    // FAVORITOS
    // ============================================================
    function saveFavoritesToStorage() {
        localStorage.setItem('tejidosDelightFavorites', JSON.stringify(favorites));
    }

    function loadFavoritesFromStorage() {
        favorites = JSON.parse(localStorage.getItem('tejidosDelightFavorites')||'[]');
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productName = card.querySelector('h3')?.textContent;
            const favoriteBtn = card.querySelector('.favorite-btn');
            if (!productName || !favoriteBtn) return;
            const isFavorite = favorites.some(fav => fav.name === productName);
            if (isFavorite) {
                favoriteBtn.classList.add('active');
                card.classList.add('favorited');
            } else {
                favoriteBtn.classList.remove('active');
                card.classList.remove('favorited');
            }
        });
    }

    function toggleFavorite(name, price, img, btn) {
        const idx = favorites.findIndex(i => i.name === name);
        const productCard = btn.closest('.product-card');
        if (idx !== -1) {
            favorites.splice(idx, 1);
            btn.classList.remove('active');
            productCard.classList.remove('favorited');
        } else {
            favorites.push({ name, price, img });
            btn.classList.add('active');
            productCard.classList.add('favorited');
        }
        saveFavoritesToStorage();
        const activeFilter = document.querySelector('.nav-btn.active');
        if (activeFilter && activeFilter.dataset.category === 'favorites') {
            filterByCategory({ target: activeFilter });
        }
    }

    // ============================================================
    // MODAL (apertura, cierre, validación)
    // ============================================================
    function openModal(event) {
        event.preventDefault();
        const link = this;
        currentProductName = link.dataset.name;
        currentProductType = link.dataset.type || 'standard';
        currentProductCategory = link.dataset.category || 'productos';
        currentProductId = link.dataset.id || null;
        currentQuantity = 1;
        modalImg.src = link.dataset.img;
        modalName.textContent = currentProductName;
        modalPrice.textContent = link.dataset.price;
        try { currentSizeConfig = JSON.parse(link.dataset.sizeConfig || '{}'); } catch (e) { currentSizeConfig = {}; }
        try { currentPackagingConfig = JSON.parse(link.dataset.packagingConfig || '{}'); } catch (e) { currentPackagingConfig = {}; }
        
        if (formSizeStandard && modalSizeSelect) {
            modalSizeCustomContainer.style.display = 'none';
            modalSizeCustomText.value = '';
            if (currentSizeConfig.type === 'none') {
                formSizeStandard.style.display = 'none';
                modalSizeSelect.innerHTML = '<option value="none" selected>N/A</option>';
                modalSizeSelect.value = 'none';
            } else {
                formSizeStandard.style.display = 'block';
                modalSizeSelect.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
                if (currentSizeConfig.type === 'fixed') {
                    const opt = document.createElement('option');
                    opt.value = currentSizeConfig.value || "Único";
                    opt.textContent = currentSizeConfig.value || "Único";
                    modalSizeSelect.appendChild(opt);
                    modalSizeSelect.value = opt.value;
                } else {
                    if (currentSizeConfig.options) currentSizeConfig.options.forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val;
                        opt.textContent = val;
                        modalSizeSelect.appendChild(opt);
                    });
                    if (currentProductType === 'custom') {
                        const opt = document.createElement('option');
                        opt.value = "custom";
                        opt.textContent = "Otro";
                        modalSizeSelect.appendChild(opt);
                    }
                }
                if (currentSizeConfig.type !== 'fixed' && currentSizeConfig.defaultValue) {
                    for(let opt of modalSizeSelect.options) if(opt.value === currentSizeConfig.defaultValue) modalSizeSelect.value = opt.value;
                }
            }
            modalSizeSelect.onchange = () => {
                modalSizeCustomContainer.style.display = (modalSizeSelect.value === 'custom') ? 'block' : 'none';
                updateAddToCartButton();
            };
        }
        if (formSizeCustom) formSizeCustom.style.display = 'none';
        if (modalPackagingSelect) {
            modalPackagingSelect.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
            if (currentPackagingConfig.type === 'fixed') {
                modalPackagingSelect.innerHTML = `<option value="${currentPackagingConfig.value}" selected>${currentPackagingConfig.value}</option>`;
                modalPackagingSelect.disabled = true;
            } else {
                modalPackagingSelect.disabled = false;
                if (currentPackagingConfig.options) currentPackagingConfig.options.forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    if (val === currentPackagingConfig.defaultValue) opt.selected = true;
                    modalPackagingSelect.appendChild(opt);
                });
            }
        }
        
        const detailsElements = document.querySelectorAll('.instructions-toggle');
        const isMobile = window.innerWidth < 900;
        if (currentProductType === 'custom') {
            if (instructionsStandard) instructionsStandard.style.display = 'none';
            if (instructionsCustom) instructionsCustom.style.display = 'block';
        } else {
            if (instructionsStandard) instructionsStandard.style.display = 'block';
            if (instructionsCustom) instructionsCustom.style.display = 'none';
        }
        detailsElements.forEach(detail => {
            if (isMobile) { detail.removeAttribute('open'); detail.style.pointerEvents = 'auto'; }
            else { detail.setAttribute('open', ''); detail.style.pointerEvents = 'none'; }
        });

        updateQuantityDisplay();
        removeErrorHighlights();
        document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
        if (formPackaging) formPackaging.style.display = 'block';
        if (!isEditingCartItem && modalAddToCartBtn) modalAddToCartBtn.textContent = '🛒 Añadir al Carrito';
        setTimeout(updateAddToCartButton, 50);
        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
        isEditingCartItem = false;
        editingCartItemName = "";
    }

    function validateForm() {
        let isValid = true;
        removeErrorHighlights();
        document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
        const sizeValue = modalSizeSelect.value;
        if (currentSizeConfig.type !== 'none') {
            if (!sizeValue || sizeValue === '') {
                isValid = false;
                document.getElementById('error-size-standard').style.display = 'block';
                modalSizeSelect.classList.add('error-highlight');
            } 
            else if (sizeValue === 'custom' && !modalSizeCustomText.value.trim()) {
                isValid = false;
                document.getElementById('error-size-custom-text').style.display = 'block';
                modalSizeCustomText.classList.add('error-highlight');
            }
        }
        if (!modalPackagingSelect.value) {
            document.getElementById('error-packaging').style.display = 'block';
            modalPackagingSelect.classList.add('error-highlight');
            isValid = false;
        }
        return isValid;
    }

    function removeErrorHighlights() {
        document.querySelectorAll('.error-highlight').forEach(e => e.classList.remove('error-highlight'));
    }

    function updateAddToCartButton() {
        if (!modalAddToCartBtn) return;
        const packaging = modalPackagingSelect ? modalPackagingSelect.value : '';
        const sizeValue = modalSizeSelect ? modalSizeSelect.value : '';
        let sizeValid = false;
        if (currentSizeConfig.type === 'none') sizeValid = true;
        else if (sizeValue === 'custom') sizeValid = modalSizeCustomText.value.trim() !== '';
        else if (sizeValue !== '') sizeValid = true;
        modalAddToCartBtn.disabled = !(sizeValid && !!packaging);
    }

    function getFormData() {
        let size = "No especificado";
        let packaging = modalPackagingSelect ? modalPackagingSelect.value : "No especificado";
        if (currentSizeConfig.type === 'none') size = "N/A";
        else {
            const val = modalSizeSelect.value;
            size = (val === 'custom') ? (modalSizeCustomText.value.trim() || "Personalizado") : val;
        }
        return { size, packaging };
    }

    function addToCartFromModal() {
        if (!validateForm()) { showFavoritesMessage('Completa los campos'); return; }
        const { size, packaging } = getFormData();
        let details = `Empaque: ${packaging}`;
        if (size !== 'N/A') details = `Tamaño: ${size}\n${details}`;
        addToCart(currentProductName, modalPrice.textContent, modalImg.src, details, currentQuantity, size, packaging);
        showToast(`${currentProductName} añadido al carrito`, 'success');
        if (modalAddToCartBtn) {
            const originalText = isEditingCartItem ? '🛒 Actualizar Producto' : '🛒 Añadir al Carrito';
            modalAddToCartBtn.innerHTML = isEditingCartItem ? '✓ Actualizado' : '✓ Añadido';
            modalAddToCartBtn.style.backgroundColor = '#25D366';
            modalAddToCartBtn.disabled = true;
            setTimeout(() => {
                modalAddToCartBtn.innerHTML = originalText;
                modalAddToCartBtn.style.backgroundColor = '';
                modalAddToCartBtn.disabled = false;
                closeModal();
            }, 1500);
        }
    }

    function addToCart(name, price, img, details = '', quantity = 1, size = '', packaging = '') {
        let optimizedImg = img;
        if (img && img.startsWith('data:image')) optimizedImg = 'imagenes/personalizado.jpg';
        const itemIdentifier = name + size + packaging;
        if (isEditingCartItem) {
            const idx = cart.findIndex(item => item.identifier === editingCartItemName);
            if (idx !== -1) {
                cart[idx] = { ...cart[idx], name, price, img: optimizedImg, details, quantity, size, packaging, identifier: itemIdentifier };
                isEditingCartItem = false;
                editingCartItemName = "";
            }
        } else {
            const idx = cart.findIndex(item => item.identifier === itemIdentifier);
            if (idx !== -1) cart[idx].quantity += quantity;
            else cart.push({
                name, price, img: optimizedImg, details, quantity, size, packaging,
                identifier: itemIdentifier,
                category: currentProductCategory
            });
        }
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        updateCheckoutButton();
        if (cartCounter) {
            cartCounter.classList.add('pulse');
            setTimeout(() => cartCounter.classList.remove('pulse'), 1000);
        }
    }

    // ============================================================
    // CHECKOUT Y MÉTODOS DE PAGO
    // ============================================================
    async function proceedToCheckout() {
        if (cart.length === 0) return alert('El carrito está vacío');
        if (!selectedPaymentMethod) return alert('Selecciona un método de contacto');

        // 1. Obtener promociones activas para calcular descuento
        const promotions = await fetchActivePromotions();
        let discountAmount = 0;
        let promoApplied = null;
        if (promotions.length > 0) {
            const promo = promotions[0];
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQuantity >= promo.min_quantity) {
                const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.replace('$', '')) || 0) * item.quantity, 0);
                if (promo.type === 'percentage') {
                    discountAmount = subtotal * (promo.value / 100);
                } else if (promo.type === 'fixed') {
                    discountAmount = promo.value;
                }
                promoApplied = promo;
            }
        }

        // 2. Calcular total final
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.replace('$', '')) || 0) * item.quantity, 0);
        const total = subtotal - discountAmount;

        // 3. Generar número de orden
        const orderNumber = generateOrderNumber();

        // 4. Construir el array de items
        const itemsData = cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            packaging: item.packaging,
            category: item.category
        }));

        // 5. Crear el objeto de la orden
        const orderData = {
            order_number: orderNumber,
            items: itemsData,
            subtotal: subtotal,
            discount_amount: discountAmount,
            total: total,
            payment_method: selectedPaymentMethod,
            status: 'pendiente',
            promo_id: promoApplied?.id || null,
            promo_text: promoApplied ? `Descuento ${promoApplied.type === 'percentage' ? `${promoApplied.value}%` : `$${promoApplied.value}`} por ${promoApplied.min_quantity}+ productos` : null
        };

        // 6. Guardar en Supabase usando la función auxiliar
        const saved = await saveOrderToSupabase(orderData);
        if (!saved) {
            alert('No se pudo registrar tu pedido. Intenta de nuevo.');
            return;
        }

        // 7. Construir el mensaje (igual que antes)
        const productsByCategory = {};
        cart.forEach(item => {
            let category = item.category || "productos";
            const categoryNames = {
                "amigurumis": "AMIGURUMIS", "flores": "FLORES", "llaveros": "LLAVEROS",
                "pulseras": "PULSERAS", "colgantes": "COLGANTES", "bolsas": "BOLSAS",
                "macetas": "MACETAS", "combos": "COMBOS", "productos": "PRODUCTOS"
            };
            const formattedCategory = categoryNames[category] || category.toUpperCase();
            if (!productsByCategory[formattedCategory]) productsByCategory[formattedCategory] = [];
            productsByCategory[formattedCategory].push(item);
        });

        let msg = `¡Hola! Me interesan los siguientes productos:\n\n`;
        const categoryOrder = ["AMIGURUMIS", "FLORES", "PULSERAS", "LLAVEROS", "COLGANTES", "BOLSAS", "MACETAS", "COMBOS", "PRODUCTOS"];
        const categoryEmojis = {
            "AMIGURUMIS": "🐻", "FLORES": "🌷", "PULSERAS": "📿", "LLAVEROS": "🔑",
            "COLGANTES": "✨", "BOLSAS": "🛍️", "MACETAS": "🏺", "COMBOS": "🎁", "PRODUCTOS": "📦"
        };
        categoryOrder.forEach(category => {
            if (productsByCategory[category] && productsByCategory[category].length > 0) {
                msg += `${categoryEmojis[category] || "📦"} *${category}:*\n`;
                productsByCategory[category].forEach(item => {
                    msg += `• ${item.name} (${item.price}) x${item.quantity}\n`;
                    if(item.size && item.size !== 'N/A') msg += `  Tamaño: ${item.size}\n`;
                    msg += `  Empaque: ${item.packaging}\n`;
                });
                msg += `\n`;
            }
        });

        msg += `💰 *Subtotal: $${subtotal.toFixed(2)}*\n`;
        if (discountAmount > 0) {
            msg += `🎉 *Descuento aplicado: -$${discountAmount.toFixed(2)}*\n`;
            if (promoApplied) msg += `   (${promoApplied.banner_text})\n`;
        }
        msg += `💵 *Total: $${total.toFixed(2)}*\n\n`;
        msg += `🆔 *Número de orden: ${orderNumber}*\n\n`;
        msg += `¡Gracias! Espero tu respuesta para coordinar la entrega.`;

        // 8. Enviar mensaje según método
        if (selectedPaymentMethod === 'whatsapp') {
            const encodedMsg = encodeURIComponent(msg);
            window.open(`https://api.whatsapp.com/send?phone=593999406153&text=${encodedMsg}`, '_blank');
        } else {
            navigator.clipboard.writeText(msg);
            alert("Mensaje copiado al portapapeles. Pégalo en el chat de Instagram.\nNúmero de orden: " + orderNumber);
            window.open('https://ig.me/m/tejidosdelight', '_blank');
        }

        // 9. Limpiar carrito
        cart = [];
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        toggleCart(true);
    }

    function selectPaymentMethod(m) {
        selectedPaymentMethod = m;
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        const sel = document.querySelector(`.payment-option[data-method="${m}"]`);
        if(sel) sel.classList.add('selected');
        updateCheckoutButton();
    }

    function updateCheckoutButton() {
        if(!checkoutBtn) return;
        const ok = cart.length > 0 && selectedPaymentMethod;
        checkoutBtn.disabled = !ok;
        checkoutBtn.classList.toggle('checkout-disabled', !ok);
        if(ok) {
            checkoutBtn.className = selectedPaymentMethod === 'whatsapp' ? 'btn-checkout btn-checkout-whatsapp' : 'btn-checkout btn-checkout-instagram';
            checkoutBtn.textContent = selectedPaymentMethod === 'whatsapp' ? 'Finalizar por WhatsApp' : 'Finalizar por Instagram';
        } else checkoutBtn.textContent = 'Finalizar Pedido';
    }

    // ============================================================
    // CARRITO UI Y FILTROS
    // ============================================================
    function toggleCart(close = false) {
        if(close) {
            cartSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow='';
        } else {
            cartSidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
        }
    }

    function filterProducts() {
        const term = searchInput.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(c => {
            c.style.display = c.querySelector('h3').textContent.toLowerCase().includes(term) ? 'block' : 'none';
        });
    }

    function filterByCategory(e) {
        const cat = e.target.dataset.category;
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.product-card').forEach(c => {
            if (cat === 'favorites') {
                const productName = c.querySelector('h3').textContent;
                const isFavorite = favorites.some(fav => fav.name === productName);
                c.style.display = isFavorite ? 'block' : 'none';
            } else {
                c.style.display = (cat === 'all' || c.dataset.category === cat) ? 'block' : 'none';
            }
        });
        if (cat === 'favorites') showNoFavoritesMessage();
    }

    function showNoFavoritesMessage() {
        const productGrid = document.querySelector('.product-grid');
        const favoriteCards = document.querySelectorAll('.product-card[style*="display: block"]');
        if (favoriteCards.length === 0) {
            let message = document.querySelector('.no-favorites-message');
            if (!message) {
                message = document.createElement('div');
                message.className = 'no-favorites-message';
                message.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 24 24">
                        <use href="#icon-heart"></use>
                    </svg>
                    <h3>No tienes productos favoritos aún</h3>
                    <p>Haz clic en el corazón de los productos que te gusten</p>
                `;
                productGrid.appendChild(message);
            }
            message.style.display = 'block';
        } else {
            const message = document.querySelector('.no-favorites-message');
            if (message) message.style.display = 'none';
        }
    }

    function showFavoritesMessage(msg) {
        favoritesMessage.textContent = msg;
        favoritesMessage.classList.add('show');
        setTimeout(() => favoritesMessage.classList.remove('show'), 2000);
    }

    // ============================================================
    // CANTIDAD EN MODAL
    // ============================================================
    function decreaseQuantity() { if (currentQuantity > 1) { currentQuantity--; updateQuantityDisplay(); } }
    function increaseQuantity() { currentQuantity++; updateQuantityDisplay(); }
    function updateQuantity() { currentQuantity = Math.max(1, parseInt(quantityInput.value)||1); updateQuantityDisplay(); }
    function validateQuantity() { if (quantityInput.value < 1) { currentQuantity = 1; updateQuantityDisplay(); } }
    function updateQuantityDisplay() { if(quantityInput) quantityInput.value = currentQuantity; }

    // ============================================================
    // WHATSAPP E INSTAGRAM DESDE MODAL
    // ============================================================
    async function sendWhatsApp() {
        if (!validateForm()) { showFavoritesMessage('Completa los campos'); return; }
        const { size, packaging } = getFormData();
        const quantity = currentQuantity;
        const priceText = modalPrice.textContent;
        const priceValue = parseFloat(priceText.replace('$', '')) || 0;
        const subtotal = priceValue * quantity;

        // Obtener promociones activas
        const promotions = await fetchActivePromotions();
        let discountAmount = 0;
        let promoApplied = null;
        if (promotions.length > 0) {
            const promo = promotions[0];
            if (quantity >= promo.min_quantity) {
                if (promo.type === 'percentage') {
                    discountAmount = subtotal * (promo.value / 100);
                } else if (promo.type === 'fixed') {
                    discountAmount = promo.value;
                }
                promoApplied = promo;
            }
        }
        const total = subtotal - discountAmount;

        // Generar número de orden
        const orderNumber = generateOrderNumber();

        // Datos de la orden (un solo producto)
        const itemsData = [{
            name: currentProductName,
            price: priceText,
            quantity: quantity,
            size: size,
            packaging: packaging,
            category: currentProductCategory
        }];

        const orderData = {
            order_number: orderNumber,
            items: itemsData,
            subtotal: subtotal,
            discount_amount: discountAmount,
            total: total,
            payment_method: 'whatsapp',
            status: 'pendiente',
            promo_id: promoApplied?.id || null,
            promo_text: promoApplied ? `Descuento ${promoApplied.type === 'percentage' ? `${promoApplied.value}%` : `$${promoApplied.value}`} por ${promoApplied.min_quantity}+ productos` : null
        };

        // Guardar en Supabase
        const saved = await saveOrderToSupabase(orderData);
        if (!saved) {
            alert('No se pudo registrar tu pedido. Intenta de nuevo.');
            return;
        }

        // Construir el mensaje con descuento y número de orden
        let msg = `¡Hola! Me interesa este producto:\n\n`;
        msg += `*${currentProductName.trim()}* (${priceText}) x${quantity}\n`;
        if (size !== 'N/A') msg += `*Tamaño:* ${size}\n`;
        msg += `*Empaque:* ${packaging}\n\n`;
        msg += `💰 *Subtotal: $${subtotal.toFixed(2)}*\n`;
        if (discountAmount > 0) {
            msg += `🎉 *Descuento aplicado: -$${discountAmount.toFixed(2)}*\n`;
            if (promoApplied) msg += `   (${promoApplied.banner_text})\n`;
        }
        msg += `💵 *Total: $${total.toFixed(2)}*\n\n`;
        msg += `🆔 *Número de orden: ${orderNumber}*\n\n`;
        msg += `¡Gracias! Espero tu respuesta para coordinar la entrega.`;

        // Enviar mensaje
        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://api.whatsapp.com/send?phone=593999406153&text=${encodedMsg}`, '_blank');
    }

    async function sendInstagram() {
        if (!validateForm()) { showFavoritesMessage('Completa campos'); return; }
        const { size, packaging } = getFormData();
        const quantity = currentQuantity;
        const priceText = modalPrice.textContent;
        const priceValue = parseFloat(priceText.replace('$', '')) || 0;
        const subtotal = priceValue * quantity;

        const promotions = await fetchActivePromotions();
        let discountAmount = 0;
        let promoApplied = null;
        if (promotions.length > 0) {
            const promo = promotions[0];
            if (quantity >= promo.min_quantity) {
                if (promo.type === 'percentage') {
                    discountAmount = subtotal * (promo.value / 100);
                } else if (promo.type === 'fixed') {
                    discountAmount = promo.value;
                }
                promoApplied = promo;
            }
        }
        const total = subtotal - discountAmount;

        const orderNumber = generateOrderNumber();

        const itemsData = [{
            name: currentProductName,
            price: priceText,
            quantity: quantity,
            size: size,
            packaging: packaging,
            category: currentProductCategory
        }];

        const orderData = {
            order_number: orderNumber,
            items: itemsData,
            subtotal: subtotal,
            discount_amount: discountAmount,
            total: total,
            payment_method: 'instagram',
            status: 'pendiente',
            promo_id: promoApplied?.id || null,
            promo_text: promoApplied ? `Descuento ${promoApplied.type === 'percentage' ? `${promoApplied.value}%` : `$${promoApplied.value}`} por ${promoApplied.min_quantity}+ productos` : null
        };

        const saved = await saveOrderToSupabase(orderData);
        if (!saved) {
            alert('No se pudo registrar tu pedido. Intenta de nuevo.');
            return;
        }

        // Mensaje para Instagram (sin markdown)
        let msg = `Me interesa este producto:\n\n`;
        msg += `${currentProductName} (${priceText}) x${quantity}\n`;
        if (size !== 'N/A') msg += `Tamaño: ${size}\n`;
        msg += `Empaque: ${packaging}\n\n`;
        msg += `Subtotal: $${subtotal.toFixed(2)}\n`;
        if (discountAmount > 0) {
            msg += `Descuento: -$${discountAmount.toFixed(2)}\n`;
            if (promoApplied) msg += ` (${promoApplied.banner_text})\n`;
        }
        msg += `Total: $${total.toFixed(2)}\n\n`;
        msg += `Número de orden: ${orderNumber}`;

        navigator.clipboard.writeText(msg);
        alert("Mensaje copiado. Pégalo en Instagram.\nNúmero de orden: " + orderNumber);
        window.open('https://ig.me/m/tejidosdelight', '_blank');
    }
    // ============================================================
    // COMPARTIR PRODUCTO
    // ============================================================
    function shareProduct() {
        if (!currentProductId) {
            alert('No se puede compartir este producto');
            return;
        }
        const categoryPage = `${currentProductCategory}.html`;
        const shareUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}${categoryPage}#product-${currentProductId}`;
        if (navigator.share) {
            navigator.share({
                title: currentProductName,
                text: `Mira este producto en Tejidos Delight: ${currentProductName}`,
                url: shareUrl
            }).catch(err => console.log('Error al compartir:', err));
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Enlace copiado al portapapeles');
            }).catch(() => {
                alert('No se pudo copiar el enlace');
            });
        }
    }

    // ============================================================
    // APERTURA AUTOMÁTICA DESDE HASH
    // ============================================================
    function openProductFromHash() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#product-')) {
            const productId = hash.slice('#product-'.length); // Extrae el UUID completo
            console.log('🔍 Extracted product ID:', productId);
            if (window.currentProducts && window.currentProducts[productId]) {
                const product = window.currentProducts[productId];
                const viewBtn = document.querySelector(`.product-link[data-id="${productId}"]`);
                if (viewBtn) {
                    viewBtn.click();
                } else {
                    openModalFromData(product);
                }
                history.replaceState(null, null, window.location.pathname);
            } else {
                console.warn('Producto no encontrado en window.currentProducts:', productId);
            }
        }
    }

    // Escuchar el evento cuando los productos estén listos
    window.addEventListener('productsLoaded', openProductFromHash);

    // Respuesta por si el evento no se dispara (por cualquier razón)
    setTimeout(() => {
        openProductFromHash();
    }, 1500);

    function openModalFromData(product) {
        const fakeLink = {
            dataset: {
                name: product.name,
                price: product.price,
                img: product.image_url,
                type: product.type,
                category: product.category,
                sizeConfig: JSON.stringify(product.size_config || {}),
                packagingConfig: JSON.stringify(product.packaging_config || {}),
                id: product.id
            }
        };
        const fakeEvent = { preventDefault: () => {} };
        openModal.call(fakeLink, fakeEvent);
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    function setupPaymentMethods() { selectPaymentMethod('whatsapp'); }
    function setupLogoAnimation() {
        const logo = document.getElementById('logo');
        if (logo) {
            logo.addEventListener('mouseenter', () => logo.style.transform = 'scale(1.1)');
            logo.addEventListener('mouseleave', () => logo.style.transform = 'scale(1)');
        }
    }
    function setupImageZoom() {
        const zoomContainer = document.querySelector('.modal-image-container');
        const zoomImage = document.getElementById('modal-img');
        if (!zoomContainer || !zoomImage) return;
        zoomContainer.addEventListener('mousemove', (e) => {
            const rect = zoomContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            zoomImage.style.transformOrigin = `${(x/rect.width)*100}% ${(y/rect.height)*100}%`;
        });
        zoomContainer.addEventListener('mouseenter', () => zoomImage.style.transform = 'scale(1.8)');
        zoomContainer.addEventListener('mouseleave', () => { zoomImage.style.transform = 'scale(1)'; zoomImage.style.transformOrigin = 'center center'; });
    }

    function initHeroSlider() {
        const heroImg = document.getElementById('hero-image');
        if (!heroImg) return;
        const categoryImages = [
            'imagenes/amigurumis.jpg', 'imagenes/girasol.jpg', 'imagenes/capibara.jpg',
            'imagenes/pulseras.jpg', 'imagenes/colgante.jpg', 'imagenes/bolsahellokitty.jpg',
            'imagenes/macetagirasol.jpg'
        ];
        let currentImageIndex = 0;
        const transitionDuration = 1000;
        const displayDuration = 4000;
        heroImg.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
        function changeHeroImage() {
            heroImg.style.opacity = '0';
            setTimeout(() => {
                currentImageIndex = (currentImageIndex + 1) % categoryImages.length;
                heroImg.src = categoryImages[currentImageIndex];
                heroImg.alt = 'Producto Destacado ' + (currentImageIndex + 1);
                setTimeout(() => { heroImg.style.opacity = '1'; }, 50);
            }, transitionDuration);
        }
        setInterval(changeHeroImage, displayDuration);
    }

    function updateCartItemQuantity(id, increase) {
        const idx = cart.findIndex(item => item.identifier === id);
        if (idx !== -1) {
            if (increase) cart[idx].quantity++;
            else {
                cart[idx].quantity--;
                if (cart[idx].quantity <= 0) cart.splice(idx, 1);
            }
            saveCartToStorage(); updateCartCounter(); updateCartDisplay(); updateCheckoutButton();
        }
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.identifier !== id);
        saveCartToStorage(); updateCartCounter(); updateCartDisplay(); updateCheckoutButton();
    }

    function editCartItem(id) {
        const item = cart.find(i => i.identifier === id);
        if (item) {
            toggleCart(true);
            const cards = document.querySelectorAll('.product-card');
            let btn = null;
            cards.forEach(c => {
                if(c.querySelector('h3').textContent === item.name) btn = c.querySelector('.view-btn');
            });
            if (btn) {
                isEditingCartItem = true;
                editingCartItemName = id;
                setTimeout(() => {
                    btn.click();
                    setTimeout(() => {
                        if (item.size && item.size !== "No especificado") {
                            if (item.size === 'N/A' && currentSizeConfig.type === 'none') {
                                modalSizeSelect.value = 'none';
                            } else {
                                let found = false;
                                for(let o of modalSizeSelect.options) if(o.value===item.size){ o.selected=true; found=true; break;}
                                if(!found && currentSizeConfig.type !== 'none') {
                                    modalSizeSelect.value = 'custom';
                                    modalSizeCustomText.value = item.size;
                                    modalSizeCustomContainer.style.display = 'block';
                                }
                            }
                        }
                        if (item.packaging) modalPackagingSelect.value = item.packaging;
                        currentQuantity = item.quantity;
                        updateQuantityDisplay();
                        if(modalAddToCartBtn) modalAddToCartBtn.textContent = '🛒 Actualizar';
                        updateAddToCartButton();
                    }, 100);
                }, 300);
            } else {
                alert("Para editar este producto, navega a su categoría correspondiente.");
            }
        }
    }
    
    function init() {
        loadCartFromStorage();
        loadFavoritesFromStorage();
        updateCartCounter();
        updateCartDisplay();
        setupEventListeners();
        setupPaymentMethods();
        setupLogoAnimation();
        setupImageZoom();
        initHeroSlider();
    }

    function setupEventListeners() {
        productLinks.forEach(link => link.addEventListener('click', openModal));
        modalCloseBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
        
        if (modalSizeSelect) modalSizeSelect.addEventListener('change', updateAddToCartButton);
        if (modalSizeCustomText) modalSizeCustomText.addEventListener('input', updateAddToCartButton);
        if (modalSizeCustomInput) modalSizeCustomInput.addEventListener('input', updateAddToCartButton);
        if (modalPackagingSelect) modalPackagingSelect.addEventListener('change', updateAddToCartButton);
        
        if (waButton) waButton.addEventListener('click', sendWhatsApp);
        if (igButton) igButton.addEventListener('click', sendInstagram);
        if (modalAddToCartBtn) modalAddToCartBtn.addEventListener('click', addToCartFromModal);
        if (shareButton) shareButton.addEventListener('click', shareProduct);
        
        if (quantityDecrease) quantityDecrease.addEventListener('click', decreaseQuantity);
        if (quantityIncrease) quantityIncrease.addEventListener('click', increaseQuantity);
        if (quantityInput) {
            quantityInput.addEventListener('input', updateQuantity);
            quantityInput.addEventListener('change', validateQuantity);
        }
        
        if (searchInput) searchInput.addEventListener('input', filterProducts);
        if (filterButtons.length > 0) filterButtons.forEach(btn => btn.addEventListener('click', filterByCategory));
        
        if (cartContainer) cartContainer.addEventListener('click', () => toggleCart());
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(true));
        if (overlay) overlay.addEventListener('click', () => toggleCart(true));
        if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', () => toggleCart(true));
        if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);
        
        document.addEventListener('click', function(e) {
            const target = e.target;
            const favBtn = target.closest('.favorite-btn');
            if (favBtn) {
                e.preventDefault();
                const card = favBtn.closest('.product-card');
                toggleFavorite(
                    card.querySelector('h3').textContent,
                    card.querySelector('.precio').textContent,
                    card.querySelector('img').src,
                    favBtn
                );
                return;
            }
            const viewBtn = target.closest('.view-btn');
            if (viewBtn && viewBtn.classList.contains('product-link')) {
                e.preventDefault();
                openModal.call(viewBtn, e);
                return;
            }
            const quickAddBtn = target.closest('.add-to-cart-btn');
            if (quickAddBtn) {
                e.preventDefault();
                const btn = quickAddBtn.closest('.product-card').querySelector('.view-btn');
                if (btn) btn.click();
                return;
            }
            const qtyBtn = target.closest('.cart-quantity-btn');
            if (qtyBtn) {
                e.preventDefault();
                const id = qtyBtn.closest('.cart-item').dataset.identifier;
                updateCartItemQuantity(id, qtyBtn.textContent === '+');
                return;
            }
            const editBtn = target.closest('.cart-item-edit');
            if (editBtn) {
                e.preventDefault();
                const id = editBtn.closest('.cart-item').dataset.identifier;
                editCartItem(id);
                return;
            }
            const removeBtn = target.closest('.cart-item-remove');
            if (removeBtn) {
                e.preventDefault();
                const id = removeBtn.closest('.cart-item').dataset.identifier;
                removeFromCart(id);
                return;
            }
            const paymentOpt = target.closest('.payment-option');
            if (paymentOpt) {
                selectPaymentMethod(paymentOpt.dataset.method);
                return;
            }
        });
    }

    // Exponer funciones globales
    window.loadFavoritesFromStorage = loadFavoritesFromStorage;
    window.openModal = openModal;
    window.toggleFavorite = toggleFavorite;
    window.clearStorage = () => { localStorage.clear(); location.reload(); };
    
    init();
});