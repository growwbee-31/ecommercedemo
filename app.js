const SUPABASE_URL = 'https://hqspmulzlnxzoshzstkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxc3BtdWx6bG54em9zaHpzdGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTg5NTksImV4cCI6MjA5MzQzNDk1OX0.931PQhqvclzK1DwJNtp46sGoYxDD_Kk4bPtdINg7yi4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById('app');
const authLink = document.getElementById('auth-link');
const cartCount = document.getElementById('cart-count');

const state = {
  products: [],
  cart: loadCart(),
  user: null,
  orders: [],
};

window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', async () => {
  await restoreSession();
  await refreshProducts();
  renderRoute();
});

async function restoreSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Supabase session restore failed', error.message);
  }
  state.user = session?.user ?? null;
  updateAuthLink();
}

function loadCart() {
  try {
    const payload = localStorage.getItem('online-boss-cart');
    return payload ? JSON.parse(payload) : {};
  } catch (error) {
    return {};
  }
}

function saveCart() {
  localStorage.setItem('online-boss-cart', JSON.stringify(state.cart));
  updateCartCount();
}

function updateCartCount() {
  const count = Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = count;
}

function updateAuthLink() {
  if (state.user) {
    authLink.textContent = 'My Account';
    authLink.href = '#account';
  } else {
    authLink.textContent = 'Login';
    authLink.href = '#login';
  }
}

async function refreshProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Could not load products', error.message);
    state.products = [];
    return;
  }
  state.products = data;
}

async function renderRoute() {
  const hash = window.location.hash.replace('#', '') || 'home';
  if (hash.startsWith('product/')) {
    const productId = hash.split('/')[1];
    renderProductDetail(productId);
    return;
  }

  switch (hash) {
    case 'home':
      renderHome();
      break;
    case 'shop':
      renderShop();
      break;
    case 'cart':
      renderCart();
      break;
    case 'login':
      renderAuth();
      break;
    case 'register':
      renderRegister();
      break;
    case 'account':
      renderAccount();
      break;
    case 'admin':
      renderAdmin();
      break;
    default:
      renderHome();
  }
}

function renderHome() {
  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>Online Boss: Shop the Best Goods</h1>
        <p class="notice">Browse products, manage your cart, and log in to access the admin panel.</p>
      </div>
      <button class="button" onclick="window.location.hash='shop'">Start Shopping</button>
    </section>
    <section class="cards-grid" id="featured-products"></section>
  `;

  const featured = document.getElementById('featured-products');
  const products = state.products.slice(0, 6);

  if (products.length === 0) {
    featured.innerHTML = '<div class="card"><p class="notice">No products loaded. Please seed the products table in Supabase or add them from the admin panel.</p></div>';
    return;
  }

  featured.innerHTML = products.map(product => `
    <article class="card">
      <img src="${product.image_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60'}" alt="${escapeHtml(product.name)}" />
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.description || 'No description available.')}</p>
      <div class="section-title">
        <span class="badge">${Number(product.price).toFixed(2)}</span>
        <button class="button" onclick="window.location.hash='product/${product.id}'">View</button>
      </div>
    </article>
  `).join('');
}

function renderShop() {
  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>Shop Products</h1>
        <p class="notice">Browse all available products. Add items to your cart and checkout securely.</p>
      </div>
    </section>
    <section class="cards-grid" id="products-grid"></section>
  `;

  const grid = document.getElementById('products-grid');
  grid.innerHTML = state.products.map(product => `
    <article class="card">
      <img src="${product.image_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60'}" alt="${escapeHtml(product.name)}" />
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.description || 'No description available.')}</p>
      <div class="section-title">
        <span class="badge">${Number(product.price).toFixed(2)}</span>
        <button class="button" onclick="addToCart(${product.id})">Add to Cart</button>
      </div>
      <button class="button" onclick="window.location.hash='product/${product.id}'">Details</button>
    </article>
  `).join('');
}

