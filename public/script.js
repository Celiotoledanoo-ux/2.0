//////////////////////
// 📡 CONFIGURACIÓN SUPABASE
//////////////////////
const supabaseUrl = 'TU_URL_DE_SUPABASE';
const supabaseKey = 'TU_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let carrito = [];
let productosLocal = []; // Para búsqueda ultra rápida

//////////////////////
// 🔐 AUTENTICACIÓN
//////////////////////
async function ejecutarLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value.trim();

    if (!email || !password) return alert("⚠️ Ingresa correo y contraseña");

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await inicializarApp();
    } catch (err) {
        alert(`❌ Error: ${err.message}`);
    }
}

async function inicializarApp() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-shell').style.display = 'block';

        const { data: profile } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            document.getElementById('user-display-name').innerText = profile.name;
            document.getElementById('user-role-badge').innerText = profile.role;
        }

        // Cargar datos iniciales
        await sincronizarProductos();
        mostrarSeccion('venta');
    }
}

async function cerrarSesion() {
    await supabase.auth.signOut();
    location.reload();
}

//////////////////////
// 📦 GESTIÓN DE INVENTARIO
//////////////////////
async function sincronizarProductos() {
    const { data, error } = await supabase.from('inventory').select('*').order('name');
    if (!error) productosLocal = data;
}

async function cargarInventario() {
    await sincronizarProductos();
    const tbody = document.getElementById('lista-inventario');
    tbody.innerHTML = productosLocal.map(p => `
        <tr>
            <td><strong>${p.sku}</strong></td>
            <td>${p.name}</td>
            <td><span class="badge ${p.stock <= p.min_stock ? 'danger' : 'success'}">${p.stock}</span></td>
            <td>$${Number(p.price).toFixed(2)}</td>
        </tr>
    `).join('');
}

async function crearProducto() {
    const nuevoProd = {
        sku: document.getElementById('inv-sku').value,
        name: document.getElementById('inv-nombre').value,
        stock: parseInt(document.getElementById('inv-stock').value),
        price: parseFloat(document.getElementById('inv-precio').value)
    };

    const { error } = await supabase.from('inventory').insert([nuevoProd]);
    if (error) alert("Error: " + error.message);
    else {
        alert("✅ Producto añadido");
        document.querySelector('.card-form form').reset();
        cargarInventario();
    }
}

//////////////////////
// 🛒 LÓGICA DE VENTA (EL MOTOR)
//////////////////////
function buscarEnVenta() {
    const input = document.getElementById('codigo-busqueda');
    const query = input.value.toLowerCase();
    const resultados = document.getElementById('resultados-busqueda');

    if (query.length < 2) {
        resultados.innerHTML = '';
        return;
    }

    const filtrados = productosLocal.filter(p => 
        p.sku.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
    );

    resultados.innerHTML = filtrados.map(p => `
        <div class="result-item" onclick="agregarAlCarrito('${p.sku}')">
            <span>${p.name}</span>
            <strong>$${p.price}</strong>
        </div>
    `).join('');
}

function agregarAlCarrito(sku) {
    const producto = productosLocal.find(p => p.sku === sku);
    if (!producto) return;

    const enCarrito = carrito.find(item => item.sku === sku);
    
    if (enCarrito) {
        enCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    document.getElementById('codigo-busqueda').value = '';
    document.getElementById('resultados-busqueda').innerHTML = '';
    renderizarCarrito();
}

function renderizarCarrito() {
    const tbody = document.getElementById('tabla-carrito');
    let total = 0;

    tbody.innerHTML = carrito.map((item, index) => {
        const subtotal = item.price * item.cantidad;
        total += subtotal;
        return `
            <tr>
                <td>${item.name}</td>
                <td>$${Number(item.price).toFixed(2)}</td>
                <td>${item.cantidad}</td>
                <td>$${subtotal.toFixed(2)}</td>
                <td><button onclick="eliminarDelCarrito(${index})" style="color:red; background:none; border:none; cursor:pointer;">✕</button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('subtotal-display').innerText = `$${total.toFixed(2)}`;
    document.getElementById('total-venta').innerText = `$${total.toFixed(2)}`;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    renderizarCarrito();
}

async function procesarVenta() {
    if (carrito.length === 0) return alert("🛒 Carrito vacío");

    try {
        const total = carrito.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
        
        // 1. Crear la venta en Supabase
        const { data: venta, error: errorVenta } = await supabase
            .from('sales')
            .insert([{ 
                total, 
                payment_method: document.getElementById('metodo-pago').value,
                created_by: (await supabase.auth.getUser()).data.user.id
            }])
            .select();

        if (errorVenta) throw errorVenta;

        // 2. Registrar items (El Trigger de SQL se encargará de restar el stock)
        const itemsVenta = carrito.map(item => ({
            sale_id: venta[0].id,
            product_id: item.id,
            quantity: item.cantidad,
            price_at_sale: item.price
        }));

        const { error: errorItems } = await supabase.from('sales_items').insert(itemsVenta);
        if (errorItems) throw errorItems;

        alert("✨ Venta Completada con Éxito");
        vaciarCarrito();
        await sincronizarProductos(); // Actualiza stock local
    } catch (err) {
        alert("❌ Error al procesar: " + err.message);
    }
}

//////////////////////
// 🚦 NAVEGACIÓN Y ATAJOS
//////////////////////
function mostrarSeccion(id) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(id).classList.add('activa');
    
    // Buscar el botón por el texto del span o el onclick
    const btn = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick').includes(id));
    if (btn) btn.classList.add('active');

    if (id === 'inventario') cargarInventario();
    if (id === 'venta') document.getElementById('codigo-busqueda').focus();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'F1') { e.preventDefault(); mostrarSeccion('venta'); }
    if (e.key === 'F2') { e.preventDefault(); mostrarSeccion('inventario'); }
    if (e.key === 'F10') { e.preventDefault(); procesarVenta(); }
});

window.onload = inicializarApp;
