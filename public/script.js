/* ==========================================================================
   ESTADO GLOBAL DEL SISTEMA (GLOW BEAUTY POS)
   ========================================================================== */
const state = {
    currentUser: null,
    currentRole: null,
    cart: [],
    inventory: [
        { sku: "LIP01", name: "Labial Matte Rose Quartz", price: 299.00, stock: 15, sold: 0 },
        { sku: "BASE02", name: "Base Fluida Glow Foundation", price: 450.00, stock: 8, sold: 0 },
        { sku: "PAL03", name: "Paleta de Sombras Nude Nectar", price: 580.00, stock: 4, sold: 0 }
    ],
    users: [
        { name: "Dueño Principal", email: "owner@glow.com", role: "OWNER" },
        { name: "Administrador General", email: "admin@glow.com", role: "ADMIN" },
        { name: "Gerente Turno", email: "manager@glow.com", role: "MANAGER" },
        { name: "Cajero Vitrina", email: "cashier@glow.com", role: "CASHIER" }
    ],
    // --- CONTROL DE EFECTIVO ---
    cashBalance: 2500.00,
    cashTransactions: [],
    // --- MÉTRICAS FINANCIERAS ---
    totalEarnings: 0,
    totalSalesCount: 0,
    totalItemsCount: 0,
    salesHistory: {
        labels: ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"],
        data: [0, 0, 0, 0, 0, 0]
    },
    paymentMethodsStats: { cash: 0, card: 0, transfer: 0 },
    chartInstance: null
};

/* ==========================================================================
   INICIALIZADOR DE EVENTOS (MANEJO DE MÓDULOS)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Navegación
    setupNavigation();
    
    // Autenticación
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
    
    // Punto de Venta (POS)
    document.getElementById("sku-search").addEventListener("keypress", (e) => {
        if (e.key === "Enter") handlePosSearch(e.target.value);
    });
    document.getElementById("btn-finish-sale").addEventListener("click", processSale);

    // Módulos de Operación
    document.getElementById("product-form").addEventListener("submit", handleAddProduct);
    document.getElementById("add-user-form").addEventListener("submit", handleRegisterUser);
    
    // Botones de Caja Chica
    document.getElementById("btn-cash-in").addEventListener("click", () => handleCashFlow("IN"));
    document.getElementById("btn-cash-out").addEventListener("click", () => handleCashFlow("OUT"));

    // Renderizado base pasivo
    renderInventory();
    renderUsersTable();
    updateCashUI();
});

/* ==========================================================================
   SISTEMA DE NAVEGACIÓN Y PERMISOS POR ROL DE USUARIO
   ========================================================================== */
function setupNavigation() {
    const navMapping = {
        'nav-pos': 'pos',
        'nav-inventory': 'inventory',
        'nav-cash': 'cash',
        'nav-reports': 'reports',
        'nav-users': 'users'
    };

    Object.keys(navMapping).forEach(btnId => {
        const button = document.getElementById(btnId);
        if (button) {
            button.addEventListener("click", () => {
                const targetModule = navMapping[btnId];
                
                // Aplicar el bloqueo de seguridad basado en tus 4 roles oficiales
                if (!checkModulePermission(targetModule)) {
                    alert(`⛔ Tu rol de ${state.currentRole} no tiene permisos para abrir este módulo.`);
                    return;
                }

                // Intercambio visual de pestañas si pasa el filtro de seguridad
                document.querySelectorAll(".sidebar button").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".module").forEach(m => m.classList.add("hidden"));
                
                button.classList.add("active");
                document.getElementById(targetModule).classList.remove("hidden");
                
                // Forzar refresco visual si abre gráficas
                if (targetModule === 'reports') {
                    setTimeout(initFinancialChart, 50);
                }
            });
        }
    });
}