function renderProductDetail(productId) {
  const product = state.products.find(item => String(item.id) === String(productId));
  if (!product) {
    app.innerHTML = '<div class="card"><p class="notice">Product not found.</p></div>';
    return;
  }

  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="badge">${Number(product.price).toFixed(2)}</p>
      </div>
      <button class="button" onclick="addToCart(${product.id})">Add to Cart</button>
    </section>
    <div class="card">
      <img src="${product.image_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60'}" alt="${escapeHtml(product.name)}" />
      <p>${escapeHtml(product.description || 'No description available.')}</p>
      <div class="notice">Category: ${escapeHtml(product.category || 'General')}</div>
    </div>
  `;
}

function renderCart() {
  const items = Object.values(state.cart);
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>Your Cart</h1>
        <p class="notice">Review items, update quantities, or proceed to checkout.</p>
      </div>
    </section>
    <div id="cart-items"></div>
    <div class="card" style="margin-top: 20px;">
      <h2>Order summary</h2>
      <p>Total: ${total.toFixed(2)}</p>
      <button class="checkout-button" onclick="placeOrder()" ${items.length === 0 ? 'disabled' : ''}>Place Order</button>
    </div>
  `;

  const cartItemsContainer = document.getElementById('cart-items');
  if (items.length === 0) {
    cartItemsContainer.innerHTML = '<div class="notice">Your cart is empty. Add products from the shop.</div>';
    return;
  }

  cartItemsContainer.innerHTML = items.map(item => `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${item.price.toFixed(2)} � ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button class="button" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
          <span>${item.quantity}</span>
          <button class="button" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
          <button class="button" style="background:#ef4444;color:#fff;" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAuth() {
  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>Login</h1>
        <p class="notice">Log in with your email and password to place orders or access the admin panel.</p>
      </div>
    </section>
    <form class="form-card" id="login-form">
      <label for="login-email">Email</label>
      <input id="login-email" type="email" placeholder="you@example.com" required />
      <label for="login-password">Password</label>
      <input id="login-password" type="password" placeholder="Password" required />
      <button type="submit" class="button">Log In</button>
      <p>New here? <a href="#register">Create an account</a>.</p>
      <div id="login-feedback" class="notice"></div>
    </form>
  `;

  document.getElementById('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    await login(email, password);
  });
}

function renderRegister() {
  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>Register</h1>
        <p class="notice">Create an account to save orders and access the admin dashboard if your role is admin.</p>
      </div>
    </section>
    <form class="form-card" id="register-form">
      <label for="register-email">Email</label>
      <input id="register-email" type="email" placeholder="you@example.com" required />
      <label for="register-password">Password</label>
      <input id="register-password" type="password" placeholder="Password" required />
      <button type="submit" class="button">Register</button>
      <p>Already have an account? <a href="#login">Log in</a>.</p>
      <div id="register-feedback" class="notice"></div>
    </form>
  `;

  document.getElementById('register-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    await register(email, password);
  });
}

function renderAccount() {
  if (!state.user) {
    window.location.hash = '#login';
    return;
  }

  const isAdmin = state.user?.app_metadata?.role === 'admin';
  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>My Account</h1>
        <p class="notice">Email: ${escapeHtml(state.user.email)} | Role: ${escapeHtml(isAdmin ? 'Admin' : 'Customer')}</p>
      </div>
      <button class="button" id="logout-button">Logout</button>
    </section>
    <div class="card">
      <h2>Account details</h2>
      <p>Your account is connected to Supabase and can be used to manage orders.</p>
      ${isAdmin ? '<button class="admin-button" onclick="window.location.hash=\'admin\'">Open Admin Panel</button>' : ''}
    </div>
  `;

  document.getElementById('logout-button').addEventListener('click', logout);
}

