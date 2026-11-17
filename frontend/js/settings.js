// Settings Controller & Preferences Manager
// Handles profile updates, theme toggle, notifications, data export/backup, and modals

const SETTINGS_STORAGE_KEYS = {
  PROFILE: "expense_tracker_profile",
  PREFERENCES: "expense_tracker_preferences",
  NOTIFICATIONS: "expense_tracker_notifications",
  SECURITY: "expense_tracker_security",
  CATEGORIES: "expense_tracker_categories"
};

const DEFAULT_PROFILE = {
  name: "Sushil Mandavi",
  email: "sushilmandavi@example.com",
  phone: "+91 98765 43210",
  avatar: "img/sushil_mandavi.jpg"
};

const DEFAULT_PREFERENCES = {
  theme: "light",
  currency: "INR",
  currencySymbol: "₹",
  language: "en",
  dateFormat: "DD/MM/YYYY",
  timePeriod: "6",
  defaultCategory: "Food",
  monthlyBudget: 5000
};

const DEFAULT_NOTIFICATIONS = {
  master: true,
  expenseAdded: true,
  monthlySummary: true,
  budgetAlerts: true,
  unusualAlerts: true,
  email: false
};

const DEFAULT_SECURITY = {
  twoFactor: false
};

const DEFAULT_CATEGORIES = [
  "Food", "Travel", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"
];

// Helper to safely get from localStorage
function getSettingsStore(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...defaultValue };
    return { ...defaultValue, ...JSON.parse(raw) };
  } catch (e) {
    return { ...defaultValue };
  }
}

function saveSettingsStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage save error:", e);
  }
}

// Global state
let currentProfile = getSettingsStore(SETTINGS_STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
let currentPreferences = getSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
let currentNotifications = getSettingsStore(SETTINGS_STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
let currentSecurity = getSettingsStore(SETTINGS_STORAGE_KEYS.SECURITY, DEFAULT_SECURITY);
let currentCategories = (() => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : [...DEFAULT_CATEGORIES];
  } catch (e) {
    return [...DEFAULT_CATEGORIES];
  }
})();

/* ==========================================================================
   THEME MANAGER
   ========================================================================== */
function applyTheme(theme) {
  const root = document.documentElement;
  currentPreferences.theme = theme;
  saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else if (theme === "auto") {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }

  // Update active state in segmented control
  document.querySelectorAll("#theme-segmented-ctrl .segment-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.themeVal === theme);
  });
}

// Listen for OS scheme change when in Auto mode
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (currentPreferences.theme === "auto") {
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    }
  });
}

/* ==========================================================================
   PROFILE SYNC & UI UPDATES
   ========================================================================== */
function updateProfileUI() {
  // Update names
  const name = currentProfile.name || DEFAULT_PROFILE.name;
  const email = currentProfile.email || DEFAULT_PROFILE.email;
  const phone = currentProfile.phone || DEFAULT_PROFILE.phone;
  const avatar = currentProfile.avatar || DEFAULT_PROFILE.avatar;

  // Header
  document.querySelectorAll(".user-name").forEach(el => el.textContent = name);
  document.querySelectorAll(".hero-left h2").forEach(el => el.textContent = `Hello, ${name.split(" ")[0]}! 👋`);
  document.querySelectorAll(".about-credits").forEach(el => el.textContent = `Built with ❤️ by ${name}`);

  // Settings inputs
  const profNameInput = document.getElementById("prof-name");
  if (profNameInput) profNameInput.value = name;

  const profEmailInput = document.getElementById("prof-email");
  if (profEmailInput) profEmailInput.value = email;

  const profPhoneInput = document.getElementById("prof-phone");
  if (profPhoneInput) profPhoneInput.value = phone;

  // Avatars
  document.querySelectorAll(".user-avatar, #settings-avatar-img, #header-user-avatar").forEach(img => {
    img.src = avatar;
  });
}

/* ==========================================================================
   INITIALIZE ALL SETTINGS CONTROLS
   ========================================================================== */
