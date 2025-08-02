// Reports Management Functions

// Generate reports based on date range
function generateReports() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        showToast('শুরু এবং শেষের তারিখ নির্বাচন করুন', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('শুরুর তারিখ শেষের তারিখের আগে হতে হবে', 'error');
        return;
    }
    
    showLoading();
    
    try {
        generateSalesSummary(startDate, endDate);
        generateTopProducts(startDate, endDate);
        generatePaymentMethodsReport(startDate, endDate);
        
        hideLoading();
        showToast('রিপোর্ট সফলভাবে তৈরি হয়েছে', 'success');
    } catch (error) {
        hideLoading();
        showToast('রিপোর্ট তৈরি করতে সমস্যা হয়েছে', 'error');
        console.error('Report generation error:', error);
    }
}

// Generate sales summary report
function generateSalesSummary(startDate, endDate) {
    const salesReport = POS.data.getSalesReport(startDate, endDate);
    const salesSummaryContainer = document.getElementById('sales-summary');
    
    if (!salesSummaryContainer) return;
    
    const totalProfit = calculateTotalProfit(startDate, endDate);
    const averageSale = salesReport.total_sales > 0 ? salesReport.total_revenue / salesReport.total_sales : 0;
    
    salesSummaryContainer.innerHTML = `
        <div class="report-stats">
            <div class="stat-item">
                <div class="stat-value">${salesReport.total_sales}</div>
                <div class="stat-label">মোট বিক্রয়</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(salesReport.total_revenue)}</div>
                <div class="stat-label">মোট আয়</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(totalProfit)}</div>
                <div class="stat-label">মোট লাভ</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(averageSale)}</div>
                <div class="stat-label">গড় বিক্রয়</div>
            </div>
        </div>
        
        <div class="report-details">
            <h4>বিস্তারিত তথ্য</h4>
            <table class="report-table">
                <tr>
                    <td>মোট ডিসকাউন্ট:</td>
                    <td class="text-right">${formatCurrency(salesReport.total_discount)}</td>
                </tr>
                <tr>
                    <td>মোট ট্যাক্স:</td>
                    <td class="text-right">${formatCurrency(salesReport.total_tax)}</td>
                </tr>
                <tr>
                    <td>গড় ডিসকাউন্ট:</td>
                    <td class="text-right">${formatCurrency(salesReport.total_sales > 0 ? salesReport.total_discount / salesReport.total_sales : 0)}</td>
                </tr>
            </table>
        </div>
        
        <div class="daily-sales">
            <h4>দৈনিক বিক্রয়</h4>
            <div class="daily-sales-chart">
                ${generateDailySalesChart(salesReport.daily_sales)}
            </div>
        </div>
    `;
}

// Calculate total profit
function calculateTotalProfit(startDate, endDate) {
    const sales = POS.getSales({ start_date: startDate, end_date: endDate });
    let totalProfit = 0;
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = POS.data.read('products', item.product_id);
            if (product) {
                const profit = (item.unit_price - product.purchase_price) * item.quantity;
                totalProfit += profit;
            }
        });
    });
    
    return totalProfit;
}

