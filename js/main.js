// Main Application Logic for POS System

// Application state
let currentPage = 'sales';
let currentUser = null;
let cart = [];
let selectedCustomer = null;
let selectedPaymentMethod = 'cash';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Initialize application
function initializeApp() {
    // Set current user (in real app, this would come from login)
    currentUser = POS.data.read('users', 'admin');
    
    // Show sales page by default
    showPage('sales');
    
    // Load sample data if no products exist
    loadSampleDataIfNeeded();
    
    console.log('POS System initialized successfully');
}

// Setup event listeners
function setupEventListeners() {
    // Navigation menu
    setupNavigation();
    
    // Search functionality
    setupSearch();
    
    // Category filters
    setupCategoryFilters();
    
    // Payment method selection
    setupPaymentMethods();
    
    // Form submissions
    setupFormSubmissions();
    
    // Cart functionality
    setupCartFunctionality();
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.dataset.page;
            if (page) {
                showPage(page);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// Show specific page
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
        
        // Load page-specific data
        loadPageData(pageId);
    }
}

// Load page-specific data
function loadPageData(pageId) {
    switch (pageId) {
        case 'sales':
            loadProducts();
            loadCustomers();
            break;
        case 'products':
            loadProductsTable();
            loadCategories();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'customers':
            loadCustomersTable();
            break;
        case 'reports':
            // Reports will be loaded when user selects date range
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        const debouncedSearch = debounce(function() {
            const searchTerm = this.value;
            loadProducts({ search: searchTerm });
        }, 300);
        
        searchInput.addEventListener('input', debouncedSearch);
    }
}

// Setup category filters
function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            const category = this.dataset.category;
            loadProducts({ category });
        });
    });
}

// Setup payment methods
function setupPaymentMethods() {
    const paymentButtons = document.querySelectorAll('.payment-btn');
    
    paymentButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            paymentButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update selected payment method
            selectedPaymentMethod = this.dataset.method;
        });
    });
    
    // Setup paid amount calculation
    const paidAmountInput = document.getElementById('paid-amount');
    if (paidAmountInput) {
        paidAmountInput.addEventListener('input', calculateChange);
    }
    
    // Setup discount calculation
    const discountInput = document.getElementById('discount-amount');
    const discountType = document.getElementById('discount-type');
    
    if (discountInput && discountType) {
        discountInput.addEventListener('input', updateCartSummary);
        discountType.addEventListener('change', updateCartSummary);
    }
}

// Setup form submissions
function setupFormSubmissions() {
    // Add product form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    // Add customer form
    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', handleAddCustomer);
    }
    
    // Company settings form
    const companySettingsForm = document.getElementById('company-settings-form');
    if (companySettingsForm) {
        companySettingsForm.addEventListener('submit', handleCompanySettings);
    }
    
    // POS settings form
    const posSettingsForm = document.getElementById('pos-settings-form');
    if (posSettingsForm) {
        posSettingsForm.addEventListener('submit', handlePOSSettings);
    }
}

// Setup cart functionality
function setupCartFunctionality() {
    // Customer selection
    const customerSelect = document.getElementById('customer-select');
    if (customerSelect) {
        customerSelect.addEventListener('change', function() {
            selectedCustomer = this.value ? POS.data.read('customers', this.value) : null;
        });
    }
}

// Load initial data
function loadInitialData() {
    loadProducts();
    loadCustomers();
    updateCartSummary();
}

