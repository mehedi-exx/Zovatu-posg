// Data Management for POS System

// Data structure keys
const DATA_KEYS = {
    PRODUCTS: 'pos_products',
    CATEGORIES: 'pos_categories',
    CUSTOMERS: 'pos_customers',
    SALES: 'pos_sales',
    INVENTORY: 'pos_inventory',
    SETTINGS: 'pos_settings',
    USERS: 'pos_users'
};

// Default data structures
const DEFAULT_DATA = {
    products: [],
    categories: [
        { id: 'restaurant', name: 'রেস্টুরেন্ট', description: 'খাবার ও পানীয়', parent_id: null, is_active: true },
        { id: 'grocery', name: 'গ্রোসারি', description: 'দৈনন্দিন প্রয়োজনীয় পণ্য', parent_id: null, is_active: true },
        { id: 'clothing', name: 'পোশাক', description: 'কাপড় ও ফ্যাশন', parent_id: null, is_active: true },
        { id: 'electronics', name: 'ইলেকট্রনিক্স', description: 'ইলেকট্রনিক পণ্য', parent_id: null, is_active: true }
    ],
    customers: [],
    sales: [],
    inventory: [],
    settings: {
        company: {
            name: 'আমার দোকান',
            address: 'ঢাকা, বাংলাদেশ',
            phone: '01700000000',
            email: 'info@myshop.com',
            tax_number: '',
            logo_url: ''
        },
        pos: {
            default_tax_rate: 15,
            currency: 'BDT',
            decimal_places: 2,
            auto_print_receipt: true,
            low_stock_alert: true
        },
        print: {
            receipt_width: '80mm',
            header_text: 'ধন্যবাদ আমাদের সাথে কেনাকাটার জন্য',
            footer_text: 'আবার আসবেন'
        }
    },
    users: [
        {
            id: 'admin',
            username: 'admin',
            password: 'admin123', // In real app, this should be hashed
            full_name: 'অ্যাডমিন',
            role: 'admin',
            permissions: ['sales', 'products', 'inventory', 'customers', 'reports', 'settings'],
            is_active: true,
            created_date: new Date().toISOString()
        }
    ]
};

// Data Manager Class
class DataManager {
    constructor() {
        this.initializeData();
    }

    // Initialize data if not exists
    initializeData() {
        Object.keys(DEFAULT_DATA).forEach(key => {
            const storageKey = DATA_KEYS[key.toUpperCase()];
            if (!Storage.get(storageKey)) {
                Storage.set(storageKey, DEFAULT_DATA[key]);
            }
        });
    }

    // Generic CRUD operations
    create(type, item) {
        const items = this.getAll(type);
        item.id = item.id || generateUniqueId();
        item.created_date = new Date().toISOString();
        item.updated_date = new Date().toISOString();
        
        items.push(item);
        return this.saveAll(type, items) ? item : null;
    }

    read(type, id) {
        const items = this.getAll(type);
        return items.find(item => item.id === id) || null;
    }

    update(type, id, updates) {
        const items = this.getAll(type);
        const index = items.findIndex(item => item.id === id);
        
        if (index === -1) return null;
        
        items[index] = { ...items[index], ...updates, updated_date: new Date().toISOString() };
        return this.saveAll(type, items) ? items[index] : null;
    }

    delete(type, id) {
        const items = this.getAll(type);
        const filteredItems = items.filter(item => item.id !== id);
        
        if (filteredItems.length === items.length) return false;
        
        return this.saveAll(type, filteredItems);
    }

    getAll(type) {
        const storageKey = DATA_KEYS[type.toUpperCase()];
        return Storage.get(storageKey, []);
    }

    saveAll(type, items) {
        const storageKey = DATA_KEYS[type.toUpperCase()];
        return Storage.set(storageKey, items);
    }

    // Product specific methods
    getProducts(filters = {}) {
        let products = this.getAll('products');
        
        if (filters.category && filters.category !== 'all') {
            products = products.filter(p => p.category === filters.category);
        }
        
        if (filters.search) {
            products = filterItems(products, filters.search, ['name', 'sku', 'barcode', 'description']);
        }
        
        if (filters.active !== undefined) {
            products = products.filter(p => p.is_active === filters.active);
        }
        
        return products;
    }