// Generate daily sales chart (simple text-based)
function generateDailySalesChart(dailySales) {
    if (Object.keys(dailySales).length === 0) {
        return '<p class="text-center text-muted">কোনো বিক্রয় ডেটা নেই</p>';
    }
    
    let chartHTML = '<div class="simple-chart">';
    
    Object.entries(dailySales).forEach(([date, data]) => {
        const formattedDate = formatDate(new Date(date));
        chartHTML += `
            <div class="chart-row">
                <div class="chart-label">${formattedDate}</div>
                <div class="chart-bar">
                    <div class="chart-value">${data.count} বিক্রয়</div>
                    <div class="chart-amount">${formatCurrency(data.amount)}</div>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    return chartHTML;
}

// Generate top products report
function generateTopProducts(startDate, endDate) {
    const topProducts = POS.data.getTopProducts(startDate, endDate, 10);
    const topProductsContainer = document.getElementById('top-products');
    
    if (!topProductsContainer) return;
    
    if (topProducts.length === 0) {
        topProductsContainer.innerHTML = '<p class="text-center text-muted">কোনো বিক্রয় ডেটা নেই</p>';
        return;
    }
    
    let tableHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>র‍্যাঙ্ক</th>
                    <th>পণ্যের নাম</th>
                    <th>বিক্রিত পরিমাণ</th>
                    <th>মোট আয়</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    topProducts.forEach((product, index) => {
        tableHTML += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${product.product_name}</td>
                <td class="text-center">${product.quantity_sold}</td>
                <td class="text-right">${formatCurrency(product.total_revenue)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    topProductsContainer.innerHTML = tableHTML;
}

// Generate payment methods report
function generatePaymentMethodsReport(startDate, endDate) {
    const salesReport = POS.data.getSalesReport(startDate, endDate);
    const paymentMethodsContainer = document.getElementById('payment-methods');
    
    if (!paymentMethodsContainer) return;
    
    if (Object.keys(salesReport.payment_methods).length === 0) {
        paymentMethodsContainer.innerHTML = '<p class="text-center text-muted">কোনো পেমেন্ট ডেটা নেই</p>';
        return;
    }
    
    let chartHTML = '<div class="payment-methods-chart">';
    
    Object.entries(salesReport.payment_methods).forEach(([method, data]) => {
        const methodName = getPaymentMethodName(method);
        const percentage = salesReport.total_revenue > 0 ? (data.amount / salesReport.total_revenue * 100).toFixed(1) : 0;
        
        chartHTML += `
            <div class="payment-method-item">
                <div class="payment-method-info">
                    <div class="payment-method-name">${methodName}</div>
                    <div class="payment-method-stats">
                        <span>${data.count} লেনদেন</span>
                        <span>${formatCurrency(data.amount)}</span>
                        <span>(${percentage}%)</span>
                    </div>
                </div>
                <div class="payment-method-bar">
                    <div class="payment-method-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    paymentMethodsContainer.innerHTML = chartHTML;
}

// Get payment method name in Bengali
function getPaymentMethodName(method) {
    const methodNames = {
        'cash': 'নগদ',
        'card': 'কার্ড',
        'mobile': 'মোবাইল পেমেন্ট',
        'bank': 'ব্যাংক ট্রান্সফার',
        'check': 'চেক'
    };
    return methodNames[method] || method;
}

// Export sales report
function exportSalesReport() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        showToast('শুরু এবং শেষের তারিখ নির্বাচন করুন', 'warning');
        return;
    }
    
    const sales = POS.getSales({ start_date: startDate, end_date: endDate });
    const reportData = sales.map(sale => ({
        'ইনভয়েস নং': sale.invoice_number,
        'তারিখ': formatDate(sale.sale_date),
        'সময়': formatTime(sale.sale_date),
        'গ্রাহক': sale.customer_id ? POS.data.read('customers', sale.customer_id)?.name || 'অজানা' : 'ওয়াক-ইন',
        'সাবটোটাল': sale.subtotal,
        'ডিসকাউন্ট': sale.total_discount,
        'ট্যাক্স': sale.total_tax,
        'মোট': sale.grand_total,
        'পেমেন্ট পদ্ধতি': getPaymentMethodName(sale.payment_method),
        'পেমেন্ট স্ট্যাটাস': sale.payment_status === 'paid' ? 'পরিশোধিত' : sale.payment_status === 'partial' ? 'আংশিক' : 'অপরিশোধিত',
        'প্রদত্ত': sale.paid_amount,
        'বাকি': sale.due_amount
    }));
    
    const filename = `sales_report_${startDate}_to_${endDate}.json`;
    exportToJSON(reportData, filename);
    showToast('বিক্রয় রিপোর্ট এক্সপোর্ট করা হয়েছে', 'success');
}

