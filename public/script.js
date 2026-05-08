const API_URL = '/api/v1';
let state = {
    token: localStorage.getItem('token'),
    user: null,
    cart: []
};

// --- Manejo de Vistas ---
const views = {
    pos: `
        <div class="pos-container">
            <div class="product-selection">
                <input type="text" id="search-pro" placeholder="Buscar por SKU o Nombre...">
                <div class="product-grid" id="products-list">Cargando productos...</div>
            </div>
            <div class="cart">
                <h3>Carrito</h3>
                <div id="cart-items"></div>
                <hr>
                <select id="payment-method">
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="TRANSFER">Transferencia</option>
                </select>
                <button id="checkout-btn">Finalizar Venta</button>
            </div>
        </div>
    `,
    inventory: `<h3>Gestión de Inventario</h3><div id="inventory-table"></div>`
};

// --- Autenticación ---
async function login(e) {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        const json = await res.json();

        if (json.status === 'success') {
            state.token = json.data.token;
            state.user = json.data.user;
            localStorage.setItem('token', state.token);
            initDashboard();
        } else {
            alert(json.message);
        }
    } catch (err) {
        console.error("Error en login:", err);
    }
}

// --- Funciones de Venta (Conforme a tu Zod Schema) ---
async function checkout() {
    if (state.cart.length === 0) return alert("Carrito vacío");

    const saleData = {
        items: state.cart.map(i => ({
            product_id: i.id,
            quantity: i.qty
        })),
        payment_method: document.getElementById('payment-method').value,
        discount: 0
    };

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(saleData)
        });
        const json = await res.json();
        if(json.status === 'success') {
            alert("Venta realizada con éxito");
            state.cart = [];
            renderCart();
        }
    } catch (err) {
        alert("Error al procesar venta");
    }
}

// --- Inicialización ---
function initDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Hola, ${state.user?.name || 'Usuario'}`;
    loadView('pos');
}

function loadView(viewName) {
    const container = document.getElementById('view-container');
    container.innerHTML = views[viewName];
    if(viewName === 'pos') {
        // Aquí llamarías a cargar productos del backend
        document.getElementById('checkout-btn').onclick = checkout;
    }
}

document.getElementById('login-form').onsubmit = login;
document.querySelectorAll('.sidebar li[data-view]').forEach(li => {
    li.onclick = () => loadView(li.dataset.view);
});