    getProductByBarcode(barcode) {
        const products = this.getAll('products');
        return products.find(p => p.barcode === barcode && p.is_active) || null;
    }

    updateProductStock(productId, quantity, type = 'set') {
        const product = this.read('products', productId);
        if (!product) return false;
        
        let newQuantity;
        switch (type) {
            case 'add':
                newQuantity = product.stock_quantity + quantity;
                break;
            case 'subtract':
                newQuantity = product.stock_quantity - quantity;
                break;
            default:
                newQuantity = quantity;
        }
        
        newQuantity = Math.max(0, newQuantity);
        
        // Update product stock
        const updated = this.update('products', productId, { stock_quantity: newQuantity });
        
        // Record inventory transaction
        if (updated) {
            this.recordInventoryTransaction({
                product_id: productId,
                transaction_type: type === 'add' ? 'in' : type === 'subtract' ? 'out' : 'adjustment',
                quantity: Math.abs(quantity),
                reference_type: 'manual',
                reference_id: null,
                notes: `Stock ${type}: ${quantity}`
            });
        }
        
        return updated;
    }

    // Customer specific methods
    getCustomers(filters = {}) {
        let customers = this.getAll('customers');
        
        if (filters.search) {
            customers = filterItems(customers, filters.search, ['name', 'phone', 'email']);
        }
        
        return customers;
    }

    getCustomerByPhone(phone) {
        const customers = this.getAll('customers');
        return customers.find(c => c.phone === phone) || null;
    }

    updateCustomerBalance(customerId, amount, type = 'add') {
        const customer = this.read('customers', customerId);
        if (!customer) return false;
        
        let newBalance;
        if (type === 'add') {
            newBalance = customer.current_balance + amount;
        } else {
            newBalance = customer.current_balance - amount;
        }
        
        return this.update('customers', customerId, { current_balance: newBalance });
    }

    // Sales specific methods
    createSale(saleData) {
        // Generate invoice number
        const sales = this.getAll('sales');
        const invoiceNumber = `INV-${Date.now()}`;
        
        const sale = {
            ...saleData,
            invoice_number: invoiceNumber,
            sale_date: new Date().toISOString()
        };
        
        const createdSale = this.create('sales', sale);
        
        if (createdSale) {
            // Update product stocks
            sale.items.forEach(item => {
                this.updateProductStock(item.product_id, item.quantity, 'subtract');
                
                // Record inventory transaction
                this.recordInventoryTransaction({
                    product_id: item.product_id,
                    transaction_type: 'out',
                    quantity: item.quantity,
                    reference_type: 'sale',
                    reference_id: createdSale.id,
                    notes: `Sale: ${invoiceNumber}`
                });
            });
            
            // Update customer balance if credit sale
            if (sale.customer_id && sale.due_amount > 0) {
                this.updateCustomerBalance(sale.customer_id, sale.due_amount, 'add');
            }
        }
        
        return createdSale;
    }

    getSales(filters = {}) {
        let sales = this.getAll('sales');
        
        if (filters.start_date && filters.end_date) {
            const startDate = new Date(filters.start_date);
            const endDate = new Date(filters.end_date);
            endDate.setHours(23, 59, 59, 999);
            
            sales = sales.filter(sale => {
                const saleDate = new Date(sale.sale_date);
                return saleDate >= startDate && saleDate <= endDate;
            });
        }
        
        if (filters.customer_id) {
            sales = sales.filter(sale => sale.customer_id === filters.customer_id);
        }
        
        if (filters.payment_status) {
            sales = sales.filter(sale => sale.payment_status === filters.payment_status);
        }
        
        return sales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    }

    // Inventory specific methods
    recordInventoryTransaction(transaction) {
        return this.create('inventory', transaction);
    }

