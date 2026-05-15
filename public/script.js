/* ==========================================================================
   ESTADO GLOBAL DEL SISTEMA (GLOW BEAUTY POS)
   ========================================================================== */
const state = {
    currentUser: null,
    currentRole: null,
    cart: [],
    inventory: [],
    users: [],
    cashBalance: 2500.00,
    cashTransactions: [],
    totalEarnings: 0,
    totalSalesCount: 0,
    totalItemsCount: 0,
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
                        <input id="p-name" name="name" placeholder="Nombre (ej. Labial Matte)" required>
                        <input id="p-brand" name="brand" placeholder="Marca (ej. Maybelline)" required>
                        <input id="p-tone" name="tone" placeholder="Tono/Color (ej. Superstay 20)" required>
                        <input id="p-sku" name="sku" placeholder="SKU o Código de Barras" required>
                        <input id="p-price" name="price" type="number" step="0.01" placeholder="Precio $" required>
                        <input id="p-stock" name="stock" type="number" placeholder="Cantidad en Stock" required>
                        <button type="submit" class="btn-submit">Guardar Producto</button>
                    </form>
                </div>`}
                <div class="card table-card">
                    <h3>Existencias en Vitrina</h3>
                    <div class="table-responsive">
                        <table>
                            <thead><tr><th>SKU</th><th>Nombre / Tono</th><th>Precio</th><th>Stock</th></tr></thead>
                            <tbody id="inventory-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`,

    cash: () => `
        <div class="animate-fade">
            <div class="module-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h2>Control de Caja Chica</h2>
                    <p>Auditoría de gastos, entradas, salidas y flujo de efectivo del turno</p>
                </div>
            </div>
            <div class="inventory-layout">
                <div class="card">
                    <h3>Registrar Movimiento</h3>
                    <input type="number" id="cash-flow-amount" step="0.01" placeholder="Monto $" style="margin-bottom:1rem;">
                    <input type="text" id="cash-flow-concept" placeholder="Concepto (ej. Proveedor Labiales)" style="margin-bottom:1rem;">
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
            <div class="module-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2>Reportes Financieros</h2>
                    <p>Análisis comercial e indicadores analíticos de la boutique</p>
                </div>
                <div class="filter-group" style="display: flex; gap: 0.5rem; background: var(--bg-input); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <button id="btn-report-day" class="active" data-range="day" style="padding: 0.5rem 1rem; border: none; background: none; color: var(--text-main); font-size: 0.85rem; font-weight: 600; cursor: pointer; border-radius: 6px; transition: var(--transition);">Hoy</button>
                    <button id="btn-report-week" data-range="week" style="padding: 0.5rem 1rem; border: none; background: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; border-radius: 6px; transition: var(--transition);">Esta Semana</button>
                    <button id="btn-report-month" data-range="month" style="padding: 0.5rem 1rem; border: none; background: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; border-radius: 6px; transition: var(--transition);">Este Mes</button>
                </div>
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
                        <input type="text" id="new-u-name" placeholder="Nombre Completo" required style="margin-bottom:1rem;">
                        <input type="email" id="new-u-email" placeholder="Correo Electrónico" required style="margin-bottom:1rem;">
                        <select id="new-u-role" style="margin-bottom:1rem;">
                            <option value="seller">Cajero(a)</option>
                            <option value="manager">Gerente</option>
                            <option value="admin">Administrador</option>
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
   🔐 AUTENTICACIÓN ASÍNCRONA REAL
   ========================================================================== */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const submitBtn = e.target.querySelector("button[type='submit']");

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Validando...`;
        }

        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email, password }) 
        });

        const result = await response.json();
        if (!response.ok || result.status === 'fail') throw new Error(result.message || 'Credenciales inválidas.');

        const user = result.data.user;
        const session = result.data.session;

        state.currentUser = user.name;
        state.currentRole = user.role?.toLowerCase();
        
        localStorage.setItem('pos_token', session.accessToken);
        localStorage.setItem('pos_user_name', user.name);
        localStorage.setItem('pos_user_role', state.currentRole);

        document.getElementById("user-display").innerText = `✨ ${state.currentUser} (${state.currentRole.toUpperCase()})`;
        document.getElementById("auth-screen").classList.add("hidden");
        document.getElementById("main-system").classList.remove("hidden");

        document.getElementById("nav-pos").click();
    } catch (error) {
        alert(`❌ Error de Acceso: ${error.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="ri-login-circle-line"></i> Entrar al Sistema`;
        }
    }
}

