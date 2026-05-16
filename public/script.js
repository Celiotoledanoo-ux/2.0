/// ==========================================
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

// Sistema de Notificaciones Toast (Canva Premium Layout)
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return alert(msg);
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ==========================================
// CONTROL DE SESIÓN EN UNA SOLA PÁGINA (CORREGIDO)
// ==========================================
function checkAuth() {
  const token = localStorage.getItem("pos_token");
  const userData = localStorage.getItem("pos_user");
  const authScreen = document.getElementById("auth-screen");
  const mainApp = document.getElementById("content-root");

  if (!token || !userData) {
    // Si no hay sesión, muestra el login y oculta la app principal
    if (authScreen) authScreen.classList.remove("hidden");
    if (mainApp) mainApp.classList.add("hidden");
    return false;
  }

  currentUser = JSON.parse(userData);
  
  // Ocultar login y liberar interfaz principal
  if (authScreen) authScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("hidden");

  // Inyectar credenciales del empleado en el header
  const userDisplay = document.getElementById("user-display");
  if (userDisplay) {
    userDisplay.innerHTML = `
      <span class="font-bold">${currentUser.name || 'Empleado'}</span>
      <span class="text-xs block text-gray-400">${currentUser.role || 'Cajero'}</span>
    `;
  }
  return true;
}

// ==========================================
// ENRUTADOR POR MÓDULOS (CORREGIDO: data-module)
// ==========================================
document.querySelectorAll(".sidebar-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Animación estética de botones activos
    document.querySelectorAll(".sidebar-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Ocultar todas las vistas de la interfaz
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    
    // Mapeo adaptado a los data-module de tu index.html
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
// ESCANER DE CÓDIGO DE BARRAS (#barcode-input)
// ==========================================
const barcodeInput = document.getElementById("barcode-input");
if (barcodeInput) {
  barcodeInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = this.value.trim();
      if (!code) return;

      // Buscar usando identificadores de base de datos e inyectar nombre real
      const product = allData.find(p => p.barcode === code || p.__backendId === code);

      if (product) {
        agregarAlCarritoPorObjeto(product, 1);
        showToast(`Agregado: ${product.name}`);
      } else {
        showToast("Producto no registrado o sin inventario");
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
// SELECTOR MANUAL (CORREGIDO: FORMATO SUPABASE name/stock)
// ==========================================
function refreshProductSelect() {
  const select = document.getElementById("cart-product-select");
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = `<option value="">Seleccionar manualmente...</option>`;

  allData
    .filter((p) => p.type === "product" && p.stock > 0) // Uso de .stock
    .forEach((p) => {
      const option = document.createElement("option");
      option.value = p.__backendId;
      option.textContent = `${p.name} — ${fmt(p.price)} (${p.stock} disp.)`; // Uso de .name y .stock
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

  const product = allData.find((r) => r.__backendId === productId);
  if (!product) return;

  agregarAlCarritoPorObjeto(product, qty);
}

function agregarAlCarritoPorObjeto(product, qty) {
  const existing = cart.find((c) => c.id === product.__backendId);

  if (existing) {
    if (existing.qty + qty > product.stock) return showToast("Stock insuficiente"); // .stock
    existing.qty += qty;
  } else {
    if (qty > product.stock) return showToast("Stock insuficiente"); // .stock
    cart.push({
      id: product.__backendId,
      name: product.name, // .name
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
// CONEXIÓN REAL CON NODE.JS (CORREGIDO: /api/v1/inventory)
// ==========================================
async function cargarDatosDesdeServidor() {
  try {
    const response = await fetch("/api/v1/inventory", { // Endpoint oficial alineado
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("pos_token")}`
      }
    });

    if (!response.ok) { // .ok de JS nativo
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
    showToast("Modo desconectado: Cargando catálogo local de contingencia");
    
    // Fallback mapeado correctamente con el formato del Schema de PostgreSQL
    allData = [
      { __backendId: "1", type: "product", name: "Coca Cola 600ml", price: 18.50, stock: 25, barcode: "7501055300075" },
      { __backendId: "2", type: "product", name: "Papas Sabritas Sal 50g", price: 17.00, stock: 12, barcode: "7501011111111" }
    ];
    refreshProductSelect();
    renderCart();
  }
}

// ==========================================
// PROCESAMIENTO DE PAGOS MIXTOS (/api/v1/sales)
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

  const btnCobrar = document.getElementById("checkout-btn");
  if (btnCobrar) btnCobrar.disabled = true;

  try {
    const saleData = {
      items: cart.map(item => ({
        product_id: item.id,
        qty: item.qty,
        price: item.price
      })),
      total: totalVenta,
      payment_method: {
        cash: cashAmount,
        digital: digitalAmount
      },
      change: totalPagado - totalVenta,
      timestamp: new Date().toISOString()
    };

    const response = await fetch("/api/v1/sales", { // Endpoint oficial de facturación
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("pos_token")}`
      },
      body: JSON.stringify(saleData)
    });

    if (!response.ok) throw new Error("Fallo al registrar venta");

    showToast(`¡Venta Exitosa! Cambio: ${fmt(totalPagado - totalVenta)}`);
    
    // Resetear entorno de cobro
    cart = [];
    if (cashInput) cashInput.value = "";
    if (digitalInput) digitalInput.value = "";
    renderCart();
    await cargarDatosDesdeServidor(); // Arqueo e inventario local actualizado
    
  } catch (error) {
    console.error(error);
    showToast("Error crítico al procesar el cobro en el servidor");
  } finally {
    if (btnCobrar) btnCobrar.disabled = false;
  }
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA AL CARGAR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Validar sesión activa en la SPA antes de pintar datos
  if (checkAuth()) {
    cargarDatosDesdeServidor();
  }
  
  // Enlaces de disparadores manuales
  const addBtn = document.getElementById("add-to-cart-btn");
  if (addBtn) addBtn.addEventListener("click", addToCart);

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", procesarPagoMixto);
  
  if (window.lucide) lucide.createIcons();
});
