/* ==========================================================================
   ESTADO MAESTRO DEL PUNTO DE VENTA (Integración Total)
   ========================================================================== */
const state = {
    currentRole: null,
    currentUserEmail: null,
    cart: [],
    inventory: [
        { sku: "LIP01", name: "Labial Matte Rose Quartz", price: 299.00, stock: 15, sold: 0 },
        { sku: "BASE02", name: "Base Fluida Glow Foundation", price: 450.00, stock: 8, sold: 0 },
        { sku: "PAL03", name: "Paleta de Sombras Nude Nectar", price: 580.00, stock: 4, sold: 0 }
    ],
    users: [
        { name: "Ana Cajera", role: "CASHIER" },
        { name: "Carlos Gerente", role: "MANAGER" },
        { name: "Admin General", role: "ADMIN" },
        { name: "Boutique Owner", role: "OWNER" }
    ],
    // --- AUDITORÍA DE CAJA EN EFECTIVO ---
    cashChicaFisica: 2500.00,
    digitalVaultSales: 0,
    
    // --- ESTADÍSTICAS RECOPILADAS ---
    totalEarnings: 0,
    totalSalesCount: 0,
    totalItemsCount: 0,
    salesHistory: {
        labels: ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"],
        data: [0, 0, 0, 0, 0, 0]
    },
    chartInstance: null
};

/* ==========================================================================
   CARGA INICIAL EN DOM
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    
    // Enlaces de Formularios y Acciones Core
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
    document.getElementById("btn-finish-sale").addEventListener("click", processSale);
    document.getElementById("product-form").addEventListener("submit", handleAddProduct);
    document.getElementById("add-user-form").addEventListener("submit", handleAddUser);
    document.getElementById("payment-method").addEventListener("change", handlePaymentMethodChange);
    
    // Control manual de flujos de efectivo de caja
    document.getElementById("btn-cash-in").addEventListener("click", () => handleCashFlow('IN'));
    document.getElementById("btn-cash-out").addEventListener("click", () => handleCashFlow('OUT'));

    // Buscador del POS
    document.getElementById("sku-search").addEventListener("keypress", (e) => {
        if (e.key === "Enter") handlePosSearch(e.target.value);
    });

    // Construcción inicial de vistas de datos
    renderInventory();
    renderUsers();
    renderCashStatus();
    initFinancialChart();
    updateReportsUI();
});

/* ==========================================================================
   🔏 MATRIX DE SEGURIDAD: CONTROL DE ACCESOS POR ROL
   ========================================================================== */
function setupNavigation() {
    const navMapping = {
        'nav-pos': 'pos', 'nav-inventory': 'inventory', 
        'nav-cash': 'cash', 'nav-reports': 'reports', 'nav-users': 'users'
    };

    Object.keys(navMapping).forEach(btnId => {
        const button = document.getElementById(btnId);
        if (button) {
            button.addEventListener("click", () => {
                document.querySelectorAll(".sidebar-menu button").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".module").forEach(m => m.classList.add("hidden"));
                
                button.classList.add("active");
                const targetModule = navMapping[btnId];
                document.getElementById(targetModule).classList.remove("hidden");

                // Ejecutar evaluación de permisos en tiempo real al brincar de pantalla
                evaluateRoleAccess(targetModule);
            });
        }
    });
}

function evaluateRoleAccess(moduleName) {
    const role = state.currentRole;

    // 1. Reglas para Inventario: Bloquea a CASHIER
    if (moduleName === 'inventory') {
        const isRestricted = (role === 'CASHIER');
        document.getElementById("inventory-restricted-msg").classList.toggle("hidden", !isRestricted);
        document.getElementById("inventory-content").classList.toggle("hidden", isRestricted);
    }
    // 2. Reglas para Reportes: Bloquea a CASHIER
    if (moduleName === 'reports') {
        const isRestricted = (role === 'CASHIER');
        document.getElementById("reports-restricted-msg").classList.toggle("hidden", !isRestricted);
        document.getElementById("reports-content").classList.toggle("hidden", isRestricted);
    }
    // 3. Reglas para Gestión de Personal (Usuarios): Bloquea a CASHIER y MANAGER
    if (moduleName === 'users') {
        const isRestricted = (role === 'CASHIER' || role === 'MANAGER');
        document.getElementById("users-restricted-msg").classList.toggle("hidden", !isRestricted);
        document.getElementById("users-content").classList.toggle("hidden", isRestricted);
    }
}

function handleLogin(e) {
    e.preventDefault();
    state.currentUserEmail = document.getElementById("email").value;
    state.currentRole = document.getElementById("login-role").value;
    
    document.getElementById("user-display").innerText = `👤 [${state.currentRole}] | ${state.currentUserEmail.split('@')[0]}`;
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("main-system").classList.remove("hidden");
    
    // Iniciar por defecto en terminal de cobros
    document.getElementById("nav-pos").click();
}

function handleLogout() {
    state.currentRole = null;
    state.cart = [];
    updateCartUI();
    document.getElementById("main-system").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("login-form").reset();
}

/* ==========================================================================
   🛒 PUNTO DE VENTA Y ARQUEO PASARELAS DE PAGO
   ========================================================================== */
function handlePaymentMethodChange(e) {
    const mixedInputs = document.getElementById("mixed-payment-inputs");
    if (e.target.value === "MIXED") {
        mixedInputs.classList.remove("hidden");
        const halfTotal = (calculateCartTotal() / 2).toFixed(2);
        document.getElementById("mixed-cash").value = halfTotal;
        document.getElementById("mixed-digital").value = halfTotal;
    } else {
        mixedInputs.classList.add("hidden");
    }
}

function calculateCartTotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function handlePosSearch(query) {
    const clean = query.trim().toLowerCase();
    if (!clean) return;

    const product = state.inventory.find(p => p.sku.toLowerCase() === clean || p.name.toLowerCase().includes(clean));
    const res = document.getElementById("products-result");

    if (product) {
        if (product.stock <= 0) {
            res.innerHTML = `<p style="color:var(--danger)">⚠️ Producto sin existencias de momento.</p>`;
            return;
        }
        const existing = state.cart.find(item => item.sku === product.sku);
        if (existing && existing.quantity >= product.stock) {
            alert("No