function checkActiveSession() {
    const savedToken = localStorage.getItem('pos_token');
    const savedName = localStorage.getItem('pos_user_name');
    const savedRole = localStorage.getItem('pos_user_role');

    if (savedToken && savedName && savedRole) {
        state.currentUser = savedName;
        state.currentRole = savedRole;

        const userDisplay = document.getElementById("user-display");
        if (userDisplay) userDisplay.innerText = `✨ ${savedName} (${savedRole.toUpperCase()})`;
        
        document.getElementById("auth-screen").classList.add("hidden");
        document.getElementById("main-system").classList.remove("hidden");
    }
}

/* ==========================================================================
   ⚙️ SISTEMA DE NAVEGACIÓN Y CARGADOR DINÁMICO COMPLETOS
   ========================================================================== */
function setupNavigation() {
    document.querySelectorAll(".sidebar-menu button").forEach(button => {
        button.addEventListener("click", () => {
            const targetModule = button.getAttribute("data-module");
            if (!checkModulePermission(targetModule)) {
                alert(`⛔ Acceso Denegado: Tu rol de ${state.currentRole.toUpperCase()} no tiene autorización.`);
                return;
            }
            document.querySelectorAll(".sidebar-menu button").forEach(b => b.classList.remove("active"));
            button.classList.add("active");
            renderModule(targetModule);
        });
    });
}

function checkModulePermission(moduleName) {
    const role = state.currentRole;
    if (role === "owner" || role === "admin") return true;
    if (role === "manager") return moduleName !== "users";
    if (role === "seller" || role === "cashier") return moduleName === "pos" || moduleName === "inventory" || moduleName === "cash";
    return false;
}

function renderModule(moduleName) {
    const root = document.getElementById("content-root");
    if (!root) return;

    const isCashier = (state.currentRole === "seller" || state.currentRole === "cashier");
    root.innerHTML = modulesHTML[moduleName](isCashier);

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
        if (!isCashier) document.getElementById("product-form").addEventListener("submit", handleAddProduct);
        renderInventory();
    }

    if (moduleName === "cash") {
        document.getElementById("btn-cash-in").addEventListener("click", () => handleCashFlow("IN"));
        document.getElementById("btn-cash-out").addEventListener("click", () => handleCashFlow("OUT"));
        updateCashUI();
    }

    if (moduleName === "reports") {
        initFinancialChart('day');
    }

    if (moduleName === "users") {
        document.getElementById("add-user-form").addEventListener("submit", handleRegisterUser);
        renderUsersTable();
    }
}

/* ==========================================================================
   🛒 PUNTO DE VENTA (POS) ASÍNCRONO REAL
   ========================================================================== */
