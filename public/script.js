/**
 * 🎨 GLOW BEAUTY POS - CORE FRONTEND ENGINE (UNIFICADO Y BLINDADO)
 * Gestiona peticiones por HTTP hacia la API de Express sincronizado al localStorage.
 */

const API_BASE_URL = '/api/v1';

// ==========================================================================
// 📡 CAPA 1: HELPER MAESTRO DE PETICIONES HTTP
// ==========================================================================
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('glow_pos_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Algo tronó en la petición del Punto de Venta.');
    }

    return result; 
  } catch (error) {
    console.error(`[API_FETCH_ERROR][${endpoint}]:`, error.message);
    throw error;
  }
}

// ==========================================================================
// 🛠️ CAPA 2: INTERFACES DE CONTROL DE LOS MÓDULOS DE NEGOCIO
// ==========================================================================

// --- MÓDULO 1: /AUTH (Inicio de Sesión Estricto por Correo) ---
async function handleLogin(email, password) {
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.trim(), 
        password: password 
      })
    });

    localStorage.setItem('glow_pos_token', response.token);
    localStorage.setItem('glow_pos_refresh_token', response.refreshToken || '');
    localStorage.setItem('glow_pos_user', JSON.stringify(response.user));

    alert(response.message || `¡Bienvenida de vuelta! 💄`);
    await syncCashRegisterUI(); 
  } catch (err) {
    alert(`❌ Error de acceso: ${err.message}`);
  }
}