function initSettingsUI() {
  // 1. Theme
  applyTheme(currentPreferences.theme || "light");

  // 2. Profile
  updateProfileUI();

  // 3. Currency Dropdown
  const currSelect = document.getElementById("pref-currency");
  if (currSelect) {
    currSelect.value = currentPreferences.currency || "INR";
  }

  // 4. Language Dropdown
  const langSelect = document.getElementById("pref-language");
  if (langSelect) {
    langSelect.value = currentPreferences.language || "en";
  }

  // 5. Date Format Dropdown
  const dateSelect = document.getElementById("pref-date-format");
  if (dateSelect) {
    dateSelect.value = currentPreferences.dateFormat || "DD/MM/YYYY";
  }

  // 6. Default Time Period Dropdown
  const timeSelect = document.getElementById("pref-time-period");
  if (timeSelect) {
    timeSelect.value = currentPreferences.timePeriod || "6";
  }

  // 7. Notifications
  const masterToggle = document.getElementById("notif-master-toggle");
  if (masterToggle) {
    masterToggle.checked = currentNotifications.master !== false;
  }
  const notifMap = {
    "notif-expense-added": currentNotifications.expenseAdded,
    "notif-monthly-summary": currentNotifications.monthlySummary,
    "notif-budget-alerts": currentNotifications.budgetAlerts,
    "notif-unusual-alerts": currentNotifications.unusualAlerts,
    "notif-email-alerts": currentNotifications.email
  };
  Object.entries(notifMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      el.checked = Boolean(val);
      el.disabled = !masterToggle?.checked;
    }
  });

  // 8. Two-Factor Authentication
  const twoFactorToggle = document.getElementById("two-factor-toggle");
  if (twoFactorToggle) {
    twoFactorToggle.checked = Boolean(currentSecurity.twoFactor);
  }

  // 9. Default Category
  const defCatSelect = document.getElementById("pref-default-category");
  if (defCatSelect) {
    defCatSelect.value = currentPreferences.defaultCategory || "Food";
  }

  // 10. Monthly Budget Limit
  const budgetInput = document.getElementById("pref-monthly-budget");
  if (budgetInput) {
    budgetInput.value = currentPreferences.monthlyBudget || 5000;
  }
}

