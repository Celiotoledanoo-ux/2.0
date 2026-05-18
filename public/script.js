/**
 * 🎨 GLOW BEAUTY POS - CORE FRONTEND ENGINE (PEGAMENTO DEFINITIVO)
 * Gestiona peticiones por HTTP hacia la API de Express sincronizado al localStorage.
 */

const API_BASE_URL = '/api/v1';

// 📡 HELPER MAESTRO DE PETICIONES HTTP (Inyecta tokens y desanida payloads de forma automática)
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
// 🛠️ INTERFACES DE CONTROL DE TUS MÓDULOS
// ==========================================================================

// 1. MÓDULO /AUTH - Formulario de Login de la Boutique
async function handleLogin(emailOrIdentifier, password) {
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: emailOrIdentifier, password })
    });

    // Guardamos de forma limpia el token y el perfil
    localStorage.setItem('glow_pos_token', response.token);
    localStorage.setItem('glow_pos_user', JSON.stringify(response.user));

    alert(`¡Bienvenida de vuelta, ${response.user.name}! 💄`);
    
    // ⚡ Corrección Senior: En lugar de recargar a ciegas, ejecutamos la sincronización de la UI inmediatamente
    await syncCashRegisterUI(); 
  } catch (err) {
    alert(`❌ Error de acceso: ${err.message}`);
  }
}

// 2. MÓDULO /CASH - Sincronizar Arqueo y Estado de la Caja Registradora (CORREGIDO CON CLASES REACONDICIONADAS)
async function syncCashRegisterUI() {
  try {
    const token = localStorage.getItem('glow_pos_token');
    
    // CAPA DE SEGURIDAD 1: Si no hay token, el Login toma el control total y apaga las vitrinas
    if (!token) {
      document.getElementById('auth-screen')?.classList.remove('d-none');
      document.getElementById('cash-lock-screen')?.classList.add('d-none');
      document.getElementById('pos-main-workspace')?.classList.add('d-none');
      return;
    }

    // Si el usuario está logueado, apagamos permanentemente la pantalla de Autenticación
    document.getElementById('auth-screen')?.classList.add('d-none');

    // Consultamos el estado financiero en la API de Render
    const response = await apiFetch('/cash/status');
    const { isOpen, session, transactions } = response.data;

    // Vinculamos los nodos reales de tu nuevo HTML
    const cashLockScreen = document.getElementById('cash-lock-screen');
    const mainWorkspace = document.getElementById('pos-main-workspace');
    const vaultDisplay = document.getElementById('vault-cash-display');
    const tbody = document.getElementById('cash-flows-tbody');

    if (isOpen) {
      // CAPA DE SEGURIDAD 2: Si la caja está abierta, desbloqueamos la vitrina digital claro y oro
      if (cashLockScreen) cashLockScreen.classList.add('d-none');
      if (mainWorkspace) mainWorkspace.classList.remove('d-none');
      
      if (vaultDisplay) vaultDisplay.innerText = `Caja Neta: $${Number(session.opening_balance).toFixed(2)}`;
      
      // Renderizar tabla de flujos manuales de caja chica
      if (tbody) {
        tbody.innerHTML = '';
        (transactions || []).forEach(flow => {
          tbody.innerHTML += `
            <div class="table-row">
              <span>${flow.concept}</span>
              <span class="${flow.type === 'IN' ? 'text-success' : 'text-danger'}">
                ${flow.type === 'IN' ? '+' : '-'} $${Number(flow.amount).toFixed(2)}
              </span>
            </div>
          `;
        });
      }
    } else {
      // CAPA DE SEGURIDAD 3: Logueado pero con caja cerrada, se fuerza la sobrecapa de Apertura
      if (mainWorkspace) mainWorkspace.classList.add('d-none');
      if (cashLockScreen) cashLockScreen.classList.remove('d-none');
    }
  } catch (err) {
    console.error('No se pudo sincronizar la terminal monetaria:', err.message);
    localStorage.clear();
    window.location.reload();
  }
}

// 3. MÓDULO /SALES - Carrito de Compras de la Tienda
async function processCheckoutCart() {
  if (!window.cartItems || window.cartItems.length === 0) {
    return alert('El carrito está vacío, fiera.');
  }
  
  const paymentMethod = document.getElementById('payment-method-select').value; 
  const cashAmount = parseFloat(document.getElementById('checkout-cash-amount').value) || 0;
  const digitalAmount = parseFloat(document.getElementById('checkout-digital-amount').value) || 0;
  const discount = parseFloat(document.getElementById('checkout-discount-input').value) || 0;
  const notes = document.getElementById('cash-close-notes')?.value || ''; 

  const payload = {
    items: window.cartItems, 
    paymentMethod,
    cashAmount,
    digitalAmount,
    discount,
    notes
  };

  try {
    const response = await apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    alert(`🎉 ¡Cobro Exitoso!\nCambio / Vuelto a entregar: $${response.data.change}`);
    
    window.cartItems = [];
    const cartContainer = document.querySelector('.cart-items-container');
    if (cartContainer) cartContainer.innerHTML = '';
    
    syncCashRegisterUI();
  } catch (err) {
    alert(`🚨 Error en cobro: ${err.message}`);
  }
}

// ==========================================================================
// 🔌 INICIALIZACIÓN Y CAPTURA DE FORMULARIOS DEL HTML
// ==========================================================================
window.cartItems = []; // Inicialización fail-safe para el mostrador

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Escuchar el Formulario de Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    await handleLogin(identifier, password);
  });

  // 2. Escuchar el Formulario de Apertura de Caja Chica
  document.getElementById('cash-open-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const balance = document.getElementById('cash-opening-balance-input').value;
    try {
      await apiFetch('/cash/open', {
        method: 'POST',
        body: JSON.stringify({ openingBalance: balance })
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

  // 4. INTERRUPTOR VISUAL: Despertar el modal de Cierre de Caja
  document.getElementById('cash-close-trigger-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('cash-close-modal');
    if (modal) modal.classList.remove('d-none'); 
  });

  // 5. Escuchar el Formulario de Cierre de Caja
  document.getElementById('cash-close-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const realCash = document.getElementById('cash-real-cash-counted').value;
    const notes = document.getElementById('cash-close-notes').value;

    try {
      const response = await apiFetch('/cash/close', {
        method: 'POST',
        body: JSON.stringify({ realCash: realCash, notes: notes })
      });

      alert(response.message || 'Corte de caja procesado con éxito. 🏁');
      document.getElementById('cash-close-modal')?.classList.add('d-none');
      localStorage.clear(); 
      window.location.reload(); 
    } catch (err) {
      alert(`❌ Error al asentar el corte de caja: ${err.message}`);
    }
  });

  // ⚡ Sincronización perimetral de inicio (Determina qué pantalla pintar al arrancar)
  syncCashRegisterUI();
}); // ⚡ CORRECCIÓN: Llave y paréntesis del DOMContentLoaded cerrados de forma correcta!
