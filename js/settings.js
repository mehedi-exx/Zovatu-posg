// Settings Management Functions

// Load settings data
function loadSettings() {
    const settings = POS.getSettings();
    
    // Load company settings
    loadCompanySettings(settings.company);
    
    // Load POS settings
    loadPOSSettings(settings.pos);
    
    // Load print settings
    loadPrintSettings(settings.print);
}

// Load company settings
function loadCompanySettings(companySettings) {
    const fields = {
        'company-name': companySettings.name,
        'company-address': companySettings.address,
        'company-phone': companySettings.phone,
        'company-email': companySettings.email,
        'company-tax-number': companySettings.tax_number,
        'company-logo-url': companySettings.logo_url
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
        }
    });
}

// Load POS settings
function loadPOSSettings(posSettings) {
    const fields = {
        'default-tax-rate': posSettings.default_tax_rate,
        'currency': posSettings.currency,
        'decimal-places': posSettings.decimal_places,
        'auto-print-receipt': posSettings.auto_print_receipt,
        'low-stock-alert': posSettings.low_stock_alert
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = value;
            } else {
                field.value = value;
            }
        }
    });
}

// Load print settings
function loadPrintSettings(printSettings) {
    const fields = {
        'receipt-width': printSettings.receipt_width,
        'header-text': printSettings.header_text,
        'footer-text': printSettings.footer_text
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
        }
    });
}

// Handle company settings form submission
function handleCompanySettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const companyData = {
        name: formData.get('company-name') || document.getElementById('company-name').value,
        address: formData.get('company-address') || document.getElementById('company-address').value,
        phone: formData.get('company-phone') || document.getElementById('company-phone').value,
        email: formData.get('company-email') || document.getElementById('company-email').value,
        tax_number: formData.get('company-tax-number') || document.getElementById('company-tax-number')?.value || '',
        logo_url: formData.get('company-logo-url') || document.getElementById('company-logo-url')?.value || ''
    };
    
    // Validation
    const errors = validateForm(e.target, {
        'company-name': [
            { type: 'required', message: 'কোম্পানির নাম আবশ্যক' }
        ],
        'company-phone': [
            { type: 'phone', message: 'সঠিক ফোন নাম্বার দিন' }
        ],
        'company-email': [
            { type: 'email', message: 'সঠিক ইমেইল ঠিকানা দিন' }
        ]
    });
    
    if (errors.length > 0) {
        showToast(errors[0].message, 'error');
        return;
    }
    
    showLoading();
    
    const currentSettings = POS.getSettings();
    const updatedSettings = {
        ...currentSettings,
        company: companyData
    };
    
    const success = POS.data.updateSettings(updatedSettings);
    
    hideLoading();
    
    if (success) {
        showToast('কোম্পানির তথ্য সফলভাবে আপডেট করা হয়েছে', 'success');
    } else {
        showToast('কোম্পানির তথ্য আপডেট করতে সমস্যা হয়েছে', 'error');
    }
}

// Handle POS settings form submission
function handlePOSSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const posData = {
        default_tax_rate: parseNumber(formData.get('default-tax-rate') || document.getElementById('default-tax-rate').value),
        currency: formData.get('currency') || document.getElementById('currency').value,
        decimal_places: parseInt(formData.get('decimal-places') || document.getElementById('decimal-places')?.value || 2),
        auto_print_receipt: document.getElementById('auto-print-receipt').checked,
        low_stock_alert: document.getElementById('low-stock-alert')?.checked !== false
    };
    
    // Validation
    if (posData.default_tax_rate < 0 || posData.default_tax_rate > 100) {
        showToast('ট্যাক্স রেট ০ থেকে ১০০ এর মধ্যে হতে হবে', 'error');
        return;
    }
    
    showLoading();
    
    const currentSettings = POS.getSettings();
    const updatedSettings = {
        ...currentSettings,
        pos: posData
    };
    
    const success = POS.data.updateSettings(updatedSettings);
    
    hideLoading();
    
    if (success) {
        showToast('POS সেটিংস সফলভাবে আপডেট করা হয়েছে', 'success');
    } else {
        showToast('POS সেটিংস আপডেট করতে সমস্যা হয়েছে', 'error');
    }
}

