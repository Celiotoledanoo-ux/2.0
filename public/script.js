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
    cashBalance: 2500.00,
    cashTransactions: [],
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
   PLANTILLAS HTML DINÁMICAS (MÓDULOS BAJO DEMANDA)
   ========================================================================== */
const modulesHTML = {
    pos: () => `
        <div class="animate-fade">
            <div class="module-header">
                <h2>Punto de Venta</h2>
                <p>Procesa las ventas y escanea productos de maquillaje</p>
            </div>
            <div class="pos-grid">
                <div class="search-area card">
                    <div class="search-header"><h3>Buscar Productos</h3></div>
                    <div class="search-input-wrapper">
                        <i class="ri-barcode-line"></i>
                        <input type="text" id="sku-search" placeholder="Escanear SKU o buscar por nombre..." autocomplete="off">
                    </div>
                    <div id="products-result" class="products-grid">
                        <p class="placeholder-text">Esperando escaneo de producto...</p>
                    </div>
                </div>
                <div class="cart-area card">
                    <div class="cart-header"><h3><i class="ri-shopping-cart-2-line"></i> Carrito de Compras</h3></div>
                    <div id="cart-items-list" class="cart-list"></div>
                    <div class="cart-totals">
                        <div class="total-row"><span>Total a Pagar:</span><h3 id="total-amount">$0.00</h3></div>
                        <div class="payment-area">
                            <select id="payment-method">
                                <option value="CASH">💵 Efectivo</option>
                                <option value="CARD">💳 Tarjeta</option>
                                <option value="TRANSFER">📱 Transferencia</option>
                                <option value="MIXED">🔄 Pago Mixto (Combinado)</option>
                            </select>
                            <div id="mixed-payment-inputs" class="hidden" style="display: flex; gap: 0.5rem; width: 100%;">
                                <input type="number" id="mixed-cash" step="0.01" min="0" placeholder="Efectivo $">
                                <input type="number" id="mixed-digital" step="0.01" min="0" placeholder="Digital $">
                            </div>
                            <button id="btn-finish-sale" class="btn-success"><i class="ri-checkbox-circle-line"></i> Finalizar Venta</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`,
        
    inventory: (isCashier) => `
        <div class="animate-fade">
            <div class="module-header">
                <h2>Gestión de Inventario</h2>
                <p>Controla el stock y consulta el catálogo de cosméticos</p>
            </div>
            <div class="inventory-layout" style="${isCashier ? 'grid-template-columns: 1fr;' : ''}">
                ${isCashier ? '' : `
                <div class="card">
                    <h3>Nuevo Producto</h3>
                    <form id="product-form" autocomplete="off">
                        <input id="p-name" placeholder="Nombre" required>
                        <input id="p-sku" placeholder="SKU" required>
                        <input id="p-price" type="number" step="0.01" placeholder="Precio" required>
                        <input id="p-stock" type="number" placeholder="Stock" required>
                        <button type="submit" class="btn-submit">Guardar</button>
                    </form>
                </div>`}
                <div class="card table-card">
                    <h3>Existencias en Vitrina</h3>
                    <div class="table-responsive">
                        <table>
                            <thead><tr><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr></thead>
                            <tbody id="inventory-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`,

    cash: () => `
        <div class="animate-fade">
            <div class="module-header">
                <h2>Control de Caja Chica</h2>
                <p>Auditoría de gastos, entradas, salidas y flujo de efectivo del turno</p>
            </div>
            <div class="inventory-layout">
                <div class="card">
                    <h3>Registrar Movimiento</h3>
                    <input type="number" id="cash-flow-amount" step="0.01" placeholder="Monto $">
                    <input type="text" id="cash-flow-concept" placeholder="Concepto (ej. Proveedor Labiales)">
                    <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                        <button id="btn-cash-in" class="btn-success" style="padding:0.6rem;"><i class="ri-arrow-down-circle-line"></i> Entrada</button>
                        <button id="btn-cash-out" class="btn-primary" style="padding:0.6rem; background:linear-gradient(135deg, var(--danger), #c0392b); color:white;"><i class="ri-arrow-up-circle-line"></i> Salida</button>
                    </div>
                </div>
                <div class="card text-center" id="cash-status-card"></div>
            </div>
        </div>`,

    reports: () => `
        <div class="animate-fade">
            <div class="module-header">
                <h2>Reportes Financieros</h2>
                <p>Análisis comercial e indicadores analíticos de la boutique</p>
            </div>
            <div id="metrics-container"></div>
            <div class="card">
                <h3>📈 Flujo de Ventas</h3>
                <div style="position: relative; height:240px; width:100%;"><canvas id="financial-chart"></canvas></div>
            </div>
            <div class="reports-tables-grid" style="margin-top:1.5rem;">
                <div class="card"><h3>🏆 Top 5 Más Vendidos</h3><ul id="top-products-list" class="report-list"></ul></div>
                <div class="card"><h3>⚠️ Alerta de Stock Crítico</h3><ul id="low-stock-list" class="report-list"></ul></div>
            </div>
        </div>`,

    users: () => `
        <div class="animate-fade">
            <div class="module-header">
                <h2>Gestión de Personal</h2>
                <p>Administra los empleados del sistema y asignación de roles oficiales</p>
            </div>
            <div class="users-layout">
                <div class="card">
                    <h3>✨ Registrar Empleado</h3>
                    <form id="add-user-form" autocomplete="off">
                        <input type="text" id="new-u-name" placeholder="Nombre Completo" required>
                        <input type="email" id="new-u-email" placeholder="Correo Electrónico" required>
                        <select id="new-u-role">
                            <option value="CASHIER">Cajero(a)</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                        <button type="submit" class="btn-submit">Registrar Personal</button>
                    </form>
                </div>
                <div class="card table-card">
                    <h3>👥 Lista de Personal</h3>
                    <div class="table-responsive">
                        <table>
                            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
                            <tbody id="users-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`
};

