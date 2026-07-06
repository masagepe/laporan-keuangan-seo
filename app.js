// -------------------------------------------------------------
// BukuKas - State & Konfigurasi Kategori
// -------------------------------------------------------------

const CATEGORIES = {
  pemasukan: {
    gaji: { label: 'Gaji', tagClass: 'tag-gaji' },
    investasi: { label: 'Investasi', tagClass: 'tag-investasi' },
    freelance: { label: 'Freelance', tagClass: 'tag-freelance' },
    lainnya: { label: 'Lainnya', tagClass: 'tag-lainnya' }
  },
  pengeluaran: {
    makanan: { label: 'Makanan & Minuman', tagClass: 'tag-makanan' },
    transportasi: { label: 'Transportasi', tagClass: 'tag-transportasi' },
    belanja: { label: 'Belanja', tagClass: 'tag-belanja' },
    tagihan: { label: 'Tagihan & Listrik', tagClass: 'tag-tagihan' },
    hiburan: { label: 'Hiburan', tagClass: 'tag-hiburan' },
    lainnya: { label: 'Lainnya', tagClass: 'tag-lainnya' }
  }
};

let transactions = [];
let isEditing = false;
let editId = null;

// -------------------------------------------------------------
// Cache DOM Elements
// -------------------------------------------------------------

const DOM = {
  themeToggle: document.getElementById('theme-toggle'),
  totalBalance: document.getElementById('total-balance'),
  balanceStatus: document.getElementById('balance-status'),
  totalIncome: document.getElementById('total-income'),
  incomePercentage: document.getElementById('income-percentage'),
  totalExpense: document.getElementById('total-expense'),
  expensePercentage: document.getElementById('expense-percentage'),
  
  trendChartContainer: document.getElementById('trend-chart-container'),
  categoryChartContainer: document.getElementById('category-chart-container'),
  
  transactionForm: document.getElementById('transaction-form'),
  formActionTitle: document.getElementById('form-action-title'),
  transactionId: document.getElementById('transaction-id'),
  typeRadios: document.getElementsByName('type'),
  amountInput: document.getElementById('amount'),
  dateInput: document.getElementById('date'),
  categorySelect: document.getElementById('category'),
  descriptionInput: document.getElementById('description'),
  btnSubmitForm: document.getElementById('btn-submit-form'),
  btnCancelEdit: document.getElementById('btn-cancel-edit'),
  
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnTriggerImport: document.getElementById('btn-trigger-import'),
  fileImportCsv: document.getElementById('file-import-csv'),
  
  searchFilter: document.getElementById('search-filter'),
  filterType: document.getElementById('filter-type'),
  filterCategory: document.getElementById('filter-category'),
  filterStartDate: document.getElementById('filter-start-date'),
  filterEndDate: document.getElementById('filter-end-date'),
  
  transactionListBody: document.getElementById('transaction-list-body'),
  noDataAlert: document.getElementById('no-data-alert'),
  
  // Settings & Sync Modal selectors
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  settingsModal: document.getElementById('settings-modal'),
  syncUrlInput: document.getElementById('sync-url-input'),
  syncConnectionStatus: document.getElementById('sync-connection-status'),
  syncLastTime: document.getElementById('sync-last-time'),
  syncAutoToggle: document.getElementById('sync-auto-toggle'),
  btnTestSync: document.getElementById('btn-test-sync'),
  btnForceUpload: document.getElementById('btn-force-upload')
};

// -------------------------------------------------------------
// helper Utilities
// -------------------------------------------------------------

function formatRupiah(value) {
  const number = parseInt(value, 10);
  if (isNaN(number)) return 'Rp 0';
  return 'Rp ' + number.toLocaleString('id-ID');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
}

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Format raw number from input (remove dots/Rp)
function cleanAmountInput(val) {
  return val.replace(/[^0-9]/g, '');
}

// Format amount input as user types
DOM.amountInput.addEventListener('input', (e) => {
  let value = cleanAmountInput(e.target.value);
  if (value) {
    e.target.value = parseInt(value, 10).toLocaleString('id-ID');
  } else {
    e.target.value = '';
  }
});

// -------------------------------------------------------------
// State Management & Local Storage
// -------------------------------------------------------------