async function handlePosSearch(query) {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;

    try {
        const token = localStorage.getItem('pos_token');
        const response = await fetch(`/api/v1/inventory?sku=${cleanQuery}&name=${cleanQuery}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        const products = result.data?.products || result.data || [];
        const product = Array.isArray(products) ? products[0] : products;

        const resultArea = document.getElementById("products-result");
        if (product && product.sku) {
            if (product.stock <= 0) {
                resultArea.innerHTML = `<span style="color:var(--danger)">⚠️ Sin stock: ${product.name}</span>`;
                return;
            }
            addToCart(product);
            document.getElementById("sku-search").value = "";
            resultArea.innerHTML = `<span style="color:var(--success)">✅ Agregado: ${product.name}</span>`;
        } else {
            resultArea.innerHTML = `<span style="color:var(--danger)">❌ Cosmético no encontrado</span>`;
        }
    } catch (err) {
        console.error("[POS_SEARCH_ERROR]:", err);
    }
}

function addToCart(product) {
    const existing = state.cart.find(item => item.sku === product.sku);
    if (existing) {
        if (existing.quantity >= product.stock) {
            alert("No puedes exceder el stock real en vitrina.");
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
        const div = document.createElement("div");
        div.style.cssText = "display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;";
        div.innerHTML = `<span>💄 ${item.name} ${item.tone ? `(${item.tone})` : ''} (x${item.quantity})</span><strong>$${subtotal.toFixed(2)}</strong>`;
        list.appendChild(div);
    });
    document.getElementById("total-amount").innerText = `$${total.toFixed(2)}`;
}

async function processSale() {
    const total = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (total === 0) return alert("El carrito está vacío.");

    const token = localStorage.getItem('pos_token');
    const method = document.getElementById("payment-method").value;
    let payload = { paymentMethod: method, total, items: state.cart };

    if (method === "MIXED") {
        const cash = parseFloat(document.getElementById("mixed-cash").value) || 0;
        const digital = parseFloat(document.getElementById("mixed-digital").value) || 0;
        if (Math.abs((cash + digital) - total) > 0.01) return alert("La suma combinada no cuadra.");
        payload.cashAmount = cash;
        payload.digitalAmount = digital;
    }

    try {
        const response = await fetch('/api/v1/sales', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Error al procesar la venta en el servidor.');
        alert(`✨ Venta completada de forma exitosa ($${total.toFixed(2)}).`);
        state.cart = [];
        updateCartUI();
        document.getElementById("products-result").innerText = "";
    } catch (err) {
        alert(`❌ Error: ${err.message}`);
    }
}

/* ==========================================================================
   📦 MÓDULO INVENTARIO REAL
   ========================================================================== */
async function handleAddProduct(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const token = localStorage.getItem('pos_token');

    const productData = {
        name: formData.get('name').trim(),
        brand: formData.get('brand').trim(),
        tone: formData.get('tone').trim(), 
        sku: formData.get('sku').trim().toUpperCase(),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock'), 10)
    };

    try {
        const response = await fetch('/api/v1/inventory', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        if (!response.ok || result.status === 'fail' || result.status === 'error') {
            throw new Error(result.message || 'El SKU ya existe o los datos son inválidos.');
        }

        form.reset();
        await renderInventory();
        alert('✅ Cosmético agregado con éxito al catálogo.');
    } catch (err) {
        alert(`❌ Error al guardar: ${err.message}`);
    }
}

async function renderInventory() {
    const tbody = document.getElementById("inventory-body");
    if (!tbody) return;

    const token = localStorage.getItem('pos_token');

    try {
        const response = await fetch('/api/v1/inventory', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        tbody.innerHTML = "";
        
        const productsList = result.data?.products || result.data || [];
        productsList.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><code>${p.sku}</code></td>
                <td><strong>${p.brand || ''}</strong> - ${p.name} <small style="color:var(--accent-rose)">(${p.tone || 'N/A'})</small></td>
                <td>$${Number(p.price).toFixed(2)}</td>
                <td>${p.stock} pz</td>`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("[RENDER_INVENTORY_ERROR]:", err);
    }
}

/* ==========================================================================
   💰 CONTROL DE CAJA CHICA PERSISTENTE
   ========================================================================== */
async function handleCashFlow(type) {
    const amountInput = document.getElementById("cash-flow-amount");
    const conceptInput = document.getElementById("cash-flow-concept");
    const amount = parseFloat(amountInput.value);
    const concept = conceptInput.value.trim();
    const token = localStorage.getItem('pos_token');

    if (isNaN(amount) || amount <= 0 || !concept) return alert("Introduce datos válidos.");

    try {
        const response = await fetch('/api/v1/cash/transaction', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, amount, concept })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error en flujo de caja.');
        amountInput.value = ""; 
        conceptInput.value = "";
        await updateCashUI();
        alert(result.message || "Movimiento registrado.");
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

async function updateCashUI() {
    const container = document.getElementById("cash-status-card");
    if (!container) return;
    
    const token = localStorage.getItem('pos_token');

    try {
        const response = await fetch('/api/v1/cash/status', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const session = result.data?.session;
        state.cashBalance = Number(session?.actual_amount || session?.initial_amount || 2500.00);
        const transactions = result.data?.transactions || [];

        let historyHTML = transactions.map(t => {
            const isEntry = t.type === 'IN';
            return `<p style="font-size:0.85rem; border-bottom:1px solid var(--border-color); padding:4px 0;">
                ${isEntry ? '📥 Entrada' : '📤 Salida'}: $${Number(t.amount).toFixed(2)} - Motivo: ${t.concept}
            </p>`;
        }).join("");

        container.innerHTML = `
            <div style="padding:1.25rem; border:1px solid var(--border-color); border-radius:8px; background:rgba(255,255,255,0.01)">
                <h4 style="color:var(--accent-rose)">Efectivo Disponible</h4>
                <h2 style="font-size:2.2rem; margin:0.5rem 0; color:var(--success)">$${state.cashBalance.toFixed(2)}</h2>
                <div style="margin-top:1.25rem;">
                    <h5 style="color:var(--text-muted)">Auditoría de Movimientos:</h5>
                    <div style="max-height:150px; overflow-y:auto;">${historyHTML || 'Sin movimientos manuales hoy.'}</div>
                </div>
            </div>`;
    } catch (err) {
        container.innerHTML = `<p style="color:var(--danger)">⚠️ Error al sincronizar caja.</p>`;
    }
}

/* ==========================================================================
   📊 REPORTES FINANCIEROS Y GRÁFICOS REALES
   ========================================================================== */
async function initFinancialChart(range = 'day') {
    await updateReportsUI(range);
    setupReportFilterListeners();
}

function setupReportFilterListeners() {
    document.querySelectorAll('.filter-group button').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', async (e) => {
            const btn = e.target;
            const selectedRange = btn.getAttribute('data-range');
            document.querySelectorAll('.filter-group button').forEach(b => { b.classList.remove('active'); b.style.color = 'var(--text-muted)'; });
            btn.classList.add('active'); btn.style.color = 'var(--text-main)';
            if (state.chartInstance) { state.chartInstance.destroy(); state.chartInstance = null; }
            await updateReportsUI(selectedRange);
        });
    });
}