// Handle print settings form submission
function handlePrintSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const printData = {
        receipt_width: formData.get('receipt-width') || document.getElementById('receipt-width')?.value || '80mm',
        header_text: formData.get('header-text') || document.getElementById('header-text')?.value || '',
        footer_text: formData.get('footer-text') || document.getElementById('footer-text')?.value || ''
    };
    
    showLoading();
    
    const currentSettings = POS.getSettings();
    const updatedSettings = {
        ...currentSettings,
        print: printData
    };
    
    const success = POS.data.updateSettings(updatedSettings);
    
    hideLoading();
    
    if (success) {
        showToast('প্রিন্ট সেটিংস সফলভাবে আপডেট করা হয়েছে', 'success');
    } else {
        showToast('প্রিন্ট সেটিংস আপডেট করতে সমস্যা হয়েছে', 'error');
    }
}

// Export all data
function exportData() {
    try {
        showLoading();
        POS.data.createBackup();
        hideLoading();
        showToast('ডেটা সফলভাবে এক্সপোর্ট করা হয়েছে', 'success');
    } catch (error) {
        hideLoading();
        showToast('ডেটা এক্সপোর্ট করতে সমস্যা হয়েছে', 'error');
        console.error('Export error:', error);
    }
}

// Import data
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (confirm('ডেটা ইমপোর্ট করলে বর্তমান সব ডেটা মুছে যাবে। আপনি কি নিশ্চিত?')) {
            showLoading();
            
            POS.data.restoreBackup(file)
                .then(() => {
                    hideLoading();
                    showToast('ডেটা সফলভাবে ইমপোর্ট করা হয়েছে', 'success');
                    
                    // Reload current page data
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                })
                .catch((error) => {
                    hideLoading();
                    showToast('ডেটা ইমপোর্ট করতে সমস্যা হয়েছে', 'error');
                    console.error('Import error:', error);
                });
        }
    };
    
    input.click();
}

