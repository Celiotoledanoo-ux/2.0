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
// SOLUCIÓN 4: CONTROL DE SESIÓN Y SEGURIDAD
// ==========================================
function checkAuth() {
  const token = localStorage.getItem("pos_token");
  const userData = localStorage.getItem("pos_user");

  if (!token || !userData) {
    // Si no hay sesión, redirige al login o bloquea la pantalla
    showToast("Sesión expirada. Por favor inicie sesión.");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
    return false;
  }

  currentUser = JSON.parse(userData);
  
  // Inyectar nombre/rol del empleado en el frontend (Canva Premium Layout)
  const userDisplay = document.getElementById("user-display");
  if (userDisplay) {
    userDisplay.innerHTML = `
      <span class="font-bold">${currentUser.name}</span>
      <span class="text-xs block text-gray-400">${currentUser.role}</span>
    `;
  }
  return true;
}

// ==========================================
// SOLUCIÓN 3: CONTROLADOR DE VISTAS CRÍTICAS
// ==========================================
document.querySelectorAll(".sidebar-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Desactivar botones previos
    document.querySelectorAll(".sidebar-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Ocultar todas las vistas (.view)
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    
    // Mostrar la vista seleccionada dinámicamente
    const targetView = document.getElementById("view-" + btn.dataset.view);
    if (targetView) {
      targetView.classList.add("active");
      // Disparar carga de datos específica según la pestaña activa
      initViewData(btn.dataset.view);
    }
  });
});

// Carga dinámica para Inventario, Reportes, Usuarios, etc.
function initViewData(viewName) {
  switch(viewName) {
    case 'inventario':
      renderInventarioTabla();
      break;
    case 'reportes':
      if (window.Chart) cargarGraficasReportes(); // Inicializa Chart.js si existe
      break;
    case 'usuarios':
      cargarListaUsuarios();
      break;
    case 'caja':
      cargarFlujoCaja();
      break;
  }
}

/* ==========================================
   SOLUCIÓN 2: ESCANER DE CÓDIGO DE BARRAS (#barcode-input)
========================================== */
const barcodeInput = document.getElementById("barcode-input");
if (barcodeInput) {
  barcodeInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = this.value.trim();
      if (!code) return;

      // Buscar el producto por código de barras en los datos locales
      const product = allData.find(p => p.barcode === code || p.__backendId === code);

      if (product) {
        agregarAlCarritoPorObjeto(product, 1);
        showToast(`Agregado: ${product.product_name}`);
      } else {
        showToast("Producto no registrado o sin inventario");
      }
      this.value = ""; // Limpiar el input para el siguiente escaneo
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

// Selector manual de productos
function refreshProductSelect() {
  const select = document.getElementById("cart-product-select");
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = `<option value="">Seleccionar manualmente...</option>`;

  allData
    .filter((p) => p.type === "product" && p.quantity > 0)
    .forEach((p) => {
      const option = document.createElement("option");
      option.value = p.__backendId;
      option.textContent = `${p.product_name} — ${fmt(p.price)} (${p.quantity} disp.)`;
      select.appendChild(option);
    });

  select.value = currentValue;
}

// ==========================================
// CONTROL DEL CARRITO DE COMPRAS
// ==========================================
function addToCart() {
  const productId = document.getElementById("cart-product-select").value;
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
    if (existing.qty + qty > product.quantity) return showToast("Stock insuficiente");
    existing.qty += qty;
  } else {
    if (qty > product.quantity) return showToast("Stock insuficiente");
    cart.push({
      id: product.__backendId,
      name: product.product_name,
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

  // Calcular totales finales si tu HTML tiene el ID total-venta
  const totalDisplay = document.getElementById("total-venta");
  if (totalDisplay) {
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    totalDisplay.textContent = fmt(total);
  }

  if (window.lucide) lucide.createIcons();
}

/* ==========================================
   SOLUCIÓN 1: CONEXIÓN REAL CON TU BACKEND (API)
   (Reemplaza el falso window.dataSdk por un Fetch real)
========================================== */
async function cargarDatosDesdeServidor() {
  try {
    // Ruta de tu API local de Node.js o Supabase Edge Function
    const response = await fetch("http://localhost:3000/api/productos", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("pos_token")}`
      }
    });

    if (!response.isOk && response.status === 401) {
      return checkAuth();
    }

    const data = await response.json();
    
    // Asignamos la información real a nuestra variable global
    allData = data; 
    
    // Refrescamos los componentes visuales con los datos reales de la BD
    refreshProductSelect();
    renderCart();
    
  } catch (error) {
    console.error("Error conectando con la base de datos:", error);
    showToast("Error de red: Trabajando en modo desconectado local");
    
    // Datos semilla para pruebas locales si tu servidor está apagado
    allData = [
      { __backendId: "1", type: "product", product_name: "Coca Cola 600ml", price: 18.50, quantity: 25, barcode: "7501055300075" },
      { __backendId: "2", type: "product", product_name: "Papas Sabritas Sal 50g", price: 17.00, quantity: 12, barcode: "7501011111111" }
    ];
    refreshProductSelect();
  }
}

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN AL CARGAR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Validar que el empleado esté logueado
  if (checkAuth()) {
    // 2. Traer los productos reales de la base de datos
    cargarDatosDesdeServidor();
  }
  
  // Vincular el botón manual de agregar si existe
  const addBtn = document.getElementById("add-to-cart-btn");
  if (addBtn) addBtn.addEventListener("click", addToCart);
  
  if (window.lucide) lucide.createIcons();
});