// Matriz estricta de permisos para tus 4 roles específicos
function checkModulePermission(moduleName) {
    const role = state.currentRole;
    if (role === "OWNER" || role === "ADMIN") return true; // Acceso total
    
    if (role === "MANAGER") {
        // El gerente puede todo menos gestionar usuarios de la empresa
        return moduleName !== "users";
    }
    
    if (role === "CASHIER") {
        // El cajero está estrictamente limitado al Punto de venta y la Caja chica
        return moduleName === "pos" || moduleName === "cash";
    }
    
    return false;
}

/* ==========================================================================
   SISTEMA DE AUTENTICACIÓN (LOGIN/LOGOUT)
   ========================================================================== */
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const selectedRole = document.getElementById("login-role").value;

    state.currentUser = email.split('@')[0];
    state.currentRole = selectedRole; // Captura exacta de los 4 roles seleccionados

    // Desplegar información del empleado activo en la cabecera
    document.getElementById("user-display").innerText = `✨ ${state.currentUser} (${state.currentRole})`;
    
    // Switch estructural de pantallas
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("main-system").classList.remove("hidden");

    // Limpiar bloqueos visuales inline del HTML según los permisos del rol actual
    applyUIBlockers();

    // Redirigir al Punto de Venta automáticamente
    document.getElementById("nav-pos").click();
}

function handleLogout() {
    state.currentUser = null;
    state.currentRole = null;
    state.cart = [];
    updateCartUI();
    document.getElementById("main-system").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("login-form").reset();
}

function applyUIBlockers() {
    const isRestricted = (state.currentRole === "CASHIER");
    
    // Bloquear pantallas secundarias de configuración
    const invMsg = document.getElementById("inventory-restricted-msg");
    const invContent = document.getElementById("inventory-content");
    const repMsg = document.getElementById("reports-restricted-msg");
    const repContent = document.getElementById("reports-content");

    if (isRestricted) {
        if(invMsg) invMsg.classList.remove("hidden");
        if(invContent) invContent.classList.add("hidden");
        if(repMsg) repMsg.classList.remove("hidden");
        if(repContent) repContent.classList.add("hidden");
    } else {
        if(invMsg) invMsg.classList.add("hidden");
        if(invContent) invContent.classList.remove("hidden");
        if(repMsg) repMsg.classList.add("hidden");
        if(repContent) repContent.classList.remove("hidden");
    }
}

/* ==========================================================================
   🛒 PUNTO DE VENTA (POS) Y LÓGICA DE COBRO MIXTO
   ========================================================================== */
function handlePosSearch(query) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;

    const product = state.inventory.find(p => p.sku.toLowerCase() === cleanQuery || p.name.toLowerCase().includes(cleanQuery));
    const resultArea = document.getElementById("products-result");

    if (product) {
        if (product.stock <= 0) {
            resultArea.innerHTML = `<span style="color: var(--danger)">⚠️ Sin stock de: ${product.name}</span>`;
            return;
        }
        addToCart(product);
        document.getElementById("sku-search").value = "";
        resultArea.innerHTML = `<span style="color: var(--success)">✅ Agregado: ${product.name}</span>`;
    } else {
        resultArea.innerHTML = `<span style="color: var(--danger)">❌ Cosmético no encontrado</span>`;
    }
}

function addToCart(product) {
    const existing = state.cart.find(item => item.sku === product.sku);
    if (existing) {
        if (existing.quantity >= product.stock) {
            alert("No puedes agregar más de las existencias reales en vitrina.");
            return;
        }
        existing.quantity++;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById("cart-items-list");
    if (!list) return;
    list.innerHTML = "";
    
    let total = 0;
    state.cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        const itemRow = document.createElement("div");
        itemRow.style.cssText = "display:flex; justify-content:space-between; padding:0.4rem; border-bottom:1px solid #ddd;";
        itemRow.innerHTML = `<span>💄 ${item.name} (x${item.quantity})</span><strong>$${subtotal.toFixed(2)}</strong>`;
        list.appendChild(itemRow);
    });

    document.getElementById("total-amount").innerText = `$${total.toFixed(2)}`;
}

