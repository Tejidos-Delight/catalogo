// =================================================================
// ARCHIVO main.js (VERSIÓN FINAL CORREGIDA - CARRITO + SLIDER)
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

    const quantityInput = document.getElementById('modal-quantity');
    const quantityDecrease = document.getElementById('quantity-decrease');
    const quantityIncrease = document.getElementById('quantity-increase');

    const productLinks = document.querySelectorAll('.product-link');
    
    // --- Variables de Estado ---
    let currentProductName = "";
    let currentProductType = "standard";
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
    
    // --- INICIALIZACIÓN ---
    function init() {
        loadCartFromStorage();
        loadFavoritesFromStorage();
        updateCartCounter();
        updateCartDisplay();
        setupEventListeners();
        setupPaymentMethods();
        setupLogoAnimation();
        setupImageZoom();
        initHeroSlider(); // Activar slider
    }
    
    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        // Modal
        productLinks.forEach(link => link.addEventListener('click', openModal));
        modalCloseBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
        
        // Formularios
        if (modalSizeSelect) modalSizeSelect.addEventListener('change', updateAddToCartButton);
        if (modalSizeCustomText) modalSizeCustomText.addEventListener('input', updateAddToCartButton);
        if (modalSizeCustomInput) modalSizeCustomInput.addEventListener('input', updateAddToCartButton);
        if (modalPackagingSelect) modalPackagingSelect.addEventListener('change', updateAddToCartButton);
        
        // Botones Compra
        if (waButton) waButton.addEventListener('click', sendWhatsApp);
        if (igButton) igButton.addEventListener('click', sendInstagram);
        if (modalAddToCartBtn) modalAddToCartBtn.addEventListener('click', addToCartFromModal);
        
        // Cantidad
        if (quantityDecrease) quantityDecrease.addEventListener('click', decreaseQuantity);
        if (quantityIncrease) quantityIncrease.addEventListener('click', increaseQuantity);
        if (quantityInput) {
            quantityInput.addEventListener('input', updateQuantity);
            quantityInput.addEventListener('change', validateQuantity);
        }
        
        // Filtros
        if (searchInput) searchInput.addEventListener('input', filterProducts);
        if (filterButtons.length > 0) filterButtons.forEach(btn => btn.addEventListener('click', filterByCategory));
        
        // Carrito UI
        if (cartContainer) cartContainer.addEventListener('click', () => toggleCart());
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(true));
        if (overlay) overlay.addEventListener('click', () => toggleCart(true));
        if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', () => toggleCart(true));
        if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);
        
        // --- DELEGACIÓN DE EVENTOS (Aquí arreglamos el carrito) ---
        document.addEventListener('click', function(e) {
            const target = e.target;

            // 1. Favoritos
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

            // 2. Ver detalles (Botón ojo)
            const viewBtn = target.closest('.view-btn');
            if (viewBtn && viewBtn.classList.contains('product-link')) {
                e.preventDefault();
                openModal.call(viewBtn, e);
                return;
            }
            
            // 3. Añadir rápido al carrito
            const quickAddBtn = target.closest('.add-to-cart-btn');
            if (quickAddBtn) {
                e.preventDefault();
                const btn = quickAddBtn.closest('.product-card').querySelector('.view-btn');
                if (btn) btn.click();
                return;
            }

            // --- CONTROLES DEL CARRITO ---

            // 4. Cantidad (+ / -)
            const qtyBtn = target.closest('.cart-quantity-btn');
            if (qtyBtn) {
                e.preventDefault();
                const id = qtyBtn.closest('.cart-item').dataset.identifier;
                updateCartItemQuantity(id, qtyBtn.textContent === '+');
                return;
            }

            // 5. Editar Producto (Lápiz)
            const editBtn = target.closest('.cart-item-edit');
            if (editBtn) {
                e.preventDefault();
                // Usamos el dataset del BOTÓN, no del padre, para ser precisos
                const id = editBtn.closest('.cart-item').dataset.identifier;
                editCartItem(id);
                return;
            }

            // 6. Eliminar Producto (X)
            const removeBtn = target.closest('.cart-item-remove');
            if (removeBtn) {
                e.preventDefault();
                const id = removeBtn.closest('.cart-item').dataset.identifier;
                removeFromCart(id);
                return;
            }

            // 7. Método de Pago
            const paymentOpt = target.closest('.payment-option');
            if (paymentOpt) {
                selectPaymentMethod(paymentOpt.dataset.method);
                return;
            }
        });
    }

        // --- CARRUSEL HERO ---
    function initHeroSlider() {
        const heroImg = document.getElementById('hero-image');
        if (!heroImg) return; // Solo se ejecuta en index.html

        // Array con las imágenes de las categorías
        const categoryImages = [
            'imagenes/amigurumis.jpg',
            'imagenes/girasol.jpg',
            'imagenes/capibara.jpg', 
            'imagenes/pulseras.jpg',
            'imagenes/colgante.jpg',
            'imagenes/bolsahellokitty.jpg',
            'imagenes/macetagirasol.jpg'
        ];

        let currentImageIndex = 0;
        const transitionDuration = 1000; // 1 segundo para transición
        const displayDuration = 4000; // 4 segundos entre cambios

        // Configurar transición CSS
        heroImg.style.transition = `opacity ${transitionDuration}ms ease-in-out`;

        function changeHeroImage() {
            // Fade out
            heroImg.style.opacity = '0';
            
            setTimeout(() => {
                // Cambiar a la siguiente imagen
                currentImageIndex = (currentImageIndex + 1) % categoryImages.length;
                heroImg.src = categoryImages[currentImageIndex];
                heroImg.alt = 'Producto Destacado ' + (currentImageIndex + 1);
                
                // Fade in
                setTimeout(() => {
                    heroImg.style.opacity = '1';
                }, 50);
            }, transitionDuration);
        }

        // Iniciar el intervalo del carrusel
        setInterval(changeHeroImage, displayDuration);
    }

    // --- LÓGICA DE CARRITO ---
    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Tu carrito está vacío</p>';
            if (cartTotalElement) cartTotalElement.textContent = '$0.00';
            return;
        }
        
        let total = 0;
        cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            // Guardamos el ID en el div padre
            el.dataset.identifier = item.identifier;
            
            const priceVal = parseFloat(item.price.replace('$', '')) || 0;
            total += priceVal * item.quantity;
            
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
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    function updateCartItemQuantity(id, increase) {
        console.log("Actualizando cantidad:", id, increase);
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
        console.log("Eliminando:", id);
        cart = cart.filter(item => item.identifier !== id);
        saveCartToStorage(); updateCartCounter(); updateCartDisplay(); updateCheckoutButton();
    }

    function editCartItem(id) {
        console.log("Editando:", id);
        const item = cart.find(i => i.identifier === id);
        if (item) {
            toggleCart(true); // Cerrar carrito
            
            // Buscar el botón en el grid para abrir modal
            // Nota: Esto solo funciona si el producto está visible en la página actual
            const cards = document.querySelectorAll('.product-card');
            let btn = null;
            cards.forEach(c => {
                if(c.querySelector('h3').textContent === item.name) btn = c.querySelector('.view-btn');
            });
            
            if (btn) {
                isEditingCartItem = true;
                editingCartItemName = id;
                setTimeout(() => {
                    btn.click(); // Simular click para abrir modal
                    // Cargar datos
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

    // --- RESTO DE FUNCIONES (Intactas) ---
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

    function setupLogoAnimation() {
        const logo = document.getElementById('logo');
        if (logo) {
            logo.addEventListener('mouseenter', () => logo.style.transform = 'scale(1.1)');
            logo.addEventListener('mouseleave', () => logo.style.transform = 'scale(1)');
        }
    }

    function openModal(event) {
        event.preventDefault(); const link = this; 
        currentProductName = link.dataset.name; currentProductType = link.dataset.type || 'standard'; currentQuantity = 1; 
        modalImg.src = link.dataset.img; modalName.textContent = currentProductName; modalPrice.textContent = link.dataset.price;
        try { currentSizeConfig = JSON.parse(link.dataset.sizeConfig || '{}'); } catch (e) { currentSizeConfig = {}; }
        try { currentPackagingConfig = JSON.parse(link.dataset.packagingConfig || '{}'); } catch (e) { currentPackagingConfig = {}; }
        
        if (formSizeStandard && modalSizeSelect) {
            modalSizeCustomContainer.style.display = 'none'; modalSizeCustomText.value = '';
            if (currentSizeConfig.type === 'none') {
                formSizeStandard.style.display = 'none'; modalSizeSelect.innerHTML = '<option value="none" selected>N/A</option>'; modalSizeSelect.value = 'none';
            } else {
                formSizeStandard.style.display = 'block'; modalSizeSelect.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
                if (currentSizeConfig.type === 'fixed') {
                    const opt = document.createElement('option'); opt.value = currentSizeConfig.value || "Único"; opt.textContent = currentSizeConfig.value || "Único";
                    modalSizeSelect.appendChild(opt); modalSizeSelect.value = opt.value;
                } else {
                    if (currentSizeConfig.options) currentSizeConfig.options.forEach(val => { const opt = document.createElement('option'); opt.value = val; opt.textContent = val; modalSizeSelect.appendChild(opt); });
                    if (currentProductType === 'custom') { const opt = document.createElement('option'); opt.value = "custom"; opt.textContent = "Otro"; modalSizeSelect.appendChild(opt); }
                }
                if (currentSizeConfig.type !== 'fixed' && currentSizeConfig.defaultValue) for(let opt of modalSizeSelect.options) if(opt.value === currentSizeConfig.defaultValue) modalSizeSelect.value = opt.value;
            }
            modalSizeSelect.onchange = () => { modalSizeCustomContainer.style.display = (modalSizeSelect.value === 'custom') ? 'block' : 'none'; updateAddToCartButton(); };
        }
        if (formSizeCustom) formSizeCustom.style.display = 'none';
        if (modalPackagingSelect) {
            modalPackagingSelect.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
            if (currentPackagingConfig.type === 'fixed') {
                modalPackagingSelect.innerHTML = `<option value="${currentPackagingConfig.value}" selected>${currentPackagingConfig.value}</option>`; modalPackagingSelect.disabled = true;
            } else {
                modalPackagingSelect.disabled = false;
                if (currentPackagingConfig.options) currentPackagingConfig.options.forEach(val => { const opt = document.createElement('option'); opt.value = val; opt.textContent = val; if (val === currentPackagingConfig.defaultValue) opt.selected = true; modalPackagingSelect.appendChild(opt); });
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

        updateQuantityDisplay(); removeErrorHighlights(); document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
        if (formPackaging) formPackaging.style.display = 'block';
        if (!isEditingCartItem && modalAddToCartBtn) modalAddToCartBtn.textContent = '🛒 Añadir al Carrito';
        setTimeout(updateAddToCartButton, 50); modalOverlay.style.display = 'flex'; document.body.style.overflow = 'hidden';
    }

    function closeModal() { modalOverlay.style.display = 'none'; document.body.style.overflow = ''; isEditingCartItem = false; editingCartItemName = ""; }

    function validateForm() {
        let isValid = true; removeErrorHighlights(); document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
        const sizeValue = modalSizeSelect.value;
        if (currentSizeConfig.type !== 'none') {
            if (!sizeValue || sizeValue === '') { isValid = false; document.getElementById('error-size-standard').style.display = 'block'; modalSizeSelect.classList.add('error-highlight'); } 
            else if (sizeValue === 'custom' && !modalSizeCustomText.value.trim()) { isValid = false; document.getElementById('error-size-custom-text').style.display = 'block'; modalSizeCustomText.classList.add('error-highlight'); }
        }
        if (!modalPackagingSelect.value) { document.getElementById('error-packaging').style.display = 'block'; modalPackagingSelect.classList.add('error-highlight'); isValid = false; }
        return isValid;
    }
    function removeErrorHighlights() { document.querySelectorAll('.error-highlight').forEach(e => e.classList.remove('error-highlight')); }

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
        let size = "No especificado"; let packaging = modalPackagingSelect ? modalPackagingSelect.value : "No especificado";
        if (currentSizeConfig.type === 'none') size = "N/A";
        else { const val = modalSizeSelect.value; size = (val === 'custom') ? (modalSizeCustomText.value.trim() || "Personalizado") : val; }
        return { size, packaging };
    }

    function addToCartFromModal() {
        if (!validateForm()) { showFavoritesMessage('Completa los campos'); return; }
        const { size, packaging } = getFormData();
        let details = `Empaque: ${packaging}`; if (size !== 'N/A') details = `Tamaño: ${size}\n${details}`;
        addToCart(currentProductName, modalPrice.textContent, modalImg.src, details, currentQuantity, size, packaging);
        if (modalAddToCartBtn) {
            const originalText = isEditingCartItem ? '🛒 Actualizar Producto' : '🛒 Añadir al Carrito';
            modalAddToCartBtn.innerHTML = isEditingCartItem ? '✓ Actualizado' : '✓ Añadido';
            modalAddToCartBtn.style.backgroundColor = '#25D366'; modalAddToCartBtn.disabled = true;
            setTimeout(() => { modalAddToCartBtn.innerHTML = originalText; modalAddToCartBtn.style.backgroundColor = ''; modalAddToCartBtn.disabled = false; closeModal(); }, 1500);
        }
    }

    function addToCart(name, price, img, details = '', quantity = 1, size = '', packaging = '') {
        let optimizedImg = img; if (img && img.startsWith('data:image')) optimizedImg = 'imagenes/personalizado.jpg';
        const itemIdentifier = name + size + packaging;
        if (isEditingCartItem) {
            const idx = cart.findIndex(item => item.identifier === editingCartItemName);
            if (idx !== -1) { cart[idx] = { ...cart[idx], name, price, img: optimizedImg, details, quantity, size, packaging, identifier: itemIdentifier }; isEditingCartItem = false; editingCartItemName = ""; }
        } else {
            const idx = cart.findIndex(item => item.identifier === itemIdentifier);
            if (idx !== -1) cart[idx].quantity += quantity;
            else cart.push({ name, price, img: optimizedImg, details, quantity, size, packaging, identifier: itemIdentifier });
        }
        saveCartToStorage(); updateCartCounter(); updateCartDisplay(); updateCheckoutButton();
        if (cartCounter) { cartCounter.classList.add('pulse'); setTimeout(() => cartCounter.classList.remove('pulse'), 1000); }
    }

    function proceedToCheckout() {
        if (cart.length === 0) return alert('Carrito vacío');
        if (!selectedPaymentMethod) return alert('Selecciona contacto');
        let msg = "¡Hola! Me interesan:\n\n";
        cart.forEach(i => { msg += `• ${i.name} (${i.price}) x${i.quantity}\n`; if(i.size && i.size !== 'N/A') msg += `  Tam: ${i.size}\n`; msg += `  Emp: ${i.packaging}\n`; });
        msg += `\nTotal: ${cartTotalElement.textContent}\n\nGracias!`;
        if (selectedPaymentMethod === 'whatsapp') window.open(`https://wa.me/593999406153?text=${encodeURIComponent(msg)}`, '_blank');
        else { navigator.clipboard.writeText(msg); alert("Copiado. Pégalo en Instagram."); window.open('https://ig.me/m/tejidosdelight', '_blank'); }
        cart = []; saveCartToStorage(); updateCartCounter(); updateCartDisplay(); toggleCart(true);
    }

    function decreaseQuantity() { if (currentQuantity > 1) { currentQuantity--; updateQuantityDisplay(); } }
    function increaseQuantity() { currentQuantity++; updateQuantityDisplay(); }
    function updateQuantity() { currentQuantity = Math.max(1, parseInt(quantityInput.value)||1); updateQuantityDisplay(); }
    function validateQuantity() { if (quantityInput.value < 1) { currentQuantity = 1; updateQuantityDisplay(); } }
    function updateQuantityDisplay() { if(quantityInput) quantityInput.value = currentQuantity; }
    function setupPaymentMethods() { selectPaymentMethod('whatsapp'); }
    function selectPaymentMethod(m) { selectedPaymentMethod = m; document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected')); const sel = document.querySelector(`.payment-option[data-method="${m}"]`); if(sel) sel.classList.add('selected'); updateCheckoutButton(); }
    function updateCheckoutButton() { if(!checkoutBtn) return; const ok = cart.length > 0 && selectedPaymentMethod; checkoutBtn.disabled = !ok; checkoutBtn.classList.toggle('checkout-disabled', !ok); if(ok) { checkoutBtn.className = selectedPaymentMethod === 'whatsapp' ? 'btn-checkout btn-checkout-whatsapp' : 'btn-checkout btn-checkout-instagram'; checkoutBtn.textContent = selectedPaymentMethod === 'whatsapp' ? 'Finalizar por WhatsApp' : 'Finalizar por Instagram'; } else checkoutBtn.textContent = 'Finalizar Pedido'; }
    function toggleCart(close = false) { if(close) { cartSidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow=''; } else { cartSidebar.classList.toggle('active'); overlay.classList.toggle('active'); document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : ''; } }
    function filterProducts() { const term = searchInput.value.toLowerCase(); document.querySelectorAll('.product-card').forEach(c => { c.style.display = c.querySelector('h3').textContent.toLowerCase().includes(term) ? 'block' : 'none'; }); }
    function filterByCategory(e) { const cat = e.target.dataset.category; filterButtons.forEach(b => b.classList.remove('active')); e.target.classList.add('active'); document.querySelectorAll('.product-card').forEach(c => { c.style.display = (cat === 'all' || c.dataset.category === cat) ? 'block' : 'none'; }); }
    function toggleFavorite(name, price, img, btn) { const idx = favorites.findIndex(i => i.name === name); if(idx !== -1) { favorites.splice(idx, 1); btn.classList.remove('active'); showFavoritesMessage('Eliminado'); } else { favorites.push({name, price, img}); btn.classList.add('active'); showFavoritesMessage('Guardado'); } saveFavoritesToStorage(); }
    function showFavoritesMessage(msg) { favoritesMessage.textContent = msg; favoritesMessage.classList.add('show'); setTimeout(() => favoritesMessage.classList.remove('show'), 2000); }
    function sendWhatsApp() { if(!validateForm()) { showFavoritesMessage('Completa campos'); return; } const {size, packaging} = getFormData(); let msg = `¡Hola! Me interesa: *${currentProductName}*\n\n`; if(size !== 'N/A') msg += `*Tam:* ${size}\n`; msg += `*Emp:* ${packaging}\n*Cant:* ${currentQuantity}`; window.open(`https://wa.me/593999406153?text=${encodeURIComponent(msg)}`, '_blank'); }
    function sendInstagram() { if(!validateForm()) { showFavoritesMessage('Completa campos'); return; } const {size, packaging} = getFormData(); let msg = `Me interesa: ${currentProductName}\n`; if(size !== 'N/A') msg += `Tam: ${size}\n`; msg += `Emp: ${packaging}\nCant: ${currentQuantity}`; navigator.clipboard.writeText(msg); alert("Copiado. Pégalo en Instagram."); window.open('https://ig.me/m/tejidosdelight', '_blank'); }
    function saveCartToStorage() { localStorage.setItem('tejidosDelightCart', JSON.stringify(cart)); }
    function loadCartFromStorage() { try { cart = JSON.parse(localStorage.getItem('tejidosDelightCart')||'[]'); cart.forEach(i => { if(!i.identifier) i.identifier = i.name + (i.size||'') + (i.packaging||''); }); } catch(e) { cart = []; } }
    function saveFavoritesToStorage() { localStorage.setItem('tejidosDelightFavorites', JSON.stringify(favorites)); }
    function loadFavoritesFromStorage() { favorites = JSON.parse(localStorage.getItem('tejidosDelightFavorites')||'[]'); document.querySelectorAll('.product-card').forEach(c => { if(favorites.some(f => f.name === c.querySelector('h3').textContent)) c.querySelector('.favorite-btn').classList.add('active'); }); }
    function updateCartCounter() { cartCounter.textContent = cart.reduce((t, i) => t + i.quantity, 0); cartCounter.style.display = cart.length > 0 ? 'flex' : 'none'; }
    window.openModal = openModal; window.toggleFavorite = toggleFavorite; window.clearStorage = () => { localStorage.clear(); location.reload(); };
    
    init();
});