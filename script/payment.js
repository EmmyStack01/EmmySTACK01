let currentType = 'coffee'; 
const paystackPop = new PaystackPop();

// 1. INITIALIZE APPLE PAY (Runs on page load)
paystackPop.paymentRequest({
    key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', 
    container: 'paystack-apple-pay', 
    // We'll handle the green button manually to avoid the "Promise" error
    
    email: () => document.getElementById("email-address").value || "customer@emmystack01.com",
    amount: () => {
        const amt = document.getElementById("amount").value;
        return amt ? amt * 100 : 500000; // Default to 5k if empty
    },
    metadata: () => {
        return {
            custom_fields: [{
                display_name: "Payment Type",
                variable_name: "payment_type",
                value: currentType
            }]
        };
    },
    onSuccess(response) {
        window.location.href = "success.html?ref=" + response.reference;
    }
});

// 2. MANUAL GREEN BUTTON TRIGGER (The Fix for the "Nothing Happens" bug)
function processManualPayment(e) {
    if (e) e.preventDefault();

    const email = document.getElementById("email-address").value;
    const amount = document.getElementById("amount").value;

    if (!email || !amount) {
        alert("Please enter your email and amount first.");
        return;
    }

    paystackPop.newTransaction({
        key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5',
        email: email,
        amount: amount * 100,
        metadata: {
            custom_fields: [{
                display_name: "Payment Type",
                variable_name: "payment_type",
                value: currentType
            }]
        },
        onSuccess: (transaction) => {
            window.location.href = "success.html?ref=" + transaction.reference;
        }
    });
}

// Attach the manual trigger to your green button
document.getElementById('paystack-other-channels').onclick = processManualPayment;

// 3. UI SELECTION LOGIC
function setType(type, event) {
    currentType = type;
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    const clickedBtn = event.currentTarget || event.target.closest('.type-btn');
    if(clickedBtn) clickedBtn.classList.add('active');
    
    const amountInput = document.getElementById('amount');
    if(type === 'coffee') {
        amountInput.value = 5000; 
        amountInput.placeholder = "Support with any amount";
    } else {
        amountInput.value = "";
        amountInput.placeholder = "Enter project fee";
    }
}
