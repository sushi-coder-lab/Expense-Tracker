// Expense management, Modal controller, Recent transactions list & View routing

let allExpenses = [];
let activeDropdownId = null;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDateDisplay(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate + "T00:00:00");
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch (e) {
    return isoDate;
  }
}

// Category icons for recent transactions
function getCategoryIconSvg(category) {
  const cat = (category || "").toLowerCase();
  if (cat === "food") {
    return `
      <div class="category-icon-circle cat-food-bg">
        <svg class="cat-food-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
          <line x1="15" x2="15" y1="11" y2="22"/>
          <path d="M4 2v20"/>
          <path d="M4 7h4a2 2 0 0 0 2-2V2"/>
        </svg>
      </div>`;
  }
  if (cat === "travel") {
    return `
      <div class="category-icon-circle cat-travel-bg">
        <svg class="cat-travel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>`;
  }
  if (cat === "shopping") {
    return `
      <div class="category-icon-circle cat-shopping-bg">
        <svg class="cat-shopping-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <line x1="3" x2="21" y1="6" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>`;
  }
  if (cat === "bills") {
    return `
      <div class="category-icon-circle cat-bills-bg">
        <svg class="cat-bills-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <line x1="7" x2="17" y1="8" y2="8"/>
          <line x1="7" x2="17" y1="12" y2="12"/>
          <line x1="7" x2="13" y1="16" y2="16"/>
        </svg>
      </div>`;
  }
  // Default / Other
  return `
    <div class="category-icon-circle cat-other-bg">
      <svg class="cat-other-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" x2="12" y1="8" y2="12"/>
        <line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>
    </div>`;
}

function getCategoryPillClass(category) {
  const cat = (category || "").toLowerCase();
  if (cat === "food") return "pill-food";
  if (cat === "travel") return "pill-travel";
  if (cat === "shopping") return "pill-shopping";
  if (cat === "bills") return "pill-bills";
  return "pill-other";
}

