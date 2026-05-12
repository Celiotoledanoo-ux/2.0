// ======================================================
// ⚙️ GLAM POS - SCRIPT FINAL INTEGRADO
// ======================================================

// ---------------- CONFIG ----------------
const API_URL = '/api/v1';

const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: [],
    selectedIndex: -1,
    currentView: 'pos'
};

// ---------------- DOM CACHE ----------------
const DOM = {
    catalog: document.getElementById('catalog-container'),
    cartItems: document.getElementById('cart-items'),
    subtotal: document.getElementById('subtotal-val'),
    tax: document.getElementById('tax-val'),
    total: document.getElementById('total-val'),
    payBtn: document.getElementById('btn-pay'),
    search: document.getElementById('product-search'),
    clock: document.getElementById('live-clock'),
    avatar: document.getElementById('user-avatar'),
    clearCart: document.getElementById('clear-cart'),
    navItems: document.querySelectorAll('.nav-links li')
};

// ======================================================
// ⚡ API CORE
// ======================================================
const apiFetch = async (endpoint, method = 'GET', payload = null) => {

    const opts = {
        method,
        headers: {
            'Authorization': `Bearer ${state.token}`,
            'Content-Type': 'application/json'
        }
    };

    if (payload) {
        opts.body = JSON.stringify({ body: payload });
    }

    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.message || 'Error API');
    }

    return json;
};

// ======================================================
// 🕒 LIVE CLOCK
// ======================================================
const initClock = () => {
    const update = () => {
        const now = new Date();
        DOM.clock.textContent = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    update();
    setInterval(update, 1000);
};

// ======================================================
// 👤 USER UI
// ======================================================
const initUser = () => {
    if (!state.user) return;

    const initials = state.user.name
        ? state.user.name.split(' ').map(n => n[0]).join('')
        : 'U';

    DOM.avatar.textContent = initials.toUpperCase();
};

// ======================================================
// 📦 INVENTORY
// ======================================================
const loadInventory = async () => {

    try {
        const { data } = await apiFetch('/inventory');
        renderInventory(data);

    } catch (err) {
        console.error(err);
    }
};

const renderInventory = (products) => {

    if (!DOM.catalog) return;

    DOM.catalog.innerHTML = products.map(p => `
        <div class="product-card"
            data-id="${p.id}"
            data-name="${p.name}"
            data-price="${p.price}">

            <span class="brand">${p.brand || 'GLAM'}</span>
            <h4>${p.name}</h4>
            <span class="price">$${p.price}</span>
            <small>Stock: ${p.stock}</small>

        </div>
    `).join('');

    document.querySelectorAll('.product-card')
        .forEach(card => {
            card.onclick = () => {
                addToCart({
                    id: card.dataset.id,
                    name: card.dataset.name,
                    price: parseFloat(card.dataset.price)
                });
            };
        });
};

// ======================================================
// 🛒 CART
// ======================================================
const addToCart = (product) => {

    const item = state.cart.find(i => i.id === product.id);

    if (item) item.qty++;
    else state.cart.push({ ...product, qty: 1 });

    renderCart();
};

const renderCart = () => {

    let subtotal = 0;

    DOM.cartItems.innerHTML = state.cart.map(i => {

        const totalItem = i.price * i.qty;
        subtotal += totalItem;

        return `
            <div class="summary-row">
                <span>${i.name} x${i.qty}</span>
                <span>$${totalItem.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    DOM.subtotal.textContent = `$${subtotal.toFixed(2)}`;
    DOM.tax.textContent = `$${tax.toFixed(2)}`;
    DOM.total.textContent = `$${total.toFixed(2)}`;
};

// ======================================================
// 💳 CHECKOUT
// ======================================================
const checkout = async () => {

    if (!state.cart.length) {
        return alert('Carrito vacío');
    }

    const amount = prompt(
        `Total: ${DOM.total.textContent}\nEfectivo:`
    );

    if (!amount) return;

    const payload = {
        items: state.cart.map(i => ({
            product_id: i.id,
            quantity: i.qty
        })),
        payment_method: 'CASH',
        received_amount: parseFloat(amount)
    };

    try {

        const res = await apiFetch('/sales', 'POST', payload);

        alert(
            `Venta exitosa\nCambio: $${res.data.sale.change || 0}`
        );

        state.cart = [];
        renderCart();
        loadInventory();

    } catch (err) {
        alert(err.message);
    }
};

// ======================================================
// 🔍 SEARCH FILTER
// ======================================================
DOM.search?.addEventListener('input', (e) => {

    const term = e.target.value.toLowerCase();

    document.querySelectorAll('.product-card')
        .forEach(card => {

            const name = card.dataset.name.toLowerCase();
            const brand = card.querySelector('.brand').textContent.toLowerCase();

            const show =
                name.includes(term) ||
                brand.includes(term);

            card.style.display = show ? 'block' : 'none';
        });
});

// ======================================================
// ⌨️ KEYBOARD UX PRO
// ======================================================
window.addEventListener('keydown', (e) => {

    const cards = [
        ...document.querySelectorAll('.product-card')
    ].filter(c => c.style.display !== 'none');

    if (['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)) {

        if (!cards.length || document.activeElement === DOM.search) return;

        e.preventDefault();

        if (state.selectedIndex >= 0) {
            cards[state.selectedIndex]?.classList.remove('selected');
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            state.selectedIndex = (state.selectedIndex + 1) % cards.length;
        } else {
            state.selectedIndex = (state.selectedIndex - 1 + cards.length) % cards.length;
        }

        cards[state.selectedIndex]?.classList.add('selected');
        cards[state.selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (e.key === 'Enter' && document.activeElement !== DOM.search) {
        cards[state.selectedIndex]?.click();
    }

    if (e.key === 'F2') DOM.search?.focus();
    if (e.key === 'F8') checkout();
});

// ======================================================
// 🧭 SPA NAVIGATION
// ======================================================
DOM.navItems.forEach(item => {

    item.addEventListener('click', () => {

        DOM.navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        state.currentView = item.dataset.view;

        if (state.currentView === 'pos') loadInventory();
        if (state.currentView === 'inventory') alert('Vista inventario no implementada aún');
    });
});

// ======================================================
// 🧹 CLEAR CART
// ======================================================
DOM.clearCart?.addEventListener('click', () => {
    state.cart = [];
    renderCart();
});

// ======================================================
// 💳 PAY BUTTON
// ======================================================
DOM.payBtn?.addEventListener('click', checkout);

// ======================================================
// 🚀 INIT
// ======================================================
const init = async () => {

    initClock();
    initUser();

    if (state.token) {
        await loadInventory();
    }
};

init();