// Load sample data if needed
function loadSampleDataIfNeeded() {
    const products = POS.getProducts();
    
    if (products.length === 0) {
        // Add sample products
        const sampleProducts = [
            {
                name: 'চা',
                description: 'গরম চা',
                sku: 'TEA001',
                category: 'restaurant',
                unit: 'piece',
                purchase_price: 5,
                selling_price: 10,
                tax_rate: 15,
                stock_quantity: 100,
                min_stock_level: 10,
                is_active: true
            },
            {
                name: 'কফি',
                description: 'গরম কফি',
                sku: 'COFFEE001',
                category: 'restaurant',
                unit: 'piece',
                purchase_price: 15,
                selling_price: 25,
                tax_rate: 15,
                stock_quantity: 50,
                min_stock_level: 5,
                is_active: true
            },
            {
                name: 'চাল',
                description: 'বাসমতি চাল',
                sku: 'RICE001',
                category: 'grocery',
                unit: 'kg',
                purchase_price: 80,
                selling_price: 100,
                tax_rate: 5,
                stock_quantity: 200,
                min_stock_level: 20,
                is_active: true
            },
            {
                name: 'টি-শার্ট',
                description: 'সুতি টি-শার্ট',
                sku: 'TSHIRT001',
                category: 'clothing',
                unit: 'piece',
                purchase_price: 200,
                selling_price: 350,
                tax_rate: 15,
                stock_quantity: 25,
                min_stock_level: 5,
                is_active: true
            }
        ];
        
        sampleProducts.forEach(product => {
            POS.createProduct(product);
        });
        
        // Add sample customer
        POS.createCustomer({
            name: 'সাধারণ গ্রাহক',
            phone: '01700000000',
            email: 'customer@example.com',
            address: 'ঢাকা, বাংলাদেশ',
            credit_limit: 5000,
            current_balance: 0,
            loyalty_points: 0
        });
        
        showToast('নমুনা ডেটা লোড করা হয়েছে', 'info');
    }
}

// Load products for sales page
function loadProducts(filters = {}) {
    const products = POS.getProducts(filters);
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    const stockStatus = product.stock_quantity === 0 ? 'স্টক নেই' : 
                       product.stock_quantity <= product.min_stock_level ? 'কম স্টক' : 
                       `স্টক: ${product.stock_quantity}`;
    
    card.innerHTML = `
        <div class="product-image">
            <i class="fas fa-box"></i>
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-price">${formatCurrency(product.selling_price)}</div>
        <div class="product-stock">${stockStatus}</div>
    `;
    
    // Add click event to add to cart
    card.addEventListener('click', function() {
        if (product.stock_quantity > 0) {
            addToCart(product);
        } else {
            showToast('এই পণ্যটি স্টকে নেই', 'warning');
        }
    });
    
    // Disable if out of stock
    if (product.stock_quantity === 0) {
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
    }
    
    return card;
}

// Load customers for dropdown
function loadCustomers() {
    const customers = POS.getCustomers();
    const customerSelect = document.getElementById('customer-select');
    
    if (!customerSelect) return;
    
    customerSelect.innerHTML = '<option value="">গ্রাহক নির্বাচন করুন</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.phone})`;
        customerSelect.appendChild(option);
    });
}

// Cart management functions
function addToCart(product) {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock_quantity) {
            existingItem.quantity++;
            updateCartSummary();
            renderCart();
            showToast(`${product.name} কার্টে যোগ করা হয়েছে`, 'success');
        } else {
            showToast('পর্যাপ্ত স্টক নেই', 'warning');
        }
    } else {
        const cartItem = {
            product_id: product.id,
            product_name: product.name,
            unit_price: product.selling_price,
            quantity: 1,
            tax_rate: product.tax_rate || 0,
            discount: 0
        };
        
        cart.push(cartItem);
        updateCartSummary();
        renderCart();
        showToast(`${product.name} কার্টে যোগ করা হয়েছে`, 'success');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    updateCartSummary();
    renderCart();
    showToast('পণ্য কার্ট থেকে সরানো হয়েছে', 'info');
}

function updateCartItemQuantity(productId, quantity) {
    const item = cart.find(item => item.product_id === productId);
    const product = POS.data.read('products', productId);
    
    if (item && product) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else if (quantity <= product.stock_quantity) {
            item.quantity = quantity;
            updateCartSummary();
            renderCart();
        } else {
            showToast('পর্যাপ্ত স্টক নেই', 'warning');
        }
    }
}

function clearCart() {
    cart = [];
    selectedCustomer = null;
    document.getElementById('customer-select').value = '';
    updateCartSummary();
    renderCart();
    showToast('কার্ট খালি করা হয়েছে', 'info');
}

// Render cart items
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-muted">কার্ট খালি</p>';
        return;
    }
    
    cart.forEach(item => {
        const cartItemElement = createCartItemElement(item);
        cartItemsContainer.appendChild(cartItemElement);
    });
}

