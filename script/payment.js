let currentType = 'coffee';
let userCurrency = 'NGN';
let exchangeRate = 1; // Default 1:1
const paystackPop = new PaystackPop();

/**
 * 1. GLOBAL INITIALIZATION
 * Detects location and fetches live exchange rates on page load
 */
async function initForex() {
    try {
        // Detect Location
        const locRes = await fetch('https://ipapi.co/json/');
        const locData = await locRes.json();
        
        // Check if outside Nigeria
        if (locData.country_code !== 'NG') {
            userCurrency = 'USD';
            
            // Update UI Labels
            const label = document.querySelector('label[for="amount"]');
            if (label) label.innerText = "Amount (USD)";
            
            const amountInput = document.getElementById('amount');
            amountInput.placeholder = "Enter amount in USD";
            if (currentType === 'coffee') amountInput.value = "5"; // $5 instead of 5000 NGN
            
            // Fetch Exchange Rate
            const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
            const rateData = await rateRes.json();
            exchangeRate = rateData.rates.NGN;
            console.log(`Forex Active: 1 USD = ${exchangeRate} NGN`);
        }
    } catch (err) {
        console.error("Forex/Location init failed, defaulting to NGN.");
    }
}

initForex(); // Run immediately

/**
 * 2. INITIALIZE APPLE PAY (v2)
 */
paystackPop.paymentRequest({
    key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', 
    container: 'paystack-apple-pay', 
    email: () => document.getElementById("email-address").value || "customer@emmystack01.com",
    amount: () => {
        const amt = document.getElementById("amount").value;
        // If USD, convert to NGN Kobo; if NGN, just convert to Kobo
        const multiplier = userCurrency === 'USD' ? (exchangeRate * 100) : 100;
        return amt ? Math.round(amt * multiplier) : 500000;
    },
    metadata: () => {
        return {
            custom_fields: [
                { display_name: "Payment Type", variable_name: "payment_type", value: currentType },
                { display_name: "User Currency", variable_name: "user_currency", value: userCurrency }
            ]
        };
    },
    onSuccess(response) {
        window.location.href = "success.html?ref=" + response.reference;
    }
});

/**
 * 3. MANUAL GREEN BUTTON TRIGGER
 */
async function processManualPayment(e) {
    if (e) e.preventDefault();

    const email = document.getElementById("email-address").value;
    const inputAmount = document.getElementById("amount").value;

    if (!email || !inputAmount) {
        alert("Please enter your email and amount first.");
        return;
    }

    // Calculate final amount in Kobo
    // If USD: ($Amount * Rate * 100). If NGN: (Amount * 100)
    const finalNairaAmount = userCurrency === 'USD' 
        ? Math.round(inputAmount * exchangeRate) 
        : inputAmount;

    paystackPop.newTransaction({
        key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5',
        email: email,
        amount: finalNairaAmount * 100, // Convert to Kobo
        metadata: {
            custom_fields: [
                { display_name: "Payment Type", variable_name: "payment_type", value: currentType },
                { display_name: "Original Currency", variable_name: "original_currency", value: userCurrency },
                { display_name: "Rate Used", variable_name: "exchange_rate", value: exchangeRate }
            ]
        },
        onSuccess: (transaction) => {
            window.location.href = "success.html?ref=" + transaction.reference;
        }
    });
}

document.getElementById('paystack-other-channels').onclick = processManualPayment;

/**
 * 4. UI SELECTION LOGIC
 */
function setType(type, event) {
    currentType = type;
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    const clickedBtn = event.currentTarget || event.target.closest('.type-btn');
    if(clickedBtn) clickedBtn.classList.add('active');
    
    const amountInput = document.getElementById('amount');
    if(type === 'coffee') {
        // Dynamic default based on currency
        amountInput.value = userCurrency === 'USD' ? 5 : 5000; 
        amountInput.placeholder = "Support with any amount";
    } else {
        amountInput.value = "";
        amountInput.placeholder = userCurrency === 'USD' ? "Enter project fee ($)" : "Enter project fee (₦)";
    }
                 }
                