async function loadExpenses() {
  try {
    allExpenses = await ExpenseAPI.getExpenses();
    window.allExpenses = allExpenses;
    renderExpenses();
    renderRecentTransactions();
  } catch (error) {
    const table = document.getElementById("expenses-table");
    if (table) table.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHTML(error.message)}</td></tr>`;
    showNotice(error.message, "error");
  }
}

/**
 * Render the 3-5 latest expenses on the Dashboard matching mockup
 */
function renderRecentTransactions() {
  const container = document.getElementById("recent-transactions-container");
  if (!container) return;

  const sorted = [...allExpenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const recent = sorted.slice(0, 4);

  if (!recent.length) {
    container.innerHTML = '<p class="muted" style="padding: 16px 0;">No transactions yet. Click "+ Add New Expense" to get started.</p>';
    return;
  }

  container.innerHTML = recent.map(item => `
    <div class="recent-item" data-id="${item.id}">
      <div class="recent-item-left">
        ${getCategoryIconSvg(item.category)}
        <div class="item-details">
          <span class="item-title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</span>
          <span class="cat-pill ${getCategoryPillClass(item.category)}">${escapeHTML(item.category)}</span>
        </div>
      </div>
      <div class="recent-item-right">
        <span class="item-amount">-${formatMoney(item.amount)}</span>
        <span class="item-date">${formatDateDisplay(item.date)}</span>
        <button class="item-menu-btn" data-action="toggle-menu" data-id="${item.id}" title="Options" aria-label="Transaction options">⋮</button>
      </div>
      <div class="actions-dropdown" id="dropdown-${item.id}" hidden>
        <button class="dropdown-action-btn" data-action="edit" data-id="${item.id}">✏️ Edit</button>
        <button class="dropdown-action-btn delete-text" data-action="delete" data-id="${item.id}">🗑️ Delete</button>
      </div>
    </div>
  `).join("");
}

/**
 * Render the full table in the All Expenses view
 */
function renderExpenses() {
  const searchInput = document.getElementById("search-input");
  const search = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const category = document.getElementById("filter-category") ? document.getElementById("filter-category").value : "";
  const date = document.getElementById("filter-date") ? document.getElementById("filter-date").value : "";

  const filtered = allExpenses.filter(expense => {
    const text = `${expense.title} ${expense.notes || ""}`.toLowerCase();
    return (!search || text.includes(search)) &&
      (!category || expense.category === category) &&
      (!date || expense.date === date);
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const tbody = document.getElementById("expenses-table");
  const countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = `${filtered.length} expense${filtered.length === 1 ? "" : "s"}`;

  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No expenses match your search or filters.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(expense => `
    <tr>
      <td>
        <strong>${escapeHTML(expense.title)}</strong>
        ${expense.notes ? `<span class="expense-subtitle">${escapeHTML(expense.notes)}</span>` : ""}
      </td>
      <td><span class="cat-pill ${getCategoryPillClass(expense.category)}">${escapeHTML(expense.category)}</span></td>
      <td>${formatDateDisplay(expense.date)}</td>
      <td class="amount-cell">-${formatMoney(expense.amount)}</td>
      <td class="text-right">
        <div class="action-group">
          <button class="action-btn" data-action="edit" data-id="${expense.id}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${expense.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* ==========================================================================
   MODAL CONTROLS (ADD & EDIT EXPENSE)
   ========================================================================== */
function openExpenseModal(expenseToEdit = null) {
  const modal = document.getElementById("expense-modal");
  const form = document.getElementById("expense-form");
  if (!modal || !form) return;

  if (expenseToEdit) {
    document.getElementById("form-heading").textContent = "Edit Expense";
    document.getElementById("submit-btn").textContent = "Update expense";
    document.getElementById("expense-id").value = expenseToEdit.id;
    document.getElementById("title").value = expenseToEdit.title;
    document.getElementById("amount").value = expenseToEdit.amount;
    document.getElementById("category").value = expenseToEdit.category;
    document.getElementById("date").value = expenseToEdit.date;
    document.getElementById("notes").value = expenseToEdit.notes || "";
  } else {
    document.getElementById("form-heading").textContent = "Add an expense";
    document.getElementById("submit-btn").textContent = "Save expense";
    form.reset();
    document.getElementById("expense-id").value = "";
    document.getElementById("date").value = localToday();
    try {
      const prefs = JSON.parse(localStorage.getItem("expense_tracker_preferences") || "{}");
      if (prefs.defaultCategory) {
        document.getElementById("category").value = prefs.defaultCategory;
      }
    } catch (_) {}
  }

  modal.hidden = false;
  setTimeout(() => document.getElementById("title").focus(), 50);
}

function closeExpenseModal() {
  const modal = document.getElementById("expense-modal");
  if (modal) modal.hidden = true;
  closeAllDropdowns();
}

function closeAllDropdowns() {
  document.querySelectorAll(".actions-dropdown").forEach(el => el.hidden = true);
  activeDropdownId = null;
}

/* ==========================================================================
   VIEW ROUTING / TAB SWITCHING
   ========================================================================== */
function switchView(viewName) {
  document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  if (viewName === "dashboard") {
    document.getElementById("view-dashboard")?.classList.add("active");
    document.getElementById("nav-dashboard")?.classList.add("active");
  } else if (viewName === "expenses") {
    document.getElementById("view-expenses")?.classList.add("active");
    document.getElementById("nav-expenses")?.classList.add("active");
    renderExpenses();
  } else if (viewName === "analytics") {
    document.getElementById("view-analytics-page")?.classList.add("active");
    document.getElementById("nav-analytics")?.classList.add("active");
    loadReports();
  } else if (viewName === "settings") {
    document.getElementById("view-settings-page")?.classList.add("active");
    document.getElementById("nav-settings")?.classList.add("active");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function refreshApp() {
  await Promise.all([loadExpenses(), loadDashboard(), loadReports()]);
}
window.refreshApp = refreshApp;

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").value = localToday();
  refreshApp();

  // Initial hash routing or view setting
  const initialHash = window.location.hash.replace("#", "");
  if (["settings", "expenses", "analytics", "dashboard"].includes(initialHash)) {
    switchView(initialHash);
  }

  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "");
    if (["settings", "expenses", "analytics", "dashboard"].includes(hash)) {
      switchView(hash);
    }
  });

  // Navigation menu clicks
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      window.location.hash = view;
      switchView(view);
    });
  });

  // Sidebar "Add Expense"
  document.getElementById("nav-add-expense")?.addEventListener("click", () => openExpenseModal());

  // Quick Action Buttons
  document.getElementById("qa-add-expense")?.addEventListener("click", () => openExpenseModal());
  document.getElementById("btn-add-from-view")?.addEventListener("click", () => openExpenseModal());
  document.getElementById("qa-view-all")?.addEventListener("click", () => switchView("expenses"));
  document.getElementById("link-view-all")?.addEventListener("click", () => switchView("expenses"));
  document.getElementById("qa-view-analytics")?.addEventListener("click", () => switchView("analytics"));

  // Modal close buttons
  document.getElementById("modal-close-x")?.addEventListener("click", closeExpenseModal);
  document.getElementById("cancel-edit-btn")?.addEventListener("click", closeExpenseModal);
  document.getElementById("expense-modal")?.addEventListener("click", e => {
    if (e.target.id === "expense-modal") closeExpenseModal();
  });

  // Top Search Input syncing
  const topSearch = document.getElementById("top-search-input");
  const mainSearch = document.getElementById("search-input");
  if (topSearch && mainSearch) {
    topSearch.addEventListener("input", e => {
      mainSearch.value = e.target.value;
      if (!document.getElementById("view-expenses")?.classList.contains("active")) {
        switchView("expenses");
      }
      renderExpenses();
    });
    topSearch.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        switchView("expenses");
      }
    });
  }

  // Filter change events
  ["search-input", "filter-category", "filter-date"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderExpenses);
  });

  document.getElementById("clear-filters")?.addEventListener("click", () => {
    if (mainSearch) mainSearch.value = "";
    if (topSearch) topSearch.value = "";
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-date").value = "";
    renderExpenses();
  });

  // Upgrade Pro Button click
  document.getElementById("upgrade-btn")?.addEventListener("click", () => {
    showNotice("You are already enjoying the Pro features!", "info");
  });

  // Notification button
  document.getElementById("notif-btn")?.addEventListener("click", () => {
    showNotice("All systems operating smoothly. No alerts.", "info");
  });

  // Profile dropdown
  document.getElementById("profile-dropdown-btn")?.addEventListener("click", () => {
    switchView("settings");
  });

  // Close dropdowns on outside click
  document.addEventListener("click", e => {
    if (!e.target.closest(".recent-item") && !e.target.closest(".item-menu-btn")) {
      closeAllDropdowns();
    }
  });

  // Global listener for Action Buttons (Recent items & Table items)
  document.body.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    if (action === "toggle-menu") {
      event.stopPropagation();
      const dropdown = document.getElementById(`dropdown-${id}`);
      const isVisible = dropdown && !dropdown.hidden;
      closeAllDropdowns();
      if (dropdown && !isVisible) {
        dropdown.hidden = false;
        activeDropdownId = id;
      }
      return;
    }

    const expense = allExpenses.find(item => item.id === id);
    if (!expense) return;

    if (action === "edit") {
      closeAllDropdowns();
      openExpenseModal(expense);
    } else if (action === "delete") {
      closeAllDropdowns();
      if (!window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) return;
      try {
        await ExpenseAPI.deleteExpense(id);
        showNotice("Expense deleted successfully.", "success");
        await refreshApp();
      } catch (error) {
        showNotice(error.message, "error");
      }
    }
  });

  // Form submit handler
  document.getElementById("expense-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const id = document.getElementById("expense-id").value;
    const payload = {
      title: document.getElementById("title").value.trim(),
      amount: Number(document.getElementById("amount").value),
      category: document.getElementById("category").value,
      date: document.getElementById("date").value,
      notes: document.getElementById("notes").value.trim()
    };

    if (!payload.title || !payload.category || !payload.date || !Number.isFinite(payload.amount) || payload.amount <= 0) {
      showNotice("Please enter a title, valid category, positive amount and date.", "error");
      return;
    }

    const submit = document.getElementById("submit-btn");
    submit.disabled = true;
    try {
      if (id) {
        await ExpenseAPI.updateExpense(id, payload);
        showNotice("Expense updated successfully.", "success");
      } else {
        await ExpenseAPI.createExpense(payload);
        showNotice("Expense recorded successfully.", "success");
      }
      closeExpenseModal();
      await refreshApp();
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });

  // CSV Export
  document.getElementById("export-btn")?.addEventListener("click", () => {
    const headers = ["id", "title", "amount", "category", "date", "notes"];
    const csvCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [headers.join(","), ...allExpenses.map(item => headers.map(key => csvCell(item[key])).join(","))];
    const blob = new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-tracker-export-${localToday()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Expenses exported to CSV.", "success");
  });
});
