// Utility Functions for POS System

// Generate unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatCurrency(amount, currency = 'BDT') {
    const symbols = {
        'BDT': '৳',
        'USD': '$',
        'EUR': '€'
    };
    
    const symbol = symbols[currency] || '৳';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

// Format date
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('bn-BD');
}

// Format time
function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('bn-BD', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// Update current date and time
function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    
    if (dateElement) {
        dateElement.textContent = formatDate(now);
    }
    
    if (timeElement) {
        timeElement.textContent = formatTime(now);
    }
}

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Get toast icon based on type
function getToastIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || icons['info'];
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (Bangladesh format)
function validatePhone(phone) {
    const re = /^(\+88)?01[3-9]\d{8}$/;
    return re.test(phone);
}

// Calculate percentage
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
}

// Calculate discount
function calculateDiscount(amount, discount, type = 'percentage') {
    if (type === 'percentage') {
        return (amount * discount) / 100;
    } else {
        return Math.min(discount, amount);
    }
}

// Calculate tax
function calculateTax(amount, taxRate) {
    return (amount * taxRate) / 100;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search filter function
function filterItems(items, searchTerm, fields) {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
        return fields.some(field => {
            const value = getNestedValue(item, field);
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

// Get nested object value
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Sort array of objects
function sortItems(items, field, direction = 'asc') {
    return items.sort((a, b) => {
        const aVal = getNestedValue(a, field);
        const bVal = getNestedValue(b, field);
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Export data to JSON
function exportToJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    link.click();
}

// Import data from JSON file
function importFromJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            callback(data);
        } catch (error) {
            showToast('ফাইল পড়তে সমস্যা হয়েছে', 'error');
        }
    };
    reader.readAsText(file);
}

// Print content
function printContent(contentId) {
    const content = document.getElementById(contentId);
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>প্রিন্ট</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 20px; }
                    .receipt { max-width: 300px; margin: 0 auto; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .border-top { border-top: 1px dashed #000; padding-top: 10px; }
                    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .mb-2 { margin-bottom: 10px; }
                    .font-bold { font-weight: bold; }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
}

// Local storage helpers
const Storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },
    
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

// Event delegation helper
function delegate(parent, selector, event, handler) {
    parent.addEventListener(event, function(e) {
        if (e.target.matches(selector) || e.target.closest(selector)) {
            handler.call(e.target.closest(selector), e);
        }
    });
}

// Initialize utility functions
document.addEventListener('DOMContentLoaded', function() {
    // Update date and time every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            closeModal(modalId);
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
});

// Number formatting helpers
function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

function parseNumber(str) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Validation helpers
function validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

function validateMinLength(value, minLength) {
    return value && value.toString().length >= minLength;
}

function validateMaxLength(value, maxLength) {
    return !value || value.toString().length <= maxLength;
}

function validateRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

// Form validation
function validateForm(formElement, rules) {
    const errors = [];
    
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
        const field = formElement.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) continue;
        
        const value = field.value;
        
        for (const rule of fieldRules) {
            if (rule.type === 'required' && !validateRequired(value)) {
                errors.push({ field: fieldName, message: rule.message });
                break;
            }
            
            if (rule.type === 'email' && value && !validateEmail(value)) {
                errors.push({ field: fieldName, message: rule.message });
                break;
            }
            
            if (rule.type === 'phone' && value && !validatePhone(value)) {
                errors.push({ field: fieldName, message: rule.message });
                break;
            }
            
            if (rule.type === 'minLength' && !validateMinLength(value, rule.value)) {
                errors.push({ field: fieldName, message: rule.message });
                break;
            }
            
            if (rule.type === 'maxLength' && !validateMaxLength(value, rule.value)) {
                errors.push({ field: fieldName, message: rule.message });
                break;
            }
            
            if (rule.type === 'range' && !validateRange(value, rule.min, rule.max)) {
                errors.push({ field: fieldName, message: rule.message });
                break;
            }
        }
    }
    
    return errors;
}

