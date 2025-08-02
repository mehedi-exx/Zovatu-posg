// Data Management System for POS

class DataManager {
    constructor() {
        this.storagePrefix = 'pos_';
        this.initializeData();
    }

    // Initialize default data
    initializeData() {
        // Initialize categories if not exists
        if (!this.getCategories().length) {
            this.saveCategories([
                { id: 'restaurant', name: 'রেস্টুরেন্ট', icon: '🍽️' },
                { id: 'grocery', name: 'গ্রোসারি', icon: '🛒' },
                { id: 'clothing', name: 'পোশাক', icon: '👕' },
                { id: 'electronics', name: 'ইলেকট্রনিক্স', icon: '📱' }
            ]);
        }

        // Initialize settings if not exists
        if (!this.getSettings()) {
            this.saveSettings({
                companyName: '',
                companyAddress: '',
                companyPhone: '',
                companyEmail: '',
                taxRate: 0,
                currency: 'BDT'
            });
        }

        // Initialize users if not exists
        if (!this.getUsers().length) {
            this.saveUsers([
                {
                    id: 'admin',
                    name: 'অ্যাডমিন',
                    email: 'admin@pos.com',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    }

    // Generic storage methods
    save(key, data) {
        try {
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            showNotification('ডেটা সংরক্ষণে ব্যর্থ', 'error');
            return false;
        }
    }

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.storagePrefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading data:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            console.error('Error removing data:', error);
            return false;
        }
    }

    // Products
    getProducts() {
        return this.load('products', []);
    }

    saveProducts(products) {
        return this.save('products', products);
    }

    addProduct(product) {
        const products = this.getProducts();
        product.id = generateId();
        product.createdAt = new Date().toISOString();
        product.updatedAt = new Date().toISOString();
        products.push(product);
        return this.saveProducts(products);
    }

    updateProduct(id, updatedProduct) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct, updatedAt: new Date().toISOString() };
            return this.saveProducts(products);
        }
        return false;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filteredProducts = products.filter(p => p.id !== id);
        return this.saveProducts(filteredProducts);
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    }

    getProductBySku(sku) {
        const products = this.getProducts();
        return products.find(p => p.sku === sku);
    }

    searchProducts(query) {
        const products = this.getProducts();
        const lowercaseQuery = query.toLowerCase();
        return products.filter(product => 
            product.name.toLowerCase().includes(lowercaseQuery) ||
            product.sku.toLowerCase().includes(lowercaseQuery) ||
            product.category.toLowerCase().includes(lowercaseQuery)
        );
    }

    getProductsByCategory(category) {
        const products = this.getProducts();
        return category === 'all' ? products : products.filter(p => p.category === category);
    }

    // Customers
    getCustomers() {
        return this.load('customers', []);
    }

    saveCustomers(customers) {
        return this.save('customers', customers);
    }

    addCustomer(customer) {
        const customers = this.getCustomers();
        customer.id = generateId();
        customer.createdAt = new Date().toISOString();
        customer.updatedAt = new Date().toISOString();
        customer.totalPurchases = 0;
        customer.lastPurchase = null;
        customers.push(customer);
        return this.saveCustomers(customers);
    }

    updateCustomer(id, updatedCustomer) {
        const customers = this.getCustomers();
        const index = customers.findIndex(c => c.id === id);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...updatedCustomer, updatedAt: new Date().toISOString() };
            return this.saveCustomers(customers);
        }
        return false;
    }

    deleteCustomer(id) {
        const customers = this.getCustomers();
        const filteredCustomers = customers.filter(c => c.id !== id);
        return this.saveCustomers(filteredCustomers);
    }

    getCustomerById(id) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === id);
    }

    searchCustomers(query) {
        const customers = this.getCustomers();
        const lowercaseQuery = query.toLowerCase();
        return customers.filter(customer => 
            customer.name.toLowerCase().includes(lowercaseQuery) ||
            customer.phone.includes(query) ||
            (customer.email && customer.email.toLowerCase().includes(lowercaseQuery))
        );
    }

    // Sales
    getSales() {
        return this.load('sales', []);
    }

    saveSales(sales) {
        return this.save('sales', sales);
    }

    addSale(sale) {
        const sales = this.getSales();
        sale.id = generateId();
        sale.createdAt = new Date().toISOString();
        sales.push(sale);
        
        // Update customer purchase history
        if (sale.customerId) {
            this.updateCustomerPurchaseHistory(sale.customerId, sale.total);
        }
        
        // Update product stock
        sale.items.forEach(item => {
            this.updateProductStock(item.productId, -item.quantity);
        });
        
        return this.saveSales(sales);
    }

    getSaleById(id) {
        const sales = this.getSales();
        return sales.find(s => s.id === id);
    }

    getSalesByDateRange(startDate, endDate) {
        const sales = this.getSales();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return sales.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate >= start && saleDate <= end;
        });
    }

    getTodaysSales() {
        const today = getStartOfDay();
        const tomorrow = getEndOfDay();
        return this.getSalesByDateRange(today, tomorrow);
    }

    getThisMonthsSales() {
        const startOfMonth = getStartOfMonth();
        const endOfMonth = getEndOfMonth();
        return this.getSalesByDateRange(startOfMonth, endOfMonth);
    }

    // Inventory Transactions
    getInventoryTransactions() {
        return this.load('inventory_transactions', []);
    }

    saveInventoryTransactions(transactions) {
        return this.save('inventory_transactions', transactions);
    }

    addInventoryTransaction(transaction) {
        const transactions = this.getInventoryTransactions();
        transaction.id = generateId();
        transaction.createdAt = new Date().toISOString();
        transactions.push(transaction);
        return this.saveInventoryTransactions(transactions);
    }

    updateProductStock(productId, quantityChange, note = '') {
        const product = this.getProductById(productId);
        if (!product) return false;

        const newStock = Math.max(0, product.stock + quantityChange);
        this.updateProduct(productId, { stock: newStock });

        // Add inventory transaction
        this.addInventoryTransaction({
            productId,
            type: quantityChange > 0 ? 'add' : 'subtract',
            quantity: Math.abs(quantityChange),
            previousStock: product.stock,
            newStock,
            note
        });

        return true;
    }

    // Categories
    getCategories() {
        return this.load('categories', []);
    }

    saveCategories(categories) {
        return this.save('categories', categories);
    }

    // Settings
    getSettings() {
        return this.load('settings', null);
    }

    saveSettings(settings) {
        return this.save('settings', settings);
    }

    updateSettings(updatedSettings) {
        const currentSettings = this.getSettings() || {};
        const newSettings = { ...currentSettings, ...updatedSettings };
        return this.saveSettings(newSettings);
    }

    // Users
    getUsers() {
        return this.load('users', []);
    }

    saveUsers(users) {
        return this.save('users', users);
    }

    getCurrentUser() {
        return this.load('current_user', { id: 'admin', name: 'অ্যাডমিন' });
    }

    setCurrentUser(user) {
        return this.save('current_user', user);
    }

    // Helper methods
    updateCustomerPurchaseHistory(customerId, amount) {
        const customer = this.getCustomerById(customerId);
        if (customer) {
            customer.totalPurchases = (customer.totalPurchases || 0) + amount;
            customer.lastPurchase = new Date().toISOString();
            this.updateCustomer(customerId, customer);
        }
    }

    // Statistics
    getTotalSales() {
        const sales = this.getSales();
        return sales.reduce((total, sale) => total + sale.total, 0);
    }

    getTodaysSalesTotal() {
        const todaysSales = this.getTodaysSales();
        return todaysSales.reduce((total, sale) => total + sale.total, 0);
    }

    getThisMonthsSalesTotal() {
        const thisMonthsSales = this.getThisMonthsSales();
        return thisMonthsSales.reduce((total, sale) => total + sale.total, 0);
    }

    getTotalProducts() {
        return this.getProducts().length;
    }

    getTotalCustomers() {
        return this.getCustomers().length;
    }

    getLowStockProducts(threshold = 10) {
        const products = this.getProducts();
        return products.filter(product => product.stock <= threshold);
    }

    getTopSellingProducts(limit = 10) {
        const sales = this.getSales();
        const productSales = {};

        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (productSales[item.productId]) {
                    productSales[item.productId].quantity += item.quantity;
                    productSales[item.productId].revenue += item.total;
                } else {
                    productSales[item.productId] = {
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.quantity,
                        revenue: item.total
                    };
                }
            });
        });

        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
    }

    // Data Export/Import
    exportAllData() {
        const data = {
            products: this.getProducts(),
            customers: this.getCustomers(),
            sales: this.getSales(),
            inventoryTransactions: this.getInventoryTransactions(),
            categories: this.getCategories(),
            settings: this.getSettings(),
            users: this.getUsers(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(data, null, 2);
    }

    importAllData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.version || !data.exportDate) {
                throw new Error('Invalid data format');
            }

            // Import data
            if (data.products) this.saveProducts(data.products);
            if (data.customers) this.saveCustomers(data.customers);
            if (data.sales) this.saveSales(data.sales);
            if (data.inventoryTransactions) this.saveInventoryTransactions(data.inventoryTransactions);
            if (data.categories) this.saveCategories(data.categories);
            if (data.settings) this.saveSettings(data.settings);
            if (data.users) this.saveUsers(data.users);

            showNotification('ডেটা সফলভাবে ইমপোর্ট হয়েছে', 'success');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            showNotification('ডেটা ইমপোর্ট করতে ব্যর্থ', 'error');
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        const keys = [
            'products', 'customers', 'sales', 'inventory_transactions',
            'categories', 'settings', 'users', 'current_user'
        ];
        
        keys.forEach(key => this.remove(key));
        this.initializeData();
        showNotification('সব ডেটা মুছে ফেলা হয়েছে', 'success');
    }

    // Backup data to file
    backupData() {
        const data = this.exportAllData();
        const filename = `pos_backup_${formatDate(new Date()).replace(/\//g, '-')}.json`;
        downloadFile(data, filename);
        showNotification('ব্যাকআপ ডাউনলোড হয়েছে', 'success');
    }
}

// Create global data manager instance
const dataManager = new DataManager();

