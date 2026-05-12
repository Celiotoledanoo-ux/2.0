// --- ⚙️ CONFIG & STATE ---
const API_URL = '/api'; // Ajusta según tu proxy
const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    cart: []
};

// --- ⚡ CORE API (Optimizado) ---
const api = async (url, method = 'GET', data = null) => {
    const opts = {
        method,
        headers: { 
            'Authorization': `Bearer ${state.token}`,
            'Content-Type': 'application/json' 
        }
    };
    // Mantiene la estructura body.body para tu Zod Schema
    if (data) opts.body = JSON.stringify({ body: data });

    const res = await fetch(`${API_URL}${url}`, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Error API');
    return json;
};

// --- 🔑 AUTH ---
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target));
    
    try {
        const { data } = await api('/auth/login', 'POST', payload);
        localStorage.setItem('token', data.session.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        location.reload();
    } catch (err) {
        alert("Error: " + err.message);
    }
});

// --- 📦 INVENTARIO (Renderizado Elegante) ---
const loadInventory = async () => {
    try {
        const { data } = await api('/inventory');
        const container = document.getElementById('catalog-container');
        
        container.innerHTML = data.map(p => `
            <div class="product-card" onclick="addToCart('${p.id}', '${p.name}', ${p.price})">
                <span class="brand">${p.brand || 'Luxury'}</span>
                <h4>${p.name}</h4>
                <span class="price">$${p.price}</span>
                <small>Stock: ${p.stock}</small>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
};

// --- 🛒 CARRITO & VENTA ---
window.addToCart = (id, name, price) => {
    const item = state.cart.find(i => i.id === id);
    item ? item.qty++ : state.cart.push({ id, name, price, qty: 1 });
    renderCart();
};

const renderCart = () => {
    const cartBox = document.getElementById('cart-items');
    const totalLabel = document.getElementById('total-val');
    
    cartBox.innerHTML = state.cart.map(i => `
        <div class="summary-row">
            <span>${i.name} x${i.qty}</span>
            <span>$${(i.price * i.qty).toFixed(2)}</span>
        </div>
    `).join('');

    const total = state.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    totalLabel.innerText = `$${total.toFixed(2)}`;
};

document.getElementById('btn-pay')?.addEventListener('click', async () => {
    if (!state.cart.length) return alert("Carrito vacío");
    
    const amount = prompt(`Total: ${document.getElementById('total-val').innerText}\nEfectivo:`);
    if (!amount) return;

    try {
        const payload = {
            items: state.cart.map(i => ({ product_id: i.id, quantity: i.qty })),
            payment_method: 'CASH',
            received_amount: parseFloat(amount)
        };
        const res = await api('/sales', 'POST', payload);
        alert(`Venta Exitosa. Cambio: $${res.data.sale.change}`);
        state.cart = [];
        renderCart();
        loadInventory(); // Refresca stock
    } catch (err) { alert(err.message); }
});

// --- ⌨️ NAVEGACIÓN PRO (INSERTAR AQUÍ) ---
let selectedIndex = -1;

window.addEventListener('keydown', (e) => {
    const cards = document.querySelectorAll('.product-card');
    
    // Navegación con flechas (solo si no estás escribiendo en el buscador)
    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        if (cards.length === 0 || document.activeElement.id === 'product-search') return;
        e.preventDefault();
        if (selectedIndex >= 0) cards[selectedIndex].classList.remove('selected');

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % cards.length;
        } else {
            selectedIndex = (selectedIndex - 1 + cards.length) % cards.length;
        }

        cards[selectedIndex].classList.add('selected');
        cards[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // Enter para seleccionar el producto marcado
    if (e.key === 'Enter' && document.activeElement.id !== 'product-search') {
        if (selectedIndex >= 0) cards[selectedIndex].click();
    }
});

// --- 🔍 FILTRO EN TIEMPO REAL ---
document.getElementById('product-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    selectedIndex = -1; // Resetea selección al buscar

    cards.forEach(card => {
        const name = card.querySelector('h4').innerText.toLowerCase();
        const brand = card.querySelector('.brand').innerText.toLowerCase();
        // Muestra/Oculta si coincide el nombre o la marca
        card.style.display = (name.includes(term) || brand.includes(term)) ? 'block' : 'none';
    });
});

// --- 🚀 INIT ---
if (state.token) {
    loadInventory();
    // Atajos de teclado Pro
    window.onkeydown = (e) => {
        if(e.key === 'F2') document.getElementById('product-search').focus();
        if(e.key === 'F8') document.getElementById('btn-pay').click();
    };
}
