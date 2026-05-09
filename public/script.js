const API_URL = '/api/v1';
let state = {
    token: localStorage.getItem('token'),
    user: null,
    cart: []
};

const views = {
    pos: `
        <div class="pos-container">
            <div class="product-selection">
                <input type="text" id="search-pro" placeholder="Escanea código o busca nombre...">
                <div class="product-grid" id="products-list">Listo para la venta...</div>
            </div>
            <div class="cart">
                <h3>🛒 Carrito</h3>
                <div id="cart-items" class="cart-scroll"></div>
                <div class="cart-totals">
                    <hr>
                    <p style="font-size: 1.2rem; font-weight: bold;">Total: <span id="cart-total">$0.00</span></p>
                </div>
                <select id="payment-method">
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="TRANSFER">Transferencia</option>
                </select>
                <button id="checkout-btn" class="btn-success">Finalizar Venta</button>
            </div>
        </div>
    `,
    inventory: `
        <div class="inventory-layout">
            <div class="inventory-form-card">
                <h3>✨ Nuevo Producto</h3>
                <form id="product-form">
                    <input type="text" id="p-name" placeholder="Nombre (ej: Labial Matte)" required>
                    <input type="text" id="p-sku" placeholder="SKU / Código de Barras" required>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="p-price" step="0.01" placeholder="Precio ($)" required>
                        <input type="number" id="p-stock" placeholder="Stock" required>
                    </div>
                    <input type="text" id="p-brand" placeholder="Marca (Opcional)">
                    <textarea id="p-desc" placeholder="Descripción..."></textarea>
                    <button type="submit" class="btn-primary">Guardar en Inventario</button>
                </form>
            </div>
            <div class="inventory-list-card">
                <h3>📦 Existencias</h3>
                <div id="inventory-table-container">
                    <table>
                        <thead>
                            <tr><th>SKU</th><th>Producto</th><th>Precio</th><th>Stock</th></tr>
                        </thead>
                        <tbody id="inventory-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    reports: `
        <div class="reports-container">
            <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div class="metric-card">
                    <h4>Ventas del Día</h4>
                    <p id="m-revenue" style="color: #d63384; font-weight: bold;">$0.00</p>
                </div>
                <div class="metric-card">
                    <h4>Transacciones</h4>
                    <p id="m-count" style="font-weight: bold;">0</p>
                </div>
                <div class="metric-card">
                    <h4>Alertas Stock</h4>
                    <p id="m-alerts" style="color: #dc3545; font-weight: bold;">0</p>
                </div>
            </div>
            <div class="reports-detail" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="card">
                    <h3>🏆 Top 5 Productos</h3>
                    <ul id="top-products-list"></ul>
                </div>
                <div class="card">
                    <h3>⚠️ Stock Bajo</h3>
                    <ul id="low-stock-list"></ul>
                </div>
            </div>
        </div>
    `,
    users: `
        <div class="users-layout">
            <div class="card">
                <h3>👥 Gestión de Personal</h3>
                <div id="users-table-container">
                    <table style="width:100%; margin-top:20px;">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="users-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `
};

