// =================================================================
// ARCHIVO main.js (CORREGIDO para usar el SELECT de Tamaño)
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

    // --- Inputs Estándar (Tamaño) - MODIFICADO ---
    // Estas son las variables para tu nuevo <select> en amigurumis.html
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
    let editingCartItemName = ""; // Almacenará el 'identifier' único
    let currentSizeConfig = {};
    let currentPackagingConfig = {};
    
    // --- Nuevas variables para funcionalidades mejoradas ---
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
    
    // --- Función para inicializar todas las funcionalidades ---
    function init() {
        loadCartFromStorage();
        loadFavoritesFromStorage();
        updateCartCounter();
        updateCartDisplay();
        setupEventListeners();
        setupPaymentMethods();
        setupLogoAnimation();
    }
    
    // --- Configurar todos los event listeners ---
    function setupEventListeners() {
        // Event listeners existentes
        productLinks.forEach(link => {
            link.addEventListener('click', openModal);
        });

        modalCloseBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
        
        // Listeners de formularios (MODIFICADO)
        // Ya no escuchamos a los radios, escuchamos al <select>
        if (modalSizeSelect) modalSizeSelect.addEventListener('change', updateAddToCartButton);
        if (modalSizeCustomText) modalSizeCustomText.addEventListener('input', updateAddToCartButton);
        
        if (waButton) waButton.addEventListener('click', sendWhatsApp);
        if (igButton) igButton.addEventListener('click', sendInstagram);
        
        // Listeners para cantidad
        if (quantityDecrease) quantityDecrease.addEventListener('click', decreaseQuantity);
        if (quantityIncrease) quantityIncrease.addEventListener('click', increaseQuantity);
        if (quantityInput) quantityInput.addEventListener('input', updateQuantity);
        if (quantityInput) quantityInput.addEventListener('change', validateQuantity);
        
        // Nuevos event listeners
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
        
        // Listeners para validación en tiempo real (MODIFICADO)
        if (modalSizeCustomInput) {
            modalSizeCustomInput.addEventListener('input', updateAddToCartButton);
        }
        if (modalPackagingSelect) {
            modalPackagingSelect.addEventListener('change', updateAddToCartButton);
        }

        // Listener para el botón de añadir al carrito en el modal
        if (modalAddToCartBtn) {
            modalAddToCartBtn.addEventListener('click', addToCartFromModal);
        }
        
        // Event delegation para botones de favoritos y agregar al carrito
        document.addEventListener('click', function(e) {
            // Botones de favoritos
            if (e.target.closest('.favorite-btn')) {
                e.preventDefault();
                const productCard = e.target.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('.precio').textContent;
                const productImg = productCard.querySelector('img').src;
                
                toggleFavorite(productName, productPrice, productImg, e.target.closest('.favorite-btn'));
            }
            
            // Botones de agregar al carrito desde tarjetas
            if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault();
                const productCard = e.target.closest('.product-card');
                const viewBtn = productCard.querySelector('.view-btn');
                
                if (viewBtn) {
                    viewBtn.click();
                }
            }
            
            // Botones de ver detalles
            if (e.target.closest('.view-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.view-btn');
                if (btn.classList.contains('product-link')) {
                    openModal.call(btn, e);
                }
            }

            // Controles de cantidad en el carrito
            if (e.target.closest('.cart-quantity-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.cart-quantity-btn');
                const cartItem = btn.closest('.cart-item');
                const itemIdentifier = cartItem.dataset.identifier; // Usar data-attribute
                const isIncrease = btn.textContent === '+';
                
                updateCartItemQuantity(itemIdentifier, isIncrease);
            }

            // Selectores de método de pago
            if (e.target.closest('.payment-option')) {
                const option = e.target.closest('.payment-option');
                selectPaymentMethod(option.dataset.method);
            }
            
            // Botones de editar producto en el carrito
            if (e.target.closest('.cart-item-edit')) {
                e.preventDefault();
                const btn = e.target.closest('.cart-item-edit');
                editCartItem(btn.dataset.identifier);
            }

            // Botones de eliminar producto en el carrito
            if (e.target.closest('.cart-item-remove')) {
                e.preventDefault();
                const btn = e.target.closest('.cart-item-remove');
                removeFromCart(btn.dataset.identifier);
            }
        });
    }

    // --- Animación del logo ---
    function setupLogoAnimation() {
        const logo = document.getElementById('logo');
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                logo.style.transform = 'scale(1.1)';
            });
            
            logo.addEventListener('mouseleave', () => {
                logo.style.transform = 'scale(1)';
            });
            
            logo.addEventListener('click', () => {
                logo.style.transform = 'scale(1.15)';
                setTimeout(() => {
                    logo.style.transform = 'scale(1)';
                }, 300);
            });
        }
    }

    // --- Funciones de cantidad ---
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

    // --- Funciones de método de pago ---
    function setupPaymentMethods() {
        // Seleccionar WhatsApp por defecto
        selectPaymentMethod('whatsapp');
    }

    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;
        
        // Actualizar UI
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
            
            // Actualizar texto y estilo según método seleccionado
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
    
    // --- Funcionalidad de búsqueda ---
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
    
    // --- Funcionalidad de filtrado por categoría ---
    function filterByCategory(e) {
        const category = e.target.dataset.category;
        
        // Actualizar botones activos
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
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
    
    // --- Funcionalidad de favoritos ---
    function toggleFavorite(name, price, img, button) {
        const existingIndex = favorites.findIndex(item => item.name === name);
        
        if (existingIndex !== -1) {
            // Quitar de favoritos
            favorites.splice(existingIndex, 1);
            button.classList.remove('active');
            showFavoritesMessage('Producto eliminado de favoritos');
        } else {
            // Agregar a favoritos
            favorites.push({ name, price, img });
            button.classList.add('active');
            showFavoritesMessage('Producto agregado a favoritos');
        }
        
        saveFavoritesToStorage();
    }
    
    // Mostrar mensaje de favoritos
    function showFavoritesMessage(message) {
        if (favoritesMessage) {
            favoritesMessage.textContent = message;
            favoritesMessage.classList.add('show');
            
            setTimeout(() => {
                favoritesMessage.classList.remove('show');
            }, 2000);
        }
    }
    
    // --- Funcionalidad del carrito ---
    function addToCart(name, price, img, details = '', quantity = 1, size = '', packaging = '') {
        console.log('🛒 addToCart llamado con:', {
            name, price, details, quantity, size, packaging
        });
        
        let optimizedImg = img;
        if (img && img.startsWith('data:image')) {
            optimizedImg = 'imagenes/personalizado.jpg';
        }

        // Crear un identificador único para el item
        const itemIdentifier = name + size + packaging;
        
        // Si estamos editando, actualizar el producto existente
        if (isEditingCartItem) {
            console.log('✏️ Editando producto existente:', editingCartItemName);
            const itemIndex = cart.findIndex(item => item.identifier === editingCartItemName);
            if (itemIndex !== -1) {
                cart[itemIndex] = {
                    ...cart[itemIndex], // Mantener datos antiguos si no se proveen
                    name: name,
                    price: price,
                    img: optimizedImg,
                    details: details,
                    quantity: quantity,
                    size: size,
                    packaging: packaging,
                    identifier: itemIdentifier // Actualizar identificador
                };
                
                // Resetear estado de edición
                isEditingCartItem = false;
                editingCartItemName = "";
                console.log('✅ Producto editado exitosamente');
            } else {
                console.log('❌ No se encontró producto para editar con identifier:', editingCartItemName);
            }
        } else {
            // Buscar si ya existe un producto con el mismo ID único
            const existingIndex = cart.findIndex(item => 
                item.identifier === itemIdentifier
            );
            
            if (existingIndex !== -1) {
                // Actualizar cantidad si ya existe
                console.log('📦 Producto existente, actualizando cantidad');
                cart[existingIndex].quantity += quantity;
            } else {
                // Agregar nuevo producto
                console.log('🆕 Agregando nuevo producto al carrito');
                cart.push({
                    name,
                    price,
                    img: optimizedImg,
                    details,
                    quantity: quantity,
                    size: size,
                    packaging: packaging,
                    identifier: itemIdentifier // Guardar identificador
                });
            }
        }
        
        console.log('🛒 Carrito actual:', cart);
        
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        updateCheckoutButton();
        
        // Animación del contador
        if (cartCounter) {
            cartCounter.classList.add('pulse');
            setTimeout(() => {
                cartCounter.classList.remove('pulse');
            }, 1000);
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
                    // Eliminar si la cantidad llega a 0
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
    
    // --- Función para abrir/cerrar carrito ---
    function toggleCart(forceClose = false) {
        if (cartSidebar && overlay) {
            if (forceClose) {
                // Forzar cierre
                cartSidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                // Toggle normal
                cartSidebar.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
            }
        }
    }
    
    // --- Función para editar producto en el carrito ---
    function editCartItem(itemIdentifier) {
        const item = cart.find(item => item.identifier === itemIdentifier);
        
        if (item) {
            // Cerrar el carrito primero
            toggleCart(true); // true para forzar cierre
            
            // Buscar el botón de vista correspondiente en la página
            const productCards = document.querySelectorAll('.product-card');
            let viewBtn = null;
            
            productCards.forEach(card => {
                if (card.querySelector('h3').textContent === item.name) {
                    viewBtn = card.querySelector('.view-btn');
                }
            });
            
            if (viewBtn) {
                // Configurar estado de edición
                isEditingCartItem = true;
                editingCartItemName = itemIdentifier; // Usar el identifier
                
                // Abrir el modal con el producto después de un pequeño delay
                setTimeout(() => {
                    viewBtn.click();
                    
                    // Pre-cargar los valores actuales del producto
                    setTimeout(() => {
                        // --- LÓGICA DE PRE-CARGA MODIFICADA ---
                        if (item.size && item.size !== "No especificado") {
                            // Intentar encontrar el valor en el select
                            let foundInSelect = false;
                            if (modalSizeSelect) {
                                for (let option of modalSizeSelect.options) {
                                    if (option.value === item.size) {
                                        option.selected = true;
                                        foundInSelect = true;
                                        break;
                                    }
                                }
                            }
                            
                            // Si no se encontró, es un tamaño personalizado
                            if (!foundInSelect && modalSizeSelect) {
                                modalSizeSelect.value = "custom"; // Seleccionar "Otro"
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
                        
                        // Actualizar el texto del botón
                        if (modalAddToCartBtn) {
                            modalAddToCartBtn.textContent = '🛒 Actualizar Producto';
                        }
                        // Re-validar el botón
                        updateAddToCartButton(); 

                    }, 100);
                }, 300); // Pequeño delay para que se cierre el carrito primero
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
            // Guardar el identifier en el elemento para los botones
            itemElement.dataset.identifier = item.identifier;
            
            // Calcular precio numérico
            const priceValue = parseFloat(item.price.replace('$', '')) || 0;
            const itemTotal = priceValue * item.quantity;
            total += itemTotal;
            
            // Crear descripción unificada
            let description = '';
            if (item.size && item.size !== "No especificado") {
                description += `<div class="cart-item-detail"><strong>Tamaño:</strong> ${item.size}</div>`;
            }
            if (item.packaging && item.packaging !== "No especificado") {
                description += `<div class="cart-item-detail"><strong>Empaque:</strong> ${item.packaging}</div>`;
            }
            
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">
                        ${description}
                    </div>
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
        
        // Los listeners ahora se manejan por delegación en setupEventListeners
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
            if (item.size && item.size !== "No especificado") {
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
            // Instagram - copiar al portapapeles
            try {
                navigator.clipboard.writeText(message);
                alert("✅ Se ha copiado tu pedido al portapapeles. Ahora abre Instagram y pégalo en nuestro chat @tejidosdelight");
                const igLink = "https://www.instagram.com/tejidosdelight/";
                window.open(igLink, '_blank');
            } catch (err) {
                alert("No se pudo copiar el mensaje. Por favor, abre Instagram y escribe tu pedido manualmente.");
            }
        }
        
        // Limpiar carrito después del pedido
        cart = [];
        saveCartToStorage();
        updateCartCounter();
        updateCartDisplay();
        updateCheckoutButton();
        toggleCart(true); // Cerrar carrito después del pedido
    }
    
    // --- Almacenamiento local ---
    function saveCartToStorage() {
        try {
            const cartToSave = cart.map(item => ({
                ...item,
                img: item.img && item.img.startsWith('data:image') ? 'imagenes/personalizado.jpg' : item.img
            }));
            
            localStorage.setItem('tejidosDelightCart', JSON.stringify(cartToSave));
            console.log('💾 Carrito guardado exitosamente');
        } catch (error) {
            console.error('❌ Error guardando carrito:', error);
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ localStorage lleno, limpiando carrito antiguo');
                localStorage.removeItem('tejidosDelightCart');
                const limitedCart = cart.slice(-5);
                try {
                    localStorage.setItem('tejidosDelightCart', JSON.stringify(limitedCart));
                    console.log('💾 Carrito limitado guardado (últimos 5 items)');
                } catch (e) {
                    console.error('❌ No se pudo guardar el carrito incluso limitado');
                }
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
                    // Asegurar que cada item tenga un 'identifier'
                    if (!item.identifier) {
                        item.identifier = item.name + (item.size || '') + (item.packaging || '');
                    }
                });
                console.log('📥 Carrito cargado:', cart.length, 'productos');
            }
        } catch (e) {
            console.error('❌ Error loading cart:', e);
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
    
    // --- Funciones del modal ---
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
        
        // Asegurar valores mínimos
        if (!currentSizeConfig.type) { currentSizeConfig.type = 'customizable'; }
        if (!currentSizeConfig.options) { currentSizeConfig.options = ['10cm', '15cm', '20cm']; }
        if (!currentSizeConfig.defaultValue) { currentSizeConfig.defaultValue = currentSizeConfig.options[0]; }
        if (!currentPackagingConfig.type) { currentPackagingConfig.type = 'customizable'; }
        if (!currentPackagingConfig.options) { currentPackagingConfig.options = ['Caja con visor', 'Bolsa de papel']; }
        if (!currentPackagingConfig.defaultValue) { currentPackagingConfig.defaultValue = currentPackagingConfig.options[0]; }
        
        // --- LÓGICA DE TAMAÑO (MODIFICADA) ---
        if (formSizeStandard && modalSizeSelect) {
            formSizeStandard.style.display = 'block';
            
            // 1. Limpiar el select y el input de texto
            modalSizeSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción...</option>';
            modalSizeCustomText.value = '';
            modalSizeCustomContainer.style.display = 'none';

            // 2. Llenar el select con las opciones del producto
            if (currentSizeConfig.type === 'fixed') {
                // Si es fijo, solo poner esa opción
                const optionElement = document.createElement('option');
                optionElement.value = currentSizeConfig.value || "Tamaño único";
                optionElement.textContent = currentSizeConfig.value || "Tamaño único";
                modalSizeSelect.appendChild(optionElement);
                modalSizeSelect.value = optionElement.value; // Seleccionarlo
            } else {
                // Si es personalizable, poner las opciones
                if (currentSizeConfig.options && currentSizeConfig.options.length > 0) {
                    currentSizeConfig.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        modalSizeSelect.appendChild(optionElement);
                    });
                }
                 // 3. (CLAVE) Solo añadir "Personalizado" si el tipo de producto es "custom"
                if (currentProductType === 'custom') {
                    const customOption = document.createElement('option');
                    customOption.value = "custom"; // Valor especial
                    customOption.textContent = "Otro (Personalizado)";
                    modalSizeSelect.appendChild(customOption);
                }
            }

            // 4. Seleccionar valor por defecto si no es fijo
            if (currentSizeConfig.type !== 'fixed' && currentSizeConfig.defaultValue) {
                // Asegurarse de que el defaultValue exista como opción
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

            // 5. Añadir listener para mostrar/ocultar el input de texto
            modalSizeSelect.onchange = () => {
                if (modalSizeSelect.value === 'custom') {
                    modalSizeCustomContainer.style.display = 'block';
                } else {
                    modalSizeCustomContainer.style.display = 'none';
                }
                updateAddToCartButton(); // Validar al cambiar
            };
        }
        
        if (formSizeCustom) formSizeCustom.style.display = 'none'; // Ocultar el formulario antiguo

        
        // --- Configurar formulario de empaque ---
        if (modalPackagingSelect) {
            modalPackagingSelect.innerHTML = '<option value="" disabled selected>Selecciona una opción...</option>';
            
            if (currentPackagingConfig.type === 'fixed') {
                // Empaque fijo
                modalPackagingSelect.innerHTML = `<option value="${currentPackagingConfig.value}" selected>${currentPackagingConfig.value}</option>`;
                modalPackagingSelect.disabled = true;
            } else {
                // Empaque personalizable
                modalPackagingSelect.disabled = false;
                if (currentPackagingConfig.options && currentPackagingConfig.options.length > 0) {
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
        
        // Resetear cantidad
        updateQuantityDisplay();
        
        // Remover highlights de error
        removeErrorHighlights();
        
        // Ocultar mensajes de error
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
        });
        
        // --- Lógica condicional para mostrar/ocultar ---
        if (formPackaging) formPackaging.style.display = 'block';

        if (currentProductType === 'custom') {
            if (instructionsStandard) instructionsStandard.style.display = 'none';
            if (instructionsCustom) instructionsCustom.style.display = 'block';
        } else {
            if (instructionsStandard) instructionsStandard.style.display = 'block';
            if (instructionsCustom) instructionsCustom.style.display = 'none';
        }
        
        // Si no estamos editando, resetear el texto del botón
        if (!isEditingCartItem && modalAddToCartBtn) {
            modalAddToCartBtn.textContent = '🛒 Añadir al Carrito';
        }
        
        // Actualizar estado del botón
        setTimeout(updateAddToCartButton, 100);
        
        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
        
        // Resetear estado de edición al cerrar el modal
        isEditingCartItem = false;
        editingCartItemName = "";
    }

    // --- FUNCIÓN toggleCustomSize ELIMINADA (ya no se usa) ---
    
    // --- Función para validar formulario ---
    function validateForm() {
        console.log('🔍 Validando formulario...');
        let isValid = true;
        
        // Remover highlights anteriores
        removeErrorHighlights();
        
        // Ocultar mensajes de error anteriores
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
        });
        
        // Validar tamaño (MODIFICADO)
        const sizeValue = modalSizeSelect.value;
        if (!sizeValue) {
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
        
        // Validar empaque
        const packaging = modalPackagingSelect ? modalPackagingSelect.value : '';
        console.log('📦 Empaque seleccionado:', packaging);
        
        if (!packaging) {
            console.log('❌ No se seleccionó empaque');
            const errorElement = document.getElementById('error-packaging');
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = 'Por favor selecciona un tipo de empaque';
            }
            if (modalPackagingSelect) modalPackagingSelect.classList.add('error-highlight');
            isValid = false;
        }
        
        console.log('🎯 Resultado validación:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
        return isValid;
    }

    function removeErrorHighlights() {
        document.querySelectorAll('.error-highlight').forEach(element => {
            element.classList.remove('error-highlight');
        });
    }

    // --- Función para añadir al carrito desde el modal ---
    function addToCartFromModal() {
        console.log('🔴 addToCartFromModal llamado');
        
        if (!validateForm()) {
            console.log('❌ Validación falló');
            showFavoritesMessage('Por favor completa todos los campos requeridos');
            return; 
        }
        
        console.log('✅ Validación pasó');
        
        const { size, packaging } = getFormData();
        console.log('📦 Datos del formulario:', { size, packaging });
        
        const productDetails = `
        Tamaño: ${size}
        Empaque: ${packaging}
        `.trim();
        
        console.log('🛒 Llamando a addToCart con:', {
            name: currentProductName,
            price: modalPrice.textContent,
            details: productDetails,
            quantity: currentQuantity,
            size: size,
            packaging: packaging
        });
        
        addToCart(currentProductName, modalPrice.textContent, modalImg.src, productDetails, currentQuantity, size, packaging);
        
        // Mostrar confirmación
        if (modalAddToCartBtn) {
            console.log('✅ Producto agregado, mostrando confirmación');
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
    
    // --- Función para actualizar estado del botón ---
    function updateAddToCartButton() {
        console.log('🔄 Actualizando botón añadir al carrito');
        
        if (modalAddToCartBtn) {
            // Habilitar/deshabilitar basado en validación básica (MODIFICADO)
            const packaging = modalPackagingSelect ? modalPackagingSelect.value : '';
            const sizeValue = modalSizeSelect ? modalSizeSelect.value : '';
            let sizeValid = false;
    
            if (sizeValue === 'custom') {
                sizeValid = modalSizeCustomText.value.trim() !== '';
            } else if (sizeValue !== '') {
                sizeValid = true;
            }
            
            const isEnabled = sizeValid && !!packaging; // Usar !!packaging para convertir a booleano
            console.log('🎯 Estado del botón:', isEnabled ? '✅ HABILITADO' : '❌ DESHABILITADO', {
                sizeValid,
                packaging: packaging || 'NO SELECCIONADO'
            });
            
            modalAddToCartBtn.disabled = !isEnabled;
        }
    }
    
    function getFormData() {
        console.log('📋 Obteniendo datos del formulario...');
        let size = "No especificado";
        let packaging = "No especificado";

        // 1. Obtener TAMAÑO (MODIFICADO)
        const sizeValue = modalSizeSelect.value;
        if (sizeValue === 'custom') {
            size = modalSizeCustomText.value.trim() || "Personalizado (No descrito)";
        } else if (sizeValue) {
            size = sizeValue;
        }
        
        // 2. Obtener EMPAQUE
        packaging = modalPackagingSelect ? modalPackagingSelect.value || "No especificado" : "No especificado";
        console.log('📦 Empaque:', packaging);
        
        console.log('📊 Datos finales:', { size, packaging });
        return { size, packaging };
    }

    function sendWhatsApp() {
        // Validar formulario antes de enviar
        if (!validateForm()) {
            showFavoritesMessage('Por favor completa todos los campos requeridos');
            return;
        }
        
        const { size, packaging } = getFormData();
        
        const baseMessage = `¡Hola! Me interesa el producto: *${currentProductName}*.\n\n*Tamaño:* ${size}\n*Empaque:* ${packaging}\n\Dosificación:* ${currentQuantity}\n\nQuedo atento/a a la cotización. ¡Gracias!`;
        const encodedMessage = encodeURIComponent(baseMessage);
        const waNumber = "593999406153";
        
        const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;
        window.open(waLink, '_blank');
    }

    function sendInstagram() {
        // Validar formulario antes de enviar
        if (!validateForm()) {
            showFavoritesMessage('Por favor completa todos los campos requeridos');
            return;
        }
        
        const { size, packaging } = getFormData();
        const message = `¡Hola! Me interesa el producto: ${currentProductName}.\n\nTamaño: ${size}\nEmpaque: ${packaging}\nCantidad: ${currentQuantity}\n\nQuedo atento/a a la cotización. ¡Gracias!`;

        try {
            navigator.clipboard.writeText(message);
            alert("Se ha copiado el mensaje de tu pedido al portapapeles. Pégalo en el chat de Instagram. 👍");
        } catch (err) {
            alert("No se pudo copiar el mensaje. Por favor, abre Instagram y escribe tu pedido.");
        }
        
        const igLink = "https://ig.me/m/tejidosdelight";
        window.open(igLink, '_blank');
    }
    
    // Hacer funciones globales para que products-loader.js pueda acceder a ellas
    window.openModal = openModal;
    window.toggleFavorite = toggleFavorite;
    
    // Inicializar la aplicación
    init();
});

// Función para limpiar localStorage manually (útil para debugging)
function clearStorage() {
    localStorage.clear();
    cart = [];
    favorites = [];
    updateCartCounter();
    updateCartDisplay();
    console.log('🧹 localStorage limpiado');
    showFavoritesMessage('Storage limpiado - página se recargará');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Hacerla disponible globalmente para debugging
window.clearStorage = clearStorage;