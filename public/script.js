const API_BASE_URL = '/api/v1';

const AppState = {
  cartItems: [],
  products: []
};

// =====================================================
// API ENGINE
// =====================================================
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('glow_pos_token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`
      }),
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    let result = null;

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
        'Error inesperado en la petición.'
      );
    }

    return result;

  } catch (error) {
    console.error(`[API ERROR][${endpoint}]`, error);
    throw error;
  }
}

// =====================================================
// DOM HELPERS
// =====================================================
function $(id) {
  return document.getElementById(id);
}

function show(element) {
  element?.classList.remove('d-none');
}

function hide(element) {
  element?.classList.add('d-none');
}

function money(value = 0) {
  return `$${Number(value).toFixed(2)}`;
}

// =====================================================
// LOGIN
// =====================================================
async function handleLogin(identifier, password) {

  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      password
    })
  });

  localStorage.setItem('glow_pos_token', response.token);
  localStorage.setItem('glow_pos_user', JSON.stringify(response.user));

  await syncCashRegisterUI();
}

// =====================================================
// CASH STATUS
// =====================================================
async function syncCashRegisterUI() {

  const token = localStorage.getItem('glow_pos_token');

  if (!token) {
    show($('auth-screen'));
    hide($('cash-lock-screen'));
    hide($('pos-main-workspace'));
    return;
  }

  hide($('auth-screen'));

  try {

    const response = await apiFetch('/cash/status');

    const payload = response?.data || response || {};

    const {
      isOpen = false,
      session = null,
      transactions = []
    } = payload;

    if (!isOpen) {
      show($('cash-lock-screen'));
      hide($('pos-main-workspace'));
      return;
    }

    hide($('cash-lock-screen'));
    show($('pos-main-workspace'));

    $('vault-cash-display').innerText =
      `Caja Neta: ${money(session?.opening_balance || 0)}`;

    renderCashFlows(transactions);

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// =====================================================
// CASH FLOWS
// =====================================================
function renderCashFlows(flows = []) {

  const container = $('cash-flows-tbody');

  if (!container) return;

  container.innerHTML = '';

  flows.forEach(flow => {

    const row = document.createElement('div');
    row.className = 'cash-flow-row';

    const concept = document.createElement('span');
    concept.textContent = flow.concept;

    const amount = document.createElement('span');

    amount.className =
      flow.type === 'IN'
        ? 'text-success'
        : 'text-danger';

    amount.textContent =
      `${flow.type === 'IN' ? '+' : '-'} ${money(flow.amount)}`;

    row.appendChild(concept);
    row.appendChild(amount);

    container.appendChild(row);
  });
}

// =====================================================
// PRODUCTS
// =====================================================
function renderProducts(products = []) {

  const container = $('products-grid-container');

  if (!container) return;

  container.innerHTML = '';

  products.forEach(product => {

    const card = document.createElement('article');
    card.className = 'product-card';

    card.innerHTML = `
      <div class="product-card-top">
        <span class="product-brand">
          ${product.brand || 'Marca'}
        </span>

        <span class="product-stock-badge">
          ${product.stock > 0 ? 'Disponible' : 'Sin Stock'}
        </span>
      </div>

      <div class="product-image-placeholder"></div>

      <div class="product-content">
        <h3 class="product-name">
          ${product.name}
        </h3>

        <p class="product-sku">
          SKU: ${product.sku || 'N/A'}
        </p>
      </div>

      <div class="product-footer">
        <span class="product-price">
          ${money(product.price)}
        </span>

        <button class="add-product-btn">
          Agregar
        </button>
      </div>
    `;

    const button = card.querySelector('.add-product-btn');

    button.addEventListener('click', () => {
      addToCart(product);
    });

    container.appendChild(card);
  });
}

// =====================================================
// CART
// =====================================================
function addToCart(product) {

  const existing = AppState.cartItems.find(item => {
    return item.id === product.id;
  });

  if (existing) {
    existing.quantity += 1;
  } else {
    AppState.cartItems.push({
      ...product,
      quantity: 1
    });
  }

  renderCart();
}

function renderCart() {

  const container = document.querySelector('.cart-items-container');

  if (!container) return;

  container.innerHTML = '';

  AppState.cartItems.forEach(item => {

    const row = document.createElement('div');
    row.className = 'cart-item-row';

    row.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <span>${item.brand || ''}</span>
      </div>

      <div class="cart-item-controls">
        <button class="qty-btn decrease-btn">−</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn increase-btn">+</button>
      </div>

      <div class="cart-item-price">
        ${money(item.price * item.quantity)}
      </div>
    `;

    row.querySelector('.increase-btn')
      .addEventListener('click', () => {
        item.quantity += 1;
        renderCart();
      });

    row.querySelector('.decrease-btn')
      .addEventListener('click', () => {

        item.quantity -= 1;

        if (item.quantity <= 0) {
          AppState.cartItems = AppState.cartItems.filter(i => {
            return i.id !== item.id;
          });
        }

        renderCart();
      });

    container.appendChild(row);
  });
}

// =====================================================
// CHECKOUT
// =====================================================
async function processCheckoutCart() {

  if (!AppState.cartItems.length) {
    return alert('El carrito está vacío.');
  }

  const payload = {
    items: AppState.cartItems,
    paymentMethod: $('payment-method-select').value,
    cashAmount: Number($('checkout-cash-amount').value || 0),
    digitalAmount: Number($('checkout-digital-amount').value || 0),
    discount: Number($('checkout-discount-input').value || 0)
  };

  const response = await apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  alert(`Cobro exitoso. Cambio: ${money(response?.data?.change || 0)}`);

  AppState.cartItems = [];

  renderCart();

  await syncCashRegisterUI();
}

// =====================================================
// CASH TRANSACTION
// =====================================================
async function createCashTransaction() {

  const payload = {
    type: $('trans-type-select').value,
    amount: Number($('trans-amount-input').value),
    concept: $('trans-concept-input').value.trim()
  };

  await apiFetch('/cash/transaction', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  $('cash-transaction-form').reset();

  await syncCashRegisterUI();
}

// =====================================================
// EVENTS
// =====================================================
document.addEventListener('DOMContentLoaded', () => {

  $('login-form')?.addEventListener('submit', async e => {

    e.preventDefault();

    try {

      await handleLogin(
        $('login-identifier').value.trim(),
        $('login-password').value
      );

    } catch (error) {
      alert(error.message);
    }
  });

  $('cash-open-form')?.addEventListener('submit', async e => {

    e.preventDefault();

    try {

      await apiFetch('/cash/open', {
        method: 'POST',
        body: JSON.stringify({
          openingBalance: Number(
            $('cash-opening-balance-input').value
          )
        })
      });

      await syncCashRegisterUI();

    } catch (error) {
      alert(error.message);
    }
  });

  $('checkout-form')?.addEventListener('submit', async e => {

    e.preventDefault();

    try {
      await processCheckoutCart();
    } catch (error) {
      alert(error.message);
    }
  });

  $('cash-transaction-form')?.addEventListener('submit', async e => {

    e.preventDefault();

    try {
      await createCashTransaction();
    } catch (error) {
      alert(error.message);
    }
  });

  $('cash-close-trigger-btn')?.addEventListener('click', () => {
    show($('cash-close-modal'));
  });

  $('cash-close-form')?.addEventListener('submit', async e => {

    e.preventDefault();

    try {

      await apiFetch('/cash/close', {
        method: 'POST',
        body: JSON.stringify({
          realCash: Number($('cash-real-cash-counted').value),
          notes: $('cash-close-notes').value
        })
      });

      hide($('cash-close-modal'));

      localStorage.removeItem('glow_pos_token');
      localStorage.removeItem('glow_pos_user');

      await syncCashRegisterUI();

    } catch (error) {
      alert(error.message);
    }
  });

  // MOCK PRODUCTS TEMPORALES
  AppState.products = [
    {
      id: 1,
      name: 'Soft Pinch Liquid Blush',
      brand: 'Rare Beauty',
      sku: 'RB-2039',
      price: 699,
      stock: 12
    },
    {
      id: 2,
      name: 'Dior Lip Glow',
      brand: 'Dior',
      sku: 'DG-9201',
      price: 850,
      stock: 8
    }
  ];

  renderProducts(AppState.products);

  syncCashRegisterUI();
});

