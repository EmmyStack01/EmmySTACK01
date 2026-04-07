let currentType = 'coffee';
let userCurrency = 'NGN';
let exchangeRate = 1; 
const paystackPop = new PaystackPop();

// 1. FOREX & LOCATION (Detects if user is outside Nigeria)
async function initForex() {
    try {
        const locRes = await fetch('https://ipapi.co/json/');
        const locData = await locRes.json();
        
        if (locData.country_code !== 'NG') {
            userCurrency = 'USD';
            const label = document.querySelector('label[for="amount"]');
            if (label) label.innerText = "Amount (USD)";
            
            // Fetch live rate for the actual conversion to Naira
            const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
            const rateData = await rateRes.json();
            exchangeRate = rateData.rates.NGN;
        }
    } catch (err) {
        console.error("Forex init failed, staying with NGN.");
    }
}
initForex();

// 2. APPLE PAY & INITIALIZATION
paystackPop.paymentRequest({
    key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', 
    container: 'paystack-apple-pay', 
    email: () => document.getElementById("email-address").value || "customer@emmystack01.com",
    amount: () => {
        const amt = document.getElementById("amount").value;
        const multiplier = userCurrency === 'USD' ? (exchangeRate * 100) : 100;
        return amt ? Math.round(amt * multiplier) : 500000;
    },
    onSuccess(response) {
        window.location.href = "success.html?ref=" + response.reference;
    }
});

// 3. MANUAL TRIGGER (For Invoiced Amounts)
async function processManualPayment(e) {
    if (e) e.preventDefault();
    const email = document.getElementById("email-address").value;
    const inputAmount = document.getElementById("amount").value;

    if (!email || !inputAmount) {
        alert("Please enter your email and the invoice amount.");
        return;
    }

    // Converts USD input to actual NGN for Paystack
    const finalNairaAmount = userCurrency === 'USD' 
        ? Math.round(inputAmount * exchangeRate) 
        : inputAmount;

    paystackPop.newTransaction({
        key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5',
        email: email,
        amount: finalNairaAmount * 100,
        metadata: {
            custom_fields: [
                { display_name: "Type", variable_name: "type", value: currentType },
                { display_name: "Currency", variable_name: "currency", value: userCurrency },
                { display_name: "Rate", variable_name: "rate", value: exchangeRate }
            ]
        },
        onSuccess: (transaction) => {
            window.location.href = "success.html?ref=" + transaction.reference;
        }
    });
}
document.getElementById('paystack-other-channels').onclick = processManualPayment;

// 4. UI LOGIC (Updated for your Branding + Per-Page Rates)
function setType(type, event) {
    currentType = type;
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    const clickedBtn = event.currentTarget || event.target.closest('.type-btn');
    if(clickedBtn) clickedBtn.classList.add('active');
    
    const amountInput = document.getElementById('amount');

    if (type === 'coffee') {
        amountInput.value = (userCurrency === 'USD') ? 5 : 5000;
        amountInput.placeholder = "Support with any amount";
    } else {
        // Pre-fill with the base "Digital Business Card" rate
        amountInput.value = (userCurrency === 'USD') ? 60 : 60000;
        
        // Use the placeholder to remind them of your custom rates from the invoice
        if (userCurrency === 'USD') {
            amountInput.placeholder = "Enter Invoice Total (Branding $50 | UI/UX $25/pg | Dev $60/pg)";
        } else {
            amountInput.placeholder = "Enter Invoice Total (Branding ₦30k | UI/UX ₦20k/pg | Dev ₦40k/pg)";
        }
    }
}
    
