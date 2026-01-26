// script.js - Restoration function completely removed
// API Configuration is loaded from config.js
// corsProxyFetch helper is also loaded from config.js

let calculationHistory = JSON.parse(localStorage.getItem('steamCalculatorHistory')) || [];
let currentCalculation = null;
let autoCalculateTimeout = null;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Deals variables
let currentDeals = [];
let dealsLoading = false;

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    // Apply dark mode if enabled
    if (darkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeButton();
    }
    
    updateGameFields();
    loadHistory();
    setupEventListeners();
    initializeTaxPresets();
    calculateTotal();
    initializeDealsFilters();
    loadDeals();
    
    // Update current tax display
    updateTaxDisplay();
    updateTotalGamesCount();
});

function setupEventListeners() {
    const taxRateInput = document.getElementById('taxRateSlider');
    const gameCountInput = document.getElementById('gameCount');
    
    taxRateInput.addEventListener('input', function() {
        updateTaxDisplay();
        triggerAutoCalculate();
    });
    
    gameCountInput.addEventListener('input', function() {
        let value = parseInt(this.value) || 1;
        // Enforce limits: minimum 1, maximum 50
        if (value < 1) value = 1;
        if (value > 50) value = 50;
        this.value = value;
    });
    
    gameCountInput.addEventListener('change', function() {
        this.classList.add('game-count-changing');
        setTimeout(() => {
            this.classList.remove('game-count-changing');
        }, 300);
        updateTotalGamesCount();
        updateGameFields();
    });
    
    gameCountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            updateGameFields();
        }
    });
    
    // Setup tax preset buttons
    document.querySelectorAll('.tax-preset').forEach(button => {
        button.addEventListener('click', function() {
            const taxRate = parseFloat(this.dataset.tax);
            document.getElementById('taxRateSlider').value = taxRate;
            
            // Update active state
            document.querySelectorAll('.tax-preset').forEach(btn => 
                btn.classList.remove('active'));
            this.classList.add('active');
            
            updateTaxDisplay();
            triggerAutoCalculate();
        });
    });
}

function updateTaxDisplay() {
    const taxRate = document.getElementById('taxRateSlider').value;
    document.getElementById('currentTax').textContent = `${taxRate}%`;
    document.getElementById('taxRateDisplay').textContent = `${taxRate}%`;
}

function updateTotalGamesCount() {
    const count = parseInt(document.getElementById('gameCount').value) || 1;
    document.getElementById('totalGames').textContent = `Total: ${count} game${count !== 1 ? 's' : ''}`;
}

function triggerAutoCalculate() {
    if (autoCalculateTimeout) {
        clearTimeout(autoCalculateTimeout);
    }
    
    autoCalculateTimeout = setTimeout(() => {
        calculateTotal();
        updatePerGameBreakdown();
    }, 200);
}

function initializeTaxPresets() {
    // Set default active preset
    const defaultPreset = document.querySelector('.tax-preset[data-tax="8"]');
    if (defaultPreset) {
        defaultPreset.classList.add('active');
    }
}

function changeGameCount(delta) {
    const gameCountInput = document.getElementById('gameCount');
    let currentValue = parseInt(gameCountInput.value) || 1;
    const newValue = Math.max(1, Math.min(50, currentValue + delta));
    gameCountInput.value = newValue;
    
    gameCountInput.classList.add('game-count-changing');
    setTimeout(() => {
        gameCountInput.classList.remove('game-count-changing');
    }, 300);
    
    updateTotalGamesCount();
    updateGameFields();
}

function updateGameFields() {
    const count = parseInt(document.getElementById("gameCount").value) || 1;
    const container = document.getElementById("gameInputs");
    
    // Get current values before clearing
    const currentValues = [];
    const currentInputs = container.querySelectorAll('input');
    currentInputs.forEach(input => {
        currentValues.push(input.value);
    });
    
    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const gameDiv = document.createElement("div");
        gameDiv.className = "game-input";
        gameDiv.dataset.index = i;
        
        const label = document.createElement("label");
        label.textContent = `Game ${i + 1}`;
        label.htmlFor = `gamePrice${i}`;
        
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "decimal";
        input.pattern = "[0-9]*\\.?[0-9]*";
        input.value = i < currentValues.length ? currentValues[i] : "";
        input.id = `gamePrice${i}`;
        input.placeholder = `Enter price`;
        input.dataset.index = i;
        
        // Enhanced input handling
        input.addEventListener('input', function(e) {
            // Clean input
            this.value = this.value.replace(/[^0-9.]/g, '');
            
            // Limit decimal places
            const parts = this.value.split('.');
            if (parts.length > 2) {
                this.value = parts[0] + '.' + parts.slice(1).join('');
            }
            if (parts.length === 2 && parts[1].length > 2) {
                this.value = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            // Visual feedback
            if (this.value && parseFloat(this.value) > 0) {
                this.style.borderColor = "var(--success)";
                this.style.boxShadow = "0 0 0 2px rgba(46, 204, 113, 0.1)";
            } else {
                this.style.borderColor = "";
                this.style.boxShadow = "";
            }
            
            updatePricedGamesCount();
            toggleSaveButton();
            triggerAutoCalculate();
        });
        
        input.addEventListener('blur', function() {
            if (this.value && !isNaN(parseFloat(this.value))) {
                const value = parseFloat(this.value);
                this.value = value.toFixed(2);
            } else if (this.value === '' || this.value === '.') {
                this.value = '';
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const nextIndex = parseInt(this.dataset.index) + 1;
                const nextInput = document.getElementById(`gamePrice${nextIndex}`);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        });
        
        gameDiv.appendChild(label);
        gameDiv.appendChild(input);
        container.appendChild(gameDiv);
    }

    updatePricedGamesCount();
    updateTotalGamesCount();
    toggleSaveButton();
    triggerAutoCalculate();
}

function updatePricedGamesCount() {
    const inputs = document.querySelectorAll("#gameInputs input");
    let pricedCount = 0;
    let totalValue = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        if (value > 0) {
            pricedCount++;
            totalValue += value;
        }
    });
    
    document.getElementById("pricedGamesCount").textContent = 
        `${pricedCount} game${pricedCount !== 1 ? 's' : ''} priced`;
    
    return { count: pricedCount, total: totalValue };
}

function toggleSaveButton() {
    const inputs = document.querySelectorAll("#gameInputs input");
    const saveBtn = document.getElementById("saveBtn");

    const hasPrice = Array.from(inputs).some(
        input => parseFloat(input.value) > 0
    );

    saveBtn.disabled = !hasPrice;
}

