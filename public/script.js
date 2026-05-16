// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let allData = [];
let cart = [];
let currentUser = null;

// Formateador de moneda (Pesos Mexicanos)
const fmt = (n) =>
  "$" + Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Sistema de Notificaciones Toast
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return alert(msg);
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ==========================================
// CONTROL DE SESIÓN EN PANTALLA ÚNICA
// ==========================================
function checkAuth() {
  const token = localStorage.getItem("pos_token");
  const userData = localStorage.getItem("pos_user");
  const authScreen = document.getElementById("auth-screen");
  const mainApp = document.getElementById("content-root");

  if (!token || !userData) {
    if (authScreen) authScreen.classList.remove("hidden");
    if (mainApp) mainApp.classList.add("hidden");
    return false;
  }

  currentUser = JSON.parse(userData);
  
  if (authScreen) authScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("hidden");

  // Inyectar nombre y rol del empleado (admin / cashier según tu ENUM)
  const userDisplay = document.getElementById("user-display");
  if (userDisplay) {
    const rolFormateado = currentUser.role === 'admin' ? 'Administrador' : 'Cajero';
    userDisplay.innerHTML = `
      <span class="font-bold">${currentUser.name || 'Empleado'}</span>
      <span class="text-xs block text-gray-400">${rolFormateado}</span>
    `;
  }
  return true;
}

// ==========================================
// ENRUTADOR POR MÓDULOS (data-module)
// ==========================================
document.querySelectorAll(".sidebar-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    
    const targetModule = btn.dataset.module;
    const targetView = document.getElementById("view-" + targetModule);
    if (targetView) {
      targetView.classList.add("active");
      initModuleData(targetModule);
    }
  });
});

function initModuleData(moduleName) {
  switch(moduleName) {
    case 'inventory':
      if (typeof renderInventarioTabla === 'function') renderInventarioTabla();
      break;
    case 'reports':
      if (window.Chart && typeof cargarGraficasReportes === 'function') cargarGraficasReportes();
      break;
    case 'users':
      if (typeof cargarListaUsuarios === 'function') cargarListaUsuarios();
      break;
    case 'cash':
      if (typeof cargarFlujoCaja === 'function') cargarFlujoCaja();
      break;
  }
}

// ==========================================
// CORRECCIÓN: ESCANER ADAPTADO A TU COLUMNA 'sku'
// ==========================================
const barcodeInput = document.getElementById("barcode-input");
if (barcodeInput) {
  barcodeInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = this.value.trim();
      if (!code) return;

      // CORRECCIÓN: Buscamos por 'sku' e 'id' tal como definiste en tu SQL
      const product = allData.find(p => p.sku === code || p.id === code);

      if (product) {
        agregarAlCarritoPorObjeto(product, 1);
        showToast(`Agregado: ${product.name}`);
      } else {
        showToast("Producto no registrado o sin inventario en vitrina");
      }
      this.value = "";
    }
  });
}

// Reloj del sistema
function updateClock() {
  const display = document.getElementById("datetime-display");
  if (display) {
    display.textContent = new Date().toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
}
updateClock();
setInterval(updateClock, 30000);

// ==========================================
// CORRECCIÓN: SELECTOR CON LAS COLUMNAS REALES DE TU SQL
// ==========================================
function refreshProductSelect() {
  const select = document.getElementById("cart-product-select");
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = `<option value="">Seleccionar manualmente...</option>`;

  allData
    .filter((p) => p.stock > 0) // Usamos 'stock' de tu schema
    .forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id; // CORRECCIÓN: 'p.id' en lugar de backendId
      
      // Inyectamos marca y tono para que luzca premium como pide tu negocio Glow Beauty
      const marcaTono = (p.brand && p.tone) ? ` [${p.brand} - ${p.tone}]` : '';
      option.textContent = `${p.name}${marcaTono} — ${fmt(p.price)} (${p.stock} disp.)`;
      select.appendChild(option);
    });

  select.value = currentValue;
}

// ==========================================
// CONTROL DEL CARRITO DE COMPRAS
// ==========================================
function addToCart() {
  const select = document.getElementById("cart-product-select");
  if (!select) return;
  const productId = select.value;
  const qtyInput = document.getElementById("cart-qty");
  const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

  if (!productId) return showToast("Selecciona un producto");

  const product = allData.find((r) => r.id === productId);
  if (!product) return;

  agregarAlCarritoPorObjeto(product, qty);
}