function processSale() {
    const total = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (total === 0) {
        alert("El carrito está vacío.");
        return;
    }

    const method = document.getElementById("payment-method").value;

    // --- ENRUTAMIENTO DE CAJA SEGURO ---
    if (method === "MIXED") {
        // En una venta mixta el sistema de maquillaje asume liquidación balanceada 50/50 
        state.paymentMethodsStats.cash += (total / 2);
        state.paymentMethodsStats.card += (total / 2);
        state.cashBalance += (total / 2); // Solo ingresa a la caja chica el dinero físico
    } else {
        if (method === "CASH") {
            state.paymentMethodsStats.cash += total;
            state.cashBalance += total; // Suma directa al efectivo físico
        }
        if (method === "CARD") state.paymentMethodsStats.card += total;
        if (method === "TRANSFER") state.paymentMethodsStats.transfer += total;
    }

    // Actualizar existencias e indicadores analíticos
    state.cart.forEach(cartItem => {
        const item = state.inventory.find(p => p.sku === cartItem.sku);
        if (item) {
            item.stock -= cartItem.quantity;
            item.sold += cartItem.quantity;
        }
    });

    state.totalEarnings += total;
    state.totalSalesCount++;
    state.totalItemsCount += state.cart.reduce((s, i) => s + i.quantity, 0);
    
    // Inyectar venta al último bloque horario de la gráfica
    state.salesHistory.data[4] += total;

    alert(`✨ Venta completada de forma exitosa ($${total.toFixed(2)}).`);
    
    // Limpieza de estados del ciclo de venta
    state.cart = [];
    updateCartUI();
    renderInventory();
    updateCashUI();
    updateReportsUI();
    document.getElementById("products-result").innerText = "";
}

/* ==========================================================================
   📦 MÓDULO INVENTARIO
   ========================================================================== */
function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById("p-name").value.trim();
    const sku = document.getElementById("p-sku").value.trim().toUpperCase();
    const price = parseFloat(document.getElementById("p-price").value);
    const stock = parseInt(document.getElementById("p-stock").value);

    if (state.inventory.some(p => p.sku === sku)) {
        alert("Este SKU ya se encuentra registrado.");
        return;
    }

    state.inventory.push({ sku, name, price, stock, sold: 0 });
    renderInventory();
    updateReportsUI();
    document.getElementById("product-form").reset();
}

function renderInventory() {
    const tbody = document.getElementById("inventory-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    state.inventory.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><code>${p.sku}</code></td><td>${p.name}</td><td>$${p.price.toFixed(2)}</td><td>${p.stock} pz</td>`;
        tbody.appendChild(tr);
    });
}

/* ==========================================================================
   💰 CONTROL DE ENTRADAS Y SALIDAS DE CAJA CHICA (AUDITORÍA DE GASTOS)
   ========================================================================== */
function handleCashFlow(type) {
    const amountInput = document.getElementById("cash-flow-amount");
    const conceptInput = document.getElementById("cash-flow-concept");
    
    const amount = parseFloat(amountInput.value);
    const concept = conceptInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !concept) {
        alert("Por favor introduce un monto numérico válido y el concepto del movimiento.");
        return;
    }

    if (type === "OUT" && amount > state.cashBalance) {
        alert("❌ Transacción rechazada: No cuentas con suficiente fondo de efectivo para cubrir esa salida.");
        return;
    }

    // Procesamiento financiero del movimiento
    if (type === "IN") {
        state.cashBalance += amount;
        state.cashTransactions.push(`📥 Entrada: +$${amount.toFixed(2)} - Concepto: ${concept}`);
    } else {
        state.cashBalance -= amount;
        state.cashTransactions.push(`📤 Salida: -$${amount.toFixed(2)} - Concepto: ${concept}`);
    }

    // Resetear formulario interno de caja
    amountInput.value = "";
    conceptInput.value = "";
    updateCashUI();
}

