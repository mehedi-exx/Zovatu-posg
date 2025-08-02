// Reports Management Module

// Load reports page
function loadReportsPage() {
    loadSalesOverview();
    loadTopProducts();
    loadRecentSales();
    updateReportCards();
}

// Update report cards
function updateReportCards() {
    // Today's sales
    const todaysSales = dataManager.getTodaysSalesTotal();
    const todaysSalesElement = document.getElementById("todays-sales");
    if (todaysSalesElement) {
        todaysSalesElement.textContent = formatCurrency(todaysSales);
    }

    // This month's sales
    const monthSales = dataManager.getThisMonthsSalesTotal();
    const monthSalesElement = document.getElementById("month-sales");
    if (monthSalesElement) {
        monthSalesElement.textContent = formatCurrency(monthSales);
    }

    // Total products
    const totalProducts = dataManager.getTotalProducts();
    const totalProductsElement = document.getElementById("total-products");
    if (totalProductsElement) {
        totalProductsElement.textContent = totalProducts;
    }

    // Total customers
    const totalCustomers = dataManager.getTotalCustomers();
    const totalCustomersElement = document.getElementById("total-customers");
    if (totalCustomersElement) {
        totalCustomersElement.textContent = totalCustomers;
    }

    // Low stock products count
    const lowStockCount = dataManager.getLowStockProducts(10).length;
    const lowStockElement = document.getElementById("low-stock-count");
    if (lowStockElement) {
        lowStockElement.textContent = lowStockCount;
    }

    // Total sales
    const totalSales = dataManager.getTotalSales();
    const totalSalesElement = document.getElementById("total-sales");
    if (totalSalesElement) {
        totalSalesElement.textContent = formatCurrency(totalSales);
    }
}

// Load sales overview
function loadSalesOverview() {
    const sales = dataManager.getSales();
    const last30Days = getLast30DaysData(sales);
    
    // Create simple chart data
    const chartContainer = document.getElementById("sales-chart");
    if (chartContainer) {
        chartContainer.innerHTML = createSimpleChart(last30Days);
    }
}

// Get last 30 days data
function getLast30DaysData(sales) {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayStart = getStartOfDay(date);
        const dayEnd = getEndOfDay(date);
        
        const daySales = sales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate >= dayStart && saleDate <= dayEnd;
        });
        
        const totalAmount = daySales.reduce((sum, sale) => sum + sale.total, 0);
        
        data.push({
            date: formatDate(date),
            amount: totalAmount,
            count: daySales.length
        });
    }
    
    return data;
}

