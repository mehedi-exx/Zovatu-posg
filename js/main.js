// Main JavaScript for POS System

// Global variables
let currentPage = "sales";
let currentEditingProduct = null;
let currentEditingCustomer = null;
let cart = [];

// DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
    loadPage(currentPage);
    setupEventListeners();
    updateHeaderCompanyName(dataManager.getSettings().companyName);
});

// Load page content
function loadPage(page) {
    currentPage = page;
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // Remove active class from all nav items
    document.querySelectorAll(".sidebar-nav a").forEach(item => {
        item.classList.remove("active");
    });

    // Add active class to current nav item
    const activeNavItem = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add("active");
    }

    // Load content based on page
    switch (page) {
        case "sales":
            mainContent.innerHTML = getSalesPageHTML();
            loadProducts();
            loadCustomersForSelect();
            break;
        case "products":
            mainContent.innerHTML = getProductsPageHTML();
            loadProductsTable();
            loadCategoriesForSelect();
            break;
        case "inventory":
            mainContent.innerHTML = getInventoryPageHTML();
            loadInventoryPage();
            break;
        case "customers":
            mainContent.innerHTML = getCustomersPageHTML();
            loadCustomersPage();
            break;
        case "reports":
            mainContent.innerHTML = getReportsPageHTML();
            loadReportsPage();
            break;
        case "settings":
            mainContent.innerHTML = getSettingsPageHTML();
            loadSettingsPage();
            break;
        default:
            mainContent.innerHTML = `<h1>পেজ পাওয়া যায়নি</h1>`;
    }
    // Ensure modals are closed when page changes
    closeModal();
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll(".sidebar-nav a").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            loadPage(e.target.dataset.page);
        });
    });

    // Modals
    document.querySelectorAll(".modal-close, .modal-overlay").forEach(element => {
        element.addEventListener("click", closeModal);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });

    // Initial sound setup
    soundManager.init();
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
        document.body.classList.add("modal-open");
    }
}

// Close modal
function closeModal() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("active");
    });
    document.body.classList.remove("modal-open");
    // Reset current editing product/customer
    currentEditingProduct = null;
    currentEditingCustomer = null;
}

// Show notification
function showNotification(message, type = "info") {
    const notificationContainer = document.getElementById("notification-container");
    if (!notificationContainer) return;

    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("hide");
        notification.addEventListener("transitionend", () => {
            notification.remove();
        });
    }, 3000);
}

// HTML Templates for Pages (simplified for brevity, actual content in separate functions)
function getSalesPageHTML() {
    return `
        <div class="page-header">
            <h2>বিক্রয় কেন্দ্র</h2>
            <div class="page-actions">
                <input type="text" id="product-search" placeholder="পণ্য খুঁজুন..." onkeyup="searchProducts()">
                <button class="btn btn-danger" onclick="clearCart()">সব মুছুন</button>
            </div>
        </div>
        <div class="sales-grid">
            <div class="products-section">
                <div class="category-filter">
                    <button class="btn btn-category active" data-category="all" onclick="filterProductsByCategory(\'all\')">সব</button>
                    ${dataManager.getCategories().map(cat => `<button class="btn btn-category" data-category="${cat.id}" onclick="filterProductsByCategory(\'${cat.id}\\' )">${cat.icon} ${cat.name}</button>`).join("")}
                </div>
                <div class="product-list" id="product-list"></div>
            </div>
            <div class="cart-section">
                <h3>বর্তমান অর্ডার</h3>
                <div class="cart-items" id="cart-items"></div>
                <div class="cart-summary">
                    <div class="summary-row"><span>সাবটোটাল:</span> <span id="cart-subtotal">৳০.০০</span></div>
                    <div class="summary-row"><span>ট্যাক্স:</span> <span id="cart-tax">৳০.০০</span></div>
                    <div class="summary-row"><span>ডিসকাউন্ট:</span> <span id="cart-discount">৳০.০০</span></div>
                    <div class="summary-row total"><span>মোট:</span> <span id="cart-total">৳০.০০</span></div>
                </div>
                <div class="customer-select">
                    <label for="customer-id">গ্রাহক:</label>
                    <select id="customer-id"></select>
                </div>
                <div class="payment-section">
                    <label>পেমেন্ট পদ্ধতি:</label>
                    <div class="payment-methods">
                        <button class="btn btn-payment active" data-method="cash" onclick="selectPaymentMethod(\'cash\')">নগদ</button>
                        <button class="btn btn-payment" data-method="card" onclick="selectPaymentMethod(\'card\')">কার্ড</button>
                        <button class="btn btn-payment" data-method="mobile" onclick="selectPaymentMethod(\'mobile\')">মোবাইল</button>
                    </div>
                    <label for="amount-paid">প্রদত্ত পরিমাণ:</label>
                    <input type="number" id="amount-paid" placeholder="০.০০" oninput="calculateChange()">
                    <div class="change-display">ফেরত: <span id="amount-change">৳০.০০</span></div>
                </div>
                <button class="btn btn-primary btn-block" onclick="completeSale()">সম্পন্ন করুন</button>
            </div>
        </div>
    `;
}

