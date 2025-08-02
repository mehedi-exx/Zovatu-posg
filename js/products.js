// Product Management Functions

// Load products table
function loadProductsTable() {
    const products = POS.getProducts();
    const tableBody = document.querySelector('#products-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">কোনো পণ্য পাওয়া যায়নি</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = createProductTableRow(product);
        tableBody.appendChild(row);
    });
}

// Create product table row
function createProductTableRow(product) {
    const row = document.createElement('tr');
    
    const stockStatus = product.stock_quantity === 0 ? 'out-of-stock' : 
                       product.stock_quantity <= product.min_stock_level ? 'low-stock' : 'in-stock';
    
    const stockStatusText = product.stock_quantity === 0 ? 'স্টক নেই' : 
                           product.stock_quantity <= product.min_stock_level ? 'কম স্টক' : 'স্টক আছে';
    
    row.innerHTML = `
        <td>
            <div class="product-image" style="width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 0.25rem;">
                <i class="fas fa-box"></i>
            </div>
        </td>
        <td>
            <div>
                <div class="font-bold">${product.name}</div>
                <div class="text-muted" style="font-size: 0.8rem;">${product.description || ''}</div>
            </div>
        </td>
        <td>${product.sku || '-'}</td>
        <td>
            <span class="category-badge">${getCategoryName(product.category)}</span>
        </td>
        <td class="text-right font-bold">${formatCurrency(product.selling_price)}</td>
        <td class="text-center">
            <span class="status-badge ${stockStatus}">${stockStatusText}</span>
            <div style="font-size: 0.8rem; margin-top: 0.25rem;">${product.stock_quantity} ${product.unit}</div>
        </td>
        <td>
            <div class="action-buttons-table">
                <button class="action-btn edit" onclick="editProduct('${product.id}')" title="সম্পাদনা">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn view" onclick="viewProduct('${product.id}')" title="দেখুন">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="মুছুন">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Get category name
function getCategoryName(categoryId) {
    const categories = POS.data.getAll('categories');
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
}

// Load categories for dropdown
function loadCategories() {
    const categories = POS.data.getAll('categories');
    const categorySelects = document.querySelectorAll('#product-category, #category-filter');
    
    categorySelects.forEach(select => {
        if (select.id === 'category-filter') {
            select.innerHTML = '<option value="">সব ক্যাটাগরি</option>';
        }
        
        categories.forEach(category => {
            if (category.is_active) {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            }
        });
    });
}

// Show add product modal
function showAddProductModal() {
    loadCategories();
    showModal('add-product-modal');
}

// Handle add product form submission
function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('product-name') || document.getElementById('product-name').value,
        description: formData.get('product-description') || document.getElementById('product-description').value,
        sku: formData.get('product-sku') || document.getElementById('product-sku').value,
        category: formData.get('product-category') || document.getElementById('product-category').value,
        unit: formData.get('product-unit') || document.getElementById('product-unit').value,
        purchase_price: parseNumber(formData.get('purchase-price') || document.getElementById('purchase-price').value),
        selling_price: parseNumber(formData.get('selling-price') || document.getElementById('selling-price').value),
        tax_rate: parseNumber(formData.get('tax-rate') || document.getElementById('tax-rate').value),
        stock_quantity: parseNumber(formData.get('stock-quantity') || document.getElementById('stock-quantity').value),
        min_stock_level: 5, // Default minimum stock level
        is_active: true
    };
    
    // Validation
    const errors = validateForm(e.target, {
        'product-name': [
            { type: 'required', message: 'পণ্যের নাম আবশ্যক' }
        ],
        'product-category': [
            { type: 'required', message: 'ক্যাটাগরি নির্বাচন আবশ্যক' }
        ],
        'selling-price': [
            { type: 'required', message: 'বিক্রয় মূল্য আবশ্যক' },
            { type: 'range', min: 0.01, max: 999999, message: 'বিক্রয় মূল্য ০.০১ থেকে ৯৯৯৯৯৯ এর মধ্যে হতে হবে' }
        ]
    });
    
    if (errors.length > 0) {
        showToast(errors[0].message, 'error');
        return;
    }
    
    // Check if SKU already exists
    if (productData.sku) {
        const existingProduct = POS.getProducts().find(p => p.sku === productData.sku);
        if (existingProduct) {
            showToast('এই SKU ইতিমধ্যে ব্যবহৃত হয়েছে', 'error');
            return;
        }
    }
    
    showLoading();
    
    const product = POS.createProduct(productData);
    
    hideLoading();
    
    if (product) {
        showToast('পণ্য সফলভাবে যোগ করা হয়েছে', 'success');
        closeModal('add-product-modal');
        loadProductsTable();
        
        // If on sales page, reload products
        if (currentPage === 'sales') {
            loadProducts();
        }
    } else {
        showToast('পণ্য যোগ করতে সমস্যা হয়েছে', 'error');
    }
}

// Edit product
function editProduct(productId) {
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    // Populate form with product data
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-sku').value = product.sku || '';
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-unit').value = product.unit;
    document.getElementById('purchase-price').value = product.purchase_price;
    document.getElementById('selling-price').value = product.selling_price;
    document.getElementById('tax-rate').value = product.tax_rate;
    document.getElementById('stock-quantity').value = product.stock_quantity;
    
    // Change form to edit mode
    const form = document.getElementById('add-product-form');
    const modal = document.getElementById('add-product-modal');
    const modalTitle = modal.querySelector('.modal-header h3');
    
    modalTitle.textContent = 'পণ্য সম্পাদনা করুন';
    form.dataset.editId = productId;
    
    // Update form submission handler
    form.removeEventListener('submit', handleAddProduct);
    form.addEventListener('submit', handleEditProduct);
    
    loadCategories();
    showModal('add-product-modal');
}

// Handle edit product form submission
function handleEditProduct(e) {
    e.preventDefault();
    
    const productId = e.target.dataset.editId;
    const formData = new FormData(e.target);
    
    const updates = {
        name: formData.get('product-name') || document.getElementById('product-name').value,
        description: formData.get('product-description') || document.getElementById('product-description').value,
        sku: formData.get('product-sku') || document.getElementById('product-sku').value,
        category: formData.get('product-category') || document.getElementById('product-category').value,
        unit: formData.get('product-unit') || document.getElementById('product-unit').value,
        purchase_price: parseNumber(formData.get('purchase-price') || document.getElementById('purchase-price').value),
        selling_price: parseNumber(formData.get('selling-price') || document.getElementById('selling-price').value),
        tax_rate: parseNumber(formData.get('tax-rate') || document.getElementById('tax-rate').value),
        stock_quantity: parseNumber(formData.get('stock-quantity') || document.getElementById('stock-quantity').value)
    };
    
    // Validation
    const errors = validateForm(e.target, {
        'product-name': [
            { type: 'required', message: 'পণ্যের নাম আবশ্যক' }
        ],
        'product-category': [
            { type: 'required', message: 'ক্যাটাগরি নির্বাচন আবশ্যক' }
        ],
        'selling-price': [
            { type: 'required', message: 'বিক্রয় মূল্য আবশ্যক' },
            { type: 'range', min: 0.01, max: 999999, message: 'বিক্রয় মূল্য ০.০১ থেকে ৯৯৯৯৯৯ এর মধ্যে হতে হবে' }
        ]
    });
    
    if (errors.length > 0) {
        showToast(errors[0].message, 'error');
        return;
    }
    
    // Check if SKU already exists (excluding current product)
    if (updates.sku) {
        const existingProduct = POS.getProducts().find(p => p.sku === updates.sku && p.id !== productId);
        if (existingProduct) {
            showToast('এই SKU ইতিমধ্যে ব্যবহৃত হয়েছে', 'error');
            return;
        }
    }
    
    showLoading();
    
    const updatedProduct = POS.data.update('products', productId, updates);
    
    hideLoading();
    
    if (updatedProduct) {
        showToast('পণ্য সফলভাবে আপডেট করা হয়েছে', 'success');
        closeModal('add-product-modal');
        loadProductsTable();
        
        // Reset form
        resetProductForm();
        
        // If on sales page, reload products
        if (currentPage === 'sales') {
            loadProducts();
        }
    } else {
        showToast('পণ্য আপডেট করতে সমস্যা হয়েছে', 'error');
    }
}

// View product details
function viewProduct(productId) {
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    // Create a simple view modal (you can enhance this)
    const viewContent = `
        <div style="padding: 1rem;">
            <h3>${product.name}</h3>
            <p><strong>বর্ণনা:</strong> ${product.description || 'নেই'}</p>
            <p><strong>SKU:</strong> ${product.sku || 'নেই'}</p>
            <p><strong>ক্যাটাগরি:</strong> ${getCategoryName(product.category)}</p>
            <p><strong>ইউনিট:</strong> ${product.unit}</p>
            <p><strong>ক্রয় মূল্য:</strong> ${formatCurrency(product.purchase_price)}</p>
            <p><strong>বিক্রয় মূল্য:</strong> ${formatCurrency(product.selling_price)}</p>
            <p><strong>ট্যাক্স রেট:</strong> ${product.tax_rate}%</p>
            <p><strong>স্টক:</strong> ${product.stock_quantity} ${product.unit}</p>
            <p><strong>সর্বনিম্ন স্টক:</strong> ${product.min_stock_level || 0} ${product.unit}</p>
            <p><strong>স্ট্যাটাস:</strong> ${product.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</p>
            <p><strong>তৈরি:</strong> ${formatDate(product.created_date)}</p>
            <p><strong>আপডেট:</strong> ${formatDate(product.updated_date)}</p>
        </div>
    `;
    
    // Show in a simple alert for now (you can create a proper modal)
    alert(viewContent.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n'));
}

// Delete product
function deleteProduct(productId) {
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    if (confirm(`আপনি কি "${product.name}" পণ্যটি মুছে ফেলতে চান?`)) {
        showLoading();
        
        const deleted = POS.data.delete('products', productId);
        
        hideLoading();
        
        if (deleted) {
            showToast('পণ্য সফলভাবে মুছে ফেলা হয়েছে', 'success');
            loadProductsTable();
            
            // If on sales page, reload products
            if (currentPage === 'sales') {
                loadProducts();
            }
        } else {
            showToast('পণ্য মুছতে সমস্যা হয়েছে', 'error');
        }
    }
}

// Reset product form
function resetProductForm() {
    const form = document.getElementById('add-product-form');
    const modal = document.getElementById('add-product-modal');
    const modalTitle = modal.querySelector('.modal-header h3');
    
    modalTitle.textContent = 'নতুন পণ্য যোগ করুন';
    delete form.dataset.editId;
    
    // Reset form submission handler
    form.removeEventListener('submit', handleEditProduct);
    form.addEventListener('submit', handleAddProduct);
    
    form.reset();
}

// Setup product filters
function setupProductFilters() {
    const productFilter = document.getElementById('product-filter');
    const categoryFilter = document.getElementById('category-filter');
    
    if (productFilter) {
        const debouncedFilter = debounce(function() {
            filterProductsTable();
        }, 300);
        
        productFilter.addEventListener('input', debouncedFilter);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProductsTable);
    }
}

// Filter products table
function filterProductsTable() {
    const searchTerm = document.getElementById('product-filter')?.value || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (categoryFilter) filters.category = categoryFilter;
    
    const products = POS.getProducts(filters);
    const tableBody = document.querySelector('#products-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">কোনো পণ্য পাওয়া যায়নি</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = createProductTableRow(product);
        tableBody.appendChild(row);
    });
}

// Initialize product management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupProductFilters();
    
    // Reset form when modal is closed
    const addProductModal = document.getElementById('add-product-modal');
    if (addProductModal) {
        addProductModal.addEventListener('hidden', resetProductForm);
    }
});

// Global functions for HTML onclick events
window.showAddProductModal = showAddProductModal;
window.editProduct = editProduct;
window.viewProduct = viewProduct;
window.deleteProduct = deleteProduct;
window.handleAddProduct = handleAddProduct;