// --- 👥 LÓGICA DE USUARIOS ---
async function loadUsersTable() {
    const tbody = document.getElementById('users-body');
    if (!tbody) return;
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (json.status === 'success') {
            tbody.innerHTML = json.data.users.map(u => `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge">${u.role}</span></td>
                    <td>${u.active ? '🟢 Activo' : '🔴 Inactivo'}</td>
                    <td>
                        <button onclick="toggleUserStatus('${u.id}', ${u.active})" class="btn-small">
                            ${u.active ? 'Desactivar' : 'Activar'}
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

window.toggleUserStatus = async (id, currentStatus) => {
    if (!confirm('¿Seguro que deseas cambiar el estado de este usuario?')) return;
    try {
        const res = await fetch(`${API_URL}/users/${id}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}` 
            },
            body: JSON.stringify({ active: !currentStatus })
        });
        const json = await res.json();
        if (json.status === 'success') { loadUsersTable(); }
    } catch (err) { alert('Error al actualizar estado'); }
};

// --- 📊 LÓGICA DE REPORTES ---
async function loadReports() {
    try {
        const res = await fetch(`${API_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (json.status === 'success') {
            const { metrics } = json.data;
            document.getElementById('m-revenue').innerText = `$${parseFloat(metrics.total_revenue || 0).toFixed(2)}`;
            document.getElementById('m-count').innerText = metrics.sales_count;
            document.getElementById('m-alerts').innerText = metrics.critical_inventory.count;
            document.getElementById('top-products-list').innerHTML = metrics.top_products.map(p => 
                `<li>${p.name} <span>${p.quantity}</span></li>`).join('') || '<li>Sin ventas</li>';
            document.getElementById('low-stock-list').innerHTML = metrics.critical_inventory.items.map(i => 
                `<li style="color:red">${i.name} (Stock: ${i.stock})</li>`).join('') || '<li>Todo bien</li>';
        }
    } catch (err) { console.error(err); }
}

// --- 🛒 LÓGICA POS ---
async function handleSearch(e) {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (!query) return;
        try {
            const res = await fetch(`${API_URL}/inventory?sku=${query}`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const json = await res.json();
            if (json.status === 'success' && json.data.length > 0) {
                addToCart(json.data[0]);
                e.target.value = '';
            } else { alert('Producto no encontrado'); }
        } catch (err) { console.error(err); }
    }
}

function addToCart(product) {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) { existing.qty++; } 
    else {
        state.cart.push({ id: product.id, name: product.name, price: parseFloat(product.price), sku: product.sku, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const itemsCont = document.getElementById('cart-items');
    const totalCont = document.getElementById('cart-total');
    if (!itemsCont) return;
    let total = 0;
    itemsCont.innerHTML = state.cart.map((item, i) => {
        total += item.price * item.qty;
        return `<div class="cart-item"><span>${item.name} (x${item.qty})</span> <b>$${(item.price * item.qty).toFixed(2)}</b> <button onclick="removeFromCart(${i})">x</button></div>`;
    }).join('');
    totalCont.innerText = `$${total.toFixed(2)}`;
}

window.removeFromCart = (i) => { state.cart.splice(i, 1); renderCart(); };

async function processCheckout() {
    if (state.cart.length === 0) return alert('Carrito vacío');
    const payload = {
        body: {
            items: state.cart.map(i => ({ product_id: i.id, quantity: i.qty })),
            payment_method: document.getElementById('payment-method').value,
            discount: 0
        }
    };
    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.status === 'success') { 
            alert('✅ Venta Exitosa'); 
            state.cart = []; 
            renderCart(); 
        } else { alert(json.message); }
    } catch (err) { alert('Error en venta'); }
}

// --- 📦 LÓGICA INVENTARIO ---
async function saveProduct(e) {
    e.preventDefault();
    const payload = {
        body: {
            name: document.getElementById('p-name').value,
            sku: document.getElementById('p-sku').value.toUpperCase(),
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value),
            brand: document.getElementById('p-brand').value,
            description: document.getElementById('p-desc').value
        }
    };
    try {
        const res = await fetch(`${API_URL}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.status === 'success') { 
            alert('✅ Guardado'); 
            document.getElementById('product-form').reset(); 
            loadInventoryTable(); 
        }
    } catch (err) { alert('Error al guardar'); }
}

async function loadInventoryTable() {
    const tbody = document.getElementById('inventory-body');
    if (!tbody) return;
    try {
        const res = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': `Bearer ${state.token}` } });
        const json = await res.json();
        if (json.status === 'success') {
            tbody.innerHTML = json.data.map(p => `<tr><td>${p.sku}</td><td>${p.name}</td><td>$${parseFloat(p.price).toFixed(2)}</td><td>${p.stock}</td></tr>`).join('');
        }
    } catch (err) { tbody.innerHTML = '<tr><td colspan="4">Error</td></tr>'; }
}

// --- 🔐 NAVEGACIÓN Y AUTH ---
async function login(e) {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: document.getElementById('identifier').value, password: document.getElementById('password').value })
        });
        const json = await res.json();
        if (json.status === 'success') { 
            state.token = json.data.token; 
            state.user = json.data.user; 
            localStorage.setItem('token', state.token); 
            initDashboard(); 
        } else { alert(json.message); }
    } catch (err) { alert("Error"); }
}

function initDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Admin: ${state.user?.name || 'User'}`;
    loadView('pos');
}

function loadView(name) {
    document.getElementById('view-container').innerHTML = views[name];
    if (name === 'inventory') { document.getElementById('product-form').onsubmit = saveProduct; loadInventoryTable(); }
    if (name === 'pos') { 
        document.getElementById('search-pro').addEventListener('keypress', handleSearch); 
        document.getElementById('checkout-btn').onclick = processCheckout; 
        renderCart(); 
    }
    if (name === 'reports') { loadReports(); }
    if (name === 'users') { loadUsersTable(); }
}

document.getElementById('login-form').onsubmit = login;
document.getElementById('logout-btn').onclick = () => { localStorage.removeItem('token'); location.reload(); };

document.querySelectorAll('.sidebar li[data-view]').forEach(li => {
    li.onclick = () => { 
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active')); 
        li.classList.add('active'); 
        loadView(li.dataset.view); 
    };
});

if (state.token) { initDashboard(); }
