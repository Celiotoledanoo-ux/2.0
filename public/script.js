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
      // Si la API arroja un error controlado de Zod o AppError, heredamos su mensaje
      throw new Error(result.message || 'Algo tronó en la petición del Punto de Venta.');
    }

    return result; // Retorna el JSON completo estandarizado { status, message, data }
  } catch (error) {
    console.error(`[API_FETCH_ERROR][${endpoint}]:`, error.message);
    throw error;
  }
}

// ==========================================================================
// 🛠️ INTERFACES DE CONTROL DE TUS MÓDULOS (EJEMPLOS DE ACOPLAMIENTO 100%)
// ==========================================================================

// 1. MÓDULO /AUTH - Formulario de Login de Canva
async function handleLogin(emailOrIdentifier, password) {
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: emailOrIdentifier, password })
    });

    // Guardamos las credenciales en el navegador conforme a tus controladores
    localStorage.setItem('glow_pos_token', response.token);
    localStorage.setItem('glow_pos_user', JSON.stringify(response.user));

    alert(`¡Bienvenida de vuelta, ${response.user.name}! 💄`);
    window.location.reload(); // Actualiza la UI para abrir los tableros autorizados
  } catch (err) {
    alert(`❌ Error de acceso: ${err.message}`);
  }
}

// 2. MÓDULO /CASH - Sincronizar Arqueo y Estado de la Caja Registradora (CORREGIDO)
async function syncCashRegisterUI() {
  try {
    const response = await apiFetch('/cash/status');
    const { isOpen, session, transactions } = response.data;

    // Buscamos los contenedores usando las clases y los IDs reales de tu nuevo HTML
    const cashLockScreen = document.getElementById('cash-lock-screen');
    const vaultDisplay = document.getElementById('vault-cash-display');
    const tbody = document.getElementById('cash-flows-tbody');

    if (isOpen) {
      if (cashLockScreen) cashLockScreen.style.display = 'none'; // Oculta bloqueo si está abierta
      if (vaultDisplay) vaultDisplay.innerText = `Caja Neta: $${Number(session.opening_balance).toFixed(2)}`;
      
      // Renderizar tabla de flujos manuales si el contenedor existe en el DOM
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
      if (cashLockScreen) cashLockScreen.style.display = 'flex'; // Muestra bloqueo si está cerrada
    }
  } catch (err) {
    console.error('No se pudo sincronizar la terminal monetaria:', err.message);
  }
}

// 3. MÓDULO /SALES - El Momento del Cobro Masivo Atómico (CORREGIDO)
async function processCheckoutCart() {
  // Array global en memoria: cartItems = [ { id: "uuid-producto", quantity: 2 }, ... ]
  if (!window.cartItems || window.cartItems.length === 0) {
    return alert('El carrito está vacío, fiera.');
  }
  
  // Extraemos datos usando los IDs reales de tu nuevo formulario de liquidación
  const paymentMethod = document.getElementById('payment-method-select').value; 
  const cashAmount = parseFloat(document.getElementById('checkout-cash-amount').value) || 0;
  const digitalAmount = parseFloat(document.getElementById('checkout-digital-amount').value) || 0;
  const discount = parseFloat(document.getElementById('checkout-discount-input').value) || 0;
  const notes = document.getElementById('cash-close-notes')?.value || ''; // O el textarea correspondiente

  const payload = {
    items: window.cartItems, // El backend mapeará 'id' a 'product_id' mediante Zod
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

    // Desplegamos el ticket e indicamos el cambio exacto calculado por tu controlador senior
    alert(`🎉 ¡Cobro Exitoso!\nCambio / Vuelto a entregar: $${response.data.change}`);
    
    // Limpiar el carrito de compras y refrescar la UI
    window.cartItems = [];
    renderCartUI(); // Tu función para redibujar el carrito vacío
    syncCashRegisterUI();
  } catch (err) {
    alert(`🚨 Error en cobro: ${err.message}`);
  }
}

// ==========================================================================
// 🔌 INICIALIZACIÓN Y CAPTURA DE FORMULARIOS DEL HTML (VERSIÓN FINAL BLINDADA)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Escuchar el Formulario de Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value;
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

   // ⚡ 4. INTERRUPTOR VISUAL: Despertar el modal de Cierre de Caja (CORREGIDO CON ID REAL)
  document.getElementById('cash-close-trigger-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('cash-close-modal');
    if (modal) modal.classList.remove('d-none'); // Quita d-none para mostrar el cristal esmerilado
  });

  // ⚡ 5. ESCUCHAR EL FORMULARIO DE CIERRE DE CAJA (CORTE FINANCIERO)
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
      
      // Ocultamos el modal de forma limpia usando su ID real
      document.getElementById('cash-close-modal')?.classList.add('d-none');

      localStorage.clear(); // Limpiamos la sesión del cajero para cerrar el turno por completo
      window.location.reload(); 
    } catch (err) {
      alert(`❌ Error al asentar el corte de caja: ${err.message}`);
    }
  });