// Generate profit/loss report
function generateProfitLossReport() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        showToast('শুরু এবং শেষের তারিখ নির্বাচন করুন', 'warning');
        return;
    }
    
    const sales = POS.getSales({ start_date: startDate, end_date: endDate });
    let totalRevenue = 0;
    let totalCost = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    
    sales.forEach(sale => {
        totalRevenue += sale.grand_total;
        totalTax += sale.total_tax;
        totalDiscount += sale.total_discount;
        
        sale.items.forEach(item => {
            const product = POS.data.read('products', item.product_id);
            if (product) {
                totalCost += product.purchase_price * item.quantity;
            }
        });
    });
    
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalTax;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(2) : 0;
    
    const reportHTML = `
        <div class="profit-loss-report">
            <h3>লাভ-ক্ষতির হিসাব</h3>
            <p><strong>সময়কাল:</strong> ${formatDate(startDate)} থেকে ${formatDate(endDate)}</p>
            
            <table class="report-table">
                <tr>
                    <td>মোট আয়:</td>
                    <td class="text-right font-bold">${formatCurrency(totalRevenue)}</td>
                </tr>
                <tr>
                    <td>মোট খরচ:</td>
                    <td class="text-right">${formatCurrency(totalCost)}</td>
                </tr>
                <tr>
                    <td>মোট ডিসকাউন্ট:</td>
                    <td class="text-right">${formatCurrency(totalDiscount)}</td>
                </tr>
                <tr>
                    <td>মোট ট্যাক্স:</td>
                    <td class="text-right">${formatCurrency(totalTax)}</td>
                </tr>
                <tr class="border-top">
                    <td><strong>গ্রস প্রফিট:</strong></td>
                    <td class="text-right font-bold ${grossProfit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(grossProfit)}</td>
                </tr>
                <tr>
                    <td><strong>নেট প্রফিট:</strong></td>
                    <td class="text-right font-bold ${netProfit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(netProfit)}</td>
                </tr>
                <tr>
                    <td><strong>প্রফিট মার্জিন:</strong></td>
                    <td class="text-right font-bold">${profitMargin}%</td>
                </tr>
            </table>
        </div>
    `;
    
    // Show in a modal or alert
    alert(reportHTML.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n'));
}

// Generate customer report
function generateCustomerReport() {
    const customers = POS.getCustomers();
    const sales = POS.getSales();
    
    const customerStats = customers.map(customer => {
        const customerSales = sales.filter(sale => sale.customer_id === customer.id);
        const totalPurchases = customerSales.reduce((sum, sale) => sum + sale.grand_total, 0);
        const totalOrders = customerSales.length;
        const averageOrder = totalOrders > 0 ? totalPurchases / totalOrders : 0;
        const lastPurchase = customerSales.length > 0 ? customerSales[0].sale_date : null;
        
        return {
            name: customer.name,
            phone: customer.phone,
            totalPurchases,
            totalOrders,
            averageOrder,
            currentBalance: customer.current_balance,
            loyaltyPoints: customer.loyalty_points || 0,
            lastPurchase
        };
    });
    
    // Sort by total purchases
    customerStats.sort((a, b) => b.totalPurchases - a.totalPurchases);
    
    const reportData = customerStats.map((customer, index) => ({
        'র‍্যাঙ্ক': index + 1,
        'নাম': customer.name,
        'ফোন': customer.phone,
        'মোট ক্রয়': formatCurrency(customer.totalPurchases),
        'মোট অর্ডার': customer.totalOrders,
        'গড় অর্ডার': formatCurrency(customer.averageOrder),
        'বর্তমান ব্যালেন্স': formatCurrency(customer.currentBalance),
        'লয়ালটি পয়েন্ট': customer.loyaltyPoints,
        'শেষ ক্রয়': customer.lastPurchase ? formatDate(customer.lastPurchase) : 'কোনো ক্রয় নেই'
    }));
    
    const filename = `customer_report_${new Date().toISOString().split('T')[0]}.json`;
    exportToJSON(reportData, filename);
    showToast('গ্রাহক রিপোর্ট এক্সপোর্ট করা হয়েছে', 'success');
}

// Set default date range (last 30 days)
function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.value = startDate.toISOString().split('T')[0];
        endDateInput.value = endDate.toISOString().split('T')[0];
    }
}

// Quick date range selectors
function setDateRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    
    generateReports();
}

// Initialize reports page
function initializeReportsPage() {
    setDefaultDateRange();
    
    // Add quick date range buttons
    const dateRangeContainer = document.querySelector('.date-range');
    if (dateRangeContainer) {
        const quickButtons = document.createElement('div');
        quickButtons.className = 'quick-date-buttons';
        quickButtons.style.marginLeft = '1rem';
        
        quickButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="setDateRange(7)" style="margin-right: 0.5rem;">৭ দিন</button>
            <button class="btn btn-secondary" onclick="setDateRange(30)" style="margin-right: 0.5rem;">৩০ দিন</button>
            <button class="btn btn-secondary" onclick="setDateRange(90)">৯০ দিন</button>
        `;
        
        dateRangeContainer.appendChild(quickButtons);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize reports page if we're on it
    if (document.getElementById('reports-page')) {
        initializeReportsPage();
    }
});

// Global functions for HTML onclick events
window.generateReports = generateReports;
window.exportSalesReport = exportSalesReport;
window.generateProfitLossReport = generateProfitLossReport;
window.generateCustomerReport = generateCustomerReport;
window.setDateRange = setDateRange;

