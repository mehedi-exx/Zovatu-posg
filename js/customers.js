// Customers Management Module

// Load customers page
function loadCustomersPage() {
    loadCustomersTable();
}

// Load customers table
function loadCustomersTable() {
    const customers = dataManager.getCustomers();
    const tableBody = document.getElementById("customers-table-body");

    if (!tableBody) return;

    if (customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <h3>কোনো গ্রাহক নেই</h3>
                        <p>নতুন গ্রাহক যোগ করুন</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || "N/A"}</td>
            <td>${formatCurrency(customer.totalPurchases || 0)}</td>
            <td>${customer.lastPurchase ? formatDate(customer.lastPurchase) : "N/A"}</td>
            <td>
                <button class="action-btn" onclick="editCustomer(\'${customer.id}\')">সম্পাদনা</button>
                <button class="action-btn delete" onclick="deleteCustomer(\'${customer.id}\')">মুছুন</button>
            </td>
        </tr>
    `).join("");
}

// Save customer
function saveCustomer() {
    const form = document.getElementById("customer-form");
    if (!form) return;

    const customerData = {
        name: document.getElementById("customer-name").value.trim(),
        phone: document.getElementById("customer-phone").value.trim(),
        email: document.getElementById("customer-email").value.trim(),
        address: document.getElementById("customer-address").value.trim()
    };

    // Validate required fields
    if (!customerData.name) {
        showNotification("গ্রাহকের নাম প্রয়োজন", "error");
        soundManager.playError();
        return;
    }

    if (!customerData.phone) {
        showNotification("ফোন নম্বর প্রয়োজন", "error");
        soundManager.playError();
        return;
    }

    if (!validatePhone(customerData.phone)) {
        showNotification("সঠিক ফোন নম্বর দিন", "error");
        soundManager.playError();
        return;
    }

    if (customerData.email && !validateEmail(customerData.email)) {
        showNotification("সঠিক ইমেল দিন", "error");
        soundManager.playError();
        return;
    }

    // Check for duplicate phone number
    const existingCustomer = dataManager.getCustomers().find(c => c.phone === customerData.phone);
    if (existingCustomer && (!currentEditingCustomer || existingCustomer.id !== currentEditingCustomer)) {
        showNotification("এই ফোন নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে", "error");
        soundManager.playError();
        return;
    }

    let success = false;
    if (currentEditingCustomer) {
        success = dataManager.updateCustomer(currentEditingCustomer, customerData);
        if (success) {
            showNotification("গ্রাহক সফলভাবে আপডেট হয়েছে", "success");
        }
    } else {
        success = dataManager.addCustomer(customerData);
        if (success) {
            showNotification("নতুন গ্রাহক যোগ হয়েছে", "success");
        }
    }

    if (success) {
        soundManager.playSuccess();
        closeModal();
        loadCustomersTable();
        loadCustomersForSelect(); // Update sales page customer select
    } else {
        showNotification("গ্রাহক সংরক্ষণে ব্যর্থ", "error");
        soundManager.playError();
    }
}

// Edit customer
function editCustomer(customerId) {
    const customer = dataManager.getCustomerById(customerId);
    if (!customer) {
        showNotification("গ্রাহক পাওয়া যায়নি", "error");
        soundManager.playError();
        return;
    }

    currentEditingCustomer = customerId;

    document.getElementById("customer-name").value = customer.name;
    document.getElementById("customer-phone").value = customer.phone;
    document.getElementById("customer-email").value = customer.email || "";
    document.getElementById("customer-address").value = customer.address || "";

    openModal("customer-modal");
}

// Delete customer
function deleteCustomer(customerId) {
    const customer = dataManager.getCustomerById(customerId);
    if (!customer) {
        showNotification("গ্রাহক পাওয়া যায়নি", "error");
        soundManager.playError();
        return;
    }

    // Check if customer has any sales history
    const sales = dataManager.getSales();
    const customerHasSales = sales.some(sale => sale.customerId === customerId);

    let confirmMessage = `আপনি কি "${customer.name}" গ্রাহকটি মুছে ফেলতে চান?`;
    if (customerHasSales) {
        confirmMessage += "\n\nসতর্কতা: এই গ্রাহকের বিক্রয়ের ইতিহাস রয়েছে।";
    }

    if (confirm(confirmMessage)) {
        if (dataManager.deleteCustomer(customerId)) {
            showNotification("গ্রাহক মুছে ফেলা হয়েছে", "success");
            soundManager.playSuccess();
            loadCustomersTable();
            loadCustomersForSelect(); // Update sales page customer select
        } else {
            showNotification("গ্রাহক মুছতে ব্যর্থ", "error");
            soundManager.playError();
        }
    }
}

// Search customers in table
function searchCustomersTable() {
    const searchTerm = document.getElementById("customers-search").value.toLowerCase();
    const tableRows = document.querySelectorAll("#customers-table-body tr");
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

// Sort customers table
function sortCustomersTable(column, direction = "asc") {
    const customers = dataManager.getCustomers();
    const sortedCustomers = sortBy(customers, column, direction);
    
    dataManager.saveCustomers(sortedCustomers);
    loadCustomersTable();
}

console.log("Customers module loaded");

