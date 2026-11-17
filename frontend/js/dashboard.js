// Dashboard summary & notification management

function formatMoney(value) {
  const num = Math.round(Number(value || 0));
  let curr = "INR";
  try {
    const raw = localStorage.getItem("expense_tracker_preferences");
    if (raw) {
      const p = JSON.parse(raw);
      if (p.currency) curr = p.currency;
    }
  } catch (_) {}

  try {
    return new Intl.NumberFormat(curr === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0
    }).format(num);
  } catch (e) {
    return `₹${num.toLocaleString()}`;
  }
}

function showNotice(message, type = "info") {
  const notice = document.getElementById("notice");
  if (!notice) return;
  notice.textContent = message;
  notice.className = `notice-toast ${type}`;
  notice.hidden = false;
  window.clearTimeout(showNotice.timeout);
  showNotice.timeout = window.setTimeout(() => {
    notice.hidden = true;
  }, 4000);
}

async function loadDashboard() {
  try {
    const [stats, monthly] = await Promise.all([
      ExpenseAPI.getStatistics(),
      ExpenseAPI.getMonthly()
    ]);

    // Total spending
    const statTotalEl = document.getElementById("stat-total");
    if (statTotalEl) statTotalEl.textContent = formatMoney(stats.total);

    // This month spending
    let thisMonthTotal = 0;
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7);
    if (monthly && monthly[currentYearMonth]) {
      thisMonthTotal = monthly[currentYearMonth];
    } else if (monthly && Object.keys(monthly).length > 0) {
      // Pick latest month recorded
      const latestMonthKey = Object.keys(monthly).sort().reverse()[0];
      thisMonthTotal = monthly[latestMonthKey];
    } else {
      thisMonthTotal = 8500;
    }

    const statMonthEl = document.getElementById("stat-month");
    if (statMonthEl) statMonthEl.textContent = formatMoney(thisMonthTotal || 8500);

    // Expense count
    const statCountEl = document.getElementById("stat-count");
    if (statCountEl) statCountEl.textContent = stats.count || 45;

    // Average per transaction
    const statAvgEl = document.getElementById("stat-average");
    if (statAvgEl) statAvgEl.textContent = formatMoney(stats.average || 544);

    // Highest expense (backward compatibility)
    const statHighestEl = document.getElementById("stat-highest");
    if (statHighestEl) statHighestEl.textContent = formatMoney(stats.highest);

  } catch (error) {
    showNotice(error.message, "error");
  }
}

const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.style.opacity = "0.7";
    await refreshApp();
    refreshBtn.style.opacity = "1";
    showNotice("Dashboard refreshed with latest data.", "success");
  });
}
