const API_URL = '/api/v1';
let state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: [],
    cashSession: null
};

// 📡 MOTOR DE PETICIONES CENTRALIZADO
const apiFetch = async (endpoint, method = 'GET', payload = null) => {
    const opts = {
        method,
        headers: { 
            'Authorization': `Bearer ${state.token}`, 
            'Content-Type': 'application/json' 
        }
    };
    if (payload) opts.body = JSON.stringify({ body: payload });
    
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Error en el proceso');
    return json;
};

// 🔑 ACCESO Y SEGURIDAD (LOGIN)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('email').value.trim();
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
            } else { alert(json.message || "Credenciales incorrectas"); }
        } catch (err) { alert("El servidor en Render está encendiendo, reintenta..."); }
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

// 🗺️ NAVEGACIÓN Y CONFIGURACIÓN DE PESTAÑAS (SPA)
window.showModule = (id) => {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    // Inicializadores automáticos de datos por demanda
    if (id === 'inventory') initInventoryModule();
    if (id === 'cash') initCashModule();
    if (id === 'reports') initReportsModule();
    if (id === 'users') initUsersModule();
};

// 🛒 MÓDULO DE VENTAS (POS)
window.handlePosSearch = async (e) => {
    if (e.key === 'Enter') {
        const sku = e.target.value.trim().toUpperCase();
        if (!sku) return;
        try {
            const json = await apiFetch(`/inventory?sku=${sku}`);
            const product = json.data.products;
            if (product) {
                const existing = state.cart.find(i => i.product_id === product.id);
                existing ? existing.quantity++ : state.cart.push({ product_id: product.id, name: product.name, price: Number(product.price), quantity: 1 });
                renderCart();
                e.target.value = '';
            } else { alert("Producto no registrado en inventario."); }
        } catch (err) { alert(err.message); }
    }
};

function renderCart() {
    const list = document.getElementById('cart-items-list');
    let total = 0;
    list.innerHTML = state.cart.map((item) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `<div class="cart-item"><span>${item.name} (x${item.quantity})</span><b>$${subtotal.toFixed(2)}</b></div>`;
    }).join('');
    document.getElementById('total-amount').innerText = `$${total.toFixed(2)}`;
}

window.processSale = async () => {
    if (state.cart.length === 0) return alert("El carrito está vacío.");
    try {
        const payload = { 
            items: state.cart, 
            payment_method: document.getElementById('payment-method').value 
        };
        const res = await apiFetch('/sales', 'POST', payload);
        alert(`✅ Venta cobrada correctamente.\nCambio a entregar: $${res.data.sale.change || 0}`);
        state.cart = [];
        renderCart();
    } catch (err) { alert(err.message); }
};

// 📦 MÓDULO INVENTARIO (Carga y Guardado)
function initInventoryModule() {
    loadInventoryTable();
    document.getElementById('product-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('p-name').value.trim(),
            sku: document.getElementById('p-sku').value.trim().toUpperCase(),
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value)
        };
        try {
            await apiFetch('/inventory', 'POST', payload);
            loadInventoryTable();
            e.target.reset();
            alert("✅ Producto añadido al catálogo.");
        } catch (err) { alert(err.message); }
    };
}

async function loadInventoryTable() {
    try {
        const json = await apiFetch('/inventory');
        // Suponiendo la estructura array que retorna tu repositorio mapeado
        const items = json.data.products || json.data || [];
        document.getElementById('inventory-body').innerHTML = items.map(p => 
            `<tr><td><strong>${p.sku}</strong></td><td>${p.name}</td><td>$${Number(p.price).toFixed(2)}</td><td>${p.stock} pz</td></tr>`
        ).join('');
    } catch (err) { console.error(err); }
}

// 💰 MÓDULO CAJA (Apertura y Cierre Automatizado)
async function initCashModule() {
    const container = document.getElementById('cash-status-card');
    try {
        const json = await apiFetch('/cash/status');
        state.cashSession = json.data.session;

        if (state.cashSession && state.cashSession.status === 'OPEN') {
            container.innerHTML = `
                <div class="cash-active">
                    <span class="badge-success">🟢 CAJA ABIERTA</span>
                    <p style="margin: 15px 0;">Fondo Inicial: <b>$${Number(state.cashSession.initial_amount).toFixed(2)}</b></p>
                    <input type="number" id="actual-amount" placeholder="Monto contado en caja físico" step="0.01">
                    <button onclick="triggerCloseCash()" class="btn-danger">Realizar Corte de Caja</button>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="cash-inactive">
                    <p>🚨 La caja se encuentra cerrada actualmente.</p>
                    <input type="number" id="initial-amount" placeholder="Monto de fondo inicial ($)" step="0.01">
                    <button onclick="triggerOpenCash()" class="btn-success">Abrir Turno de Caja</button>
                </div>`;
        }
    } catch (err) { container.innerHTML = `<p>Error al sincronizar el estado de caja.</p>`; }
}

