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
                cerrarSesion();
            }
            // Aquí es donde atrapamos el error de "perfil no configurado"
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
    const identifier = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value.trim();

    if (!identifier || !password) return alert("⚠️ Ingresa usuario y contraseña");

    try {
        // Enviamos 'identifier' (que es el email) al backend
        const data = await api('/auth/login', 'POST', { identifier, password });
        
        // Render/Supabase a veces devuelven access_token o accessToken
        const token = data.session?.access_token || data.session?.accessToken;

        if (token) {
            localStorage.setItem('token', token);
            // Guardamos el objeto user completo (que ya trae el ROLE del trigger)
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // En lugar de reload, mostramos la app directamente
            inicializarApp();
        }
    } catch (err) { 
        console.error("Login fallido", err); 
    }
}

// Nueva función para arrancar la interfaz con datos reales
function inicializarApp() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-shell').style.display = 'block';
        document.getElementById('user-display-name').innerText = user.name || user.email;
        mostrarSeccion('venta');
    }
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
        // Manejamos si viene como array directo o dentro de .data
        const productos = Array.isArray(response) ? response : (response.data || []);
        
        const tbody = document.querySelector('#tabla-inventario-real tbody');
        if (!tbody) return;

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>${p.sku}</td>
                <td>${p.name}</td>
                <td><span class="badge ${p.stock <= p.min_stock ? 'danger' : 'success'}">${p.stock}</span></td>
                <td>$${Number(p.price).toFixed(2)}</td>
                <td>
                    <button class="btn-action" onclick="alert('Función en desarrollo para ID: ${p.id}')">✏️</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error("Error cargando stock:", err); }
}

//////////////////////
// 📊 REPORTES
//////////////////////
async function obtenerResumen() {
    try {
        const res = await api('/reports/daily-summary');
        if (!res) return;

        document.getElementById('rep-ingresos').innerText = `$${res.metrics.total_revenue.toFixed(2)}`;
        document.getElementById('rep-cantidad').innerText = res.metrics.sales_count;
        
        const lista = document.getElementById('lista-stock-bajo');
        if (lista) {
            lista.innerHTML = (res.metrics.critical_inventory.items || []).map(i => `
                <li>⚠️ ${i.name} - Stock: ${i.stock}</li>
            `).join('');
        }
    } catch (err) { console.error("Error en reportes:", err); }
}

// Control de secciones
function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    const target = document.getElementById(id);
    if (target) target.classList.add('activa');
    
    // Actualizar datos según sección
    if (id === 'inventario') cargarInventario();
    if (id === 'reportes') obtenerResumen();
}

// EJECUCIÓN INICIAL: Si ya hay token, saltar el login
window.onload = () => {
    if (localStorage.getItem('token')) {
        inicializarApp();
    }
};
