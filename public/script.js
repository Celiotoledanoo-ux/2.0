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

// --- MÓDULO 1: /AUTH (Inicio de Sesión) ---
async function handleLogin(emailOrIdentifier, password) {
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: emailOrIdentifier, password })
    });

    localStorage.setItem('glow_pos_token', response.token);
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

  /* 
   * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización contractual con el Backend en ESM y Supabase SQL.
   * Se modifican las claves del objeto JSON serializado hacia la API para que utilicen de forma 
   * estricta el estándar snake_case exigido por las columnas de la tabla 'sales' en PostgreSQL 
   * y mapeado en tus esquemas de validaciones ('paymentMethod' cambia a 'paymentMethod' para heredar 
   * el enum en mayúsculas, mientras que los montos se mapean como 'cash_amount' y 'digital_amount').
   */
  const payload = {
    items: window.cartItems, 
    paymentMethod, // Mapeado a la firma Zod de createSaleSchema que recibe mayúsculas
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

// --- MÓDULO 4: /REPORTS (Business Intelligence del Panel de Control) ---
async function fetchAndRenderAnalytics(range = 'day') {
  try {
    const response = await apiFetch(`/reports/summary?range=${range}`);
    const payload = response.data || response || {};
    const { metrics, business_status } = payload;

    const revenueDisplay = document.getElementById('metric-revenue-display');
    const salesCountDisplay = document.getElementById('metric-sales-count');
    const healthScoreDisplay = document.getElementById('metric-health-score');

    if (revenueDisplay) {
      const revenue = metrics?.total_revenue != null ? Number(metrics.total_revenue) : 0;
      revenueDisplay.innerText = `$${revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }

    if (salesCountDisplay) {
      salesCountDisplay.innerText = metrics?.sales_count != null ? metrics.sales_count : 0;
    }

    if (healthScoreDisplay) {
      const score = business_status?.health_score || 'EXCELLENT';
      healthScoreDisplay.innerText = score === 'EXCELLENT' ? '🟢 100%' : score === 'WARNING' ? '🟡 75%' : '🔴 40%';
      healthScoreDisplay.title = business_status?.message || '';
    }

    console.log(`[BI_ENGINE] Analíticas del rango [${range.toUpperCase()}] renderizadas.`);
  } catch (err) {
    console.error('fetchAndRenderAnalytics ERROR:', err);
    alert(`❌ Error al cargar los reportes analíticos:\n${err.message}`);
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

  const defaultTab = document.querySelector('.report-range-tab[data-range="day"]');
  if (defaultTab) {
    defaultTab.classList.add('active-tab');
    fetchAndRenderAnalytics('day');
  }
}

// ==========================================================================
// 🔌 CAPA 3: INICIALIZACIÓN GLOBAL Y CAPTURA DE EVENTOS DEL DOM
// ==========================================================================
window.cartItems = []; // Memoria volátil del carrito en mostrador

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Escuchar el Formulario de Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (identifier && password) {
      await handleLogin(identifier, password);
    }
  });

  // 2. Escuchar el Formulario de Apertura de Caja Chica
  document.getElementById('cash-open-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const balance = document.getElementById('cash-opening-balance-input')?.value;
    try {
      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización contractual de aperturas.
       * Se realiza la conversión explícita mediante 'Number()' de la variable de balance 
       * e inyectamos la propiedad 'openingBalance'. Esto acopla la petición de forma exacta 
       * con los disparadores lógicos del controlador del backend ('cash.controller.js'), 
       * asegurando el inicio del turno sin fricciones.
       */
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
      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Saneamiento y caspeo numérico en arqueos.
       * Se parsea el valor de 'realCash' utilizando 'Number()' antes de viajar por HTTP 
       * a la nube de Render. Esto inmuniza la petición de que transiten strings corruptos 
       * que harían fallar los cálculos de diferencias contables en la capa de servicios ('cash.service.js').
       */
      const response = await apiFetch('/cash/close', {
        method: 'POST',
        body: JSON.stringify({ 
          realCash: Number(realCash) || 0, 
          notes: notes.trim() || null 
        })
      });

      alert(response.message || 'Corte de caja procesado con éxito. 🏁');
      document.getElementById('cash-close-modal')?.classList.add('d-none');
      
      localStorage.clear(); // Seguridad total: Limpia credenciales al terminar turno
      window.location.reload(); 
    } catch (err) {
      alert(`❌ Error al asentar el corte de caja: ${err.message}`);
    }
  });

  // 🌟 Inicializar los disparadores del panel de analíticas administrativas
  initializeAdminDashboardListeners();

  // Determinar qué pantalla pintar en el arranque de la terminal
  syncCashRegisterUI();
});
