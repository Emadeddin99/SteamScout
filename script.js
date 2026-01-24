let calculationHistory = JSON.parse(localStorage.getItem('steamCalculatorHistory')) || [];

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    updateGameFields();
    loadHistory();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Tax rate synchronization between slider and input
    const taxRateInput = document.getElementById('taxRate');
    const taxRateSlider = document.getElementById('taxRateSlider');
    
    taxRateInput.addEventListener('input', function() {
        taxRateSlider.value = this.value;
        calculateTotal();
    });
    
    taxRateSlider.addEventListener('input', function() {
        taxRateInput.value = this.value;
        calculateTotal();
    });
    
    // Tax preset buttons
    document.querySelectorAll('.tax-preset').forEach(button => {
        button.addEventListener('click', function() {
            const taxRate = parseFloat(this.dataset.tax);
            taxRateInput.value = taxRate;
            taxRateSlider.value = taxRate;
            
            // Update active state
            document.querySelectorAll('.tax-preset').forEach(btn => 
                btn.classList.remove('active'));
            this.classList.add('active');
            
            calculateTotal();
        });
    });
    
    // Auto-calculate when tax changes
    taxRateInput.addEventListener('change', calculateTotal);
    
    // Auto-calculate when game prices change
    document.addEventListener('input', function(e) {
        if (e.target.matches('#gameInputs input')) {
            toggleCalculateButton();
            updatePricedGamesCount();
        }
    });
}

function changeGameCount(delta) {
    const gameCountInput = document.getElementById('gameCount');
    let currentValue = parseInt(gameCountInput.value);
    const newValue = Math.max(1, Math.min(20, currentValue + delta));
    gameCountInput.value = newValue;
    updateGameFields();
}

function updateGameFields() {
    const count = parseInt(document.getElementById("gameCount").value);
    const container = document.getElementById("gameInputs");
    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const gameDiv = document.createElement("div");
        gameDiv.className = "game-input";
        
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.min = "0";
        input.value = "0.00";
        input.placeholder = "Game " + (i + 1);
        input.title = "Enter price for game " + (i + 1);
        
        gameDiv.appendChild(input);
        container.appendChild(gameDiv);
    }

    toggleCalculateButton();
    updatePricedGamesCount();
}

function updatePricedGamesCount() {
    const inputs = document.querySelectorAll("#gameInputs input");
    let pricedCount = 0;
    
    inputs.forEach(input => {
        if (parseFloat(input.value) > 0) {
            pricedCount++;
        }
    });
    
    document.getElementById("pricedGamesCount").textContent = 
        `${pricedCount} game${pricedCount !== 1 ? 's' : ''} with price`;
}

function toggleCalculateButton() {
    const inputs = document.querySelectorAll("#gameInputs input");
    const calculateBtn = document.getElementById("calculateBtn");

    const hasPrice = Array.from(inputs).some(
        input => parseFloat(input.value) > 0
    );

    calculateBtn.disabled = !hasPrice;
}

function calculateTotal() {
    const taxRate = parseFloat(document.getElementById("taxRate").value) / 100;
    const inputs = document.querySelectorAll("#gameInputs input");

    let subtotal = 0;
    let count = 0;
    let gamePrices = [];

    inputs.forEach(input => {
        const price = parseFloat(input.value) || 0;
        if (price > 0) {
            subtotal += price;
            count++;
            gamePrices.push(price.toFixed(2));
        }
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Update display
    document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("tax").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("total").textContent = `$${total.toFixed(2)}`;
    document.getElementById("itemCount").textContent = `${count} game${count !== 1 ? 's' : ''}`;
    document.getElementById("taxLabel").innerHTML = `<span>Tax (${(taxRate * 100).toFixed(2)}%)</span>`;
    
    // Store current calculation for history
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

function saveToHistory() {
    if (!currentCalculation) {
        alert("Please calculate a total first!");
        return;
    }
    
    const historyItem = {
        ...currentCalculation,
        id: Date.now().toString(),
        date: new Date().toLocaleString()
    };
    
    calculationHistory.unshift(historyItem);
    
    // Keep only last 20 calculations
    if (calculationHistory.length > 20) {
        calculationHistory = calculationHistory.slice(0, 20);
    }
    
    localStorage.setItem('steamCalculatorHistory', JSON.stringify(calculationHistory));
    loadHistory();
    
    // Show success feedback
    const saveBtn = document.querySelector('[onclick="saveToHistory()"]');
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    saveBtn.style.background = 'var(--success)';
    
    setTimeout(() => {
        saveBtn.innerHTML = originalHTML;
        saveBtn.style.background = '';
    }, 1500);
}

function loadHistory() {
    const historyList = document.getElementById("historyList");
    const historyCount = document.getElementById("historyCount");
    
    historyCount.textContent = `${calculationHistory.length} calculation${calculationHistory.length !== 1 ? 's' : ''}`;
    
    if (calculationHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clock"></i>
                <p>No calculations yet</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = calculationHistory.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-header">
                <div class="history-date">
                    <i class="fas fa-calendar"></i> ${item.date}
                </div>
                <button class="history-delete" onclick="deleteHistoryItem('${item.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="history-total">$${item.total.toFixed(2)}</div>
            <div class="history-details">
                <div><i class="fas fa-shopping-cart"></i> ${item.count} games</div>
                <div><i class="fas fa-percentage"></i> ${item.taxRate.toFixed(2)}% tax</div>
                <div><i class="fas fa-list"></i> $${item.subtotal.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

function deleteHistoryItem(id) {
    calculationHistory = calculationHistory.filter(item => item.id !== id);
    localStorage.setItem('steamCalculatorHistory', JSON.stringify(calculationHistory));
    loadHistory();
}

function clearHistory() {
    if (calculationHistory.length === 0) return;
    
    if (confirm("Are you sure you want to clear all history?")) {
        calculationHistory = [];
        localStorage.removeItem('steamCalculatorHistory');
        loadHistory();
    }
}

function clearAllPrices() {
    const inputs = document.querySelectorAll("#gameInputs input");
    inputs.forEach(input => input.value = "0.00");
    toggleCalculateButton();
    updatePricedGamesCount();
    calculateTotal();
}

function resetCalculator() {
    document.getElementById("taxRate").value = "8";
    document.getElementById("taxRateSlider").value = "8";
    document.getElementById("gameCount").value = "1";
    
    // Update tax preset active state
    document.querySelectorAll('.tax-preset').forEach(btn => 
        btn.classList.remove('active'));
    document.querySelector('.tax-preset[data-tax="8"]').classList.add('active');
    
    clearAllPrices();
    updateGameFields();
}

function copyToClipboard() {
    const total = document.getElementById("total").textContent;
    const items = document.getElementById("itemCount").textContent;
    const tax = document.getElementById("taxLabel").textContent + ": " + document.getElementById("tax").textContent;
    
    const textToCopy = `Steam Calculator Result:
${items}
Subtotal: ${document.getElementById("subtotal").textContent}
${tax}
Total: ${total}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtn = document.querySelector('[onclick="copyToClipboard()"]');
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = '';
        }, 1500);
    });
}

// Initialize with first tax preset active
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.tax-preset[data-tax="8"]').classList.add('active');
});