// --- MÓDULO 2: /CASH (Sincronización del Estado de Caja) ---
async function syncCashRegisterUI() {
  try {
    const token = localStorage.getItem('glow_pos_token');

    const authScreen = document.getElementById('auth-screen');
    const cashLockScreen = document.getElementById('cash-lock-screen');
    const mainWorkspace = document.getElementById('pos-main-workspace');
    const vaultDisplay = document.getElementById('vault-cash-display');
    const tbody = document.getElementById('cash-flows-tbody');

    if (!token) {
      authScreen?.classList.remove('d-none');
      cashLockScreen?.classList.add('d-none');
      mainWorkspace?.classList.add('d-none');
      return;
    }

    authScreen?.classList.add('d-none');

    const response = await apiFetch('/cash/status');
    const payload = response.data || response || {};

    const {
      isOpen = false,
      session = null,
      transactions = []
    } = payload;

    if (isOpen) {
      cashLockScreen?.classList.add('d-none');
      mainWorkspace?.classList.remove('d-none');

      if (vaultDisplay && session?.opening_balance != null) {
        vaultDisplay.innerText = `Fondo en Caja: $${Number(session.opening_balance).toFixed(2)}`;
      }

      if (tbody) {
        tbody.innerHTML = '';
        (transactions || []).forEach(flow => {
          const tr = document.createElement('tr');
          tr.className = 'table-row-item';
          tr.innerHTML = `
            <td>${flow.concept}</td>
            <td class="${flow.type === 'IN' ? 'text-success' : 'text-danger'}" style="text-align: right; font-weight: bold;">
              ${flow.type === 'IN' ? '+' : '-'} $${Number(flow.amount).toFixed(2)}
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
      
      // 🔒 CONTROL DE SEGURIDAD: Evita romper la app si la función aún no se carga
      if (typeof fetchAndRenderEmployees === 'function') {
        await fetchAndRenderEmployees();
      } else {
        console.warn('[WARNING]: fetchAndRenderEmployees() no está disponible todavía.');
      }

    } else {
      mainWorkspace?.classList.add('d-none');
      cashLockScreen?.classList.remove('d-none');
    }

  } catch (err) {
    console.error('syncCashRegisterUI ERROR:', err);
    alert(`❌ Error cargando estado de caja:\n${err.message}`);
  }
}

// --- MÓDULO 3: /SALES (Procesamiento del Carrito de Ventas) ---
async function processCheckoutCart() {
  if (!window.cartItems || window.cartItems.length === 0) {
    return alert('El carrito está vacío, fiera.');
  }
  
  const paymentMethod = document.getElementById('payment-method-select')?.value || 'CASH'; 
  const cashAmount = parseFloat(document.getElementById('checkout-cash-amount')?.value) || 0;
  const digitalAmount = parseFloat(document.getElementById('checkout-digital-amount')?.value) || 0;
  const discount = parseFloat(document.getElementById('checkout-discount-input')?.value) || 0;
  const notes = document.getElementById('checkout-notes-input')?.value || ''; 

  const payload = {
    items: window.cartItems, 
    paymentMethod, 
    cash_amount: cashAmount,
    digital_amount: digitalAmount,
    discount,
    notes
  };

  try {
    const response = await apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    alert(response.message || '¡Venta realizada con éxito! 🎉');
    if (response.data && response.data.change > 0) {
      alert(`💵 Cambio / Vuelto a entregar: $${Number(response.data.change).toFixed(2)}`);
    }
    
    window.cartItems = [];
    const cartContainer = document.querySelector('.cart-items-container');
    if (cartContainer) cartContainer.innerHTML = '';
    
    await syncCashRegisterUI();
  } catch (err) {
    alert(`🚨 Error en cobro: ${err.message}`);
  }
}

// --- MÓDULO 4: /REPORTS (Business Intelligence y Analíticas Defensivas) ---
async function fetchAndRenderAnalytics(range = 'day') {
  try {
    const response = await apiFetch(`/reports/summary?range=${range}`);
    const payload = response.data || response || {};
    
    const metrics = payload.metrics || { total_revenue: 0, sales_count: 0 };
    const business_status = payload.business_status || { health_score: 'EXCELLENT', message: 'Sistema listo' };

    const revenueDisplay = document.getElementById('metric-revenue-display');
    const salesCountDisplay = document.getElementById('metric-sales-count');
    const healthScoreDisplay = document.getElementById('metric-health-score');

    if (revenueDisplay) {
      const revenue = metrics.total_revenue != null ? Number(metrics.total_revenue) : 0;
      revenueDisplay.innerText = `$${revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }

    if (salesCountDisplay) {
      salesCountDisplay.innerText = metrics.sales_count != null ? metrics.sales_count : 0;
    }

    if (healthScoreDisplay) {
      const score = business_status.health_score || 'EXCELLENT';
      healthScoreDisplay.innerText = score === 'EXCELLENT' ? '🟢 100%' : score === 'WARNING' ? '🟡 75%' : '🔴 40%';
      healthScoreDisplay.title = business_status.message || '';
    }

    console.log(`[BI_ENGINE] Analíticas del rango [${range.toUpperCase()}] renderizadas.`);
  } catch (err) {
    console.error('fetchAndRenderAnalytics ERROR:', err);
    alert(`❌ Error al cargar los reportes analíticos:\n${err.message}`);
  }
}
// --- MÓDULO 5: /USERS (Renderizado Dinámico de la Plantilla de Personal) ---
async function fetchAndRenderEmployees() {
  try {
    const employeeTableBody = document.getElementById('employees-table-body');
    if (!employeeTableBody) return;

    const response = await apiFetch('/users');
    const employees = response.data || response || [];

    employeeTableBody.innerHTML = '';

    employees.forEach(emp => {
      const tr = document.createElement('tr');
      tr.className = emp.active ? 'employee-row-active' : 'employee-row-disabled';
      tr.innerHTML = `
        <td>${emp.name} ${emp.active ? '' : '🚫'}</td>
        <td style="font-weight: bold; color: var(--gold);">${emp.role?.toUpperCase()}</td>
        <td>${emp.active ? '🟢 Activo' : '🔴 Suspendido'}</td>
      `;
      employeeTableBody.appendChild(tr);
    });

    console.log('[STAFF_ENGINE] Lista de empleados dinamizada desde Supabase con éxito.');
  } catch (err) {
    console.error('fetchAndRenderEmployees ERROR:', err);
  }
}

function initializeAdminDashboardListeners() {
  const tabs = document.querySelectorAll('.report-range-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', async (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active-tab'));
      
      const clickedTab = e.target;
      clickedTab.classList.add('active-tab');

      const selectedRange = clickedTab.dataset.range || 'day';
      await fetchAndRenderAnalytics(selectedRange);
    });
  });

  // 🔒 DEFENSA: Solo inicializa analíticas por defecto si el usuario ya está autenticado
  const token = localStorage.getItem('glow_pos_token');
  const defaultTab = document.querySelector('.report-range-tab[data-range="day"]');
  if (defaultTab && token) {
    defaultTab.classList.add('active-tab');
    fetchAndRenderAnalytics('day');
  }
}

// --- MÓDULO 6: /INVENTORY (Buscador Avanzado e Inyección del Catálogo) ---
let searchTimeout;

function initializeProductSearch() {
  const searchInput = document.getElementById('product-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    searchTimeout = setTimeout(async () => {
      await fetchAndRenderCatalog(query);
    }, 300);
  });
}