function loadTransactions() {
  const data = localStorage.getItem('bukukas_transactions');
  if (data) {
    try {
      transactions = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing localStorage transactions', e);
      transactions = [];
    }
  } else {
    // Dummy Data untuk visualisasi awal
    transactions = [
      { id: '1', type: 'pemasukan', amount: 5000000, date: getOffsetDate(-6), category: 'gaji', description: 'Gaji Bulanan' },
      { id: '2', type: 'pengeluaran', amount: 350000, date: getOffsetDate(-5), category: 'belanja', description: 'Belanja Mingguan' },
      { id: '3', type: 'pengeluaran', amount: 80000, date: getOffsetDate(-4), category: 'makanan', description: 'Makan siang bareng tim' },
      { id: '4', type: 'pemasukan', amount: 1200000, date: getOffsetDate(-3), category: 'freelance', description: 'Desain Landing Page' },
      { id: '5', type: 'pengeluaran', amount: 450000, date: getOffsetDate(-2), category: 'tagihan', description: 'Listrik & Wifi' },
      { id: '6', type: 'pengeluaran', amount: 150000, date: getOffsetDate(-1), category: 'transportasi', description: 'Bensin & Tol' },
      { id: '7', type: 'pengeluaran', amount: 120000, date: getOffsetDate(0), category: 'hiburan', description: 'Tiket Bioskop & Snack' }
    ];
    saveTransactions();
  }
}

function getOffsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function saveTransactions() {
  localStorage.setItem('bukukas_transactions', JSON.stringify(transactions));
}

// -------------------------------------------------------------
// UI Rendering - Form & Selects
// -------------------------------------------------------------

function populateCategories(type, selectElement) {
  selectElement.innerHTML = '';
  const list = CATEGORIES[type];
  for (const key in list) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = list[key].label;
    selectElement.appendChild(option);
  }
}

function populateFilterCategories() {
  DOM.filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';
  // Gabungkan semua kategori
  const allCats = {};
  Object.assign(allCats, CATEGORIES.pemasukan, CATEGORIES.pengeluaran);
  
  for (const key in allCats) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = allCats[key].label;
    DOM.filterCategory.appendChild(option);
  }
}

// Handle Type Radio Toggle
DOM.typeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    // Update active label UI styling
    document.querySelectorAll('.form-group-toggle .toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    e.target.parentElement.classList.add('active');
    
    // Update categories
    populateCategories(e.target.value, DOM.categorySelect);
  });
});

// -------------------------------------------------------------
// UI Rendering - Dashboard Stats
// -------------------------------------------------------------

