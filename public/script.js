const API_URL = '/api/v1';
let state = { 
    token: localStorage.getItem('token'), 
    user: JSON.parse(localStorage.getItem('user')) || null, 
    cart: [], 
    cashSession: null 
};

const views = {
    pos: `<div class="pos-container"><div class="product-selection"><input type="text" id="search-pro" placeholder="Escanea código o busca nombre..."><div class="product-grid" id="products-list">Listo para la venta...</div></div><div class="cart"><h3>🛒 Carrito</h3><div id="cart-items" class="cart-scroll"></div><div class="cart-totals"><hr><p style="font-size: 1.2rem; font-weight: bold;">Total: <span id="cart-total">$0.00</span></p></div><select id="payment-method"><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="TRANSFER">Transferencia</option></select><button id="checkout-btn" class="btn-success">Finalizar Venta</button></div></div>`,
    inventory: `<div class="inventory-layout"><div class="inventory-form-card"><h3>✨ Nuevo Producto</h3><form id="product-form"><input type="text" id="p-name" placeholder="Nombre" required><input type="text" id="p-sku" placeholder="SKU / Código" required><div style="display: flex; gap: 10px;"><input type="number" id="p-price" step="0.01" placeholder="Precio ($)" required><input type="number" id="p-stock" placeholder="Stock" required></div><input type="text" id="p-brand" placeholder="Marca"><textarea id="p-desc" placeholder="Descripción..."></textarea><button type="submit">Guardar</button></form></div><div class="inventory-list-card"><h3>📦 Existencias</h3><table><thead><tr><th>SKU</th><th>Producto</th><th>Precio</th><th>Stock</th></tr></thead><tbody id="inventory-body"></tbody></table></div></div>`,
    reports: `<div class="reports-container"><div class="metrics-grid"><div class="metric-card"><h4>Ventas del Día</h4><p id="m-revenue">$0.00</p></div><div class="metric-card"><h4>Transacciones</h4><p id="m-count">0</p></div><div class="metric-card"><h4>Alertas Stock</h4><p id="m-alerts">0</p></div></div><div class="reports-detail"><div class="card"><h3>🏆 Top 5 Productos</h3><ul id="top-products-list"></ul></div><div class="card"><h3>⚠️ Stock Bajo</h3><ul id="low-stock-list"></ul></div></div></div>`,
    users: `<div class="users-layout"><div class="card" style="margin-bottom:20px;"><h3>✨ Nuevo Empleado</h3><form id="add-user-form" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) auto; gap:10px; align-items:end;"><input type="text" id="new-u-name" placeholder="Nombre" required><input type="email" id="new-u-email" placeholder="Correo" required><input type="password" id="new-u-pass" placeholder="Clave" required><select id="new-u-role"><option value="CASHIER">Cajero</option><option value="MANAGER">Gerente</option><option value="ADMIN">Admin</option></select><button type="submit">Registrar</button></form></div><div class="card"><h3>👥 Personal</h3><table><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="users-body"></tbody></table></div></div>`,
    cash: `<div class="cash-container"><div class="card"><h3>💰 Control de Caja</h3><div id="cash-active-info" class="hidden"><p>Estado: <span class="badge">ABIERTA</span></p><p>Fondo Inicial: <b id="display-initial"></b></p><p>Apertura: <span id="display-time"></span></p><button id="close-cash-btn" class="btn-danger">Cerrar Caja</button></div><div id="cash-no-session"><p>No hay sesión activa.</p></div></div></div>`,
    modalOpenCash: `<div id="cash-modal" class="modal-overlay"><div class="modal-content"><h2>💰 Apertura de Caja</h2><p>Fondo inicial en caja:</p><input type="number" id="initial-amount" placeholder="0.00" step="0.01"><button id="confirm-open-btn">Abrir Caja</button></div></div>`
};