/* ==========================================================================
   EVENT HANDLERS & MODALS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initSettingsUI();

  // ------------------------------------------------------------------------
  // Theme segmented control clicks
  // ------------------------------------------------------------------------
  document.querySelectorAll("#theme-segmented-ctrl .segment-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const themeVal = btn.dataset.themeVal;
      applyTheme(themeVal);
      showNotice(`Theme set to ${themeVal.charAt(0).toUpperCase() + themeVal.slice(1)}.`, "info");
    });
  });

  // ------------------------------------------------------------------------
  // Profile Form Submission
  // ------------------------------------------------------------------------
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("prof-name").value.trim();
      const email = document.getElementById("prof-email").value.trim();
      const phone = document.getElementById("prof-phone").value.trim();

      if (!name || !email) {
        showNotice("Name and email are required.", "error");
        return;
      }

      currentProfile.name = name;
      currentProfile.email = email;
      currentProfile.phone = phone;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.PROFILE, currentProfile);

      updateProfileUI();
      showNotice("Profile changes saved successfully! ✓", "success");
    });
  }

  // ------------------------------------------------------------------------
  // Change Photo File Upload
  // ------------------------------------------------------------------------
  const avatarInput = document.getElementById("avatar-file-input");
  if (avatarInput) {
    avatarInput.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showNotice("Please select a valid image file.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = event => {
        const dataUrl = event.target.result;
        currentProfile.avatar = dataUrl;
        saveSettingsStore(SETTINGS_STORAGE_KEYS.PROFILE, currentProfile);
        updateProfileUI();
        showNotice("Profile photo updated successfully!", "success");
      };
      reader.readAsDataURL(file);
    });
  }

  // ------------------------------------------------------------------------
  // Preferences Dropdown changes
  // ------------------------------------------------------------------------
  const currSelect = document.getElementById("pref-currency");
  if (currSelect) {
    currSelect.addEventListener("change", e => {
      const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
      currentPreferences.currency = e.target.value;
      currentPreferences.currencySymbol = symbols[e.target.value] || "$";
      saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);

      // Update budget symbol
      document.querySelectorAll(".input-suffix-symbol").forEach(el => el.textContent = currentPreferences.currencySymbol);
      showNotice(`Currency preference updated to ${e.target.value} (${currentPreferences.currencySymbol}).`, "success");
    });
  }

  const langSelect = document.getElementById("pref-language");
  if (langSelect) {
    langSelect.addEventListener("change", e => {
      currentPreferences.language = e.target.value;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);
      showNotice("Language preference updated.", "info");
    });
  }

  const dateSelect = document.getElementById("pref-date-format");
  if (dateSelect) {
    dateSelect.addEventListener("change", e => {
      currentPreferences.dateFormat = e.target.value;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);
      showNotice(`Date format updated to ${e.target.value}.`, "info");
    });
  }

  const timeSelect = document.getElementById("pref-time-period");
  if (timeSelect) {
    timeSelect.addEventListener("change", e => {
      currentPreferences.timePeriod = e.target.value;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);
      const trendSelect = document.getElementById("trend-timeframe");
      if (trendSelect) {
        trendSelect.value = e.target.value;
        trendSelect.dispatchEvent(new Event("change"));
      }
      showNotice("Default dashboard timeframe updated.", "info");
    });
  }

  // ------------------------------------------------------------------------
  // Notification Toggles
  // ------------------------------------------------------------------------
  const masterToggle = document.getElementById("notif-master-toggle");
  if (masterToggle) {
    masterToggle.addEventListener("change", e => {
      const isChecked = e.target.checked;
      currentNotifications.master = isChecked;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.NOTIFICATIONS, currentNotifications);

      document.querySelectorAll(".sub-notif-toggle").forEach(toggle => {
        toggle.disabled = !isChecked;
      });

      showNotice(isChecked ? "All notifications enabled." : "Notifications muted.", "info");
    });
  }

  const subNotifList = [
    { id: "notif-expense-added", key: "expenseAdded", label: "Expense added notifications" },
    { id: "notif-monthly-summary", key: "monthlySummary", label: "Monthly spending summary" },
    { id: "notif-budget-alerts", key: "budgetAlerts", label: "Budget limit alerts" },
    { id: "notif-unusual-alerts", key: "unusualAlerts", label: "Unusual spending alerts" },
    { id: "notif-email-alerts", key: "email", label: "Email notifications" }
  ];

  subNotifList.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener("change", e => {
        currentNotifications[item.key] = e.target.checked;
        saveSettingsStore(SETTINGS_STORAGE_KEYS.NOTIFICATIONS, currentNotifications);
        showNotice(`${item.label} ${e.target.checked ? "enabled" : "disabled"}.`, "info");
      });
    }
  });

  // ------------------------------------------------------------------------
  // Security: Two Factor
  // ------------------------------------------------------------------------
  const twoFactorToggle = document.getElementById("two-factor-toggle");
  if (twoFactorToggle) {
    twoFactorToggle.addEventListener("change", e => {
      currentSecurity.twoFactor = e.target.checked;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.SECURITY, currentSecurity);
      showNotice(
        e.target.checked
          ? "Two-Factor Authentication activated. Security enhanced!"
          : "Two-Factor Authentication turned off.",
        e.target.checked ? "success" : "info"
      );
    });
  }

  // Logout All Devices
  document.getElementById("btn-logout-devices")?.addEventListener("click", () => {
    if (window.confirm("Are you sure you want to sign out from all other active devices and sessions?")) {
      showNotice("Signed out of all other devices successfully.", "success");
    }
  });

  // ------------------------------------------------------------------------
  // Expense Preferences
  // ------------------------------------------------------------------------
  const defCatSelect = document.getElementById("pref-default-category");
  if (defCatSelect) {
    defCatSelect.addEventListener("change", e => {
      currentPreferences.defaultCategory = e.target.value;
      saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);
      showNotice(`Default category set to ${e.target.value}.`, "info");
    });
  }

  const budgetInput = document.getElementById("pref-monthly-budget");
  if (budgetInput) {
    budgetInput.addEventListener("change", e => {
      const val = Number(e.target.value);
      if (val >= 0) {
        currentPreferences.monthlyBudget = val;
        saveSettingsStore(SETTINGS_STORAGE_KEYS.PREFERENCES, currentPreferences);
        showNotice(`Monthly budget limit set to ${currentPreferences.currencySymbol || "₹"}${val.toLocaleString()}.`, "success");
      }
    });
  }

  // ------------------------------------------------------------------------
  // Data Management Action Buttons
  // ------------------------------------------------------------------------
  // 1. Export as CSV
  document.getElementById("btn-data-export-csv")?.addEventListener("click", () => {
    const exportBtn = document.getElementById("export-btn");
    if (exportBtn) {
      exportBtn.click();
    } else {
      showNotice("Exporting expense records to CSV...", "info");
    }
  });

  // 2. Download Reports
  document.getElementById("btn-data-reports")?.addEventListener("click", () => {
    downloadComprehensiveReport();
  });

  // 3. Backup Data
  document.getElementById("btn-data-backup")?.addEventListener("click", () => {
    backupAllData();
  });

  // 4. Clear All Expenses
  document.getElementById("btn-data-clear")?.addEventListener("click", () => {
    openClearConfirmModal();
  });

  // ------------------------------------------------------------------------
  // Modal Open Triggers
  // ------------------------------------------------------------------------
  document.getElementById("btn-change-password")?.addEventListener("click", () => {
    openModal("change-password-modal");
  });

  document.getElementById("btn-manage-categories")?.addEventListener("click", () => {
    renderCategoriesModal();
    openModal("manage-categories-modal");
  });

  document.getElementById("btn-support-faqs")?.addEventListener("click", () => {
    openModal("faq-modal");
  });

  document.getElementById("btn-support-contact")?.addEventListener("click", () => {
    openModal("contact-support-modal");
  });

  document.getElementById("btn-support-report")?.addEventListener("click", () => {
    openModal("report-problem-modal");
  });

  document.getElementById("btn-about-details")?.addEventListener("click", () => {
    openModal("about-details-modal");
  });

  // Generic modal close handler
  document.querySelectorAll(".setting-modal-close-btn, .btn-modal-cancel").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-backdrop");
      if (modal) modal.hidden = true;
    });
  });

  document.querySelectorAll(".setting-modal").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) modal.hidden = true;
    });
  });

  // Password Form Submit
  document.getElementById("password-form")?.addEventListener("submit", e => {
    e.preventDefault();
    const currentPass = document.getElementById("curr-password").value;
    const newPass = document.getElementById("new-password").value;
    const confirmPass = document.getElementById("confirm-password").value;

    if (!currentPass || !newPass) {
      showNotice("Please fill in all password fields.", "error");
      return;
    }
    if (newPass.length < 6) {
      showNotice("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPass !== confirmPass) {
      showNotice("New password and confirmation do not match.", "error");
      return;
    }

    closeModal("change-password-modal");
    document.getElementById("password-form").reset();
    showNotice("Password updated successfully!", "success");
  });

  // Contact Form Submit
  document.getElementById("contact-support-form")?.addEventListener("submit", e => {
    e.preventDefault();
    closeModal("contact-support-modal");
    document.getElementById("contact-support-form").reset();
    showNotice("Message sent! Our support team will get back to you shortly.", "success");
  });

  // Report Problem Form Submit
  document.getElementById("report-problem-form")?.addEventListener("submit", e => {
    e.preventDefault();
    closeModal("report-problem-modal");
    document.getElementById("report-problem-form").reset();
    showNotice("Thank you for reporting! Ticket created successfully.", "success");
  });

  // Add Category Handler
  document.getElementById("add-category-form")?.addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("new-category-input");
    const catName = input.value.trim();
    if (!catName) return;

    if (currentCategories.some(c => c.toLowerCase() === catName.toLowerCase())) {
      showNotice(`Category "${catName}" already exists.`, "error");
      return;
    }

    currentCategories.push(catName);
    saveSettingsStore(SETTINGS_STORAGE_KEYS.CATEGORIES, currentCategories);
    input.value = "";
    renderCategoriesModal();
    updateCategoryDropdowns();
    showNotice(`Category "${catName}" added successfully.`, "success");
  });

  // Confirm Clear All Expenses
  document.getElementById("confirm-clear-all-btn")?.addEventListener("click", async () => {
    closeModal("clear-confirm-modal");
    try {
      localStorage.removeItem("expense_tracker_data");
      // If backend API exists, delete expenses
      if (window.allExpenses && window.allExpenses.length > 0) {
        for (const item of [...window.allExpenses]) {
          try {
            await ExpenseAPI.deleteExpense(item.id);
          } catch (_) {}
        }
      }
      showNotice("All expenses cleared successfully.", "success");
      if (typeof refreshApp === "function") {
        await refreshApp();
      }
    } catch (e) {
      showNotice("Error clearing expenses: " + e.message, "error");
    }
  });
});

/* ==========================================================================
   HELPER UTILITIES: MODALS & REPORTS
   ========================================================================== */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.hidden = false;
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.hidden = true;
  }
}