// Create cart item element
function createCartItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    
    const totalAmount = item.quantity * item.unit_price;
    
    itemElement.innerHTML = `
        <div class="cart-item-info">
            <div class="cart-item-name">${item.product_name}</div>
            <div class="cart-item-price">${formatCurrency(item.unit_price)} x ${item.quantity}</div>
        </div>
        <div class="cart-item-controls">
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateCartItemQuantity('${item.product_id}', ${item.quantity - 1})">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                       onchange="updateCartItemQuantity('${item.product_id}', parseInt(this.value))" min="1">
                <button class="quantity-btn" onclick="updateCartItemQuantity('${item.product_id}', ${item.quantity + 1})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart('${item.product_id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="cart-item-total">${formatCurrency(totalAmount)}</div>
    `;
    
    return itemElement;
}

// Update cart summary
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Calculate discount
    const discountAmount = parseNumber(document.getElementById('discount-amount')?.value || 0);
    const discountType = document.getElementById('discount-type')?.value || 'amount';
    const discount = calculateDiscount(subtotal, discountAmount, discountType);
    
    // Calculate tax
    const taxableAmount = subtotal - discount;
    const tax = cart.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemDiscount = (itemTotal / subtotal) * discount;
        const itemTaxableAmount = itemTotal - itemDiscount;
        return sum + calculateTax(itemTaxableAmount, item.tax_rate);
    }, 0);
    
    const grandTotal = taxableAmount + tax;
    
    // Update UI
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax-amount').textContent = formatCurrency(tax);
    document.getElementById('grand-total').textContent = formatCurrency(grandTotal);
    
    // Update change calculation
    calculateChange();
}

// Calculate change
function calculateChange() {
    const grandTotal = parseNumber(document.getElementById('grand-total')?.textContent?.replace(/[^\d.]/g, '') || 0);
    const paidAmount = parseNumber(document.getElementById('paid-amount')?.value || 0);
    const change = Math.max(0, paidAmount - grandTotal);
    
    document.getElementById('change-amount').textContent = formatCurrency(change);
}

// Complete sale
function completeSale() {
    if (cart.length === 0) {
        showToast('কার্টে কোনো পণ্য নেই', 'warning');
        return;
    }
    
    const grandTotal = parseNumber(document.getElementById('grand-total')?.textContent?.replace(/[^\d.]/g, '') || 0);
    const paidAmount = parseNumber(document.getElementById('paid-amount')?.value || 0);
    
    if (selectedPaymentMethod === 'cash' && paidAmount < grandTotal) {
        showToast('প্রদত্ত পরিমাণ যথেষ্ট নয়', 'warning');
        return;
    }
    
    showLoading();
    
    // Prepare sale data
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discountAmount = parseNumber(document.getElementById('discount-amount')?.value || 0);
    const discountType = document.getElementById('discount-type')?.value || 'amount';
    const totalDiscount = calculateDiscount(subtotal, discountAmount, discountType);
    const totalTax = parseNumber(document.getElementById('tax-amount')?.textContent?.replace(/[^\d.]/g, '') || 0);
    
    const saleData = {
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
            ...item,
            total_amount: item.quantity * item.unit_price
        })),
        subtotal: subtotal,
        total_discount: totalDiscount,
        total_tax: totalTax,
        grand_total: grandTotal,
        payment_method: selectedPaymentMethod,
        payment_status: paidAmount >= grandTotal ? 'paid' : 'partial',
        paid_amount: paidAmount,
        due_amount: Math.max(0, grandTotal - paidAmount),
        cashier_id: currentUser?.id || 'admin'
    };
    
    // Create sale
    const sale = POS.createSale(saleData);
    
    hideLoading();
    
    if (sale) {
        showToast('বিক্রয় সফলভাবে সম্পন্ন হয়েছে', 'success');
        
        // Generate and show receipt
        generateReceipt(sale);
        
        // Clear cart
        clearCart();
        
        // Reset form
        document.getElementById('paid-amount').value = '';
        document.getElementById('discount-amount').value = '';
        
        // Reload products to update stock display
        loadProducts();
    } else {
        showToast('বিক্রয় সম্পন্ন করতে সমস্যা হয়েছে', 'error');
    }
}

