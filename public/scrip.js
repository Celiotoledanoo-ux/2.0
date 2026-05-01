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
                alert("Sesión expirada o no autorizada");
                cerrarSesion();
            }
            throw new Error(response.message || 'Error en la petición');
        }
        // Retornamos data porque nuestro backend usa el formato JSend { status, data }
        return response.data; 
    } catch (err) {
        alert(`⚠️ ${err.message}`);
        throw err;
    }
}

//////////////////////
// 🔐 AUTENTICACIÓN (LOGIN)
//////////////////////
async function ejecutarLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    if (!email || !password) return alert("Ingresa credenciales");

    try {
        const data = await api('/auth/login', 'POST', { email, password });
        localStorage.setItem('token', data.token);
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
        const productos = await api('/inventory');
        const tbody = document.querySelector('#tabla-inventario-real tbody');
        if (!tbody) return;

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>${p.sku}</td>
                <td>${p.name}</td>
                <td><strong>${p.stock}</strong></td>
                <td>$${Number(p.price).toFixed(2)}</td>
                <td>
                    <button class="btn vaciar" style="padding: 5px 10px" onclick="eliminarDelInventario('${p.id}')">🗑</button>
                </td>
            </tr>
        `).join('');
        return productos;
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
// 🔍 BUSCADOR DE VENTAS (TIEMPO REAL)
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
            const productos = await api('/inventory');
            const filtrados = productos.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase()) || 
                p.sku.toLowerCase().includes(query.toLowerCase())
            );
            pintarResultados(filtrados);
        } catch (err) { console.error(err); }
    }, 300);
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
    document.getElementById('codigo-busqueda').value = '';
    document.getElementById('resultados-busqueda').innerHTML = '';

    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad++;
        existente.subtotal = existente.cantidad * existente.precio;
    } else {
        carrito.push({ id, nombre, sku, precio: Number(precio), cantidad: 1, subtotal: Number(precio) });
    }
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

function cambiarCantidad(id, cambio) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
    } else {
        item.subtotal = item.cantidad * item.precio;
    }
    actualizarVistaCarrito();
}

async function procesarVenta() {
    if (carrito.length === 0) return alert("Carrito vacío");
    
    const payload = {
        payment_method: 'CASH',
        items: carrito.map(i => ({ product_id: i.id, quantity: i.cantidad }))
    };

    try {
        await api('/sales', 'POST', payload);
        alert("💰 Venta exitosa y stock actualizado");
        carrito = [];
        actualizarVistaCarrito();
        cargarInventario();
    } catch (err) { console.error(err); }
}

//////////////////////
// 🛠 UTILIDADES Y NAVEGACIÓN
//////////////////////
function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
    if (id === 'inventario') cargarInventario();
}

function limpiarFormularios() {
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function vaciarCarrito() {
    carrito = [];
    actualizarVistaCarrito();
}

// 🏁 INICIO DEL SISTEMA
window.onload = () => {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-shell').style.display = 'block';
        cargarInventario();
    }
};