function renderDashboard() {
  let income = 0;
  let expense = 0;
  
  transactions.forEach(t => {
    if (t.type === 'pemasukan') income += t.amount;
    else expense += t.amount;
  });
  
  const balance = income - expense;
  
  // Render values
  animateNumber(DOM.totalBalance, balance, true);
  animateNumber(DOM.totalIncome, income);
  animateNumber(DOM.totalExpense, expense);
  
  // Balance status message
  DOM.balanceStatus.className = 'status-indicator';
  if (balance >= 0) {
    if (income > 0 && expense / income > 0.8) {
      DOM.balanceStatus.classList.add('warning');
      DOM.balanceStatus.textContent = 'Pengeluaran kritis (>80% Pemasukan)';
    } else {
      DOM.balanceStatus.classList.add('safe');
      DOM.balanceStatus.textContent = 'Kondisi Keuangan Sehat';
    }
  } else {
    DOM.balanceStatus.classList.add('danger');
    DOM.balanceStatus.textContent = 'Defisit Saldo (Minus)';
  }

  // Monthly or general percentage helper
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Pemasukan bulan ini dibanding bulan lalu (Dummy comparison/percentage)
  const thisMonthIncome = transactions
    .filter(t => t.type === 'pemasukan' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (income > 0) {
    DOM.incomePercentage.textContent = `Kontribusi bulan ini: ${formatRupiah(thisMonthIncome)}`;
  } else {
    DOM.incomePercentage.textContent = 'Belum ada pemasukan';
  }
  
  // Pengeluaran dibanding pemasukan
  if (income > 0) {
    const ratio = Math.round((expense / income) * 100);
    DOM.expensePercentage.textContent = `${ratio}% dari total pemasukan`;
    if (ratio > 80) {
      DOM.expensePercentage.className = 'status-trend negative';
    } else if (ratio > 50) {
      DOM.expensePercentage.className = 'status-trend';
      DOM.expensePercentage.style.color = 'var(--color-warning)';
    } else {
      DOM.expensePercentage.className = 'status-trend positive';
    }
  } else {
    DOM.expensePercentage.textContent = '0% dari pemasukan';
    DOM.expensePercentage.className = 'status-trend';
  }
}

// Animate numbers for wow effect
function animateNumber(element, endVal, isBalance = false) {
  let startVal = parseInt(element.textContent.replace(/[^0-9-]/g, ''), 10) || 0;
  if (isBalance && element.textContent.includes('Minus')) {
    startVal = -startVal;
  }
  
  const duration = 800; // ms
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out quad formula
    const easeProgress = progress * (2 - progress);
    const currentVal = Math.round(startVal + (endVal - startVal) * easeProgress);
    
    element.textContent = (currentVal < 0 ? '- ' : '') + formatRupiah(Math.abs(currentVal));
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

// -------------------------------------------------------------
// UI Rendering - SVG Charts
// -------------------------------------------------------------

function renderCharts() {
  renderTrendChart();
  renderCategoryChart();
}

function renderTrendChart() {
  DOM.trendChartContainer.innerHTML = '';
  
  // Cari data 7 hari terakhir
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    last7Days.push(getOffsetDate(-i));
  }
  
  // Hitung pemasukan dan pengeluaran per hari
  const dailyData = last7Days.map(dateStr => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.date === dateStr) {
        if (t.type === 'pemasukan') inc += t.amount;
        else exp += t.amount;
      }
    });
    return { date: dateStr, income: inc, expense: exp };
  });
  
  // Tentukan skala grafik
  const maxVal = Math.max(...dailyData.map(d => Math.max(d.income, d.expense)), 500000); // minimal skala 500rb
  
  const width = DOM.trendChartContainer.clientWidth || 550;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  // Koordinat titik data
  const pointsInc = [];
  const pointsExp = [];
  
  dailyData.forEach((d, idx) => {
    const x = padding.left + (idx * (chartW / (dailyData.length - 1)));
    const yInc = padding.top + chartH - (d.income / maxVal * chartH);
    const yExp = padding.top + chartH - (d.expense / maxVal * chartH);
    pointsInc.push({ x, y: yInc, val: d.income });
    pointsExp.push({ x, y: yExp, val: d.expense });
  });
  
  // Helper membuat path
  function makePath(points) {
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }
  
  function makeAreaPath(points) {
    if (points.length === 0) return '';
    const start = `M ${points[0].x} ${padding.top + chartH}`;
    const lines = points.map(p => `L ${p.x} ${p.y}`).join(' ');
    const end = `L ${points[points.length - 1].x} ${padding.top + chartH} Z`;
    return `${start} ${lines} ${end}`;
  }
  
  const pathInc = makePath(pointsInc);
  const pathExp = makePath(pointsExp);
  const areaInc = makeAreaPath(pointsInc);
  const areaExp = makeAreaPath(pointsExp);
  
  // Grid lines
  let gridLines = '';
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const y = padding.top + (i * (chartH / gridCount));
    const valLabel = Math.round(maxVal - (i * (maxVal / gridCount))).toLocaleString('id-ID');
    gridLines += `
      <line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />
      <text class="chart-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${valLabel}</text>
    `;
  }
  
  // Axis tanggal
  let axisDates = '';
  dailyData.forEach((d, idx) => {
    const p = pointsInc[idx];
    const dateObj = new Date(d.date);
    const formattedD = dateObj.getDate() + '/' + (dateObj.getMonth() + 1);
    axisDates += `
      <text class="chart-label" x="${p.x}" y="${height - padding.bottom + 20}" text-anchor="middle">${formattedD}</text>
    `;
  });
  
  // Points (bulatan interaktif)
  let circlePoints = '';
  pointsInc.forEach(p => {
    circlePoints += `<circle class="chart-point income" cx="${p.x}" cy="${p.y}" r="4" title="${formatRupiah(p.val)}"><title>Pemasukan: ${formatRupiah(p.val)}</title></circle>`;
  });
  pointsExp.forEach(p => {
    circlePoints += `<circle class="chart-point expense" cx="${p.x}" cy="${p.y}" r="4" title="${formatRupiah(p.val)}"><title>Pengeluaran: ${formatRupiah(p.val)}</title></circle>`;
  });
  
  const svgHtml = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
        </linearGradient>
        <linearGradient id="area-grad-expense" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-danger)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--color-danger)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      
      <!-- Grid -->
      ${gridLines}
      
      <!-- Axis tanggal -->
      ${axisDates}
      
      <!-- Axis Lines -->
      <line class="chart-axis-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" />
      <line class="chart-axis-line" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" />
      
      <!-- Areas -->
      <path class="chart-area" d="${areaInc}" />
      <path class="chart-area-expense" d="${areaExp}" />
      
      <!-- Lines -->
      <path class="chart-line" d="${pathInc}" />
      <path class="chart-line-expense" d="${pathExp}" />
      
      <!-- Interaktif Points -->
      ${circlePoints}
    </svg>
  `;
  DOM.trendChartContainer.innerHTML = svgHtml;
}

function renderCategoryChart() {
  DOM.categoryChartContainer.innerHTML = '';
  
  // Kelompokkan pengeluaran
  const expenseTransactions = transactions.filter(t => t.type === 'pengeluaran');
  const totalExp = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  if (totalExp === 0) {
    DOM.categoryChartContainer.innerHTML = '<div class="no-data-view"><p>Belum ada data pengeluaran untuk dibuat grafik.</p></div>';
    return;
  }
  
  const categoryTotals = {};
  expenseTransactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  // Warnai setiap kategori pengeluaran
  const catColors = {
    makanan: '#f59e0b',
    transportasi: '#06b6d4',
    belanja: '#ec4899',
    tagihan: '#6366f1',
    hiburan: '#a855f7',
    lainnya: '#6b7280'
  };
  
  // Urutkan kategori dari terbesar
  const sortedCategories = Object.keys(categoryTotals).map(key => {
    return {
      key,
      label: CATEGORIES.pengeluaran[key]?.label || key,
      value: categoryTotals[key],
      percentage: Math.round((categoryTotals[key] / totalExp) * 100),
      color: catColors[key] || '#6b7280'
    };
  }).sort((a, b) => b.value - a.value);
  
  // Kalkulasi koordinat lingkaran SVG Donut
  const size = 180;
  const radius = 60;
  const strokeW = 16;
  const center = size / 2;
  const circ = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  let slicesSvg = '';
  
  sortedCategories.forEach(cat => {
    const strokeDash = (cat.value / totalExp) * circ;
    const offset = circ - currentOffset;
    slicesSvg += `
      <circle class="donut-slice" cx="${center}" cy="${center}" r="${radius}"
              fill="transparent" stroke="${cat.color}" stroke-width="${strokeW}"
              stroke-dasharray="${strokeDash} ${circ}" stroke-dashoffset="${offset}"
              transform="rotate(-90 ${center} ${center})">
        <title>${cat.label}: ${formatRupiah(cat.value)} (${cat.percentage}%)</title>
      </circle>
    `;
    currentOffset += strokeDash;
  });
  
  // SVG Donut
  const donutHtml = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <!-- Inner text -->
      <circle cx="${center}" cy="${center}" r="${radius - strokeW/2}" fill="var(--bg-card)" />
      ${slicesSvg}
      <text class="donut-text-title" x="${center}" y="${center - 5}">Total Belanja</text>
      <text class="donut-text-value" x="${center}" y="${center + 15}">${formatRupiah(totalExp)}</text>
    </svg>
  `;
  
  // Legend HTML
  let legendHtml = '<div class="legend-container">';
  sortedCategories.forEach(cat => {
    legendHtml += `
      <div class="legend-item" title="${formatRupiah(cat.value)}">
        <span class="legend-color" style="background-color: ${cat.color}"></span>
        <span style="flex-grow: 1;">${cat.label}</span>
        <strong style="color: var(--text-primary); margin-left: 10px;">${cat.percentage}%</strong>
      </div>
    `;
  });
  legendHtml += '</div>';
  
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'chart-with-legend';
  chartWrapper.innerHTML = donutHtml + legendHtml;
  
  DOM.categoryChartContainer.appendChild(chartWrapper);
}