/* ==========================================================================
   INICIALIZADOR DE EVENTOS E INTERFAZ CENTRAL
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
});

/* ==========================================================================
   SISTEMA DE NAVEGACIÓN Y VALIDACIÓN POR MATRIZ DE ROLES
   ========================================================================== */
function setupNavigation() {
    document.querySelectorAll(".sidebar-menu button").forEach(button => {
        button.addEventListener("click", () => {
            const targetModule = button.getAttribute("data-module");
            
            if (!checkModulePermission(targetModule)) {
                alert(`⛔ Acceso Denegado: Tu rol de ${state.currentRole} no tiene autorización para abrir el módulo de ${targetModule}.`);
                return;
            }

            document.querySelectorAll(".sidebar-menu button").forEach(b => b.classList.remove("active"));
            button.classList.add("active");

            // Renderizar dinámicamente el módulo seleccionado en el contenedor raíz
            renderModule(targetModule);
        });
    });
}

function checkModulePermission(moduleName) {
    const role = state.currentRole;
    if (role === "OWNER" || role === "ADMIN") return true;
    if (role === "MANAGER") return moduleName !== "users";
    if (role === "CASHIER") return moduleName === "pos" || moduleName === "inventory" || moduleName === "cash";
    return false;
}

function renderModule(moduleName) {
    const root = document.getElementById("content-root");
    if (!root) return;

    // Ejecutar inyección del HTML dinámico
    const isCashier = (state.currentRole === "CASHIER");
    root.innerHTML = modulesHTML[moduleName](isCashier);

    // Enlazar los escuchadores de eventos únicamente cuando el módulo correspondiente esté vivo
    if (moduleName === "pos") {
        document.getElementById("sku-search").addEventListener("keypress", (e) => {
            if (e.key === "Enter") handlePosSearch(e.target.value);
        });
        document.getElementById("payment-method").addEventListener("change", (e) => {
            const mixedInputs = document.getElementById("mixed-payment-inputs");
            if (e.target.value === "MIXED") {
                mixedInputs.classList.remove("hidden");
                const currentTotal = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
                document.getElementById("mixed-cash").value = (currentTotal / 2).toFixed(2);
                document.getElementById("mixed-digital").value = (currentTotal / 2).toFixed(2);
            } else {
                mixedInputs.classList.add("hidden");
            }
        });
        document.getElementById("btn-finish-sale").addEventListener("click", processSale);
        updateCartUI();
    }

    if (moduleName === "inventory") {
        if (!isCashier) {
            document.getElementById("product-form").addEventListener("submit", handleAddProduct);
        }
        renderInventory();
    }

    if (moduleName === "cash") {
        document.getElementById("btn-cash-in").addEventListener("click", () => handleCashFlow("IN"));
        document.getElementById("btn-cash-out").addEventListener("click", () => handleCashFlow("OUT"));
        updateCashUI();
    }

    if (moduleName === "reports") {
        updateReportsUI();
        setTimeout(initFinancialChart, 50); // Tiempo de espera mínimo seguro para levantar el Canvas
    }

    if (moduleName === "users") {
        document.getElementById("add-user-form").addEventListener("submit", handleRegisterUser);
        renderUsersTable();
    }
}