window.triggerOpenCash = async () => {
    const amount = parseFloat(document.getElementById('initial-amount').value);
    if (isNaN(amount) || amount < 0) return alert("Ingresa un fondo de apertura válido.");
    try {
        await apiFetch('/cash/open', 'POST', { initial_amount: amount });
        initCashModule();
    } catch (err) { alert(err.message); }
};

window.triggerCloseCash = async () => {
    const amount = parseFloat(document.getElementById('actual-amount').value);
    if (isNaN(amount) || amount < 0) return alert("Ingresa el arqueo físico contado.");
    try {
        const res = await apiFetch('/cash/close', 'POST', { actual_amount: amount });
        alert(`🔒 Corte realizado.\nDiferencia calculada en sistema: $${res.data.session.difference}`);
        initCashModule();
    } catch (err) { alert(err.message); }
};

// 📊 MÓDULO REPORTES (Business Intelligence)
async function initReportsModule() {
    try {
        const json = await apiFetch('/reports/daily-summary');
        const summary = json.data;

        // Inyección de Tarjetas Financieras
        document.getElementById('metrics-container').innerHTML = `
            <div class="metric-card"><h4>Ventas Netas del Día</h4><p>$${Number(summary.metrics.total_revenue).toFixed(2)}</p></div>
            <div class="metric-card"><h4>Transacciones Realizadas</h4><p>${summary.metrics.sales_count} tickets</p></div>
            <div class="metric-card"><h4>Salud del Local</h4><p><b>${summary.business_status.health_score}</b></p></div>`;

        // Listado de Ranking de Maquillaje
        document.getElementById('top-products-list').innerHTML = summary.metrics.top_products.map(p => 
            `<li><span>💄 ${p.name}</span><b>${p.quantity} pz vendidas</b></li>`
        ).join('') || '<li>No hay ventas registradas el día de hoy</li>';

        // Listado de Stock Bajo
        document.getElementById('low-stock-list').innerHTML = summary.metrics.inventory_summary.items.map(p => 
            `<li class="danger-list-item"><span>⚠️ ${p.name}</span><b>Quedan ${p.stock} pz</b></li>`
        ).join('') || '<li>Todo el stock bajo control.</li>';

    } catch (err) { alert("No tienes permisos suficientes o falló el reporte financiero."); }
}

// 👥 MÓDULO USUARIOS (Control de Personal Jerárquico)
function initUsersModule() {
    loadUsersTable();
    document.getElementById('add-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('new-u-name').value.trim(),
            email: document.getElementById('new-u-email').value.trim(),
            password: document.getElementById('new-u-pass').value,
            role: document.getElementById('new-u-role').value
        };
        try {
            await apiFetch('/users', 'POST', payload);
            loadUsersTable();
            e.target.reset();
            alert("✅ Empleado registrado correctamente.");
        } catch (err) { alert(err.message); }
    };
}

async function loadUsersTable() {
    try {
        const json = await apiFetch('/users');
        const usersList = json.data.users || [];
        document.getElementById('users-body').innerHTML = usersList.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge">${u.role}</span></td>
                <td>${u.active ? '🟢 Activo' : '🔴 Suspendido'}</td>
                <td><button onclick="toggleUserStatus('${u.id}', ${u.active})" class="btn-small">Modificar Estado</button></td>
            </tr>`
        ).join('');
    } catch (err) { console.error(err); }
}

window.toggleUserStatus = async (id, currentStatus) => {
    try {
        await apiFetch(`/users/${id}/status`, 'PATCH', { active: !currentStatus });
        loadUsersTable();
    } catch (err) { alert(err.message); }
};

// --- INTERFAZ CONFIG GLOBAL ---
document.getElementById('logoutBtn').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('toggleBtn').onclick = () => document.getElementById('sidebar').classList.toggle('hidden');

checkAuth();