// -------------------------------------------------------------
// UI Rendering - Transaction List Table
// -------------------------------------------------------------

function renderTransactionList() {
  const filterTypeVal = DOM.filterType.value;
  const filterCatVal = DOM.filterCategory.value;
  const searchVal = DOM.searchFilter.value.toLowerCase().trim();
  const startDateVal = DOM.filterStartDate.value;
  const endDateVal = DOM.filterEndDate.value;
  
  // Lakukan Penyaringan
  const filtered = transactions.filter(t => {
    // Tipe filter
    if (filterTypeVal !== 'all' && t.type !== filterTypeVal) return false;
    
    // Kategori filter
    if (filterCatVal !== 'all' && t.category !== filterCatVal) return false;
    
    // Cari teks keterangan
    if (searchVal && !t.description.toLowerCase().includes(searchVal)) return false;
    
    // Filter rentang tanggal
    if (startDateVal && t.date < startDateVal) return false;
    if (endDateVal && t.date > endDateVal) return false;
    
    return true;
  });
  
  // Urutkan berdasarkan tanggal descending (terbaru di atas)
  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id); // secondary sorting
  });
  
  // Bersihkan tabel
  DOM.transactionListBody.innerHTML = '';
  
  if (filtered.length === 0) {
    DOM.noDataAlert.classList.remove('hidden');
    return;
  }
  DOM.noDataAlert.classList.add('hidden');
  
  filtered.forEach(t => {
    const row = document.createElement('tr');
    
    // Label kategori dan gaya badge tag
    const catGroup = CATEGORIES[t.type];
    const catDetails = catGroup[t.category] || { label: t.category, tagClass: 'tag-lainnya' };
    
    const amountClass = t.type === 'pemasukan' ? 'income' : 'expense';
    const amountSign = t.type === 'pemasukan' ? '+' : '-';
    
    row.innerHTML = `
      <td class="trans-date">${formatDate(t.date)}</td>
      <td>
        <span class="category-tag ${catDetails.tagClass}">${catDetails.label}</span>
      </td>
      <td class="trans-desc" title="${t.description}">${t.description || '-'}</td>
      <td class="text-right amount-val ${amountClass}">${amountSign} ${formatRupiah(t.amount)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-row-action edit" onclick="editTransaction('${t.id}')" title="Edit Transaksi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-row-action delete" onclick="deleteTransaction('${t.id}')" title="Hapus Transaksi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    `;
    DOM.transactionListBody.appendChild(row);
  });
}