/* ==========================================================================
   SISTEMA DE AUTENTICACIÓN (LOGIN/LOGOUT)
   ========================================================================== */
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const selectedRole = document.getElementById("login-role").value;

    state.currentUser = email.split('@')[0];
    state.currentRole = selectedRole;

    document.getElementById("user-display").innerText = `✨ ${state.currentUser} (${state.currentRole})`;
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("main-system").classList.remove("hidden");

    // Abrir por defecto el punto de venta tras acceder con éxito
    document.getElementById("nav-pos").click();
}

function handleLogout() {
    state.currentUser = null;
    state.currentRole = null;
    state.cart = [];
    document.getElementById("main-system").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("login-form").reset();
    document.getElementById("content-root").innerHTML = "";
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
        itemRow.style.cssText = "display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;";
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

    if (method === "MIXED") {
        const cashInput = parseFloat(document.getElementById("mixed-cash").value) || 0;
        const digitalInput = parseFloat(document.getElementById("mixed-digital").value) || 0;
        
        if (Math.abs((cashInput + digitalInput) - total) > 0.01) {
            alert(`❌ Ajuste incorrecto: La suma combinada ($${(cashInput + digitalInput).toFixed(2)}) no cuadra con el total ($${total.toFixed(2)}).`);
            return;
        }
        state.paymentMethodsStats.cash += cashInput;
        state.paymentMethodsStats.card += digitalInput;
        state.cashBalance += cashInput;
    } else {
        if (method === "CASH") {
            state.paymentMethodsStats.cash += total;
            state.cashBalance += total;
        }
        if (method === "CARD") state.paymentMethodsStats.card += total;
        if (method === "TRANSFER") state.paymentMethodsStats.transfer += total;
    }

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
    state.salesHistory.data[4] += total; // Carga al bloque horario por defecto

    alert(`✨ Venta completada de forma exitosa ($${total.toFixed(2)}).`);
    
    state.cart = [];
    updateCartUI();
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
   💰 CONTROL DE CAJA CHICA (ENTRADAS/SALIDAS)
   ========================================================================== */
function handleCashFlow(type) {
    const amountInput = document.getElementById("cash-flow-amount");
    const conceptInput = document.getElementById("cash-flow-concept");
    
    const amount = parseFloat(amountInput.value);
    const concept = conceptInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !concept) {
        alert("Introduce un monto numérico válido y el concepto del movimiento.");
        return;
    }

    if (type === "OUT" && amount > state.cashBalance) {
        alert("❌ Fondos Insuficientes en caja chica.");
        return;
    }

    if (type === "IN") {
        state.cashBalance += amount;
        state.cashTransactions.push(`📥 Entrada: +$${amount.toFixed(2)} - Motivo: ${concept}`);
    } else {
        state.cashBalance -= amount;
        state.cashTransactions.push(`📤 Salida: -$${amount.toFixed(2)} - Motivo: ${concept}`);
    }

    amountInput.value = "";
    conceptInput.value = "";
    updateCashUI();
}

