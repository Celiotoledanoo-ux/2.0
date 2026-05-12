const API_URL = '/api/v1';
let state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: []
};

// 📡 MOTOR DE PETICIONES
const apiFetch = async (endpoint, method = 'GET', payload = null) => {
    const opts = {
        method,
        headers: { 'Authorization': `Bearer ${state.token}`, 'Content-Type': 'application/json' }
    };
    if (payload) opts.body = JSON.stringify({ body: payload });
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Fallo en la conexión');
    return json;
};

// 🔑 LOGIN & AUTH
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const json = await res.json();
            if (json.status === 'success') {
                localStorage.setItem('token', json.data.session.accessToken);
                localStorage.setItem('user', JSON.stringify(json.data.user));
                location.reload();
            } else { alert("Credenciales incorrectas"); }
        } catch (err) { alert("El servidor de Render está despertando..."); }
    };
}

function checkAuth() {
    if (state.token && state.user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-system').classList.remove('hidden');
        document.getElementById('user-display').innerText = `${state.user.role}: ${state.user.name}`;
        window.showModule('pos');
    }
}

// 🛒 SISTEMA POS
window.handlePosSearch = async (e) => {
    if (e.key === 'Enter') {
        const sku = e.target.value.trim();
        try {
            const res = await apiFetch(`/inventory?sku=${sku}`);
            const product = res.data.products[0]; // Ajustado a tu repo que devuelve array
            if (product) {
                const item = state.cart.find(i => i.product_id === product.id);
                item ? item.quantity++ : state.cart.push({ product_id: product.id, name: product.name, price: Number(product.price), quantity: 1 });
                renderCart(); e.target.value = '';
            } else { alert("No existe el producto"); }
        } catch (err) { console.error(err); }
    }
};

function renderCart() {
    const list = document.getElementById('cart-items-list');
    let total = 0;
    list.innerHTML = state.cart.map((item, idx) => {
        total += item.price * item.quantity;
        return `<div class="cart-item"><span>${item.name} x${item.quantity}</span><b>$${(item.price * item.quantity).toFixed(2)}</b></div>`;
    }).join('');
    document.getElementById('total-amount').innerText = `$${total.toFixed(2)}`;
}

window.processSale = async () => {
    if (state.cart.length === 0) return;
    try {
        const payload = { items: state.cart, payment_method: document.getElementById('payment-method').value };
        const res = await apiFetch('/sales', 'POST', payload);
        alert(`Venta exitosa. Cambio: $${res.data.sale.change || 0}`);
        state.cart = []; renderCart();
    } catch (err) { alert(err.message); }
};

// 🗺️ NAVEGACIÓN
window.showModule = (id) => {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

document.getElementById('logoutBtn').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('toggleBtn').onclick = () => document.getElementById('sidebar').classList.toggle('hidden');

checkAuth();
