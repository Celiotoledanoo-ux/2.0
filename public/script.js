//////////////////////
// 📡 CAPA DE COMUNICACIÓN (API LAYER)
//////////////////////
const API_URL = '/api/v1';

async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, config);
        const response = await res.json();

        if (!res.ok) {
            if (res.status === 401) {
                alert("🚫 Sesión expirada. Por favor, reingresa.");
                cerrarSesion();
            }
            throw new Error(response.message || 'Error en la petición');
        }
        // Retornamos el objeto completo para manejar 'count' o metadatos si es necesario
        return response.data; 
    } catch (err) {
        alert(`⚠️ ${err.message}`);
        throw err;
    }
}

//////////////////////
// 🔐 AUTENTICACIÓN
//////////////////////
async function ejecutarLogin() {
    const identifier = document.getElementById('login-email').value.trim(); // Cambiado a 'identifier'
    const password = document.getElementById('login-pass').value.trim();

    if (!identifier || !password) return alert("⚠️ Ingresa usuario y contraseña");

    try {
        // Ajustamos el body para que coincida con el loginSchema (identifier)
        const data = await api('/auth/login', 'POST', { identifier, password });
        
        const token = data.session.accessToken || data.session.access_token;

        if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(data.user));
            location.reload(); 
        }
    } catch (err) { console.error("Login fallido", err); }
}

function cerrarSesion() {
    localStorage.clear();
    location.reload();
}

//////////////////////
// 📦 GESTIÓN DE INVENTARIO
//////////////////////
async function cargarInventario() {
    try {
        const response = await api('/inventory');
        // El repositorio devuelve { data, count }, extraemos data
        const productos = response.data || response || [];
        const tbody = document.querySelector('#tabla-inventario-real tbody');
        if (!tbody) return;

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>${p.sku}</td>
                <td>${p.name}</td>
                <td><span class="badge ${p.stock <= p.min_stock ? 'danger' : 'success'}">${p.stock}</span></td>
                <td>$${Number(p.price).toFixed(2)}</td>
                <td>
                    <button class="btn" onclick="ajustarStockPrompt('${p.id}')">➕</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

//////////////////////
// 🛒 CARRITO Y COBRO
//////////////////////
async function procesarVenta() {
    if (carrito.length === 0) return alert("Carrito vacío");
    
    const payload = {
        payment_method: document.getElementById('metodo-pago')?.value || 'CASH',
        items: carrito.map(i => ({ 
            product_id: i.id, 
            quantity: i.cantidad
            // El precio lo saca el backend de la DB por seguridad, 
            // pero lo enviamos si el schema lo requiere
        }))
    };

    try {
        await api('/sales/checkout', 'POST', payload);
        alert("💰 Venta exitosa");
        vaciarCarrito();
        cargarInventario();
        mostrarSeccion('venta');
    } catch (err) { console.error(err); }
}

//////////////////////
// 📊 REPORTES (Sincronizado con Reports Routes)
//////////////////////
async function obtenerResumen() {
    try {
        // Cambiado a /reports/daily-summary según tu routes/index.js
        const res = await api('/reports/daily-summary');
        
        document.getElementById('rep-ingresos').innerText = `$${res.metrics.total_revenue.toFixed(2)}`;
        document.getElementById('rep-cantidad').innerText = res.metrics.sales_count;
        
        const lista = document.getElementById('lista-stock-bajo');
        if (lista) {
            lista.innerHTML = res.metrics.critical_inventory.items.map(i => `
                <li>⚠️ ${i.name} - Stock: ${i.stock} (Mín: ${i.min_stock})</li>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    const target = document.getElementById(id);
    if (target) target.classList.add('activa');
    
    if (id === 'inventario') cargarInventario();
    if (id === 'reportes') obtenerResumen();
}
