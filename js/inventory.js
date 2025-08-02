// Inventory Management Module

// Load inventory page
function loadInventoryPage() {
    loadInventoryTable();
    loadLowStockProducts();
    loadInventoryTransactions();
}

// Load inventory table
function loadInventoryTable() {
    const products = dataManager.getProducts();
    const tableBody = document.getElementById("inventory-table-body");

    if (!tableBody) return;

    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <h3>কোনো পণ্য নেই</h3>
                        <p>পণ্য যোগ করতে "পণ্য ব্যবস্থাপনা" পেজে যান</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = products.map(product => `
        <tr class="${product.stock <= 10 ? 'low-stock-row' : ''}">
            <td>${product.name}</td>
            <td>${product.sku}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge ${getStockStatus(product.stock).class}">
                    ${getStockStatus(product.stock).text}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="adjustStock('${product.id}')">স্টক সমন্বয়</button>
            </td>
        </tr>
    `).join("");
}

// Get stock status
function getStockStatus(stock) {
    if (stock === 0) {
        return { class: "status-inactive", text: "স্টক শেষ" };
    } else if (stock <= 10) {
        return { class: "status-low-stock", text: "কম স্টক" };
    } else {
        return { class: "status-active", text: "পর্যাপ্ত" };
    }
}

// Load low stock products
function loadLowStockProducts() {
    const lowStockProducts = dataManager.getLowStockProducts(10);
    const container = document.getElementById("low-stock-products");

    if (!container) return;

    if (lowStockProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <h3>সব পণ্যের স্টক পর্যাপ্ত</h3>
            </div>
        `;
        return;
    }

    container.innerHTML = lowStockProducts.map(product => `
        <div class="low-stock-item">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-sku">SKU: ${product.sku}</div>
            </div>
            <div class="stock-info">
                <div class="current-stock ${product.stock === 0 ? 'out-of-stock' : 'low-stock'}">
                    ${product.stock} টি
                </div>
                <button class="action-btn" onclick="adjustStock('${product.id}')">স্টক যোগ করুন</button>
            </div>
        </div>
    `).join("");
}

// Load inventory transactions
function loadInventoryTransactions() {
    const transactions = dataManager.getInventoryTransactions().slice(-20); // Last 20 transactions
    const tableBody = document.getElementById("transactions-table-body");

    if (!tableBody) return;

    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h3>কোনো লেনদেন নেই</h3>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = transactions.reverse().map(transaction => {
        const product = dataManager.getProductById(transaction.productId);
        return `
            <tr>
                <td>${formatDate(transaction.createdAt)}</td>
                <td>${product ? product.name : 'অজানা পণ্য'}</td>
                <td>
                    <span class="transaction-type ${transaction.type}">
                        ${transaction.type === 'add' ? 'যোগ' : 'বিয়োগ'}
                    </span>
                </td>
                <td>${transaction.quantity}</td>
                <td>${transaction.previousStock} → ${transaction.newStock}</td>
                <td>${transaction.note || 'N/A'}</td>
            </tr>
        `;
    }).join("");
}

// Adjust stock
function adjustStock(productId) {
    const product = dataManager.getProductById(productId);
    if (!product) {
        showNotification("পণ্য পাওয়া যায়নি", "error");
        soundManager.playError();
        return;
    }

    // Set product info in modal
    document.getElementById("adjust-product-name").textContent = product.name;
    document.getElementById("adjust-current-stock").textContent = product.stock;
    document.getElementById("adjust-product-id").value = productId;
    document.getElementById("stock-adjustment").value = "";
    document.getElementById("adjustment-note").value = "";

    openModal("stock-adjustment-modal");
}

// Save stock adjustment
function saveStockAdjustment() {
    const productId = document.getElementById("adjust-product-id").value;
    const adjustmentType = document.querySelector('input[name="adjustment-type"]:checked').value;
    const adjustmentAmount = parseInt(document.getElementById("stock-adjustment").value) || 0;
    const note = document.getElementById("adjustment-note").value.trim();

    if (adjustmentAmount <= 0) {
        showNotification("সঠিক পরিমাণ দিন", "error");
        soundManager.playError();
        return;
    }

    const product = dataManager.getProductById(productId);
    if (!product) {
        showNotification("পণ্য পাওয়া যায়নি", "error");
        soundManager.playError();
        return;
    }

    const changeAmount = adjustmentType === "add" ? adjustmentAmount : -adjustmentAmount;
    const newStock = Math.max(0, product.stock + changeAmount);

    // Update stock
    if (dataManager.updateProductStock(productId, changeAmount, note)) {
        showNotification("স্টক সফলভাবে আপডেট হয়েছে", "success");
        soundManager.playSuccess();
        closeModal();
        loadInventoryPage();
        
        // Reload products in sales page if it's currently active
        if (currentPage === "sales") {
            loadProducts();
        }
    } else {
        showNotification("স্টক আপডেট করতে ব্যর্থ", "error");
        soundManager.playError();
    }
}

// Bulk stock adjustment
function bulkStockAdjustment() {
    const adjustmentType = prompt("সব পণ্যের স্টক যোগ করতে চান নাকি বিয়োগ করতে চান? (add/subtract)");
    
    if (!adjustmentType || (adjustmentType !== "add" && adjustmentType !== "subtract")) {
        return;
    }

    const amount = prompt("কত পরিমাণ স্টক " + (adjustmentType === "add" ? "যোগ" : "বিয়োগ") + " করতে চান?");
    
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
        showNotification("সঠিক পরিমাণ দিন", "error");
        return;
    }

    const adjustmentAmount = parseInt(amount);
    const note = prompt("নোট (ঐচ্ছিক):") || "বাল্ক স্টক সমন্বয়";

    const products = dataManager.getProducts();
    let updatedCount = 0;

    products.forEach(product => {
        const changeAmount = adjustmentType === "add" ? adjustmentAmount : -adjustmentAmount;
        if (dataManager.updateProductStock(product.id, changeAmount, note)) {
            updatedCount++;
        }
    });

    showNotification(`${updatedCount}টি পণ্যের স্টক আপডেট হয়েছে`, "success");
    loadInventoryPage();
}

// Export inventory report
function exportInventoryReport() {
    const products = dataManager.getProducts();
    
    if (products.length === 0) {
        showNotification("কোনো পণ্য নেই", "error");
        return;
    }

    // Create CSV content
    const headers = ["Product Name", "SKU", "Category", "Current Stock", "Stock Value", "Status"];
    const csvContent = [
        headers.join(","),
        ...products.map(product => {
            const stockValue = product.stock * product.price;
            const status = getStockStatus(product.stock).text;
            return [
                `"${product.name}"`,
                `"${product.sku}"`,
                `"${getCategoryName(product.category)}"`,
                product.stock,
                stockValue.toFixed(2),
                `"${status}"`
            ].join(",");
        })
    ].join("\n");

    // Download file
    const filename = `inventory_report_${formatDate(new Date()).replace(/\//g, "-")}.csv`;
    downloadFile(csvContent, filename, "text/csv");
    
    showNotification("ইনভেন্টরি রিপোর্ট এক্সপোর্ট হয়েছে", "success");
}

// Filter inventory by stock status
function filterInventoryByStock(status) {
    const products = dataManager.getProducts();
    let filteredProducts = [];

    switch (status) {
        case "all":
            filteredProducts = products;
            break;
        case "in-stock":
            filteredProducts = products.filter(p => p.stock > 10);
            break;
        case "low-stock":
            filteredProducts = products.filter(p => p.stock > 0 && p.stock <= 10);
            break;
        case "out-of-stock":
            filteredProducts = products.filter(p => p.stock === 0);
            break;
    }

    // Update table with filtered products
    const tableBody = document.getElementById("inventory-table-body");
    if (!tableBody) return;

    if (filteredProducts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <h3>কোনো পণ্য পাওয়া যায়নি</h3>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredProducts.map(product => `
        <tr class="${product.stock <= 10 ? 'low-stock-row' : ''}">
            <td>${product.name}</td>
            <td>${product.sku}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge ${getStockStatus(product.stock).class}">
                    ${getStockStatus(product.stock).text}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="adjustStock('${product.id}')">স্টক সমন্বয়</button>
            </td>
        </tr>
    `).join("");
}

// Search inventory
function searchInventory() {
    const searchTerm = document.getElementById("inventory-search").value.toLowerCase();
    const tableRows = document.querySelectorAll("#inventory-table-body tr");
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

console.log("Inventory module loaded");