function getProductsPageHTML() {
    return `
        <div class="page-header">
            <h2>পণ্য ব্যবস্থাপনা</h2>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="openAddProductModal()">নতুন পণ্য</button>
            </div>
        </div>
        <div class="card">
            <div class="table-actions">
                <input type="text" id="product-search-table" placeholder="পণ্য খুঁজুন..." onkeyup="searchProductsTable()">
                <select id="product-category-filter" onchange="filterProductsTableByCategory()">
                    <option value="all">সব ক্যাটাগরি</option>
                    ${dataManager.getCategories().map(cat => `<option value="${cat.id}">${cat.name}</option>`).join("")}
                </select>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>পণ্যের নাম</th>
                            <th>SKU</th>
                            <th>ক্যাটাগরি</th>
                            <th>মূল্য</th>
                            <th>স্টক</th>
                            <th>স্ট্যাটাস</th>
                            <th>অ্যাকশন</th>
                        </tr>
                    </thead>
                    <tbody id="products-table-body"></tbody>
                </table>
            </div>
        </div>

        <!-- Product Modal -->
        <div id="product-modal" class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>পণ্য যোগ/সম্পাদনা</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="product-form">
                        <div class="form-group">
                            <label for="product-name">পণ্যের নাম</label>
                            <input type="text" id="product-name" required>
                        </div>
                        <div class="form-group">
                            <label for="product-sku">SKU</label>
                            <input type="text" id="product-sku">
                        </div>
                        <div class="form-group">
                            <label for="product-category">ক্যাটাগরি</label>
                            <select id="product-category" required>
                                <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="product-price">মূল্য</label>
                            <input type="number" id="product-price" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="product-stock">স্টক</label>
                            <input type="number" id="product-stock" required>
                        </div>
                        <div class="form-group">
                            <label for="product-description">বিবরণ (ঐচ্ছিক)</label>
                            <textarea id="product-description"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-close">বাতিল</button>
                            <button type="submit" class="btn btn-primary" onclick="saveProduct(event)">সংরক্ষণ করুন</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function getInventoryPageHTML() {
    return `
        <div class="page-header">
            <h2>ইনভেন্টরি ব্যবস্থাপনা</h2>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="exportInventoryReport()">রিপোর্ট এক্সপোর্ট</button>
                <button class="btn btn-primary" onclick="bulkStockAdjustment()">বাল্ক স্টক সমন্বয়</button>
            </div>
        </div>
        <div class="inventory-grid">
            <div class="card">
                <h3>কম স্টক পণ্য</h3>
                <div id="low-stock-products" class="low-stock-list"></div>
            </div>
            <div class="card">
                <h3>স্টক তালিকা</h3>
                <div class="table-actions">
                    <input type="text" id="inventory-search" placeholder="পণ্য খুঁজুন..." onkeyup="searchInventory()">
                    <select id="inventory-filter-status" onchange="filterInventoryByStock(this.value)">
                        <option value="all">সব স্ট্যাটাস</option>
                        <option value="in-stock">পর্যাপ্ত স্টক</option>
                        <option value="low-stock">কম স্টক</option>
                        <option value="out-of-stock">স্টক শেষ</option>
                    </select>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>পণ্যের নাম</th>
                                <th>SKU</th>
                                <th>ক্যাটাগরি</th>
                                <th>স্টক</th>
                                <th>স্ট্যাটাস</th>
                                <th>অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="card full-width">
                <h3>ইনভেন্টরি লেনদেন</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>তারিখ</th>
                                <th>পণ্য</th>
                                <th>প্রকার</th>
                                <th>পরিমাণ</th>
                                <th>স্টক পরিবর্তন</th>
                                <th>নোট</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Stock Adjustment Modal -->
        <div id="stock-adjustment-modal" class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>স্টক সমন্বয়</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="stock-adjustment-form">
                        <div class="form-group">
                            <label>পণ্য:</label>
                            <span id="adjust-product-name"></span>
                            <input type="hidden" id="adjust-product-id">
                        </div>
                        <div class="form-group">
                            <label>বর্তমান স্টক:</label>
                            <span id="adjust-current-stock"></span>
                        </div>
                        <div class="form-group">
                            <label>সমন্বয়ের প্রকার:</label>
                            <div class="radio-group">
                                <label><input type="radio" name="adjustment-type" value="add" checked> যোগ করুন</label>
                                <label><input type="radio" name="adjustment-type" value="subtract"> বিয়োগ করুন</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="stock-adjustment">পরিমাণ</label>
                            <input type="number" id="stock-adjustment" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="adjustment-note">নোট (ঐচ্ছিক)</label>
                            <textarea id="adjustment-note"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-close">বাতিল</button>
                            <button type="submit" class="btn btn-primary" onclick="saveStockAdjustment()">সংরক্ষণ করুন</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function getCustomersPageHTML() {
    return `
        <div class="page-header">
            <h2>গ্রাহক ব্যবস্থাপনা</h2>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="openAddCustomerModal()">নতুন গ্রাহক</button>
            </div>
        </div>
        <div class="card">
            <div class="table-actions">
                <input type="text" id="customers-search" placeholder="গ্রাহক খুঁজুন..." onkeyup="searchCustomersTable()">
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>নাম</th>
                            <th>ফোন</th>
                            <th>ইমেইল</th>
                            <th>মোট ক্রয়</th>
                            <th>সর্বশেষ ক্রয়</th>
                            <th>অ্যাকশন</th>
                        </tr>
                    </thead>
                    <tbody id="customers-table-body"></tbody>
                </table>
            </div>
        </div>

        <!-- Customer Modal -->
        <div id="customer-modal" class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>গ্রাহক যোগ/সম্পাদনা</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="customer-form">
                        <div class="form-group">
                            <label for="customer-name">নাম</label>
                            <input type="text" id="customer-name" required>
                        </div>
                        <div class="form-group">
                            <label for="customer-phone">ফোন</label>
                            <input type="text" id="customer-phone" required>
                        </div>
                        <div class="form-group">
                            <label for="customer-email">ইমেইল (ঐচ্ছিক)</label>
                            <input type="email" id="customer-email">
                        </div>
                        <div class="form-group">
                            <label for="customer-address">ঠিকানা (ঐচ্ছিক)</label>
                            <textarea id="customer-address"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-close">বাতিল</button>
                            <button type="submit" class="btn btn-primary" onclick="saveCustomer()">সংরক্ষণ করুন</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function getReportsPageHTML() {
    return `
        <div class="page-header">
            <h2>রিপোর্ট ও বিশ্লেষণ</h2>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="printReport()">প্রিন্ট রিপোর্ট</button>
            </div>
        </div>
        <div class="report-grid">
            <div class="card summary-card">
                <h3>আজকের বিক্রয়</h3>
                <span id="todays-sales" class="summary-value">৳০.০০</span>
            </div>
            <div class="card summary-card">
                <h3>এই মাসের বিক্রয়</h3>
                <span id="month-sales" class="summary-value">৳০.০০</span>
            </div>
            <div class="card summary-card">
                <h3>মোট পণ্য</h3>
                <span id="total-products" class="summary-value">০</span>
            </div>
            <div class="card summary-card">
                <h3>মোট গ্রাহক</h3>
                <span id="total-customers" class="summary-value">০</span>
            </div>
            <div class="card summary-card">
                <h3>কম স্টক পণ্য</h3>
                <span id="low-stock-count" class="summary-value">০</span>
            </div>
            <div class="card summary-card">
                <h3>মোট বিক্রয়</h3>
                <span id="total-sales" class="summary-value">৳০.০০</span>
            </div>
        </div>

        <div class="card full-width">
            <h3>বিক্রয় ওভারভিউ (গত ৩০ দিন)</h3>
            <div id="sales-chart" class="sales-chart"></div>
        </div>

        <div class="report-grid">
            <div class="card">
                <h3>সেরা বিক্রেতা পণ্য</h3>
                <div id="top-products" class="top-products-list"></div>
            </div>
            <div class="card">
                <h3>সাম্প্রতিক বিক্রয়</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>তারিখ ও সময়</th>
                                <th>পণ্য</th>
                                <th>গ্রাহক</th>
                                <th>মোট</th>
                                <th>পেমেন্ট</th>
                            </tr>
                        </thead>
                        <tbody id="recent-sales-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card full-width">
            <h3>কাস্টম রিপোর্ট জেনারেট করুন</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label for="report-start-date">শুরুর তারিখ</label>
                    <input type="date" id="report-start-date">
                </div>
                <div class="form-group">
                    <label for="report-end-date">শেষের তারিখ</label>
                    <input type="date" id="report-end-date">
                </div>
                <div class="form-group">
                    <label for="report-type">রিপোর্টের প্রকার</label>
                    <select id="report-type">
                        <option value="sales">বিক্রয় রিপোর্ট</option>
                        <option value="products">পণ্য রিপোর্ট</option>
                        <option value="customers">গ্রাহক রিপোর্ট</option>
                        <option value="inventory">ইনভেন্টরি রিপোর্ট</option>
                    </select>
                </div>
                <div class="form-group">
                    <button class="btn btn-primary" onclick="generateCustomReport()">রিপোর্ট তৈরি করুন</button>
                </div>
            </div>
        </div>
    `;
}

function getSettingsPageHTML() {
    return `
        <div class="page-header">
            <h2>সেটিংস</h2>
        </div>
        <div class="settings-grid">
            <div class="card">
                <h3>কোম্পানি তথ্য</h3>
                <form id="company-settings-form">
                    <div class="form-group">
                        <label for="company-name">কোম্পানির নাম</label>
                        <input type="text" id="company-name">
                    </div>
                    <div class="form-group">
                        <label for="company-address">ঠিকানা</label>
                        <textarea id="company-address"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="company-phone">ফোন</label>
                        <input type="text" id="company-phone">
                    </div>
                    <div class="form-group">
                        <label for="company-email">ইমেইল</label>
                        <input type="email" id="company-email">
                    </div>
                    <div class="form-group">
                        <label for="tax-rate">ট্যাক্স রেট (%)</label>
                        <input type="number" id="tax-rate" step="0.01" min="0" max="100">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="saveCompanySettings()">সংরক্ষণ করুন</button>
                    </div>
                </form>
            </div>

            <div class="card">
                <h3>সিস্টেম সেটিংস</h3>
                <div class="form-group">
                    <label for="currency">মুদ্রা</label>
                    <select id="currency" disabled>
                        <option value="BDT">৳ BDT (বাংলাদেশী টাকা)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="sound-enabled">সাউন্ড চালু করুন</label>
                    <input type="checkbox" id="sound-enabled" onchange="toggleSound()">
                </div>
                <div class="form-group">
                    <label for="sound-volume">সাউন্ড ভলিউম: <span id="volume-display"></span></label>
                    <input type="range" id="sound-volume" min="0" max="100" value="50" oninput="updateSoundVolume()">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="testSound()">টেস্ট সাউন্ড</button>
                </div>
            </div>

            <div class="card">
                <h3>ডেটা ব্যাকআপ ও পুনরুদ্ধার</h3>
                <div class="form-group">
                    <label>সর্বশেষ ব্যাকআপ:</label>
                    <span id="last-backup"></span>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="backupData()">ব্যাকআপ নিন</button>
                    <button type="button" class="btn btn-secondary" onclick="restoreData()">পুনরুদ্ধার করুন</button>
                </div>
                <div class="form-actions mt-2">
                    <button type="button" class="btn btn-info" onclick="exportAllData()">সম্পূর্ণ ডেটা এক্সপোর্ট</button>
                    <button type="button" class="btn btn-info" onclick="importAllData()">সম্পূর্ণ ডেটা ইমপোর্ট</button>
                </div>
                <div class="form-actions mt-2">
                    <button type="button" class="btn btn-danger" onclick="clearAllData()">সব ডেটা মুছুন</button>
                </div>
            </div>

            <div class="card">
                <h3>সিস্টেম তথ্য</h3>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="showSystemInfo()">সিস্টেম তথ্য দেখুন</button>
                    <button type="button" class="btn btn-danger" onclick="resetToDefault()">ডিফল্ট সেটিংসে রিসেট</button>
                </div>
            </div>
        </div>
    `;
}

// Initial page load
loadPage("sales");

console.log("Main module loaded");