// -------------------------------------------------------------
// Transaction Actions (Add, Edit, Delete)
// -------------------------------------------------------------

DOM.transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const id = DOM.transactionId.value;
  const type = document.querySelector('input[name="type"]:checked').value;
  const rawAmount = cleanAmountInput(DOM.amountInput.value);
  const amount = parseInt(rawAmount, 10);
  const date = DOM.dateInput.value;
  const category = DOM.categorySelect.value;
  const description = DOM.descriptionInput.value.trim();
  
  if (isNaN(amount) || amount <= 0) {
    alert('Masukkan nominal transaksi yang valid.');
    return;
  }
  
  if (!date) {
    alert('Masukkan tanggal transaksi.');
    return;
  }
  
  if (isEditing && id) {
    // Mode Edit: Update data
    const idx = transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      transactions[idx] = { id, type, amount, date, category, description };
    }
    resetForm();
  } else {
    // Mode Baru: Add data
    const newTrans = {
      id: generateId(),
      type,
      amount,
      date,
      category,
      description
    };
    transactions.push(newTrans);
    resetForm();
  }
  
  saveTransactions();
  updateUI();
  uploadToCloud(false);
});

window.editTransaction = function(id) {
  const trans = transactions.find(t => t.id === id);
  if (!trans) return;
  
  isEditing = true;
  editId = id;
  
  DOM.formActionTitle.textContent = 'Edit Transaksi';
  DOM.transactionId.value = trans.id;
  
  // Set type radio
  DOM.typeRadios.forEach(radio => {
    if (radio.value === trans.type) {
      radio.checked = true;
      radio.parentElement.classList.add('active');
    } else {
      radio.checked = false;
      radio.parentElement.classList.remove('active');
    }
  });
  
  // Repopulate categories options for this type
  populateCategories(trans.type, DOM.categorySelect);
  
  DOM.amountInput.value = trans.amount.toLocaleString('id-ID');
  DOM.dateInput.value = trans.date;
  DOM.categorySelect.value = trans.category;
  DOM.descriptionInput.value = trans.description;
  
  DOM.btnSubmitForm.textContent = 'Perbarui Transaksi';
  DOM.btnCancelEdit.classList.remove('hidden');
  
  // Scroll to form on mobile view
  DOM.transactionForm.scrollIntoView({ behavior: 'smooth' });
};