async function fetchAndRenderCatalog(searchQuery = '') {
  try {
    const catalogGrid = document.getElementById('products-catalog-grid');
    if (!catalogGrid) return;

    const endpoint = searchQuery 
      ? `/inventory?search=${encodeURIComponent(searchQuery)}` 
      : '/inventory';

    const response = await apiFetch(endpoint);
    const products = response.data || response || [];

    catalogGrid.innerHTML = '';

    if (products.length === 0) {
      catalogGrid.innerHTML = `
        <div class="no-products-fallback" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
          ❌ No se encontraron cosméticos con ese criterio, fiera.
        </div>`;
      return;
    }

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card-top">
          <span class="product-brand">${product.brand}</span>
          <span class="product-sku">${product.sku}</span>
        </div>
        <h3>${product.name}</h3>
        <div class="product-meta">Tono: <strong>${product.tone}</strong></div>
        <div class="product-card-footer">
          <strong>$${Number(product.price).toFixed(2)}</strong>
          <button class="add-product-btn" onclick="addProductToCart('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">
            Agregar ➕
          </button>
        </div>
      `;
      catalogGrid.appendChild(card);
    });

  } catch (err) {
    console.error('[CATALOG_ENGINE] Error al renderizar catálogo:', err.message);
  }
}

// ==========================================================================
// 🛒 CAPA ADICIONAL: GESTIÓN INTERNA DEL CARRITO (SINCRO GLOBAL)
// ==========================================================================
/* 
 * ⚡ ADICIÓN OBLIGATORIA: Se expone la función de forma global asignándola a 'window'.
 * Permite que los botones inyectados dinámicamente mediante cadenas HTML ('onclick')
 * interactúen con el estado del carrito sin romper la encapsulación de variables.
 */
window.addProductToCart = function(id, name, price) {
  const existingItem = window.cartItems.find(item => item.product_id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    window.cartItems.push({
      product_id: id,
      name: name,
      price: parseFloat(price),
      quantity: 1
    });
  }
  renderCartUI();
};

function renderCartUI() {
  const cartContainer = document.querySelector('.cart-items-container');
  if (!cartContainer) return;

  cartContainer.innerHTML = '';

  window.cartItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'cart-item-row';
    div.style = 'display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center;';
    div.innerHTML = `
      <div>
        <span>${item.name}</span> <small style="color: var(--text-secondary)">x${item.quantity}</small>
      </div>
      <div>
        <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
        <button type="button" style="background: none; border: none; color: red; margin-left: 8px; cursor: pointer;" onclick="removeCartItem(${index})">❌</button>
      </div>
    `;
    cartContainer.appendChild(div);
  });
}

window.removeCartItem = function(index) {
  window.cartItems.splice(index, 1);
  renderCartUI();
};


// ==========================================================================
// 🔌 CAPA 3: INICIALIZACIÓN GLOBAL Y CAPTURA DE EVENTOS DEL DOM
// ==========================================================================
window.cartItems = []; 

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Escuchar el Formulario de Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (email && password) {
      await handleLogin(email, password);
    }
  });

  // 2. Escuchar el Formulario de Apertura de Caja Chica
  document.getElementById('cash-open-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const balance = document.getElementById('cash-opening-balance-input')?.value;
    try {
      await apiFetch('/cash/open', {
        method: 'POST',
        body: JSON.stringify({ openingBalance: Number(balance) || 0 })
      });
      alert('¡Caja chica inicializada correctamente! 🟢');
      window.location.reload();
    } catch (err) {
      alert(`❌ Error al abrir caja: ${err.message}`);
    }
  });

  // 3. Escuchar el Formulario de Cobro del Carrito
  document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await processCheckoutCart();
  });

  // 4. INTERRUPTOR VISUAL: Abrir el modal de Arqueo de Caja
  document.getElementById('cash-close-trigger-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('cash-close-modal');
    if (modal) modal.classList.remove('d-none'); 
  });

  // 5. Escuchar el Formulario de Cierre de Caja (Arqueo Final)
  document.getElementById('cash-close-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const realCash = document.getElementById('cash-real-cash-counted')?.value;
    const notes = document.getElementById('cash-close-notes')?.value || '';

    try {
      const response = await apiFetch('/cash/close', {
        method: 'POST',
        body: JSON.stringify({ 
          realCash: Number(realCash) || 0, 
          notes: notes.trim() || null 
        })
      });

      alert(response.message || 'Corte de caja procesado con éxito. 🏁');
      document.getElementById('cash-close-modal')?.classList.add('d-none');
      
      localStorage.clear(); 
      window.location.reload(); 
    } catch (err) {
      alert(`❌ Error al asentar el corte de caja: ${err.message}`);
    }
  });

  // 🛠️ ACTIVACIONES DE MOTORES CORE:
  initializeAdminDashboardListeners();
  initializeProductSearch(); // <- Agregado para habilitar la barra de búsqueda y lector de barras
  
  // Condición de arranque
  const token = localStorage.getItem('glow_pos_token');
  if (token) {
    fetchAndRenderCatalog(); // <- Renderiza el catálogo plano solo si ya se está logueado
  }

  // Determinar qué pantalla pintar en el arranque de la terminal
  syncCashRegisterUI();
});