function openClearConfirmModal() {
  openModal("clear-confirm-modal");
}

function renderCategoriesModal() {
  const container = document.getElementById("categories-list-container");
  if (!container) return;

  container.innerHTML = currentCategories.map((cat, idx) => {
    const isProtected = ["Food", "Travel", "Shopping", "Bills"].includes(cat);
    return `
      <div class="category-badge-item">
        <span>${escapeHTML(cat)}</span>
        ${
          !isProtected
            ? `<button type="button" class="cat-delete-btn" onclick="deleteCategory(${idx})" title="Delete Category">&times;</button>`
            : ""
        }
      </div>
    `;
  }).join("");
}

function deleteCategory(index) {
  const removed = currentCategories.splice(index, 1);
  saveSettingsStore(SETTINGS_STORAGE_KEYS.CATEGORIES, currentCategories);
  renderCategoriesModal();
  updateCategoryDropdowns();
  showNotice(`Category "${removed[0]}" removed.`, "info");
}

function updateCategoryDropdowns() {
  const selects = [
    document.getElementById("category"),
    document.getElementById("filter-category"),
    document.getElementById("pref-default-category")
  ];

  selects.forEach(select => {
    if (!select) return;
    const currentVal = select.value;
    const isFilter = select.id === "filter-category";
    const isPref = select.id === "pref-default-category";

    let html = isFilter ? '<option value="">All Categories</option>' : (isPref ? '' : '<option value="">Choose category</option>');
    currentCategories.forEach(cat => {
      html += `<option value="${escapeHTML(cat)}" ${cat === currentVal ? "selected" : ""}>${escapeHTML(cat)}</option>`;
    });
    select.innerHTML = html;
  });
}