    getInventoryTransactions(filters = {}) {
        let transactions = this.getAll('inventory');
        
        if (filters.product_id) {
            transactions = transactions.filter(t => t.product_id === filters.product_id);
        }
        
        if (filters.transaction_type) {
            transactions = transactions.filter(t => t.transaction_type === filters.transaction_type);
        }
        
        if (filters.start_date && filters.end_date) {
            const startDate = new Date(filters.start_date);
            const endDate = new Date(filters.end_date);
            endDate.setHours(23, 59, 59, 999);
            
            transactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        }
        
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getLowStockProducts() {
        const products = this.getAll('products');
        return products.filter(product => 
            product.is_active && 
            product.stock_quantity <= (product.min_stock_level || 0)
        );
    }

    getOutOfStockProducts() {
        const products = this.getAll('products');
        return products.filter(product => 
            product.is_active && 
            product.stock_quantity === 0
        );
    }

    // Settings methods
    getSettings() {
        return Storage.get(DATA_KEYS.SETTINGS, DEFAULT_DATA.settings);
    }

    updateSettings(updates) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...updates };
        return Storage.set(DATA_KEYS.SETTINGS, newSettings);
    }

    // Report methods
    getSalesReport(startDate, endDate) {
        const sales = this.getSales({ start_date: startDate, end_date: endDate });
        
        const report = {
            total_sales: sales.length,
            total_revenue: sales.reduce((sum, sale) => sum + sale.grand_total, 0),
            total_tax: sales.reduce((sum, sale) => sum + sale.total_tax, 0),
            total_discount: sales.reduce((sum, sale) => sum + sale.total_discount, 0),
            payment_methods: {},
            daily_sales: {}
        };
        
        // Group by payment method
        sales.forEach(sale => {
            if (!report.payment_methods[sale.payment_method]) {
                report.payment_methods[sale.payment_method] = {
                    count: 0,
                    amount: 0
                };
            }
            report.payment_methods[sale.payment_method].count++;
            report.payment_methods[sale.payment_method].amount += sale.grand_total;
        });
        
        // Group by date
        sales.forEach(sale => {
            const date = new Date(sale.sale_date).toDateString();
            if (!report.daily_sales[date]) {
                report.daily_sales[date] = {
                    count: 0,
                    amount: 0
                };
            }
            report.daily_sales[date].count++;
            report.daily_sales[date].amount += sale.grand_total;
        });
        
        return report;
    }

    getTopProducts(startDate, endDate, limit = 10) {
        const sales = this.getSales({ start_date: startDate, end_date: endDate });
        const productSales = {};
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        product_id: item.product_id,
                        product_name: item.product_name,
                        quantity_sold: 0,
                        total_revenue: 0
                    };
                }
                productSales[item.product_id].quantity_sold += item.quantity;
                productSales[item.product_id].total_revenue += item.total_amount;
            });
        });
        
        return Object.values(productSales)
            .sort((a, b) => b.quantity_sold - a.quantity_sold)
            .slice(0, limit);
    }

    // Data export/import methods
    exportAllData() {
        const data = {};
        Object.keys(DATA_KEYS).forEach(key => {
            data[key.toLowerCase()] = this.getAll(key.toLowerCase());
        });
        return data;
    }

    importAllData(data) {
        try {
            Object.keys(data).forEach(key => {
                if (DATA_KEYS[key.toUpperCase()]) {
                    this.saveAll(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Backup methods
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: this.exportAllData()
        };
        
        const filename = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(backup, filename);
    }

    restoreBackup(file) {
        return new Promise((resolve, reject) => {
            importFromJSON(file, (backup) => {
                try {
                    if (backup.data) {
                        const success = this.importAllData(backup.data);
                        if (success) {
                            showToast('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে', 'success');
                            resolve(true);
                        } else {
                            throw new Error('Data import failed');
                        }
                    } else {
                        throw new Error('Invalid backup format');
                    }
                } catch (error) {
                    showToast('ব্যাকআপ রিস্টোর করতে সমস্যা হয়েছে', 'error');
                    reject(error);
                }
            });
        });
    }
}

// Initialize data manager
const dataManager = new DataManager();

// Global data access functions
window.POS = {
    data: dataManager,
    
    // Quick access methods
    getProducts: (filters) => dataManager.getProducts(filters),
    getCustomers: (filters) => dataManager.getCustomers(filters),
    getSales: (filters) => dataManager.getSales(filters),
    getSettings: () => dataManager.getSettings(),
    
    // Quick create methods
    createProduct: (product) => dataManager.create('products', product),
    createCustomer: (customer) => dataManager.create('customers', customer),
    createSale: (sale) => dataManager.createSale(sale),
    
    // Utility methods
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    showToast: showToast,
    showModal: showModal,
    closeModal: closeModal
};