// Create simple chart
function createSimpleChart(data) {
    const maxAmount = Math.max(...data.map(d => d.amount));
    const chartHeight = 200;
    
    if (maxAmount === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>কোনো বিক্রয় ডেটা নেই</h3>
                <p>গত ৩০ দিনে কোনো বিক্রয় হয়নি</p>
            </div>
        `;
    }
    
    const bars = data.map((item, index) => {
        const height = maxAmount > 0 ? (item.amount / maxAmount) * chartHeight : 0;
        const isToday = index === data.length - 1;
        
        return `
            <div class="chart-bar ${isToday ? 'today' : ''}" 
                 style="height: ${height}px;" 
                 title="${item.date}: ${formatCurrency(item.amount)} (${item.count} বিক্রয়)">
                <div class="bar-value">${item.count}</div>
            </div>
        `;
    }).join("");
    
    return `
        <div class="chart-container">
            <div class="chart-title">গত ৩০ দিনের বিক্রয়</div>
            <div class="chart-bars">${bars}</div>
            <div class="chart-legend">
                <span class="legend-item">
                    <span class="legend-color today"></span>
                    আজ
                </span>
                <span class="legend-item">
                    <span class="legend-color"></span>
                    পূর্ববর্তী দিন
                </span>
            </div>
        </div>
    `;
}

// Load top products
function loadTopProducts() {
    const topProducts = dataManager.getTopSellingProducts(10);
    const container = document.getElementById("top-products");
    
    if (!container) return;
    
    if (topProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <h3>কোনো বিক্রয় ডেটা নেই</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = topProducts.map((item, index) => `
        <div class="top-product-item">
            <div class="rank">#${index + 1}</div>
            <div class="product-info">
                <div class="product-name">${item.productName}</div>
                <div class="product-stats">
                    বিক্রয়: ${item.quantity} টি | আয়: ${formatCurrency(item.revenue)}
                </div>
            </div>
        </div>
    `).join("");
}

// Load recent sales
function loadRecentSales() {
    const sales = dataManager.getSales().slice(-10).reverse(); // Last 10 sales
    const tableBody = document.getElementById("recent-sales-body");
    
    if (!tableBody) return;
    
    if (sales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">🛒</div>
                        <h3>কোনো বিক্রয় নেই</h3>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = sales.map(sale => {
        const customer = sale.customerId ? dataManager.getCustomerById(sale.customerId) : null;
        return `
            <tr>
                <td>${formatDate(sale.createdAt)} ${formatTime(sale.createdAt)}</td>
                <td>${sale.items.length} টি পণ্য</td>
                <td>${customer ? customer.name : 'অজানা গ্রাহক'}</td>
                <td>${formatCurrency(sale.total)}</td>
                <td>
                    <span class="payment-method ${sale.paymentMethod}">
                        ${getPaymentMethodName(sale.paymentMethod)}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

// Get payment method name
function getPaymentMethodName(method) {
    const methods = {
        'cash': 'নগদ',
        'card': 'কার্ড',
        'mobile': 'মোবাইল পেমেন্ট'
    };
    return methods[method] || method;
}

// Generate custom report
function generateCustomReport() {
    const startDate = document.getElementById("report-start-date").value;
    const endDate = document.getElementById("report-end-date").value;
    const reportType = document.getElementById("report-type").value;
    
    if (!startDate || !endDate) {
        showNotification("তারিখ নির্বাচন করুন", "error");
        soundManager.playError();
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification("শুরুর তারিখ শেষের তারিখের আগে হতে হবে", "error");
        soundManager.playError();
        return;
    }
    
    const sales = dataManager.getSalesByDateRange(startDate, endDate + "T23:59:59");
    
    switch (reportType) {
        case "sales":
            generateSalesReport(sales, startDate, endDate);
            break;
        case "products":
            generateProductsReport(sales, startDate, endDate);
            break;
        case "customers":
            generateCustomersReport(sales, startDate, endDate);
            break;
        case "inventory":
            generateInventoryReport(startDate, endDate);
            break;
    }
}

// Generate sales report
function generateSalesReport(sales, startDate, endDate) {
    if (sales.length === 0) {
        showNotification("নির্বাচিত সময়ে কোনো বিক্রয় নেই", "error");
        return;
    }
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);
    const averageSale = totalSales / sales.length;
    
    // Group by payment method
    const paymentMethods = groupBy(sales, "paymentMethod");
    
    // Create CSV content
    const headers = ["Date", "Time", "Items", "Customer", "Total", "Payment Method"];
    const csvContent = [
        `Sales Report (${startDate} to ${endDate})`,
        `Total Sales: ${formatCurrency(totalSales)}`,
        `Total Transactions: ${sales.length}`,
        `Total Items Sold: ${totalItems}`,
        `Average Sale: ${formatCurrency(averageSale)}`,
        "",
        headers.join(","),
        ...sales.map(sale => {
            const customer = sale.customerId ? dataManager.getCustomerById(sale.customerId) : null;
            return [
                formatDate(sale.createdAt),
                formatTime(sale.createdAt),
                sale.items.length,
                customer ? customer.name : "Walk-in Customer",
                sale.total.toFixed(2),
                getPaymentMethodName(sale.paymentMethod)
            ].join(",");
        })
    ].join("\n");
    
    // Download file
    const filename = `sales_report_${startDate}_to_${endDate}.csv`;
    downloadFile(csvContent, filename, "text/csv");
    
    showNotification("বিক্রয় রিপোর্ট তৈরি হয়েছে", "success");
    soundManager.playSuccess();
}

// Generate products report
function generateProductsReport(sales, startDate, endDate) {
    const productSales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (productSales[item.productId]) {
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.total;
            } else {
                productSales[item.productId] = {
                    name: item.name,
                    quantity: item.quantity,
                    revenue: item.total
                };
            }
        });
    });
    
    const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity);
    
    if (sortedProducts.length === 0) {
        showNotification("নির্বাচিত সময়ে কোনো পণ্য বিক্রয় নেই", "error");
        return;
    }
    
    // Create CSV content
    const headers = ["Product Name", "Quantity Sold", "Revenue"];
    const csvContent = [
        `Products Report (${startDate} to ${endDate})`,
        "",
        headers.join(","),
        ...sortedProducts.map(product => [
            `"${product.name}"`,
            product.quantity,
            product.revenue.toFixed(2)
        ].join(","))
    ].join("\n");
    
    // Download file
    const filename = `products_report_${startDate}_to_${endDate}.csv`;
    downloadFile(csvContent, filename, "text/csv");
    
    showNotification("পণ্য রিপোর্ট তৈরি হয়েছে", "success");
    soundManager.playSuccess();
}

