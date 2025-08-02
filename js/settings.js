// Settings Management Module

// Load settings page
function loadSettingsPage() {
    loadCompanySettings();
    loadSoundSettings();
    loadBackupSettings();
}

// Load company settings
function loadCompanySettings() {
    const settings = dataManager.getSettings();
    
    if (settings) {
        const companyNameInput = document.getElementById("company-name");
        const companyAddressInput = document.getElementById("company-address");
        const companyPhoneInput = document.getElementById("company-phone");
        const companyEmailInput = document.getElementById("company-email");
        const taxRateInput = document.getElementById("tax-rate");
        
        if (companyNameInput) companyNameInput.value = settings.companyName || "";
        if (companyAddressInput) companyAddressInput.value = settings.companyAddress || "";
        if (companyPhoneInput) companyPhoneInput.value = settings.companyPhone || "";
        if (companyEmailInput) companyEmailInput.value = settings.companyEmail || "";
        if (taxRateInput) taxRateInput.value = settings.taxRate || 0;
    }
}

// Load sound settings
function loadSoundSettings() {
    const soundEnabledCheckbox = document.getElementById("sound-enabled");
    const soundVolumeSlider = document.getElementById("sound-volume");
    
    if (soundEnabledCheckbox) {
        soundEnabledCheckbox.checked = soundManager.isEnabled();
    }
    
    if (soundVolumeSlider) {
        soundVolumeSlider.value = soundManager.getVolume() * 100;
        updateVolumeDisplay();
    }
}

// Load backup settings
function loadBackupSettings() {
    const lastBackupElement = document.getElementById("last-backup");
    const lastBackup = localStorage.getItem("pos_last_backup");
    
    if (lastBackupElement) {
        if (lastBackup) {
            lastBackupElement.textContent = formatDate(lastBackup) + " " + formatTime(lastBackup);
        } else {
            lastBackupElement.textContent = "কখনো ব্যাকআপ নেওয়া হয়নি";
        }
    }
}

// Save company settings
function saveCompanySettings() {
    const settings = {
        companyName: document.getElementById("company-name").value.trim(),
        companyAddress: document.getElementById("company-address").value.trim(),
        companyPhone: document.getElementById("company-phone").value.trim(),
        companyEmail: document.getElementById("company-email").value.trim(),
        taxRate: parseFloat(document.getElementById("tax-rate").value) || 0
    };
    
    // Validate email if provided
    if (settings.companyEmail && !validateEmail(settings.companyEmail)) {
        showNotification("সঠিক ইমেল ঠিকানা দিন", "error");
        soundManager.playError();
        return;
    }
    
    // Validate phone if provided
    if (settings.companyPhone && !validatePhone(settings.companyPhone)) {
        showNotification("সঠিক ফোন নম্বর দিন", "error");
        soundManager.playError();
        return;
    }
    
    // Validate tax rate
    if (settings.taxRate < 0 || settings.taxRate > 100) {
        showNotification("ট্যাক্স রেট ০-১০০% এর মধ্যে হতে হবে", "error");
        soundManager.playError();
        return;
    }
    
    if (dataManager.updateSettings(settings)) {
        showNotification("কোম্পানি সেটিংস সংরক্ষিত হয়েছে", "success");
        soundManager.playSuccess();
        
        // Update header with company name if provided
        updateHeaderCompanyName(settings.companyName);
    } else {
        showNotification("সেটিংস সংরক্ষণে ব্যর্থ", "error");
        soundManager.playError();
    }
}

// Update header company name
function updateHeaderCompanyName(companyName) {
    const logoElement = document.querySelector(".logo h1");
    if (logoElement && companyName) {
        logoElement.textContent = companyName;
    }
}

// Toggle sound
function toggleSound() {
    const enabled = document.getElementById("sound-enabled").checked;
    soundManager.setEnabled(enabled);
    
    if (enabled) {
        soundManager.testSound();
        showNotification("সাউন্ড চালু করা হয়েছে", "success");
    } else {
        showNotification("সাউন্ড বন্ধ করা হয়েছে", "success");
    }
}

// Update sound volume
function updateSoundVolume() {
    const volume = document.getElementById("sound-volume").value / 100;
    soundManager.setVolume(volume);
    updateVolumeDisplay();
    
    // Test sound with new volume
    soundManager.testSound();
}

// Update volume display
function updateVolumeDisplay() {
    const volumeDisplay = document.getElementById("volume-display");
    const volume = document.getElementById("sound-volume").value;
    
    if (volumeDisplay) {
        volumeDisplay.textContent = volume + "%";
    }
}

// Test sound
function testSound() {
    soundManager.testSound("click");
    showNotification("টেস্ট সাউন্ড বাজানো হয়েছে", "info");
}

// Backup data
function backupData() {
    try {
        dataManager.backupData();
        localStorage.setItem("pos_last_backup", new Date().toISOString());
        loadBackupSettings(); // Refresh backup info
    } catch (error) {
        console.error("Backup error:", error);
        showNotification("ব্যাকআপ নিতে ব্যর্থ", "error");
        soundManager.playError();
    }
}