function agregarAlCarritoPorObjeto(product, qty) {
  const existing = cart.find((c) => c.id === product.id); // Sincronizado con 'id'

  if (existing) {
    if (existing.qty + qty > product.stock) return showToast("Stock insuficiente en vitrina");
    existing.qty += qty;
  } else {
    if (qty > product.stock) return showToast("Stock insuficiente en vitrina");
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty,
    });
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById("cart-items-body");
  const empty = document.getElementById("cart-empty");
  const badge = document.getElementById("cart-badge");

  if (!tbody) return;
  tbody.innerHTML = "";

  if (!cart.length) {
    if (empty) empty.style.display = "";
    if (badge) badge.classList.add("hidden");
    return;
  }

  if (empty) empty.style.display = "none";
  if (badge) {
    badge.classList.remove("hidden");
    badge.textContent = cart.length;
  }

  cart.forEach((item) => {
    const subtotal = item.price * item.qty;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="p-4">${item.name}</td>
      <td class="p-4 text-center">${item.qty}</td>
      <td class="p-4 text-right">${fmt(item.price)}</td>
      <td class="p-4 text-right">${fmt(subtotal)}</td>
      <td class="p-4 text-right">
        <button class="delete-item-btn text-red-500 font-bold" data-id="${item.id}">X</button>
      </td>
    `;

    tr.querySelector(".delete-item-btn").addEventListener("click", function() {
      removeFromCart(this.dataset.id);
    });

    tbody.appendChild(tr);
  });

  const totalDisplay = document.getElementById("total-venta");
  if (totalDisplay) {
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    totalDisplay.textContent = fmt(total);
  }

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// CONEXIÓN REAL CON TU BACKEND (API /v1/inventory)
// ==========================================
async function cargarDatosDesdeServidor() {
  try {
    const response = await fetch("/api/v1/inventory", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("pos_token")}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        checkAuth();
        return;
      }
      throw new Error(`Error de servidor: ${response.status}`);
    }

    const data = await response.json();
    allData = data; 
    
    refreshProductSelect();
    renderCart();
    
  } catch (error) {
    console.error("Error conectando con la base de datos:", error);
    showToast("Modo contingencia: Cargando catálogo local");
    
    // Semillas adaptadas milimétricamente a tu tabla 'inventory' de Glow Beauty POS
    allData = [
      { id: "1", name: "Labial Superstay 20", brand: "Maybelline", tone: "Pioneer", price: 199.00, stock: 15, sku: "7501055300075" },
      { id: "2", name: "Base Fit Me Mousse", brand: "Maybelline", tone: "120 Classic Ivory", price: 245.00, stock: 8, sku: "7501011111111" }
    ];
    refreshProductSelect();
    renderCart();
  }
}

// ==========================================
// CORRECCIÓN: COBROS MIXTOS ENLAZADOS CON TU TABLA 'sales'
// ==========================================
async function procesarPagoMixto() {
  if (cart.length === 0) return showToast("El carrito está vacío");

  const cashInput = document.getElementById("payment-cash");
  const digitalInput = document.getElementById("payment-digital");
  
  const cashAmount = parseFloat(cashInput ? cashInput.value : 0) || 0;
  const digitalAmount = parseFloat(digitalInput ? digitalInput.value : 0) || 0;
  
  const totalVenta = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalPagado = cashAmount + digitalAmount;

  if (totalPagado < totalVenta) {
    return showToast(`Monto insuficiente. Falta: ${fmt(totalVenta - totalPagado)}`);
  }

  // Definir el método de pago para tu columna 'payment_method'
  let metodoPago = "MIXTO";
  if (cashAmount > 0 && digitalAmount === 0) metodoPago = "EFECTIVO";
  if (digitalAmount > 0 && cashAmount === 0) metodoPago = "DIGITAL";

  const btnCobrar = document.getElementById("checkout-btn");
  if (btnCobrar) btnCobrar.disabled = true;

  try {
    // Estructura limpia lista para ser recibida por tus módulos de Node e insertada en tu SQL
    const saleData = {
      total: totalVenta,
      payment_method: metodoPago,
      cash_amount: cashAmount,       // Columna cash_amount de tu SQL
      digital_amount: digitalAmount, // Columna digital_amount de tu SQL
      notes: "Venta realizada desde el panel de cobro rápido",
      items: cart.map(item => ({
        product_id: item.id,       // Llave foránea product_id para sales_items
        quantity: item.qty,        // Columna quantity para sales_items
        price_at_sale: item.price  // Columna price_at_sale para sales_items
      }))
    };

    const response = await fetch("/api/v1/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("pos_token")}`
      },
      body: JSON.stringify(saleData)
    });

    if (!response.ok) throw new Error("Fallo al registrar la venta en PostgreSQL");

    showToast(`¡Venta procesada con éxito! Cambio: ${fmt(totalPagado - totalVenta)}`);
    
    // Resetear estados e inputs
    cart = [];
    if (cashInput) cashInput.value = "";
    if (digitalInput) digitalInput.value = "";
    renderCart();
    await cargarDatosDesdeServidor(); // Sincroniza el stock descontado por el trigger SQL
    
  } catch (error) {
    console.error(error);
    showToast("Error crítico: El trigger de stock o el servidor rechazaron la venta");
  } finally {
    if (btnCobrar) btnCobrar.disabled = false;
  }
}

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN AL CARGAR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  if (checkAuth()) {
    cargarDatosDesdeServidor();
  }
  
  const addBtn = document.getElementById("add-to-cart-btn");
  if (addBtn) addBtn.addEventListener("click", addToCart);

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", procesarPagoMixto);
  
  if (window.lucide) lucide.createIcons();
});