function updateCashUI() {
    const container = document.getElementById("cash-status-card");
    if (!container) return;

    let historyHTML = state.cashTransactions.map(t => `<p style="font-size:0.85rem; border-bottom:1px solid var(--border-color); padding:4px 0; text-align:left;">${t}</p>`).join("");
    
    container.innerHTML = `
        <div style="margin-top:0.5rem; padding:1.25rem; border:1px solid var(--border-color); border-radius:8px; background: rgba(255,255,255,0.01)">
            <h4 style="color:var(--accent-rose); text-align:left;">Efectivo Disponible</h4>
            <h2 style="font-size:2.2rem; margin:0.5rem 0; color:var(--success); text-align:left;">$${state.cashBalance.toFixed(2)}</h2>
            <div style="margin-top:1.25rem; text-align:left;">
                <h5 style="color:var(--text-muted); margin-bottom:0.5rem;">Auditoría de Movimientos:</h5>
                <div style="max-height: 150px; overflow-y:auto;">
                    ${historyHTML || '<p style="color:var(--text-muted); font-size:0.85rem;">Sin transacciones manuales el día de hoy.</p>'}
                </div>
            </div>
        </div>`;
}

/* ==========================================================================
   📊 REPORTES FINANCIEROS Y GRÁFICOS (CHART.JS)
   ========================================================================== */
function initFinancialChart() {
    const canvas = document.getElementById('financial-chart');
    if (!canvas) return;

    if (state.chartInstance) state.chartInstance.destroy();

    const ctx = canvas.getContext('2d');
    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.salesHistory.labels,
            datasets: [{
                label: 'Ventas ($)',
                data: state.salesHistory.data,
                borderColor: '#e0a39a',
                backgroundColor: 'rgba(224, 163, 154, 0.04)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateReportsUI() {
    const metricsContainer = document.getElementById("metrics-container");
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div class="metrics-grid">
                <div class="card metric-card"><div class="metric-icon">💰</div><div class="metric-info"><h4>Ganancia Total</h4><p>$${state.totalEarnings.toFixed(2)}</p></div></div>
                <div class="card metric-card"><div class="metric-icon">🛍️</div><div class="metric-info"><h4>Transacciones</h4><p>${state.totalSalesCount}</p></div></div>
                <div class="card metric-card"><div class="metric-icon">💄</div><div class="metric-info"><h4>Unidades Vendidas</h4><p>${state.totalItemsCount} pz</p></div></div>
            </div>`;
    }

    const topList = document.getElementById("top-products-list");
    if (topList) {
        topList.innerHTML = "";
        const sorted = [...state.inventory].sort((a,b) => b.sold - a.sold);
        sorted.slice(0, 5).forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `<span>💄 ${p.name}</span><strong>${p.sold} pz</strong>`;
            topList.appendChild(li);
        });
    }

    const lowList = document.getElementById("low-stock-list");
    if (lowList) {
        lowList.innerHTML = "";
        const lowStock = state.inventory.filter(p => p.stock <= 5);
        if(lowStock.length === 0) {
            lowList.innerHTML = `<li style="color:var(--success)">✓ Todo el stock está en niveles óptimos</li>`;
        } else {
            lowStock.forEach(p => {
                const li = document.createElement("li");
                li.innerHTML = `<span style="color:var(--danger)">⚠️ ${p.name}</span><strong>Quedan ${p.stock} pz</strong>`;
                lowList.appendChild(li);
            });
        }
    }
}

/* ==========================================================================
   👥 GESTIÓN DE PERSONAL (USUARIOS)
   ========================================================================== */
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