// Restore data
function restoreData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (confirm("বর্তমান সব ডেটা মুছে যাবে। আপনি কি নিশ্চিত?")) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const jsonData = e.target.result;
                if (dataManager.importAllData(jsonData)) {
                    showNotification("ডেটা সফলভাবে পুনরুদ্ধার হয়েছে", "success");
                    soundManager.playSuccess();
                    
                    // Reload current page
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Clear all data
function clearAllData() {
    const confirmText = "সব ডেটা মুছে ফেলতে 'DELETE' লিখুন:";
    const userInput = prompt(confirmText);
    
    if (userInput === "DELETE") {
        dataManager.clearAllData();
        showNotification("সব ডেটা মুছে ফেলা হয়েছে", "success");
        soundManager.playSuccess();
        
        // Reload page after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } else if (userInput !== null) {
        showNotification("ভুল টেক্সট। ডেটা মুছে ফেলা হয়নি", "error");
        soundManager.playError();
    }
}

// Export all data
function exportAllData() {
    try {
        const data = dataManager.exportAllData();
        const filename = `pos_full_backup_${formatDate(new Date()).replace(/\//g, "-")}.json`;
        downloadFile(data, filename, "application/json");
        
        showNotification("সম্পূর্ণ ডেটা এক্সপোর্ট হয়েছে", "success");
        soundManager.playSuccess();
    } catch (error) {
        console.error("Export error:", error);
        showNotification("ডেটা এক্সপোর্ট করতে ব্যর্থ", "error");
        soundManager.playError();
    }
}

// Import all data
function importAllData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (confirm("বর্তমান সব ডেটা প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?")) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const jsonData = e.target.result;
                if (dataManager.importAllData(jsonData)) {
                    // Reload page to reflect changes
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Get system info
function getSystemInfo() {
    const products = dataManager.getProducts();
    const customers = dataManager.getCustomers();
    const sales = dataManager.getSales();
    const transactions = dataManager.getInventoryTransactions();
    
    const info = {
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalSales: sales.length,
        totalTransactions: transactions.length,
        totalSalesAmount: dataManager.getTotalSales(),
        lowStockProducts: dataManager.getLowStockProducts(10).length,
        storageUsed: JSON.stringify({
            products,
            customers,
            sales,
            transactions
        }).length
    };
    
    return info;
}

// Show system info
function showSystemInfo() {
    const info = getSystemInfo();
    
    const infoText = `
সিস্টেম তথ্য:
- মোট পণ্য: ${info.totalProducts}
- মোট গ্রাহক: ${info.totalCustomers}
- মোট বিক্রয়: ${info.totalSales}
- মোট লেনদেন: ${info.totalTransactions}
- মোট বিক্রয় পরিমাণ: ${formatCurrency(info.totalSalesAmount)}
- কম স্টক পণ্য: ${info.lowStockProducts}
- স্টোরেজ ব্যবহার: ${(info.storageUsed / 1024).toFixed(2)} KB
    `;
    
    alert(infoText);
}

// Reset to default settings
function resetToDefault() {
    if (confirm("সব সেটিংস ডিফল্ট করতে চান?")) {
        // Reset company settings
        document.getElementById("company-name").value = "";
        document.getElementById("company-address").value = "";
        document.getElementById("company-phone").value = "";
        document.getElementById("company-email").value = "";
        document.getElementById("tax-rate").value = "0";
        
        // Reset sound settings
        document.getElementById("sound-enabled").checked = true;
        document.getElementById("sound-volume").value = "50";
        
        // Save default settings
        const defaultSettings = {
            companyName: "",
            companyAddress: "",
            companyPhone: "",
            companyEmail: "",
            taxRate: 0
        };
        
        dataManager.saveSettings(defaultSettings);
        soundManager.setEnabled(true);
        soundManager.setVolume(0.5);
        
        updateVolumeDisplay();
        showNotification("সেটিংস ডিফল্ট করা হয়েছে", "success");
        soundManager.playSuccess();
    }
}

// Auto backup (can be called periodically)
function autoBackup() {
    const lastBackup = localStorage.getItem("pos_last_backup");
    const now = new Date();
    
    if (!lastBackup) {
        // First time, create backup
        backupData();
        return;
    }
    
    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = getDaysBetween(now, lastBackupDate);
    
    // Auto backup every 7 days
    if (daysSinceBackup >= 7) {
        if (confirm("গত ৭ দিনে কোনো ব্যাকআপ নেওয়া হয়নি। এখন ব্যাকআপ নিতে চান?")) {
            backupData();
        }
    }
}

// Initialize settings when page loads
document.addEventListener("DOMContentLoaded", function() {
    // Check for auto backup on app start
    setTimeout(autoBackup, 5000); // Check after 5 seconds
});

console.log("Settings module loaded");

