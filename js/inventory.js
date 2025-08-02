// Inventory Management Functions

// Load inventory data
function loadInventoryData() {
    loadInventoryStats();
    loadInventoryTable();
}

// Load inventory statistics
function loadInventoryStats() {
    const products = POS.getProducts({ active: true });
    const lowStockProducts = POS.data.getLowStockProducts();
    const outOfStockProducts = POS.data.getOutOfStockProducts();
    
    // Update stat cards
    document.getElementById('total-products').textContent = products.length;
    document.getElementById('low-stock-items').textContent = lowStockProducts.length;
    document.getElementById('out-of-stock-items').textContent = outOfStockProducts.length;
}

// Load inventory table
function loadInventoryTable() {
    const products = POS.getProducts({ active: true });
    const tableBody = document.querySelector('#inventory-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">কোনো পণ্য পাওয়া যায়নি</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = createInventoryTableRow(product);
        tableBody.appendChild(row);
    });
}

// Create inventory table row
function createInventoryTableRow(product) {
    const row = document.createElement('tr');
    
    const stockStatus = product.stock_quantity === 0 ? 'out-of-stock' : 
                       product.stock_quantity <= (product.min_stock_level || 0) ? 'low-stock' : 'in-stock';
    
    const stockStatusText = product.stock_quantity === 0 ? 'স্টক নেই' : 
                           product.stock_quantity <= (product.min_stock_level || 0) ? 'কম স্টক' : 'স্টক আছে';
    
    row.innerHTML = `
        <td>
            <div>
                <div class="font-bold">${product.name}</div>
                <div class="text-muted" style="font-size: 0.8rem;">SKU: ${product.sku || 'N/A'}</div>
            </div>
        </td>
        <td class="text-center">
            <span class="font-bold">${product.stock_quantity}</span>
            <div style="font-size: 0.8rem; color: #6b7280;">${product.unit}</div>
        </td>
        <td class="text-center">
            <span class="font-bold">${product.min_stock_level || 0}</span>
            <div style="font-size: 0.8rem; color: #6b7280;">${product.unit}</div>
        </td>
        <td class="text-center">
            <span class="status-badge ${stockStatus}">${stockStatusText}</span>
        </td>
        <td class="text-center">
            <div style="font-size: 0.8rem;">${formatDate(product.updated_date)}</div>
            <div style="font-size: 0.7rem; color: #6b7280;">${formatTime(product.updated_date)}</div>
        </td>
        <td>
            <div class="action-buttons-table">
                <button class="action-btn edit" onclick="adjustStock('${product.id}')" title="স্টক অ্যাডজাস্ট">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn view" onclick="viewStockHistory('${product.id}')" title="স্টক ইতিহাস">
                    <i class="fas fa-history"></i>
                </button>
                <button class="action-btn view" onclick="setMinStock('${product.id}')" title="মিনিমাম স্টক সেট">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Show stock adjustment modal
function showStockAdjustmentModal() {
    // Create a simple stock adjustment modal
    const modal = createStockAdjustmentModal();
    document.body.appendChild(modal);
    showModal('stock-adjustment-modal');
}

// Create stock adjustment modal
function createStockAdjustmentModal() {
    const modal = document.createElement('div');
    modal.id = 'stock-adjustment-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>স্টক অ্যাডজাস্টমেন্ট</h3>
                <span class="close" onclick="closeModal('stock-adjustment-modal')">&times;</span>
            </div>
            <form id="stock-adjustment-form">
                <div style="padding: 1.5rem;">
                    <div class="form-group">
                        <label>পণ্য নির্বাচন করুন:</label>
                        <select id="adjustment-product" required>
                            <option value="">পণ্য নির্বাচন করুন</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>বর্তমান স্টক:</label>
                            <input type="text" id="current-stock" readonly>
                        </div>
                        <div class="form-group">
                            <label>অ্যাডজাস্টমেন্ট টাইপ:</label>
                            <select id="adjustment-type" required>
                                <option value="add">স্টক যোগ করুন</option>
                                <option value="subtract">স্টক কমান</option>
                                <option value="set">স্টক সেট করুন</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>পরিমাণ:</label>
                        <input type="number" id="adjustment-quantity" min="0" step="1" required>
                    </div>
                    <div class="form-group">
                        <label>কারণ:</label>
                        <textarea id="adjustment-reason" rows="3" placeholder="অ্যাডজাস্টমেন্টের কারণ লিখুন"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('stock-adjustment-modal')">বাতিল</button>
                    <button type="submit" class="btn btn-primary">অ্যাডজাস্ট করুন</button>
                </div>
            </form>
        </div>
    `;
    
    // Setup form submission
    const form = modal.querySelector('#stock-adjustment-form');
    form.addEventListener('submit', handleStockAdjustment);
    
    // Setup product selection
    const productSelect = modal.querySelector('#adjustment-product');
    const products = POS.getProducts({ active: true });
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.stock_quantity} ${product.unit})`;
        productSelect.appendChild(option);
    });
    
    productSelect.addEventListener('change', function() {
        const productId = this.value;
        const currentStockInput = modal.querySelector('#current-stock');
        
        if (productId) {
            const product = POS.data.read('products', productId);
            currentStockInput.value = `${product.stock_quantity} ${product.unit}`;
        } else {
            currentStockInput.value = '';
        }
    });
    
    return modal;
}

// Handle stock adjustment
function handleStockAdjustment(e) {
    e.preventDefault();
    
    const productId = document.getElementById('adjustment-product').value;
    const adjustmentType = document.getElementById('adjustment-type').value;
    const quantity = parseNumber(document.getElementById('adjustment-quantity').value);
    const reason = document.getElementById('adjustment-reason').value;
    
    if (!productId || !adjustmentType || quantity < 0) {
        showToast('সব ক্ষেত্র সঠিকভাবে পূরণ করুন', 'error');
        return;
    }
    
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    showLoading();
    
    const success = POS.data.updateProductStock(productId, quantity, adjustmentType);
    
    hideLoading();
    
    if (success) {
        showToast('স্টক সফলভাবে অ্যাডজাস্ট করা হয়েছে', 'success');
        closeModal('stock-adjustment-modal');
        
        // Remove modal from DOM
        const modal = document.getElementById('stock-adjustment-modal');
        if (modal) {
            modal.remove();
        }
        
        // Reload inventory data
        loadInventoryData();
        
        // Reload products if on sales page
        if (currentPage === 'sales') {
            loadProducts();
        }
    } else {
        showToast('স্টক অ্যাডজাস্ট করতে সমস্যা হয়েছে', 'error');
    }
}

// Adjust stock for specific product
function adjustStock(productId) {
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    // Create and show modal
    const modal = createStockAdjustmentModal();
    document.body.appendChild(modal);
    
    // Pre-select the product
    const productSelect = modal.querySelector('#adjustment-product');
    productSelect.value = productId;
    productSelect.dispatchEvent(new Event('change'));
    productSelect.disabled = true;
    
    showModal('stock-adjustment-modal');
}

// View stock history for product
function viewStockHistory(productId) {
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    const transactions = POS.data.getInventoryTransactions({ product_id: productId });
    
    if (transactions.length === 0) {
        alert(`${product.name} এর কোনো স্টক ইতিহাস নেই।`);
        return;
    }
    
    let historyText = `${product.name} এর স্টক ইতিহাস:\n\n`;
    
    transactions.slice(0, 15).forEach((transaction, index) => {
        const typeText = transaction.transaction_type === 'in' ? 'স্টক ইন' : 
                        transaction.transaction_type === 'out' ? 'স্টক আউট' : 'অ্যাডজাস্টমেন্ট';
        
        historyText += `${index + 1}. ${typeText}: ${transaction.quantity} ${product.unit}\n`;
        historyText += `   তারিখ: ${formatDate(transaction.date)}\n`;
        historyText += `   রেফারেন্স: ${transaction.reference_type}\n`;
        if (transaction.notes) {
            historyText += `   নোট: ${transaction.notes}\n`;
        }
        historyText += '\n';
    });
    
    if (transactions.length > 15) {
        historyText += `... এবং আরো ${transactions.length - 15}টি লেনদেন`;
    }
    
    alert(historyText);
}

// Set minimum stock level
function setMinStock(productId) {
    const product = POS.data.read('products', productId);
    if (!product) {
        showToast('পণ্য পাওয়া যায়নি', 'error');
        return;
    }
    
    const currentMinStock = product.min_stock_level || 0;
    const newMinStock = prompt(`${product.name} এর জন্য মিনিমাম স্টক লেভেল সেট করুন:\n\nবর্তমান: ${currentMinStock} ${product.unit}`, currentMinStock);
    
    if (newMinStock !== null) {
        const minStockLevel = parseNumber(newMinStock);
        
        if (minStockLevel < 0) {
            showToast('মিনিমাম স্টক লেভেল ০ বা তার বেশি হতে হবে', 'error');
            return;
        }
        
        showLoading();
        
        const updated = POS.data.update('products', productId, { min_stock_level: minStockLevel });
        
        hideLoading();
        
        if (updated) {
            showToast('মিনিমাম স্টক লেভেল আপডেট করা হয়েছে', 'success');
            loadInventoryData();
        } else {
            showToast('মিনিমাম স্টক লেভেল আপডেট করতে সমস্যা হয়েছে', 'error');
        }
    }
}

// Generate low stock alert
function generateLowStockAlert() {
    const lowStockProducts = POS.data.getLowStockProducts();
    
    if (lowStockProducts.length === 0) {
        showToast('সব পণ্যের স্টক পর্যাপ্ত আছে', 'success');
        return;
    }
    
    let alertText = `${lowStockProducts.length}টি পণ্যের স্টক কম:\n\n`;
    
    lowStockProducts.forEach((product, index) => {
        alertText += `${index + 1}. ${product.name}: ${product.stock_quantity} ${product.unit} (মিনিমাম: ${product.min_stock_level || 0})\n`;
    });
    
    alert(alertText);
}

// Export inventory report
function exportInventoryReport() {
    const products = POS.getProducts({ active: true });
    const reportData = products.map(product => ({
        'পণ্যের নাম': product.name,
        'SKU': product.sku || '',
        'ক্যাটাগরি': getCategoryName(product.category),
        'বর্তমান স্টক': product.stock_quantity,
        'ইউনিট': product.unit,
        'মিনিমাম স্টক': product.min_stock_level || 0,
        'বিক্রয় মূল্য': product.selling_price,
        'স্টক ভ্যালু': product.stock_quantity * product.purchase_price,
        'স্ট্যাটাস': product.stock_quantity === 0 ? 'স্টক নেই' : 
                   product.stock_quantity <= (product.min_stock_level || 0) ? 'কম স্টক' : 'স্টক আছে'
    }));
    
    const filename = `inventory_report_${new Date().toISOString().split('T')[0]}.json`;
    exportToJSON(reportData, filename);
    showToast('ইনভেন্টরি রিপোর্ট এক্সপোর্ট করা হয়েছে', 'success');
}

// Setup inventory filters
function setupInventoryFilters() {
    const inventoryFilter = document.getElementById('inventory-filter');
    
    if (inventoryFilter) {
        const debouncedFilter = debounce(function() {
            filterInventoryTable();
        }, 300);
        
        inventoryFilter.addEventListener('input', debouncedFilter);
    }
}

// Filter inventory table
function filterInventoryTable() {
    const searchTerm = document.getElementById('inventory-filter')?.value || '';
    
    const filters = { active: true };
    if (searchTerm) filters.search = searchTerm;
    
    const products = POS.getProducts(filters);
    const tableBody = document.querySelector('#inventory-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">কোনো পণ্য পাওয়া যায়নি</td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = createInventoryTableRow(product);
        tableBody.appendChild(row);
    });
}

// Bulk stock operations
function bulkStockUpdate() {
    const csvData = prompt('CSV ফরম্যাটে স্টক আপডেট করুন (SKU,Quantity):\n\nউদাহরণ:\nTEA001,50\nCOFFEE001,30');
    
    if (!csvData) return;
    
    const lines = csvData.trim().split('\n');
    let successCount = 0;
    let errorCount = 0;
    
    showLoading();
    
    lines.forEach(line => {
        const [sku, quantity] = line.split(',');
        if (sku && quantity) {
            const products = POS.getProducts();
            const product = products.find(p => p.sku === sku.trim());
            
            if (product) {
                const success = POS.data.updateProductStock(product.id, parseNumber(quantity), 'set');
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } else {
                errorCount++;
            }
        }
    });
    
    hideLoading();
    
    showToast(`${successCount}টি পণ্য আপডেট হয়েছে, ${errorCount}টি ত্রুটি`, successCount > 0 ? 'success' : 'error');
    
    if (successCount > 0) {
        loadInventoryData();
        if (currentPage === 'sales') {
            loadProducts();
        }
    }
}

// Initialize inventory management
document.addEventListener('DOMContentLoaded', function() {
    setupInventoryFilters();
});

// Global functions for HTML onclick events
window.showStockAdjustmentModal = showStockAdjustmentModal;
window.adjustStock = adjustStock;
window.viewStockHistory = viewStockHistory;
window.setMinStock = setMinStock;
window.generateLowStockAlert = generateLowStockAlert;
window.exportInventoryReport = exportInventoryReport;
window.bulkStockUpdate = bulkStockUpdate;

