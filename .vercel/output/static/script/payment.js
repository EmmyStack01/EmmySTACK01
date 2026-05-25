/**
 * Emmy STACK01 - Secure Payment Logic
 * Handles dynamic currency conversion (USD to NGN) and Paystack initialization.
 */

// 1. GLOBAL INITIALIZATION
let currentType = 'coffee';
let exchangeRate = 1550; // 2026 Fallback
let paystackPop;
const PUBLIC_KEY = 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5';

// 2. FETCH LIVE EXCHANGE RATE
async function initExchangeRate() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data && data.rates.NGN) {
            exchangeRate = data.rates.NGN;
            console.log("⚡ Exchange Rate Synced:", exchangeRate);
        }
    } catch (err) {
        console.warn("⚠️ Forex fetch failed, using fallback rate.");
    }
}

// 3. UI TOGGLE LOGIC
function setType(type, event) {
    currentType = type;
    
    // Update active button state
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = event.currentTarget || event.target.closest('.type-btn');
    if (clickedBtn) clickedBtn.classList.add('active');

    const amountInput = document.getElementById('amount');
    
    // Set default values based on type
    if (type === 'coffee') {
        amountInput.value = 5;
        amountInput.placeholder = "Support with any amount";
    } else {
        amountInput.value = 60;
        amountInput.placeholder = "Enter Invoice Total (USD)";
    }
}

// 4. PAYSTACK INITIALIZATION
function setupPaystackUI() {
    if (typeof PaystackPop === 'undefined') {
        console.error("❌ Paystack SDK not loaded. Check script order or COEP headers.");
        return;
    }

    paystackPop = new PaystackPop();

    // Initialize Apple Pay (Only shows on supported Safari devices)
    paystackPop.paymentRequest({
        key: PUBLIC_KEY,
        container: 'paystack-apple-pay',
        email: () => document.getElementById("email-address").value || "customer@emmystack01.com",
        amount: () => {
            const usd = document.getElementById("amount").value || 5;
            return Math.round(usd * exchangeRate * 100); // Convert to Kobo
        },
        onSuccess(res) {
            window.location.href = `success.html?ref=${res.reference}`;
        }
    });
}

// 5. MANUAL TRANSACTION TRIGGER
async function processPayment(e) {
    if (e) e.preventDefault();

    const email = document.getElementById("email-address").value;
    const usdAmount = document.getElementById("amount").value;

    if (!email || !usdAmount) {
        alert("Please enter both your email and the payment amount.");
        return;
    }

    if (!paystackPop) {
        alert("Payment gateway is still initializing. Please wait a second.");
        return;
    }

    // Convert USD to NGN Kobo
    const finalAmountKobo = Math.round(usdAmount * exchangeRate * 100);

    paystackPop.newTransaction({
        key: PUBLIC_KEY,
        email: email,
        amount: finalAmountKobo,
        metadata: {
            custom_fields: [
                { display_name: "Payment Type", variable_name: "type", value: currentType },
                { display_name: "USD Amount", variable_name: "usd_val", value: usdAmount },
                { display_name: "Rate Used", variable_name: "rate", value: exchangeRate }
            ]
        },
        onSuccess: (transaction) => {
            window.location.href = `/success.html?ref=${transaction.reference}`;
        },
        onCancel: () => {
            console.log("Transaction cancelled.");
        }
    });
}

// 6. STARTUP SEQUENCE
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Get the latest rates
    await initExchangeRate();

    // 2. Wait for SDK and Setup UI
    // We add a small delay to ensure inline.js is fully parsed if COEP is being tricky
    setTimeout(() => {
        setupPaystackUI();
    }, 500);

    // 3. Attach click listener to the manual button
    const mainPayBtn = document.getElementById('paystack-other-channels');
    if (mainPayBtn) {
        mainPayBtn.onclick = processPayment;
    }
});