window.deleteTransaction = function(id) {
  if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
    transactions = transactions.filter(t => t.id !== id);
    if (isEditing && editId === id) {
      resetForm();
    }
    saveTransactions();
    updateUI();
    uploadToCloud(false);
  }
};

DOM.btnCancelEdit.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  isEditing = false;
  editId = null;
  
  DOM.transactionForm.reset();
  DOM.transactionId.value = '';
  DOM.formActionTitle.textContent = 'Tambah Transaksi Baru';
  DOM.btnSubmitForm.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    Simpan Transaksi
  `;
  DOM.btnCancelEdit.classList.add('hidden');
  
  // Set defaults: Type Pemasukan, default date Today
  DOM.typeRadios[0].checked = true;
  DOM.typeRadios[0].parentElement.classList.add('active');
  DOM.typeRadios[1].parentElement.classList.remove('active');
  
  populateCategories('pemasukan', DOM.categorySelect);
  setDefaultDate();
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  DOM.dateInput.value = today;
}

// -------------------------------------------------------------
// Filters & Live Searches
// -------------------------------------------------------------

function setupFilters() {
  const triggerFilter = () => {
    renderTransactionList();
  };
  
  DOM.searchFilter.addEventListener('input', triggerFilter);
  DOM.filterType.addEventListener('change', triggerFilter);
  DOM.filterCategory.addEventListener('change', triggerFilter);
  DOM.filterStartDate.addEventListener('change', triggerFilter);
  DOM.filterEndDate.addEventListener('change', triggerFilter);
}

// -------------------------------------------------------------
// Data Export & Import (CSV)
// -------------------------------------------------------------

DOM.btnExportCsv.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert('Tidak ada transaksi untuk diekspor.');
    return;
  }
  
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'ID,Type,Amount,Date,Category,Description\n';
  
  transactions.forEach(t => {
    // Sanitasi deskripsi untuk menghindari koma/kutip merusak CSV
    const cleanDesc = (t.description || '').replace(/"/g, '""');
    csvContent += `"${t.id}","${t.type}",${t.amount},"${t.date}","${t.category}","${cleanDesc}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `bukukas_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

DOM.btnTriggerImport.addEventListener('click', () => {
  DOM.fileImportCsv.click();
});

DOM.fileImportCsv.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    const lines = text.split('\n');
    
    if (lines.length < 2) {
      alert('File CSV kosong atau tidak valid.');
      return;
    }
    
    // validasi header sederhana
    const header = lines[0].trim().toLowerCase();
    if (!header.includes('type') || !header.includes('amount') || !header.includes('date')) {
      alert('Struktur kolom CSV tidak didukung. Pastikan memiliki header: ID,Type,Amount,Date,Category,Description');
      return;
    }
    
    const importedTransactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // parsing baris CSV sederhana dengan pembatas koma dan toleransi kutip ganda
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      if (matches.length < 5) continue;
      
      const cleanField = (str) => (str || '').replace(/^["']|["']$/g, '').trim();
      
      const id = cleanField(matches[0]) || generateId();
      const type = cleanField(matches[1]).toLowerCase();
      const amount = parseInt(cleanField(matches[2]), 10);
      const date = cleanField(matches[3]);
      const category = cleanField(matches[4]).toLowerCase();
      const description = cleanField(matches[5]) || '';
      
      if ((type === 'pemasukan' || type === 'pengeluaran') && !isNaN(amount) && date) {
        importedTransactions.push({ id, type, amount, date, category, description });
      }
    }
    
    if (importedTransactions.length > 0) {
      if (confirm(`Berhasil membaca ${importedTransactions.length} transaksi. Apakah Anda ingin menggabungkannya ke data saat ini?`)) {
        // Gabungkan transaksi tanpa duplikasi ID
        importedTransactions.forEach(imp => {
          const existsIdx = transactions.findIndex(t => t.id === imp.id);
          if (existsIdx !== -1) {
            transactions[existsIdx] = imp;
          } else {
            transactions.push(imp);
          }
        });
        saveTransactions();
        updateUI();
        uploadToCloud(false);
        alert('Impor data sukses.');
      }
    } else {
      alert('Tidak menemukan baris transaksi yang valid di file CSV.');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // reset file input
});

