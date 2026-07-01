// ===== Elements =====
const form = document.getElementById('productForm');
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');
const taxesInput = document.getElementById('taxes');
const adsInput = document.getElementById('ads');
const discountInput = document.getElementById('discount');
const totalOutput = document.getElementById('total');
const countInput = document.getElementById('count');
const categoryInput = document.getElementById('category');
const submitBtn = document.getElementById('submit');
const tbody = document.getElementById('tbody');
const deleteAllWrap = document.getElementById('deleteAllWrap');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');

// ===== State =====
const STORAGE_KEY = 'cruds_products';
let products = loadProducts();
let mode = 'create'; // 'create' | 'update'
let editIndex = null;
let searchMode = 'title'; // 'title' | 'category'

// ===== Storage helpers =====
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Could not read saved products, starting fresh.', err);
    return [];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// ===== Utilities =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calcTotal() {
  const price = parseFloat(priceInput.value);
  if (!isNaN(price)) {
    const taxes = parseFloat(taxesInput.value) || 0;
    const ads = parseFloat(adsInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;
    const result = price + taxes + ads - discount;
    totalOutput.textContent = result.toFixed(2);
    totalOutput.style.background = 'var(--accent)';
    return result;
  }
  totalOutput.textContent = '0';
  return 0;
}

function resetForm() {
  form.reset();
  totalOutput.textContent = '0';
  mode = 'create';
  editIndex = null;
  submitBtn.textContent = 'Create';
  countInput.style.display = 'block';
}

// ===== Create / Update =====
form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (!titleInput.value.trim()) {
    titleInput.focus();
    return;
  }

  const newProduct = {
    title: titleInput.value.trim().toLowerCase(),
    price: priceInput.value,
    taxes: taxesInput.value,
    ads: adsInput.value,
    discount: discountInput.value,
    total: calcTotal().toFixed(2),
    count: countInput.value,
    category: categoryInput.value.trim().toLowerCase(),
  };

  if (mode === 'create') {
    const quantity = parseInt(newProduct.count, 10);
    const copies = quantity > 1 ? quantity : 1;
    for (let i = 0; i < copies; i++) {
      products.push({ ...newProduct });
    }
  } else {
    products[editIndex] = newProduct;
  }

  saveProducts();
  resetForm();
  render();
});

// ===== Delete one =====
function deleteProduct(index) {
  products.splice(index, 1);
  saveProducts();
  render();
}

// ===== Delete all =====
function deleteAllProducts() {
  products = [];
  saveProducts();
  render();
}

// ===== Update (load into form) =====
function editProduct(index) {
  const product = products[index];
  titleInput.value = product.title;
  priceInput.value = product.price;
  taxesInput.value = product.taxes;
  adsInput.value = product.ads;
  discountInput.value = product.discount;
  categoryInput.value = product.category;
  calcTotal();

  countInput.style.display = 'none';
  submitBtn.textContent = 'Update';
  mode = 'update';
  editIndex = index;

  window.scroll({ top: 0, behavior: 'smooth' });
}

// ===== Render =====
function renderRows(list) {
  tbody.innerHTML = list
    .map(
      ({ product, index }) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(product.title)}</td>
        <td>${escapeHtml(product.price)}</td>
        <td>${escapeHtml(product.taxes)}</td>
        <td>${escapeHtml(product.ads)}</td>
        <td>${escapeHtml(product.discount)}</td>
        <td>${escapeHtml(product.total)}</td>
        <td>${escapeHtml(product.category)}</td>
        <td><button type="button" class="btn-update" data-action="edit" data-index="${index}">Update</button></td>
        <td><button type="button" class="btn-delete" data-action="delete" data-index="${index}">Delete</button></td>
      </tr>`
    )
    .join('');

  emptyState.hidden = list.length !== 0;
}

function render() {
  calcTotal();

  const withIndex = products.map((product, index) => ({ product, index }));
  renderRows(withIndex);

  deleteAllWrap.innerHTML = products.length
    ? `<button type="button" id="deleteAllBtn">Delete all (${products.length})</button>`
    : '';
}

// ===== Search =====
function filterProducts(value) {
  const query = value.trim().toLowerCase();
  const withIndex = products.map((product, index) => ({ product, index }));

  if (!query) {
    renderRows(withIndex);
    return;
  }

  const filtered = withIndex.filter(({ product }) =>
    product[searchMode].includes(query)
  );
  renderRows(filtered);
}

searchInput.addEventListener('keyup', (e) => filterProducts(e.target.value));

document.querySelectorAll('.search-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    searchMode = btn.dataset.mode;
    searchInput.placeholder = `Search by ${searchMode}`;
    searchInput.value = '';
    searchInput.focus();
    render();
  });
});

// ===== Live total while typing =====
[priceInput, taxesInput, adsInput, discountInput].forEach((input) =>
  input.addEventListener('keyup', calcTotal)
);

// ===== Event delegation for table + delete-all button =====
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (target) {
    const index = Number(target.dataset.index);
    if (target.dataset.action === 'edit') editProduct(index);
    if (target.dataset.action === 'delete') deleteProduct(index);
    return;
  }

  if (e.target.id === 'deleteAllBtn') {
    deleteAllProducts();
  }
});

// ===== Init =====
render();