// Generate customers report
function generateCustomersReport(sales, startDate, endDate) {
    const customerSales = {};
    
    sales.forEach(sale => {
        if (sale.customerId) {
            if (customerSales[sale.customerId]) {
                customerSales[sale.customerId].totalSales += sale.total;
                customerSales[sale.customerId].transactionCount += 1;
            } else {
                const customer = dataManager.getCustomerById(sale.customerId);
                customerSales[sale.customerId] = {
                    name: customer ? customer.name : "Unknown",
                    phone: customer ? customer.phone : "N/A",
                    totalSales: sale.total,
                    transactionCount: 1
                };
            }
        }
    });
    
    const sortedCustomers = Object.values(customerSales)
        .sort((a, b) => b.totalSales - a.totalSales);
    
    if (sortedCustomers.length === 0) {
        showNotification("নির্বাচিত সময়ে কোনো গ্রাহক বিক্রয় নেই", "error");
        return;
    }
    
    // Create CSV content
    const headers = ["Customer Name", "Phone", "Total Sales", "Transactions"];
    const csvContent = [
        `Customers Report (${startDate} to ${endDate})`,
        "",
        headers.join(","),
        ...sortedCustomers.map(customer => [
            `"${customer.name}"`,
            `"${customer.phone}"`,
            customer.totalSales.toFixed(2),
            customer.transactionCount
        ].join(","))
    ].join("\n");
    
    // Download file
    const filename = `customers_report_${startDate}_to_${endDate}.csv`;
    downloadFile(csvContent, filename, "text/csv");
    
    showNotification("গ্রাহক রিপোর্ট তৈরি হয়েছে", "success");
    soundManager.playSuccess();
}

// Generate inventory report
function generateInventoryReport(startDate, endDate) {
    const products = dataManager.getProducts();
    
    if (products.length === 0) {
        showNotification("কোনো পণ্য নেই", "error");
        return;
    }
    
    // Create CSV content
    const headers = ["Product Name", "SKU", "Category", "Current Stock", "Stock Value", "Status"];
    const csvContent = [
        `Inventory Report (${formatDate(new Date())})`,
        "",
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
    
    showNotification("ইনভেন্টরি রিপোর্ট তৈরি হয়েছে", "success");
    soundManager.playSuccess();
}

// Print report
function printReport() {
    window.print();
}

console.log("Reports module loaded");

