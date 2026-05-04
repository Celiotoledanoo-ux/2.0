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
    const username = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    if (!username || !password) return alert("Ingresa credenciales");

    try {
        const data = await api('/auth/login', 'POST', { username, password });
        localStorage.setItem('token', data.session.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        location.reload(); 
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
        const productos = response.products || [];
        const tbody = document.querySelector('#tabla-inventario-real tbody');
        if (!tbody) return;

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>${p.sku}</td>
                <td>${p.name}</td>
                <td><strong>${p.stock}</strong></td>
                <td>$${Number(p.price).toFixed(2)}</td>
                <td>
                    <button class="btn vaciar" onclick="eliminarDelInventario('${p.id}')">🗑</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function crearProducto() {
    const payload = {
        sku: document.getElementById('inv-sku').value.trim(),
        name: document.getElementById('inv-nombre').value.trim(),
        stock: Number(document.getElementById('inv-stock').value),
        price: Number(document.getElementById('inv-precio').value)
    };

    if (!payload.sku || !payload.name) return alert("Faltan datos");

    try {
        await api('/inventory', 'POST', payload);
        alert("✅ Producto registrado");
        limpiarFormularios();
        cargarInventario();
    } catch (err) { console.error(err); }
}

//////////////////////
// 🔍 BUSCADOR (TECLADO > MOUSE)
//////////////////////
let timeoutBusqueda;

async function buscarEnVenta() {
    const query = document.getElementById('codigo-busqueda').value.trim();
    const resultadosDiv = document.getElementById('resultados-busqueda');

    if (query.length < 2) {
        resultadosDiv.innerHTML = '';
        return;
    }

    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(async () => {
        try {
            const response = await api('/inventory');
            const productos = response.products || [];
            const filtrados = productos.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase()) || 
                p.sku.toLowerCase().includes(query.toLowerCase())
            );
            pintarResultados(filtrados);
        } catch (err) { console.error(err); }
    }, 200);
}

function pintarResultados(productos) {
    const div = document.getElementById('resultados-busqueda');
    if (productos.length === 0) {
        div.innerHTML = '<div class="search-item">❌ No encontrado</div>';
        return;
    }
    div.innerHTML = productos.map(p => `
        <div class="search-item" onclick="seleccionarProducto('${p.id}', '${p.name}', ${p.price}, '${p.sku}')">
            <span><strong>${p.sku}</strong> - ${p.name}</span>
            <span>$${p.price} <small>(${p.stock} disp.)</small></span>
        </div>
    `).join('');
}

//////////////////////
// 🛒 CARRITO Y COBRO
//////////////////////
let carrito = [];

function seleccionarProducto(id, nombre, precio, sku) {
    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad++;
        existente.subtotal = existente.cantidad * existente.precio;
    } else {
        carrito.push({ id, nombre, sku, precio: Number(precio), cantidad: 1, subtotal: Number(precio) });
    }
    document.getElementById('codigo-busqueda').value = '';
    document.getElementById('resultados-busqueda').innerHTML = '';
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const tbody = document.getElementById('tabla-carrito');
    const totalSpan = document.getElementById('total-venta');
    if (!tbody) return;

    tbody.innerHTML = carrito.map(item => `
        <tr>
            <td>${item.nombre}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>${item.cantidad}</td>
            <td>$${item.subtotal.toFixed(2)}</td>
            <td>
                <button onclick="cambiarCantidad('${item.id}', -1)">-</button>
                <button onclick="cambiarCantidad('${item.id}', 1)">+</button>
            </td>
        </tr>
    `).join('');

    const total = carrito.reduce((acc, i) => acc + i.subtotal, 0);
    totalSpan.innerText = total.toFixed(2);
}

async function procesarVenta() {
    if (carrito.length === 0) return alert("Carrito vacío");
    
    const payload = {
        payment_method: document.getElementById('metodo-pago')?.value || 'CASH',
        items: carrito.map(i => ({ 
            product_id: i.id, 
            quantity: i.cantidad,
            price_at_sale: i.precio 
        }))
    };

    try {
        await api('/sales/checkout', 'POST', payload);
        alert("💰 Venta exitosa");
        vaciarCarrito();
        cargarInventario();
        mostrarSeccion('venta'); // Regresar foco
    } catch (err) { console.error(err); }
}

//////////////////////
// ⚡️ ATAJOS DE TECLADO (VELOCIDAD POS)
//////////////////////
document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') { // F1: Foco al buscador
        e.preventDefault();
        mostrarSeccion('venta');
        document.getElementById('codigo-busqueda').focus();
    }
    if (e.key === 'F2') { // F2: Cobrar
        e.preventDefault();
        if (carrito.length > 0) procesarVenta();
    }
    if (e.key === 'Escape') { // ESC: Cerrar búsqueda
        document.getElementById('resultados-busqueda').innerHTML = '';
        document.getElementById('codigo-busqueda').value = '';
    }
    if (e.key === 'Enter' && document.activeElement.id === 'codigo-busqueda') {
        const primero = document.querySelector('.search-item');
        if (primero) primero.click();
    }
});

//////////////////////
// 📊 REPORTES (PARA EL DUEÑO)
//////////////////////
async function obtenerResumen() {
    try {
        const res = await api('/reports/summary');
        document.getElementById('rep-ingresos').innerText = `$${res.metrics.total_revenue.toFixed(2)}`;
        document.getElementById('rep-cantidad').innerText = res.metrics.sales_count;
        
        const lista = document.getElementById('lista-stock-bajo');
        lista.innerHTML = res.metrics.critical_inventory.items.map(i => `
            <li>⚠️ ${i.name} - Stock: ${i.stock} (Mín: ${i.min_stock})</li>
        `).join('');
    } catch (err) { console.error(err); }
}

//////////////////////
// 🛠 UTILIDADES
//////////////////////
function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
    if (id === 'inventario') cargarInventario();
    if (id === 'reportes') obtenerResumen();
    if (id === 'venta') document.getElementById('codigo-busqueda').focus();
}

function vaciarCarrito() {
    carrito = [];
    actualizarVistaCarrito();
}

function limpiarFormularios() {
    document.querySelectorAll('input').forEach(i => i.value = '');
}

window.onload = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-shell').style.display = 'block';
        document.getElementById('user-display-name').innerText = `👤 ${user.name}`;
        cargarInventario();
        mostrarSeccion('venta');
    }
};