function updateCashUI() {
    const container = document.getElementById("cash-status-card");
    if (!container) return;

    // Generar render dinámico con el balance real y la tira de auditoría de movimientos
    let historyHTML = state.cashTransactions.map(t => `<p style="font-size:0.85rem; border-bottom:1px solid #333; padding:2px 0;">${t}</p>`).join("");
    
    container.innerHTML = `
        <div style="margin-top:1rem; padding:1rem; border:1px solid var(--border-color); border-radius:8px; background: rgba(255,255,255,0.02)">
            <h4 style="color:var(--accent-rose)">Efectivo Real en Caja Chica</h4>
            <h2 style="font-size:2rem; margin:0.5rem 0; color:var(--success)">$${state.cashBalance.toFixed(2)}</h2>
            <div style="margin-top:1rem; text-align:left;">
                <h5 style="color:var(--text-muted); margin-bottom:0.5rem;">Bitácora de movimientos del turno:</h5>
                ${historyHTML || '<p style="color:var(--text-muted); font-size:0.85rem;">Sin movimientos manuales registrados.</p>'}
            </div>
        </div>
    `;
}

/* ==========================================================================
   📊 REPORTES FINANCIEROS Y GRÁFICOS (CHART.JS)
   ========================================================================== */
function initFinancialChart() {
    const canvas = document.getElementById('financial-chart');
    if (!canvas) return;

    // Destruir instancia previa para evitar fugas de memoria o parpadeos gráficos
    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.salesHistory.labels,
            datasets: [{
                label: 'Ventas de Maquillaje ($)',
                data: state.salesHistory.data,
                borderColor: '#e0a39a',
                backgroundColor: 'rgba(224, 163, 154, 0.05)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateReportsUI() {
    // Actualizar contenedor de métricas (Inyección dinámica sobre tu HTML)
    const metricsContainer = document.getElementById("metrics-container");
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1rem;">
                <div class="card"><h5>Ganancia Total</h5><h3>$${state.totalEarnings.toFixed(2)}</h3></div>
                <div class="card"><h5>Transacciones</h5><h3>${state.totalSalesCount}</h3></div>
                <div class="card"><h5>Unidades Vendidas</h5><h3>${state.totalItemsCount} pz</h3></div>
            </div>
        `;
    }

    if (state.chartInstance) {
        state.chartInstance.update();
    }

    // Listado: Más Vendidos
    const topList = document.getElementById("top-products-list");
    if (topList) {
        topList.innerHTML = "";
        const sorted = [...state.inventory].sort((a,b) => b.sold - a.sold);
        sorted.slice(0, 5).forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `<span>💄 ${p.name}</span> — <strong>${p.sold} pz vendidas</strong>`;
            topList.appendChild(li);
        });
    }

    // Listado: Stock Crítico
    const lowList = document.getElementById("low-stock-list");
    if (lowList) {
        lowList.innerHTML = "";
        const lowStock = state.inventory.filter(p => p.stock <= 5);
        if(lowStock.length === 0) {
            lowList.innerHTML = `<li style="color:var(--success)">✓ Todo el stock está en niveles óptimos</li>`;
        } else {
            lowStock.forEach(p => {
                const li = document.createElement("li");
                li.innerHTML = `<span style="color:var(--danger)">⚠️ ${p.name}</span> — <strong>Quedan ${p.stock} pz</strong>`;
                lowList.appendChild(li);
            });
        }
    }
}

/* ==========================================================================
   👥 MÓDULO GESTIÓN DE PERSONAL (USUARIOS)
   ========================================================================= */
function handleRegisterUser(e) {
    e.preventDefault();
    const name = document.getElementById("new-u-name").value.trim();
    const email = document.getElementById("new-u-email").value.trim();
    const role = document.getElementById("new-u-role").value;

    state.users.push({ name, email, role });
    renderUsersTable();
    document.getElementById("add-user-form").reset();
}

function renderUsersTable() {
    const tbody = document.getElementById("users-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    state.users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td><strong style="color:var(--accent-rose)">${u.role}</strong></td>`;
        tbody.appendChild(tr);
    });
}