function calculateTotal() {
    const taxRate = parseFloat(document.getElementById("taxRateSlider").value) / 100;
    const inputs = document.querySelectorAll("#gameInputs input");

    let subtotal = 0;
    let count = 0;
    let gamePrices = [];

    inputs.forEach(input => {
        const price = parseFloat(input.value) || 0;
        if (price > 0) {
            subtotal += price;
            count++;
            gamePrices.push({
                index: parseInt(input.dataset.index),
                price: price.toFixed(2),
                name: `Game ${parseInt(input.dataset.index) + 1}`
            });
        }
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Update display
    updateResultValue("subtotal", subtotal);
    updateResultValue("tax", tax);
    updateResultValue("total", total);
    
    document.getElementById("itemCount").textContent = count;
    
    // Store current calculation
    currentCalculation = {
        timestamp: new Date().toISOString(),
        taxRate: taxRate * 100,
        subtotal: subtotal,
        tax: tax,
        total: total,
        count: count,
        gamePrices: gamePrices
    };
    
    return currentCalculation;
}

function updateResultValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    const formattedValue = `$${newValue.toFixed(2)}`;
    
    if (element.textContent !== formattedValue) {
        element.classList.add('value-updating');
        element.textContent = formattedValue;
        
        setTimeout(() => {
            element.classList.remove('value-updating');
        }, 300);
    }
}

function updatePerGameBreakdown() {
    const breakdownContainer = document.getElementById('perGameBreakdown');
    const taxRate = parseFloat(document.getElementById("taxRateSlider").value) / 100;
    const inputs = document.querySelectorAll("#gameInputs input");
    
    let html = '';
    let hasGames = false;
    
    inputs.forEach(input => {
        const price = parseFloat(input.value) || 0;
        if (price > 0) {
            hasGames = true;
            const gameTax = price * taxRate;
            const gameTotal = price + gameTax;
            
            html += `
                <div class="breakdown-item">
                    <span>Game ${parseInt(input.dataset.index) + 1}</span>
                    <div class="breakdown-values">
                        <span class="price">$${price.toFixed(2)}</span>
                        <span class="tax">+$${gameTax.toFixed(2)} tax</span>
                        <span class="total">= $${gameTotal.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
    });
    
    if (!hasGames) {
        html = `
            <div class="empty-breakdown">
                <i class="fas fa-info-circle"></i>
                <p>Enter game prices to see per-game breakdown</p>
            </div>
        `;
    }
    
    breakdownContainer.innerHTML = html;
}

function saveToHistory() {
    if (!currentCalculation || currentCalculation.total === 0) {
        showNotification("Please enter some game prices first!", "warning");
        return;
    }
    
    const historyItem = {
        ...currentCalculation,
        id: Date.now().toString(),
        date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    calculationHistory.unshift(historyItem);
    
    // Keep only last 15 calculations
    if (calculationHistory.length > 15) {
        calculationHistory = calculationHistory.slice(0, 15);
    }
    
    localStorage.setItem('steamCalculatorHistory', JSON.stringify(calculationHistory));
    loadHistory();
    
    showNotification("Calculation saved to history!", "success");
}

function loadHistory() {
    const historyList = document.getElementById("historyList");
    const historyCount = document.getElementById("historyCount");
    
    historyCount.textContent = calculationHistory.length;
    
    if (calculationHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clock"></i>
                <p>No calculations yet</p>
                <p class="subtext">Your saved calculations will appear here</p>
            </div>
        `;
        return;
    }
    
    // RESTORATION FUNCTION COMPLETELY REMOVED - Only show history items
    historyList.innerHTML = calculationHistory.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
                <div class="history-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${item.date}
                </div>
                <div class="history-total">$${item.total.toFixed(2)}</div>
            </div>
            <div class="history-item-details">
                <span><i class="fas fa-gamepad"></i> ${item.count} games</span>
                <span><i class="fas fa-percentage"></i> ${item.taxRate.toFixed(1)}% tax</span>
                <button class="history-delete-btn" onclick="deleteHistoryItem('${item.id}')" title="Delete this calculation">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    if (calculationHistory.length === 0) {
        showNotification("History is already empty", "info");
        return;
    }
    
    if (confirm("Are you sure you want to clear all history?")) {
        calculationHistory = [];
        localStorage.removeItem('steamCalculatorHistory');
        loadHistory();
        showNotification("History cleared", "info");
    }
}

function deleteHistoryItem(itemId) {
    calculationHistory = calculationHistory.filter(item => item.id !== itemId);
    localStorage.setItem('steamCalculatorHistory', JSON.stringify(calculationHistory));
    loadHistory();
    showNotification("Calculation deleted", "info");
}

function clearAllPrices() {
    const inputs = document.querySelectorAll("#gameInputs input");
    inputs.forEach(input => {
        input.value = "";
        input.style.borderColor = "";
        input.style.boxShadow = "";
    });
    toggleSaveButton();
    updatePricedGamesCount();
    calculateTotal();
    updatePerGameBreakdown();
    showNotification("All prices cleared", "info");
}

function resetCalculator() {
    if (confirm("Reset calculator to default settings?")) {
        document.getElementById("taxRateSlider").value = "8";
        document.getElementById("gameCount").value = "1";
        
        // Update tax preset
        document.querySelectorAll('.tax-preset').forEach(btn => 
            btn.classList.remove('active'));
        document.querySelector('.tax-preset[data-tax="8"]').classList.add('active');
        
        // Animate game count
        const gameCountInput = document.getElementById('gameCount');
        gameCountInput.classList.add('game-count-changing');
        setTimeout(() => {
            gameCountInput.classList.remove('game-count-changing');
        }, 300);
        
        updateTaxDisplay();
        updateTotalGamesCount();
        clearAllPrices();
        updateGameFields();
        showNotification("Calculator reset to default", "info");
    }
}

function copyToClipboard() {
    const total = document.getElementById("total").textContent;
    const items = document.getElementById("itemCount").textContent;
    const subtotal = document.getElementById("subtotal").textContent;
    const tax = document.getElementById("tax").textContent;
    const taxRate = document.getElementById("taxRateDisplay").textContent;
    
    const textToCopy = `Steam Price Calculator Results:
Total: ${total}
Items: ${items} games
Subtotal: ${subtotal}
Tax (${taxRate}): ${tax}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification("Results copied to clipboard!", "success");
    }).catch(err => {
        showNotification("Failed to copy: " + err, "danger");
    });
}

function fillSampleData() {
    const samplePrices = [19.99, 29.99, 14.99, 39.99, 9.99];
    const inputs = document.querySelectorAll("#gameInputs input");
    
    // Set game count to match sample data if needed
    if (inputs.length < samplePrices.length) {
        document.getElementById("gameCount").value = samplePrices.length;
        updateGameFields();
        // Need to requery inputs after updating
        setTimeout(() => fillSampleData(), 100);
        return;
    }
    
    inputs.forEach((input, index) => {
        if (index < samplePrices.length) {
            input.value = samplePrices[index].toFixed(2);
            input.style.borderColor = "var(--success)";
            input.style.boxShadow = "0 0 0 2px rgba(46, 204, 113, 0.1)";
        } else {
            input.value = "";
            input.style.borderColor = "";
            input.style.boxShadow = "";
        }
    });
    
    toggleSaveButton();
    updatePricedGamesCount();
    calculateTotal();
    showNotification("Sample data loaded", "success");
}

function updateDarkModeButton() {
    const button = document.querySelector('[onclick="toggleDarkMode()"]');
    if (button) {
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        
        if (darkMode) {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkMode);
    
    updateDarkModeButton();
    
    if (darkMode) {
        showNotification("Dark mode enabled", "success");
    } else {
        showNotification("Light mode enabled", "success");
    }
}

function exportToCSV() {
    const inputs = document.querySelectorAll("#gameInputs input");
    const taxRate = parseFloat(document.getElementById("taxRateSlider").value);
    
    let csvContent = "Game,Price,Tax,Total\n";
    let gameNumber = 1;
    
    inputs.forEach(input => {
        const price = parseFloat(input.value) || 0;
        if (price > 0) {
            const tax = price * (taxRate / 100);
            const total = price + tax;
            
            csvContent += `Game ${gameNumber},$${price.toFixed(2)},$${tax.toFixed(2)},$${total.toFixed(2)}\n`;
            gameNumber++;
        }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steam_calculator_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification("Data exported as CSV", "success");
}

function printSummary() {
    if (!currentCalculation || currentCalculation.total === 0) {
        showNotification("Please enter some game prices first!", "warning");
        return;
    }
    
    const taxRate = parseFloat(document.getElementById("taxRateSlider").value);
    
    let printContent = `
    <html>
    <head>
        <title>Steam Price Calculator Summary</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 40px;
                background-color: #f5f5f5;
            }
            .print-container {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                max-width: 600px;
                margin: 0 auto;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 {
                color: #00adee;
                text-align: center;
                margin-bottom: 10px;
            }
            .timestamp {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-bottom: 30px;
            }
            .summary-section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid #00adee;
            }
            .summary-section h2 {
                margin-top: 0;
                color: #333;
                font-size: 16px;
            }
            .game-list {
                list-style: none;
                padding: 0;
            }
            .game-list li {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
            }
            .game-list li:last-child {
                border-bottom: none;
            }
            .totals {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 2px solid #00adee;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                font-size: 16px;
                font-weight: bold;
            }
            .total-row.grand-total {
                font-size: 20px;
                color: #00adee;
            }
            @media print {
                body {
                    background-color: white;
                    padding: 0;
                }
                .print-container {
                    box-shadow: none;
                    max-width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div class="print-container">
            <h1>🎮 Steam Price Calculator Summary</h1>
            <div class="timestamp">${new Date().toLocaleString()}</div>
            
            <div class="summary-section">
                <h2>Game Prices</h2>
                <ul class="game-list">`;
    
    currentCalculation.gamePrices.forEach((game, index) => {
        const tax = parseFloat(game.price) * (taxRate / 100);
        const total = parseFloat(game.price) + tax;
        printContent += `
                    <li>
                        <span>${game.name}</span>
                        <span>$${parseFloat(game.price).toFixed(2)}</span>
                    </li>`;
    });
    
    printContent += `
                </ul>
            </div>
            
            <div class="summary-section">
                <h2>Calculation Summary</h2>
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>$${currentCalculation.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (${taxRate}%):</span>
                        <span>$${currentCalculation.tax.toFixed(2)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Total Amount:</span>
                        <span>$${currentCalculation.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
    
    const printWindow = window.open('', '', 'width=600,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
    
    showNotification("Print preview opened", "success");
}

function toggleHistoryView() {
    const historyList = document.getElementById('historyList');
    historyList.classList.toggle('compact-view');
}

function showNotification(message, type = "info") {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'danger' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : type === 'danger' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);

// ===== DEALS SECTION =====
// ===== DEALS SECTION WITH REAL API INTEGRATION =====

// Cache for deals data
let dealsCache = {
    data: [],
    timestamp: 0,
    ttl: 3600000 // 1 hour cache
};

// Search cache
let gameSearchCache = [];
let searchTimeout = null;

// Initialize deals filter buttons
function initializeDealsFilters() {
    document.querySelectorAll('.deals-filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.deals-filter-btn').forEach(btn => 
                btn.classList.remove('active'));
            this.classList.add('active');
            filterDeals(this.dataset.platform);
        });
    });
    
    // Setup sort dropdown
    const dealsSort = document.getElementById('dealsSort');
    if (dealsSort) {
        dealsSort.addEventListener('change', function() {
            sortDeals(this.value);
        });
    }
    
    // Setup game search
    const gameSearchInput = document.getElementById('gameSearchInput');
    if (gameSearchInput) {
        gameSearchInput.addEventListener('input', function(e) {
            handleGameSearch(e.target.value);
        });
        
        gameSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchGamesByName(this.value);
            }
        });
    }
}

// Handle game search with autocomplete
function handleGameSearch(query) {
    clearTimeout(searchTimeout);
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (!query.trim()) {
        suggestionsDiv.innerHTML = '';
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        try {
            const suggestions = await fetchGameSuggestions(query);
            displaySearchSuggestions(suggestions, query);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

// Fetch game suggestions from RAWG API
async function fetchGameSuggestions(query) {
    try {
        const rawgUrl = appConfig.getRawgUrl();
        const rawgKey = appConfig.getRawgApiKey();
        
        if (!rawgKey || rawgKey === '') {
            console.warn('RAWG API key not configured. Please set RAWG_API_KEY in .env');
            return [];
        }
        
        const response = await fetch(
            `${rawgUrl}/games?search=${encodeURIComponent(query)}&page_size=8&key=${rawgKey}`
        );
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        // Map RAWG response to expected format
        return (data.results || []).map(game => ({
            id: game.id,
            title: game.name,
            displayTitle: game.name,
            image: game.background_image,
            rating: game.rating,
            platforms: game.platforms || []
        }));
    } catch (error) {
        console.error('RAWG game suggestion error:', error);
        return [];
    }
}

// Display search suggestions
function displaySearchSuggestions(games, query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (!games || games.length === 0) {
        suggestionsDiv.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>No games found for "${query}"</p>
            </div>
        `;
        return;
    }
    
    suggestionsDiv.innerHTML = games.map((game, index) => {
        const gameTitle = game.displayTitle || game.title || game.name;
        const gameID = game.id || index;
        const gameName = gameTitle.replace(/'/g, "\\'");
        const gameImage = game.image ? `style="background-image: url('${game.image}'); background-size: cover; background-position: center;"` : '';
        const rating = game.rating ? ` ★${game.rating.toFixed(1)}` : '';
        
        return `
            <div class="search-suggestion-item" onclick="lookupGamePrices('${gameName}', ${gameID})">
                <div ${gameImage} style="width: 40px; height: 40px; border-radius: 3px; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                    <span class="suggestion-title">${gameTitle}</span>
                    <span class="suggestion-id" style="display: none;">${gameID}</span>
                    ${rating ? `<div style="font-size: 12px; color: #999; margin-top: 2px;">${rating}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Lookup game prices (when clicking suggestion)
async function lookupGamePrices(gameName, gameID) {
    const searchInput = document.getElementById('gameSearchInput');
    if (searchInput) {
        searchInput.value = gameName;
    }
    
    // Hide suggestions
    document.getElementById('searchSuggestions').innerHTML = '';
    
    // Show loading - use searchResultsList if it exists
    const resultsList = document.getElementById('searchResultsList') || document.getElementById('dealsList');
    resultsList.innerHTML = `
        <div class="loading-deals">
            <div class="spinner"></div>
            <p>Looking up game details and prices for "${gameName}"...</p>
        </div>
    `;
    
    try {
        // Fetch game details from RAWG
        const rawgUrl = appConfig.getRawgUrl();
        const rawgKey = appConfig.getRawgApiKey();
        
        if (!rawgKey) {
            throw new Error('RAWG API key not configured');
        }
        
        const gameDetailsResponse = await fetch(
            `${rawgUrl}/games/${gameID}?key=${rawgKey}`
        );
        
        if (!gameDetailsResponse.ok) throw new Error('Failed to fetch game details');
        const gameDetails = await gameDetailsResponse.json();
        
        // Try to fetch prices from Steam direct API
        let pricesData = [];
        
        // Priority 1: Steam API for Steam prices
        try {
            const steamPrices = await fetchSteamPrices(gameName);
            if (steamPrices && steamPrices.length > 0) {
                pricesData.push(...steamPrices);
            }
        } catch (e) {
            console.warn('Could not fetch Steam prices:', e);
        }
        
        // Priority 2: GOG API
        try {
            const gogPrices = await fetchGogPrices(gameName);
            if (gogPrices && gogPrices.length > 0) {
                pricesData.push(...gogPrices);
            }
        } catch (e) {
            console.warn('Could not fetch GOG prices:', e);
        }
        
        displayGamePricesLookup(gameName, gameID, gameDetails, pricesData);
        
    } catch (error) {
        console.error('Price lookup error:', error);
        resultsList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Couldn't fetch details for "${gameName}"</p>
                <p class="subtext">You can add this game and enter the price manually</p>
                <button class="deals-btn" onclick="addGameManual('${gameName}')" style="margin-top: 15px;">
                    <i class="fas fa-plus-circle"></i>
                    Add "${gameName}" to Calculator
                </button>
                <button class="deals-btn" onclick="clearGameSearch()" style="margin-top: 10px;">
                    <i class="fas fa-redo"></i>
                    Clear Search
                </button>
            </div>
        `;
    }
}

// Add game from search results to calculator
// Search games by name (filter deals)
function searchGamesByName(gameName) {
    const searchInput = document.getElementById('gameSearchInput');
    if (searchInput) {
        searchInput.value = gameName;
    }
    
    // Hide suggestions
    document.getElementById('searchSuggestions').innerHTML = '';
    
    // Filter current deals by game name
    const allDeals = document.querySelectorAll('.deal-item');
    let matchCount = 0;
    
    allDeals.forEach(deal => {
        const title = deal.querySelector('.deal-title').textContent.toLowerCase();
        if (title.includes(gameName.toLowerCase())) {
            deal.style.display = 'block';
            matchCount++;
        } else {
            deal.style.display = 'none';
        }
    });
    
    // If no deals found, fetch game price from direct APIs
    if (matchCount === 0) {
        fetchGamePrice(gameName);
    }
}

// Fetch game price from direct store APIs
async function fetchGamePrice(gameName) {
    const dealsList = document.getElementById('dealsList');
    dealsList.innerHTML = `
        <div class="loading-deals">
            <div class="spinner"></div>
            <p>Fetching prices for "${gameName}"...</p>
        </div>
    `;
    
    try {
        // Try to fetch prices from Steam and GOG only
        const [steamPrices, gogPrices] = await Promise.all([
            fetchSteamPrices(gameName),
            fetchGogPrices(gameName)
        ]);
        
        const allPrices = [
            ...steamPrices.map(p => ({...p, storeName: 'Steam'})),
            ...gogPrices.map(p => ({...p, storeName: 'GOG'}))
        ];
        
        if (allPrices.length === 0) {
            throw new Error('Game not found on any store');
        }
        
        displayGamePricesLookup(gameName, null, null, allPrices);
        
    } catch (error) {
        console.error('Price fetch error:', error);
        dealsList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Prices not available for "${gameName}"</p>
                <p class="subtext">You can add this game and enter the price manually</p>
                <button class="deals-btn" onclick="addGameFromSearch('${gameName}', 0)" style="margin-top: 15px;">
                    <i class="fas fa-plus-circle"></i>
                    Add "${gameName}" to Calculator
                </button>
                <button class="deals-btn" onclick="clearGameSearch()" style="margin-top: 10px;">
                    <i class="fas fa-redo"></i>
                    Clear Search
                </button>
            </div>
        `;
    }
}

// Fetch Steam prices from Steam Web API
async function fetchSteamPrices(gameName) {
    try {
        // Use CORS proxy to bypass browser CORS policy
        const steamSearchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`;
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(steamSearchUrl)}`;
        
        const response = await fetch(corsProxyUrl);
        const searchData = await response.json();
        
        if (!searchData || searchData.length === 0) {
            console.log(`No Steam results found for: ${gameName}`);
            return [];
        }
        
        const appId = searchData[0].appid;
        console.log(`Found Steam app ID ${appId} for ${gameName}`);
        
        // Get app details via CORS proxy
        const steamDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        const corsDetailsUrl = `https://corsproxy.io/?${encodeURIComponent(steamDetailsUrl)}`;
        
        const detailResponse = await fetch(corsDetailsUrl);
        const detailData = await detailResponse.json();
        
        if (!detailData || !detailData[appId]?.success) {
            console.log(`Could not fetch details for app ID ${appId}`);
            return [];
        }
        
        const appData = detailData[appId].data;
        
        // Extract pricing information
        if (!appData.price_overview) {
            console.log(`No pricing data available for ${gameName}`);
            return [];
        }
        
        const pricing = appData.price_overview;
        const finalPrice = pricing.final / 100;
        const initialPrice = pricing.initial / 100;
        const discount = pricing.discount || 0;
        
        return [{
            shop: { name: 'Steam' },
            price: finalPrice,
            regular: initialPrice,
            url: `https://store.steampowered.com/app/${appId}`,
            discount: discount,
            active: 1,
            source: 'steam'
        }];
    } catch (error) {
        console.warn('Steam API fetch error:', error);
        return [];
    }
}

// Fetch GOG prices - Not available without authentication
async function fetchGogPrices(gameName) {
    // GOG API restricted - not available
    return [];
}


function displayGamePricesLookup(gameName, gameID, gameDetails, pricesData) {
    // Use searchResultsList for search tab, dealsList otherwise
    const resultsList = document.getElementById('searchResultsList') || document.getElementById('dealsList');
    
    // Store configurations with icons and colors
    const storeConfigs = {
        'steam': { name: 'Steam', icon: 'fab fa-steam', color: '#1B2838' },
        'gog': { name: 'GOG', icon: 'fas fa-gamepad', color: '#86328C' },
        'ubisoft': { name: 'Ubisoft+', icon: 'fas fa-play-circle', color: '#002841' },
        'xbox': { name: 'Xbox Game Pass', icon: 'fab fa-xbox', color: '#107C10' },
        'humble': { name: 'Humble Bundle', icon: 'fas fa-gift', color: '#D67D3A' },
        'fanatical': { name: 'Fanatical', icon: 'fas fa-star', color: '#FF6B35' }
    };
    
    // Group prices by store
    const storeMap = {};
    Object.keys(storeConfigs).forEach(key => {
        storeMap[key] = { ...storeConfigs[key], prices: [] };
    });
    
    if (pricesData && pricesData.length > 0) {
        pricesData.forEach(shop => {
            const shopName = (shop.shop && shop.shop.name) ? shop.shop.name.toLowerCase() : '';
            let storeKey = null;
            
            // Match store name to store key
            if (shopName.includes('steam')) {
                storeKey = 'steam';
            } else if (shopName.includes('gog') || shopName.includes('good old games')) {
                storeKey = 'gog';
            } else if (shopName.includes('ubisoft')) {
                storeKey = 'ubisoft';
            } else if (shopName.includes('xbox') || shopName.includes('microsoft')) {
                storeKey = 'xbox';
            } else if (shopName.includes('humble')) {
                storeKey = 'humble';
            } else if (shopName.includes('fanatical') || shopName.includes('bundlestars')) {
                storeKey = 'fanatical';
            }
            
            // Only add if we have valid pricing data
            if (storeKey && shop.price !== undefined && shop.regular !== undefined) {
                const currentPrice = parseFloat(shop.price);
                const normalPrice = parseFloat(shop.regular);
                
                // Only add if prices are valid and positive
                if (currentPrice >= 0 && normalPrice > 0 && currentPrice <= normalPrice) {
                    storeMap[storeKey].prices.push({
                        price: currentPrice,
                        originalPrice: normalPrice,
                        discount: Math.round((1 - currentPrice / normalPrice) * 100),
                        url: shop.url || '#',
                        drm: shop.drm || [],
                        shopName: shop.shop?.name || storeConfigs[storeKey].name
                    });
                }
            }
        });
    }
    
    // Filter stores that have valid prices
    const storesWithPrices = Object.keys(storeMap)
        .filter(key => storeMap[key].prices.length > 0)
        .sort((a, b) => {
            // Sort by best price
            const priceA = Math.min(...storeMap[a].prices.map(p => p.price));
            const priceB = Math.min(...storeMap[b].prices.map(p => p.price));
            return priceA - priceB;
        });
    
    // Determine which stores don't have pricing data (to show search links)
    const storesWithoutPrices = Object.keys(storeMap)
        .filter(key => storeMap[key].prices.length === 0)
        .filter(key => key !== 'gog'); // Remove GOG from search links - only show if game is available
    
    // Display prices per store
    let htmlContent = '';
    
    if (storesWithPrices.length === 0) {
        // No prices found, show search links for available stores only
        htmlContent = `
            <div class="deal-item no-price">
                <div class="deal-header">
                    <h3 class="deal-title">${gameName}</h3>
                </div>
                
                <div class="deal-meta">
                    <p style="margin: 0; font-size: 13px; color: #999;">
                        <i class="fas fa-info-circle"></i>
                        Price data unavailable. Search stores:
                    </p>
                </div>
                
                <div class="deal-details" style="gap: 8px;">
                    <a href="javascript:openSteamGame('${gameName}')" class="deal-btn" style="text-decoration: none; flex: 1;">
                        <i class="fab fa-steam"></i> Steam
                    </a>
                </div>
                
                <div class="deal-details">
                    <button class="deal-btn quick-add" onclick="addGameManual('${gameName}')" style="flex: 1;">
                        <i class="fas fa-plus-circle"></i> Add Manually
                    </button>
                </div>
            </div>
        `;
    } else {
        // Display all stores with prices, sorted by best price
        storesWithPrices.forEach(storeKey => {
            const store = storeMap[storeKey];
            const bestPrice = store.prices.reduce((min, p) => p.price < min.price ? p : min);
            
            htmlContent += `
                <div class="deal-item">
                    <div class="deal-header">
                        <h3 class="deal-title">${gameName}</h3>
                        <span class="deal-discount${bestPrice.discount > 20 ? ' hot-deal' : ''}">${bestPrice.discount > 0 ? '-' + bestPrice.discount + '%' : 'Full Price'}</span>
                    </div>
                    
                    <div class="deal-meta">
                        <div class="store-badge steam" style="background-color: #1b2838; border: 2px solid #66c0f4; color: #66c0f4; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-weight: 600;">
                            <i class="fab fa-steam" style="font-size: 1.2rem;"></i> ${store.name}
                        </div>
                    </div>
                    
                    <div class="deal-details">
                        <div class="deal-prices">
                            <span class="deal-price-current">$${bestPrice.price.toFixed(2)}</span>
                            ${bestPrice.discount > 0 ? `<span class="deal-price-original">$${bestPrice.originalPrice.toFixed(2)}</span>` : ''}
                            ${bestPrice.discount > 0 ? `<div class="deal-savings">Save $${(bestPrice.originalPrice - bestPrice.price).toFixed(2)}</div>` : ''}
                        </div>
                        
                        <div class="deal-actions">
                            <button class="deal-btn quick-add" onclick="addGameWithPrice('${gameName}', ${bestPrice.price})">
                                <i class="fas fa-plus-circle"></i> Add
                            </button>
                            <a href="${bestPrice.url || '#'}" target="_blank" class="deal-btn" style="text-decoration: none;">
                                <i class="fas fa-external-link-alt"></i> View
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Don't show "Check other stores" - only show actual results with prices
    }
    
    resultsList.innerHTML = htmlContent;
}

// Add game manually without a deal
function addGameManual(gameName) {
    const inputs = document.querySelectorAll("#gameInputs input");
    let added = false;
    
    for (const input of inputs) {
        if (!input.value || input.value === '0' || input.value === '0.00') {
            input.focus();
            input.select();
            showNotification(`Added "${gameName}" - Enter price manually`, "info");
            added = true;
            break;
        }
    }
    
    if (!added) {
        const gameCountInput = document.getElementById('gameCount');
        const currentCount = parseInt(gameCountInput.value) || 1;
        if (currentCount < 50) {
            gameCountInput.value = currentCount + 1;
            updateGameFields();
            
            setTimeout(() => {
                const newInput = document.querySelector(`#gameInputs input[data-index="${currentCount}"]`);
                if (newInput) {
                    newInput.focus();
                    newInput.select();
                    showNotification(`Added "${gameName}" - Enter price manually`, "info");
                }
            }, 100);
        } else {
            showNotification("Maximum 50 games reached!", "warning");
        }
    }
    
    clearGameSearch();
}

// Add game with specific price
function addGameWithPrice(gameName, price) {
    // Find first empty game input
    const inputs = document.querySelectorAll("#gameInputs input");
    let added = false;
    
    for (const input of inputs) {
        if (!input.value || input.value === '0' || input.value === '0.00') {
            input.value = price.toFixed(2);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.style.borderColor = "var(--success)";
            input.style.boxShadow = "0 0 0 2px rgba(46, 204, 113, 0.1)";
            showNotification(`Added "${gameName}" at $${price.toFixed(2)}!`, "success");
            added = true;
            break;
        }
    }
    
    // If no empty inputs, add a new game
    if (!added) {
        const gameCountInput = document.getElementById('gameCount');
        const currentCount = parseInt(gameCountInput.value) || 1;
        if (currentCount < 50) {
            gameCountInput.value = currentCount + 1;
            updateGameFields();
            
            setTimeout(() => {
                const newInput = document.querySelector(`#gameInputs input[data-index="${currentCount}"]`);
                if (newInput) {
                    newInput.value = price.toFixed(2);
                    newInput.dispatchEvent(new Event('input', { bubbles: true }));
                    newInput.style.borderColor = "var(--success)";
                    newInput.style.boxShadow = "0 0 0 2px rgba(46, 204, 113, 0.1)";
                    showNotification(`Added "${gameName}" at $${price.toFixed(2)}!`, "success");
                }
            }, 100);
        } else {
            showNotification("Maximum 50 games reached!", "warning");
        }
    }
    
    clearGameSearch();
}

// Clear game search
function clearGameSearch() {
    const searchInput = document.getElementById('gameSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    document.getElementById('searchSuggestions').innerHTML = '';
    
    // Reload all deals
    if (currentDeals.length > 0) {
        displayDeals(currentDeals);
        sortDeals(document.getElementById('dealsSort').value);
    } else {
        loadDeals();
    }
}

// Load deals with real API
async function loadDeals(forceRefresh = false) {
    if (dealsLoading) return;
    
    dealsLoading = true;
    const dealsList = document.getElementById('dealsList');
    dealsList.innerHTML = `
        <div class="loading-deals">
            <div class="spinner"></div>
            <p>Loading current deals...</p>
        </div>
    `;
    
    try {
        // Check cache first
        const now = Date.now();
        if (!forceRefresh && dealsCache.data.length > 0 && 
            (now - dealsCache.timestamp) < dealsCache.ttl) {
            currentDeals = dealsCache.data;
            displayDeals(currentDeals);
            sortDeals(document.getElementById('dealsSort').value);
            showNotification("Deals loaded from cache!", "success");
            return;
        }
        
        console.log('Fetching fresh deals data...');
        
        // Try to use real API with your credentials
        let deals = await fetchDealsWithCredentials();
        
        // If API fails, fall back to sample data
        if (!deals || deals.length === 0) {
            console.log('API failed, using sample data');
            deals = await loadSampleDeals();
        }
        
        // Cache the results
        currentDeals = deals;
        dealsCache = {
            data: deals,
            timestamp: now,
            ttl: 3600000
        };
        
        displayDeals(deals);
        
        // Reapply current filter after displaying deals
        const activeFilterBtn = document.querySelector('.deals-filter-btn.active');
        if (activeFilterBtn) {
            const platform = activeFilterBtn.dataset.platform;
            filterDeals(platform);
        }
        
        sortDeals(document.getElementById('dealsSort').value);
        
        showNotification(`Loaded ${deals.length} current deals!`, "success");
        
    } catch (error) {
        console.error('Error loading deals:', error);
        dealsList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load deals</p>
                <p class="subtext">${error.message || 'Please try again later'}</p>
            </div>
        `;
        showNotification("Failed to load deals", "danger");
    } finally {
        dealsLoading = false;
    }
}

// Fetch real deals from Steam, Epic Games using IsThereAnyDeal API with CORS Proxy
async function fetchDealsWithCredentials() {
    try {
        console.log('🔴 Fetching REAL deals from CheapShark API...');
        
        // Try to fetch real Steam/GOG deals from CheapShark (NO AUTH NEEDED)
        // Start with smaller pageSize to avoid server issues
        let cheapsharkUrl = `${API_CONFIG.CHEAPSHARK_DEALS_URL}?pageNumber=0&pageSize=30&sortBy=Deal Rating`;
        let steamDeals = await directFetch(cheapsharkUrl);
        
        // If first request fails, try without extra parameters
        if (!steamDeals) {
            console.log('⚠️ First CheapShark request failed, trying simpler endpoint...');
            cheapsharkUrl = `${API_CONFIG.CHEAPSHARK_DEALS_URL}?pageNumber=0&pageSize=20`;
            steamDeals = await directFetch(cheapsharkUrl);
        }
        
        console.log('📊 CheapShark Steam deals:', steamDeals ? steamDeals.length : 0);
        
        // NOTE: Epic Games API requires server-side access due to CORS restrictions
        // Epic intentionally blocks browser access for security reasons
        // To include Epic deals, you would need a backend proxy or serverless function
        console.log('ℹ️ Epic Games API: Requires server-side access (browser CORS policy)');
        
        // Combine real Steam deals only
        let allDeals = [];
        
        if (Array.isArray(steamDeals)) {
            allDeals = allDeals.concat(transformCheapsharkDeals(steamDeals));
        }
        
        console.log('✅ Total REAL deals loaded:', allDeals.length);
        
        if (!allDeals || allDeals.length === 0) {
            console.log('⚠️ CheapShark API temporarily unavailable, showing sample deals');
            showNotification('CheapShark API temporarily unavailable - showing sample deals', 'warning');
            return await loadSampleDeals();
        }
        
        // Sort by discount and return top 100
        return allDeals.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0)).slice(0, 100);
        
    } catch (error) {
        console.error('Deals fetch error:', error);
        return await loadSampleDeals();
    }
}

// Transform CheapShark deals to our format
function transformCheapsharkDeals(deals) {
    if (!Array.isArray(deals)) return [];
    
    const filtered = deals.filter(deal => {
        // Only show deals with actual discounts but exclude free games (100% discount)
        const salePrice = parseFloat(deal.salePrice);
        const normalPrice = parseFloat(deal.normalPrice);
        const discount = Math.round(deal.savings);
        
        // Exclude: free games (price = 0), 100% discounts, or no savings
        return deal.savings > 0 && 
               normalPrice > 0 && 
               salePrice > 0 && 
               discount < 100;
    });
    
    // Remove edition suffixes to identify base game titles
    const getBaseTitle = (title) => {
        return title
            .replace(/\s*-\s*(Deluxe|Digital Deluxe|Ultimate|Collector's|Special|Premium|Gold|Standard|Base)\s*Edition\s*/gi, '')
            .replace(/\s*\((Deluxe|Digital Deluxe|Ultimate|Collector's|Special|Premium|Gold|Standard|Base)\s*Edition\)\s*/gi, '')
            .trim();
    };
    
    // Keep track of games we've already added (by base title) and prefer standard editions
    const seenGames = new Map();
    
    filtered.forEach(deal => {
        const baseTitle = getBaseTitle(deal.title);
        const isStandardEdition = !deal.title.includes('Deluxe') && !deal.title.includes('Ultimate') && !deal.title.includes('Collector') && !deal.title.includes('Premium') && !deal.title.includes('Gold');
        
        if (!seenGames.has(baseTitle)) {
            seenGames.set(baseTitle, { deal, isStandard: isStandardEdition });
        } else {
            // Replace if we find a standard edition
            const existing = seenGames.get(baseTitle);
            if (isStandardEdition && !existing.isStandard) {
                seenGames.set(baseTitle, { deal, isStandard: isStandardEdition });
            }
        }
    });
    
    // Convert Map back to array and transform
    return Array.from(seenGames.values())
        .filter(({ deal }) => deal.steamAppID)  // Only include deals with valid app IDs
        .map(({ deal }) => {
            // Build game slug from title
            const gameSlug = deal.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            
            // Build direct Steam store URL: https://store.steampowered.com/app/{appid}/{gamename}/
            const steamUrl = `https://store.steampowered.com/app/${deal.steamAppID}/${gameSlug}/`;
            
            return {
                id: deal.dealID,
                title: deal.title,
                price: parseFloat(deal.salePrice),
                originalPrice: parseFloat(deal.normalPrice),
                discount: Math.round(deal.savings),
                discountPercent: Math.round(deal.savings),
                platform: 'steam',
                rating: 4.5,
                metacriticScore: 75,
                thumb: deal.thumb,
                storeUrl: steamUrl,
                dealUrl: steamUrl,
                releaseDate: 2020,
                expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                dealRating: 8.0,
                storeName: 'Steam',
                storeID: '1',
                source: 'CheapShark (REAL)'
            };
        });
}

// Transform Epic free games to our format
// Fetch Steam store featured games/deals
async function fetchSteamStoreDeals() {
    try {
        const steamFeaturedUrl = 'https://store.steampowered.com/api/featured/';
        const response = await corsProxyFetch(steamFeaturedUrl);
        
        if (!response.ok) {
            console.warn('Steam API returned:', response.status);
            return [];
        }
        
        const data = await response.json();
        console.log('Steam API response:', data);
        
        // Handle different Steam API response formats
        let games = [];
        
        // Try different possible data structures
        if (data.featured_win && Array.isArray(data.featured_win)) {
            games = data.featured_win;
            console.log('Using featured_win format, found', games.length, 'games');
        } else if (data.featured && Array.isArray(data.featured)) {
            games = data.featured;
            console.log('Using featured format, found', games.length, 'games');
        } else if (data.specials && Array.isArray(data.specials)) {
            games = data.specials;
            console.log('Using specials format, found', games.length, 'games');
        } else if (Array.isArray(data)) {
            games = data;
            console.log('Using array format, found', games.length, 'games');
        } else {
            console.warn('Unknown Steam API format:', Object.keys(data));
            return [];
        }
        
        if (!Array.isArray(games) || games.length === 0) {
            console.warn('No games found in Steam API response');
            return [];
        }
        
        console.log('Processing', games.length, 'Steam games for deals');
        
        // Transform Steam data to our format
        const deals = games.slice(0, 50).filter(game => {
            // Filter for games that are actually on sale with discount
            const hasDiscount = game && game.id && game.name && 
                               game.discount_percent && game.discount_percent > 0 &&
                               game.original_price && game.original_price > 0;
            return hasDiscount;
        }).map(game => {
            const finalPrice = game.final_price || (game.original_price * (1 - game.discount_percent / 100));
            return {
                id: game.id,
                title: game.name,
                price: finalPrice / 100,
                originalPrice: game.original_price / 100,
                discount: game.discount_percent || 0,
                discountPercent: game.discount_percent || 0,
                platform: 'steam',
                rating: 4.5,
                metacriticScore: 80,
                thumb: game.header_image || '',
                storeUrl: `https://store.steampowered.com/app/${game.id}`,
                dealUrl: `https://store.steampowered.com/app/${game.id}`,
                releaseDate: 2020,
                expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                dealRating: 8.0,
                storeName: 'Steam',
                storeID: '1'
            };
        });
        
        console.log('Returning', deals.length, 'Steam deals after filtering');
        return deals;
        
    } catch (error) {
        console.warn('Steam fetch error:', error);
        return [];
    }
}

// Fetch Epic Games free/discounted games
async function fetchEpicGamesDeals() {
    try {
        const epicUrl = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions';
        const response = await corsProxyFetch(epicUrl);
        
        if (!response) return [];
        
        const data = response;
        if (!data.data || !Array.isArray(data.data)) return [];
        
        const games = data.data;
        
        // Filter for discounted games and transform to our format
        return games.slice(0, 20).map(game => ({
                id: game.id,
                title: game.title,
                price: game.price?.totalPrice?.discountPrice || 0,
                originalPrice: game.price?.totalPrice?.originalPrice || 29.99,
                discount: Math.round((1 - (game.price?.totalPrice?.discountPrice || 0) / (game.price?.totalPrice?.originalPrice || 29.99)) * 100),
                discountPercent: Math.round((1 - (game.price?.totalPrice?.discountPrice || 0) / (game.price?.totalPrice?.originalPrice || 29.99)) * 100),
                platform: 'epic',
                rating: 4.5,
                metacriticScore: 75,
                thumb: game.keyImages[0]?.url || '',
                storeUrl: `https://store.epicgames.com/en-US/p/${game.urlSlug}`,
                dealUrl: `https://store.epicgames.com/en-US/p/${game.urlSlug}`,
                releaseDate: 2020,
                expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                dealRating: 8.0,
                storeName: 'Epic Games',
                storeID: '27'
            }));
    } catch (error) {
        console.warn('Epic Games fetch error:', error);
        return [];
    }
}

// Fetch GOG discounted games
async function fetchGOGDeals() {
    try {
        // GOG API requires authentication - return empty for now
        // Can be implemented with proper GOG API integration later
        return [];
        
        // Filter for discounted games and transform to our format
        return data.products.slice(0, 20).map(game => ({
                id: game.id,
                title: game.title,
                price: game.price?.amount || 9.99,
                originalPrice: game.price?.baseAmount || 19.99,
                discount: Math.round((1 - (game.price?.amount || 9.99) / (game.price?.baseAmount || 19.99)) * 100),
                discountPercent: Math.round((1 - (game.price?.amount || 9.99) / (game.price?.baseAmount || 19.99)) * 100),
                platform: 'gog',
                rating: 4.5,
                metacriticScore: 75,
                thumb: `https:${game.coverHorizontal}`,
                storeUrl: `https://www.gog.com/en/game/${game.slug}`,
                dealUrl: `https://www.gog.com/en/game/${game.slug}`,
                releaseDate: 2020,
                expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                dealRating: 8.0,
                storeName: 'GOG',
                storeID: '7'
            }));
    } catch (error) {
        console.warn('GOG fetch error:', error);
        return [];
    }
}

// Helper to get store name from store ID
// Get store icon/logo
function getStoreIcon(storeName) {
    const icons = {
        'Steam': '<i class="fab fa-steam"></i>',
        'Epic Games': '<i class="fas fa-crown" style="color: #563acc;"></i>',
        'Epic Games (FREE)': '<i class="fas fa-crown" style="color: #563acc;"></i>',
        'GOG': '<i class="fas fa-store" style="color: #86328f;"></i>',
        'Amazon': '<i class="fab fa-amazon" style="color: #FF9900;"></i>',
        'Green Man Gaming': '<i class="fas fa-leaf" style="color: #00B300;"></i>',
        'Ubisoft': '<i class="fas fa-store" style="color: #000;"></i>',
        'PlayStation': '<i class="fab fa-playstation" style="color: #003087;"></i>',
        'Xbox': '<i class="fab fa-xbox" style="color: #107C10;"></i>',
        'steam': '<i class="fab fa-steam"></i>',
        'epic': '<i class="fas fa-crown" style="color: #563acc;"></i>'
    };
    return icons[storeName] || '<i class="fas fa-shopping-cart"></i>';
}

function getStoreName(storeID) {
    const stores = {
        '1': 'Steam',
        '2': 'Amazon',
        '3': 'Green Man Gaming',
        '4': 'GamersGate',
        '5': 'WinGameStore',
        '6': 'Fanatical',
        '7': 'GOG',
        '8': 'Voidu',
        '9': 'IndieGameStand',
        '10': 'Humble Bundle',
        '11': 'AllKeyShop',
        '12': 'MMOGA',
        '13': 'GameBillet',
        '14': 'IndieGala',
        '15': 'Gamesrocket',
        '16': 'Gamesplanet',
        '17': 'Nuuvem',
        '18': 'DreamGame',
        '19': 'TwitchPrime',
        '20': 'MacGameStore',
        '21': 'SteamRIP',
        '22': 'Kinguin',
        '23': 'Eneba',
        '24': 'Eneba',
        '25': 'Oculus',
        '26': 'Nintendo',
        '27': 'Epic Games',
        '28': 'Ubisoft',
        '29': 'PlayStation',
        '30': 'Xbox',
        '31': 'Direct2Drive',
        '32': 'GOG Galaxy'
    };
    // Convert to string in case it comes as a number
    const storeKey = String(storeID);
    return stores[storeKey] || 'Store';
}

// Calculate expiration date (simulated - typically 30 days from deal creation)
function calculateExpirationDate(dealID) {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expirationDate;
}

// Sample data as fallback
async function loadSampleDeals() {
    return [
        {
            id: 1,
            title: "Cyberpunk 2077",
            price: 29.99,
            originalPrice: 59.99,
            discount: 50,
            discountPercent: 50,
            platform: "steam",
            rating: 4.3,
            metacriticScore: 86,
            thumb: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
            storeUrl: "https://store.steampowered.com/app/1091500",
            dealUrl: "https://store.steampowered.com/app/1091500",
            releaseDate: 2020,
            expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            dealRating: 8.5,
            storeName: 'Steam',
            storeID: '1'
        },
        {
            id: 2,
            title: "Red Dead Redemption 2",
            price: 39.99,
            originalPrice: 59.99,
            discount: 33,
            discountPercent: 33,
            platform: "steam",
            rating: 4.8,
            metacriticScore: 97,
            thumb: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg",
            storeUrl: "https://store.steampowered.com/app/1174180",
            dealUrl: "https://store.steampowered.com/app/1174180",
            releaseDate: 2019,
            expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            dealRating: 7.8,
            storeName: 'Steam',
            storeID: '1'
        },
        {
            id: 3,
            title: "The Witcher 3: Wild Hunt",
            price: 9.99,
            originalPrice: 39.99,
            discount: 75,
            discountPercent: 75,
            platform: "steam",
            rating: 4.9,
            metacriticScore: 92,
            thumb: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
            storeUrl: "https://store.steampowered.com/app/292030",
            dealUrl: "https://store.steampowered.com/app/292030",
            releaseDate: 2015,
            expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            dealRating: 9.2,
            storeName: 'Steam',
            storeID: '1'
        },
        {
            id: 4,
            title: "Elden Ring",
            price: 39.99,
            originalPrice: 59.99,
            discount: 33,
            discountPercent: 33,
            platform: "steam",
            rating: 4.7,
            metacriticScore: 96,
            thumb: "https://cdn.cloudflare.steamstatic.com/steam/apps/1592860/header.jpg",
            storeUrl: "https://store.steampowered.com/app/1592860",
            dealUrl: "https://store.steampowered.com/app/1592860",
            releaseDate: 2022,
            expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            dealRating: 9.0,
            storeName: 'Steam',
            storeID: '1'
        },
        {
            id: 5,
            title: "Hades",
            price: 14.99,
            originalPrice: 24.99,
            discount: 40,
            discountPercent: 40,
            platform: "steam",
            rating: 4.8,
            metacriticScore: 86,
            thumb: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
            storeUrl: "https://store.steampowered.com/app/1145360",
            dealUrl: "https://store.steampowered.com/app/1145360",
            releaseDate: 2020,
            expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            dealRating: 9.0,
            storeName: 'Steam',
            storeID: '1'
        }
    ];
}

// Display deals in the list
function displayDeals(deals) {
    const dealsList = document.getElementById('dealsList');
    
    if (!deals || deals.length === 0) {
        dealsList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-search"></i>
                <p>No deals available at the moment</p>
                <p class="subtext">Please try again later</p>
            </div>
        `;
        return;
    }
    
    dealsList.innerHTML = deals.map(deal => {
        const daysUntilExpiration = Math.ceil((deal.expirationDate - new Date()) / (1000 * 60 * 60 * 24));
        const isExpiringsoon = daysUntilExpiration <= 3;
        
        return `
            <div class="deal-item" data-platform="${deal.platform}" 
                 data-storeid="${deal.storeID || ''}"
                 data-price="${deal.price}" data-discount="${deal.discountPercent}" 
                 data-rating="${deal.rating}" data-expiration="${daysUntilExpiration}">
                <div class="deal-header">
                    <h3 class="deal-title">${deal.title}</h3>
                    <span class="deal-discount ${isExpiringsoon ? 'expiring-soon' : ''}">-${deal.discountPercent}%</span>
                </div>
                
                <div class="deal-meta">
                    <div class="deal-platform ${deal.platform}" title="${deal.storeName}">
                        ${getStoreIcon(deal.storeName || deal.platform)}
                        ${deal.storeName || (deal.platform === 'steam' ? 'Steam' : 'Epic Games')}
                    </div>
                    
                    ${deal.metacriticScore ? `
                        <div class="deal-metacritic">
                            <i class="fas fa-star"></i>
                            ${deal.metacriticScore}/100
                        </div>
                    ` : ''}
                    
                    ${deal.releaseDate ? `
                        <div class="deal-release">
                            <i class="fas fa-calendar-alt"></i>
                            ${deal.releaseDate}
                        </div>
                    ` : ''}
                    
                    <div class="deal-expiration ${isExpiringsoon ? 'expiring-soon' : ''}">
                        <i class="fas fa-hourglass-end"></i>
                        Expires in ${daysUntilExpiration} days
                    </div>
                </div>
                
                <div class="deal-details">
                    <div class="deal-prices">
                        <span class="deal-price-current">$${deal.price.toFixed(2)}</span>
                        <span class="deal-price-original">$${deal.originalPrice.toFixed(2)}</span>
                        <div class="deal-savings">Save $${(deal.originalPrice - deal.price).toFixed(2)}</div>
                    </div>
                    
                    <div class="deal-actions">
                        <button class="deal-btn quick-add" onclick="quickAddToCalculator(${deal.price})" title="Add to calculator">
                            <i class="fas fa-plus-circle"></i>
                            Add
                        </button>
                        <a href="${deal.storeUrl}" target="_blank" class="deal-btn store" title="Go to store">
                            <i class="fas fa-shopping-cart"></i>
                            Store
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Sort deals based on selected option
function sortDeals(sortBy) {
    if (!currentDeals || currentDeals.length === 0) return;
    
    let sortedDeals = [...currentDeals];
    
    switch(sortBy) {
        case 'deal':
            // Sort by deal rating (best deals first)
            sortedDeals.sort((a, b) => (b.dealRating || 0) - (a.dealRating || 0));
            break;
        case 'discount':
            // Sort by discount percentage (highest first)
            sortedDeals.sort((a, b) => b.discountPercent - a.discountPercent);
            break;
        case 'price':
            // Sort by actual price (lowest first)
            sortedDeals.sort((a, b) => a.price - b.price);
            break;
        case 'rating':
            // Sort by game rating (highest first)
            sortedDeals.sort((a, b) => b.rating - a.rating);
            break;
        case 'expiring':
            // Sort by expiration date (expiring soon first)
            sortedDeals.sort((a, b) => {
                const daysA = Math.ceil((a.expirationDate - new Date()) / (1000 * 60 * 60 * 24));
                const daysB = Math.ceil((b.expirationDate - new Date()) / (1000 * 60 * 60 * 24));
                return daysA - daysB;
            });
            break;
        default:
            return;
    }
    
    // Update display with sorted deals
    displayDeals(sortedDeals);
}

// Filter deals by platform
function filterDeals(platform) {
    const allDeals = document.querySelectorAll('.deal-item');
    
    const storeIDMap = {
        'steam': '1',
        'epic': '27'
    };
    
    const storeID = storeIDMap[platform];
    
    console.log('Filtering deals by platform:', platform, 'storeID:', storeID, 'total deals:', allDeals.length);
    
    let visibleCount = 0;
    allDeals.forEach(deal => {
        if (platform === 'all') {
            deal.style.display = 'block';
            visibleCount++;
        } else {
            // Filter by storeID for specific stores (Steam: 1, Epic: 27)
            if (deal.dataset.storeid === storeID) {
                deal.style.display = 'block';
                visibleCount++;
            } else {
                deal.style.display = 'none';
            }
        }
    });
    
    console.log('Filter result: showing', visibleCount, 'deals');
}

// Refresh deals
function refreshDeals() {
    if (dealsLoading) {
        showNotification("Already loading deals...", "warning");
        return;
    }
    // Force refresh by bypassing cache
    loadDeals(true);
}

// Quick add deal price to calculator
function quickAddToCalculator(price) {
    // Find first empty game input
    const inputs = document.querySelectorAll("#gameInputs input");
    for (const input of inputs) {
        if (!input.value || input.value === '0' || input.value === '0.00') {
            input.value = price.toFixed(2);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.style.borderColor = "var(--success)";
            input.style.boxShadow = "0 0 0 2px rgba(46, 204, 113, 0.1)";
            
            // Focus the next input
            const nextIndex = parseInt(input.dataset.index) + 1;
            const nextInput = document.getElementById(`gamePrice${nextIndex}`);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
            
            showNotification(`Added $${price.toFixed(2)} to calculator!`, "success");
            return;
        }
    }
    
    // If no empty inputs, add a new game
    const gameCountInput = document.getElementById('gameCount');
    const currentCount = parseInt(gameCountInput.value) || 1;
    if (currentCount < 50) {
        gameCountInput.value = currentCount + 1;
        updateGameFields();
        
        // Wait for new input to be created
        setTimeout(() => {
            const newInput = document.querySelector(`#gameInputs input[data-index="${currentCount}"]`);
            if (newInput) {
                newInput.value = price.toFixed(2);
                newInput.dispatchEvent(new Event('input', { bubbles: true }));
                newInput.style.borderColor = "var(--success)";
                newInput.style.boxShadow = "0 0 0 2px rgba(46, 204, 113, 0.1)";
                showNotification(`Added $${price.toFixed(2)} to calculator!`, "success");
            }
        }, 100);
    } else {
        showNotification("Maximum 50 games reached!", "warning");
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'calculator') {
        document.getElementById('calculatorTab').style.display = 'block';
    } else if (tabName === 'deals') {
        document.getElementById('dealsTab').style.display = 'block';
    } else if (tabName === 'search') {
        document.getElementById('searchTab').style.display = 'block';
    } else if (tabName === 'history') {
        document.getElementById('historyTab').style.display = 'block';
    }
    
    // Set active button
    event.target.classList.add('active');
}

// Open Steam game by fetching URL
function openSteamGame(gameName) {
    // Open Steam search directly (no CORS issues)
    if (gameName && gameName.trim()) {
        window.open(
            `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`,
            '_blank'
        );
    }
}