// ===========================================
// LÓGICA DEL CARRITO (js/cart.js)
// ===========================================

// 1. Funciones de UTILIDAD
// -------------------------------------------

/** Carga el carrito desde el almacenamiento local. */
function getCart() {
    const cart = localStorage.getItem('agroManantialCart');
    return cart ? JSON.parse(cart) : [];
}

/** Guarda el carrito en el almacenamiento local. */
function saveCart(cart) {
    localStorage.setItem('agroManantialCart', JSON.stringify(cart));
}

/** Actualiza el contador de productos en el icono del carrito. */
function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = totalItems;
    });
}

// 2. Funciones de MANEJO DEL CARRITO (Añadir/Eliminar)
// --------------------------------------------------------

/**
 * Añade un producto al carrito.
 * @param {string} name - Nombre del producto.
 * @param {string} price - Precio del producto (como string con el marcador ₡).
 */
function addToCart(name, price) {
    let cart = getCart();
    // Limpiamos el precio para el cálculo (asumiendo que tiene el formato ₡XXX)
    const numericPrice = parseFloat(price.replace('₡', '').replace('.', '').replace(',', ''));
    
    // Si el producto ya existe, incrementamos la cantidad
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Si es nuevo, lo añadimos
        cart.push({
            name: name,
            price: numericPrice, // Almacenamos el precio como número para cálculo
            priceText: price,    // Almacenamos el texto original para mostrar
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartBadge();

    // Feedback al usuario (opcional: alerta simple)
    alert(`"${name}" añadido al carrito.`);
}

/**
 * Elimina o reduce la cantidad de un producto.
 * @param {string} name - Nombre del producto a modificar.
 * @param {number} delta - Cambio en la cantidad (-1 para reducir, -999 para eliminar).
 */
function changeQuantity(name, delta) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.name === name);

    if (itemIndex > -1) {
        const item = cart[itemIndex];

        if (delta === -999 || item.quantity + delta <= 0) {
            // Eliminar el producto si delta es -999 o la cantidad llega a cero
            cart.splice(itemIndex, 1);
        } else {
            // Ajustar la cantidad
            item.quantity += delta;
        }

        saveCart(cart);
        updateCartBadge();
        
        // Si estamos en la página del carrito, la volvemos a renderizar
        if (window.location.pathname.includes('cart.html')) {
            renderCart();
        }
    }
}


// 3. LÓGICA de RENDERIZADO y EVENTOS
// ------------------------------------------

/** Renderiza la lista de productos en la página cart.html */
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cart = getCart();
    let subtotal = 0;
    
    if (!cartItemsContainer) return; // Salir si no estamos en cart.html

    cartItemsContainer.innerHTML = ''; // Limpia el contenedor

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío. ¡Añade algunos productos!</p>';
        document.getElementById('cart-subtotal').textContent = '₡0.00';
        document.getElementById('cart-total').textContent = '₡0.00';
        document.getElementById('checkout-button').disabled = true;
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item-card';
        cartItemDiv.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <span class="item-price">Precio Unitario: ${item.priceText}</span>
            </div>
            <div class="item-controls">
                <button class="quantity-btn remove-one" data-name="${item.name}">-</button>
                <span class="item-quantity">${item.quantity}</span>
                <button class="quantity-btn add-one" data-name="${item.name}">+</button>
            </div>
            <div class="item-total">
                <p>Total: ₡${itemTotal.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <button class="remove-item-btn" data-name="${item.name}">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });
    
    // Formato de moneda para Costa Rica
    const formatCurrency = (amount) => {
        return `₡${amount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Actualizar resumen
    document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cart-total').textContent = formatCurrency(subtotal); // Por ahora, total es igual a subtotal
    document.getElementById('checkout-button').disabled = false;
    
    // Asignar eventos a los botones dentro del carrito
    cartItemsContainer.querySelectorAll('.add-one').forEach(button => {
        button.addEventListener('click', () => changeQuantity(button.dataset.name, 1));
    });
    cartItemsContainer.querySelectorAll('.remove-one').forEach(button => {
        button.addEventListener('click', () => changeQuantity(button.dataset.name, -1));
    });
    cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', () => changeQuantity(button.dataset.name, -999));
    });
    
    // Asignar evento al botón de Finalizar Pedido
    document.getElementById('checkout-button').addEventListener('click', generateWhatsAppLink);
}

/** Genera el link de WhatsApp con el resumen del pedido. */
function generateWhatsAppLink() {
    const cart = getCart();
    if (cart.length === 0) return;
    
    const storeNumber = '50689122562'; // Número de teléfono de AgroManantial
    
    let message = '¡Hola! Me gustaría hacer un pedido en AgroManantial:\n\n';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        message += `* ${item.name} x${item.quantity} (Total estimado: ₡${itemTotal.toLocaleString('es-CR')})\n`;
    });
    
    message += `\n---`;
    message += `\n*Subtotal Estimado: ₡${subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`;
    message += `\n\nPor favor, confírmenme el precio final, el costo de envío y la disponibilidad. ¡Gracias!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${storeNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}


// 4. INICIALIZACIÓN GLOBAL
// ------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // A) Inicializar el contador del carrito en todas las páginas
    updateCartBadge();

    // B) Asignar el evento a todos los botones "Añadir al Carrito"
    const addCartButtons = document.querySelectorAll('.button-add-cart');
    addCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Buscamos el elemento padre <article class="product-card">
            const productCard = event.target.closest('.product-card');
            if (productCard) {
                // Obtenemos los datos del producto usando los marcadores de posición (Nombre y Precio)
                const nameElement = productCard.querySelector('h4');
                const priceElement = productCard.querySelector('.price');
                
                // Extraemos los textos de los marcadores (ej: (Nombre Producto X) y (Precio X))
                const productName = nameElement ? nameElement.textContent.trim() : 'Producto Desconocido';
                const productPrice = priceElement ? priceElement.textContent.trim().replace('(Precio ', '₡').replace(')', '.00') : '₡0.00';
                
                // NOTA IMPORTANTE: Ya que los precios son marcadores, asumimos que
                // el usuario los reemplazará con un formato numérico válido (ej: ₡15.000,00)
                // Usamos la limpieza básica definida en addToCart.
                
                addToCart(productName, productPrice);
            }
        });
    });

    // C) Si estamos en la página del carrito, renderizamos los ítems.
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
});