// -------------------------------------------------------------
// Cloud Sync (Google Sheets) Integration
// -------------------------------------------------------------

let syncUrl = localStorage.getItem('bukukas_sync_url') || '';
let syncAuto = localStorage.getItem('bukukas_sync_auto') === 'true';

function initSyncUI() {
  DOM.syncUrlInput.value = syncUrl;
  DOM.syncAutoToggle.checked = syncAuto;
  
  if (syncUrl) {
    DOM.syncConnectionStatus.className = 'sync-badge online';
    DOM.syncConnectionStatus.textContent = 'Terhubung';
    DOM.btnForceUpload.removeAttribute('disabled');
  } else {
    DOM.syncConnectionStatus.className = 'sync-badge offline';
    DOM.syncConnectionStatus.textContent = 'Tidak Terhubung';
    DOM.btnForceUpload.setAttribute('disabled', 'true');
  }
  
  const lastSync = localStorage.getItem('bukukas_last_sync_time');
  DOM.syncLastTime.textContent = lastSync ? lastSync : '-';
}

// Modal open/close
DOM.btnOpenSettings.addEventListener('click', () => {
  initSyncUI();
  DOM.settingsModal.classList.remove('hidden');
});

DOM.btnCloseSettings.addEventListener('click', () => {
  DOM.settingsModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
  if (e.target === DOM.settingsModal) {
    DOM.settingsModal.classList.add('hidden');
  }
});

// Save settings when changed
DOM.syncUrlInput.addEventListener('change', () => {
  syncUrl = DOM.syncUrlInput.value.trim();
  localStorage.setItem('bukukas_sync_url', syncUrl);
  initSyncUI();
});

DOM.syncAutoToggle.addEventListener('change', () => {
  syncAuto = DOM.syncAutoToggle.checked;
  localStorage.setItem('bukukas_sync_auto', syncAuto ? 'true' : 'false');
});

// Fetch/Pull Data from Cloud
async function fetchFromCloud(isSilent = false) {
  if (!syncUrl) return false;
  
  if (!isSilent) {
    DOM.syncConnectionStatus.className = 'sync-badge loading';
    DOM.syncConnectionStatus.textContent = 'Menghubungkan...';
    DOM.btnTestSync.setAttribute('disabled', 'true');
    DOM.btnForceUpload.setAttribute('disabled', 'true');
  }
  
  try {
    const response = await fetch(syncUrl);
    if (!response.ok) throw new Error('Koneksi jaringan bermasalah');
    
    const result = await response.json();
    if (result.status === 'success') {
      const cloudData = result.data || [];
      
      // Jika data lokal berbeda dengan cloud, perbarui
      if (JSON.stringify(transactions) !== JSON.stringify(cloudData)) {
        transactions = cloudData;
        saveTransactions();
        updateUI();
      }
      
      const nowStr = new Date().toLocaleTimeString('id-ID') + ' ' + new Date().toLocaleDateString('id-ID');
      localStorage.setItem('bukukas_last_sync_time', nowStr);
      
      DOM.syncConnectionStatus.className = 'sync-badge online';
      DOM.syncConnectionStatus.textContent = 'Terhubung';
      DOM.syncLastTime.textContent = nowStr;
      DOM.btnForceUpload.removeAttribute('disabled');
      
      if (!isSilent) {
        alert('Data berhasil diunduh dari Google Sheets.');
      }
      return true;
    } else {
      throw new Error(result.message || 'Kesalahan dari Google Apps Script');
    }
  } catch (err) {
    console.error('Fetch cloud data error:', err);
    DOM.syncConnectionStatus.className = 'sync-badge offline';
    DOM.syncConnectionStatus.textContent = 'Offline / Gagal';
    
    if (!isSilent) {
      alert('Gagal memuat data dari Google Sheets. Periksa URL Anda.\nDetail: ' + err.message);
    }
    return false;
  } finally {
    DOM.btnTestSync.removeAttribute('disabled');
  }
}

