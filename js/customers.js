// Customer Management Functions

// Load customers table
function loadCustomersTable() {
    const customers = POS.getCustomers();
    const tableBody = document.querySelector('#customers-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">কোনো গ্রাহক পাওয়া যায়নি</td>
            </tr>
        `;
        return;
    }
    
    customers.forEach(customer => {
        const row = createCustomerTableRow(customer);
        tableBody.appendChild(row);
    });
}

// Create customer table row
function createCustomerTableRow(customer) {
    const row = document.createElement('tr');
    
    const balanceClass = customer.current_balance > 0 ? 'text-danger' : 
                        customer.current_balance < 0 ? 'text-success' : '';
    
    row.innerHTML = `
        <td>
            <div>
                <div class="font-bold">${customer.name}</div>
                <div class="text-muted" style="font-size: 0.8rem;">ID: ${customer.id}</div>
            </div>
        </td>
        <td>${customer.phone}</td>
        <td>${customer.email || '-'}</td>
        <td class="text-right ${balanceClass}">
            ${formatCurrency(Math.abs(customer.current_balance))}
            ${customer.current_balance > 0 ? '(বাকি)' : customer.current_balance < 0 ? '(অগ্রিম)' : ''}
        </td>
        <td class="text-center">
            <span class="status-badge in-stock">${customer.loyalty_points || 0}</span>
        </td>
        <td>
            <div class="action-buttons-table">
                <button class="action-btn edit" onclick="editCustomer('${customer.id}')" title="সম্পাদনা">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn view" onclick="viewCustomer('${customer.id}')" title="দেখুন">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn view" onclick="viewCustomerHistory('${customer.id}')" title="ইতিহাস">
                    <i class="fas fa-history"></i>
                </button>
                <button class="action-btn delete" onclick="deleteCustomer('${customer.id}')" title="মুছুন">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Show add customer modal
function showAddCustomerModal() {
    showModal('add-customer-modal');
}

// Add new customer from sales page
function addNewCustomer() {
    showAddCustomerModal();
}

// Handle add customer form submission
function handleAddCustomer(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customerData = {
        name: formData.get('customer-name') || document.getElementById('customer-name').value,
        phone: formData.get('customer-phone') || document.getElementById('customer-phone').value,
        email: formData.get('customer-email') || document.getElementById('customer-email').value,
        address: formData.get('customer-address') || document.getElementById('customer-address').value,
        credit_limit: parseNumber(formData.get('credit-limit') || document.getElementById('credit-limit').value),
        current_balance: 0,
        loyalty_points: 0
    };
    
    // Validation
    const errors = validateForm(e.target, {
        'customer-name': [
            { type: 'required', message: 'গ্রাহকের নাম আবশ্যক' },
            { type: 'minLength', value: 2, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' }
        ],
        'customer-phone': [
            { type: 'required', message: 'ফোন নাম্বার আবশ্যক' },
            { type: 'phone', message: 'সঠিক ফোন নাম্বার দিন' }
        ],
        'customer-email': [
            { type: 'email', message: 'সঠিক ইমেইল ঠিকানা দিন' }
        ]
    });
    
    if (errors.length > 0) {
        showToast(errors[0].message, 'error');
        return;
    }
    
    // Check if phone number already exists
    const existingCustomer = POS.data.getCustomerByPhone(customerData.phone);
    if (existingCustomer) {
        showToast('এই ফোন নাম্বার ইতিমধ্যে ব্যবহৃত হয়েছে', 'error');
        return;
    }
    
    showLoading();
    
    const customer = POS.createCustomer(customerData);
    
    hideLoading();
    
    if (customer) {
        showToast('গ্রাহক সফলভাবে যোগ করা হয়েছে', 'success');
        closeModal('add-customer-modal');
        
        // Reload customers table if on customers page
        if (currentPage === 'customers') {
            loadCustomersTable();
        }
        
        // Reload customers dropdown if on sales page
        if (currentPage === 'sales') {
            loadCustomers();
            
            // Auto-select the new customer
            const customerSelect = document.getElementById('customer-select');
            if (customerSelect) {
                customerSelect.value = customer.id;
                selectedCustomer = customer;
            }
        }
    } else {
        showToast('গ্রাহক যোগ করতে সমস্যা হয়েছে', 'error');
    }
}

// Edit customer
function editCustomer(customerId) {
    const customer = POS.data.read('customers', customerId);
    if (!customer) {
        showToast('গ্রাহক পাওয়া যায়নি', 'error');
        return;
    }
    
    // Populate form with customer data
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-address').value = customer.address || '';
    document.getElementById('credit-limit').value = customer.credit_limit || 0;
    
    // Change form to edit mode
    const form = document.getElementById('add-customer-form');
    const modal = document.getElementById('add-customer-modal');
    const modalTitle = modal.querySelector('.modal-header h3');
    
    modalTitle.textContent = 'গ্রাহক সম্পাদনা করুন';
    form.dataset.editId = customerId;
    
    // Update form submission handler
    form.removeEventListener('submit', handleAddCustomer);
    form.addEventListener('submit', handleEditCustomer);
    
    showModal('add-customer-modal');
}

// Handle edit customer form submission
function handleEditCustomer(e) {
    e.preventDefault();
    
    const customerId = e.target.dataset.editId;
    const formData = new FormData(e.target);
    
    const updates = {
        name: formData.get('customer-name') || document.getElementById('customer-name').value,
        phone: formData.get('customer-phone') || document.getElementById('customer-phone').value,
        email: formData.get('customer-email') || document.getElementById('customer-email').value,
        address: formData.get('customer-address') || document.getElementById('customer-address').value,
        credit_limit: parseNumber(formData.get('credit-limit') || document.getElementById('credit-limit').value)
    };
    
    // Validation
    const errors = validateForm(e.target, {
        'customer-name': [
            { type: 'required', message: 'গ্রাহকের নাম আবশ্যক' },
            { type: 'minLength', value: 2, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' }
        ],
        'customer-phone': [
            { type: 'required', message: 'ফোন নাম্বার আবশ্যক' },
            { type: 'phone', message: 'সঠিক ফোন নাম্বার দিন' }
        ],
        'customer-email': [
            { type: 'email', message: 'সঠিক ইমেইল ঠিকানা দিন' }
        ]
    });
    
    if (errors.length > 0) {
        showToast(errors[0].message, 'error');
        return;
    }
    
    // Check if phone number already exists (excluding current customer)
    const existingCustomer = POS.getCustomers().find(c => c.phone === updates.phone && c.id !== customerId);
    if (existingCustomer) {
        showToast('এই ফোন নাম্বার ইতিমধ্যে ব্যবহৃত হয়েছে', 'error');
        return;
    }
    
    showLoading();
    
    const updatedCustomer = POS.data.update('customers', customerId, updates);
    
    hideLoading();
    
    if (updatedCustomer) {
        showToast('গ্রাহক সফলভাবে আপডেট করা হয়েছে', 'success');
        closeModal('add-customer-modal');
        loadCustomersTable();
        
        // Reset form
        resetCustomerForm();
        
        // Reload customers dropdown if on sales page
        if (currentPage === 'sales') {
            loadCustomers();
        }
    } else {
        showToast('গ্রাহক আপডেট করতে সমস্যা হয়েছে', 'error');
    }
}

// View customer details
function viewCustomer(customerId) {
    const customer = POS.data.read('customers', customerId);
    if (!customer) {
        showToast('গ্রাহক পাওয়া যায়নি', 'error');
        return;
    }
    
    // Create a simple view modal (you can enhance this)
    const viewContent = `
        গ্রাহকের তথ্য:
        
        নাম: ${customer.name}
        ফোন: ${customer.phone}
        ইমেইল: ${customer.email || 'নেই'}
        ঠিকানা: ${customer.address || 'নেই'}
        ক্রেডিট লিমিট: ${formatCurrency(customer.credit_limit || 0)}
        বর্তমান ব্যালেন্স: ${formatCurrency(customer.current_balance)}
        লয়ালটি পয়েন্ট: ${customer.loyalty_points || 0}
        তৈরি: ${formatDate(customer.created_date)}
        আপডেট: ${formatDate(customer.updated_date)}
    `;
    
    alert(viewContent);
}

// View customer purchase history
function viewCustomerHistory(customerId) {
    const customer = POS.data.read('customers', customerId);
    if (!customer) {
        showToast('গ্রাহক পাওয়া যায়নি', 'error');
        return;
    }
    
    const sales = POS.getSales({ customer_id: customerId });
    
    if (sales.length === 0) {
        alert(`${customer.name} এর কোনো ক্রয়ের ইতিহাস নেই।`);
        return;
    }
    
    let historyText = `${customer.name} এর ক্রয়ের ইতিহাস:\n\n`;
    
    sales.slice(0, 10).forEach((sale, index) => {
        historyText += `${index + 1}. ইনভয়েস: ${sale.invoice_number}\n`;
        historyText += `   তারিখ: ${formatDate(sale.sale_date)}\n`;
        historyText += `   মোট: ${formatCurrency(sale.grand_total)}\n`;
        historyText += `   স্ট্যাটাস: ${sale.payment_status === 'paid' ? 'পরিশোধিত' : sale.payment_status === 'partial' ? 'আংশিক' : 'অপরিশোধিত'}\n\n`;
    });
    
    if (sales.length > 10) {
        historyText += `... এবং আরো ${sales.length - 10}টি লেনদেন`;
    }
    
    alert(historyText);
}

// Delete customer
function deleteCustomer(customerId) {
    const customer = POS.data.read('customers', customerId);
    if (!customer) {
        showToast('গ্রাহক পাওয়া যায়নি', 'error');
        return;
    }
    
    // Check if customer has any sales
    const sales = POS.getSales({ customer_id: customerId });
    if (sales.length > 0) {
        if (!confirm(`${customer.name} এর ${sales.length}টি লেনদেন রয়েছে। আপনি কি নিশ্চিত যে এই গ্রাহককে মুছে ফেলতে চান?`)) {
            return;
        }
    } else {
        if (!confirm(`আপনি কি "${customer.name}" গ্রাহককে মুছে ফেলতে চান?`)) {
            return;
        }
    }
    
    showLoading();
    
    const deleted = POS.data.delete('customers', customerId);
    
    hideLoading();
    
    if (deleted) {
        showToast('গ্রাহক সফলভাবে মুছে ফেলা হয়েছে', 'success');
        loadCustomersTable();
        
        // Reload customers dropdown if on sales page
        if (currentPage === 'sales') {
            loadCustomers();
            
            // Clear selection if this customer was selected
            if (selectedCustomer && selectedCustomer.id === customerId) {
                selectedCustomer = null;
                document.getElementById('customer-select').value = '';
            }
        }
    } else {
        showToast('গ্রাহক মুছতে সমস্যা হয়েছে', 'error');
    }
}

// Reset customer form
function resetCustomerForm() {
    const form = document.getElementById('add-customer-form');
    const modal = document.getElementById('add-customer-modal');
    const modalTitle = modal.querySelector('.modal-header h3');
    
    modalTitle.textContent = 'নতুন গ্রাহক যোগ করুন';
    delete form.dataset.editId;
    
    // Reset form submission handler
    form.removeEventListener('submit', handleEditCustomer);
    form.addEventListener('submit', handleAddCustomer);
    
    form.reset();
}

// Setup customer filters
function setupCustomerFilters() {
    const customerFilter = document.getElementById('customer-filter');
    
    if (customerFilter) {
        const debouncedFilter = debounce(function() {
            filterCustomersTable();
        }, 300);
        
        customerFilter.addEventListener('input', debouncedFilter);
    }
}

// Filter customers table
function filterCustomersTable() {
    const searchTerm = document.getElementById('customer-filter')?.value || '';
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    
    const customers = POS.getCustomers(filters);
    const tableBody = document.querySelector('#customers-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">কোনো গ্রাহক পাওয়া যায়নি</td>
            </tr>
        `;
        return;
    }
    
    customers.forEach(customer => {
        const row = createCustomerTableRow(customer);
        tableBody.appendChild(row);
    });
}

// Customer payment functions
function recordCustomerPayment(customerId, amount, paymentMethod = 'cash') {
    const customer = POS.data.read('customers', customerId);
    if (!customer) {
        showToast('গ্রাহক পাওয়া যায়নি', 'error');
        return false;
    }
    
    // Update customer balance
    const success = POS.data.updateCustomerBalance(customerId, amount, 'subtract');
    
    if (success) {
        // Record payment transaction (you can enhance this)
        const payment = {
            customer_id: customerId,
            amount: amount,
            payment_method: paymentMethod,
            date: new Date().toISOString(),
            type: 'payment'
        };
        
        // In a real app, you might want to store payments separately
        showToast(`${formatCurrency(amount)} পেমেন্ট রেকর্ড করা হয়েছে`, 'success');
        
        // Reload customer data
        if (currentPage === 'customers') {
            loadCustomersTable();
        }
        
        return true;
    }
    
    return false;
}

// Add customer credit
function addCustomerCredit(customerId, amount, reason = '') {
    const customer = POS.data.read('customers', customerId);
    if (!customer) {
        showToast('গ্রাহক পাওয়া যায়নি', 'error');
        return false;
    }
    
    // Update customer balance
    const success = POS.data.updateCustomerBalance(customerId, amount, 'add');
    
    if (success) {
        showToast(`${formatCurrency(amount)} ক্রেডিট যোগ করা হয়েছে`, 'success');
        
        // Reload customer data
        if (currentPage === 'customers') {
            loadCustomersTable();
        }
        
        return true;
    }
    
    return false;
}

// Initialize customer management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupCustomerFilters();
    
    // Reset form when modal is closed
    const addCustomerModal = document.getElementById('add-customer-modal');
    if (addCustomerModal) {
        addCustomerModal.addEventListener('hidden', resetCustomerForm);
    }
});

// Global functions for HTML onclick events
window.showAddCustomerModal = showAddCustomerModal;
window.addNewCustomer = addNewCustomer;
window.editCustomer = editCustomer;
window.viewCustomer = viewCustomer;
window.viewCustomerHistory = viewCustomerHistory;
window.deleteCustomer = deleteCustomer;
window.handleAddCustomer = handleAddCustomer;
window.recordCustomerPayment = recordCustomerPayment;
window.addCustomerCredit = addCustomerCredit;