function downloadComprehensiveReport() {
  const expenses = window.allExpenses || [];
  const dateStr = new Date().toISOString().slice(0, 10);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const count = expenses.length;
  const avg = count ? (total / count).toFixed(2) : 0;

  // Breakdown by category
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount || 0);
  });

  let reportText = `========================================================\n`;
  reportText += `          EXPENSE TRACKER - SPENDING REPORT             \n`;
  reportText += `========================================================\n`;
  reportText += `Generated on: ${new Date().toLocaleString()}\n`;
  reportText += `User Account: ${currentProfile.name} (${currentProfile.email})\n`;
  reportText += `Total Expenses: ${currentPreferences.currencySymbol || "₹"}${total.toLocaleString()}\n`;
  reportText += `Total Transactions: ${count}\n`;
  reportText += `Average Transaction: ${currentPreferences.currencySymbol || "₹"}${avg}\n\n`;

  reportText += `--------------------------------------------------------\n`;
  reportText += `SPENDING BY CATEGORY\n`;
  reportText += `--------------------------------------------------------\n`;
  Object.entries(catTotals).forEach(([cat, amt]) => {
    const pct = total ? ((amt / total) * 100).toFixed(1) : 0;
    reportText += `${cat.padEnd(20)}: ${currentPreferences.currencySymbol || "₹"}${amt.toFixed(2).padStart(10)} (${pct}%)\n`;
  });

  reportText += `\n--------------------------------------------------------\n`;
  reportText += `TRANSACTION HISTORY\n`;
  reportText += `--------------------------------------------------------\n`;
  reportText += `Date        Category      Amount      Title\n`;
  reportText += `--------------------------------------------------------\n`;
  expenses.slice(0, 50).forEach(e => {
    reportText += `${e.date}  ${(e.category || "").padEnd(12)}  ${(currentPreferences.currencySymbol || "₹") + String(e.amount).padStart(8)}  ${e.title}\n`;
  });

  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-report-${dateStr}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showNotice("Comprehensive spending report downloaded.", "success");
}

function backupAllData() {
  const backup = {
    exportDate: new Date().toISOString(),
    version: "1.0.0",
    profile: currentProfile,
    preferences: currentPreferences,
    notifications: currentNotifications,
    security: currentSecurity,
    categories: currentCategories,
    expenses: window.allExpenses || []
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showNotice("Full data backup exported successfully.", "success");
}