async function updateReportsUI(range = 'day') {
    const metricsContainer = document.getElementById("metrics-container");
    const topList = document.getElementById("top-products-list");
    const lowList = document.getElementById("low-stock-list");
    const token = localStorage.getItem('pos_token');

    try {
        const response = await fetch(`/api/v1/reports/summary?range=${range}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const reportData = result.data;

        if (metricsContainer) {
            metricsContainer.innerHTML = `
                <div class="metrics-grid">
                    <div class="card metric-card">
                        <div class="metric-icon">💰</div>
                        <div class="metric-info"><h4>Ingresos</h4><p>$${Number(reportData.metrics.total_revenue).toFixed(2)}</p></div>
                    </div>
                    <div class="card metric-card">
                        <div class="metric-icon">🛍️</div>
                        <div class="metric-info"><h4>Transacciones</h4><p>${reportData.metrics.sales_count} ventas</p></div>
                    </div>
                    <div class="card metric-card">
                        <div class="metric-icon">💄</div>
                        <div class="metric-info"><h4>Vitrinas</h4><p style="color:${reportData.business_status.health_score==='CRITICAL'?'var(--danger)':'var(--success)'}">${reportData.business_status.message}</p></div>
                    </div>
                </div>`;
        }

        if (topList) {
            topList.innerHTML = (reportData.metrics.top_products || []).map(p => `<li><span>💄 ${p.name}</span><strong>${p.quantity} pz</strong></li>`).join("") || '<li>Sin ventas</li>';
        }

        if (lowList) {
            lowList.innerHTML = (reportData.metrics.inventory_summary.items || []).map(p => `<li><span style="color:var(--danger)">⚠️ ${p.name}</span><strong>Quedan ${p.stock} pz</strong></li>`).join("") || '<li style="color:var(--success)">Stock óptimo</li>';
        }

        const canvas = document.getElementById('financial-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const chartConfig = reportData.metrics.hourly_chart || { labels: [], data: [] };
            state.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartConfig.labels,
                    datasets: [{ label: 'Ingresos ($)', data: chartConfig.data, borderColor: '#e0a39a', backgroundColor: 'rgba(224, 163, 154, 0.04)', borderWidth: 3, tension: 0.3, fill: true }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    } catch (err) {
        console.error("[REPORTS_UI_ERROR]:", err);
    }
}

/* ==========================================================================
   👥 GESTIÓN DE PERSONAL (USUARIOS)
   ========================================================================== */
async function handleRegisterUser(e) {
    e.preventDefault();
    const name = document.getElementById("new-u-name").value.trim();
    const email = document.getElementById("new-u-email").value.trim();
    const role = document.getElementById("new-u-role").value;
    const token = localStorage.getItem('pos_token');

    try {
        const response = await fetch('/api/v1/users', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, role })
        });
        if (!response.ok) throw new Error('Error al registrar personal en el servidor.');
        document.getElementById("add-user-form").reset();
        await renderUsersTable();
        alert('👥 Empleado registrado correctamente.');
    } catch (err) {
        alert(`❌ Error: ${err.message}`);
    }
}

async function renderUsersTable() {
    const tbody = document.getElementById("users-body");
    if (!tbody) return;
    const token = localStorage.getItem('pos_token');
    
    try {
        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        tbody.innerHTML = "";
        (result.data || []).forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td><strong style="color:var(--accent-rose)">${u.role?.toUpperCase()}</strong></td>`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("[RENDER_USERS_ERROR]:", err);
    }
}

/* ==========================================================================
   INICIALIZADOR DE EVENTOS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    checkActiveSession();
    
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.reload();
    });
});
