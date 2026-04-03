let currentType = 'coffee'; 
const paystackPop = new PaystackPop(); // This will now work with v2

paystackPop.paymentRequest({
    key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', 
    container: 'paystack-apple-pay',
    loadPaystackCheckoutButton: 'paystack-other-channels', 
    
    // Use functions to get real-time values when the user clicks
    email: () => document.getElementById("email-address").value,
    amount: () => {
        const amt = document.getElementById("amount").value;
        return amt ? amt * 100 : 0; 
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
    },
    onCancel() {
        console.log('User closed the window.');
    }
});

// 2. UI SELECTION LOGIC (Keep this as is)
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