// --- ⚙️ CORE API ---
const apiFetch = async (endpoint, method = 'GET', body = null) => {
    const opts = { 
        method, 
        headers: { 
            'Authorization': `Bearer ${state.token}`, 
            'Content-Type': 'application/json' 
        } 
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error en la petición');
    return data;
};

// --- 🗺️ NAVEGACIÓN Y VISTAS ---
async function loadView(name) {
    const container = document.getElementById('view-container');
    if (!container) return;
    container.innerHTML = views[name];

    if (name === 'inventory') {
        document.getElementById('product-form').onsubmit = async (e) => {
            e.preventDefault();
            const payload = { 
                name: document.getElementById('p-name').value, 
                sku: document.getElementById('p-sku').value.toUpperCase(), 
                price: parseFloat(document.getElementById('p-price').value), 
                stock: parseInt(document.getElementById('p-stock').value), 
                brand: document.getElementById('p-brand').value, 
                description: document.getElementById('p-desc').value 
            };
            try {
                await apiFetch('/inventory', 'POST', payload);
                loadInventoryTable();
                e.target.reset();
            } catch (err) { alert(err.message); }
        };
        loadInventoryTable();
    }

    if (name === 'pos') {
        document.getElementById('search-pro').onkeypress = async (e) => {
            if (e.key === 'Enter') {
                try {
                    const json = await apiFetch(`/inventory?sku=${e.target.value}`);
                    if (json.data && json.data[0]) { addToCart(json.data[0]); e.target.value = ''; }
                } catch (err) { console.error(err); }
            }
        };
        document.getElementById('checkout-btn').onclick = async () => {
            if (state.cart.length === 0) return alert("Carrito vacío");
            const payload = { 
                items: state.cart.map(i => ({ product_id: i.id, quantity: i.qty })), 
                payment_method: document.getElementById('payment-method').value 
            };
            try {
                await apiFetch('/sales', 'POST', payload);
                state.cart = []; renderCart(); alert("Venta Exitosa");
            } catch (err) { alert(err.message); }
        };
    }

    if (name === 'users') {
        loadUsersTable();
        document.getElementById('add-user-form').onsubmit = async (e) => {
            e.preventDefault();
            const payload = { 
                name: document.getElementById('new-u-name').value, 
                email: document.getElementById('new-u-email').value, 
                password: document.getElementById('new-u-pass').value, 
                role: document.getElementById('new-u-role').value 
            };
            try {
                await apiFetch('/users', 'POST', payload);
                loadUsersTable(); e.target.reset();
            } catch (err) { alert(err.message); }
        };
    }
}

// --- 🔑 AUTH & DASHBOARD ---
const initDashboard = () => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    
    // Mostramos Rango real (OWNER, ADMIN, etc.)
    const userRole = state.user?.role || 'USER';
    document.getElementById('user-display').innerText = `${userRole}: ${state.user?.name || 'Usuario'}`;
    
    checkCashStatus();
    loadView('pos');
};

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const json = await res.json();

        if (json.status === 'success') {
            state.token = json.token || json.data?.token;
            state.user = json.data?.user;
            localStorage.setItem('token', state.token);
            localStorage.setItem('user', JSON.stringify(state.user));
            initDashboard();
        } else {
            alert(json.message || "Error al entrar");
        }
    } catch (err) {
        alert("El servidor está despertando. Intenta de nuevo en unos segundos.");
    }
};

document.getElementById('logout-btn').onclick = () => { 
    localStorage.clear(); 
    location.reload(); 
};

// Carga inicial
if (state.token && state.user) {
    initDashboard();
}

// Sidebar clicks
document.querySelectorAll('.sidebar li[data-view]').forEach(li => {
    li.onclick = () => {
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        loadView(li.dataset.view);
    };
});

// --- Funciones auxiliares de carga ---
async function loadInventoryTable() {
    try {
        const json = await apiFetch('/inventory');
        document.getElementById('inventory-body').innerHTML = json.data.map(p => 
            `<tr><td>${p.sku}</td><td>${p.name}</td><td>$${p.price}</td><td>${p.stock}</td></tr>`
        ).join('');
    } catch (err) { console.error(err); }
}

async function loadUsersTable() {
    try {
        const json = await apiFetch('/users');
        document.getElementById('users-body').innerHTML = json.data.users.map(u => 
            `<tr><td>${u.name}</td><td>${u.email}</td><td><span class="badge">${u.role}</span></td><td>${u.active ? '🟢' : '🔴'}</td><td><button onclick="toggleUserStatus('${u.id}', ${u.active})" class="btn-small">Cambiar</button></td></tr>`
        ).join('');
    } catch (err) { console.error(err); }
}

// El Carrito
const addToCart = (p) => {
    const item = state.cart.find(i => i.id === p.id);
    item ? item.qty++ : state.cart.push({ ...p, price: parseFloat(p.price), qty: 1 });
    renderCart();
};

const renderCart = () => {
    let total = 0;
    document.getElementById('cart-items').innerHTML = state.cart.map((item, i) => {
        total += item.price * item.qty;
        return `<div class="cart-item"><span>${item.name} (x${item.qty})</span> <b>$${(item.price * item.qty).toFixed(2)}</b> <button onclick="removeFromCart(${i})">x</button></div>`;
    }).join('');
    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
};

window.removeFromCart = (i) => { state.cart.splice(i, 1); renderCart(); };

const checkCashStatus = async () => {
    try {
        const json = await apiFetch('/cash/status');
        if (json.status === 'success' && !json.data.session) showOpenCashModal();
        else state.cashSession = json.data.session;
    } catch (err) { console.log("Caja no configurada"); }
};