// Reset all data
function resetAllData() {
    if (confirm('সব ডেটা মুছে ফেলা হবে এবং ডিফল্ট সেটিংস পুনরুদ্ধার করা হবে। আপনি কি নিশ্চিত?')) {
        if (confirm('এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। আপনি কি সত্যিই নিশ্চিত?')) {
            showLoading();
            
            try {
                // Clear all localStorage data
                Storage.clear();
                
                hideLoading();
                showToast('সব ডেটা মুছে ফেলা হয়েছে', 'success');
                
                // Reload page to reinitialize with default data
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (error) {
                hideLoading();
                showToast('ডেটা মুছতে সমস্যা হয়েছে', 'error');
                console.error('Reset error:', error);
            }
        }
    }
}

// Test print functionality
function testPrint() {
    const settings = POS.getSettings();
    
    const testReceiptContent = `
        <div class="receipt">
            <div class="text-center mb-2">
                <h3>${settings.company.name}</h3>
                <p>${settings.company.address}</p>
                <p>ফোন: ${settings.company.phone}</p>
                ${settings.company.email ? `<p>ইমেইল: ${settings.company.email}</p>` : ''}
            </div>
            
            <div class="border-bottom mb-2">
                <p><strong>টেস্ট প্রিন্ট</strong></p>
                <p><strong>তারিখ:</strong> ${formatDate(new Date())} ${formatTime(new Date())}</p>
            </div>
            
            <table style="width: 100%; margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: left;">পণ্য</th>
                        <th style="text-align: center;">পরিমাণ</th>
                        <th style="text-align: right;">দাম</th>
                        <th style="text-align: right;">মোট</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>টেস্ট পণ্য</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">৳১০০.০০</td>
                        <td style="text-align: right;">৳১০০.০০</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="border-top">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                    <span>মোট:</span>
                    <span>৳১০০.০০</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>প্রদত্ত:</span>
                    <span>৳১০০.০০</span>
                </div>
            </div>
            
            <div class="text-center mt-2">
                <p>${settings.print.header_text}</p>
                <p>${settings.print.footer_text}</p>
            </div>
        </div>
    `;
    
    // Create temporary element for printing
    const tempDiv = document.createElement('div');
    tempDiv.id = 'test-receipt-content';
    tempDiv.innerHTML = testReceiptContent;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // Print
    printContent('test-receipt-content');
    
    // Remove temporary element
    setTimeout(() => {
        document.body.removeChild(tempDiv);
    }, 1000);
    
    showToast('টেস্ট প্রিন্ট পাঠানো হয়েছে', 'info');
}

// Manage categories
function manageCategories() {
    const categories = POS.data.getAll('categories');
    
    let categoryList = 'বর্তমান ক্যাটাগরিসমূহ:\n\n';
    categories.forEach((category, index) => {
        categoryList += `${index + 1}. ${category.name} (${category.id})\n`;
    });
    
    categoryList += '\nনতুন ক্যাটাগরি যোগ করতে চান?';
    
    if (confirm(categoryList)) {
        const newCategoryName = prompt('নতুন ক্যাটাগরির নাম:');
        if (newCategoryName) {
            const newCategory = {
                id: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
                name: newCategoryName,
                description: '',
                parent_id: null,
                is_active: true
            };
            
            const created = POS.data.create('categories', newCategory);
            if (created) {
                showToast('নতুন ক্যাটাগরি যোগ করা হয়েছে', 'success');
                
                // Reload categories in product forms
                loadCategories();
            } else {
                showToast('ক্যাটাগরি যোগ করতে সমস্যা হয়েছে', 'error');
            }
        }
    }
}

// Manage users (basic implementation)
function manageUsers() {
    const users = POS.data.getAll('users');
    
    let userList = 'বর্তমান ব্যবহারকারীগণ:\n\n';
    users.forEach((user, index) => {
        userList += `${index + 1}. ${user.full_name} (${user.username}) - ${user.role}\n`;
    });
    
    alert(userList);
}

// Change password (basic implementation)
function changePassword() {
    const currentPassword = prompt('বর্তমান পাসওয়ার্ড:');
    if (!currentPassword) return;
    
    // In a real app, you would verify the current password
    if (currentPassword !== 'admin123') {
        showToast('বর্তমান পাসওয়ার্ড ভুল', 'error');
        return;
    }
    
    const newPassword = prompt('নতুন পাসওয়ার্ড:');
    if (!newPassword) return;
    
    const confirmPassword = prompt('নতুন পাসওয়ার্ড নিশ্চিত করুন:');
    if (newPassword !== confirmPassword) {
        showToast('পাসওয়ার্ড মিলছে না', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'error');
        return;
    }
    
    // Update password
    const updated = POS.data.update('users', 'admin', { password: newPassword });
    if (updated) {
        showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে', 'success');
    } else {
        showToast('পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে', 'error');
    }
}

// Setup settings form handlers
function setupSettingsFormHandlers() {
    const companyForm = document.getElementById('company-settings-form');
    const posForm = document.getElementById('pos-settings-form');
    
    if (companyForm) {
        companyForm.addEventListener('submit', handleCompanySettings);
    }
    
    if (posForm) {
        posForm.addEventListener('submit', handlePOSSettings);
    }
    
    // Add save buttons to forms
    addSaveButtonsToForms();
}

// Add save buttons to settings forms
function addSaveButtonsToForms() {
    const forms = ['company-settings-form', 'pos-settings-form'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form && !form.querySelector('.save-button')) {
            const saveButton = document.createElement('button');
            saveButton.type = 'submit';
            saveButton.className = 'btn btn-primary save-button';
            saveButton.innerHTML = '<i class="fas fa-save"></i> সংরক্ষণ';
            saveButton.style.marginTop = '1rem';
            
            form.appendChild(saveButton);
        }
    });
}

// Initialize settings page
function initializeSettingsPage() {
    setupSettingsFormHandlers();
    loadSettings();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings page if we're on it
    if (document.getElementById('settings-page')) {
        initializeSettingsPage();
    }
});

// Global functions for HTML onclick events
window.exportData = exportData;
window.importData = importData;
window.resetAllData = resetAllData;
window.testPrint = testPrint;
window.manageCategories = manageCategories;
window.manageUsers = manageUsers;
window.changePassword = changePassword;
window.handleCompanySettings = handleCompanySettings;
window.handlePOSSettings = handlePOSSettings;

