// Products Management Module

// Load products page
function loadProductsPage() {
    loadProductsTable();
    loadCategoriesForSelect(); // Ensure categories are loaded for the product form
}

// Load products table
function loadProductsTable() {
    const products = dataManager.getProducts();
    const tableBody = document.getElementById("products-table-body");
    
    if (!tableBody) return;

    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <h3>কোনো পণ্য নেই</h3>
                        <p>নতুন পণ্য যোগ করুন</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.sku}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge ${product.stock > 0 ? "status-active" : "status-inactive"}">
                    ${product.stock > 0 ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </span>
                ${product.stock <= 10 && product.stock > 0 ? 
                    "<span class="status-badge status-low-stock">কম স্টক</span>" : ""}
            </td>
            <td>
                <button class="action-btn" onclick="editProduct(\'${product.id}\')">সম্পাদনা</button>
                <button class="action-btn delete" onclick="deleteProduct(\'${product.id}\')">মুছুন</button>
            </td>
        </tr>
    `).join("");
}

// Get category name
function getCategoryName(categoryId) {
    const categories = dataManager.getCategories();
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
}

// Load categories into the product form select dropdown
function loadCategoriesForSelect() {
    const categorySelect = document.getElementById("product-category");
    if (!categorySelect) return;

    const categories = dataManager.getCategories();
    categorySelect.innerHTML = 
        `<option value="">ক্যাটাগরি নির্বাচন করুন</option>` +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join("");
}

// Open Add Product Modal
function openAddProductModal() {
    currentEditingProduct = null; // Reset for new product
    const form = document.getElementById("product-form");
    if (form) form.reset(); // Clear form fields
    loadCategoriesForSelect(); // Load categories for the dropdown
    openModal("product-modal");
}

// Save product
function saveProduct(event) {
    event.preventDefault(); // Prevent default form submission
    const form = document.getElementById("product-form");
    if (!form) return;

    // Get form data
    const productData = {
        name: document.getElementById("product-name").value.trim(),
        sku: document.getElementById("product-sku").value.trim(),
        category: document.getElementById("product-category").value,
        price: parseFloat(document.getElementById("product-price").value) || 0,
        stock: parseInt(document.getElementById("product-stock").value) || 0,
        description: document.getElementById("product-description").value.trim()
    };

    // Validate required fields
    if (!productData.name) {
        showNotification("পণ্যের নাম প্রয়োজন", "error");
        soundManager.playError();
        return;
    }

    if (!productData.sku) {
        showNotification("SKU প্রয়োজন", "error");
        soundManager.playError();
        return;
    }

    if (!productData.category) {
        showNotification("ক্যাটাগরি নির্বাচন করুন", "error");
        soundManager.playError();
        return;
    }

    if (productData.price <= 0) {
        showNotification("সঠিক মূল্য দিন", "error");
        soundManager.playError();
        return;
    }

    if (productData.stock < 0) {
        showNotification("স্টক ০ বা তার বেশি হতে হবে", "error");
        soundManager.playError();
        return;
    }

    // Check for duplicate SKU
    const existingProduct = dataManager.getProductBySku(productData.sku);
    if (existingProduct && (!currentEditingProduct || existingProduct.id !== currentEditingProduct)) {
        showNotification("এই SKU ইতিমধ্যে ব্যবহৃত হয়েছে", "error");
        soundManager.playError();
        return;
    }

    // Save or update product
    let success = false;
    if (currentEditingProduct) {
        // Update existing product
        success = dataManager.updateProduct(currentEditingProduct, productData);
        if (success) {
            showNotification("পণ্য সফলভাবে আপডেট হয়েছে", "success");
        }
    } else {
        // Add new product
        success = dataManager.addProduct(productData);
        if (success) {
            showNotification("নতুন পণ্য যোগ হয়েছে", "success");
        }
    }

    if (success) {
        soundManager.playSuccess();
        closeModal();
        loadProductsTable();
        
        // Reload products in sales page if it's currently active
        if (currentPage === "sales") {
            loadProducts();
        }
    } else {
        showNotification("পণ্য সংরক্ষণে ব্যর্থ", "error");
        soundManager.playError();
    }
}

// Edit product
function editProduct(productId) {
    const product = dataManager.getProductById(productId);
    if (!product) {
        showNotification("পণ্য পাওয়া যায়নি", "error");
        soundManager.playError();
        return;
    }

    // Set current editing product
    currentEditingProduct = productId;

    // Fill form with product data
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-sku").value = product.sku;
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-stock").value = product.stock;
    document.getElementById("product-description").value = product.description || "";

    // Open modal
    openModal("product-modal");
}

// Delete product
function deleteProduct(productId) {
    const product = dataManager.getProductById(productId);
    if (!product) {
        showNotification("পণ্য পাওয়া যায়নি", "error");
        soundManager.playError();
        return;
    }

    // Check if product is in any sales
    const sales = dataManager.getSales();
    const productInSales = sales.some(sale => 
        sale.items.some(item => item.productId === productId)
    );

    let confirmMessage = `আপনি কি "${product.name}" পণ্যটি মুছে ফেলতে চান?`;
    if (productInSales) {
        confirmMessage += "\n\nসতর্কতা: এই পণ্যটি পূর্বের বিক্রয়ে ব্যবহৃত হয়েছে।";
    }

    if (confirm(confirmMessage)) {
        if (dataManager.deleteProduct(productId)) {
            showNotification("পণ্য মুছে ফেলা হয়েছে", "success");
            soundManager.playSuccess();
            loadProductsTable();
            
            // Reload products in sales page if it's currently active
            if (currentPage === "sales") {
                loadProducts();
            }
        } else {
            showNotification("পণ্য মুছতে ব্যর্থ", "error");
            soundManager.playError();
        }
    }
}

// Generate SKU
function generateSKU() {
    const name = document.getElementById("product-name").value.trim();
    const category = document.getElementById("product-category").value;
    
    if (!name || !category) {
        showNotification("প্রথমে পণ্যের নাম এবং ক্যাটাগরি দিন", "error");
        return;
    }

    // Generate SKU based on category and name
    const categoryCode = category.substring(0, 3).toUpperCase();
    const nameCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    const sku = `${categoryCode}-${nameCode}-${randomCode}`;
    document.getElementById("product-sku").value = sku;
    
    soundManager.playClick();
}

// Import products from CSV
function importProducts() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const csv = e.target.result;
            parseAndImportProducts(csv);
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Parse and import products from CSV
function parseAndImportProducts(csv) {
    try {
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        
        // Expected headers: name, sku, category, price, stock, description
        const requiredHeaders = ["name", "sku", "category", "price", "stock"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            showNotification(`অনুপস্থিত কলাম: ${missingHeaders.join(", ")}`, "error");
            return;
        }

        const products = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(",").map(v => v.trim());
            const product = {};

            headers.forEach((header, index) => {
                product[header] = values[index] || "";
            });

            // Validate and convert data types
            if (!product.name || !product.sku || !product.category) {
                errorCount++;
                continue;
            }

            product.price = parseFloat(product.price) || 0;
            product.stock = parseInt(product.stock) || 0;

            if (product.price <= 0) {
                errorCount++;
                continue;
            }

            // Check for duplicate SKU
            if (dataManager.getProductBySku(product.sku)) {
                errorCount++;
                continue;
            }

            if (dataManager.addProduct(product)) {
                successCount++;
            } else {
                errorCount++;
            }
        }

        showNotification(`${successCount}টি পণ্য যোগ হয়েছে, ${errorCount}টি ত্রুটি`, "success");
        loadProductsTable();
        
    } catch (error) {
        console.error("Error importing products:", error);
        showNotification("পণ্য ইমপোর্ট করতে ব্যর্থ", "error");
    }
}

// Export products to CSV
function exportProducts() {
    const products = dataManager.getProducts();
    
    if (products.length === 0) {
        showNotification("কোনো পণ্য নেই", "error");
        return;
    }

    // Create CSV content
    const headers = ["name", "sku", "category", "price", "stock", "description"];
    const csvContent = [
        headers.join(","),
        ...products.map(product => 
            headers.map(header => `"${product[header] || ""}"`).join(",")
        )
    ].join("\n");

    // Download file
    const filename = `products_${formatDate(new Date()).replace(/\//g, "-")}.csv`;
    downloadFile(csvContent, filename, "text/csv");
    
    showNotification("পণ্য তালিকা এক্সপোর্ট হয়েছে", "success");
}

// Bulk update stock
function bulkUpdateStock() {
    const products = dataManager.getProducts();
    
    if (products.length === 0) {
        showNotification("কোনো পণ্য নেই", "error");
        return;
    }

    const stockUpdate = prompt("সব পণ্যের স্টক কত করতে চান? (বর্তমান স্টকের সাথে যোগ হবে)");
    
    if (stockUpdate === null) return;
    
    const updateAmount = parseInt(stockUpdate);
    
    if (isNaN(updateAmount)) {
        showNotification("সঠিক সংখ্যা দিন", "error");
        return;
    }

    let updatedCount = 0;
    
    products.forEach(product => {
        const newStock = Math.max(0, product.stock + updateAmount);
        if (dataManager.updateProduct(product.id, { stock: newStock })) {
            updatedCount++;
        }
    });

    showNotification(`${updatedCount}টি পণ্যের স্টক আপডেট হয়েছে`, "success");
    loadProductsTable();
}

// Search products in table
function searchProductsTable() {
    const searchTerm = document.getElementById("product-search-table").value.toLowerCase();
    const tableRows = document.querySelectorAll("#products-table-body tr");
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

// Filter products by category in table
function filterProductsTableByCategory() {
    const category = document.getElementById("product-category-filter").value;
    const products = category === "all" ? 
        dataManager.getProducts() : 
        dataManager.getProductsByCategory(category);
    
    const tableBody = document.getElementById("products-table-body");
    if (!tableBody) return;

    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <h3>এই ক্যাটাগরিতে কোনো পণ্য নেই</h3>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.sku}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge ${product.stock > 0 ? "status-active" : "status-inactive"}">
                    ${product.stock > 0 ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </span>
                ${product.stock <= 10 && product.stock > 0 ? 
                    "<span class="status-badge status-low-stock">কম স্টক</span>" : ""}
            </td>
            <td>
                <button class="action-btn" onclick="editProduct(\'${product.id}\')">সম্পাদনা</button>
                <button class="action-btn delete" onclick="deleteProduct(\'${product.id}\')">মুছুন</button>
            </td>
        </tr>
    `).join("");
}

console.log("Products module loaded");