// Generate receipt
function generateReceipt(sale) {
    const settings = POS.getSettings();
    const receiptContent = document.getElementById('receipt-content');
    
    if (!receiptContent) return;
    
    const customer = sale.customer_id ? POS.data.read('customers', sale.customer_id) : null;
    
    receiptContent.innerHTML = `
        <div class="receipt">
            <div class="text-center mb-2">
                <h3>${settings.company.name}</h3>
                <p>${settings.company.address}</p>
                <p>ফোন: ${settings.company.phone}</p>
                ${settings.company.email ? `<p>ইমেইল: ${settings.company.email}</p>` : ''}
            </div>
            
            <div class="border-bottom mb-2">
                <p><strong>ইনভয়েস নং:</strong> ${sale.invoice_number}</p>
                <p><strong>তারিখ:</strong> ${formatDate(sale.sale_date)} ${formatTime(sale.sale_date)}</p>
                ${customer ? `<p><strong>গ্রাহক:</strong> ${customer.name}</p>` : ''}
                ${customer ? `<p><strong>ফোন:</strong> ${customer.phone}</p>` : ''}
            </div>
            
            <table style="width: 100%; margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: left;">পণ্য</th>
                        <th style="text-align: center;">পরিমাণ</th>
                        <th style="text-align: right;">দাম</th>
                        <th style="text-align: right;">মোট</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
                            <td style="text-align: right;">${formatCurrency(item.total_amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="border-top">
                <div style="display: flex; justify-content: space-between;">
                    <span>সাবটোটাল:</span>
                    <span>${formatCurrency(sale.subtotal)}</span>
                </div>
                ${sale.total_discount > 0 ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>ডিসকাউন্ট:</span>
                        <span>-${formatCurrency(sale.total_discount)}</span>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between;">
                    <span>ট্যাক্স:</span>
                    <span>${formatCurrency(sale.total_tax)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                    <span>মোট:</span>
                    <span>${formatCurrency(sale.grand_total)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>প্রদত্ত:</span>
                    <span>${formatCurrency(sale.paid_amount)}</span>
                </div>
                ${sale.due_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: red;">
                        <span>বাকি:</span>
                        <span>${formatCurrency(sale.due_amount)}</span>
                    </div>
                ` : ''}
                ${sale.paid_amount > sale.grand_total ? `
                    <div style="display: flex; justify-content: space-between; color: green;">
                        <span>ফেরত:</span>
                        <span>${formatCurrency(sale.paid_amount - sale.grand_total)}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="text-center mt-2">
                <p>${settings.print.header_text}</p>
                <p>${settings.print.footer_text}</p>
            </div>
        </div>
    `;
    
    showModal('receipt-modal');
    
    // Auto print if enabled
    if (settings.pos.auto_print_receipt) {
        setTimeout(() => printReceipt(), 500);
    }
}

// Print receipt
function printReceipt() {
    printContent('receipt-content');
}

// Hold sale (save for later)
function holdSale() {
    if (cart.length === 0) {
        showToast('কার্টে কোনো পণ্য নেই', 'warning');
        return;
    }
    
    // In a real application, you would save this to a "held sales" storage
    const heldSale = {
        id: generateUniqueId(),
        cart: [...cart],
        customer: selectedCustomer,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage for now
    const heldSales = Storage.get('held_sales', []);
    heldSales.push(heldSale);
    Storage.set('held_sales', heldSales);
    
    clearCart();
    showToast('বিক্রয় হোল্ড করা হয়েছে', 'info');
}

// Barcode scanning (placeholder)
function scanBarcode() {
    // In a real application, this would integrate with a barcode scanner
    const barcode = prompt('বারকোড স্ক্যান করুন বা টাইপ করুন:');
    if (barcode) {
        const product = POS.data.getProductByBarcode(barcode);
        if (product) {
            addToCart(product);
        } else {
            showToast('পণ্য পাওয়া যায়নি', 'warning');
        }
    }
}

// Logout function
function logout() {
    if (confirm('আপনি কি লগআউট করতে চান?')) {
        // Clear current session
        currentUser = null;
        cart = [];
        selectedCustomer = null;
        
        // In a real application, you would redirect to login page
        showToast('সফলভাবে লগআউট হয়েছে', 'info');
        location.reload();
    }
}

// Global functions for HTML onclick events
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.completeSale = completeSale;
window.holdSale = holdSale;
window.scanBarcode = scanBarcode;
window.printReceipt = printReceipt;
window.logout = logout;



// Modal functionality
function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    overlay.classList.remove('hidden');
    modal.style.display = 'block';
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    // Hide all modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
});