// Upload/Push Data to Cloud
async function uploadToCloud(isForce = false) {
  if (!syncUrl) return false;
  if (!syncAuto && !isForce) return false;
  
  if (isForce) {
    DOM.syncConnectionStatus.className = 'sync-badge loading';
    DOM.syncConnectionStatus.textContent = 'Mengunggah...';
    DOM.btnForceUpload.setAttribute('disabled', 'true');
    DOM.btnTestSync.setAttribute('disabled', 'true');
  }
  
  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain' // Menggunakan simple request untuk menghindari preflight OPTIONS CORS
      },
      body: JSON.stringify(transactions)
    });
    
    if (!response.ok) throw new Error('Gagal melakukan POST ke Google Sheet');
    
    const result = await response.json();
    if (result.status === 'success') {
      const nowStr = new Date().toLocaleTimeString('id-ID') + ' ' + new Date().toLocaleDateString('id-ID');
      localStorage.setItem('bukukas_last_sync_time', nowStr);
      
      DOM.syncConnectionStatus.className = 'sync-badge online';
      DOM.syncConnectionStatus.textContent = 'Terhubung';
      DOM.syncLastTime.textContent = nowStr;
      DOM.btnForceUpload.removeAttribute('disabled');
      
      if (isForce) {
        alert('Data lokal berhasil diunggah ke Google Sheets.');
      }
      return true;
    } else {
      throw new Error(result.message || 'Kesalahan dari Google Apps Script');
    }
  } catch (err) {
    console.error('Upload cloud data error:', err);
    DOM.syncConnectionStatus.className = 'sync-badge offline';
    DOM.syncConnectionStatus.textContent = 'Gagal Mengunggah';
    
    if (isForce) {
      alert('Gagal mengunggah data ke Google Sheets.\nDetail: ' + err.message);
    }
    return false;
  } finally {
    DOM.btnTestSync.removeAttribute('disabled');
    DOM.btnForceUpload.removeAttribute('disabled');
  }
}

// Attach manual buttons click handlers
DOM.btnTestSync.addEventListener('click', () => {
  fetchFromCloud(false);
});

DOM.btnForceUpload.addEventListener('click', () => {
  if (confirm('Apakah Anda yakin ingin menimpa seluruh data di Google Sheets dengan data lokal perangkat ini?')) {
    uploadToCloud(true);
  }
});

// -------------------------------------------------------------
// Dark & Light Mode Theme Toggle
// -------------------------------------------------------------

DOM.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('bukukas_theme', isDark ? 'dark' : 'light');
});

function initTheme() {
  const savedTheme = localStorage.getItem('bukukas_theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.add('dark-mode');
  }
}

// -------------------------------------------------------------
// Initialization & Update Loop
// -------------------------------------------------------------

function updateUI() {
  renderDashboard();
  renderTransactionList();
  renderCharts();
}

function init() {
  initTheme();
  loadTransactions();
  
  // Populate category lists
  populateCategories('pemasukan', DOM.categorySelect);
  populateFilterCategories();
  
  setDefaultDate();
  setupFilters();
  
  // Initial render
  updateUI();
  
  // Redraw charts on window resize to ensure responsive SVG width
  window.addEventListener('resize', () => {
    renderCharts();
  });
  
  // Tarik data terbaru secara silent dari Google Sheet jika terkonfigurasi
  if (syncUrl) {
    fetchFromCloud(true);
  }
}

// Start Application
window.addEventListener('DOMContentLoaded', init);