async function renderAdmin() {
  if (!state.user) {
    window.location.hash = '#login';
    return;
  }
  if (state.user?.app_metadata?.role !== 'admin') {
    app.innerHTML = '<div class="card"><p class="notice">Admin access requires the role to be set to admin in Supabase user metadata.</p></div>';
    return;
  }

  await loadOrders();

  const ordersHtml = state.orders.length === 0
    ? '<p class="notice">No orders yet. Customers will see this after checkout.</p>'
    : state.orders.map(order => `
      <div class="panel">
        <h3>Order #${order.id}</h3>
        <p>Total: ${Number(order.total).toFixed(2)}</p>
        <p>Status: ${escapeHtml(order.status || 'pending')}</p>
        <p>Items: ${escapeHtml(order.items.map(item => `${item.quantity}� ${item.name}`).join(', '))}</p>
      </div>
    `).join('');

  app.innerHTML = `
    <section class="section-title">
      <div>
        <h1>Admin Dashboard</h1>
        <p class="notice">Create products, manage inventory, and view incoming orders.</p>
      </div>
    </section>
    <div class="form-card">
      <h2>Add a new product</h2>
      <form id="product-form">
        <label for="product-name">Name</label>
        <input id="product-name" required />
        <label for="product-description">Description</label>
        <textarea id="product-description" rows="4"></textarea>
        <label for="product-category">Category</label>
        <input id="product-category" placeholder="Example: Clothing" />
        <label for="product-price">Price</label>
        <input id="product-price" type="number" step="0.01" required />
        <label for="product-image">Image URL</label>
        <input id="product-image" type="url" placeholder="https://..." />
        <button type="submit" class="button">Create Product</button>
      </form>
      <div id="product-feedback" class="notice"></div>
    </div>
    <section class="section-title" style="margin-top:24px;">
      <h2>Recent Orders</h2>
    </section>
    <div>${ordersHtml}</div>
  `;

  document.getElementById('product-form').addEventListener('submit', async event => {
    event.preventDefault();
    await createProduct();
  });
}

async function createProduct() {
  const name = document.getElementById('product-name').value.trim();
  const description = document.getElementById('product-description').value.trim();
  const category = document.getElementById('product-category').value.trim();
  const price = Number(document.getElementById('product-price').value);
  const image_url = document.getElementById('product-image').value.trim();

  const { error } = await supabase.from('products').insert([{ name, description, category, price, image_url }]);
  const feedback = document.getElementById('product-feedback');
  if (error) {
    feedback.textContent = 'Failed to create product: ' + error.message;
    return;
  }
  feedback.textContent = 'Product created successfully.';
  await refreshProducts();
  renderAdmin();
}

async function loadOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Could not load orders', error.message);
    state.orders = [];
    return;
  }
  state.orders = data;
}

function addToCart(productId) {
  const product = state.products.find(item => item.id === productId);
  if (!product) return;
  const existing = state.cart[productId] ?? { ...product, quantity: 0 };
  existing.quantity += 1;
  state.cart[productId] = existing;
  saveCart();
  renderCart();
}

function updateCartQuantity(productId, newQuantity) {
  const item = state.cart[productId];
  if (!item) return;
  if (newQuantity <= 0) {
    delete state.cart[productId];
  } else {
    item.quantity = newQuantity;
  }
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  delete state.cart[productId];
  saveCart();
  renderCart();
}

async function placeOrder() {
  if (!state.user) {
    window.location.hash = '#login';
    return;
  }

  const items = Object.values(state.cart).map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { error } = await supabase.from('orders').insert([{
    user_id: state.user.id,
    status: 'pending',
    total,
    items,
  }]);

  if (error) {
    alert('Order failed: ' + error.message);
    return;
  }

  state.cart = {};
  saveCart();
  alert('Order placed successfully!');
  window.location.hash = '#shop';
}

async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  const feedback = document.getElementById('login-feedback');
  if (error) {
    feedback.textContent = error.message;
    return;
  }
  await restoreSession();
  window.location.hash = '#account';
}

async function register(email, password) {
  const { error } = await supabase.auth.signUp({ email, password }, { data: { role: 'customer' } });
  const feedback = document.getElementById('register-feedback');
  if (error) {
    feedback.textContent = error.message;
    return;
  }
  feedback.textContent = 'Check your inbox for a confirmation email.';
}

async function logout() {
  await supabase.auth.signOut();
  state.user = null;
  updateAuthLink();
  window.location.hash = '#home';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

updateCartCount();
