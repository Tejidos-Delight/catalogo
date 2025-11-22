// =================================================================
// ARCHIVO main.js (VERSIÓN 3 - CON OPCIÓN 'NO APLICA TAMAÑO')
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- Variables del Modal ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close');
    
    // --- Contenido del Modal ---
    const modalImg = document.getElementById('modal-img');
    const modalName = document.getElementById('modal-name');
    const modalPrice = document.getElementById('modal-price');

    // --- Grupos de Formularios ---
    const formSizeStandard = document.getElementById('form-size-standard');
    const formSizeCustom = document.getElementById('form-size-custom');
    const formPackaging = document.getElementById('form-packaging');
    
    // --- Grupos de Instrucciones ---
    const instructionsStandard = document.getElementById('instructions-standard');
    const instructionsCustom = document.getElementById('instructions-custom');

    // --- Inputs Estándar (Tamaño) ---
    const modalSizeSelect = document.getElementById('modal-size-select');
    const modalSizeCustomContainer = document.getElementById('modal-size-custom-container');
    const modalSizeCustomText = document.getElementById('modal-size-custom-text');
    
    // --- Inputs Personalizados (Tamaño) ---
    const modalSizeCustomInput = document.getElementById('modal-size-custom');
    
    // --- Inputs de Empaque (Unificados) ---
    const modalPackagingSelect = document.getElementById('modal-packaging-select');

    // --- Botones de Acción ---
    const waButton = document.getElementById('modal-wa-btn');
    const igButton = document.getElementById('modal-ig-btn');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart');

    // --- Elementos de cantidad ---
    const quantityInput = document.getElementById('modal-quantity');
    const quantityDecrease = document.getElementById('quantity-decrease');
    const quantityIncrease = document.getElementById('quantity-increase');

    const productLinks = document.querySelectorAll('.product-link');
    
    let currentProductName = "";
    let currentProductType = "standard";
    let currentQuantity = 1;
    let isEditingCartItem = false;
    let editingCartItemName = "";
    let currentSizeConfig = {};
    let currentPackagingConfig = {};
    
    // --- Nuevas variables ---
    let cart = [];
    let favorites = [];
    let selectedPaymentMethod = '';
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
    
    // --- Función init ---
    function init() {
        loadCartFromStorage();
        loadFavoritesFromStorage();
        updateCartCounter();
        updateCartDisplay();
        setupEventListeners();
        setupPaymentMethods();
        setupLogoAnimation();
        setupImageZoom();
    }
    
    // --- Event Listeners ---
    function setupEventListeners() {
        productLinks.forEach(link => {
            link.addEventListener('click', openModal);
        });

        modalCloseBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
        
        if (modalSizeSelect) modalSizeSelect.addEventListener('change', updateAddToCartButton);
        if (modalSizeCustomText) modalSizeCustomText.addEventListener('input', updateAddToCartButton);
        
        if (waButton) waButton.addEventListener('click', sendWhatsApp);
        if (igButton) igButton.addEventListener('click', sendInstagram);
        
        if (quantityDecrease) quantityDecrease.addEventListener('click', decreaseQuantity);
        if (quantityIncrease) quantityIncrease.addEventListener('click', increaseQuantity);
        if (quantityInput) quantityInput.addEventListener('input', updateQuantity);
        if (quantityInput) quantityInput.addEventListener('change', validateQuantity);
        
        if (searchInput) {
            searchInput.addEventListener('input', filterProducts);
        }
        
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', filterByCategory);
            });
        }
        
        if (cartContainer) {
            cartContainer.addEventListener('click', () => toggleCart());
        }
        
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => toggleCart(true));
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => toggleCart(true));
        }
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', proceedToCheckout);
        }
        
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => toggleCart(true));
        }
        
        if (modalSizeCustomInput) {
            modalSizeCustomInput.addEventListener('input', updateAddToCartButton);
        }
        if (modalPackagingSelect) {
            modalPackagingSelect.addEventListener('change', updateAddToCartButton);
        }

        if (modalAddToCartBtn) {
            modalAddToCartBtn.addEventListener('click', addToCartFromModal);
        }
        
        document.addEventListener('click', function(e) {
            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                const productCard = e.target.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('.precio').textContent;
                const productImg = productCard.querySelector('img').src;
                toggleFavorite(productName, productPrice, productImg, e.target.closest('.favorite-btn'));
            }
            
            if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault();
                const productCard = e.target.closest('.product-card');
                const viewBtn = productCard.querySelector('.view-btn');
                if (viewBtn) {
                    viewBtn.click();
                }
            }
            
            if (e.target.closest('.view-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.view-btn');
                if (btn.classList.contains('product-link')) {
                    openModal.call(btn, e);
                }
            }

            if (e.target.closest('.cart-quantity-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.cart-quantity-btn');
                const cartItem = btn.closest('.cart-item');
                const itemIdentifier = cartItem.dataset.identifier;
                const isIncrease = btn.textContent === '+';
                updateCartItemQuantity(itemIdentifier, isIncrease);
            }

            if (e.target.closest('.payment-option')) {
                const option = e.target.closest('.payment-option');
                selectPaymentMethod(option.dataset.method);
            }
            
            if (e.target.closest('.cart-item-edit')) {
                e.preventDefault();
                const btn = e.target.closest('.cart-item-edit');
                editCartItem(btn.dataset.identifier);
            }

            if (e.target.closest('.cart-item-remove')) {
                e.preventDefault();
                const btn = e.target.closest('.cart-item-remove');
                removeFromCart(btn.dataset.identifier);
            }
        });
    }

    function setupLogoAnimation() {
        const logo = document.getElementById('logo');
        if (logo) {
            logo.addEventListener('mouseenter', () => { logo.style.transform = 'scale(1.1)'; });
            logo.addEventListener('mouseleave', () => { logo.style.transform = 'scale(1)'; });
            logo.addEventListener('click', () => {
                logo.style.transform = 'scale(1.15)';
                setTimeout(() => { logo.style.transform = 'scale(1)'; }, 300);
            });
        }
    }

    function setupImageZoom() {
        const zoomContainer = document.querySelector('.modal-left');
        const zoomImage = document.getElementById('modal-img');

        if (!zoomContainer || !zoomImage) return;

        zoomContainer.addEventListener('mousemove', (e) => {
            const rect = zoomContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            zoomImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });

        zoomContainer.addEventListener('mouseenter', () => {
            zoomImage.style.transform = 'scale(1.7)';
        });

        zoomContainer.addEventListener('mouseleave', () => {
            zoomImage.style.transform = 'scale(1)';
            zoomImage.style.transformOrigin = 'center center';
        });
    }

    function decreaseQuantity() {
        if (currentQuantity > 1) {
            currentQuantity--;
            updateQuantityDisplay();
        }
    }

    function increaseQuantity() {
        currentQuantity++;
        updateQuantityDisplay();
    }

    function updateQuantity() {
        const value = parseInt(quantityInput.value) || 1;
        currentQuantity = Math.max(1, value);
        updateQuantityDisplay();
    }

    function validateQuantity() {
        if (quantityInput.value === '' || parseInt(quantityInput.value) < 1) {
            currentQuantity = 1;
            updateQuantityDisplay();
        }
    }

    function updateQuantityDisplay() {
        if (quantityInput) {
            quantityInput.value = currentQuantity;
        }
    }

    function setupPaymentMethods() {
        selectPaymentMethod('whatsapp');
    }

    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;
        document.querySelectorAll('.payment-option').forEach(option => {
            option.classList.remove('selected');
        });
        const selectedOption = document.querySelector(`.payment-option[data-method="${method}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        updateCheckoutButton();
    }

    function updateCheckoutButton() {
        if (!checkoutBtn) return;
        const hasItems = cart.length > 0;
        const hasPaymentMethod = selectedPaymentMethod !== '';
        
        if (hasItems && hasPaymentMethod) {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('checkout-disabled');
            if (selectedPaymentMethod === 'whatsapp') {
                checkoutBtn.textContent = 'Finalizar Pedido por WhatsApp';
                checkoutBtn.className = 'btn-checkout btn-checkout-whatsapp';
            } else {
                checkoutBtn.textContent = 'Finalizar Pedido por Instagram';
                checkoutBtn.className = 'btn-checkout btn-checkout-instagram';
            }
        } else {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('checkout-disabled');
            checkoutBtn.textContent = 'Finalizar Pedido';
        }
    }
    
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productName = card.querySelector('h3').textContent.toLowerCase();
            if (productName.includes(searchTerm)) {
                card.style.display = 'block';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    function filterByCategory(e) {
        const category = e.target.dataset.category;
        filterButtons.forEach(btn => { btn.classList.remove('active'); });
        e.target.classList.add('active');
        const productCards = document.querySelectorAll('.product-card');
        
        if (category === 'all') {
            productCards.forEach(card => {
                card.style.display = 'block';
                card.classList.add('fade-in');
            });
        } else {
            productCards.forEach(card => {
                const productCategory = card.dataset.category;
                if (productCategory === category) {
                    card.style.display = 'block';
                    card.classList.add('fade-in');
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
    
    function toggleFavorite(name, price, img, button) {
        const existingIndex = favorites.findIndex(item => item.name === name);
        if (existingIndex !== -1) {
            favorites.splice(existingIndex, 1);
            button.classList.remove('active');
            showFavoritesMessage('Producto eliminado de favoritos');
        } else {
            favorites.push({ name, price, img });
            button.classList.add('active');
            showFavoritesMessage('Producto agregado a favoritos');
        }
        saveFavoritesToStorage();
    }
    
    function showFavoritesMessage(message) {
        if (favoritesMessage) {
            favoritesMessage.textContent = message;
            favoritesMessage.classList.add('show');
            setTimeout(() => { favoritesMessage.classList.remove('show'); }, 2000);
        }
    }
    
    function addToCart(name, price, img, details = '', quantity = 1, size = '', packaging = '') {
        let optimizedImg = img;
        if (img && img.startsWith('data:image')) {
            optimizedImg = 'imagenes/personalizado.jpg';
        }

        const itemIdentifier = name + size + packaging;
        
        if (isEditingCartItem) {
            const itemIndex = cart.findIndex(item => item.identifier === editingCartItemName);
            if (itemIndex !== -1) {
                cart[itemIndex] = {
                    ...cart[itemIndex],
                    name: name,
                    price: price,
                    img: optimizedImg,
                    details: details,
                    quantity: quantity,
                    size: size,
                    packaging: packaging,
                    identifier: itemIdentifier
                };
                isEditingCartItem = false;
                editingCartItemName = "";
            }
        } else {
            const existingIndex = cart.findIndex(item => item.identifier === itemIdentifier);
            if (existingIndex !== -1) {
                cart[existingIndex].quantity += quantity;
            } else {
                cart.push({
                    name,
                    price,
                    img: optimizedImg,
                    details,
                    quantity: quantity,
                    size: size,
                    packaging: packaging,
                    identifier: itemIdentifier
                });
            }
        }
        
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        updateCheckoutButton();
        
        if (cartCounter) {
            cartCounter.classList.add('pulse');
            setTimeout(() => { cartCounter.classList.remove('pulse'); }, 1000);
        }
    }

    function updateCartItemQuantity(itemIdentifier, isIncrease) {
        const itemIndex = cart.findIndex(item => item.identifier === itemIdentifier);
        if (itemIndex !== -1) {
            if (isIncrease) {
                cart[itemIndex].quantity += 1;
            } else {
                if (cart[itemIndex].quantity > 1) {
                    cart[itemIndex].quantity -= 1;
                } else {
                    cart.splice(itemIndex, 1);
                }
            }
            saveCartToStorage();
            updateCartCounter();
            updateCartDisplay();
            updateCheckoutButton();
        }
    }
    
    function removeFromCart(identifier) {
        cart = cart.filter(item => item.identifier !== identifier);
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        updateCheckoutButton();
    }
    
    function toggleCart(forceClose = false) {
        if (cartSidebar && overlay) {
            if (forceClose) {
                cartSidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                cartSidebar.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
            }
        }
    }
    
    function editCartItem(itemIdentifier) {
        const item = cart.find(item => item.identifier === itemIdentifier);
        if (item) {
            toggleCart(true);
            const productCards = document.querySelectorAll('.product-card');
            let viewBtn = null;
            productCards.forEach(card => {
                if (card.querySelector('h3').textContent === item.name) {
                    viewBtn = card.querySelector('.view-btn');
                }
            });
            
            if (viewBtn) {
                isEditingCartItem = true;
                editingCartItemName = itemIdentifier;
                setTimeout(() => {
                    viewBtn.click();
                    setTimeout(() => {
                        // --- LÓGICA DE PRE-CARGA (INCLUYE 'NONE') ---
                        if (item.size && item.size !== "No especificado") {
                            let foundInSelect = false;
                            if (modalSizeSelect) {
                                // Caso especial: 'N/A' o 'none'
                                if (item.size === 'N/A' && currentSizeConfig.type === 'none') {
                                    modalSizeSelect.value = 'none';
                                    foundInSelect = true;
                                } else {
                                    for (let option of modalSizeSelect.options) {
                                        if (option.value === item.size) {
                                            option.selected = true;
                                            foundInSelect = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!foundInSelect && modalSizeSelect && currentSizeConfig.type !== 'none') {
                                modalSizeSelect.value = "custom";
                                if (modalSizeCustomText) modalSizeCustomText.value = item.size;
                                if (modalSizeCustomContainer) modalSizeCustomContainer.style.display = 'block';
                            }
                        }
                        
                        if (item.packaging && item.packaging !== "No especificado") {
                            if (modalPackagingSelect) {
                                modalPackagingSelect.value = item.packaging;
                            }
                        }
                        
                        if (item.quantity) {
                            currentQuantity = item.quantity;
                            updateQuantityDisplay();
                        }
                        
                        if (modalAddToCartBtn) {
                            modalAddToCartBtn.textContent = '🛒 Actualizar Producto';
                        }
                        updateAddToCartButton(); 
                    }, 100);
                }, 300);
            }
        }
    }
    
    function updateCartCounter() {
        if (cartCounter) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCounter.textContent = totalItems;
            cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
            if (cartTotalElement) cartTotalElement.textContent = '$0.00';
            return;
        }
        
        let total = 0;
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.dataset.identifier = item.identifier;
            const priceValue = parseFloat(item.price.replace('$', '')) || 0;
            const itemTotal = priceValue * item.quantity;
            total += itemTotal;
            
            let description = '';
            // Solo mostrar tamaño si no es N/A
            if (item.size && item.size !== "No especificado" && item.size !== "N/A") {
                description += `<div class="cart-item-detail"><strong>Tamaño:</strong> ${item.size}</div>`;
            }
            if (item.packaging && item.packaging !== "No especificado") {
                description += `<div class="cart-item-detail"><strong>Empaque:</strong> ${item.packaging}</div>`;
            }
            
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">${description}</div>
                    <div class="cart-item-price">${item.price} c/u</div>
                    <div class="cart-item-controls">
                        <button class="cart-quantity-btn">-</button>
                        <input type="text" class="cart-quantity-input" value="${item.quantity}" readonly>
                        <button class="cart-quantity-btn">+</button>
                        <button class="cart-item-edit" data-identifier="${item.identifier}">✏️ Editar</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-identifier="${item.identifier}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }
    
    function proceedToCheckout() {
        if (cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        if (!selectedPaymentMethod) {
            alert('Por favor selecciona un método de contacto');
            return;
        }
        
        let message = "¡Hola! Me interesan los siguientes productos:\n\n";
        cart.forEach(item => {
            message += `• ${item.name} - ${item.price} x ${item.quantity}\n`;
            // Modificado: no mostrar N/A en el mensaje
            if (item.size && item.size !== "No especificado" && item.size !== "N/A") {
                message += `  Tamaño: ${item.size}\n`;
            }
            if (item.packaging && item.packaging !== "No especificado") {
                message += `  Empaque: ${item.packaging}\n`;
            }
        });
        
        message += `\nTotal: ${cartTotalElement ? cartTotalElement.textContent : '$0.00'}\n\n`;
        message += "Quedo atento/a a la confirmación. ¡Gracias!";
        
        if (selectedPaymentMethod === 'whatsapp') {
            const encodedMessage = encodeURIComponent(message);
            const waNumber = "593999406153";
            const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;
            window.open(waLink, '_blank');
        } else {
            try {
                navigator.clipboard.writeText(message);
                alert("✅ Se ha copiado tu pedido al portapapeles. Ahora abre Instagram y pégalo en nuestro chat @tejidosdelight");
                const igLink = "https://www.instagram.com/tejidosdelight/";
                window.open(igLink, '_blank');
            } catch (err) {
                alert("No se pudo copiar el mensaje. Por favor, abre Instagram y escribe tu pedido manualmente.");
            }
        }
        
        cart = [];
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        updateCheckoutButton();
        toggleCart(true);
    }
    
    function saveCartToStorage() {
        try {
            const cartToSave = cart.map(item => ({
                ...item,
                img: item.img && item.img.startsWith('data:image') ? 'imagenes/personalizado.jpg' : item.img
            }));
            localStorage.setItem('tejidosDelightCart', JSON.stringify(cartToSave));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                localStorage.removeItem('tejidosDelightCart');
                const limitedCart = cart.slice(-5);
                localStorage.setItem('tejidosDelightCart', JSON.stringify(limitedCart));
            }
        }
    }
    
    function loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('tejidosDelightCart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
                cart.forEach(item => {
                    if (!item.quantity) item.quantity = 1;
                    if (!item.img || item.img.startsWith('data:image')) {
                        item.img = 'imagenes/personalizado.jpg';
                    }
                    if (!item.identifier) {
                        item.identifier = item.name + (item.size || '') + (item.packaging || '');
                    }
                });
            }
        } catch (e) {
            cart = [];
            localStorage.removeItem('tejidosDelightCart');
        }
    }
    
    function saveFavoritesToStorage() {
        localStorage.setItem('tejidosDelightFavorites', JSON.stringify(favorites));
    }
    
    function loadFavoritesFromStorage() {
        const savedFavorites = localStorage.getItem('tejidosDelightFavorites');
        if (savedFavorites) {
            favorites = JSON.parse(savedFavorites);
            document.querySelectorAll('.product-card').forEach(card => {
                const productName = card.querySelector('h3').textContent;
                const favoriteBtn = card.querySelector('.favorite-btn');
                if (favoriteBtn && favorites.some(item => item.name === productName)) {
                    favoriteBtn.classList.add('active');
                }
            });
        }
    }
    
    // --- FUNCIONES DEL MODAL (MODIFICADAS PARA 'NONE') ---
    function openModal(event) {
        event.preventDefault(); 
        const link = this; 
        
        currentProductName = link.dataset.name;
        currentProductType = link.dataset.type || 'standard';
        currentQuantity = 1; 
        
        modalImg.src = link.dataset.img;
        modalName.textContent = currentProductName;
        modalPrice.textContent = link.dataset.price;

        try { currentSizeConfig = JSON.parse(link.dataset.sizeConfig || '{}'); } catch (e) { currentSizeConfig = {}; }
        try { currentPackagingConfig = JSON.parse(link.dataset.packagingConfig || '{}'); } catch (e) { currentPackagingConfig = {}; }
        
        // --- LÓGICA DE TAMAÑO ---
        if (formSizeStandard && modalSizeSelect) {
            modalSizeCustomContainer.style.display = 'none';
            modalSizeCustomText.value = '';
            
            // CASO 1: NO APLICA TAMAÑO
            if (currentSizeConfig.type === 'none') {
                formSizeStandard.style.display = 'none'; // Ocultar selector
                modalSizeSelect.innerHTML = '<option value="none" selected>N/A</option>'; // Valor interno dummy
                modalSizeSelect.value = 'none';
            } 
            // CASO 2: SÍ APLICA TAMAÑO
            else {
                formSizeStandard.style.display = 'block';
                modalSizeSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción...</option>';

                if (currentSizeConfig.type === 'fixed') {
                    const optionElement = document.createElement('option');
                    optionElement.value = currentSizeConfig.value || "Tamaño único";
                    optionElement.textContent = currentSizeConfig.value || "Tamaño único";
                    modalSizeSelect.appendChild(optionElement);
                    modalSizeSelect.value = optionElement.value;
                } else {
                    if (currentSizeConfig.options) {
                        currentSizeConfig.options.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option;
                            optionElement.textContent = option;
                            modalSizeSelect.appendChild(optionElement);
                        });
                    }
                    if (currentProductType === 'custom') {
                        const customOption = document.createElement('option');
                        customOption.value = "custom";
                        customOption.textContent = "Otro (Personalizado)";
                        modalSizeSelect.appendChild(customOption);
                    }
                }
                
                if (currentSizeConfig.type !== 'fixed' && currentSizeConfig.defaultValue) {
                    let optionExists = false;
                    for (let option of modalSizeSelect.options) {
                        if (option.value === currentSizeConfig.defaultValue) {
                            optionExists = true;
                            break;
                        }
                    }
                    if (optionExists) {
                        modalSizeSelect.value = currentSizeConfig.defaultValue;
                    }
                }
            }

            modalSizeSelect.onchange = () => {
                if (modalSizeSelect.value === 'custom') {
                    modalSizeCustomContainer.style.display = 'block';
                } else {
                    modalSizeCustomContainer.style.display = 'none';
                }
                updateAddToCartButton();
            };
        }
        
        if (formSizeCustom) formSizeCustom.style.display = 'none';

        if (modalPackagingSelect) {
            modalPackagingSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción...</option>';
            if (currentPackagingConfig.type === 'fixed') {
                modalPackagingSelect.innerHTML = `<option value="${currentPackagingConfig.value}" selected>${currentPackagingConfig.value}</option>`;
                modalPackagingSelect.disabled = true;
            } else {
                modalPackagingSelect.disabled = false;
                if (currentPackagingConfig.options) {
                    currentPackagingConfig.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        if (option === currentPackagingConfig.defaultValue) {
                            optionElement.selected = true;
                        }
                        modalPackagingSelect.appendChild(optionElement);
                    });
                }
            }
        }
        
        updateQuantityDisplay();
        removeErrorHighlights();
        document.querySelectorAll('.error-message').forEach(error => { error.style.display = 'none'; });
        
        if (formPackaging) formPackaging.style.display = 'block';

        if (currentProductType === 'custom') {
            if (instructionsStandard) instructionsStandard.style.display = 'none';
            if (instructionsCustom) instructionsCustom.style.display = 'block';
        } else {
            if (instructionsStandard) instructionsStandard.style.display = 'block';
            if (instructionsCustom) instructionsCustom.style.display = 'none';
        }
        
        if (!isEditingCartItem && modalAddToCartBtn) {
            modalAddToCartBtn.textContent = '🛒 Añadir al Carrito';
        }
        
        setTimeout(updateAddToCartButton, 100);
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
        document.querySelectorAll('.error-message').forEach(error => { error.style.display = 'none'; });
        
        const sizeValue = modalSizeSelect.value;
        
        // Validar tamaño SOLO si aplica
        if (currentSizeConfig.type !== 'none') {
            if (!sizeValue || sizeValue === '') {
                isValid = false;
                document.getElementById('error-size-standard').style.display = 'block';
                modalSizeSelect.classList.add('error-highlight');
            } else if (sizeValue === 'custom') {
                const customText = modalSizeCustomText.value.trim();
                if (!customText) {
                    isValid = false;
                    document.getElementById('error-size-custom-text').style.display = 'block';
                    modalSizeCustomText.classList.add('error-highlight');
                }
            }
        }
        
        const packaging = modalPackagingSelect ? modalPackagingSelect.value : '';
        if (!packaging) {
            const errorElement = document.getElementById('error-packaging');
            if (errorElement) errorElement.style.display = 'block';
            modalPackagingSelect.classList.add('error-highlight');
            isValid = false;
        }
        
        return isValid;
    }

    function removeErrorHighlights() {
        document.querySelectorAll('.error-highlight').forEach(element => {
            element.classList.remove('error-highlight');
        });
    }

    function addToCartFromModal() {
        if (!validateForm()) {
            showFavoritesMessage('Por favor completa todos los campos requeridos');
            return; 
        }
        
        const { size, packaging } = getFormData();
        let productDetails = `Empaque: ${packaging}`;
        if (size !== 'N/A') {
            productDetails = `Tamaño: ${size}\n${productDetails}`;
        }
        
        addToCart(currentProductName, modalPrice.textContent, modalImg.src, productDetails, currentQuantity, size, packaging);
        
        if (modalAddToCartBtn) {
            const originalText = isEditingCartItem ? '🛒 Actualizar Producto' : '🛒 Añadir al Carrito';
            const successText = isEditingCartItem ? '✓ Producto Actualizado' : '✓ Producto Añadido';
            modalAddToCartBtn.innerHTML = successText;
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
    
    function updateAddToCartButton() {
        if (modalAddToCartBtn) {
            const packaging = modalPackagingSelect ? modalPackagingSelect.value : '';
            const sizeValue = modalSizeSelect ? modalSizeSelect.value : '';
            let sizeValid = false;
    
            // Si no aplica tamaño, siempre es válido
            if (currentSizeConfig.type === 'none') {
                sizeValid = true;
            } else if (sizeValue === 'custom') {
                sizeValid = modalSizeCustomText.value.trim() !== '';
            } else if (sizeValue !== '') {
                sizeValid = true;
            }
            
            const isEnabled = sizeValid && !!packaging;
            modalAddToCartBtn.disabled = !isEnabled;
        }
    }
    
    function getFormData() {
        let size = "No especificado";
        let packaging = "No especificado";

        // Obtener TAMAÑO
        if (currentSizeConfig.type === 'none') {
            size = "N/A";
        } else {
            const sizeValue = modalSizeSelect.value;
            if (sizeValue === 'custom') {
                size = modalSizeCustomText.value.trim() || "Personalizado (No descrito)";
            } else if (sizeValue) {
                size = sizeValue;
            }
        }
        
        packaging = modalPackagingSelect ? modalPackagingSelect.value || "No especificado" : "No especificado";
        return { size, packaging };
    }

    function sendWhatsApp() {
        if (!validateForm()) {
            showFavoritesMessage('Por favor completa todos los campos requeridos');
            return;
        }
        
        const { size, packaging } = getFormData();
        let baseMessage = `¡Hola! Me interesa el producto: *${currentProductName}*.\n\n`;
        if (size !== 'N/A') baseMessage += `*Tamaño:* ${size}\n`;
        baseMessage += `*Empaque:* ${packaging}\n*Cantidad:* ${currentQuantity}\n\nQuedo atento/a a la cotización. ¡Gracias!`;
        
        const encodedMessage = encodeURIComponent(baseMessage);
        const waNumber = "593999406153";
        const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;
        window.open(waLink, '_blank');
    }

    function sendInstagram() {
        if (!validateForm()) {
            showFavoritesMessage('Por favor completa todos los campos requeridos');
            return;
        }
        
        const { size, packaging } = getFormData();
        let message = `¡Hola! Me interesa el producto: ${currentProductName}.\n\n`;
        if (size !== 'N/A') message += `Tamaño: ${size}\n`;
        message += `Empaque: ${packaging}\nCantidad: ${currentQuantity}\n\nQuedo atento/a a la cotización. ¡Gracias!`;

        try {
            navigator.clipboard.writeText(message);
            alert("Se ha copiado el mensaje de tu pedido al portapapeles. Pégalo en el chat de Instagram. 👍");
        } catch (err) {
            alert("No se pudo copiar el mensaje. Por favor, abre Instagram y escribe tu pedido.");
        }
        
        const igLink = "https://ig.me/m/tejidosdelight";
        window.open(igLink, '_blank');
    }
    
    window.openModal = openModal;
    window.toggleFavorite = toggleFavorite;
    
    init();
});

function clearStorage() {
    localStorage.clear();
    cart = [];
    favorites = [];
    updateCartCounter();
    updateCartDisplay();
    console.log('🧹 localStorage limpiado');
    showFavoritesMessage('Storage limpiado - página se recargará');
    setTimeout(() => { location.reload(); }, 1000);
}
window.clearStorage = clearStorage;